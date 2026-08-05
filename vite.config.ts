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
        port: 5173,
      },
      watch: {
        usePolling: true,
      },
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
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/playlists': {
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/user': {
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/categories': {
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
        '/api/lyrics': {
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
      },
    },
  };
});

