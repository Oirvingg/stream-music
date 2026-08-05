export interface LyricLine {
  /** Tempo da linha em segundos, relativo ao início da faixa. */
  time: number;
  text: string;
}

export interface LyricsResult {
  /** Linhas sincronizadas (com timestamp). `null` se a faixa não tiver letra sincronizada. */
  syncedLines: LyricLine[] | null;
  /** Letra estática (sem timestamps), usada como fallback quando não há `syncedLines`. */
  plainLyrics: string | null;
}

interface LyricsApiResponse {
  source: 'lrclib' | 'lyrics.ovh';
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

// Em desenvolvimento (sem VITE_API_URL definida), usamos o proxy local do
// vite.config.ts para evitar CORS. Em produção, apontamos para o backend
// deployado no Render, que expõe /api/lyrics como proxy com fallback entre
// LRCLIB e lyrics.ovh (chamar essas APIs direto do navegador já se mostrou
// pouco confiável em produção — ver histórico do commit revertido 3005ca1).
const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_URL}/api/lyrics`;

/**
 * Remove sufixos e ruídos comuns de títulos de faixa (remaster, live,
 * deluxe, feat., etc.) antes de buscar a letra, aumentando a chance de
 * encontrar a faixa nas APIs externas.
 */
export function sanitizeTrackTitle(title: string): string {
  return title
    .replace(/[([][^)\]]*\b(remaster(ed)?|live|deluxe|edition|version|mono|stereo|explicit|clean|radio edit|bonus track|extended|anniversary|remix)\b[^)\]]*[)\]]/gi, '')
    .replace(/[([]\s*(feat\.?|ft\.?|featuring)\s+[^)\]]*[)\]]/gi, '')
    .replace(/\s*[-–]\s*(feat\.?|ft\.?|featuring)\s+.*/gi, '')
    .replace(/\s*[-–]\s*(remaster(ed)?|live|deluxe edition|deluxe|radio edit|extended|anniversary|remix|mono|stereo)\s*$/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Faz o parse de um bloco de letra no formato `.lrc` (`[mm:ss.xx] texto`)
 * retornado pelo LRCLIB, convertendo cada linha para segundos.
 */
export function parseSyncedLyrics(syncedLyrics: string): LyricLine[] {
  const lineRegex = /^\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/;
  const lines: LyricLine[] = [];

  for (const rawLine of syncedLyrics.split('\n')) {
    const match = rawLine.match(lineRegex);
    if (!match) continue;

    const [, mm, ss, fraction, text] = match;
    const minutes = parseInt(mm, 10);
    const seconds = parseInt(ss, 10);
    const fractionSecs = fraction ? parseInt(fraction.padEnd(3, '0'), 10) / 1000 : 0;
    const time = minutes * 60 + seconds + fractionSecs;

    if (text.trim().length > 0) {
      lines.push({ time, text: text.trim() });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Busca a letra de uma faixa com fallback resiliente entre múltiplas APIs
 * (LRCLIB e lyrics.ovh, orquestrado no backend via /api/lyrics). O título é
 * sanitizado antes do envio para remover ruídos como "(Remastered)" ou
 * "(feat. Artista)" que costumam fazer a busca falhar.
 */
export async function fetchLyricsWithFallback(trackName: string, artistName: string): Promise<LyricsResult> {
  const sanitizedTitle = sanitizeTrackTitle(trackName);

  try {
    const params = new URLSearchParams({ title: sanitizedTitle, artist: artistName });
    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      return { syncedLines: null, plainLyrics: null };
    }

    const data: LyricsApiResponse = await response.json();
    const syncedLines = data.syncedLyrics ? parseSyncedLyrics(data.syncedLyrics) : null;

    return {
      syncedLines: syncedLines && syncedLines.length > 0 ? syncedLines : null,
      plainLyrics: data.plainLyrics && data.plainLyrics.trim().length > 0 ? data.plainLyrics : null,
    };
  } catch (error) {
    console.error('Erro ao buscar letra:', error);
    return { syncedLines: null, plainLyrics: null };
  }
}
