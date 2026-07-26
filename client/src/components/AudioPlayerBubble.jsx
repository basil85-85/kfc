import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2 } from 'react-icons/fi';

const AudioPlayerBubble = ({ audioUrl, audioDuration = 0, isOwn = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration || 0);

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => console.error('Audio playback error:', err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] sm:min-w-[240px] py-1">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition shadow-md ${
          isOwn
            ? 'bg-slate-950 text-cyan-400 hover:bg-slate-900'
            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
        }`}
      >
        {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} className="ml-0.5" />}
      </button>

      {/* Audio Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 mb-1">
          <FiVolume2 size={12} className={isOwn ? 'text-slate-950' : 'text-cyan-400'} />
          <span className={`text-[10px] font-bold tracking-wider uppercase ${isOwn ? 'text-slate-900' : 'text-slate-300'}`}>
            Voice Note
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-950/30 accent-cyan-400 focus:outline-none"
        />

        {/* Duration Timestamps */}
        <div className={`flex justify-between text-[9px] font-mono mt-0.5 ${isOwn ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerBubble;
