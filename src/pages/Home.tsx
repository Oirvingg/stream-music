import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ListPlus, MoreVertical, Music, Play, Shuffle, Trash } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track, getArtistName, getArtistId } from '../types/music';
import { TrackContextMenu } from '../components/TrackContextMenu';
import { TrackCard } from '../components/cards/TrackCard';
import { PlaylistModal } from '../components/PlaylistModal';
import { AddTrackToPlaylistModal } from '../components/AddTrackToPlaylistModal';
import { DraggableTrackRow } from '../components/DraggableTrackRow';
import { useTrendingTracks, useSearchTracks, useSearchArtist, useArtistTopTracks, usePersonalizedTrendingTracks, useCategories } from '../hooks/useMusicQueries';
import { useUserPlaylists, useFavoriteTracks, useRenamePlaylist, useDeletePlaylist, useRemoveTrackFromPlaylist, useReorderPlaylistTracks } from '../hooks/useLibraryQueries';
import { goToArtist } from '../utils/navigation';

const SEARCH_FILTERS = ['Tudo', 'Artistas', 'Playlists em destaque', 'Músicas', 'Álbuns', 'Vídeos', 'Podcasts'];

function formatCompact(n: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatDuration(sec: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function SearchResultRow({
  track,
  isActive,
  onPlay,
  onContextMenu,
}: {
  track: Track;
  isActive: boolean;
  onPlay: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const artistLabel = getArtistName(track.artist);
  const artistId = getArtistId(track.artist);

  return (
    <div
      className="flex items-center gap-3 md:gap-4 p-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors group min-h-[44px]"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onPlay();
      }}
      onContextMenu={onContextMenu}
    >
      <div className="relative w-10 h-10 shrink-0">
        <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 rounded">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isActive ? 'text-red-500 font-medium' : 'text-white/90'}`}>
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
          {` • ${formatDuration(track.duration)}`}
          {typeof track.rank === 'number' && ` • Tocou ${formatCompact(track.rank)} vezes`}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e);
        }}
        className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all z-10"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}

function SearchResults({ query, searchResults, isSearchingTracks }: { query: string; searchResults: Track[]; isSearchingTracks: boolean }) {
  const { setQueue, setTrack, togglePlay, isPlaying, currentTrack, shuffleQueue } = usePlayerStore();
  const [activeFilter, setActiveFilter] = useState('Tudo');
  const [contextMenu, setContextMenu] = useState<{ track: Track; x: number; y: number } | null>(null);

  const { data: artist, isLoading: isLoadingArtist } = useSearchArtist(query);
  const { data: artistTopTracks = [], isLoading: isLoadingArtistTracks } = useArtistTopTracks(artist?.id ?? null);

  const heroTracks = artistTopTracks.slice(0, 3);
  const heroTrackIds = new Set(heroTracks.map((t) => t.id));
  const otherResults = artist ? searchResults.filter((t) => !heroTrackIds.has(t.id)) : searchResults;

  const handleContextMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ track, x: e.clientX, y: e.clientY });
  };

  const handlePlayTrack = (track: Track, list: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(list);
      setTrack(track);
    }
  };

  const handleShuffleArtist = () => {
    if (artistTopTracks.length === 0) return;
    setQueue(artistTopTracks);
    shuffleQueue();
    if (!isPlaying) togglePlay();
  };

  const handleMixArtist = () => {
    if (artistTopTracks.length === 0) return;
    setQueue(artistTopTracks);
    setTrack(artistTopTracks[0]);
  };

  const nothingFound =
    !isLoadingArtist && !isLoadingArtistTracks && !isSearchingTracks && !artist && otherResults.length === 0;

  return (
    <>
      <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
        {SEARCH_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-4 py-1.5 min-h-[44px] rounded-lg text-xs md:text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-white text-yt-black'
                : 'bg-yt-pill text-white/80 hover:bg-yt-surface-hover'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoadingArtist ? (
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex items-center gap-6 p-6 rounded-xl bg-zinc-900/60 animate-pulse">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1">
              <div className="h-6 bg-zinc-800 rounded w-2/3 mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-1/3" />
            </div>
          </div>
        </section>
      ) : artist ? (
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            onClick={() => goToArtist(artist.id)}
            className="flex items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 hover:from-zinc-800 hover:to-zinc-900 transition-colors cursor-pointer"
          >
            <img
              src={artist.pictureXl || artist.pictureMedium}
              alt={artist.name}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-yt-text-secondary mb-1">Artista</p>
              <h2 className="text-xl md:text-3xl font-bold text-white truncate mb-1">{artist.name}</h2>
              {artist.nbFans > 0 && (
                <p className="text-sm text-yt-text-secondary mb-4">{formatCompact(artist.nbFans)} ouvintes mensais</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShuffleArtist();
                  }}
                  disabled={artistTopTracks.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shuffle className="w-4 h-4" />
                  Aleatório
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMixArtist();
                  }}
                  disabled={artistTopTracks.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Music className="w-4 h-4" />
                  Mix
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1">
            {isLoadingArtistTracks ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="w-10 h-10 bg-zinc-800 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              heroTracks.map((track) => (
                <SearchResultRow
                  key={track.id}
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track, artistTopTracks)}
                  onContextMenu={(e) => handleContextMenu(e, track)}
                />
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="text-lg md:text-2xl font-semibold text-white mb-4">Mais resultados</h2>
        {isSearchingTracks ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
                <div className="w-10 h-10 bg-zinc-800 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-zinc-800 rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        ) : otherResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {otherResults.map((track) => (
              <SearchResultRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                onPlay={() => handlePlayTrack(track, otherResults)}
                onContextMenu={(e) => handleContextMenu(e, track)}
              />
            ))}
          </div>
        ) : nothingFound ? (
          <p className="text-yt-text-secondary">Nenhum resultado encontrado para "{query}".</p>
        ) : null}
      </section>

      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

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
                const artistLabel = getArtistName(track.artist);
                const artistId = getArtistId(track.artist);

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
        ) : searchQuery ? (
          <SearchResults query={searchQuery} searchResults={searchResults} isSearchingTracks={isSearching} />
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