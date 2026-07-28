import { Home, Compass, Library, Plus, Pin } from 'lucide-react';
import { usePlayerStore, UserPlaylist } from '../store/usePlayerStore';
import { PlaylistModal } from './PlaylistModal';
import { useState } from 'react';

export function Sidebar() {
  const { playlists, setActivePlaylistId, activePlaylistId, createPlaylist, activePage, setActivePage } = usePlayerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlaylistClick = (playlist: UserPlaylist, e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(playlist.id);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(null);
    setActivePage('HOME');
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(null);
    setActivePage('EXPLORE');
  };

  const handleCreatePlaylist = (name: string) => {
    createPlaylist(name);
  };

  return (
    <aside className="w-[240px] min-w-[240px] h-full flex flex-col bg-transparent select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z"/>
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">Music</span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col mt-4 px-2">
        <a href="#" onClick={handleHomeClick} className={`flex items-center gap-5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${!activePlaylistId && activePage === 'HOME' ? 'bg-white/10 text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/5'}`}>
          <Home className="w-5 h-5" />
          Início
        </a>
        <a href="#" onClick={handleExploreClick} className={`flex items-center gap-5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${!activePlaylistId && activePage === 'EXPLORE' ? 'bg-white/10 text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/5'}`}>
          <Compass className="w-5 h-5" />
          Explorar
        </a>
        <a href="#" className="flex items-center gap-5 px-4 py-2.5 rounded-lg text-yt-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">
          <Library className="w-5 h-5" />
          Biblioteca
        </a>
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3 h-px bg-yt-border/40" />

      {/* New playlist button */}
      <div className="px-4">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-yt-pill hover:bg-yt-surface-hover text-sm text-white font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nova playlist
        </button>
      </div>

      {/* Playlist list */}
      <div className="flex-1 overflow-y-auto mt-3 px-2">
        {playlists.map((pl) => (
          <a
            key={pl.id}
            href="#"
            onClick={(e) => handlePlaylistClick(pl, e)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors group ${activePlaylistId === pl.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className={`text-sm truncate ${activePlaylistId === pl.id ? 'text-white font-medium' : 'text-white/90'}`}>{pl.name}</span>
              <span className="text-xs text-yt-text-secondary truncate">{pl.creator}</span>
            </div>
            {pl.pinned && (
              <Pin className="w-3.5 h-3.5 text-yt-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity rotate-45" />
            )}
          </a>
        ))}
      </div>
      <PlaylistModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreatePlaylist}
        title="Nova Playlist"
      />
    </aside>
  );
}
