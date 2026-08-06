import { useEffect, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Music2 } from 'lucide-react';
import { getCoverGradient } from '../utils/coverColor';
import { useAutoScrollActiveLine } from '../hooks/useAutoScrollActiveLine';
import type { Track } from '../types/music';
import type { LyricLine } from '../services/lyricsService';

interface MobileLyricsViewProps {
  track: Track;
  isPlaying: boolean;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  isLoadingLyrics: boolean;
  timedLyrics: LyricLine[];
  activeIndex: number;
  seek: (time: number) => void;
  onClose: () => void;
}

const FALLBACK_GRADIENT = 'linear-gradient(180deg, #3a1c1c 0%, #030303 70%)';

export function MobileLyricsView({
  track, isPlaying, togglePlay, nextTrack, prevTrack,
  isLoadingLyrics, timedLyrics, activeIndex, seek, onClose,
}: MobileLyricsViewProps) {
  const [gradient, setGradient] = useState(FALLBACK_GRADIENT);
  // Rola instantaneamente na primeira linha ativa de cada faixa (`track.id`
  // como resetKey, já que este componente pode permanecer montado ao trocar
  // de faixa); trocas de linha seguintes usam scroll suave com debounce.
  const activeLineRef = useAutoScrollActiveLine(activeIndex, track.id);

  useEffect(() => {
    let isMounted = true;
    getCoverGradient(track.coverUrl).then((g) => {
      if (isMounted) setGradient(g);
    });
    return () => { isMounted = false; };
  }, [track.coverUrl]);

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in">
      <div className="absolute inset-0 -z-10" style={{ background: gradient }} />

      {/* Puxador + header */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-4" />
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-white">Letra</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mini-controle persistente */}
      <div className="shrink-0 flex items-center gap-3 px-4 pb-4">
        <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{track.title}</p>
        </div>
        <button onClick={prevTrack} className="p-2 text-white/80 hover:text-white transition-colors">
          <SkipBack className="w-5 h-5 fill-current" />
        </button>
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full active:scale-95 transition-transform text-black"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <button onClick={nextTrack} className="p-2 text-white/80 hover:text-white transition-colors">
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Letras roláveis */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y scroll-smooth py-16 px-4 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:w-0">
        {isLoadingLyrics ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/90 rounded-full animate-spin" />
            <p className="text-sm text-white/50">Buscando letras...</p>
          </div>
        ) : timedLyrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-white/20" />
            </div>
            <div>
              <p className="text-white/60 text-lg font-medium">Letra instrumental</p>
              <p className="text-white/30 text-sm mt-1">Relaxe e curta a música 🎵</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {timedLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  className={`
                    text-left transition-all duration-[600ms] ease-in-out cursor-pointer select-none
                    ${isActive
                      ? 'text-white text-3xl font-extrabold leading-snug opacity-100 drop-shadow-[0_0_16px_rgba(255,255,255,0.35)]'
                      : isPast
                        ? 'text-white/50 text-2xl font-semibold leading-snug opacity-30'
                        : 'text-white/60 text-2xl font-semibold leading-snug opacity-50'
                    }
                  `}
                  onClick={() => seek(line.time)}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
