import { Track } from '../types/music';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Busca as músicas mais populares globalmente no Last.fm.
 */
export const fetchGlobalTrending = async (): Promise<Track[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}?method=chart.gettoptracks&api_key=${API_KEY}&format=json&limit=20`
    );
    const data = await response.json();

    if (!data.tracks || !data.tracks.track) return [];

    return data.tracks.track.map((track: any, index: number) => ({
      id: track.mbid || `trending-${index}`,
      title: track.name,
      artist: track.artist.name,
      album: track.album?.title || 'Unknown',
      coverUrl:
        track.image?.find((img: any) => img.size === 'extralarge')?.['#text'] ||
        track.image?.[track.image.length - 1]?.['#text'] ||
        '',
      audioUrl: '', // Last.fm não fornece preview de áudio
      duration: Number(track.duration) || 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar músicas em alta:', error);
    return [];
  }
};

/**
 * Pesquisa músicas por texto livre no Last.fm.
 */
export const searchTracks = async (query: string): Promise<Track[]> => {
  if (!query) return [];

  try {
    const response = await fetch(
      `${BASE_URL}?method=track.search&track=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=20`
    );
    const data = await response.json();

    if (
      !data.results ||
      !data.results.trackmatches ||
      !data.results.trackmatches.track
    )
      return [];

    return data.results.trackmatches.track.map((track: any, index: number) => ({
      id: track.mbid || `search-${index}`,
      title: track.name,
      artist: track.artist, // No track.search, 'artist' é retornado como string
      album: 'Unknown',
      coverUrl:
        track.image?.find((img: any) => img.size === 'extralarge')?.['#text'] ||
        track.image?.[track.image.length - 1]?.['#text'] ||
        '',
      audioUrl: '',
      duration: 0,
    }));
  } catch (error) {
    console.error('Erro ao pesquisar músicas:', error);
    return [];
  }
};

export interface LastfmArtistInfo {
  bio: string;
  listeners: number;
}

/**
 * Busca a biografia e o número de ouvintes de um artista no Last.fm.
 * O Deezer não expõe esses dados, por isso complementamos com o Last.fm.
 */
export const fetchArtistInfo = async (artistName: string): Promise<LastfmArtistInfo | null> => {
  if (!artistName) return null;

  try {
    const response = await fetch(
      `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`
    );
    const data = await response.json();

    if (!data.artist) return null;

    const bioRaw: string = data.artist.bio?.summary || '';
    // Remove o link "Read more on Last.fm" que a API embute no fim do resumo
    const bio = bioRaw.replace(/<a href="[^"]*">Read more on Last\.fm<\/a>/i, '').trim();

    return {
      bio,
      listeners: Number(data.artist.stats?.listeners) || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar informações do artista:', error);
    return null;
  }
};

/**
 * Busca os artistas mais ouvidos de um usuário no Last.fm.
 */
export const fetchUserTopArtists = async (username: string): Promise<string[]> => {
  if (!username) return [];

  try {
    const response = await fetch(
      `${BASE_URL}?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${API_KEY}&format=json&limit=5`
    );
    const data = await response.json();

    if (!data.topartists || !data.topartists.artist) return [];

    return data.topartists.artist.map((artist: any) => artist.name);
  } catch (error) {
    console.error('Erro ao buscar artistas mais ouvidos do usuário:', error);
    return [];
  }
};
