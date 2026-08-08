import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchFreshPreviewUrl } from '../services/deezerService';

export let globalAnalyser: AnalyserNode | null = null;

const PREVIEW_UNAVAILABLE_MSG = 'Prévia indisponível para esta faixa';

/** Mostra o toast de feedback já existente no PlayerBar e o limpa sozinho
 * (o store não expira essa mensagem automaticamente). */
function showTransientFeedback(msg: string, durationMs = 3000) {
  usePlayerStore.getState().setFeedbackMessage(msg);
  setTimeout(() => {
    if (usePlayerStore.getState().feedbackMessage === msg) {
      usePlayerStore.getState().setFeedbackMessage(null);
    }
  }, durationMs);
}

/** Tenta reproduzir o áudio sem nunca deixar uma Promise rejeitada escapar
 * (ex: NotAllowedError da política de autoplay). Em caso de falha, reverte
 * `isPlaying` para refletir a realidade (o áudio não está de fato tocando). */
async function safePlay(audio: HTMLAudioElement) {
  try {
    await audio.play();
  } catch (err) {
    console.warn('Reprodução bloqueada ou falhou:', err);
    usePlayerStore.setState({ isPlaying: false });
  }
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const history = usePlayerStore((state) => state.history);
  /** Evita retry infinito: só tentamos renovar o link de prévia expirado
   * uma vez por faixa selecionada. */
  const retriedTrackIdRef = useRef<string | null>(null);

  // Renova URLs de histórico expiradas na primeira montagem
  useEffect(() => {
    const renewHistoryUrls = async () => {
      const state = usePlayerStore.getState();
      let updated = false;
      const renewedHistory = await Promise.all(
        state.history.map(async (track) => {
          if (!track.audioUrl || track.audioUrl.includes('403') || track.audioUrl.trim() === '') {
            const freshUrl = await fetchFreshPreviewUrl(track.id);
            if (freshUrl) {
              updated = true;
              return { ...track, audioUrl: freshUrl };
            }
          }
          return track;
        })
      );
      if (updated) {
        usePlayerStore.setState({ history: renewedHistory });
      }
    };
    renewHistoryUrls();
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64; // 32 barras de frequência

          const source = audioCtx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);

          globalAnalyser = analyser;

          const resumeAudio = () => {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {
                // Retomada do AudioContext é apenas para o visualizador;
                // falhar aqui não deve afetar a reprodução do áudio.
              });
            }
          };
          audio.addEventListener('play', resumeAudio);
        }
      } catch (err) {
        console.error('Web Audio API não suportada ou erro ao inicializar:', err);
      }
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      usePlayerStore.getState().setDuration(audio.duration);
    };
    const handleEnded = () => {
      usePlayerStore.getState().nextTrack();
    };
    /** Falha de carregamento real (404, CORS, URL de prévia expirada, etc.) —
     * evita deixar a UI "travada" em estado de play sem áudio nenhum.
     *
     * Links de prévia do Deezer expiram (token `hdnea` de validade curta).
     * Faixas restauradas do histórico (persistido em localStorage) costumam
     * chegar aqui com o link já vencido (Deezer responde 403 → o elemento
     * de áudio fica sem fonte suportada). Nesse caso, buscamos um link novo
     * pelo ID da faixa e tentamos tocar de novo uma única vez antes de
     * desistir — só então mostramos o toast de "prévia indisponível".
     */
    const handleError = async () => {
      const track = usePlayerStore.getState().currentTrack;
      console.warn(`Falha ao carregar áudio da faixa "${track?.title ?? 'desconhecida'}"`, audio.error);

      const alreadyRetried = retriedTrackIdRef.current === track?.id;

      // Tenta renovar o link para qualquer faixa (não apenas Deezer) na primeira falha
      if (track && !alreadyRetried) {
        retriedTrackIdRef.current = track.id;
        try {
          const freshUrl = await fetchFreshPreviewUrl(track.id);
          const stillCurrent = usePlayerStore.getState().currentTrack?.id === track.id;
          
          if (!freshUrl || !stillCurrent) {
            usePlayerStore.setState({ isPlaying: false });
            showTransientFeedback(PREVIEW_UNAVAILABLE_MSG);
            return;
          }
          
          usePlayerStore.setState((state) => ({
            currentTrack: state.currentTrack ? { ...state.currentTrack, audioUrl: freshUrl } : state.currentTrack,
          }));
          audio.src = freshUrl;
          audio.load();
          await safePlay(audio);
          return;
        } catch (err) {
          console.warn('Falha ao renovar prévia:', err);
        }
      }

      usePlayerStore.setState({ isPlaying: false });
      showTransientFeedback(PREVIEW_UNAVAILABLE_MSG);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const trackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      if (!currentTrack.audioUrl || currentTrack.audioUrl.trim() === '') {
        console.warn(`Track "${currentTrack.title}" has no valid audio URL`);
        usePlayerStore.setState({ isPlaying: false });
        showTransientFeedback(PREVIEW_UNAVAILABLE_MSG);
        return;
      }

      if (trackIdRef.current !== currentTrack.id) {
        audio.src = currentTrack.audioUrl;
        trackIdRef.current = currentTrack.id;
        audio.load();

        if (isPlaying) {
          safePlay(audio);
        }
      } else {
        if (isPlaying) {
          safePlay(audio);
        } else {
          audio.pause();
        }
      }
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Trava o alvo entre 0 e a duração real do áudio carregado — a letra
    // pode sugerir um tempo fora desse intervalo (ex: prévia mais curta que
    // os 30s assumidos), e um seek além do fim é ignorado ou trava o áudio.
    const maxTime = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : time;
    const clampedTime = Math.min(Math.max(time, 0), maxTime);

    audio.currentTime = clampedTime;
    usePlayerStore.getState().setCurrentTime(clampedTime);
  };

  return { seek };
}
