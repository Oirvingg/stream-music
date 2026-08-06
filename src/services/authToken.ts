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

/**
 * Registro de contas salvas neste dispositivo (para "Mudar de conta"), sempre
 * em localStorage — o token de uma conta em segundo plano precisa sobreviver
 * mesmo quando a conta ativa usa sessionStorage (`remember` = false).
 */
const ACCOUNTS_KEY = 'stream_music_accounts';
const MAX_SAVED_ACCOUNTS = 5;

export interface SavedAccount {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  token: string;
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as SavedAccount[]) : [];
  } catch {
    return [];
  }
}

/** Salva ou atualiza uma conta no registro local, mais recente primeiro. */
export function saveAccount(account: SavedAccount): void {
  const accounts = getSavedAccounts().filter((a) => a.uid !== account.uid);
  accounts.unshift(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_SAVED_ACCOUNTS)));
}

export function removeSavedAccount(uid: string): void {
  const accounts = getSavedAccounts().filter((a) => a.uid !== uid);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
