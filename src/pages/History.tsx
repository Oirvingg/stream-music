import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TrackCard } from '../components/cards/TrackCard';
import { Track } from '../types/music';

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="bg-yt-pill/50 border border-white/5 rounded-xl p-8 text-center text-yt-text-secondary">
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function History() {
  const { history, currentTrack, isPlaying, togglePlay, setQueue, setTrack } = usePlayerStore();

  const handlePlayTrack = (track: Track, trackList: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(trackList);
      setTrack(track);
    }
  };

  const clearHistory = () => {
    usePlayerStore.setState({ history: [] });
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden px-3 md:px-6 pt-6 text-white no-scrollbar select-none">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Histórico</h1>
            <p className="text-xs md:text-sm text-yt-text-secondary">
              {history.length} {history.length === 1 ? 'música tocada recentemente' : 'músicas tocadas recentemente'}
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yt-pill hover:bg-yt-surface-hover text-white/80 hover:text-white text-xs md:text-sm font-medium transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar histórico</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-12">
        {history.length === 0 ? (
          <EmptyState
            message="Nenhuma música tocada ainda."
            hint="As faixas que você reproduzir aparecerão aqui."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map((track, idx) => (
              <TrackCard
                key={`history-${track.id}-${idx}`}
                track={track}
                trackList={history}
                onPlay={handlePlayTrack}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
