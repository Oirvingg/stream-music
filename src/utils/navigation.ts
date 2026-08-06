import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Zera todas as páginas de detalhe (artista/álbum/playlist) antes de navegar
 * para uma nova, já que só uma pode ficar ativa por vez.
 */
function clearDetailRoutes() {
  const store = usePlayerStore.getState();
  store.setActiveArtistId(null);
  store.setActiveAlbumId(null);
  store.setActivePublicPlaylistId(null);
}

/**
 * Se a navegação para uma página de detalhe (artista/álbum/playlist) parte
 * da aba Buscar, guarda um retrato dela em `searchDetailSnapshot` — é o que
 * permite restaurar essa mesma tela ao voltar para a aba Buscar pela Bottom
 * Nav, em vez de sempre reiniciar na busca zerada.
 */
function snapshotSearchDetail(type: 'artist' | 'album' | 'playlist', id: string) {
  const store = usePlayerStore.getState();
  if (store.activePage === 'SEARCH') {
    store.setSearchDetailSnapshot({ type, id });
  }
}

/**
 * Navega para a página de um artista, sincronizando a URL via History API.
 * O app não usa uma lib de rotas (a navegação é toda orientada por estado no
 * Zustand); isso só reflete o id atual na barra de endereço para permitir
 * compartilhar/atualizar o link em /artist/:id.
 */
export function goToArtist(artistId: string) {
  clearDetailRoutes();
  usePlayerStore.getState().setActiveArtistId(artistId);
  window.history.pushState({}, '', `/artist/${artistId}`);
  snapshotSearchDetail('artist', artistId);
}

export function goBackFromArtist() {
  const store = usePlayerStore.getState();
  store.setActiveArtistId(null);
  // Volta explicitamente feita dentro da aba Buscar: a tela de detalhe foi
  // fechada de propósito, então não deve ser restaurada da próxima vez que
  // o usuário reentrar nessa aba pela Bottom Nav.
  if (store.activePage === 'SEARCH') {
    store.setSearchDetailSnapshot(null);
  }
  window.history.pushState({}, '', '/');
}

/**
 * Extrai o id do artista do caminho atual (`/artist/:id`), se houver.
 */
export function getArtistIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/artist\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Navega para a página de detalhes de um álbum (`/album/:id`).
 */
export function goToAlbum(albumId: string) {
  clearDetailRoutes();
  usePlayerStore.getState().setActiveAlbumId(albumId);
  window.history.pushState({}, '', `/album/${albumId}`);
  snapshotSearchDetail('album', albumId);
}

export function goBackFromAlbum() {
  const store = usePlayerStore.getState();
  store.setActiveAlbumId(null);
  if (store.activePage === 'SEARCH') {
    store.setSearchDetailSnapshot(null);
  }
  window.history.pushState({}, '', '/');
}

/**
 * Extrai o id do álbum do caminho atual (`/album/:id`), se houver.
 */
export function getAlbumIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/album\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Navega para a página de detalhes de uma playlist pública do Deezer
 * (`/playlist/:id`). Distinta das playlists do usuário na Biblioteca, que
 * usam `activePlaylistId`.
 */
export function goToPlaylist(playlistId: string) {
  clearDetailRoutes();
  usePlayerStore.getState().setActivePublicPlaylistId(playlistId);
  window.history.pushState({}, '', `/playlist/${playlistId}`);
  snapshotSearchDetail('playlist', playlistId);
}

export function goBackFromPlaylist() {
  const store = usePlayerStore.getState();
  store.setActivePublicPlaylistId(null);
  if (store.activePage === 'SEARCH') {
    store.setSearchDetailSnapshot(null);
  }
  window.history.pushState({}, '', '/');
}

/**
 * Extrai o id da playlist do caminho atual (`/playlist/:id`), se houver.
 */
export function getPlaylistIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/playlist\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Navega para uma playlist do usuário (Biblioteca), fechando qualquer página
 * de detalhe (artista/álbum/playlist pública) que esteja sobreposta. Distinta
 * de `goToPlaylist` (playlists públicas do Deezer, com rota própria) — a
 * playlist do usuário é renderizada dentro da Home a partir de
 * `activePlaylistId`, sem rota dedicada.
 */
