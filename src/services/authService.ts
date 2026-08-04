import { apiFetch } from './api';
import { setToken, clearToken, getToken } from './authToken';

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
 * Desconecta o usuário ativo, descartando o token salvo.
 */
export const logoutUser = async (): Promise<void> => {
  clearToken();
};

/**
 * Verifica se há um token salvo de uma sessão anterior e, se houver, valida
 * com o backend (`/auth/me`) e retorna os dados do usuário atual. Chamado
 * uma vez na inicialização do app para restaurar a sessão.
 */
export const restoreSession = async (): Promise<AuthUserData | null> => {
  if (!getToken()) return null;

  try {
    const user = await apiFetch<AuthApiUser>('/auth/me');
    return toAuthUserData(user);
  } catch {
    clearToken();
    return null;
  }
};

/**
 * Marca o tutorial de onboarding (primeiro login) como concluído no backend,
 * para que ele não reapareça nos próximos logins.
 */
export const completeOnboarding = async (): Promise<void> => {
  await apiFetch('/auth/onboarding', { method: 'PUT' });
};
