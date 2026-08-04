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
 * Navega para a página de um artista, sincronizando a URL via History API.
 * O app não usa uma lib de rotas (a navegação é toda orientada por estado no
 * Zustand); isso só reflete o id atual na barra de endereço para permitir
 * compartilhar/atualizar o link em /artist/:id.
 */
export function goToArtist(artistId: string) {
  clearDetailRoutes();
  usePlayerStore.getState().setActiveArtistId(artistId);
  window.history.pushState({}, '', `/artist/${artistId}`);
}

export function goBackFromArtist() {
  usePlayerStore.getState().setActiveArtistId(null);
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
}

export function goBackFromAlbum() {
  usePlayerStore.getState().setActiveAlbumId(null);
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
}

export function goBackFromPlaylist() {
  usePlayerStore.getState().setActivePublicPlaylistId(null);
  window.history.pushState({}, '', '/');
}

/**
 * Extrai o id da playlist do caminho atual (`/playlist/:id`), se houver.
 */
export function getPlaylistIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/playlist\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
