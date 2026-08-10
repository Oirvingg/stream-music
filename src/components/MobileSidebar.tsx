import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SidebarContent } from './Sidebar';

export function MobileSidebar() {
  const { isMobileSidebarOpen, setMobileSidebarOpen, activePlaylistId, activePage } = usePlayerStore();

  // Trava o scroll do body quando o drawer está aberto
  useEffect(() => {
    if (isMobileSidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileSidebarOpen]);

  // Fecha o drawer com a tecla Escape
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobileSidebarOpen, setMobileSidebarOpen]);

  return (
    <>
      {/* Overlay preto semi-transparente — visível apenas quando aberto */}
      <div
        onClick={() => setMobileSidebarOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer lateral */}
      <aside
        data-tour="sidebar-library-mobile"
        className={`md:hidden fixed top-0 left-0 z-50 h-dvh w-[280px] max-w-[85vw] flex flex-col bg-yt-black select-none transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo: hamburger + logo */}
        <div className="flex items-center h-16 shrink-0 px-4 gap-3">
          <button
            onClick={() => setMobileSidebarOpen(false)}
            title="Fechar menu"
            aria-label="Fechar menu"
            className="p-2.5 rounded-full text-yt-text-secondary hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white truncate">Music</span>
          </div>
        </div>

        {/* Conteúdo — sempre expandido no drawer mobile */}
        <SidebarContent
          activePlaylistId={activePlaylistId}
          activePage={activePage}
          collapsed={false}
          onNavigate={() => setMobileSidebarOpen(false)}
        />
      </aside>
    </>
  );
}
