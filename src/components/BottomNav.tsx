import { Home, Search, Library, User } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export function BottomNav() {
  const { activePage, setActivePage, activePlaylistId, setActivePlaylistId, isExpanded, setSearchQuery } = usePlayerStore();
  const { isAuthenticated, setAuthModalOpen, isAuthModalOpen } = useAuthStore();

  // Esconde a barra inferior em modais full screen (como o player expandido)
  if (isExpanded) return null;

  const handleHome = () => {
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('HOME');
  };

  const handleSearch = () => {
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('EXPLORE');
  };

  const handleLibrary = () => {
    setActivePlaylistId(null);
    setSearchQuery('');
    setActivePage('LIBRARY');
  };

  const handleUser = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, 'login');
    } else {
      // Se autenticado, pode abrir modal ou ir para biblioteca
      setActivePlaylistId(null);
      setSearchQuery('');
      setActivePage('LIBRARY');
    }
  };

  const isHomeActive = !activePlaylistId && activePage === 'HOME';
  const isSearchActive = !activePlaylistId && activePage === 'EXPLORE';
  const isLibraryActive = !activePlaylistId && activePage === 'LIBRARY';
  const isUserActive = isAuthModalOpen;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/10 z-50 flex md:hidden items-center justify-around px-2 select-none">
      {/* 1. Início */}
      <button
        onClick={handleHome}
        aria-label="Início"
        className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition-all duration-200 active:scale-95 ${
          isHomeActive ? 'text-white font-semibold' : 'text-yt-text-secondary hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 transition-transform duration-200 ${isHomeActive ? 'scale-110 text-red-500' : ''}`} />
        <span className="text-[11px] leading-tight mt-1">Início</span>
      </button>

      {/* 2. Buscar */}
      <button
        onClick={handleSearch}
        aria-label="Buscar"
        className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition-all duration-200 active:scale-95 ${
          isSearchActive ? 'text-white font-semibold' : 'text-yt-text-secondary hover:text-white'
        }`}
      >
        <Search className={`w-5 h-5 transition-transform duration-200 ${isSearchActive ? 'scale-110 text-red-500' : ''}`} />
        <span className="text-[11px] leading-tight mt-1">Buscar</span>
      </button>

      {/* 3. Biblioteca */}
      <button
        onClick={handleLibrary}
        aria-label="Biblioteca"
        className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition-all duration-200 active:scale-95 ${
          isLibraryActive ? 'text-white font-semibold' : 'text-yt-text-secondary hover:text-white'
        }`}
      >
        <Library className={`w-5 h-5 transition-transform duration-200 ${isLibraryActive ? 'scale-110 text-red-500' : ''}`} />
        <span className="text-[11px] leading-tight mt-1">Biblioteca</span>
      </button>

      {/* 4. Perfil / Login */}
      <button
        onClick={handleUser}
        aria-label="Perfil"
        className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition-all duration-200 active:scale-95 ${
          isUserActive ? 'text-white font-semibold' : 'text-yt-text-secondary hover:text-white'
        }`}
      >
        <User className={`w-5 h-5 transition-transform duration-200 ${isUserActive ? 'scale-110 text-red-500' : ''}`} />
        <span className="text-[11px] leading-tight mt-1">{isAuthenticated ? 'Perfil' : 'Login'}</span>
      </button>
    </nav>
  );
}
