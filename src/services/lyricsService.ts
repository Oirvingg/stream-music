export interface LyricLine {
  /** Tempo da linha em segundos, relativo ao início da faixa. */
  time: number;
  text: string;
}

export interface LyricsResult {
  /** Linhas sincronizadas (com timestamp), ordenadas cronologicamente. `null` se a faixa não tiver letra sincronizada. */
  syncedLines: LyricLine[] | null;
  /** Letra estática (sem timestamps), usada como fallback quando não há `syncedLines`. */
  plainLyrics: string | null;
}

interface LrcLibResponse {
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental?: boolean;
}

const LRCLIB_BASE_URL = 'https://lrclib.net/api/get';

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
 * Busca a letra da faixa atual na API pública do LRCLIB
 * (https://lrclib.net/api/get), enviando o nome da faixa e do artista.
 * Retorna as linhas sincronizadas quando disponíveis (`syncedLyrics`); caso
 * a faixa não tenha sincronização, cai para a letra estática (`plainLyrics`).
 */
export async function fetchSyncedLyrics(artist: string, title: string): Promise<LyricsResult> {
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });

    const response = await fetch(`${LRCLIB_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      return { syncedLines: null, plainLyrics: null };
    }

    const data: LrcLibResponse = await response.json();

    const syncedLines = data.syncedLyrics ? parseSyncedLyrics(data.syncedLyrics) : null;

    return {
      syncedLines: syncedLines && syncedLines.length > 0 ? syncedLines : null,
      plainLyrics: data.plainLyrics && data.plainLyrics.trim().length > 0 ? data.plainLyrics : null,
    };
  } catch (error) {
    console.error('Erro ao buscar letra no LRCLIB:', error);
    return { syncedLines: null, plainLyrics: null };
  }
}
