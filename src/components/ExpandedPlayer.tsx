import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, ThumbsUp, ThumbsDown, Music2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchLyrics } from '../services/lyricsService';
import { DraggableTrackRow } from './DraggableTrackRow';
import { AudioVisualizer } from './AudioVisualizer';
import { getArtistName, getArtistId } from '../types/music';
import { goToArtist } from '../utils/navigation';

interface LyricLine {
  time: number;
  text: string;
}

/**
 * Peso mínimo (em "chars" equivalentes) de qualquer linha, mesmo as curtas.
 * Valor alto o suficiente para que nenhuma linha fique ativa por menos de
 * ~1s em uma prévia de 30s — evita que o destaque troque rápido demais.
 */
const MIN_LINE_WEIGHT = 16;

/**
 * Distribui os tempos proporcionalmente ao peso de cada linha.
 * Linhas maiores (refrões) ficam ativas mais tempo; linhas curtas passam rápido.
 */
function buildTimedLyrics(rawLyrics: string, durationSecs = 30): LyricLine[] {
  const lines = rawLyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  const weights = lines.map(l => Math.max(l.length, MIN_LINE_WEIGHT));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  let cursor = 0;
  return lines.map((text, i) => {
    const time = parseFloat(cursor.toFixed(2));
    cursor += (weights[i] / totalWeight) * durationSecs;
    return { time, text };
  });
}

const INSTRUMENTAL_PHRASES = [
  'instrumental',
  'indisponível',
  'unavailable',
  'lyrics not found',
];

function isInstrumental(text: string) {
  const lower = text.toLowerCase();
  return INSTRUMENTAL_PHRASES.some(p => lower.includes(p));
}

/**
 * Dicionário estático com timestamps hand-calibrados para faixas de portfólio.
 * Garante sincronização perfeita independente do retorno da API de letras.
 * Chave: título em lowercase. Os tempos refletem a prévia de 30s do Deezer.
 */
const STATIC_LYRICS_MAP: Record<string, LyricLine[]> = {
  'shake it off': [
    { time: 0.0,  text: "I stay out too late" },
    { time: 2.4,  text: "Got nothing in my brain" },
    { time: 4.8,  text: "That's what people say, mm-mm" },
    { time: 7.0,  text: "That's what people say, mm-mm" },
    { time: 9.2,  text: "I go on too many dates" },
    { time: 11.6, text: "But I can't make 'em stay" },
    { time: 13.8, text: "At least that's what people say, mm-mm" },
    { time: 16.2, text: "That's what people say, mm-mm" },
    { time: 18.2, text: "But I keep cruising" },
    { time: 19.8, text: "Can't stop, won't stop moving" },
    { time: 21.5, text: "It's like I got this music" },
    { time: 23.0, text: "In my mind, saying it's gonna be alright" },
    { time: 25.2, text: "'Cause the players gonna play, play, play, play, play" },
    { time: 27.0, text: "And the haters gonna hate, hate, hate, hate, hate" },
    { time: 28.6, text: "Baby, I'm just gonna shake, shake, shake, shake, shake" },
  ],
};

interface ExpandedPlayerProps {
  seek: (time: number) => void;
}

