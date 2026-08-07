import { useTrendingTracks, useGenreTracks } from '../hooks/useMusicQueries';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track, getArtistName, getArtistId } from '../types/music';
import { Play, MoreVertical, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { TrackContextMenu } from '../components/TrackContextMenu';
import { goToArtist } from '../utils/navigation';

const EXPLORE_CATEGORIES = [
  { id: 'pop', name: 'Pop', color: 'bg-pink-600' },
  { id: 'rock', name: 'Rock', color: 'bg-red-600' },
  { id: 'sertanejo', name: 'Sertanejo', color: 'bg-orange-500' },
  { id: 'funk', name: 'Funk', color: 'bg-purple-600' },
  { id: 'hiphop', name: 'Hip Hop', color: 'bg-blue-600' },
  { id: 'eletronica', name: 'Eletrônica', color: 'bg-teal-500' },
  { id: 'relax', name: 'Relax', color: 'bg-green-600' },
  { id: 'indie', name: 'Indie', color: 'bg-yellow-600' },
];

export function Explore() {
  const { data: trendingTracks = [], isLoading } = useTrendingTracks();
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  const { data: categoryTracks = [], isLoading: isLoadingCategory } = useGenreTracks(selectedCategory?.name || null);
  
  const { setTrack, togglePlay, currentTrack } = usePlayerStore();
  const [contextMenu, setContextMenu] = useState<{ track: Track; x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ track, x: e.clientX, y: e.clientY });
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  if (selectedCategory) {
    return (
      <main className="flex-1 flex flex-col overflow-y-auto px-3 md:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl md:text-4xl font-bold text-white">{selectedCategory.name}</h1>
        </div>

        <section className="mb-8">
          {isLoadingCategory ? (
            <div className="flex flex-col gap-2">
               {Array.from({ length: 10 }).map((_, i) => (
                 <div key={i} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
                   <div className="w-8 h-4 bg-zinc-800 rounded"></div>
                   <div className="w-10 h-10 bg-zinc-800 rounded"></div>
                   <div className="flex-1">
                     <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2"></div>
                     <div className="h-3 bg-zinc-800 rounded w-1/6"></div>
                   </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {categoryTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                const artistLabel = getArtistName(track.artist);
                const artistId = getArtistId(track.artist);

                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors group min-h-[44px]"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      handlePlayTrack(track);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, track)}
                  >
                    <span className="w-8 text-center text-sm text-yt-text-secondary group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button className="w-8 flex justify-center hidden group-hover:flex">
                      <Play className="w-4 h-4 text-white" />
                    </button>
                    <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/90'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-yt-text-secondary truncate">
                        {artistId ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              goToArtist(artistId);
                            }}
                            className="hover:text-white hover:underline transition-colors"
                          >
                            {artistLabel}
                          </span>
                        ) : (
                          artistLabel
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, track);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all z-10"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {contextMenu && (
          <TrackContextMenu 
            track={contextMenu.track} 
            x={contextMenu.x} 
            y={contextMenu.y} 
            onClose={() => setContextMenu(null)} 
          />
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-y-auto px-3 md:px-6 py-6 md:py-8 pb-20 md:pb-8">
      <h1 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8">Explorar</h1>

      <section className="mb-12">
        <h2 className="text-lg md:text-2xl font-semibold text-white mb-4">Gêneros e Momentos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {EXPLORE_CATEGORIES.map(category => (
            <div 
              key={category.id} 
              onClick={() => setSelectedCategory(category)}
              className={`${category.color} h-24 rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity flex items-end overflow-hidden relative group`}
            >
              <span className="text-white font-bold text-lg z-10">{category.name}</span>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-black/20 rounded-full group-hover:scale-110 transition-transform" />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg md:text-2xl font-semibold text-white mb-4">Mais Tocadas</h2>
        
        {isLoading ? (
          <div className="flex flex-col gap-2">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
                 <div className="w-8 h-4 bg-zinc-800 rounded"></div>
                 <div className="w-10 h-10 bg-zinc-800 rounded"></div>
                 <div className="flex-1">
                   <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2"></div>
                   <div className="h-3 bg-zinc-800 rounded w-1/6"></div>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trendingTracks.slice(0, 20).map((track, idx) => {
              const isActive = currentTrack?.id === track.id;
              const artistLabel = typeof track.artist === 'string' ? track.artist : track.artist.name;
              
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 md:gap-4 p-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors group min-h-[44px]"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    handlePlayTrack(track);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, track)}
                >
                  <span className="w-8 text-center text-sm text-yt-text-secondary group-hover:hidden">
                    {idx + 1}
                  </span>
                  <button className="w-8 flex justify-center hidden group-hover:flex">
                    <Play className="w-4 h-4 text-white" />
                  </button>
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-white/90'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-yt-text-secondary truncate">
                      {artistLabel}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, track);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all z-10"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {contextMenu && (
        <TrackContextMenu 
          track={contextMenu.track} 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onClose={() => setContextMenu(null)} 
        />
      )}
    </main>
  );
}
