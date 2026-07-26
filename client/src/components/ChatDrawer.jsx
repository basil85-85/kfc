import { useContext, useState, useEffect, useRef } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import ChatRoomManager from './ChatRoomManager';
import VideoConferencePanel from './VideoConferencePanel';
import NewDirectMessageModal from './NewDirectMessageModal';
import AudioPlayerBubble from './AudioPlayerBubble';
import UnauthenticatedPromptCard from './UnauthenticatedPromptCard';
import {
  FiX,
  FiSend,
  FiRadio,
  FiUsers,
  FiHash,
  FiMessageSquare,
  FiTrash2,
  FiAlertCircle,
  FiShield,
  FiUser,
  FiPlus,
  FiMic,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiSmile,
  FiVolume2,
  FiVolumeX,
  FiCheckCircle
} from 'react-icons/fi';

const QUICK_EMOJIS = ['⚽', '🔥', '🏆', '👍', '❤️', '👏', '😊', '💪', '🎯', '🥇'];

export default function ChatDrawer() {
  const { user } = useContext(AuthContext);
  const {
    rooms,
    activeRoomId,
    setActiveRoomId,
    messages,
    typingUsers,
    isChatOpen,
    setIsChatOpen,
    sendMessage,
    startTyping,
    stopTyping,
    deleteMessage,
    markRoomRead
  } = useContext(ChatContext);

  const [inputContent, setInputContent] = useState('');
  const [showManager, setShowManager] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const duration = recordingDuration;
    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        try {
          await sendMessage(activeRoomId, '', 'audio', base64Audio, duration);
        } catch (err) {
          console.error('Error sending voice note:', err);
        }
      };

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setRecordingDuration(0);
    };

    mediaRecorder.stop();
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const activeRoom = rooms.find((r) => r._id === activeRoomId);
  const activeMessages = messages[activeRoomId] || [];
  const activeTyping = typingUsers[activeRoomId] || [];

  const isBroadcast = activeRoom?.type === 'broadcast';
  const canSendInActiveRoom = !isBroadcast || user?.role === 'admin';

  // Filter messages by search query if search is active
  const filteredMessages = searchQuery.trim()
    ? activeMessages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeMessages;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length, isChatOpen, activeRoomId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputContent]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputContent(value);

    if (activeRoomId && canSendInActiveRoom) {
      startTyping(activeRoomId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeRoomId);
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeRoomId || !canSendInActiveRoom || isSending) return;

    const text = inputContent.trim();
    setInputContent('');
    setShowEmojiPicker(false);
    stopTyping(activeRoomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      setIsSending(true);
      await sendMessage(activeRoomId, text);
    } catch {
      setInputContent(text);
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setInputContent((prev) => prev + emoji);
  };

  const [isDmModalOpen, setIsDmModalOpen] = useState(false);

  const getRoomIcon = (type) => {
    switch (type) {
      case 'broadcast':
        return <FiRadio className="text-amber-400" />;
      case 'team':
        return <FiUsers className="text-cyan-400" />;
      case 'custom':
        return <FiHash className="text-purple-400" />;
      case 'direct':
        return <FiUser className="text-emerald-400" />;
      default:
        return <FiMessageSquare className="text-slate-400" />;
    }
  };

  const getRoomDisplayName = (room) => {
    if (!room) return '';
    if (room.type === 'direct' && Array.isArray(room.members)) {
      const otherMember = room.members.find((m) => String(m._id || m) !== String(user?._id));
      if (otherMember && otherMember.name) {
        return otherMember.name;
      }
    }
    return room.name;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={() => setIsChatOpen(false)} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md border-l border-slate-800 bg-slate-950 shadow-2xl flex flex-col font-space">
          
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
                <FiMessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100 leading-tight">
                  KFC Real-Time Chat — Admin Access
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                  <span>•</span>
                  <span>{user ? (user.role === 'admin' ? 'Admin' : user.team?.name || 'Club Member') : 'Guest'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title={soundEnabled ? 'Mute Notifications' : 'Enable Notification Sound'}
              >
                {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} className="text-rose-400" />}
              </button>

              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch((prev) => !prev)}
                className={`rounded-lg p-1.5 transition ${
                  showSearch ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title="Search Messages"
              >
                <FiSearch size={16} />
              </button>

              {/* Close Drawer */}
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                title="Close Drawer"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* SEARCH BAR (IF TOGGLED) */}
          {showSearch && (
            <div className="border-b border-slate-800 bg-slate-900/60 p-2 flex items-center gap-2">
              <FiSearch className="text-slate-400 ml-2" size={14} />
              <input
                type="text"
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white p-1">
                  <FiX size={12} />
                </button>
              )}
            </div>
          )}

          {!user ? (
            <UnauthenticatedPromptCard
              compact
              onClose={() => setIsChatOpen(false)}
              title="Log in to join the conversation"
              subtitle="Chat with your teammates, join match rooms, and stay connected with KFC."
              icon="chat"
            />
          ) : (
            <>
              {/* ROOM MANAGEMENT TOGGLE (Admin or Manager) */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <div>
                  <button
                    onClick={() => setShowManager((prev) => !prev)}
                    className="flex w-full items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200"
                  >
                    <span>Manage Rooms & Members</span>
                    {showManager ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {showManager && <ChatRoomManager />}
                </div>
              )}

              {/* ROOM SELECTOR TABS & NEW DM BUTTON */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-2 py-1.5">
                <div className="flex overflow-x-auto gap-1.5 scrollbar-none flex-1 pr-2">
                  {rooms.map((room) => {
                    const isActive = room._id === activeRoomId;
                    const displayName = getRoomDisplayName(room);
                    return (
                      <button
                        key={room._id}
                        onClick={() => {
                          setActiveRoomId(room._id);
                          markRoomRead(room._id);
                        }}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition border ${
                          isActive
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-sm font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {getRoomIcon(room.type)}
                        <span>{displayName}</span>
                        {room.unreadCount > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-950">
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* New DM Button */}
                <button
                  onClick={() => setIsDmModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition shrink-0"
                  title="Start a 1-on-1 Direct Message"
                >
                  <FiPlus size={13} />
                  <span>DM</span>
                </button>
              </div>

              {/* ACTIVE ROOM BANNER */}
              {activeRoom && (
                <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/20 px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    {getRoomIcon(activeRoom.type)}
                    <span>{getRoomDisplayName(activeRoom)}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {activeRoom.type === 'direct' ? 'Direct' : activeRoom.type}
                    </span>
                  </div>
                </div>
              )}

              {/* NEW DIRECT MESSAGE MODAL */}
              <NewDirectMessageModal isOpen={isDmModalOpen} onClose={() => setIsDmModalOpen(false)} />

              {/* BROADCAST READ-ONLY NOTICE FOR NON-ADMIN */}
              {isBroadcast && user?.role !== 'admin' && (
                <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-300 font-medium">
                  <FiAlertCircle className="shrink-0 text-amber-400" />
                  <span>📢 Official Announcements channel — Read-only mode.</span>
                </div>
              )}

              {/* DOCKED VIDEO & AUDIO CONFERENCE PANEL */}
              {activeRoom && <VideoConferencePanel activeRoom={activeRoom} user={user} />}

              {/* MESSAGES THREAD CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/50">
                {filteredMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-6">
                    <FiMessageSquare size={32} className="mb-2 text-slate-600" />
                    <p className="text-xs font-semibold">No messages found.</p>
                    <p className="text-[11px] text-slate-600">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;

                    // Consecutive Message Grouping: check if previous message was from the same sender
                    const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                    const prevSenderId = prevMsg ? (prevMsg.sender?._id || prevMsg.sender) : null;
                    const currentSenderId = msg.sender?._id || msg.sender;
                    const isFirstInGroup = !prevMsg || String(prevSenderId) !== String(currentSenderId);

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col group ${isOwn ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                      >
                        {/* Sender Info Header (Only rendered on the first message of a consecutive group) */}
                        {!isOwn && isFirstInGroup && (
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-semibold">
                            {msg.sender?.role === 'admin' ? (
                              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                <FiShield size={10} /> Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-300">
                                <FiUser size={10} /> {msg.senderName}
                              </span>
                            )}
                            {msg.senderTeam && <span className="text-slate-500">• {msg.senderTeam}</span>}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className="relative max-w-[85%]">
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-md ${
                              isOwn
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium rounded-br-none'
                                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                            }`}
                          >
                            {msg.messageType === 'audio' ? (
                              <AudioPlayerBubble
                                audioUrl={msg.audioUrl}
                                audioDuration={msg.audioDuration}
                                isOwn={isOwn}
                              />
                            ) : (
                              msg.content
                            )}
                          </div>

                          {/* Timestamp & Status Ticks */}
                          <div
                            className={`flex items-center gap-1.5 mt-0.5 px-1 text-[9px] text-slate-500 ${
                              isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{formatTime(msg.sentAt)}</span>

                            {/* Sent / Delivered / Seen Status Ticks */}
                            {isOwn && (
                              <span className="text-cyan-400 flex items-center" title="Delivered & Seen">
                                <FiCheckCircle size={10} />
                              </span>
                            )}

                            {user?.role === 'admin' && (
                              <button
                                onClick={() => deleteMessage(msg._id, activeRoomId)}
                                className="hidden group-hover:inline-block text-rose-400 hover:text-rose-300 ml-1"
                                title="Delete message (Admin moderation)"
                              >
                                <FiTrash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* TYPING INDICATOR */}
                {activeTyping.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-cyan-400 italic py-1 px-2">
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.4s]"></span>
                    </span>
                    <span>
                      {activeTyping.map((u) => u.name).join(', ')}{' '}
                      {activeTyping.length > 1 ? 'are' : 'is'} typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK EMOJI PICKER DRAWER */}
              {showEmojiPicker && (
                <div className="border-t border-slate-800 bg-slate-900/90 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {QUICK_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => addEmoji(emoji)}
                      className="rounded-lg bg-slate-800 p-1.5 text-base hover:bg-slate-700 hover:scale-110 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT FORM & RECORDING INTERFACE */}
              {canSendInActiveRoom ? (
                isRecording ? (
                  <div className="border-t border-slate-800 bg-slate-900/90 p-3">
                    <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <span className="text-xs font-bold text-rose-300">Recording Voice Note...</span>
                        <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60 < 10 ? '0' : '') + (recordingDuration % 60)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                          title="Cancel recording"
                        >
                          <FiX size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={stopAndSendRecording}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          title="Send Voice Note"
                        >
                          <FiSend size={14} />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-900/90 p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 px-1">
                      <span>Shift + Enter for new line</span>
                      <span className={inputContent.length > 900 ? 'text-amber-400 font-bold' : ''}>
                        {inputContent.length} / 1000
                      </span>
                    </div>

                    <div className="flex items-end gap-2">
                      {/* Emoji Picker Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition shrink-0 ${
                          showEmojiPicker
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                        title="Emoji Picker"
                      >
                        <FiSmile size={16} />
                      </button>

                      {/* Microphone Voice Note Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-cyan-400 transition hover:bg-cyan-500/10 hover:border-cyan-500/40 shrink-0"
                        title="Record Voice Note"
                      >
                        <FiMic size={16} />
                      </button>

                      {/* Auto-resizing Textarea */}
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder={`Message ${getRoomDisplayName(activeRoom)}...`}
                        value={inputContent}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        maxLength={1000}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none max-h-32"
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!inputContent.trim() || isSending}
                        className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all duration-200 ${
                          inputContent.trim()
                            ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan hover:bg-cyan-400 active:scale-95 cursor-pointer'
                            : 'bg-cyan-500/30 text-slate-400 border border-cyan-500/20 cursor-not-allowed opacity-70'
                        }`}
                        title="Send Message (Enter)"
                      >
                        <FiSend size={14} className="shrink-0" />
                        <span className="hidden sm:inline font-extrabold uppercase tracking-wider text-[11px]">Send</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div className="border-t border-slate-800 bg-slate-900/90 p-3 text-center text-xs text-slate-500">
                  Only Administrators can post messages in this room.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
