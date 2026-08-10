import { apiFetch } from './api';
import { Track } from '../types/music';

interface FavoriteItem {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  itemData: Track;
  addedAt: string;
}

export const fetchFavorites = async (): Promise<Track[]> => {
  const items = await apiFetch<FavoriteItem[]>('/api/user/favorites');
  return items
    .filter((item) => item.itemType === 'song' && item.itemData)
    .map((item) => item.itemData);
};

export const addFavorite = (track: Track): Promise<void> =>
  apiFetch('/api/user/favorites', {
    method: 'POST',
    body: JSON.stringify({ itemType: 'song', itemId: track.id, itemData: track }),
  });

export const removeFavorite = (trackId: string): Promise<void> =>
  apiFetch(`/api/user/favorites/${trackId}?itemType=song`, { method: 'DELETE' });
