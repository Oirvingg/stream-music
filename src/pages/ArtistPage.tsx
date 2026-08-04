import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Music, Play, Shuffle } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { useArtistDetails, useArtistTopTracks, useArtistAlbums, useArtistRelated } from '../hooks/useMusicQueries';
import { fetchAlbumTracks, DeezerAlbum, DeezerArtistSummary } from '../services/deezerService';
import { goToArtist, goBackFromArtist, goToAlbum } from '../utils/navigation';
import { TrackContextMenu } from '../components/TrackContextMenu';

const FOLLOWED_ARTISTS_KEY = 'followedArtistIds';

function getFollowedArtistIds(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOWED_ARTISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleFollowedArtistId(id: string): boolean {
  const current = getFollowedArtistIds();
  const isFollowing = current.includes(id);
  const next = isFollowing ? current.filter((existing) => existing !== id) : [...current, id];
  localStorage.setItem(FOLLOWED_ARTISTS_KEY, JSON.stringify(next));
  return !isFollowing;
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatDuration(sec: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface ArtistPageProps {
  artistId: string;
}

export function ArtistPage({ artistId }: ArtistPageProps) {
  const { setQueue, setTrack, shuffleQueue, togglePlay, isPlaying, currentTrack } = usePlayerStore();

  const { data: artist, isLoading: isLoadingArtist } = useArtistDetails(artistId);
  const { data: topTracks = [], isLoading: isLoadingTracks } = useArtistTopTracks(artistId);
  const { data: discography, isLoading: isLoadingAlbums } = useArtistAlbums(artistId);
  const { data: relatedArtists = [] } = useArtistRelated(artistId);

  const [bioExpanded, setBioExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(() => getFollowedArtistIds().includes(artistId));
  const [contextMenu, setContextMenu] = useState<{ track: Track; x: number; y: number } | null>(null);

  const handleFollowClick = () => {
    setIsFollowing(toggleFollowedArtistId(artistId));
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(topTracks);
      setTrack(track);
    }
  };

  const handleShuffle = () => {
    if (topTracks.length === 0) return;
    setQueue(topTracks);
    shuffleQueue();
    if (!isPlaying) togglePlay();
  };

  const handleMix = () => {
    if (topTracks.length === 0) return;
    setQueue(topTracks);
    setTrack(topTracks[0]);
  };

  const handlePlayAlbum = async (album: DeezerAlbum) => {
    const tracks = await fetchAlbumTracks(album.id);
    if (tracks.length === 0) return;
    setQueue(tracks);
    setTrack(tracks[0]);
  };

  if (isLoadingArtist) {
    return (
      <main className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white/90 rounded-full animate-spin" />
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center text-yt-text-secondary gap-4">
        <p>Não foi possível carregar este artista.</p>
        <button
          onClick={goBackFromArtist}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-colors"
        >
          Voltar
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      {/* Banner */}
      <div className="relative h-[320px] md:h-[420px] w-full overflow-hidden shrink-0">
        {artist.pictureXl ? (
          <img src={artist.pictureXl} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/60 to-purple-900/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-yt-black via-yt-black/50 to-black/20" />

        <button
          onClick={goBackFromArtist}
          aria-label="Voltar"
          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="text-3xl md:text-6xl font-extrabold text-white drop-shadow-lg">{artist.name}</h1>
          {artist.listeners > 0 && (
            <p className="text-sm md:text-base text-white/80 mt-2">
              {formatCompact(artist.listeners)} ouvintes mensais
            </p>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 py-6">
        {artist.bio && (
          <div className="max-w-3xl mb-6">
            <p className={`text-sm text-white/70 leading-relaxed ${bioExpanded ? '' : 'line-clamp-2'}`}>
              {artist.bio}
            </p>
            <button
              onClick={() => setBioExpanded((v) => !v)}
              className="text-xs font-bold text-white/60 hover:text-white mt-1 transition-colors"
            >
              {bioExpanded ? 'MENOS' : 'MAIS'}
            </button>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="flex items-center gap-3 mb-10">
          <button
            onClick={handleShuffle}
            disabled={topTracks.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
            Aleatório
          </button>
          <button
            onClick={handleMix}
            disabled={topTracks.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Music className="w-4 h-4" />
            Mix
          </button>
          <button
            onClick={handleFollowClick}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
              isFollowing
                ? 'border-white/20 text-white/80 hover:bg-white/10'
                : 'border-white text-white hover:bg-white/10'
            }`}
          >
            {isFollowing ? 'Inscrito' : 'Inscrever-se'}
          </button>
        </div>

        {/* Top músicas */}
        <section className="mb-12">
          <h2 className="text-lg md:text-2xl font-semibold text-white mb-4">Top músicas</h2>
          {isLoadingTracks ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
                  <div className="w-8 h-4 bg-zinc-800 rounded" />
                  <div className="w-10 h-10 bg-zinc-800 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-w-3xl">
              {topTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      handlePlayTrack(track);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ track, x: e.clientX, y: e.clientY });
                    }}
                    className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors group"
                  >
                    <span className="w-6 text-center text-sm text-yt-text-secondary group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button className="w-6 hidden group-hover:flex justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </button>
                    <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                    <p className={`flex-1 min-w-0 text-sm truncate ${isActive ? 'text-red-500 font-medium' : 'text-white/90'}`}>
                      {track.title}
                    </p>
                    {typeof track.rank === 'number' && (
                      <span className="hidden md:inline text-xs text-yt-text-secondary w-28 shrink-0">
                        {formatCompact(track.rank)} reproduções
                      </span>
                    )}
                    <span className="text-xs text-yt-text-secondary tabular-nums w-10 text-right">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ track, x: e.clientX, y: e.clientY });
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Álbuns */}
        {(isLoadingAlbums || (discography?.albums.length ?? 0) > 0) && (
          <DiscographySection
            title="Álbuns"
            items={discography?.albums ?? []}
            isLoading={isLoadingAlbums}
            onPlayAlbum={handlePlayAlbum}
          />
        )}

        {/* Singles e EPs */}
        {(discography?.singles.length ?? 0) > 0 && (
          <DiscographySection
            title="Singles e EPs"
            items={discography?.singles ?? []}
            isLoading={false}
            onPlayAlbum={handlePlayAlbum}
          />
        )}

        {/* Artistas parecidos */}
        {relatedArtists.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg md:text-2xl font-semibold text-white mb-4">Artistas parecidos</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
              {relatedArtists.map((related) => (
                <RelatedArtistCard key={related.id} artist={related} />
              ))}
            </div>
          </section>
        )}
      </div>

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

/**
 * Seção de discografia (Álbuns / Singles e EPs) com cabeçalho no estilo
 * YouTube Music: setas de navegação do carrossel + botão "MAIS" que expande
 * a seção em uma grade mostrando o catálogo completo já carregado da API.
 */
function DiscographySection({
  title,
  items,
  isLoading,
  onPlayAlbum,
}: {
  title: string;
  items: DeezerAlbum[];
  isLoading: boolean;
  onPlayAlbum: (album: DeezerAlbum) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-2xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-1">
          {!showAll && !isLoading && items.length > 3 && (
            <>
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
            </>
          )}
          {!isLoading && items.length > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              data-tour={title === 'Álbuns' ? 'artist-more-button' : undefined}
              className="ml-1 px-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
            >
              {showAll ? 'MENOS' : 'MAIS'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[170px] animate-pulse">
              <div className="aspect-square w-full rounded-md bg-zinc-800 mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : showAll ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {items.map((album) => (
            <AlbumCard key={album.id} album={album} onPlay={() => onPlayAlbum(album)} className="w-full" />
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
          {items.map((album) => (
            <AlbumCard key={album.id} album={album} onPlay={() => onPlayAlbum(album)} />
          ))}
        </div>
      )}
    </section>
  );
}

function AlbumCard({
  album,
  onPlay,
  className = 'flex-shrink-0 w-[170px]',
}: {
  album: DeezerAlbum;
  onPlay: () => void;
  className?: string;
}) {
  return (
    <div onClick={() => goToAlbum(album.id)} className={`${className} text-left group cursor-pointer`}>
      <div className="relative aspect-square w-full rounded-md overflow-hidden mb-2">
        <img
          src={album.coverXl}
          alt={album.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center ring-1 ring-white/20 hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-white truncate leading-5">{album.title}</p>
      <p className="text-xs text-yt-text-secondary truncate leading-4">{album.releaseYear}</p>
    </div>
  );
}

function RelatedArtistCard({ artist }: { artist: DeezerArtistSummary }) {
  return (
    <button onClick={() => goToArtist(artist.id)} className="flex-shrink-0 w-28 flex flex-col items-center gap-2 group">
      <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-800">
        {artist.pictureMedium ? (
          <img
            src={artist.pictureMedium}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-8 h-8 text-white/40" />
          </div>
        )}
      </div>
      <p className="text-sm text-white/90 text-center truncate w-full">{artist.name}</p>
    </button>
  );
}

