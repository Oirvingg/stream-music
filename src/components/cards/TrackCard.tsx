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
  Heart,
} from 'lucide-react';
import { Track, getArtistName, getArtistId } from '../../types/music';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useToggleFavoriteTrack, useFavoriteTracks } from '../../hooks/useLibraryQueries';
import { CardMenuDropdown, CardMenuItem } from '../CardMenuDropdown';
import { SaveToPlaylistModal } from '../SaveToPlaylistModal';
import { goToArtist } from '../../utils/navigation';

function getArtistLabel(track: Track) {
  return getArtistName(track.artist);
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
    currentTime,
    duration,
  } = usePlayerStore();
  const { data: likedTracks = [] } = useFavoriteTracks();
  const toggleFavoriteTrack = useToggleFavoriteTrack();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const isActive = currentTrack?.id === track.id;
  const artistLabel = getArtistLabel(track);
  const artistId = getArtistId(track.artist);
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
        id: 'favorite',
        icon: Heart,
        label: isLiked ? 'Remover dos favoritos' : 'Favoritar',
        iconClassName: isLiked ? 'text-red-500 fill-red-500' : undefined,
        onClick: () => toggleFavoriteTrack.mutate(track),
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
        onClick: () => setSaveModalOpen(true),
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
    isPlaying,
    isLiked,
    toggleFavoriteTrack,
    onDelete,
    setQueue,
    shuffleQueue,
    togglePlay,
    playNext,
    addToQueue,
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

          {isActive && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden bg-white/20">
              <div 
                className="h-full bg-red-500 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
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
          {track.album ? ` • ${track.album}` : ''}
        </p>
      </div>

      {menuOpen && menuAnchor && (
        <CardMenuDropdown
          anchorRect={menuAnchor}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <SaveToPlaylistModal
        isOpen={saveModalOpen}
        track={track}
        onClose={() => setSaveModalOpen(false)}
      />
    </>
  );
}
