import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/music';

export interface UserPlaylist {
  id: string;
  name: string;
  creator: string;
  tracks: Track[];
  pinned?: boolean;
}

const DEFAULT_PLAYLISTS: UserPlaylist[] = [
  { id: 'p1', name: 'Meus favoritos', creator: 'Você', tracks: [], pinned: true },
  { id: 'p2', name: 'Lo-fi Beats', creator: 'Curadoria', tracks: [], pinned: true },
  { id: 'p3', name: 'Rock Clássico', creator: 'Você', tracks: [], pinned: false },
  { id: 'p4', name: 'Eletrônica Noturna', creator: 'Curadoria', tracks: [], pinned: false },
  { id: 'p5', name: 'Chill Vibes', creator: 'Você', tracks: [], pinned: false },
];

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  history: Track[]; // Histórico das últimas 20 músicas tocadas
  playlists: UserPlaylist[]; // Playlists do usuário
  likedTracks: Track[]; // Array global de favoritos
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;

  addPlaylist: (newPlaylist: UserPlaylist) => void;
  currentTime: number;
  duration: number;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  isExpanded: boolean;
  expandedTab: 'QUEUE' | 'LYRICS' | 'RELATED';
  toggleExpand: () => void;
  setExpandedTab: (tab: 'QUEUE' | 'LYRICS' | 'RELATED') => void;
  playNext: (track: Track) => void;
  toggleLikeTrack: (track: Track) => void;
  shuffleQueue: () => void;
  
  // Gerenciamento de Playlists
  createPlaylist: (name: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, startIndex: number, endIndex: number) => void;
  
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  activePage: 'HOME' | 'EXPLORE';
  setActivePage: (page: 'HOME' | 'EXPLORE') => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  
  feedbackMessage: string | null;
  setFeedbackMessage: (msg: string | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentTrack: null,
      isPlaying: false,
      volume: 1,
      queue: [],
      searchQuery: '',
      history: [],
      playlists: DEFAULT_PLAYLISTS,
      likedTracks: [],
      currentTime: 0,
      duration: 0,
      isExpanded: false,
      expandedTab: 'QUEUE',
      activePlaylistId: null,
      activePage: 'HOME',
      feedbackMessage: null,

      setTrack: (track) =>
        set((state) => {
          // Filtra se a música já existe no histórico e adiciona no começo
          const newHistory = [
            track,
            ...state.history.filter((t) => t.id !== track.id),
          ].slice(0, 20); // Mantém apenas as últimas 20

          return {
            currentTrack: track,
            isPlaying: true,
            history: newHistory,
          };
        }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setVolume: (volume) => set({ volume }),
      
      addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
      
      setQueue: (tracks) => set({ queue: tracks }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),

      addPlaylist: (newPlaylist) => set((state) => ({ playlists: [newPlaylist, ...state.playlists] })),

      createPlaylist: (name) => set((state) => {
        const newPlaylist: UserPlaylist = {
          id: `playlist-${Date.now()}`,
          name,
          creator: 'Você',
          tracks: [],
        };
        return { playlists: [newPlaylist, ...state.playlists] };
      }),

      renamePlaylist: (playlistId, newName) => set((state) => ({
        playlists: state.playlists.map(pl => pl.id === playlistId ? { ...pl, name: newName } : pl)
      })),

      deletePlaylist: (playlistId) => set((state) => ({
        playlists: state.playlists.filter(pl => pl.id !== playlistId),
        activePlaylistId: state.activePlaylistId === playlistId ? null : state.activePlaylistId
      })),

      addTrackToPlaylist: (playlistId, track) => set((state) => ({
        playlists: state.playlists.map(pl => {
          if (pl.id === playlistId) {
            // Evita duplicatas na mesma playlist
            if (pl.tracks.some(t => t.id === track.id)) return pl;
            return { ...pl, tracks: [...pl.tracks, track] };
          }
          return pl;
        })
      })),

      removeTrackFromPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map(pl => {
          if (pl.id === playlistId) {
            return { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
          }
          return pl;
        })
      })),

      reorderPlaylistTracks: (playlistId, startIndex, endIndex) => set((state) => ({
        playlists: state.playlists.map(pl => {
          if (pl.id === playlistId) {
            const newTracks = Array.from(pl.tracks);
            const [movedTrack] = newTracks.splice(startIndex, 1);
            newTracks.splice(endIndex, 0, movedTrack);
            return { ...pl, tracks: newTracks };
          }
          return pl;
        })
      })),

      setActivePlaylistId: (id) => set({ activePlaylistId: id }),
      setActivePage: (page) => set({ activePage: page }),

      toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpandedTab: (tab) => set({ expandedTab: tab }),

      playNext: (track) => set((state) => {
        const currentIndex = state.currentTrack ? state.queue.findIndex(t => t.id === state.currentTrack?.id) : -1;
        const newQueue = [...state.queue];
        if (currentIndex !== -1) {
          newQueue.splice(currentIndex + 1, 0, track);
        } else {
          newQueue.push(track);
        }
        return { queue: newQueue };
      }),

      reorderQueue: (startIndex, endIndex) => set((state) => {
        const newQueue = Array.from(state.queue);
        const [movedTrack] = newQueue.splice(startIndex, 1);
        newQueue.splice(endIndex, 0, movedTrack);
        return { queue: newQueue };
      }),

      setFeedbackMessage: (msg) => set({ feedbackMessage: msg }),

      toggleLikeTrack: (track) => set((state) => {
        const exists = state.likedTracks.some(t => t.id === track.id);
        if (exists) {
          return { likedTracks: state.likedTracks.filter(t => t.id !== track.id) };
        } else {
          return { likedTracks: [...state.likedTracks, track] };
        }
      }),

      shuffleQueue: () => set((state) => {
        const newQueue = [...state.queue];
        for (let i = newQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }
        return { queue: newQueue };
      }),

      setCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),

      nextTrack: () => set((state) => {
        if (state.queue.length === 0) return state;
        const currentIndex = state.queue.findIndex((t) => t.id === state.currentTrack?.id);
        const nextIndex = (currentIndex + 1) % state.queue.length;
        const nextTrack = state.queue[nextIndex];
        
        return {
          currentTrack: nextTrack,
          isPlaying: true,
          history: [nextTrack, ...state.history.filter((t) => t.id !== nextTrack.id)].slice(0, 20),
        };
      }),

      prevTrack: () => set((state) => {
        if (state.queue.length === 0) return state;
        
        if (state.currentTime > 3) {
          return state;
        }
        
        const currentIndex = state.queue.findIndex((t) => t.id === state.currentTrack?.id);
        const prevIndex = currentIndex - 1 < 0 ? state.queue.length - 1 : currentIndex - 1;
        const prevTrack = state.queue[prevIndex];
        
        return {
          currentTrack: prevTrack,
          isPlaying: true,
          history: [prevTrack, ...state.history.filter((t) => t.id !== prevTrack.id)].slice(0, 20),
        };
      }),
    }),
    {
      name: 'stream-music-storage', // chave no localStorage
      partialize: (state) => ({ history: state.history, volume: state.volume, playlists: state.playlists, likedTracks: state.likedTracks }),
    }
  )
);
