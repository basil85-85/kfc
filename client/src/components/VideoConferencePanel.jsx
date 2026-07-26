import { useState, useRef, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiPhoneCall,
  FiMinimize2,
  FiMaximize2,
  FiRadio,
  FiUsers,
} from 'react-icons/fi';

const VideoConferencePanel = ({ activeRoom, user }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const jitsiApiRef = useRef(null);

  const roomSlug = activeRoom?.videoRoomName || `kfc-room-${activeRoom?._id}`;
  const displayName = user?.name || 'KFC Member';

  // Reset call active state when room changes to trigger auto-join
  useEffect(() => {
    setIsCallActive(true);
  }, [activeRoom?._id]);

  const handleApiReady = (apiObj) => {
    jitsiApiRef.current = apiObj;

    apiObj.on('videoConferenceJoined', () => {
      console.log('🎥 Live Video & Audio Conference Joined:', roomSlug);
    });

    apiObj.on('readyToClose', () => {
      setIsCallActive(false);
    });
  };

  if (!activeRoom) return null;

  return (
    <div className="border-b border-slate-800 bg-slate-900/90 transition-all duration-300">
      {/* CONFERENCE PANEL HEADER */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isCallActive ? 'bg-emerald-400 opacity-75' : 'bg-slate-500'}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isCallActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <FiVideo className="text-cyan-400" />
            {isCallActive ? 'Live Video & Audio' : 'Conference Disconnected'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Leave / Rejoin Call Toggle */}
          {isCallActive ? (
            <button
              onClick={() => setIsCallActive(false)}
              className="flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/30 px-2 py-1 text-[10px] font-bold text-rose-400 hover:bg-rose-500/20 transition"
              title="Leave video/audio call (stay in text chat)"
            >
              <FiPhoneOff size={12} />
              <span>Leave</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCallActive(true)}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
              title="Rejoin video/audio conference"
            >
              <FiPhoneCall size={12} />
              <span>Rejoin</span>
            </button>
          )}

          {/* Minimize / Expand Toggle */}
          {isCallActive && (
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white transition"
              title={isMinimized ? 'Expand Video Grid' : 'Minimize Video Grid'}
            >
              {isMinimized ? <FiMaximize2 size={13} /> : <FiMinimize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* MINIMIZED COMPACT VOICE BAR */}
      {isCallActive && isMinimized && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <FiUsers className="text-cyan-400" />
            <span className="font-semibold text-[11px]">Audio/Video active in background</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-[10px] font-bold text-cyan-400 underline hover:text-cyan-300"
          >
            Show Video Grid
          </button>
        </div>
      )}

      {/* EXPANDED VIDEO GRID CONTAINER */}
      {isCallActive && !isMinimized && (
        <div className="h-64 w-full bg-slate-950 relative overflow-hidden">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomSlug}
            userInfo={{
              displayName,
              email: user?.email,
            }}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: false, // Auto-join directly without prejoin page prompt!
              disableDeepLinking: true,
              disableThirdPartyRequests: true,
              disableAnalytics: true,
              analytics: {
                disabled: true,
              },
              gravatar: {
                disabled: true,
              },
              toolbarButtons: [
                'microphone',
                'camera',
                'tileview',
                'raisehand',
                'hangup',
              ],
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              DEFAULT_BACKGROUND: '#090d16',
              TOOLBAR_ALWAYS_VISIBLE: true,
            }}
            onApiReady={handleApiReady}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
              iframeRef.style.border = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoConferencePanel;
