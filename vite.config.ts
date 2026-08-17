import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify(env),
    },
    server: {
      host: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
      watch: {
        usePolling: true,
      },
      // Host do backend: 'localhost' em dev local (fora do Docker) ou
      // 'backend' (nome do serviço) dentro do container do Vite, quando a
      // variável BACKEND_HOST for exportada pelo docker-compose.
      proxy: {
        '/api/deezer': {
          target: 'https://api.deezer.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/deezer/, ''),
        },
        // Rotas do nosso backend (auth, playlists, favoritos, categorias).
        // Em produção, VITE_API_URL aponta direto para o backend no Render;
        // em dev local, sem essa env var, o proxy abaixo evita CORS e evita
        // que o fallback de SPA do Vite responda com index.html no lugar do JSON.
        '/auth': {
          target: `http://${process.env.BACKEND_HOST || env.BACKEND_HOST || 'localhost'}:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/playlists': {
          target: `http://${process.env.BACKEND_HOST || env.BACKEND_HOST || 'localhost'}:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/user': {
          target: `http://${process.env.BACKEND_HOST || env.BACKEND_HOST || 'localhost'}:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/categories': {
          target: `http://${process.env.BACKEND_HOST || env.BACKEND_HOST || 'localhost'}:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/lyrics': {
          target: `http://${process.env.BACKEND_HOST || env.BACKEND_HOST || 'localhost'}:${env.PORT || 3000}`,
          changeOrigin: true,
        },
      },
    },
  };
});

