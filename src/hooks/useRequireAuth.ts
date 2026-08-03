import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Retorna uma função que verifica se há um usuário autenticado antes de
 * permitir ações que dependem do backend (playlists, favoritos). Caso
 * contrário, abre o modal de login e exibe um feedback rápido.
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const setFeedbackMessage = usePlayerStore((s) => s.setFeedbackMessage);

  return () => {
    if (isAuthenticated) return true;

    setFeedbackMessage('Faça login para continuar');
    setTimeout(() => setFeedbackMessage(null), 2500);
    setAuthModalOpen(true, 'login');
    return false;
  };
}
