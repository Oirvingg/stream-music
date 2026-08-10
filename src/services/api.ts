import { getToken } from './authToken';

// Em desenvolvimento, sem VITE_API_URL definida, as chamadas ficam relativas
// (mesmo host do Vite). Em produção, aponta para o backend no Render.
const RAW_API_URL = import.meta.env.VITE_API_URL || '';
export const API_URL = RAW_API_URL.replace(/\/+$/, '');

/**
 * Obtém o token JWT salvo localmente (após login/registro), se houver.
 */
function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper de fetch que injeta o cabeçalho `Authorization: Bearer <token>`
 * automaticamente em todas as chamadas para a API autenticada do backend.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = getAuthHeader();

  if (path === '/api/playlists' && options.method === 'POST') {
    console.log('🎵 Creating playlist - body:', options.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (path === '/api/playlists' && options.method === 'POST') {
    console.log('🎵 Playlist created response:', data);
  }
  
  if (path === '/api/playlists' && options.method === 'GET') {
    console.log('🎵 GET /api/playlists response:', data);
    if (Array.isArray(data)) {
      console.log('🎵 First playlist title field:', data[0]?.title);
      console.log('🎵 First playlist name field:', data[0]?.name);
      console.log('🎵 All fields in first playlist:', Object.keys(data[0] || {}));
    }
  }

  if (!response.ok) {
    const message = data?.message || `Erro na requisição (status ${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
