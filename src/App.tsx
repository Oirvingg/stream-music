import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const { user, initAuthListener } = useAuthStore();
  const queryClient = useQueryClient();

  // Restaura a sessão salva (token JWT) no carregamento da aplicação
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  // Limpa o cache de playlists/favoritos ao trocar de usuário (logout ou
  // troca de conta) para nunca exibir dados de outra sessão em flash. Só
  // limpa quando havia um usuário real antes — a reidratação inicial da
  // sessão (null -> usuário, ao carregar a página) não deve apagar os dados
  // que acabaram de ser buscados.
  const previousUidRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (previousUidRef.current && previousUidRef.current !== currentUid) {
      queryClient.removeQueries({ queryKey: ['playlists'] });
      queryClient.removeQueries({ queryKey: ['favorites'] });
    }
    previousUidRef.current = currentUid;
  }, [user?.uid, queryClient]);

  return (
    <div className="h-screen w-full flex flex-col bg-yt-black overflow-hidden relative">
      {/* Top area: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Right content column */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
