import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAlbums, searchPlaylists, DeezerAlbumSearchResult, DeezerPlaylistSearchResult } from '../services/deezerService';
import { Track } from '../types/music';

export interface JukeboxTrackItem {
  type: 'track';
  key: string;
  track: Track;
}

export interface JukeboxAlbumItem {
  type: 'album';
  key: string;
  id: string;
  title: string;
  coverUrl: string;
  artistName: string;
}

export interface JukeboxPlaylistItem {
  type: 'playlist';
  key: string;
  id: string;
  title: string;
  coverUrl: string;
  creatorName: string;
}

export type JukeboxItem = JukeboxTrackItem | JukeboxAlbumItem | JukeboxPlaylistItem;

/**
 * Intercala álbuns e playlists do artista de referência entre as faixas,
 * imitando o "Quick Picks" do YouTube Music: a cada 3 faixas insere um
 * álbum ou playlist (alternando entre os dois), até esgotar o que foi
 * encontrado para o artista.
 */
function buildItems(
  tracks: Track[],
  albums: DeezerAlbumSearchResult[],
  playlists: DeezerPlaylistSearchResult[]
): JukeboxItem[] {
  const items: JukeboxItem[] = [];
  let albumIdx = 0;
  let playlistIdx = 0;
  let useAlbumNext = true;

  tracks.forEach((track, i) => {
    items.push({ type: 'track', key: `track-${track.id}`, track });

    if ((i + 1) % 3 === 0) {
      const albumAvailable = albumIdx < albums.length;
      const playlistAvailable = playlistIdx < playlists.length;

      if ((useAlbumNext && albumAvailable) || (!playlistAvailable && albumAvailable)) {
        const album = albums[albumIdx++];
        items.push({
          type: 'album',
          key: `album-${album.id}`,
          id: album.id,
          title: album.title,
          coverUrl: album.coverXl,
          artistName: album.artistName,
        });
      } else if (playlistAvailable) {
        const playlist = playlists[playlistIdx++];
        items.push({
          type: 'playlist',
          key: `playlist-${playlist.id}`,
          id: playlist.id,
          title: playlist.title,
          coverUrl: playlist.pictureMedium,
          creatorName: playlist.creatorName,
        });
      }
      useAlbumNext = !useAlbumNext;
    }
  });

  return items;
}

/**
 * Monta os itens da "Jukebox digital" misturando as faixas recomendadas com
 * álbuns e playlists do mesmo artista de referência (`sourceArtist`), para a
 * grade se comportar como o "Quick Picks" do YouTube Music em vez de só
 * músicas. Sem `sourceArtist` (usuário sem histórico/Last.fm, caindo no
 * fallback "Em Alta"), a grade mostra só as faixas — não há um artista único
 * para basear a busca de álbuns/playlists.
 */
export function useJukeboxItems(tracks: Track[], sourceArtist: string | null) {
  const extrasQuery = useQuery({
    queryKey: ['jukeboxExtras', sourceArtist],
    queryFn: async () => {
      const [albums, playlists] = await Promise.all([
        searchAlbums(sourceArtist!, 6),
        searchPlaylists(sourceArtist!, 4),
      ]);
      return { albums, playlists };
    },
    enabled: !!sourceArtist,
    staleTime: 30 * 60 * 1000,
  });

  const items = useMemo(
    () => buildItems(tracks, extrasQuery.data?.albums ?? [], extrasQuery.data?.playlists ?? []),
    [tracks, extrasQuery.data]
  );

  return { items };
}
