import { useEffect, useMemo, useState } from 'react';
import { Check, Music, Plus, ThumbsUp, X } from 'lucide-react';
import { Track } from '../types/music';
import {
  UserPlaylist,
  useUserPlaylists,
  useFavoriteTracks,
  useAddTrackToPlaylist,
  useToggleFavoriteTrack,
  useCreatePlaylist,
} from '../hooks/useLibraryQueries';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { usePlayerStore } from '../store/usePlayerStore';
import { PlaylistModal } from './PlaylistModal';

const RECENT_PLAYLISTS_KEY = 'recentPlaylistIds';
const MAX_RECENT = 4;

function getRecentPlaylistIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushRecentPlaylistId(id: string) {
  const next = [id, ...getRecentPlaylistIds().filter((existing) => existing !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(next));
}

interface SaveToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

export function SaveToPlaylistModal({ isOpen, onClose, track }: SaveToPlaylistModalProps) {
  const { data: playlists = [] } = useUserPlaylists();
  const { data: likedTracks = [] } = useFavoriteTracks();
  const addTrackToPlaylist = useAddTrackToPlaylist();
  const toggleFavoriteTrack = useToggleFavoriteTrack();
  const createPlaylist = useCreatePlaylist();
  const requireAuth = useRequireAuth();
  const setFeedbackMessage = usePlayerStore((s) => s.setFeedbackMessage);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setRecentIds(getRecentPlaylistIds());
  }, [isOpen]);

  const isLiked = likedTracks.some((t) => t.id === track.id);

  const recentPlaylists = useMemo(
    () => recentIds.map((id) => playlists.find((pl) => pl.id === id)).filter((pl): pl is UserPlaylist => !!pl),
    [recentIds, playlists]
  );

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  const handleSelectPlaylist = (playlist: UserPlaylist) => {
    if (!requireAuth()) return;
    addTrackToPlaylist.mutate({ playlistId: playlist.id, track });
    pushRecentPlaylistId(playlist.id);
    showFeedback(`Adicionado a "${playlist.title}"`);
    onClose();
  };

  const handleToggleLiked = () => {
    if (!requireAuth()) return;
    if (!isLiked) {
      toggleFavoriteTrack.mutate(track);
      showFeedback('Adicionado a Músicas que gostei');
    }
    onClose();
  };

  const handleCreatePlaylist = (title: string) => {
    if (!requireAuth()) return;
    createPlaylist.mutate(title, {
      onSuccess: (playlist) => {
        addTrackToPlaylist.mutate({ playlistId: playlist.id, track });
        pushRecentPlaylistId(playlist.id);
        showFeedback(`Adicionado a "${playlist.title}"`);
        setCreateModalOpen(false);
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" onClick={onClose}>
        <div
          className="bg-[#212121] rounded-xl shadow-2xl w-full max-w-md border border-white/10 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 pb-4 shrink-0">
            <h2 className="text-xl font-bold text-white">Salvar na playlist</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            {recentPlaylists.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white/80 mb-3">Recentes</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {recentPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl)}
                      className="flex-shrink-0 w-24 text-left group"
                    >
                      <div className="w-24 h-24 rounded-md overflow-hidden mb-2 bg-gradient-to-br from-red-600/40 to-purple-600/40">
                        {pl.tracks[0]?.coverUrl ? (
                          <img
                            src={pl.tracks[0].coverUrl}
                            alt={pl.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-8 h-8 text-white/60" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-white truncate">{pl.title}</p>
                      <p className="text-[11px] text-yt-text-secondary truncate">
                        {pl.tracks.length} {pl.tracks.length === 1 ? 'música' : 'músicas'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3">Todas as playlists</h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleToggleLiked}
                  className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">Músicas que gostei</p>
                    <p className="text-xs text-yt-text-secondary truncate">
                      {likedTracks.length} {likedTracks.length === 1 ? 'música' : 'músicas'}
                    </p>
                  </div>
                  {isLiked && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                </button>

                {playlists.map((pl) => {
                  const alreadyAdded = pl.tracks.some((t) => t.id === track.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl)}
                      className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-gradient-to-br from-red-600/40 to-purple-600/40">
                        {pl.tracks[0]?.coverUrl ? (
                          <img src={pl.tracks[0].coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-white/60" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{pl.title}</p>
                        <p className="text-xs text-yt-text-secondary truncate">
                          {pl.tracks.length} {pl.tracks.length === 1 ? 'música' : 'músicas'}
                        </p>
                      </div>
                      {alreadyAdded && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova playlist
            </button>
          </div>
        </div>
      </div>

      <PlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreatePlaylist}
        title="Nova playlist"
      />
    </>
  );
}
