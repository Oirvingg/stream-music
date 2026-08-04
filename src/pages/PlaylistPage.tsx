import { useState } from 'react';
import { ChevronLeft, Download, MoreVertical, Pause, Play } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track, getArtistName, getArtistId } from '../types/music';
import { usePlaylistDetails } from '../hooks/useMusicQueries';
import { goBackFromPlaylist, goToArtist } from '../utils/navigation';
import { TrackContextMenu } from '../components/TrackContextMenu';

function formatCompact(n: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatDuration(sec: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatTotalDuration(sec: number): string {
  if (!sec) return '0 min';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

interface PlaylistPageProps {
  playlistId: string;
}

export function PlaylistPage({ playlistId }: PlaylistPageProps) {
  const { setQueue, setTrack, togglePlay, isPlaying, currentTrack } = usePlayerStore();
  const { data: playlist, isLoading } = usePlaylistDetails(playlistId);
  const [contextMenu, setContextMenu] = useState<{ track: Track; x: number; y: number } | null>(null);

  const isPlaylistPlaying = isPlaying && !!playlist?.tracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    if (currentTrack && playlist.tracks.some((t) => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      setQueue(playlist.tracks);
      setTrack(playlist.tracks[0]);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (!playlist) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(playlist.tracks);
      setTrack(track);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ track, x: e.clientX, y: e.clientY });
  };

  if (isLoading) {
    return (
      <main className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white/90 rounded-full animate-spin" />
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center text-yt-text-secondary gap-4">
        <p>Não foi possível carregar esta playlist.</p>
        <button
          onClick={goBackFromPlaylist}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-colors"
        >
          Voltar
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 md:px-8 py-6">
        <button
          onClick={goBackFromPlaylist}
          aria-label="Voltar"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Lado esquerdo: capa e metadados */}
          <div className="lg:w-80 shrink-0 flex flex-col items-start">
            <div className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl mb-6 bg-zinc-800">
              {playlist.pictureXl && (
                <img src={playlist.pictureXl} alt={playlist.title} className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-yt-text-secondary uppercase tracking-wide mb-1">Playlist</p>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">{playlist.title}</h1>
            {playlist.creatorName && (
              <p className="text-sm text-white/80 mb-1">{playlist.creatorName}</p>
            )}
            <p className="text-xs text-yt-text-secondary mb-6">
              {[`${playlist.nbTracks} músicas`, formatTotalDuration(playlist.duration)].filter(Boolean).join(' • ')}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                disabled={playlist.tracks.length === 0}
                aria-label={isPlaylistPlaying ? 'Pausar' : 'Tocar'}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaylistPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>
              <button
                aria-label="Salvar na biblioteca"
                title="Salvar na biblioteca"
                className="p-3 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                aria-label="Mais opções"
                title="Mais opções"
                className="p-3 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lado direito: lista numerada de faixas */}
          <div className="flex-1 min-w-0">
            {playlist.tracks.length === 0 ? (
              <p className="text-yt-text-secondary">Esta playlist não possui faixas disponíveis.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {playlist.tracks.map((track, idx) => {
                  const isActive = currentTrack?.id === track.id;
                  const artistLabel = getArtistName(track.artist);
                  const artistId = getArtistId(track.artist);

                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        handlePlayTrack(track);
                      }}
                      onContextMenu={(e) => handleContextMenu(e, track)}
                      className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                      <span className="w-6 text-center text-sm text-yt-text-secondary group-hover:hidden">
                        {idx + 1}
                      </span>
                      <button className="w-6 hidden group-hover:flex justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </button>
                      <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-red-500 font-medium' : 'text-white/90'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-yt-text-secondary truncate">
                          {artistId ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                goToArtist(artistId);
                              }}
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {artistLabel}
                            </span>
                          ) : (
                            artistLabel
                          )}
                        </p>
                      </div>
                      {typeof track.rank === 'number' && (
                        <span className="hidden md:inline text-xs text-yt-text-secondary w-28 shrink-0">
                          {formatCompact(track.rank)} reproduções
                        </span>
                      )}
                      <span className="text-xs text-yt-text-secondary tabular-nums w-10 text-right">
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, track);
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </main>
  );
}
