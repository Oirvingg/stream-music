import { apiFetch } from './api';
import {
  setToken,
  clearToken,
  getToken,
  saveAccount,
  getSavedAccounts,
  removeSavedAccount,
  SavedAccount,
} from './authToken';

export interface AuthUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isFirstLogin: boolean;
}

interface AuthApiUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  isFirstLogin: boolean;
}

interface AuthApiResponse {
  message: string;
  token: string;
  user: AuthApiUser;
}

const toAuthUserData = (user: AuthApiUser): AuthUserData => ({
  uid: user.uid,
  email: user.email,
  displayName: user.name,
  photoURL: user.photoURL,
  isFirstLogin: user.isFirstLogin,
});

/** Mantém o registro local de "contas salvas" (usado por "Mudar de conta")
 * em sincronia sempre que uma sessão é criada, restaurada ou atualizada. */
const rememberAccount = (user: AuthApiUser, token: string): void => {
  saveAccount({
    uid: user.uid,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    token,
  });
};

/**
 * Realiza o login com E-mail e Senha.
 */
export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<AuthUserData> => {
  const response = await apiFetch<AuthApiResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(response.token, rememberMe);
  rememberAccount(response.user, response.token);
  return toAuthUserData(response.user);
};

/**
 * Cria uma nova conta com E-mail, Senha e Nome do Usuário.
 */
export const registerWithEmail = async (
  name: string,
  email: string,
  password: string
): Promise<AuthUserData> => {
  const response = await apiFetch<AuthApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(response.token, true);
  rememberAccount(response.user, response.token);
  return toAuthUserData(response.user);
};

/**
 * Envia a solicitação de redefinição de senha.
 */
export const resetPassword = async (email: string): Promise<void> => {
  await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

/**
 * Desconecta o usuário ativo, descartando o token salvo e limpando storage local.
 */
export const logoutUser = async (): Promise<void> => {
  const { clearUserData } = await import('./storageCleanup');
  clearToken();
  clearUserData();
};

/**
 * Verifica se há um token salvo de uma sessão anterior e, se houver, valida
 * com o backend (`/auth/me`) e retorna os dados do usuário atual. Chamado
 * uma vez na inicialização do app para restaurar a sessão.
 */
export const restoreSession = async (): Promise<AuthUserData | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const user = await apiFetch<AuthApiUser>('/auth/me');
    rememberAccount(user, token);
    return toAuthUserData(user);
  } catch {
    clearToken();
    return null;
  }
};

/**
 * Troca a sessão ativa para uma das contas salvas neste dispositivo, sem
 * pedir senha novamente — usa o token já guardado no registro local.
 */
export const switchToAccount = async (uid: string): Promise<AuthUserData> => {
  const account = getSavedAccounts().find((a) => a.uid === uid);
  if (!account) {
    throw new Error('Conta não encontrada neste dispositivo.');
  }

  const previousToken = getToken();
  setToken(account.token, true);
  try {
    const user = await apiFetch<AuthApiUser>('/auth/me');
    rememberAccount(user, account.token);
    return toAuthUserData(user);
  } catch {
    // Sessão salva expirou — remove o token inválido do registro e restaura
    // a sessão anterior em vez de deixar o app "deslogado" por engano.
    removeSavedAccount(uid);
    if (previousToken) {
      setToken(previousToken, true);
    } else {
      clearToken();
    }
    throw new Error('Sessão dessa conta expirou. Faça login novamente.');
  }
};

export const getAccounts = (): SavedAccount[] => getSavedAccounts();

/**
 * Envia uma nova foto de perfil (data URI base64, já redimensionada no
 * cliente) e retorna o usuário atualizado.
 */
export const uploadAvatar = async (photoDataUrl: string): Promise<AuthUserData> => {
  const token = getToken();
  const user = await apiFetch<AuthApiUser>('/auth/avatar', {
    method: 'PUT',
    body: JSON.stringify({ photoURL: photoDataUrl }),
  });
  if (token) rememberAccount(user, token);
  return toAuthUserData(user);
};

/**
 * Marca o tutorial de onboarding (primeiro login) como concluído no backend,
 * para que ele não reapareça nos próximos logins.
 */
export const completeOnboarding = async (): Promise<void> => {
  await apiFetch('/auth/onboarding', { method: 'PUT' });
};
