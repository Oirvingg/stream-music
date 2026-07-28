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
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  tracks: Track[];
}
