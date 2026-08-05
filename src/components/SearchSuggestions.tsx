import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSearchSuggestions } from '../hooks/useMusicQueries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getArtistName } from '../types/music';
import { goToArtist } from '../utils/navigation';

function formatCompact(n: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

interface SearchSuggestionsProps {
  /** Texto bruto digitado (não debounced) — controla o próprio debounce internamente. */
  query: string;
  /** Termo sugerido ou nome clicado — deve preencher o input e disparar a busca completa. */
  onSelectTerm: (term: string) => void;
  onClose: () => void;
}

export function SearchSuggestions({ query, onSelectTerm, onClose }: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setQueue, setTrack } = usePlayerStore();
  const debouncedQuery = useDebouncedValue(query, 300);
  const { tracks, artists, isLoading } = useSearchSuggestions(debouncedQuery);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (query.trim().length <= 1) return null;

  const suggestedTerms: string[] = [];
  const seen = new Set([query.trim().toLowerCase()]);
  for (const artist of artists) {
    const key = artist.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestedTerms.push(artist.name);
    }
  }
  for (const track of tracks) {
    if (suggestedTerms.length >= 5) break;
    const key = track.title.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestedTerms.push(track.title);
    }
  }

  const hasResults = suggestedTerms.length > 0 || artists.length > 0 || tracks.length > 0;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading && !hasResults ? (
        <p className="px-4 py-3 text-sm text-yt-text-secondary">Buscando...</p>
      ) : !hasResults ? (
        <p className="px-4 py-3 text-sm text-yt-text-secondary">Nenhuma sugestão encontrada.</p>
      ) : (
        <>
          {suggestedTerms.length > 0 && (
            <div className="py-1.5">
              {suggestedTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSelectTerm(term)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Search className="w-4 h-4 shrink-0 text-yt-text-secondary" />
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {artists.length > 0 && (
            <div className="py-1.5 border-t border-white/10">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-yt-text-secondary">
                Artistas
              </p>
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => {
                    goToArtist(artist.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/10 transition-colors text-left"
                >
                  <img
                    src={artist.pictureMedium}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{artist.name}</p>
                    {artist.nbFans > 0 && (
                      <p className="text-xs text-yt-text-secondary truncate">
                        {formatCompact(artist.nbFans)} ouvintes mensais
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {tracks.length > 0 && (
            <div className="py-1.5 border-t border-white/10">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-yt-text-secondary">
                Músicas
              </p>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setQueue(tracks);
                    setTrack(track);
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/10 transition-colors text-left"
                >
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{track.title}</p>
                    <p className="text-xs text-yt-text-secondary truncate">
                      {getArtistName(track.artist)}
                      {track.album ? ` • ${track.album}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
