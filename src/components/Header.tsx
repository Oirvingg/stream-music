import { useEffect, useState } from 'react';
import { Search, Cast, User, LogOut, LogIn } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

export function Header() {
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { searchQuery, setSearchQuery } = usePlayerStore();
  const { user, isAuthenticated, setAuthModalOpen, logout } = useAuthStore();

  // Mantém a caixa de busca em sincronia quando a pesquisa é limpa
  // externamente (ex: ao clicar em "Início" na barra lateral).
  useEffect(() => {
    if (searchQuery === '') setQuery('');
  }, [searchQuery]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(query.trim());
    }
  };

  return (
    <>
      <header className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6 gap-2 bg-transparent shrink-0 relative z-30">
        {/* Left — Empty spacer (apenas desktop, centraliza a busca) */}
        <div className="hidden md:flex w-32 items-center" />

        {/* Center — Search (apenas desktop; no mobile a busca fica só na Bottom Nav) */}
        <div className="hidden md:block flex-1 min-w-0 md:max-w-[560px] md:mx-auto" data-tour="search-bar">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yt-text-secondary pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Pesquise músicas, álbuns, artistas, podcasts"
              className="w-full h-10 pl-12 pr-4 bg-yt-search-bg border border-yt-border/50 rounded-lg text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Right — Actions & User Profile */}
        <div className="flex items-center justify-end gap-2 md:gap-3 md:w-48 relative shrink-0">
          <button
            className="text-yt-text-secondary hover:text-white transition-colors p-1.5 rounded-full hover:bg-yt-surface"
            title="Transmitir"
          >
            <Cast className="w-5 h-5" />
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-yt-surface hover:bg-yt-surface-hover border border-white/10 transition-all focus:outline-none"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-white max-w-[100px] truncate">
                  {user.displayName || 'Minha Conta'}
                </span>
              </button>

              {/* Dropdown Menu do Usuário */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-yt-text-secondary truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
}
