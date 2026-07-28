import { Track } from '../types/music';

const OLLAMA_URL = process.env.VITE_OLLAMA_URL || import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = 'llama3';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

/**
 * Sends available tracks + user prompt to Ollama and returns an array of
 * recommended Track IDs parsed from the model's JSON output.
 */
export async function generatePlaylistFromOllama(
  userPrompt: string,
  availableTracks: Track[],
): Promise<string[]> {
  const catalog = availableTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: typeof t.artist === 'string' ? t.artist : t.artist.name,
    album: t.album ?? '',
  }));

  const systemPrompt = [
    'You are the official YouTube Music recommendation engine.',
    'The user will describe a mood, genre, activity or any music preference.',
    'Your ONLY job is to pick the best matching tracks from the catalog below',
    'and return EXCLUSIVELY a valid JSON array of their IDs.',
    '',
    '### Rules',
    '1. Return ONLY the JSON array. Example: ["1","4","7"]',
    '2. Do NOT include any text, explanation, markdown, or code fences.',
    '3. Use only IDs that exist in the catalog.',
    '4. Order by relevance (best match first).',
    '5. Pick between 1 and 6 tracks.',
    '',
    '### Catalog',
    JSON.stringify(catalog),
  ].join('\n');

  const body = {
    model: MODEL,
    prompt: `${systemPrompt}\n\nUser request: "${userPrompt}"`,
    stream: false,
  };

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data: OllamaResponse = await res.json();
  const raw = data.response.trim();

  // Extract the JSON array even if the model wraps it in markdown fences
  const jsonMatch = raw.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error('AI did not return a valid JSON array.');
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not an array.');
  }

  // Normalize every element to string
  return parsed.map((id) => String(id));
}

export async function translateLyrics(lyrics: string): Promise<string> {
  const prompt = `Traduza a seguinte letra de música para o português do Brasil. Preserve as quebras de linha e estrofes originais. Retorne APENAS o texto da letra traduzida, sem introduções, comentários ou notas de rodapé:

${lyrics}`;

  const body = {
    model: MODEL,
    prompt: prompt,
    stream: false,
  };

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data: OllamaResponse = await res.json();
  const raw = data.response.trim();

  if (!raw) {
    throw new Error('AI returned empty response.');
  }

  return raw;
}
