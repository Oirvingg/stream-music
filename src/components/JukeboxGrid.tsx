import { useRef, useState } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { Track } from '../types/music';

const PAGE_SIZE = 9;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

interface JukeboxGridProps {
  tracks: Track[];
  isLoading: boolean;
}

/**
 * "Jukebox digital" — grid 3x3 paginado, estilo "Quick Picks" do YouTube
 * Music, exibido só no mobile na Home (o desktop mantém as seções
 * horizontais tradicionais).
 */
export function JukeboxGrid({ tracks, isLoading }: JukeboxGridProps) {
  const { user } = useAuthStore();
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pages = chunk(tracks, PAGE_SIZE);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActivePage(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (isLoading) {
    return (
      <section className="md:hidden mb-8 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800" />
          <div>
            <div className="h-2.5 w-16 bg-zinc-800 rounded mb-1.5" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 grid-rows-3 gap-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-zinc-800" />
          ))}
        </div>
      </section>
    );
  }

  if (pages.length === 0) return null;

  return (
    <section className="md:hidden mb-8" data-tour="jukebox-grid">
      {/* Header da seção */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-yt-text-secondary truncate">{user?.displayName || 'Sua conta'}</p>
            <h2 className="text-base font-semibold text-white leading-tight">Jukebox digital</h2>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
      </div>

      {/* Grid 3x3 paginado com scroll-snap lateral */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
      >
        {pages.map((pageTracks, pageIdx) => (
          <div
            key={pageIdx}
            className="grid grid-cols-3 grid-rows-3 gap-2 shrink-0 w-full snap-start snap-always"
          >
            {pageTracks.map((track) => (
              <JukeboxCard key={track.id} track={track} trackList={tracks} />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {pages.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activePage ? 'w-4 bg-white' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function JukeboxCard({ track, trackList }: { track: Track; trackList: Track[] }) {
  const { currentTrack, isPlaying, togglePlay, setQueue, setTrack } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      setQueue(trackList);
      setTrack(track);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative aspect-square w-full rounded-lg overflow-hidden text-left active:scale-[0.97] transition-transform"
    >
      <img src={track.coverUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <p
        className={`absolute bottom-1.5 left-1.5 right-6 text-[11px] font-medium leading-tight line-clamp-2 ${
          isActive && isPlaying ? 'text-red-400' : 'text-white'
        }`}
      >
        {track.title}
      </p>
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
        <ArrowRight className="w-3 h-3 text-white" />
      </div>
    </button>
  );
}
