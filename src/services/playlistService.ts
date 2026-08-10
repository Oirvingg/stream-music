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

export const fetchPlaylists = (): Promise<UserPlaylist[]> => apiFetch('/api/playlists');

export const createPlaylist = (data: { title: string; description?: string; coverUrl?: string }): Promise<UserPlaylist> => {
  const { title, description, coverUrl } = data;
  return apiFetch('/api/playlists', { 
    method: 'POST', 
    body: JSON.stringify({ name: title, description, coverUrl }) 
  });
};

export const renamePlaylist = (id: string, title: string): Promise<UserPlaylist> =>
  apiFetch(`/api/playlists/${id}`, { method: 'PUT', body: JSON.stringify({ name: title }) });

export const deletePlaylist = (id: string): Promise<void> =>
  apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });

export const addTrackToPlaylist = (playlistId: string, track: Track): Promise<UserPlaylist> =>
  apiFetch(`/api/playlists/${playlistId}/tracks`, { method: 'POST', body: JSON.stringify({ track }) });

export const removeTrackFromPlaylist = (playlistId: string, trackId: string): Promise<UserPlaylist> =>
  apiFetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });

export const reorderPlaylistTracks = (playlistId: string, tracks: Track[]): Promise<UserPlaylist> =>
  apiFetch(`/api/playlists/${playlistId}`, { method: 'PUT', body: JSON.stringify({ tracks }) });
