import { Track } from '../types/music';

// Em desenvolvimento (sem VITE_API_URL definida), usamos o proxy local do
// vite.config.ts para evitar CORS. Em produção, apontamos para o backend
// deployado no Render, que expõe a mesma rota /api/deezer como proxy do Deezer.
const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_URL}/api/deezer`;

/**
 * Mapeia a resposta do Deezer para a nossa interface Track rigorosamente.
 */
/**
 * Faz o fetch e tenta parsear a resposta como JSON, tolerando corpos vazios
 * ou respostas de erro que não sejam JSON válido (ex: proxy fora do ar).
 */
const fetchDeezerJson = async (url: string): Promise<any | null> => {
  const response = await fetch(url);
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do Deezer (status ${response.status})`);
  }
};

const mapDeezerTrack = (track: any): Track => ({
  id: String(track.id),
  title: track.title,
  artist: track.artist.name,
  album: track.album?.title || 'Unknown Album',
  coverUrl: track.album?.cover_xl || track.album?.cover_medium || track.album?.cover || '',
  audioUrl: track.preview || '', // Preview de 30 segundos
  duration: track.duration || 0,
});

/**
 * Pesquisa músicas pelo texto (query).
 */
export const searchTracks = async (query: string): Promise<Track[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=20`);

    if (!data?.data) return [];

    return data.data.map(mapDeezerTrack);
  } catch (error) {
    console.error('Erro ao pesquisar no Deezer:', error);
    return [];
  }
};

/**
 * Busca as músicas mais populares no momento.
 * No Deezer, usamos a rota /chart/0/tracks para o chart global.
 */
export const fetchGlobalTrending = async (): Promise<Track[]> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/chart/0/tracks?limit=50`);

    if (!data?.data) return [];

    return data.data.map(mapDeezerTrack);
  } catch (error) {
    console.error('Erro ao buscar trending no Deezer:', error);
    return [];
  }
};

/**
 * Busca músicas ricas de um gênero específico procurando por playlists populares
 * do gênero e retornando as faixas (limitado a 50).
 */
export const fetchGenreTracks = async (genreName: string): Promise<Track[]> => {
  try {
    // 1. Pesquisa por uma playlist com o nome do gênero
    const plData = await fetchDeezerJson(`${BASE_URL}/search/playlist?q=${encodeURIComponent(genreName)}&limit=1`);

    if (plData?.data && plData.data.length > 0) {
      const playlistId = plData.data[0].id;
      // 2. Busca as faixas dessa playlist
      const tracksData = await fetchDeezerJson(`${BASE_URL}/playlist/${playlistId}/tracks?limit=50`);

      if (tracksData?.data) {
        return tracksData.data.map(mapDeezerTrack);
      }
    }

    // Fallback para pesquisa de texto se não encontrar playlist
    const fallbackData = await fetchDeezerJson(`${BASE_URL}/search?q=${encodeURIComponent(genreName)}&limit=50`);
    return fallbackData?.data ? fallbackData.data.map(mapDeezerTrack) : [];
  } catch (error) {
    console.error('Erro ao buscar faixas por gênero:', error);
    return [];
  }
};
