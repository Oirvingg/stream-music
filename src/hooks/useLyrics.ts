import { useQuery } from '@tanstack/react-query';
import { fetchLyricsWithFallback, sanitizeTrackTitle } from '../services/lyricsService';
import { getArtistName } from '../types/music';
import type { Track } from '../types/music';

/**
 * Busca a letra da faixa atual com fallback entre APIs (ver lyricsService)
 * e cache via React Query — letra não muda, então mantemos staleTime longo
 * para evitar refetch ao reabrir a mesma faixa.
 */
export function useLyrics(track: Track | null) {
  const artist = track ? getArtistName(track.artist) : '';
  const sanitizedTitle = track ? sanitizeTrackTitle(track.title) : '';

  const { data, isLoading } = useQuery({
    queryKey: ['lyrics', artist, sanitizedTitle],
    queryFn: () => fetchLyricsWithFallback(track!.title, artist),
    enabled: !!track,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    syncedLines: data?.syncedLines ?? null,
    plainLyrics: data?.plainLyrics ?? null,
    isLoading: !!track && isLoading,
  };
}
