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
 * relevante (top result) na tela de resultados de pesquisa, no estilo YT Music,
 * e também para alimentar a grade do filtro "Artistas".
 */
export const searchArtists = async (query: string, limit = 5): Promise<DeezerArtistSearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!data?.data) return [];

    return data.data.map(mapArtistSearchResult);
  } catch (error) {
    console.error('Erro ao pesquisar artistas no Deezer:', error);
    return [];
  }
};

export interface DeezerPlaylistSearchResult {
  id: string;
  title: string;
  pictureMedium: string;
  nbTracks: number;
  creatorName: string;
}

const mapPlaylistSearchResult = (playlist: any): DeezerPlaylistSearchResult => ({
  id: String(playlist.id),
  title: playlist.title,
  pictureMedium: playlist.picture_medium || playlist.picture || '',
  nbTracks: playlist.nb_tracks || 0,
  creatorName: playlist.user?.name || '',
});

/**
 * Pesquisa playlists públicas pelo texto livre, para o filtro "Playlists em destaque".
 */
export const searchPlaylists = async (query: string, limit = 20): Promise<DeezerPlaylistSearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search/playlist?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!data?.data) return [];

    return data.data.map(mapPlaylistSearchResult);
  } catch (error) {
    console.error('Erro ao pesquisar playlists no Deezer:', error);
    return [];
  }
};

export interface DeezerAlbumSearchResult {
  id: string;
  title: string;
  coverXl: string;
  artistId: string;
  artistName: string;
}

const mapAlbumSearchResult = (album: any): DeezerAlbumSearchResult => ({
  id: String(album.id),
  title: album.title,
  coverXl: album.cover_xl || album.cover_medium || album.cover || '',
  artistId: album.artist ? String(album.artist.id) : '',
  artistName: album.artist?.name || '',
});

/**
 * Pesquisa álbuns pelo texto livre, para o filtro "Álbuns" quando a busca não
 * corresponde a um artista específico.
 */
export const searchAlbums = async (query: string, limit = 20): Promise<DeezerAlbumSearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search/album?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!data?.data) return [];

    return data.data.map(mapAlbumSearchResult);
  } catch (error) {
    console.error('Erro ao pesquisar álbuns no Deezer:', error);
    return [];
  }
};

export interface DeezerPodcastSearchResult {
  id: string;
  title: string;
  description: string;
  pictureMedium: string;
  link: string;
}

const mapPodcastSearchResult = (podcast: any): DeezerPodcastSearchResult => ({
  id: String(podcast.id),
  title: podcast.title,
  description: podcast.description || '',
  pictureMedium: podcast.picture_medium || podcast.picture || '',
  link: podcast.link || '',
});

/**
 * Pesquisa podcasts pelo texto livre, para o filtro "Podcasts".
 */
export const searchPodcasts = async (query: string, limit = 20): Promise<DeezerPodcastSearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchDeezerJson(`${BASE_URL}/search/podcast?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!data?.data) return [];

    return data.data.map(mapPodcastSearchResult);
  } catch (error) {
    console.error('Erro ao pesquisar podcasts no Deezer:', error);
    return [];
  }
};

/**
 * Busca as faixas de uma playlist pública (usado para tocar uma playlist
 * inteira a partir do filtro "Playlists em destaque").
 */
export const fetchPlaylistTracks = async (playlistId: string, limit = 50): Promise<Track[]> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/playlist/${playlistId}/tracks?limit=${limit}`);
    if (!data?.data) return [];

    return data.data.map(mapDeezerTrack);
  } catch (error) {
    console.error('Erro ao buscar faixas da playlist:', error);
    return [];
  }
};

export interface PlaylistDetails {
  id: string;
  title: string;
  pictureXl: string;
  creatorName: string;
  nbTracks: number;
  /** Duração total da playlist em segundos. */
  duration: number;
  tracks: Track[];
}

/**
 * Busca os metadados completos de uma playlist pública (capa, criador,
 * duração total) junto com todas as suas faixas, para a página de detalhes.
 */
export const fetchPlaylistDetails = async (playlistId: string): Promise<PlaylistDetails | null> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/playlist/${playlistId}`);
    if (!data || data.error) return null;

    const items: any[] = data.tracks?.data || [];
    const tracks: Track[] = items.map(mapDeezerTrack);

    return {
      id: String(data.id),
      title: data.title || 'Playlist',
      pictureXl: data.picture_xl || data.picture_big || data.picture_medium || '',
      creatorName: data.creator?.name || data.user?.name || '',
      nbTracks: data.nb_tracks || tracks.length,
      duration: data.duration || tracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      tracks,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes da playlist:', error);
    return null;
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

export interface AlbumDetails {
  id: string;
  title: string;
  coverXl: string;
  artistId: string;
  artistName: string;
  releaseYear: string;
  nbTracks: number;
  /** Duração total do álbum em segundos. */
  duration: number;
  tracks: Track[];
}

/**
 * Busca os metadados completos de um álbum (capa, artista, ano, duração
 * total) junto com todas as suas faixas, para a página de detalhes do álbum.
 */
export const fetchAlbumDetails = async (albumId: string): Promise<AlbumDetails | null> => {
  try {
    const data = await fetchDeezerJson(`${BASE_URL}/album/${albumId}`);
    if (!data || data.error) return null;

    const coverUrl = data.cover_xl || data.cover_medium || data.cover || '';
    const albumTitle = data.title || 'Unknown Album';
    const items: any[] = data.tracks?.data || [];

    const tracks: Track[] = items.map((track) => ({
      ...mapDeezerTrack(track),
      album: albumTitle,
      coverUrl,
    }));

    return {
      id: String(data.id),
      title: albumTitle,
      coverXl: coverUrl,
      artistId: data.artist ? String(data.artist.id) : '',
      artistName: data.artist?.name || '',
      releaseYear: data.release_date ? String(data.release_date).slice(0, 4) : '',
      nbTracks: data.nb_tracks || tracks.length,
      duration: data.duration || tracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      tracks,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do álbum:', error);
    return null;
  }
};
