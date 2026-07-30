import { useMemo, useState } from 'react';
import { MoreVertical, Music, Play } from 'lucide-react';
import {
  Shuffle,
  Pencil,
  ListPlus,
  PlaySquare,
  Download,
  Share2,
  Trash2,
} from 'lucide-react';
import { UserPlaylist, usePlayerStore } from '../../store/usePlayerStore';
import { CardMenuDropdown, CardMenuItem } from '../CardMenuDropdown';
import { PlaylistModal } from '../PlaylistModal';

interface PlaylistCardProps {
  playlist: UserPlaylist;
  className?: string;
  onOpen?: (playlist: UserPlaylist) => void;
}

export function PlaylistCard({ playlist, className = '', onOpen }: PlaylistCardProps) {
  const {
    setTrack,
    setQueue,
    shuffleQueue,
    addToQueue,
    togglePlay,
    isPlaying,
    deletePlaylist,
    renamePlaylist,
  } = usePlayerStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);

  const handleOpen = () => {
    onOpen?.(playlist);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    setTrack(playlist.tracks[0]);
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor(rect);
    setMenuOpen(true);
  };

  const menuItems = useMemo<CardMenuItem[]>(() => {
    const tracks = playlist.tracks;

    return [
      {
        id: 'shuffle',
        icon: Shuffle,
        label: 'Aleatório',
        onClick: () => {
          if (tracks.length === 0) return;
          setQueue(tracks);
          shuffleQueue();
          if (!isPlaying) togglePlay();
        },
      },
      {
        id: 'edit',
        icon: Pencil,
        label: 'Editar playlist',
        onClick: () => setRenameOpen(true),
      },
      {
        id: 'play-next',
        icon: PlaySquare,
        label: 'Tocar a seguir',
        onClick: () => {
          if (tracks.length > 0) {
            tracks.forEach((t) => addToQueue(t));
          }
        },
      },
      {
        id: 'add-queue',
        icon: ListPlus,
        label: 'Adicionar à fila',
        onClick: () => {
          tracks.forEach((t) => addToQueue(t));
        },
      },
      {
        id: 'download',
        icon: Download,
        label: 'Baixar',
        onClick: () => console.log('[Baixar playlist]', playlist.name),
      },
      {
        id: 'share',
        icon: Share2,
        label: 'Compartilhar',
        onClick: () => console.log('[Compartilhar]', playlist.name),
      },
      {
        id: 'delete',
        icon: Trash2,
        label: 'Excluir',
        danger: true,
        onClick: () => deletePlaylist(playlist.id),
      },
    ];
  }, [playlist, isPlaying, setQueue, shuffleQueue, togglePlay, addToQueue, deletePlaylist]);

  return (
    <>
      <div onClick={handleOpen} className={`group cursor-pointer relative ${className}`}>
        <div className="relative aspect-square w-full rounded-md overflow-hidden mb-2 bg-gradient-to-br from-red-600/40 to-purple-600/40">
          {playlist.tracks.length > 0 && playlist.tracks[0].coverUrl ? (
            <img
              src={playlist.tracks[0].coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-10 h-10 text-white/60" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <button
              type="button"
              onClick={handlePlay}
              className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center ring-1 ring-white/20 hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </button>
          </div>

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

        <p className="text-sm font-medium text-white truncate leading-5 group-hover:text-red-400 transition-colors">
          {playlist.name}
        </p>
        <p className="text-xs text-yt-text-secondary truncate leading-4">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'música' : 'músicas'} • {playlist.creator}
        </p>
      </div>

      {menuOpen && menuAnchor && (
        <CardMenuDropdown
          anchorRect={menuAnchor}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <PlaylistModal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        initialName={playlist.name}
        onSave={(name) => renamePlaylist(playlist.id, name)}
        title="Editar playlist"
      />
    </>
  );
}
