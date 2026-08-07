import { useEffect, useRef, useState } from 'react';
import { Search, Cast, LogIn, Menu, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { SearchSuggestions } from './SearchSuggestions';
import { ProfileMenu } from './ProfileMenu';
import { goToSearch } from '../utils/navigation';

export function Header() {
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const { homeSearchQuery, setHomeSearchQuery, setMobileSidebarOpen, activePage } = usePlayerStore();
  const { user, isAuthenticated, setAuthModalOpen } = useAuthStore();

  // Mantém a caixa de busca em sincronia quando a pesquisa é limpa
  // externamente (ex: ao clicar em "Início" na barra lateral).
  useEffect(() => {
    if (homeSearchQuery === '') setQuery('');
  }, [homeSearchQuery]);

  // Foca no input mobile quando ativado
  useEffect(() => {
    if (mobileSearchActive) {
      setTimeout(() => mobileInputRef.current?.focus(), 0);
    }
  }, [mobileSearchActive]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setHomeSearchQuery(query.trim());
      setSuggestionsOpen(false);
    }
  };

  const handleMobileSearchOpen = () => {
    setMobileSearchActive(true);
  };

  const handleMobileSearchClose = () => {
    setMobileSearchActive(false);
    setQuery('');
    setSuggestionsOpen(false);
  };

  const handleClearSearch = () => {
    setQuery('');
  };

  return (
    <>
      <header className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6 gap-2 bg-transparent shrink-0 relative z-30">
        {/* Left — Hamburger + Logo (apenas mobile, a Sidebar já cobre isso no desktop) */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            title="Abrir menu"
            aria-label="Abrir menu"
            data-tour="mobile-menu"
            className="p-2 rounded-full text-yt-text-secondary hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-white">Stream</span>
          </div>
        </div>

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
              onFocus={() => setSuggestionsOpen(true)}
              placeholder="Pesquise músicas, álbuns, artistas, podcasts"
              className="w-full h-10 pl-12 pr-4 bg-yt-search-bg border border-yt-border/50 rounded-lg text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none focus:border-white/30 transition-colors"
            />
            {suggestionsOpen && (
              <SearchSuggestions
                query={query}
                onClose={() => setSuggestionsOpen(false)}
                onSelectTerm={(term) => {
                  setQuery(term);
                  setHomeSearchQuery(term);
                  setSuggestionsOpen(false);
                }}
              />
            )}
          </div>
        </div>

        {/* Right — Actions & User Profile */}
        {/* ml-auto: no mobile, os irmãos (spacer/busca) somem via `hidden`,
            então este é o único filho do header — sem ele, `justify-between`
            não tem o que "espalhar" e o bloco cola na esquerda, empurrando
            o dropdown do usuário (que se abre para a esquerda a partir daqui)
            para fora da tela. */}
        <div className="flex items-center justify-end gap-2 md:gap-3 md:w-48 relative shrink-0 ml-auto">
          {/* Mobile Search Button (apenas mobile) */}
          <button
            onClick={handleMobileSearchOpen}
            className="md:hidden text-yt-text-secondary hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            title="Pesquisar"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5" />
          </button>

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

              {/* Menu de Perfil do Usuário */}
              {showUserMenu && <ProfileMenu onClose={() => setShowUserMenu(false)} />}
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

      {/* Mobile Search Overlay — tela cheia de busca no mobile */}
      {mobileSearchActive && (
        <div className="fixed inset-0 bg-yt-black z-40 flex flex-col md:hidden">
          {/* Search Input Bar */}
          <div className="flex items-center gap-2 px-3 py-3 shrink-0 bg-yt-black border-b border-white/10">
            <button
              onClick={handleMobileSearchClose}
              aria-label="Voltar"
              className="p-2 -ml-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="relative flex-1 min-w-0">
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setSuggestionsOpen(true)}
                placeholder="Pesquise músicas, álbuns, artistas"
                className="w-full h-11 pl-4 pr-10 bg-yt-search-bg border border-yt-border/50 rounded-full text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none focus:border-white/30 transition-colors"
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-yt-text-secondary hover:text-white transition-colors p-1"
                  aria-label="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {suggestionsOpen && (
                <SearchSuggestions
                  query={query}
                  onClose={() => setSuggestionsOpen(false)}
                  onSelectTerm={(term) => {
                    setQuery(term);
                    setHomeSearchQuery(term);
                    setSuggestionsOpen(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto">
            {query.trim() === '' ? (
              <div className="text-center py-12 text-yt-text-secondary">
                <p>Comece a digitar para buscar</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
