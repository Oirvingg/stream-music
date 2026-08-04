import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/music';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  history: Track[]; // Histórico das últimas 20 músicas tocadas
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;

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
  shuffleQueue: () => void;

  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  activePage: 'HOME' | 'EXPLORE' | 'LIBRARY' | 'SEARCH';
  setActivePage: (page: 'HOME' | 'EXPLORE' | 'LIBRARY' | 'SEARCH') => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;

  activeArtistId: string | null;
  setActiveArtistId: (id: string | null) => void;

  activeAlbumId: string | null;
  setActiveAlbumId: (id: string | null) => void;

  activePublicPlaylistId: string | null;
  setActivePublicPlaylistId: (id: string | null) => void;

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
      currentTime: 0,
      duration: 0,
      isExpanded: false,
      expandedTab: 'QUEUE',
      activePlaylistId: null,
      activePage: 'HOME',
      feedbackMessage: null,
      activeArtistId: null,
      activeAlbumId: null,
      activePublicPlaylistId: null,

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

      setActivePlaylistId: (id) => set({ activePlaylistId: id }),
      setActivePage: (page) => set({ activePage: page }),
      setActiveArtistId: (id) => set({ activeArtistId: id }),
      setActiveAlbumId: (id) => set({ activeAlbumId: id }),
      setActivePublicPlaylistId: (id) => set({ activePublicPlaylistId: id }),

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
      partialize: (state) => ({ history: state.history, volume: state.volume }),
    }
  )
);
