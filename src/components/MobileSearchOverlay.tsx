import { Search, X } from 'lucide-react';
import { useSearchTracks } from '../hooks/useMusicQueries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePlayerStore } from '../store/usePlayerStore';
import { SearchSuggestions } from './SearchSuggestions';
import { getArtistName } from '../types/music';
import { goToArtist } from '../utils/navigation';

interface MobileSearchOverlayProps {
  query: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onQueryChange: (query: string) => void;
  onSearch: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onClose: () => void;
  onSelectTerm: (term: string) => void;
}

export function MobileSearchOverlay({
  query,
  inputRef,
  onQueryChange,
  onSearch,
  onClear,
  onClose,
  onSelectTerm,
}: MobileSearchOverlayProps) {
  const { setQueue, setTrack } = usePlayerStore();
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: searchResults = [], isLoading } = useSearchTracks(debouncedQuery);

  const handleTrackSelect = (track: any) => {
    setQueue(searchResults);
    setTrack(track);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-yt-black z-40 flex flex-col md:hidden">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 px-3 py-3 shrink-0 bg-yt-black border-b border-white/10">
        <button
          onClick={onClose}
          aria-label="Voltar"
          className="p-2 -ml-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
        >
          <Search className="w-5 h-5" />
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onSearch}
            placeholder="Pesquise músicas, álbuns, artistas"
            className="w-full h-11 pl-4 pr-10 bg-yt-search-bg border border-yt-border/50 rounded-full text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none focus:border-white/30 transition-colors"
          />
          {query && (
            <button
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yt-text-secondary hover:text-white transition-colors p-1"
              aria-label="Limpar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <SearchSuggestions
            query={query}
            onClose={onClose}
            onSelectTerm={onSelectTerm}
          />
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {query.trim() === '' ? (
          <div className="text-center py-12 text-yt-text-secondary">
            <p>Comece a digitar para buscar</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-yt-text-secondary border-t-white rounded-full" />
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 text-yt-text-secondary">
            <p>Nenhum resultado encontrado</p>
          </div>
        ) : (
          <div className="py-4 space-y-1">
            {searchResults.map((track) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className="flex items-center gap-3 w-full p-2 hover:bg-white/10 transition-colors text-left rounded"
              >
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
