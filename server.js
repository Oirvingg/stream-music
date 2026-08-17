// Garante que o Node.js não guarde logs em buffer dentro de containers Docker
// (força o stdout a se comportar como um TTY, fazendo os logs aparecerem em tempo real).
process.stdout.isTTY = true;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import songsRoutes from './routes/songs.js';
import authRoutes from './routes/auth.js';
import playlistsRoutes from './routes/playlists.js';
import favoritesRoutes from './routes/favorites.js';
import categoriesRoutes from './routes/categories.js';
import lyricsRoutes from './routes/lyrics.js';
import adminRoutes from './routes/admin.js';
import { authenticate } from './middleware/authenticate.js';

const app = express();
const DEEZER_BASE_URL = 'https://api.deezer.com';

// Logger HTTP em tempo real (formato 'dev': método + rota + status + tempo de resposta)
app.use(morgan('dev'));

// Middlewares para habilitar CORS e aceitar JSON
// CORS_ORIGIN (ou FRONTEND_URL) deve conter a(s) URL(s) do frontend em produção
// (ex: https://meu-frontend.onrender.com), separadas por vírgula se houver mais de uma.
// Sem essa variável definida, aceita qualquer origem (comportamento de dev local).
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);
// Limite elevado para acomodar o upload de foto de perfil como data URI (base64).
app.use(express.json({ limit: '6mb' }));

// Proxy para o Deezer (contorna bloqueio CORS)
app.use('/api/deezer', async (req, res) => {
  const targetPath = req.path || '/';
  const query = new URLSearchParams(req.query).toString();
  const url = `${DEEZER_BASE_URL}${targetPath}${query ? `?${query}` : ''}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url);

    // Se o Deezer respondeu, repassamos o status e o corpo (JSON ou vazio).
    const text = await response.text();
    if (!text) {
      console.warn(`[deezer-proxy] ${req.method} ${url} -> ${response.status} (corpo vazio) em ${Date.now() - startedAt}ms`);
      return res.status(response.status).end();
    }

    try {
      const data = JSON.parse(text);
      if (response.status >= 500) {
        console.error(`[deezer-proxy] ${req.method} ${url} -> ${response.status} em ${Date.now() - startedAt}ms`);
      } else if (response.status >= 400) {
        console.warn(`[deezer-proxy] ${req.method} ${url} -> ${response.status} em ${Date.now() - startedAt}ms`);
      } else {
        console.log(`[deezer-proxy] ${req.method} ${url} -> ${response.status} em ${Date.now() - startedAt}ms`);
      }
      return res.status(response.status).json(data);
    } catch {
      console.error(`[deezer-proxy] Resposta não-JSON do Deezer (status ${response.status}) em ${Date.now() - startedAt}ms`);
      return res.status(502).json({ error: 'Resposta inválida do Deezer' });
    }
  } catch (error) {
    console.error(`[deezer-proxy] Falha de rede/timeout ao chamar ${url} após ${Date.now() - startedAt}ms:`, error);
    res.status(502).json({ error: 'Falha ao buscar dados do Deezer', detail: error?.message });
  }
});

// Uso das rotas na aplicação
app.use('/auth', authRoutes);
app.use('/songs', songsRoutes);

// Rotas autenticadas via Token JWT — dados reais do usuário no PostgreSQL
app.use('/api/playlists', authenticate, playlistsRoutes);
app.use('/api/user/favorites', authenticate, favoritesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/lyrics', lyricsRoutes);

// Rotas de administração (requer autenticação + permissão admin)
app.use('/admin', adminRoutes);

// Rota inicial de verificação
app.get('/', (req, res) => {
  console.log(`[request] ${req.method} ${req.originalUrl} -> requisição recebida`);
  res.send('Servidor do Stream Music rodando com sucesso! 🚀');
});

// Handler 404 — qualquer rota não tratada acima cai aqui (em vez de devolver HTML do Vite no dev).
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

// Handler global de erros — qualquer exceção não capturada vira 500 com
// mensagem + stack no log do servidor (mantém a resposta genérica para o cliente).
app.use((err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
