import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, PlaySquare, ListPlus, Bookmark, 
  Download, Share2, User, Pin, MinusCircle, Shuffle, ChevronRight
} from 'lucide-react';
import { Track } from '../types/music';
import { usePlayerStore } from '../store/usePlayerStore';
import { searchTracks } from '../services/deezerService';

interface TrackContextMenuProps {
  track: Track;
  x: number;
  y: number;
  onClose: () => void;
}

export function TrackContextMenu({ track, x, y, onClose }: TrackContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  
  const { 
    shuffleQueue, 
    playNext, 
    addToQueue, 
    playlists,
    addTrackToPlaylist,
    setQueue,
    setTrack,
    togglePlay,
    isPlaying
  } = usePlayerStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Pequeno delay para evitar fechamento imediato se disparado por um clique
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 10);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [onClose]);

  // Posicionamento absoluto corrigido para não ultrapassar a tela
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 260), // largura do menu ~256px
    top: Math.min(y, window.innerHeight - 480), // altura estimada do menu
    zIndex: 99999,
  };

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    shuffleQueue();
    if (!isPlaying) togglePlay();
    onClose();
  };

  const handleRadio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = typeof track.artist === 'string' ? track.artist : track.artist.name;
    const results = await searchTracks(query);
    if (results.length > 0) {
      setQueue(results.slice(0, 10));
      setTrack(results[0]);
    }
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
    console.log('Adicionado à fila:', track.title);
    onClose();
  };

  const handleLog = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`[${action}]`, track);
    onClose();
  };

  const menuItems = [
    { icon: Shuffle, label: 'Aleatório', onClick: handleShuffle },
    { icon: Radio, label: 'Iniciar rádio', onClick: handleRadio },
    { icon: PlaySquare, label: 'Tocar a seguir', onClick: handlePlayNext },
    { icon: ListPlus, label: 'Adicionar à fila', onClick: handleAddToQueue },
    { icon: Bookmark, label: 'Salvar na playlist', onClick: () => {} },
    { icon: Download, label: 'Baixar', onClick: (e: React.MouseEvent) => handleLog(e, 'Baixar') },
    { icon: User, label: 'Ir para a página do artista', onClick: (e: React.MouseEvent) => handleLog(e, 'Ir para a página do artista') },
    { icon: Share2, label: 'Compartilhar', onClick: (e: React.MouseEvent) => handleLog(e, 'Compartilhar') },
    { icon: Pin, label: 'Fixar', onClick: (e: React.MouseEvent) => handleLog(e, 'Fixar') },
    { icon: MinusCircle, label: 'Não tenho interesse', onClick: (e: React.MouseEvent) => handleLog(e, 'Não tenho interesse') },
  ];

  return (
    <div 
      ref={menuRef}
      style={style}
      className="w-64 bg-[#212121] rounded-md shadow-2xl py-2 border border-white/10 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.label === 'Salvar na playlist') {
          return (
            <div 
              key={index}
              className="relative"
              onMouseEnter={() => setShowPlaylists(true)}
              onMouseLeave={() => setShowPlaylists(false)}
            >
              <button
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
                  <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Suas Playlists
                  </div>
                  {playlists.length === 0 && (
                    <div className="px-4 py-2 text-sm text-white/70 italic">
                      Nenhuma playlist
                    </div>
                  )}
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        addTrackToPlaylist(pl.id, track);
                        console.log('Salvo na playlist:', pl.name);
                        onClose();
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors text-left truncate"
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={index}
            onClick={item.onClick}
            className="flex items-center gap-4 w-full px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left font-medium"
          >
            <item.icon className="w-5 h-5 text-white/70 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
