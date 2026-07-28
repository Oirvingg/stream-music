import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export let globalAnalyser: AnalyserNode | null = null;

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);

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
              audioCtx.resume();
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

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const trackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      if (!currentTrack.audioUrl || currentTrack.audioUrl.trim() === '') {
        console.warn(`Track "${currentTrack.title}" has no valid audio URL`);
        return;
      }
      
      if (trackIdRef.current !== currentTrack.id) {
        audio.src = currentTrack.audioUrl;
        trackIdRef.current = currentTrack.id;
        audio.load();
        
        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
             playPromise.catch(console.error);
          }
        }
      } else {
        if (isPlaying) {
          audio.play().catch(console.error);
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
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      usePlayerStore.getState().setCurrentTime(time);
    }
  };

  return { seek };
}
