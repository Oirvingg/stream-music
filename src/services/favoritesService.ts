import { apiFetch } from './api';
import { Track } from '../types/music';

export const fetchFavorites = (): Promise<Track[]> => apiFetch('/api/user/favorites');

export const addFavorite = (track: Track): Promise<void> =>
  apiFetch('/api/user/favorites', { method: 'POST', body: JSON.stringify({ track }) });

export const removeFavorite = (trackId: string): Promise<void> =>
  apiFetch(`/api/user/favorites/${trackId}`, { method: 'DELETE' });
