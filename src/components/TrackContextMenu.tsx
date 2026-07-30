import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  PlaySquare,
  ListPlus,
  Bookmark,
  Download,
  Share2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Track } from '../types/music';
import { usePlayerStore } from '../store/usePlayerStore';

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
  const [showPlaylists, setShowPlaylists] = useState(false);

  const {
    shuffleQueue,
    playNext,
    addToQueue,
    playlists,
    addTrackToPlaylist,
    setQueue,
    togglePlay,
    isPlaying,
    toggleLikeTrack,
    likedTracks,
  } = usePlayerStore();

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
      toggleLikeTrack(track);
    } else {
      console.log('[Excluir]', track.title);
    }
    onClose();
  };

  const menuItems = [
    { icon: Shuffle, label: 'Aleatório', onClick: handleShuffle },
    { icon: PlaySquare, label: 'Tocar a seguir', onClick: handlePlayNext },
    { icon: ListPlus, label: 'Adicionar à fila', onClick: handleAddToQueue },
    { icon: Download, label: 'Baixar', onClick: (e: React.MouseEvent) => { e.stopPropagation(); console.log('[Baixar]', track.title); onClose(); } },
    { icon: Bookmark, label: 'Salvar na playlist', submenu: true },
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
      {menuItems.map((item, index) => {
        if (item.submenu) {
          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setShowPlaylists(true)}
              onMouseLeave={() => setShowPlaylists(false)}
            >
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left font-medium"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <item.icon className="w-5 h-5 text-white/70 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50 shrink-0 ml-2" />
              </button>

              {showPlaylists && (
                <div
                  className={`absolute top-0 ${x > window.innerWidth - 450 ? 'right-full mr-1' : 'left-full ml-1'} w-56 bg-[#212121] rounded-md shadow-2xl py-2 border border-white/10 flex flex-col z-[100000]`}
                >
                  {playlists.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-white/70 italic">Nenhuma playlist</div>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addTrackToPlaylist(pl.id, track);
                          onClose();
                        }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors text-left truncate"
                      >
                        {pl.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={item.onClick}
            className={`flex items-center gap-4 w-full px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left font-medium ${
              item.danger ? 'text-red-400' : 'text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${item.danger ? 'text-red-400' : 'text-white/70'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
