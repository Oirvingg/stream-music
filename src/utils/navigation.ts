import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Navega para a página de um artista, sincronizando a URL via History API.
 * O app não usa uma lib de rotas (a navegação é toda orientada por estado no
 * Zustand); isso só reflete o id atual na barra de endereço para permitir
 * compartilhar/atualizar o link em /artist/:id.
 */
export function goToArtist(artistId: string) {
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
