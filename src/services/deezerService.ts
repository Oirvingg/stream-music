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
  artist: track.artist
    ? {
        id: String(track.artist.id),
        name: track.artist.name,
        imageUrl: track.artist.picture_medium || track.artist.picture,
      }
    : 'Artista desconhecido',
  album: track.album?.title || 'Unknown Album',
  coverUrl: track.album?.cover_xl || track.album?.cover_medium || track.album?.cover || '',
  audioUrl: track.preview || '', // Preview de 30 segundos
  duration: track.duration || 0,
  rank: track.rank,
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

export interface DeezerArtistDetails {
  id: string;
  name: string;
  pictureXl: string;
  nbFans: number;
  nbAlbums: number;
}

export interface DeezerArtistSummary {
  id: string;
  name: string;
  pictureMedium: string;
}

export interface DeezerAlbum {
  id: string;
  title: string;
  coverXl: string;
  releaseYear: string;
  recordType: string;
}

const mapArtistSummary = (artist: any): DeezerArtistSummary => ({
  id: String(artist.id),
  name: artist.name,
  pictureMedium: artist.picture_medium || artist.picture || '',
});

const mapAlbum = (album: any): DeezerAlbum => ({
  id: String(album.id),
  title: album.title,
  coverXl: album.cover_xl || album.cover_medium || album.cover || '',
  releaseYear: album.release_date ? String(album.release_date).slice(0, 4) : '',
  recordType: album.record_type || 'album',
});

/**
 * Busca os detalhes públicos de um artista (nome, foto em alta resolução, fãs).
 */
export const fetchArtistById = async (artistId: string): Promise<DeezerArtistDetails | null> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/artist/${artistId}`);
    if (!data || data.error) return null;

    return {
      id: String(data.id),
      name: data.name,
      pictureXl: data.picture_xl || data.picture_big || data.picture_medium || '',
      nbFans: data.nb_fan || 0,
      nbAlbums: data.nb_album || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar artista no Deezer:', error);
    return null;
  }
};

/**
 * Busca as faixas mais populares de um artista.
 */
export const fetchArtistTopTracks = async (artistId: string, limit = 10): Promise<Track[]> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/artist/${artistId}/top?limit=${limit}`);
    return data?.data ? data.data.map(mapDeezerTrack) : [];
  } catch (error) {
    console.error('Erro ao buscar top faixas do artista:', error);
    return [];
  }
};

/**
 * Busca a discografia de um artista, separada em álbuns e singles/EPs
 * com base no campo `record_type` retornado pelo Deezer.
 */
export const fetchArtistAlbums = async (
  artistId: string
): Promise<{ albums: DeezerAlbum[]; singles: DeezerAlbum[] }> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/artist/${artistId}/albums?limit=50`);
    const items: DeezerAlbum[] = data?.data ? data.data.map(mapAlbum) : [];

    return {
      albums: items.filter((a) => a.recordType === 'album'),
      singles: items.filter((a) => a.recordType === 'single' || a.recordType === 'ep'),
    };
  } catch (error) {
    console.error('Erro ao buscar discografia do artista:', error);
    return { albums: [], singles: [] };
  }
};

export interface DeezerArtistSearchResult {
  id: string;
  name: string;
  pictureMedium: string;
  pictureXl: string;
  nbFans: number;
}

const mapArtistSearchResult = (artist: any): DeezerArtistSearchResult => ({
  id: String(artist.id),
  name: artist.name,
  pictureMedium: artist.picture_medium || artist.picture || '',
  pictureXl: artist.picture_xl || artist.picture_big || artist.picture_medium || '',
  nbFans: artist.nb_fan || 0,
});

/**
 * Pesquisa artistas pelo texto livre. Usado para destacar o artista mais
 * relevante (top result) na tela de resultados de pesquisa, no estilo YT Music.
 */
export const searchArtists = async (query: string): Promise<DeezerArtistSearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search/artist?q=${encodeURIComponent(query)}&limit=5`);
    if (!data?.data) return [];

    return data.data.map(mapArtistSearchResult);
  } catch (error) {
    console.error('Erro ao pesquisar artistas no Deezer:', error);
    return [];
  }
};

/**
 * Busca artistas parecidos/relacionados a um artista.
 */
export const fetchRelatedArtists = async (artistId: string): Promise<DeezerArtistSummary[]> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/artist/${artistId}/related?limit=12`);
    return data?.data ? data.data.map(mapArtistSummary) : [];
  } catch (error) {
    console.error('Erro ao buscar artistas parecidos:', error);
    return [];
  }
};

/**
 * Busca as faixas de um álbum específico (usado para tocar um álbum inteiro).
 * Usamos o endpoint de detalhes do álbum (não `/tracks`) porque as faixas
 * aninhadas não trazem `album.cover`/`album.title` — precisamos deles do pai.
 */
export const fetchAlbumTracks = async (albumId: string): Promise<Track[]> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/album/${albumId}`);
    if (!data || data.error) return [];

    const coverUrl = data.cover_xl || data.cover_medium || data.cover || '';
    const albumTitle = data.title || 'Unknown Album';
    const items: any[] = data.tracks?.data || [];

    return items.map((track) => ({
      ...mapDeezerTrack(track),
      album: albumTitle,
      coverUrl,
    }));
  } catch (error) {
    console.error('Erro ao buscar faixas do álbum:', error);
    return [];
  }
};
