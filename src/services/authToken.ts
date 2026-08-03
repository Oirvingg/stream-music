const STORAGE_KEY = 'stream_music_token';

/**
 * Salva o token JWT retornado pelo backend. Quando `remember` é falso, o
 * token vive só na sessão do navegador (sessionStorage) e some ao fechar a aba.
 */
export function setToken(token: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem(STORAGE_KEY, token);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, token);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
