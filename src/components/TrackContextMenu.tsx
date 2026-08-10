import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  PlaySquare,
  ListPlus,
  Bookmark,
  Heart,
  Download,
  Share2,
  Trash2,
} from 'lucide-react';
import { Track } from '../types/music';
import { usePlayerStore } from '../store/usePlayerStore';
import { useFavoriteTracks, useToggleFavoriteTrack } from '../hooks/useLibraryQueries';
import { SaveToPlaylistModal } from './SaveToPlaylistModal';

interface TrackContextMenuProps {
  track: Track;
  x: number;
  y: number;
  onClose: () => void;
  trackList?: Track[];
  onDelete?: (track: Track) => void;
}

export function TrackContextMenu({ track, x, y, onClose, trackList, onDelete }: TrackContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const {
    shuffleQueue,
    playNext,
    addToQueue,
    setQueue,
    togglePlay,
    isPlaying,
  } = usePlayerStore();
  const { data: likedTracks = [] } = useFavoriteTracks();
  const toggleFavoriteTrack = useToggleFavoriteTrack();

  const list = trackList && trackList.length > 0 ? trackList : [track];
  const isLiked = likedTracks.some((t) => t.id === track.id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 260),
    top: Math.min(y, window.innerHeight - 420),
    zIndex: 99999,
  };

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQueue(list);
    shuffleQueue();
    if (!isPlaying) togglePlay();
    onClose();
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNext(track);
    onClose();
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(track);
    } else if (isLiked) {
      toggleFavoriteTrack.mutate(track);
    } else {
      console.log('[Excluir]', track.title);
    }
    onClose();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteTrack.mutate(track);
    onClose();
  };

  interface ContextMenuItem {
  icon: React.ElementType;
  label: string;
  favorite?: boolean;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const menuItems: ContextMenuItem[] = [
    { icon: Shuffle, label: 'Aleatório', onClick: handleShuffle },
    { icon: PlaySquare, label: 'Tocar a seguir', onClick: handlePlayNext },
    { icon: ListPlus, label: 'Adicionar à fila', onClick: handleAddToQueue },
    { icon: Heart, label: isLiked ? 'Remover dos favoritos' : 'Favoritar', favorite: isLiked, onClick: handleToggleFavorite },
    { icon: Download, label: 'Baixar', onClick: (e: React.MouseEvent) => { e.stopPropagation(); console.log('[Baixar]', track.title); onClose(); } },
    { icon: Bookmark, label: 'Salvar na playlist', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSaveModalOpen(true); } },
    { icon: Share2, label: 'Compartilhar', onClick: (e: React.MouseEvent) => { e.stopPropagation(); console.log('[Compartilhar]', track.title); onClose(); } },
    { icon: Trash2, label: 'Excluir', onClick: handleDelete, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      style={style}
      className="w-64 bg-[#212121] rounded-md shadow-2xl py-2 border border-white/10 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {!saveModalOpen && menuItems.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={item.onClick}
          className={`flex items-center gap-4 w-full px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left font-medium ${
            item.danger ? 'text-red-400' : 'text-white'
          }`}
        >
          <item.icon
            className={`w-5 h-5 shrink-0 ${
              item.favorite
                ? 'text-red-500 fill-red-500'
                : item.danger
                  ? 'text-red-400'
                  : 'text-white/70'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </button>
      ))}

      <SaveToPlaylistModal
        isOpen={saveModalOpen}
        track={track}
        onClose={() => {
          setSaveModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
