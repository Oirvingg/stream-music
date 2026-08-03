import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { searchTracks } from '../services/deezerService';
import { useAddTrackToPlaylist } from '../hooks/useLibraryQueries';
import { Track } from '../types/music';

interface AddTrackToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  existingTrackIds: string[];
}

export function AddTrackToPlaylistModal({ isOpen, onClose, playlistId, existingTrackIds }: AddTrackToPlaylistModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addTrackToPlaylist = useAddTrackToPlaylist();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['addTrackSearch', debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#212121] rounded-lg shadow-2xl w-full max-w-lg border border-white/10 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-bold text-white">Adicionar músicas</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-secondary pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise músicas para adicionar"
              className="w-full h-10 pl-11 pr-4 bg-zinc-800 border border-transparent rounded-lg text-sm text-white placeholder:text-yt-text-tertiary outline-none focus:border-red-600 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-yt-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : isError ? (
            <p className="text-center text-sm text-yt-text-secondary py-12">
              Não foi possível buscar músicas. Tente novamente.
            </p>
          ) : debouncedQuery.length === 0 ? (
            <p className="text-center text-sm text-yt-text-secondary py-12">
              Digite para pesquisar músicas e adicioná-las a esta playlist.
            </p>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-yt-text-secondary py-12">
              Nenhum resultado para "{debouncedQuery}".
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((track) => (
                <TrackResultRow
                  key={track.id}
                  track={track}
                  isAdded={existingTrackIds.includes(track.id)}
                  isPending={addTrackToPlaylist.isPending && addTrackToPlaylist.variables?.track.id === track.id}
                  onAdd={() => addTrackToPlaylist.mutate({ playlistId, track })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackResultRow({
  track,
  isAdded,
  isPending,
  onAdd,
}: {
  track: Track;
  isAdded: boolean;
  isPending: boolean;
  onAdd: () => void;
}) {
  const artistLabel = typeof track.artist === 'string' ? track.artist : track.artist.name;

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
      <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{track.title}</p>
        <p className="text-xs text-yt-text-secondary truncate">{artistLabel}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={isAdded || isPending}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        title={isAdded ? 'Já está na playlist' : 'Adicionar à playlist'}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isAdded ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
