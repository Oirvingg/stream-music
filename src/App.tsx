import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { SplashScreen } from './components/SplashScreen';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { History } from './pages/History';
import { ArtistPage } from './pages/ArtistPage';
import { AlbumPage } from './pages/AlbumPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { usePlayerStore } from './store/usePlayerStore';
import { useAuthStore } from './store/useAuthStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getArtistIdFromPath, getAlbumIdFromPath, getPlaylistIdFromPath } from './utils/navigation';

function App() {
  // Instancia atalhos globais de teclado
  useKeyboardShortcuts();

  // Splash screen de entrada, exibida durante a inicialização do app
  const [showSplash, setShowSplash] = useState(true);

  const {
    activePage, activePlaylistId, activeArtistId, activeAlbumId, activePublicPlaylistId,
    setActiveArtistId, setActiveAlbumId, setActivePublicPlaylistId,
  } = usePlayerStore();
  const { user, initAuthListener } = useAuthStore();
  const queryClient = useQueryClient();

  // Sincroniza as páginas de detalhe (artista/álbum/playlist) com a URL
  // (/artist/:id, /album/:id, /playlist/:id), tanto ao carregar/atualizar a
  // página diretamente nesses links quanto ao navegar com os botões
  // voltar/avançar do navegador.
  useEffect(() => {
    const syncFromPath = () => {
      const pathname = window.location.pathname;
      setActiveArtistId(getArtistIdFromPath(pathname));
      setActiveAlbumId(getAlbumIdFromPath(pathname));
      setActivePublicPlaylistId(getPlaylistIdFromPath(pathname));
    };

    syncFromPath();

    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [setActiveArtistId, setActiveAlbumId, setActivePublicPlaylistId]);

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
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className={`h-dvh w-full flex flex-col bg-yt-black overflow-hidden relative ${showSplash ? 'invisible' : ''}`}>
        {/* Top area: sidebar + content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Right content column */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Header />
            {activeAlbumId ? (
              <AlbumPage albumId={activeAlbumId} />
            ) : activePublicPlaylistId ? (
              <PlaylistPage playlistId={activePublicPlaylistId} />
            ) : activeArtistId ? (
              <ArtistPage artistId={activeArtistId} />
            ) : !activePlaylistId && activePage === 'EXPLORE' ? (
              <Explore />
            ) : !activePlaylistId && activePage === 'SEARCH' ? (
              <Search />
            ) : !activePlaylistId && activePage === 'LIBRARY' ? (
              <Library />
            ) : !activePlaylistId && activePage === 'HISTORY' ? (
              <History />
            ) : (
              <Home />
            )}
          </div>
        </div>

        {/* Fixed player at bottom */}
        <PlayerBar />
        <BottomNav />

        {/* Modal Global de Autenticação (Login / Cadastro) */}
        <AuthModal />

        {/* Onboarding Interativo (Guided Tour) — apenas no primeiro login */}
        <OnboardingTour />
      </div>
    </>
  );
}

export default App;
