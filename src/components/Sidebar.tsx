import { Home, Compass, Library, Plus, Menu, LucideIcon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { UserPlaylist, useUserPlaylists, useCreatePlaylist } from '../hooks/useLibraryQueries';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { PlaylistModal } from './PlaylistModal';
import { goToHome, goToExplore, goToLibrary, goToUserPlaylist } from '../utils/navigation';
import { useState } from 'react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: (e: React.MouseEvent) => void;
  dataTour?: string;
}

function NavItem({ icon: Icon, label, active, collapsed, onClick, dataTour }: NavItemProps) {
  return (
    <a
      href="#"
      onClick={onClick}
      data-tour={dataTour}
      className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors ${
        collapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-5 px-4 py-2.5'
      } ${active ? 'bg-white/10 text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && label}

      {/* Tooltip no modo comprimido */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#212121] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
          {label}
        </span>
      )}
    </a>
  );
}

export function Sidebar() {
  const { activePlaylistId, activePage, isSidebarCollapsed, toggleSidebarCollapsed } = usePlayerStore();
  const { data: playlists = [] } = useUserPlaylists();
  const createPlaylist = useCreatePlaylist();
  const requireAuth = useRequireAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlaylistClick = (playlist: UserPlaylist, e: React.MouseEvent) => {
    e.preventDefault();
    goToUserPlaylist(playlist.id);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToHome();
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToExplore();
  };

  const handleLibraryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToLibrary();
  };

  const handleCreatePlaylist = (name: string) => {
    createPlaylist.mutate(name);
  };

  const handleNewPlaylistClick = () => {
    if (!requireAuth()) return;
    setIsModalOpen(true);
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-transparent select-none shrink-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16 min-w-16' : 'w-64 min-w-64'
      }`}
    >
      {/* Topo: botão hamburger + logo */}
      <div className={`flex items-center h-14 shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white truncate">Music</span>
          </div>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className="p-2.5 rounded-full text-yt-text-secondary hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Main nav */}
      <nav className={`flex flex-col gap-1 mt-2 ${isSidebarCollapsed ? 'px-2' : 'px-2'}`}>
        <NavItem
          icon={Home}
          label="Início"
          active={!activePlaylistId && activePage === 'HOME'}
          collapsed={isSidebarCollapsed}
          onClick={handleHomeClick}
        />
        <NavItem
          icon={Compass}
          label="Explorar"
          active={!activePlaylistId && activePage === 'EXPLORE'}
          collapsed={isSidebarCollapsed}
          onClick={handleExploreClick}
        />
        <NavItem
          icon={Library}
          label="Biblioteca"
          active={!activePlaylistId && activePage === 'LIBRARY'}
          collapsed={isSidebarCollapsed}
          onClick={handleLibraryClick}
          dataTour="sidebar-library"
        />
      </nav>

      {isSidebarCollapsed ? (
        <div className="flex-1" />
      ) : (
        <>
          {/* Divider */}
          <div className="mx-5 my-3 h-px bg-yt-border/40 shrink-0" />

          {/* New playlist button */}
          <div className="px-4 shrink-0">
            <button
              onClick={handleNewPlaylistClick}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-full bg-yt-pill hover:bg-yt-surface-hover text-sm text-white font-medium transition-colors"
            >
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
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors group ${
                  activePlaylistId === pl.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-sm truncate ${activePlaylistId === pl.id ? 'text-white font-medium' : 'text-white/90'}`}>
                    {pl.title}
                  </span>
                  <span className="text-xs text-yt-text-secondary truncate">{pl.tracks.length} músicas</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <PlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreatePlaylist}
        title="Nova Playlist"
      />
    </aside>
  );
}
