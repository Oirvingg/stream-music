import { Track } from '../types/music';

// Usamos o proxy local configurado no vite.config.ts para evitar erros de CORS.
// Em produção, isso precisaria ser um backend real ou serviço equivalente.
const BASE_URL = '/api/deezer';

/**
 * Mapeia a resposta do Deezer para a nossa interface Track rigorosamente.
 */
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
    const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();

    if (!data.data) return [];

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
    const response = await fetch(`${BASE_URL}/chart/0/tracks?limit=50`);
    const data = await response.json();

    if (!data.data) return [];

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
    const plResponse = await fetch(`${BASE_URL}/search/playlist?q=${encodeURIComponent(genreName)}&limit=1`);
    const plData = await plResponse.json();
    
    if (plData.data && plData.data.length > 0) {
      const playlistId = plData.data[0].id;
      // 2. Busca as faixas dessa playlist
      const tracksResponse = await fetch(`${BASE_URL}/playlist/${playlistId}/tracks?limit=50`);
      const tracksData = await tracksResponse.json();
      
      if (tracksData.data) {
        return tracksData.data.map(mapDeezerTrack);
      }
    }
    
    // Fallback para pesquisa de texto se não encontrar playlist
    const fallbackResponse = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(genreName)}&limit=50`);
    const fallbackData = await fallbackResponse.json();
    return fallbackData.data ? fallbackData.data.map(mapDeezerTrack) : [];
  } catch (error) {
    console.error('Erro ao buscar faixas por gênero:', error);
    return [];
  }
};
