import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSearchTracks } from '../hooks/useMusicQueries';
import { goBackFromSearch } from '../utils/navigation';
import { SearchResults } from './Home';
import { SearchSuggestions } from '../components/SearchSuggestions';

/**
 * Tela dedicada de Pesquisa (`/search`), usada no mobile pela lupa da Bottom
 * Nav e pela barra de busca do Header — o campo real fica só aqui, com o
 * teclado abrindo automaticamente ao entrar na página.
 */
export function Search() {
  const { searchQuery, setSearchQuery } = usePlayerStore();
  const [query, setQuery] = useState(searchQuery);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: searchResults = [], isLoading: isSearchingTracks } = useSearchTracks(searchQuery);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(query.trim());
      setSuggestionsOpen(false);
    }
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden overflow-x-hidden">
      <div className="flex items-center gap-2 px-3 md:px-6 py-3 shrink-0">
        <button
          onClick={goBackFromSearch}
          aria-label="Voltar"
          className="p-2 -ml-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-secondary pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Pesquise músicas, álbuns, artistas, podcasts"
            className="w-full h-11 pl-11 pr-4 bg-yt-search-bg border border-yt-border/50 rounded-full text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none focus:border-white/30 transition-colors"
          />
          {suggestionsOpen && (
            <SearchSuggestions
              query={query}
              onClose={() => setSuggestionsOpen(false)}
              onSelectTerm={(term) => {
                setQuery(term);
                setSearchQuery(term);
                setSuggestionsOpen(false);
              }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 md:px-6 pb-32 md:pb-4">
        {searchQuery ? (
          <SearchResults query={searchQuery} searchResults={searchResults} isSearchingTracks={isSearchingTracks} />
        ) : (
          <p className="text-yt-text-secondary text-center py-16">
            Pesquise músicas, álbuns, artistas ou podcasts.
          </p>
        )}
      </div>
    </main>
  );
}
