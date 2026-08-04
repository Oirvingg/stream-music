export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist | string;
  album?: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  /** Índice de popularidade relativa do Deezer (não é uma contagem literal de reproduções). */
  rank?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  tracks: Track[];
}

export function getArtistName(artist: Artist | string): string {
  return typeof artist === 'string' ? artist : artist.name;
}

export function getArtistId(artist: Artist | string): string | null {
  return typeof artist === 'string' ? null : artist.id;
}