export function goToUserPlaylist(playlistId: string) {
  clearDetailRoutes();
  usePlayerStore.getState().setActivePlaylistId(playlistId);
  window.history.pushState({}, '', '/');
}

/**
 * Navega para a Home (`/`), fechando qualquer página de detalhe
 * (artista/álbum/playlist) que esteja sobreposta — usada pelo "Início" da
 * Sidebar e da Bottom Nav, que precisam funcionar a partir de qualquer tela.
 */
export function goToHome() {
  clearDetailRoutes();
  const store = usePlayerStore.getState();
  store.setActivePlaylistId(null);
  store.setHomeSearchQuery('');
  store.setActivePage('HOME');
  window.history.pushState({}, '', '/');
}

/**
 * Navega para Explorar (`/explore`), fechando qualquer página de detalhe
 * (artista/álbum/playlist) que esteja sobreposta.
 */
export function goToExplore() {
  clearDetailRoutes();
  const store = usePlayerStore.getState();
  store.setActivePlaylistId(null);
  store.setHomeSearchQuery('');
  store.setActivePage('EXPLORE');
  window.history.pushState({}, '', '/explore');
}

/**
 * Navega para a Biblioteca (`/library`), fechando qualquer página de
 * detalhe (artista/álbum/playlist) que esteja sobreposta.
 */
export function goToLibrary() {
  clearDetailRoutes();
  const store = usePlayerStore.getState();
  store.setActivePlaylistId(null);
  store.setHomeSearchQuery('');
  store.setActivePage('LIBRARY');
  window.history.pushState({}, '', '/library');
}

/**
 * Navega para o Histórico de reprodução (`/history`), fechando qualquer
 * página de detalhe (artista/álbum/playlist) que esteja sobreposta. Acessada
 * pelo menu de perfil (avatar) no cabeçalho.
 */
export function goToHistory() {
  clearDetailRoutes();
  const store = usePlayerStore.getState();
  store.setActivePlaylistId(null);
  store.setHomeSearchQuery('');
  store.setActivePage('HISTORY');
  window.history.pushState({}, '', '/history');
}

/**
 * Navega para a tela dedicada de Pesquisa (`/search`), usada pela lupa da
 * Bottom Nav e pela barra de busca do Header no mobile. Distinta de
 * "Explorar" (Gêneros e Momentos).
 *
 * Replica o comportamento de apps como Spotify/YT Music: tocar na aba
 * Buscar vindo de outra aba retoma a tela exatamente como foi deixada
 * (inclusive uma página de artista/álbum/playlist aberta a partir da
 * busca, via `searchDetailSnapshot`); só reseta a busca (query, filtro e
 * qualquer detalhe aberto) quando o usuário já está na aba Buscar e toca
 * nela de novo — o 2º toque consecutivo.
 */
export function goToSearch() {
  const store = usePlayerStore.getState();
  const alreadyOnSearchTab = store.activePage === 'SEARCH';

  if (alreadyOnSearchTab) {
    clearDetailRoutes();
    store.setSearchDetailSnapshot(null);
    store.setActivePlaylistId(null);
    store.setSearchQuery('');
    store.setSearchActiveFilter('Tudo');
    store.setHomeSearchQuery('');
    store.setActivePage('SEARCH');
    window.history.pushState({}, '', '/search');
    return;
  }

  clearDetailRoutes();
  store.setActivePlaylistId(null);
  store.setHomeSearchQuery('');
  store.setActivePage('SEARCH');

  const snapshot = store.searchDetailSnapshot;
  if (snapshot) {
    if (snapshot.type === 'artist') {
      store.setActiveArtistId(snapshot.id);
      window.history.pushState({}, '', `/artist/${snapshot.id}`);
    } else if (snapshot.type === 'album') {
      store.setActiveAlbumId(snapshot.id);
      window.history.pushState({}, '', `/album/${snapshot.id}`);
    } else {
      store.setActivePublicPlaylistId(snapshot.id);
      window.history.pushState({}, '', `/playlist/${snapshot.id}`);
    }
    return;
  }

  window.history.pushState({}, '', '/search');
}

export function goBackFromSearch() {
  const store = usePlayerStore.getState();
  store.setSearchQuery('');
  store.setSearchActiveFilter('Tudo');
  store.setSearchDetailSnapshot(null);
  store.setActivePage('HOME');
  window.history.pushState({}, '', '/');
}
