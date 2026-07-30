import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Maximize2,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { ExpandedPlayer } from './ExpandedPlayer';

export function PlayerBar() {
  const { 
    currentTrack, isPlaying, togglePlay, 
    volume, setVolume, 
    currentTime, duration, nextTrack, prevTrack,
    toggleExpand, feedbackMessage
  } = usePlayerStore();

  const { seek } = useAudioPlayer();

  const artistName = currentTrack
    ? typeof currentTrack.artist === 'string'
      ? currentTrack.artist
      : currentTrack.artist.name
    : '';

  const formatTime = (sec: number) => {
    if (sec === undefined || sec === null || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePrevTrack = () => {
    if (currentTime > 3) {
      seek(0);
    } else {
      prevTrack();
    }
  };

  return (
    <>
      <ExpandedPlayer seek={seek} />

      {/* Keyboard Shortcut Feedback Toast */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-8 py-5 rounded-2xl shadow-2xl z-[9999] transition-all duration-300 pointer-events-none flex items-center justify-center ${
          feedbackMessage ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <span className="text-2xl font-bold tracking-wide">{feedbackMessage}</span>
      </div>

      <footer className="h-14 md:h-[72px] bg-yt-player-bg flex items-center px-2 md:px-4 select-none shrink-0 z-50 relative">
      {/* Mobile-only thin progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 md:hidden">
        <div 
          className="h-full bg-red-500 transition-all duration-200"
          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>
      {/* LEFT — Transport controls + time */}
      <div className="flex items-center gap-1 md:min-w-[320px] md:w-1/3">
        <button onClick={handlePrevTrack} className="hidden md:block p-2 text-white/70 hover:text-white transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlay}
          disabled={!currentTrack}
          className="p-2 text-white hover:text-white/80 transition-colors disabled:text-white/30"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-white" />
          ) : (
            <Play className="w-6 h-6 fill-white" />
          )}
        </button>

        <button onClick={nextTrack} className="hidden md:block p-2 text-white/70 hover:text-white transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>

        <input 
          type="range" 
          min={0} 
          max={duration > 0 ? duration : 100} 
          value={currentTime || 0} 
          onChange={(e) => seek(Number(e.target.value))} 
          className="hidden md:block w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600 mx-3" 
        />

        <span className="hidden md:inline text-xs text-yt-text-secondary font-medium tabular-nums whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* CENTER — Track info */}
      <div 
        onClick={toggleExpand}
        className="flex-1 flex items-center justify-center gap-3 min-w-0 px-4 cursor-pointer hover:bg-white/5 mx-2 rounded-lg transition-colors py-1"
      >
        {currentTrack ? (
          <>
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex flex-col min-w-0 max-w-[300px]">
              <span className="text-sm font-medium text-white truncate">
                {currentTrack.title}
              </span>
              <span className="text-xs text-yt-text-secondary truncate">
                {artistName} • 2.5M de visualizações
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 ml-4">
              <button className="p-1.5 text-white/60 hover:text-white transition-colors">
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-white/60 hover:text-white transition-colors">
                <ThumbsUp className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <span className="text-sm text-yt-text-secondary">Nenhuma música selecionada</span>
        )}
      </div>

      {/* RIGHT — Volume, repeat, expand */}
        <div className="hidden md:flex items-center gap-1 min-w-[200px] justify-end">
          <button
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1"
          />

          <button className="p-2 text-white/60 hover:text-white transition-colors">
            <Repeat className="w-4 h-4" />
          </button>

          <button onClick={toggleExpand} className="p-2 text-white/60 hover:text-white transition-colors ml-1">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
    </footer>
    </>
  );
}
