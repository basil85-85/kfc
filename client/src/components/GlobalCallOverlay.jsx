import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { FiPhoneCall, FiPhoneOff, FiVideo } from 'react-icons/fi';

export default function GlobalCallOverlay() {
  const { incomingCall, outgoingCall, cancelCall, answerCall, setIsChatOpen } = useContext(ChatContext);

  if (!incomingCall && !outgoingCall) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-11/12 max-w-md font-space select-none animate-bounce">
      {/* INCOMING CALL OVERLAY (Recipient State) */}
      {incomingCall && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/70 bg-[#041d13] p-5 shadow-[0_0_50px_rgba(16,185,129,0.4)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {incomingCall.callerPhoto ? (
                <img
                  src={incomingCall.callerPhoto}
                  alt={incomingCall.callerName}
                  className="h-12 w-12 rounded-full object-cover border-2 border-emerald-400 shadow-md animate-pulse"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-extrabold text-lg shadow-md animate-pulse">
                  {incomingCall.callerName?.charAt(0).toUpperCase() || 'C'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <FiVideo className="animate-pulse" />
                  <span>INCOMING {incomingCall.isVideo ? 'VIDEO' : 'AUDIO'} CALL</span>
                </div>
                <h4 className="font-anton text-lg text-white tracking-wide uppercase leading-tight">
                  {incomingCall.callerName}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400">Ringing... Click Answer to connect</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Decline Button */}
              <button
                onClick={() => cancelCall(incomingCall.roomId)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-950/70 text-rose-300 hover:bg-rose-900 transition shadow-lg"
                title="Decline Call"
              >
                <FiPhoneOff size={18} />
              </button>

              {/* Answer Button */}
              <button
                onClick={() => {
                  answerCall(incomingCall.roomId);
                  setIsChatOpen(true);
                }}
                className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition"
                title="Answer Call"
              >
                <FiPhoneCall size={16} />
                <span>ANSWER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OUTGOING CALL OVERLAY (Caller State) */}
      {outgoingCall && !incomingCall && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/70 bg-[#041724] p-5 shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 font-extrabold text-lg shadow-md animate-bounce">
                <FiPhoneCall size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>CALLING MEMBER</span>
                </div>
                <h4 className="font-anton text-lg text-white tracking-wide uppercase leading-tight">
                  {outgoingCall.contactName}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400">Ringing recipient's device...</p>
              </div>
            </div>

            <button
              onClick={() => cancelCall(outgoingCall.roomId)}
              className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/70 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-900 transition shadow-lg"
            >
              <FiPhoneOff size={16} />
              <span>CANCEL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
