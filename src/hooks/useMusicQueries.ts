import { useQuery } from '@tanstack/react-query';
import { fetchGlobalTrending, searchTracks, fetchGenreTracks } from '../services/deezerService';
import { fetchUserTopArtists } from '../services/lastfmService';
import { Track } from '../types/music';

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
