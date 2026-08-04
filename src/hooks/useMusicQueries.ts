import { useQuery } from '@tanstack/react-query';
import {
  fetchGlobalTrending,
  searchTracks,
  searchArtists,
  searchPlaylists,
  searchAlbums,
  searchPodcasts,
  fetchGenreTracks,
  fetchArtistById,
  fetchArtistTopTracks,
  fetchArtistAlbums,
  fetchRelatedArtists,
} from '../services/deezerService';
import { fetchUserTopArtists, fetchArtistInfo } from '../services/lastfmService';
import { fetchCategories } from '../services/categoriesService';
import { Track } from '../types/music';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTrendingTracks() {
  return useQuery({
    queryKey: ['trendingTracks'],
    queryFn: async () => {
      const data = await fetchGlobalTrending();
      if (!data || data.length === 0) {
        throw new Error('Falha ao carregar tendências do Deezer');
      }
      return data;
    },
    // Tratar fallbacks de UI via onError e stale data
    // No react-query v5 onError foi removido das options do useQuery. 
    // Trata-se através da renderização ou ErrorBoundary.
  });
}

export function useSearchTracks(query: string) {
  return useQuery({
    queryKey: ['searchTracks', query],
    queryFn: async () => {
      const data = await searchTracks(query);
      return data;
    },
    enabled: query.trim().length > 0,
  });
}

/**
 * Busca o artista mais relevante (top result) para uma pesquisa de texto,
 * usado para exibir o card de destaque de artista na tela de resultados.
 */
export function useSearchArtist(query: string) {
  return useQuery({
    queryKey: ['searchArtist', query],
    queryFn: async () => {
      const results = await searchArtists(query);
      return results[0] || null;
    },
    enabled: query.trim().length > 0,
  });
}

/**
 * Lista de artistas correspondentes a uma pesquisa, usada pelo filtro "Artistas"
 * na tela de resultados de pesquisa.
 */
export function useSearchArtistsList(query: string) {
  return useQuery({
    queryKey: ['searchArtistsList', query],
    queryFn: () => searchArtists(query, 24),
    enabled: query.trim().length > 0,
  });
}

/**
 * Playlists públicas correspondentes a uma pesquisa, usada pelo filtro
 * "Playlists em destaque".
 */
export function useSearchPlaylists(query: string) {
  return useQuery({
    queryKey: ['searchPlaylists', query],
    queryFn: () => searchPlaylists(query),
    enabled: query.trim().length > 0,
  });
}

/**
 * Álbuns correspondentes a uma pesquisa, usada pelo filtro "Álbuns" quando a
 * busca não corresponde a um artista específico.
 */
export function useSearchAlbums(query: string) {
  return useQuery({
    queryKey: ['searchAlbums', query],
    queryFn: () => searchAlbums(query),
    enabled: query.trim().length > 0,
  });
}

/**
 * Podcasts correspondentes a uma pesquisa, usada pelo filtro "Podcasts".
 */
export function useSearchPodcasts(query: string) {
  return useQuery({
    queryKey: ['searchPodcasts', query],
    queryFn: () => searchPodcasts(query),
    enabled: query.trim().length > 0,
  });
}

export function useGenreTracks(genre: string | null) {
  return useQuery({
    queryKey: ['genreTracks', genre],
    queryFn: async () => {
      if (!genre) return [];
      return await fetchGenreTracks(genre);
    },
    enabled: !!genre,
  });
}

export function usePersonalizedTrendingTracks(history: Track[], lastfmUsername: string | null) {
  return useQuery({
    queryKey: ['personalizedTrending', lastfmUsername, history.length],
    queryFn: async () => {
      let topArtist = '';

      if (lastfmUsername) {
        const artists = await fetchUserTopArtists(lastfmUsername);
        if (artists.length > 0) {
          topArtist = artists[0];
        }
      }

      if (!topArtist && history.length > 0) {
        // Encontra o artista mais frequente no histórico local
        const artistCounts = history.reduce((acc, track) => {
          const artistName = typeof track.artist === 'string' ? track.artist : track.artist.name;
          acc[artistName] = (acc[artistName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0][0];
      }

      if (topArtist) {
        const tracks = await searchTracks(topArtist);
        if (tracks && tracks.length > 0) {
          return { tracks, sourceArtist: topArtist };
        }
      }

      return null;
    },
    // Executa apenas se tivermos histórico ou username
    enabled: !!lastfmUsername || history.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export interface ArtistDetails {
  id: string;
  name: string;
  pictureXl: string;
  nbAlbums: number;
  bio: string;
  listeners: number;
}

/**
 * Detalhes de um artista para a página de perfil: foto em alta resolução e
 * contagem de álbuns vêm do Deezer; bio e ouvintes vêm do Last.fm (o Deezer
 * não expõe esses dados). Se o Last.fm falhar, cai para os fãs do Deezer.
 */
export function useArtistDetails(artistId: string | null) {
  return useQuery({
    queryKey: ['artistDetails', artistId],
    queryFn: async (): Promise<ArtistDetails | null> => {
      const artist = await fetchArtistById(artistId!);
      if (!artist) return null;

      const info = await fetchArtistInfo(artist.name);

      return {
        id: artist.id,
        name: artist.name,
        pictureXl: artist.pictureXl,
        nbAlbums: artist.nbAlbums,
        bio: info?.bio || '',
        listeners: info?.listeners || artist.nbFans,
      };
    },
    enabled: !!artistId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useArtistTopTracks(artistId: string | null) {
  return useQuery({
    queryKey: ['artistTopTracks', artistId],
    queryFn: () => fetchArtistTopTracks(artistId!, 10),
    enabled: !!artistId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useArtistAlbums(artistId: string | null) {
  return useQuery({
    queryKey: ['artistAlbums', artistId],
    queryFn: () => fetchArtistAlbums(artistId!),
    enabled: !!artistId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useArtistRelated(artistId: string | null) {
  return useQuery({
    queryKey: ['artistRelated', artistId],
    queryFn: () => fetchRelatedArtists(artistId!),
    enabled: !!artistId,
    staleTime: 30 * 60 * 1000,
  });
}
