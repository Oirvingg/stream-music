/**
 * Funções de limpeza de storage local (localStorage, sessionStorage, cookies)
 * Executadas ao fazer logout ou limpar dados de usuário
 */

export function clearUserData(): void {
  console.log('🗑️  Limpando dados locais do usuário...');

  // Limpa token JWT
  localStorage.removeItem('stream_music_token');
  sessionStorage.removeItem('stream_music_token');

  // Limpa contas salvas (opcional - manter para "Mudar de conta")
  // localStorage.removeItem('stream_music_accounts');

  // Limpa dados de estado do player
  localStorage.removeItem('player_state');
  sessionStorage.removeItem('player_state');

  // Limpa cache de queries do React Query
  if (window.queryClient) {
    window.queryClient.clear();
  }

  // Remove cookies de autenticação (se existirem)
  document.cookie.split(';').forEach((c) => {
    const cookieName = c.split('=')[0].trim();
    if (
      cookieName.includes('token') ||
      cookieName.includes('auth') ||
      cookieName.includes('session')
    ) {
      document.cookie = `${cookieName}=; max-age=0; path=/`;
    }
  });

  console.log('✅ Dados locais removidos');
}

/**
 * Limpa TUDO incluindo contas salvas (para reset completo do app)
 */
export function clearAllStorageData(): void {
  console.log('🗑️  Limpeza completa de storage...');
  
  localStorage.clear();
  sessionStorage.clear();

  // Remove todos os cookies
  document.cookie.split(';').forEach((c) => {
    const cookieName = c.split('=')[0].trim();
    document.cookie = `${cookieName}=; max-age=0; path=/`;
  });

  console.log('✅ Todo storage limpo');
}

/**
 * Hook de cleanup opcional
 */
export function useStorageCleanup() {
  return {
    clearUserData,
    clearAllStorageData,
  };
}
