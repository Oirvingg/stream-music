import { create } from 'zustand';
import { AuthUserData, logoutUser, restoreSession } from '../services/authService';

export type AuthMode = 'login' | 'register';

interface AuthState {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;

  // Ações
  setUser: (user: AuthUserData | null) => void;
  setAuthModalOpen: (open: boolean, mode?: AuthMode) => void;
  setAuthMode: (mode: AuthMode) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authMode: 'login',
  isLoading: false,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setAuthModalOpen: (open, mode = 'login') =>
    set({
      isAuthModalOpen: open,
      authMode: mode,
      error: null,
    }),

  setAuthMode: (mode) =>
    set({
      authMode: mode,
      error: null,
    }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: async () => {
    await logoutUser();
    set({ user: null, isAuthenticated: false, isAuthModalOpen: false });
  },

  initAuthListener: () => {
    restoreSession().then((user) => {
      set({ user, isAuthenticated: !!user });
    });
    return () => {};
  },
}));
