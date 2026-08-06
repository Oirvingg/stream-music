import { create } from 'zustand';
import {
  AuthUserData,
  completeOnboarding as completeOnboardingRequest,
  logoutUser,
  restoreSession,
  switchToAccount,
  getAccounts,
} from '../services/authService';
import { SavedAccount, removeSavedAccount } from '../services/authToken';

export type AuthMode = 'login' | 'register';

interface AuthState {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;
  savedAccounts: SavedAccount[];

  // Ações
  setUser: (user: AuthUserData | null) => void;
  setAuthModalOpen: (open: boolean, mode?: AuthMode) => void;
  setAuthMode: (mode: AuthMode) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  initAuthListener: () => () => void;
  completeOnboarding: () => Promise<void>;
  refreshSavedAccounts: () => void;
  switchAccount: (uid: string) => Promise<void>;
  removeAccount: (uid: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authMode: 'login',
  isLoading: false,
  error: null,
  savedAccounts: [],

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
      set({ user, isAuthenticated: !!user, savedAccounts: getAccounts() });
    });
    return () => {};
  },

  refreshSavedAccounts: () => set({ savedAccounts: getAccounts() }),

  switchAccount: async (uid) => {
    const user = await switchToAccount(uid);
    set({ user, isAuthenticated: true, savedAccounts: getAccounts() });
  },

  removeAccount: (uid) => {
    removeSavedAccount(uid);
    const { user } = get();
    set({ savedAccounts: getAccounts() });
    // Se a conta removida é a ativa, também encerra a sessão atual.
    if (user?.uid === uid) {
      get().logout();
    }
  },

  completeOnboarding: async () => {
    const { user } = get();
    if (!user || !user.isFirstLogin) return;

    // Atualiza a UI otimisticamente para o tutorial não reaparecer, mesmo
    // que a requisição ao backend demore ou falhe silenciosamente.
    set({ user: { ...user, isFirstLogin: false } });
    try {
      await completeOnboardingRequest();
    } catch (error) {
      console.error('Erro ao concluir onboarding:', error);
    }
  },
}));
