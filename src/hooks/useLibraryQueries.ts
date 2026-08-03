import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Track } from '../types/music';
import {
  UserPlaylist,
  fetchPlaylists,
  createPlaylist as createPlaylistRequest,
  renamePlaylist as renamePlaylistRequest,
  deletePlaylist as deletePlaylistRequest,
  addTrackToPlaylist as addTrackToPlaylistRequest,
  removeTrackFromPlaylist as removeTrackFromPlaylistRequest,
  reorderPlaylistTracks as reorderPlaylistTracksRequest,
} from '../services/playlistService';
import { fetchFavorites, addFavorite, removeFavorite } from '../services/favoritesService';

export type { UserPlaylist };

const PLAYLISTS_KEY = ['playlists'];
const FAVORITES_KEY = ['favorites'];

/**
 * Playlists reais do usuário autenticado, buscadas do backend (Firestore).
 * Fica desabilitada e retorna lista vazia enquanto não há sessão.
 */
export function useUserPlaylists() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: PLAYLISTS_KEY,
    queryFn: fetchPlaylists,
    enabled: isAuthenticated,
    placeholderData: isAuthenticated ? undefined : [],
  });
}

/**
 * Músicas curtidas pelo usuário autenticado, buscadas do backend (Firestore).
 */
export function useFavoriteTracks() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
    placeholderData: isAuthenticated ? undefined : [],
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createPlaylistRequest({ title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useRenamePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renamePlaylistRequest(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlaylistRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, track }: { playlistId: string; track: Track }) =>
      addTrackToPlaylistRequest(playlistId, track),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      removeTrackFromPlaylistRequest(playlistId, trackId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, tracks }: { playlistId: string; tracks: Track[] }) =>
      reorderPlaylistTracksRequest(playlistId, tracks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

export function useToggleFavoriteTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (track: Track) => {
      const favorites = queryClient.getQueryData<Track[]>(FAVORITES_KEY) ?? [];
      const isLiked = favorites.some((t) => t.id === track.id);
      return isLiked ? removeFavorite(track.id) : addFavorite(track);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });
}
