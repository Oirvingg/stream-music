import { apiFetch } from './api';
import { Track } from '../types/music';

export interface UserPlaylist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  createdAt?: string;
  updatedAt?: string;
}

// Formato aceito pela API (pode incluir `name` de backends antigos).
type RawPlaylist = Partial<UserPlaylist> & { name?: string };

// Normaliza a resposta da API para o formato esperado pela UI. O fallback
// `title ?? name` garante compatibilidade com backends antigos que ainda
// retornavam o campo `name` em vez de `title`.
function toUserPlaylist(data: RawPlaylist): UserPlaylist {
  return {
    id: data.id ?? '',
    userId: data.userId ?? '',
    title: data.title ?? data.name ?? 'Playlist',
    description: data.description,
    coverUrl: data.coverUrl,
    tracks: data.tracks ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export const fetchPlaylists = async (): Promise<UserPlaylist[]> => {
  const response = await apiFetch<RawPlaylist[]>('/api/playlists');
  return (Array.isArray(response) ? response : []).map(toUserPlaylist);
};

export const createPlaylist = (data: { title: string; description?: string; coverUrl?: string }): Promise<UserPlaylist> => {
  const { title, description, coverUrl } = data;
  return apiFetch<RawPlaylist>('/api/playlists', {
    method: 'POST',
    body: JSON.stringify({ name: title, description, coverUrl }),
  }).then(toUserPlaylist);
};

export const renamePlaylist = (id: string, title: string): Promise<UserPlaylist> =>
  apiFetch<RawPlaylist>(`/api/playlists/${id}`, { method: 'PUT', body: JSON.stringify({ name: title }) }).then(toUserPlaylist);

export const deletePlaylist = (id: string): Promise<void> =>
  apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });

export const addTrackToPlaylist = (playlistId: string, track: Track): Promise<UserPlaylist> =>
  apiFetch<RawPlaylist>(`/api/playlists/${playlistId}/tracks`, { method: 'POST', body: JSON.stringify({ track }) }).then(toUserPlaylist);

export const removeTrackFromPlaylist = (playlistId: string, trackId: string): Promise<UserPlaylist> =>
  apiFetch<RawPlaylist>(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' }).then(toUserPlaylist);

export const reorderPlaylistTracks = (playlistId: string, tracks: Track[]): Promise<UserPlaylist> =>
  apiFetch<RawPlaylist>(`/api/playlists/${playlistId}`, { method: 'PUT', body: JSON.stringify({ tracks }) }).then(toUserPlaylist);