import { useMemo, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  Shuffle,
  ListPlus,
  PlaySquare,
  Download,
  Bookmark,
  Share2,
  Trash2,
} from 'lucide-react';
import { Track } from '../../types/music';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUserPlaylists, useAddTrackToPlaylist, useToggleFavoriteTrack, useFavoriteTracks } from '../../hooks/useLibraryQueries';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { CardMenuDropdown, CardMenuItem } from '../CardMenuDropdown';

function getArtistLabel(track: Track) {
  return typeof track.artist === 'string' ? track.artist : track.artist.name;
}

interface TrackCardProps {
  track: Track;
  trackList?: Track[];
  className?: string;
  onPlay?: (track: Track, list: Track[]) => void;
  onDelete?: (track: Track) => void;
}

export function TrackCard({
  track,
  trackList = [],
  className = '',
  onPlay,
  onDelete,
}: TrackCardProps) {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    setTrack,
    setQueue,
    shuffleQueue,
    playNext,
    addToQueue,
  } = usePlayerStore();
  const { data: playlists = [] } = useUserPlaylists();
  const { data: likedTracks = [] } = useFavoriteTracks();
  const addTrackToPlaylist = useAddTrackToPlaylist();
  const toggleFavoriteTrack = useToggleFavoriteTrack();
  const requireAuth = useRequireAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);

  const isActive = currentTrack?.id === track.id;
  const artistLabel = getArtistLabel(track);
  const list = trackList.length > 0 ? trackList : [track];
  const isLiked = likedTracks.some((t) => t.id === track.id);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(track, list);
      return;
    }
    if (isActive) {
      togglePlay();
    } else {
      setQueue(list);
      setTrack(track);
    }
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor(rect);
    setMenuOpen(true);
  };

  const menuItems = useMemo<CardMenuItem[]>(() => {
    const items: CardMenuItem[] = [
      {
        id: 'shuffle',
        icon: Shuffle,
        label: 'Aleatório',
        onClick: () => {
          setQueue(list);
          shuffleQueue();
          if (!isPlaying) togglePlay();
        },
      },
      {
        id: 'play-next',
        icon: PlaySquare,
        label: 'Tocar a seguir',
        onClick: () => playNext(track),
      },
      {
        id: 'add-queue',
        icon: ListPlus,
        label: 'Adicionar à fila',
        onClick: () => addToQueue(track),
      },
      {
        id: 'download',
        icon: Download,
        label: 'Baixar',
        onClick: () => console.log('[Baixar]', track.title),
      },
      {
        id: 'save-playlist',
        icon: Bookmark,
        label: 'Salvar na playlist',
        submenu: playlists.map((pl) => ({
          id: pl.id,
          label: pl.title,
          onClick: () => {
            if (!requireAuth()) return;
            addTrackToPlaylist.mutate({ playlistId: pl.id, track });
          },
        })),
      },
      {
        id: 'share',
        icon: Share2,
        label: 'Compartilhar',
        onClick: () => console.log('[Compartilhar]', track.title),
      },
      {
        id: 'delete',
        icon: Trash2,
        label: 'Excluir',
        danger: true,
        onClick: () => {
          if (onDelete) {
            onDelete(track);
          } else if (isLiked) {
            toggleFavoriteTrack.mutate(track);
          } else {
            console.log('[Excluir]', track.title);
          }
        },
      },
    ];
    return items;
  }, [
    track,
    list,
    playlists,
    isPlaying,
    isLiked,
    requireAuth,
    toggleFavoriteTrack,
    onDelete,
    setQueue,
    shuffleQueue,
    togglePlay,
    playNext,
    addToQueue,
    addTrackToPlaylist,
  ]);

  return (
    <>
      <div
        onClick={handlePlay}
        className={`group cursor-pointer relative ${className}`}
      >
        <div className="relative aspect-square w-full rounded-md overflow-hidden mb-2">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
              isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center ring-1 ring-white/20">
              {isActive && isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </div>
          </div>

          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
          )}

          <button
            type="button"
            aria-label="Menu"
            className={`absolute top-2 right-2 p-1.5 bg-black/60 rounded-full transition-opacity z-10 hover:bg-black/80 ${
              menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={handleMenuClick}
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className={`text-sm font-medium truncate leading-5 ${isActive ? 'text-red-500' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-yt-text-secondary truncate leading-4">
          {artistLabel}{track.album ? ` • ${track.album}` : ''}
        </p>
      </div>

      {menuOpen && menuAnchor && (
        <CardMenuDropdown
          anchorRect={menuAnchor}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
