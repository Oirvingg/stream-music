import { useMemo, useState } from 'react';
import { Library as LibraryIcon, Plus, Heart, Download } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { PlaylistModal } from '../components/PlaylistModal';
import { TrackCard } from '../components/cards/TrackCard';
import { PlaylistCard } from '../components/cards/PlaylistCard';
import { Track } from '../types/music';

type LibraryTab = 'ALL' | 'FAVORITES' | 'PLAYLISTS' | 'DOWNLOADS';

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'ALL', label: 'Tudo' },
  { id: 'FAVORITES', label: 'Músicas curtidas' },
  { id: 'PLAYLISTS', label: 'Playlists criadas' },
  { id: 'DOWNLOADS', label: 'Downloads' },
];

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="bg-yt-pill/50 border border-white/5 rounded-xl p-8 text-center text-yt-text-secondary">
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function Library() {
  const {
    playlists,
    likedTracks,
    setActivePlaylistId,
    setActivePage,
    createPlaylist,
    setTrack,
    setQueue,
    currentTrack,
    isPlaying,
    togglePlay,
    toggleLikeTrack,
  } = usePlayerStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userPlaylists = useMemo(() => {
    const ownerLabel = user?.displayName ?? 'Você';
    return playlists.filter(
      (pl) => pl.creator === ownerLabel || pl.creator === 'Você'
    );
  }, [playlists, user?.displayName]);

  const handlePlaylistClick = (playlist: ReturnType<typeof usePlayerStore.getState>['playlists'][0]) => {
    setActivePage('HOME');
    setActivePlaylistId(playlist.id);
  };

  const handlePlayTrack = (track: Track, trackList: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(trackList);
      setTrack(track);
    }
  };

  const showFavorites = activeTab === 'ALL' || activeTab === 'FAVORITES';
  const showPlaylists = activeTab === 'ALL' || activeTab === 'PLAYLISTS';
  const showDownloads = activeTab === 'ALL' || activeTab === 'DOWNLOADS';

  const tabCounts: Record<LibraryTab, number | null> = {
    ALL: null,
    FAVORITES: likedTracks.length,
    PLAYLISTS: userPlaylists.length,
    DOWNLOADS: 0,
  };

  return (
    <main className="flex-1 flex flex-col overflow-y-auto px-3 md:px-6 py-6 pb-40 md:pb-12 text-white no-scrollbar select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <LibraryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sua Biblioteca</h1>
            <p className="text-xs md:text-sm text-yt-text-secondary">
              {userPlaylists.length} playlists • {likedTracks.length} músicas curtidas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-medium transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova playlist</span>
          <span className="sm:hidden">Criar</span>
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => {
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-1.5 min-h-[44px] rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white text-yt-black'
                  : 'bg-yt-pill text-white/80 hover:bg-yt-surface-hover'
              }`}
            >
              {tab.label}
              {count !== null && count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {showFavorites && (
        <section className="mb-10">
          <h2 className="text-base md:text-[22px] font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Músicas curtidas
          </h2>

          {likedTracks.length === 0 ? (
            <EmptyState
              message="Você ainda não curtiu nenhuma música."
              hint="Clique no ícone de Like durante a reprodução para adicionar músicas aqui."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {likedTracks.map((track, idx) => (
                <TrackCard
                  key={`liked-${track.id}-${idx}`}
                  track={track}
                  trackList={likedTracks}
                  onPlay={handlePlayTrack}
                  onDelete={() => toggleLikeTrack(track)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {showPlaylists && (
        <section className="mb-10">
          <h2 className="text-base md:text-[22px] font-semibold text-white mb-4 flex items-center gap-2">
            <LibraryIcon className="w-5 h-5 text-red-500" />
            Playlists criadas
          </h2>

          {userPlaylists.length === 0 ? (
            <EmptyState
              message="Você ainda não criou nenhuma playlist."
              hint='Use o botão "Nova playlist" para começar.'
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {userPlaylists.map((pl) => (
                <PlaylistCard key={pl.id} playlist={pl} onOpen={handlePlaylistClick} />
              ))}
            </div>
          )}
        </section>
      )}

      {showDownloads && (
        <section className="mb-10">
          <h2 className="text-base md:text-[22px] font-semibold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-yt-text-secondary" />
            Downloads
          </h2>

          <EmptyState
            message="Nenhum download disponível."
            hint="Os downloads aparecerão aqui quando você baixar músicas."
          />
        </section>
      )}

      <PlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(name) => {
          createPlaylist(name);
          setIsModalOpen(false);
        }}
        title="Criar nova playlist"
      />
    </main>
  );
}
