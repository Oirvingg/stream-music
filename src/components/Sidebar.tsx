import { useState } from 'react';
import { Home, Compass, Library, Plus, Menu, LucideIcon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { UserPlaylist, useUserPlaylists, useCreatePlaylist } from '../hooks/useLibraryQueries';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { PlaylistModal } from './PlaylistModal';
import { goToHome, goToExplore, goToLibrary, goToUserPlaylist } from '../utils/navigation';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  dataTour?: string;
}

function NavItem({ icon: Icon, label, active, onClick, dataTour }: NavItemProps) {
  return (
    <a
      href="#"
      onClick={onClick}
      data-tour={dataTour}
      className={`flex items-center gap-5 w-full px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

interface NavItemCompactProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  dataTour?: string;
}

function NavItemCompact({ icon: Icon, label, active, onClick, dataTour }: NavItemCompactProps) {
  return (
    <a
      href="#"
      onClick={onClick}
      data-tour={dataTour}
      className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-lg transition-colors ${
        active ? 'text-white' : 'text-yt-text-secondary hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] leading-tight font-medium truncate max-w-full px-1">
        {label}
      </span>
    </a>
  );
}

export function PlaylistSubtitle({
  playlist,
  userDisplayName,
}: {
  playlist: UserPlaylist;
  userDisplayName: string | null;
}) {
  if (playlist.description && playlist.description.trim()) {
    return <span className="text-xs text-yt-text-secondary truncate">{playlist.description}</span>;
  }
  if (playlist.id === 'favorites' || /curtid|músicas que gostei/i.test(playlist.title)) {
    return <span className="text-xs text-yt-text-secondary truncate">Playlist automática</span>;
  }
  const subtitle = userDisplayName ? `Playlist · ${userDisplayName}` : 'Playlist';
  return <span className="text-xs text-yt-text-secondary truncate">{subtitle}</span>;
}

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className={`flex items-center h-16 shrink-0 ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
      <button
        onClick={onToggle}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="p-2.5 rounded-full text-yt-text-secondary hover:text-white hover:bg-white/10 transition-colors shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>
      {!collapsed && (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white truncate">Music</span>
        </div>
      )}
    </div>
  );
}

interface SidebarContentProps {
  activePlaylistId: string | null;
  activePage: 'HOME' | 'EXPLORE' | 'LIBRARY' | 'SEARCH' | 'HISTORY';
  onNavigate: () => void;
  collapsed?: boolean;
}

export function SidebarContent({ activePlaylistId, activePage, onNavigate, collapsed = false }: SidebarContentProps) {
  const { data: playlists = [] } = useUserPlaylists();
  const createPlaylist = useCreatePlaylist();
  const requireAuth = useRequireAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToHome();
    onNavigate();
  };
  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToExplore();
    onNavigate();
  };
  const handleLibraryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToLibrary();
    onNavigate();
  };
  const handlePlaylistClick = (playlist: UserPlaylist, e: React.MouseEvent) => {
    e.preventDefault();
    goToUserPlaylist(playlist.id);
    onNavigate();
  };

  const handleNewPlaylistClick = () => {
    if (!requireAuth()) return;
    setIsModalOpen(true);
  };

  const handleCreatePlaylist = (name: string) => {
    createPlaylist.mutate(name);
  };

  const userDisplayName = user?.displayName ?? null;

  // Compacto: só ícones + rótulo abaixo, sem divider/lista/nova playlist
  if (collapsed) {
    return (
      <>
        <nav className="flex flex-col gap-1 px-1 mt-1">
          <NavItemCompact
            icon={Home}
            label="Início"
            active={!activePlaylistId && activePage === 'HOME'}
            onClick={handleHomeClick}
          />
          <NavItemCompact
            icon={Compass}
            label="Explorar"
            active={!activePlaylistId && activePage === 'EXPLORE'}
            onClick={handleExploreClick}
          />
          <NavItemCompact
            icon={Library}
            label="Biblioteca"
            active={!activePlaylistId && activePage === 'LIBRARY'}
            onClick={handleLibraryClick}
            dataTour="sidebar-library"
          />
        </nav>
        <div className="flex-1" />
        <PlaylistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreatePlaylist}
          title="Nova Playlist"
        />
      </>
    );
  }

  // Expandido: nav horizontal largo + divider + nova playlist + lista rolável
  return (
    <>
      <nav className="flex flex-col gap-1 px-2 mt-1">
        <NavItem
          icon={Home}
          label="Início"
          active={!activePlaylistId && activePage === 'HOME'}
          onClick={handleHomeClick}
        />
        <NavItem
          icon={Compass}
          label="Explorar"
          active={!activePlaylistId && activePage === 'EXPLORE'}
          onClick={handleExploreClick}
        />
        <NavItem
          icon={Library}
          label="Biblioteca"
          active={!activePlaylistId && activePage === 'LIBRARY'}
          onClick={handleLibraryClick}
          dataTour="sidebar-library"
        />
      </nav>

      {/* Divider fino */}
      <div className="mx-4 mt-3 border-t border-white/10 shrink-0" />

      {/* Botão destacado + Nova playlist */}
      <div className="px-4 pt-3 shrink-0">
        <button
          onClick={handleNewPlaylistClick}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Nova playlist
        </button>
      </div>

      {/* Lista rolável de playlists do usuário */}
      <div className="flex-1 overflow-y-auto mt-2 px-2 pb-2">
        {playlists.map((pl) => (
          <a
            key={pl.id}
            href="#"
            onClick={(e) => handlePlaylistClick(pl, e)}
            className={`flex flex-col px-4 py-2 rounded-lg transition-colors group ${
              activePlaylistId === pl.id ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <span
              className={`text-sm truncate ${
                activePlaylistId === pl.id ? 'text-white font-medium' : 'text-white/90'
              }`}
            >
              {pl.title}
            </span>
            <PlaylistSubtitle playlist={pl} userDisplayName={userDisplayName} />
          </a>
        ))}
      </div>

      <PlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreatePlaylist}
        title="Nova Playlist"
      />
    </>
  );
}

export function Sidebar() {
  const { activePlaylistId, activePage, isSidebarCollapsed, toggleSidebarCollapsed } = usePlayerStore();

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-transparent select-none shrink-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-[72px] min-w-[72px]' : 'w-[240px] min-w-[240px]'
      }`}
    >
      <SidebarHeader collapsed={isSidebarCollapsed} onToggle={toggleSidebarCollapsed} />
      <SidebarContent
        activePlaylistId={activePlaylistId}
        activePage={activePage}
        collapsed={isSidebarCollapsed}
        onNavigate={() => {}}
      />
    </aside>
  );
}
