import { Home, Compass, Library, Plus } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { UserPlaylist, useUserPlaylists, useCreatePlaylist } from '../hooks/useLibraryQueries';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { PlaylistModal } from './PlaylistModal';
import { useState } from 'react';

export function Sidebar() {
  const { setActivePlaylistId, activePlaylistId, activePage, setActivePage, setSearchQuery } = usePlayerStore();
  const { data: playlists = [] } = useUserPlaylists();
  const createPlaylist = useCreatePlaylist();
  const requireAuth = useRequireAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlaylistClick = (playlist: UserPlaylist, e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(playlist.id);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('HOME');
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('EXPLORE');
  };

  const handleLibraryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('LIBRARY');
  };

  const handleCreatePlaylist = (name: string) => {
    createPlaylist.mutate(name);
  };

  const handleNewPlaylistClick = () => {
    if (!requireAuth()) return;
    setIsModalOpen(true);
  };

  return (
    <aside className="hidden md:block w-[240px] min-w-[240px] h-full flex flex-col bg-transparent select-none">
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
        <a href="#" onClick={handleLibraryClick} data-tour="sidebar-library" className={`flex items-center gap-5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${!activePlaylistId && activePage === 'LIBRARY' ? 'bg-white/10 text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/5'}`}>
          <Library className="w-5 h-5" />
          Biblioteca
        </a>
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3 h-px bg-yt-border/40" />

      {/* New playlist button */}
      <div className="px-4">
        <button onClick={handleNewPlaylistClick} className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-yt-pill hover:bg-yt-surface-hover text-sm text-white font-medium transition-colors">
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
              <span className={`text-sm truncate ${activePlaylistId === pl.id ? 'text-white font-medium' : 'text-white/90'}`}>{pl.title}</span>
              <span className="text-xs text-yt-text-secondary truncate">{pl.tracks.length} músicas</span>
            </div>
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