export function ExpandedPlayer({ seek }: ExpandedPlayerProps) {
  const { 
    isExpanded, toggleExpand, currentTrack, isPlaying, togglePlay, 
    volume, setVolume, currentTime, duration, nextTrack, prevTrack,
    queue, expandedTab, setExpandedTab 
  } = usePlayerStore();

  const [rawLyrics, setRawLyrics] = useState<string>('');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentTrack) {
      setRawLyrics('');
      return;
    }

    const artist = getArtistName(currentTrack.artist);
    const title = currentTrack.title;

    let isMounted = true;
    setIsLoadingLyrics(true);
    setRawLyrics('');

    fetchLyrics(artist, title)
      .then((res) => {
        if (isMounted) {
          setRawLyrics(res);
          setIsLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRawLyrics('Letra instrumental ou indisponível para esta faixa no momento.');
          setIsLoadingLyrics(false);
        }
      });

    return () => { isMounted = false; };
  }, [currentTrack]);

  // 1. Verifica dicionário estático; 2. Fallback: distribuição proporcional por chars
  const timedLyrics = useMemo<LyricLine[]>(() => {
    if (!currentTrack) return [];

    const titleKey = currentTrack.title.toLowerCase().trim();
    if (STATIC_LYRICS_MAP[titleKey]) {
      return STATIC_LYRICS_MAP[titleKey];
    }

    if (!rawLyrics || isInstrumental(rawLyrics)) return [];
    const dur = duration > 5 ? duration : 30;
    return buildTimedLyrics(rawLyrics, dur);
  }, [rawLyrics, duration, currentTrack]);

  // Índice da linha ativa com base no currentTime
  const activeIndex = useMemo(() => {
    if (!timedLyrics.length) return -1;
    let idx = 0;
    for (let i = 0; i < timedLyrics.length; i++) {
      if (currentTime >= timedLyrics[i].time) idx = i;
    }
    return idx;
  }, [currentTime, timedLyrics]);

  // Auto-scroll suave com amortecimento (debounce de 450ms) — evita saltos
  // bruscos entre linhas e dá um leve atraso antes de centralizar a nova linha.
  useEffect(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      if (activeLineRef.current) {
        activeLineRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 450);
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [activeIndex]);



  const formatTime = (sec: number) => {
    if (sec === undefined || sec === null || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePrevTrack = () => {
    if (currentTime > 3) {
      seek(0);
    } else {
      prevTrack();
    }
  };

  const artistName = currentTrack ? getArtistName(currentTrack.artist) : '';
  const artistId = currentTrack ? getArtistId(currentTrack.artist) : null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#030303] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isExpanded ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Top Navbar */}
      <div className="flex items-center justify-between p-6 shrink-0">
        <button 
          onClick={toggleExpand}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden px-8 pb-4">
        
        {/* Left Column: Artwork & Info */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-w-0">
          {currentTrack && (
            <div className="w-full max-w-[500px] flex flex-col gap-8 mt-auto mb-auto relative">
              <div className="relative w-full aspect-square">
                <img 
                  src={currentTrack.coverUrl} 
                  alt={currentTrack.title} 
                  className="w-full h-full object-cover rounded-xl shadow-2xl relative z-10"
                />
                
                {/* Visualizer posicionado no fundo / borda inferior da capa */}
                <div className="absolute -bottom-8 left-0 right-0 h-32 z-0 pointer-events-none scale-110 opacity-80">
                  <AudioVisualizer />
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-4 relative z-20">
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-3xl font-bold text-white truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-lg text-[#AAAAAA] truncate mt-1">
                    {artistId ? (
                      <span
                        onClick={() => goToArtist(artistId)}
                        className="hover:text-white hover:underline transition-colors cursor-pointer"
                      >
                        {artistName}
                      </span>
                    ) : (
                      artistName
                    )}{' '}
                    {currentTrack.album ? `• ${currentTrack.album}` : ''}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <button className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <ThumbsDown className="w-6 h-6" />
                  </button>
                  <button className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <ThumbsUp className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="w-[400px] lg:w-[500px] flex flex-col pt-8 shrink-0">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/10 pb-2 mb-4 shrink-0">
            {(['A SEGUIR', 'LETRA', 'RELACIONADOS'] as const).map((tab, idx) => {
              const mappedTab = idx === 0 ? 'QUEUE' : idx === 1 ? 'LYRICS' : 'RELATED';
              const isActive = expandedTab === mappedTab;
              return (
                <button
                  key={tab}
                  onClick={() => setExpandedTab(mappedTab)}
                  data-tour={mappedTab === 'LYRICS' ? 'lyrics-tab' : undefined}
                  className={`text-sm font-medium transition-colors relative pb-2 ${
                    isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <div className="absolute bottom-[-8px] left-0 right-0 h-[2px] bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-2 min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
            {expandedTab === 'QUEUE' && (
              <div className="flex flex-col gap-2">
                {queue.map((track, idx) => {
                  const isPlayingTrack = currentTrack?.id === track.id;
                  const trackArtist = getArtistName(track.artist);
                  const trackArtistId = getArtistId(track.artist);
                  return (
                    <DraggableTrackRow 
                      key={`${track.id}-${idx}`}
                      index={idx}
                      onReorder={usePlayerStore.getState().reorderQueue}
                      className={`flex items-center gap-4 p-2 rounded-md ${
                        isPlayingTrack ? 'bg-white/10' : 'hover:bg-white/5'
                      } group transition-colors cursor-pointer`}
                      onClick={() => {
                        usePlayerStore.getState().setTrack(track);
                      }}
                    >
                      <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isPlayingTrack ? 'text-white font-medium' : 'text-white/90'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {trackArtistId ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                goToArtist(trackArtistId);
                              }}
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {trackArtist}
                            </span>
                          ) : (
                            trackArtist
                          )}
                        </p>
                      </div>
                      {isPlayingTrack ? (
                        <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                          <div className="w-1 bg-white animate-[bounce_1s_infinite] h-full" />
                          <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-2/3" />
                          <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-4/5" />
                        </div>
                      ) : (
                        <span className="text-xs text-white/50 tabular-nums">
                          {formatTime(track.duration)}
                        </span>
                      )}
                    </DraggableTrackRow>
                  );
                })}
              </div>
            )}

            {expandedTab === 'LYRICS' && (
              <div
                ref={lyricsContainerRef}
                className="flex flex-col gap-1 py-12 px-2 min-h-full overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-0"
              >
                {isLoadingLyrics ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 pt-32">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white/90 rounded-full animate-spin" />
                    <p className="text-sm text-white/50">Buscando letras...</p>
                  </div>
                ) : timedLyrics.length === 0 ? (
                  /* Estado Instrumental / Letra indisponível */
                  <div className="flex flex-col items-center justify-center h-full gap-6 py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Music2 className="w-10 h-10 text-white/20" />
                    </div>
                    <div>
                      <p className="text-white/60 text-lg font-medium">Letra instrumental</p>
                      <p className="text-white/30 text-sm mt-1">Relaxe e curta a música 🎵</p>
                    </div>
                  </div>
                ) : (
                  /* Karaokê — linhas sincronizadas */
                  timedLyrics.map((line, idx) => {
                    const isActive = idx === activeIndex;
                    const isPast  = idx < activeIndex;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeLineRef : null}
                        className={`
                          px-4 py-3 rounded-xl text-left transition-all duration-[600ms] ease-in-out cursor-pointer select-none
                          ${isActive
                            ? 'text-white text-2xl font-bold leading-snug opacity-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : isPast
                              ? 'text-[#444444] text-xl font-medium leading-snug opacity-60'
                              : 'text-[#555555] text-xl font-medium leading-snug opacity-40'
                          }
                        `}
                        onClick={() => seek(line.time)}
                      >
                        {line.text}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {expandedTab === 'RELATED' && (
              <div className="flex items-center justify-center h-full text-white/50">
                Conteúdo relacionado em breve...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Player Footer */}
      <div className="shrink-0 px-8 py-8 flex flex-col gap-6">
        {/* Seekbar */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-yt-text-secondary font-medium tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input 
            type="range" 
            min={0} 
            max={duration > 0 ? duration : 100} 
            value={currentTime || 0} 
            onChange={(e) => seek(Number(e.target.value))} 
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" 
          />
          <span className="text-xs text-yt-text-secondary font-medium tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4 w-1/3">
            {/* Removed ThumbsUp and ThumbsDown to move them under the artwork */}
          </div>

          {/* Center Transport */}
          <div className="flex items-center justify-center gap-6 w-1/3">
            <button onClick={handlePrevTrack} className="p-2 text-white/70 hover:text-white transition-colors">
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-16 h-16 flex items-center justify-center bg-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 text-black"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>
            <button onClick={nextTrack} className="p-2 text-white/70 hover:text-white transition-colors">
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            <button
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {volume === 0 ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 accent-white"
            />
            <button className="p-2 text-white/60 hover:text-white transition-colors ml-2">
              <Repeat className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
