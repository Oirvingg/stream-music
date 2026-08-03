import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ListPlus, MoreVertical, Play, Trash } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { TrackContextMenu } from '../components/TrackContextMenu';
import { TrackCard } from '../components/cards/TrackCard';
import { PlaylistModal } from '../components/PlaylistModal';
import { AddTrackToPlaylistModal } from '../components/AddTrackToPlaylistModal';
import { DraggableTrackRow } from '../components/DraggableTrackRow';
import { useTrendingTracks, useSearchTracks, usePersonalizedTrendingTracks, useCategories } from '../hooks/useMusicQueries';
import { useUserPlaylists, useFavoriteTracks, useRenamePlaylist, useDeletePlaylist, useRemoveTrackFromPlaylist, useReorderPlaylistTracks } from '../hooks/useLibraryQueries';

function MusicSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm md:text-[22px] font-semibold text-white">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[170px] animate-pulse">
            <div className="aspect-square w-full rounded-md bg-zinc-800 mb-2"></div>
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-1.5"></div>
            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MusicSection({ title, tracks }: { title: string; tracks: Track[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-[22px] font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            trackList={tracks}
            className="flex-shrink-0 w-[170px]"
          />
        ))}
      </div>
    </section>
  );
}

export function Home() {
  const {
    searchQuery, activePlaylistId,
    setQueue, setTrack, currentTrack, history, togglePlay, setSearchQuery
  } = usePlayerStore();

  const { data: trendingTracks = [], isLoading: isLoadingTrending, isError: isErrorTrending, refetch: refetchTrending } = useTrendingTracks();
  const { data: searchResults = [], isLoading: isSearching, isError: isErrorSearch, refetch: refetchSearch } = useSearchTracks(searchQuery);
  const { data: categories = [] } = useCategories();

  const lastfmUsername = localStorage.getItem('lastfmUsername');
  const { data: personalizedData, isLoading: isLoadingPersonalized } = usePersonalizedTrendingTracks(history, lastfmUsername);

  const { data: playlists = [] } = useUserPlaylists();
  const { data: likedTracks = [] } = useFavoriteTracks();
  const renamePlaylist = useRenamePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeTrackFromPlaylist = useRemoveTrackFromPlaylist();
  const reorderPlaylistTracks = useReorderPlaylistTracks();

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [addSongModalOpen, setAddSongModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ track: Track; x: number; y: number } | null>(null);

  const activePlaylist = activePlaylistId ? playlists.find(p => p.id === activePlaylistId) : null;

  const listenAgainTracks = history.slice(0, 20);
  const favoriteTracks = likedTracks.slice(0, 20);

  if (activePlaylist) {
    return (
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-6 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{activePlaylist.title}</h1>
              <p className="text-sm text-yt-text-secondary">
                {activePlaylist.tracks.length} músicas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddSongModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors"
              >
                <ListPlus className="w-4 h-4" />
                Adicionar músicas
              </button>
              <button
                onClick={() => setRenameModalOpen(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-colors"
              >
                Renomear
              </button>
              <button
                onClick={() => {
                  deletePlaylist.mutate(activePlaylist.id);
                  usePlayerStore.getState().setActivePlaylistId(null);
                }}
                className="px-4 py-2 rounded-full bg-red-600/20 hover:bg-red-600/40 text-sm font-medium text-red-500 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>

          {activePlaylist.tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-yt-text-secondary">
              <p>Nenhuma música nesta playlist ainda.</p>
              <p className="text-sm mb-6">Encontre músicas no Início e adicione-as aqui.</p>
              <button
                onClick={() => setAddSongModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors"
              >
                <ListPlus className="w-4 h-4" />
                Adicionar músicas
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activePlaylist.tracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                const artistLabel = typeof track.artist === 'string' ? track.artist : track.artist.name;
                
                return (
                  <DraggableTrackRow
                    key={`${track.id}-${idx}`}
                    index={idx}
                    onReorder={(start, end) => {
                      const reordered = Array.from(activePlaylist.tracks);
                      const [moved] = reordered.splice(start, 1);
                      reordered.splice(end, 0, moved);
                      reorderPlaylistTracks.mutate({ playlistId: activePlaylist.id, tracks: reordered });
                    }}
                    className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors group"
                    onClick={(e) => {
                      // Impede que cliques acidentais nos botões propaguem para cá
                      if ((e.target as HTMLElement).closest('button')) return;
                      
                      if (currentTrack?.id === track.id) {
                        togglePlay();
                      } else {
                        setQueue(activePlaylist.tracks);
                        setTrack(track);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ track, x: e.clientX, y: e.clientY });
                    }}
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
                        setContextMenu({ track, x: e.clientX, y: e.clientY });
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all mr-2 z-10"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist.mutate({ playlistId: activePlaylist.id, trackId: track.id });
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 text-yt-text-secondary hover:text-red-500 transition-all z-10"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </DraggableTrackRow>
                );
              })}
            </div>
          )}
        </div>
        <PlaylistModal
          isOpen={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          initialName={activePlaylist.title}
          onSave={(newName) => renamePlaylist.mutate({ id: activePlaylist.id, title: newName })}
          title="Renomear Playlist"
        />
        <AddTrackToPlaylistModal
          isOpen={addSongModalOpen}
          onClose={() => setAddSongModalOpen(false)}
          playlistId={activePlaylist.id}
          existingTrackIds={activePlaylist.tracks.map((t) => t.id)}
        />
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
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-6 pb-32 md:pb-4">
        <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              className={`flex-shrink-0 px-4 py-1.5 min-h-[44px] rounded-lg text-xs md:text-sm font-medium transition-colors ${
                i === 0
                  ? 'bg-white text-yt-black'
                  : 'bg-yt-pill text-white/80 hover:bg-yt-surface-hover'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isErrorTrending || isErrorSearch ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yt-text-secondary">
                <path d="M10.61 10.61A2.001 2.001 0 0 0 12 14a2 2 0 0 0 1.39-.61"></path>
                <path d="M14.07 7.93a5 5 0 0 0-7.14 0"></path>
                <path d="M16.9 5.1a9 9 0 0 0-12.73 0"></path>
                <path d="m2 2 20 20"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Você está offline</h2>
            <p className="text-yt-text-secondary mb-6 max-w-sm">
              Verifique sua conexão com a internet. O aplicativo tentará usar os dados salvos em cache enquanto isso.
            </p>
            <button 
              onClick={() => {
                if (searchQuery) refetchSearch();
                else refetchTrending();
              }}
              className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : searchQuery && isSearching ? (
          <MusicSectionSkeleton title="Resultados da Pesquisa" />
        ) : searchQuery && searchResults.length > 0 ? (
          <MusicSection title="Resultados da Pesquisa" tracks={searchResults} />
        ) : (
          <>
            {isLoadingTrending || isLoadingPersonalized ? (
              <MusicSectionSkeleton title="Em Alta" />
            ) : personalizedData && personalizedData.tracks.length > 0 ? (
              <MusicSection title={`Recomendado: ${personalizedData.sourceArtist}`} tracks={personalizedData.tracks} />
            ) : trendingTracks.length > 0 ? (
              <MusicSection title="Em Alta" tracks={trendingTracks} />
            ) : null}

            {listenAgainTracks.length > 0 && (
              <MusicSection title="Ouvir de novo" tracks={listenAgainTracks} />
            )}

            {favoriteTracks.length > 0 && (
              <MusicSection title="Suas Curtidas" tracks={favoriteTracks} />
            )}
          </>
        )}
      </div>
    </main>
  );
}