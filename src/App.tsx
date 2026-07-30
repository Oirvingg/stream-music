import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Library } from './pages/Library';
import { AuthModal } from './components/auth/AuthModal';
import { usePlayerStore } from './store/usePlayerStore';
import { useAuthStore } from './store/useAuthStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  // Instancia atalhos globais de teclado
  useKeyboardShortcuts();

  const { activePage, activePlaylistId } = usePlayerStore();
  const { initAuthListener } = useAuthStore();

  // Escuta autenticação do Firebase no carregamento da aplicação
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  return (
    <div className="h-screen w-full flex flex-col bg-yt-black overflow-hidden relative">
      {/* Top area: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Right content column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          {!activePlaylistId && activePage === 'EXPLORE' ? <Explore /> : !activePlaylistId && activePage === 'LIBRARY' ? <Library /> : <Home />}
        </div>
      </div>

      {/* Fixed player at bottom */}
      <PlayerBar />
  <BottomNav />

      {/* Modal Global de Autenticação (Login / Cadastro) */}
      <AuthModal />
    </div>
  );
}

export default App;
