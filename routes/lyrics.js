import express from 'express';

const router = express.Router();

const LRCLIB_BASE_URL = 'https://lrclib.net/api/get';
const LYRICS_OVH_BASE_URL = 'https://api.lyrics.ovh/v1';

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchFromLrclib(title, artist) {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  const response = await fetch(`${LRCLIB_BASE_URL}?${params.toString()}`);
  if (!response.ok) return null;

  const data = await response.json();
  const plainLyrics = data?.plainLyrics?.trim() || null;
  const syncedLyrics = data?.syncedLyrics?.trim() || null;
  if (!plainLyrics && !syncedLyrics) return null;

  return { source: 'lrclib', plainLyrics, syncedLyrics };
}

async function fetchFromLyricsOvh(title, artist) {
  const url = `${LYRICS_OVH_BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const plainLyrics = data?.lyrics?.trim() || null;
  if (!plainLyrics) return null;

  return { source: 'lyrics.ovh', plainLyrics, syncedLyrics: null };
}

const NOT_FOUND_RESULT = { source: null, plainLyrics: null, syncedLyrics: null };

router.get('/', async (req, res) => {
  const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';

  if (!title || !artist) {
    return res.status(400).json({ message: 'Parâmetros "title" e "artist" são obrigatórios.' });
  }

  const cacheKey = `${artist.toLowerCase()}|${title.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const result = (await fetchFromLrclib(title, artist)) || (await fetchFromLyricsOvh(title, artist));

    if (!result) {
      // Não é um erro: significa que nenhuma API tem a letra desta faixa.
      // Devolvemos 200 com payload vazio para o cliente tratar como estado
      // "letra indisponível", sem log de erro no console do navegador.
      setCached(cacheKey, NOT_FOUND_RESULT);
      return res.json(NOT_FOUND_RESULT);
    }

    setCached(cacheKey, result);
    res.json(result);
  } catch (error) {
    // Falha real de rede/upstream: logamos no servidor, mas ainda assim
    // respondemos 200 com payload vazio para não quebrar o fluxo do player.
    console.error('Erro ao buscar letra:', error);
    res.json(NOT_FOUND_RESULT);
  }
});

export default router;
