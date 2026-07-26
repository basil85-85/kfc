import { useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiSmile,
  FiVolume2,
  FiVolumeX,
  FiCheckCircle,
  FiArrowLeft,
  FiPhone,
  FiVideo,
  FiPaperclip,
  FiSettings,
  FiPhoneCall,
  FiPhoneOff
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
    markRoomRead,
    incomingCall,
    setIncomingCall,
    triggerCallNotification
  } = useContext(ChatContext);

  const [inputContent, setInputContent] = useState('');
  const [showManager, setShowManager] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  // File Upload State
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Strictly Deduplicate Rooms list
  const uniqueRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    return rooms.reduce((acc, room) => {
      if (!room || !room._id) return acc;
      if (acc.some((r) => r._id === room._id)) return acc;

      if (room.type === 'direct' && Array.isArray(room.members)) {
        const otherMember = room.members.find((m) => String(m._id || m) !== String(user?._id));
        const otherMemberId = otherMember?._id || otherMember;
        const existingDm = acc.find((r) => {
          if (r.type !== 'direct' || !Array.isArray(r.members)) return false;
          const other = r.members.find((m) => String(m._id || m) !== String(user?._id));
          return String(other?._id || other) === String(otherMemberId);
        });
        if (existingDm) return acc;
      }

      acc.push(room);
      return acc;
    }, []);
  }, [rooms, user]);

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

  const activeRoom = uniqueRooms.find((r) => r._id === activeRoomId) || uniqueRooms[0] || null;
  const activeMessages = messages[activeRoom?._id] || [];
  const activeTyping = typingUsers[activeRoom?._id] || [];

  const isBroadcast = activeRoom?.type === 'broadcast';
  const canSendInActiveRoom = !isBroadcast || user?.role === 'admin';

  // Filter conversations list
  const filteredRooms = uniqueRooms.filter((room) => {
    if (!conversationSearch.trim()) return true;
    const query = conversationSearch.toLowerCase();
    const displayName = getRoomDisplayName(room).toLowerCase();
    return displayName.includes(query) || room.type?.toLowerCase().includes(query);
  });

  // Filter messages by search query if search is active
  const filteredMessages = messageSearchQuery.trim()
    ? activeMessages.filter((m) =>
        m.content?.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
        m.senderName?.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : activeMessages;

  // Total unread count
  const totalUnread = uniqueRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length, isChatOpen, activeRoom?._id]);

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

    if (activeRoom?._id && canSendInActiveRoom) {
      startTyping(activeRoom._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeRoom._id);
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
    if (!inputContent.trim() || !activeRoom?._id || !canSendInActiveRoom || isSending) return;

    const text = inputContent.trim();
    setInputContent('');
    setShowEmojiPicker(false);
    stopTyping(activeRoom._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      setIsSending(true);
      await sendMessage(activeRoom._id, text);
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

  function getRoomDisplayName(room) {
    if (!room) return '';
    if (room.type === 'direct' && Array.isArray(room.members)) {
      const otherMember = room.members.find((m) => String(m._id || m) !== String(user?._id));
      if (otherMember && otherMember.name) {
        return otherMember.name;
      }
    }
    return room.name;
  }

  function getDmMember(room) {
    if (room && room.type === 'direct' && Array.isArray(room.members)) {
      return room.members.find((m) => String(m._id || m) !== String(user?._id));
    }
    return null;
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render User Profile Avatar Badge (Photo Image or Initial Circle)
  const renderAvatar = (msgSender, isOwn = false, size = 'h-9 w-9') => {
    const photo = msgSender?.photoURL || msgSender?.avatar;
    const name = msgSender?.name || msgSender?.senderName || (isOwn ? user?.name : 'User') || 'U';
    const firstLetter = name.charAt(0).toUpperCase();

    if (photo) {
      return (
        <img
          src={photo}
          alt={name}
          className={`${size} rounded-full object-cover border-2 ${isOwn ? 'border-cyan-400' : 'border-emerald-500/40'} shadow-md shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${size} rounded-full flex items-center justify-center font-extrabold text-xs uppercase shadow-md border-2 shrink-0 ${
          isOwn
            ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 border-cyan-300'
            : msgSender?.role === 'admin'
            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-300'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white border-slate-700'
        }`}
      >
        {firstLetter}
      </div>
    );
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 lg:p-8 flex items-center justify-center font-space">
      {/* Background Overlay Click to Close */}
      <div className="absolute inset-0" onClick={() => setIsChatOpen(false)} />

      {/* INCOMING CALL NOTIFICATION MODAL BANNER */}
      {incomingCall && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md rounded-2xl border-2 border-emerald-500/60 bg-[#041d13] p-4 shadow-2xl animate-bounce">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 animate-pulse">
                <FiPhoneCall size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">INCOMING CALL FROM {incomingCall.callerName?.toUpperCase()}</h4>
                <p className="text-[10px] text-emerald-400">Click Join to connect with audio & video</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIncomingCall(null)}
                className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-2 text-rose-300 hover:bg-rose-900 transition"
              >
                <FiPhoneOff size={16} />
              </button>
              <button
                onClick={() => {
                  setIncomingCall(null);
                  if (activeRoom) triggerCallNotification(activeRoom._id, true);
                }}
                className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <FiPhoneCall size={14} />
                <span>ANSWER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL TWO-PANEL MESSENGER CONTAINER */}
      <div className="relative z-10 w-full max-w-6xl h-[88vh] bg-[#020905] border-2 border-emerald-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* ═════════════════════════════════════════════════════════════
            LEFT PANEL — CONVERSATIONS LIST (~30% - 35% WIDTH)
            ═════════════════════════════════════════════════════════════ */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-emerald-900/30 bg-[#031109] flex flex-col ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Left Header */}
          <div className="flex items-center justify-between border-b border-emerald-900/30 p-4 bg-[#051a0f]/90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-anton text-lg shadow-md shadow-emerald-500/20">
                MU
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-anton text-base text-white uppercase tracking-wide">MESSAGES</h3>
                  {totalUnread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[10px] font-extrabold text-slate-950">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold">
                  {user ? (user.role === 'admin' ? 'Admin Access' : user.team?.name || 'Club Supporter') : 'Guest'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setShowManager((prev) => !prev)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-emerald-900/40 hover:text-white transition"
                  title="Manage Rooms & Members"
                >
                  <FiSettings size={17} />
                </button>
              )}
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-emerald-900/40 hover:text-white md:hidden transition"
                title="Close Messenger"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

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
              {/* Collapsible Room & Member Management (Admin) */}
              {showManager && (
                <div className="border-b border-emerald-900/40 bg-[#062417] p-2">
                  <ChatRoomManager />
                </div>
              )}

              {/* Conversation Search Bar */}
              <div className="p-3 border-b border-emerald-900/30 bg-[#020d07]">
                <div className="relative flex items-center">
                  <FiSearch className="absolute left-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    className="w-full rounded-xl border border-emerald-900/40 bg-[#010804] pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  {conversationSearch && (
                    <button onClick={() => setConversationSearch('')} className="absolute right-3 text-slate-400 hover:text-white">
                      <FiX size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Start DM Action Button */}
              <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CHANNELS & DIRECT MESSAGES</span>
                <button
                  onClick={() => setIsDmModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  <FiPlus size={12} />
                  <span>+ DM</span>
                </button>
              </div>

              {/* Deduplicated Conversations List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredRooms.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                    No conversations found.
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const isActive = room._id === activeRoom?._id;
                    const displayName = getRoomDisplayName(room);
                    const dmMember = getDmMember(room);
                    const roomMsgs = messages[room._id] || [];
                    const lastMsg = roomMsgs[roomMsgs.length - 1];

                    return (
                      <button
                        key={room._id}
                        onClick={() => {
                          setActiveRoomId(room._id);
                          markRoomRead(room._id);
                          setMobileShowChat(true);
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition duration-200 border ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-950 via-[#062c1e] to-emerald-950 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/50'
                            : 'border-transparent text-slate-300 hover:bg-emerald-900/20 hover:text-white'
                        }`}
                      >
                        {/* Conversation Avatar */}
                        <div className="relative shrink-0">
                          {dmMember ? (
                            renderAvatar(dmMember, false, 'h-11 w-11')
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                              {getRoomIcon(room.type)}
                            </div>
                          )}
                          {room.type === 'direct' && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                          )}
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-bold text-xs truncate text-white">{displayName}</h4>
                            {lastMsg && (
                              <span className="text-[10px] text-slate-400">{formatTime(lastMsg.sentAt)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                              {lastMsg ? lastMsg.content || '🎤 Voice Note' : 'No messages yet'}
                            </p>
                            {room.unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-extrabold text-slate-950">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT PANEL — ACTIVE CHAT THREAD (~65% - 70% WIDTH)
            ═════════════════════════════════════════════════════════════ */}
        <div
          className={`flex-1 flex flex-col bg-[#020905] ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeRoom ? (
            <>
              {/* Right Header */}
              <div className="flex items-center justify-between border-b border-emerald-900/30 bg-[#051a0f]/90 p-3.5">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Back to Conversations"
                  >
                    <FiArrowLeft size={18} />
                  </button>

                  {/* Contact Avatar & Online Info */}
                  <div className="flex items-center gap-3">
                    {getDmMember(activeRoom) ? (
                      renderAvatar(getDmMember(activeRoom), false, 'h-10 w-10')
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                        {getRoomIcon(activeRoom.type)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white leading-tight">
                        {getRoomDisplayName(activeRoom)}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                        <span>•</span>
                        <span className="capitalize">{activeRoom.type} Room</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Action Toolbar Icons */}
                <div className="flex items-center gap-2">
                  {/* Audio Call */}
                  <button
                    onClick={() => triggerCallNotification(activeRoom._id, false)}
                    className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-2.5 text-emerald-400 hover:bg-emerald-900/60 hover:text-white transition"
                    title="Start Audio Call"
                  >
                    <FiPhone size={15} />
                  </button>

                  {/* Video Call */}
                  <button
                    onClick={() => triggerCallNotification(activeRoom._id, true)}
                    className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-2.5 text-emerald-400 hover:bg-emerald-900/60 hover:text-white transition"
                    title="Start Video Call"
                  >
                    <FiVideo size={15} />
                  </button>

                  {/* Notification Sound Toggle */}
                  <button
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-2.5 text-slate-400 hover:bg-emerald-900/60 hover:text-white transition"
                    title={soundEnabled ? 'Mute Notifications' : 'Enable Notification Sound'}
                  >
                    {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} className="text-rose-400" />}
                  </button>

                  {/* Search Messages Toggle */}
                  <button
                    onClick={() => setShowMsgSearch((prev) => !prev)}
                    className={`rounded-xl border p-2.5 transition ${
                      showMsgSearch
                        ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                        : 'border-emerald-900/40 bg-emerald-950/40 text-slate-400 hover:bg-emerald-900/60 hover:text-white'
                    }`}
                    title="Search Messages"
                  >
                    <FiSearch size={15} />
                  </button>

                  {/* Close Whole Messenger Overlay */}
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-2.5 text-slate-400 hover:bg-rose-950/60 hover:text-rose-300 transition"
                    title="Close Messenger"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Message Search Bar Toggle */}
              {showMsgSearch && (
                <div className="border-b border-emerald-900/30 bg-[#03190e] p-2 flex items-center gap-2">
                  <FiSearch className="text-slate-400 ml-2" size={14} />
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {messageSearchQuery && (
                    <button onClick={() => setMessageSearchQuery('')} className="text-slate-400 hover:text-white p-1">
                      <FiX size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Broadcast Notice */}
              {isBroadcast && user?.role !== 'admin' && (
                <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-300 font-medium">
                  <FiAlertCircle className="shrink-0 text-amber-400" />
                  <span>📢 Official Announcements channel — Read-only mode.</span>
                </div>
              )}

              {/* Docked Video Conference Panel */}
              <VideoConferencePanel activeRoom={activeRoom} user={user} />

              {/* Messages Thread Canvas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#010904]">
                {/* Date Divider Badge */}
                <div className="flex items-center justify-center my-3">
                  <span className="rounded-full border border-emerald-900/50 bg-[#062417] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                    Today
                  </span>
                </div>

                {filteredMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-6">
                    <FiMessageSquare size={36} className="mb-3 text-emerald-900/60" />
                    <p className="text-xs font-bold text-slate-300">No messages found in this room.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Be the first to post!</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                    const prevSenderId = prevMsg ? (prevMsg.sender?._id || prevMsg.sender) : null;
                    const currentSenderId = msg.sender?._id || msg.sender;
                    const isFirstInGroup = !prevMsg || String(prevSenderId) !== String(currentSenderId);

                    return (
                      <div
                        key={msg._id}
                        className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'} ${
                          isFirstInGroup ? 'mt-4' : 'mt-1'
                        }`}
                      >
                        {/* LEFT AVATAR IMAGE (For Received Messages) */}
                        {!isOwn && (
                          <div className="shrink-0 pb-1">
                            {renderAvatar(msg.sender || { name: msg.senderName }, false, 'h-8 w-8')}
                          </div>
                        )}

                        {/* MESSAGE CONTENT COLUMN */}
                        <div className={`flex flex-col max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {/* Sender Info Header */}
                          {!isOwn && isFirstInGroup && (
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-semibold">
                              {msg.sender?.role === 'admin' ? (
                                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                  <FiShield size={10} /> Admin
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-slate-300">
                                  {msg.senderName}
                                </span>
                              )}
                              {msg.senderTeam && <span className="text-slate-500">• {msg.senderTeam}</span>}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words shadow-lg ${
                              isOwn
                                ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-bold rounded-br-none'
                                : 'bg-[#062417] border border-emerald-900/50 text-slate-100 rounded-bl-none'
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
                            className={`flex items-center gap-1.5 mt-1 px-1 text-[9px] text-slate-400 ${
                              isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{formatTime(msg.sentAt)}</span>
                            {isOwn && (
                              <span className="text-cyan-400 flex items-center" title="Delivered & Seen">
                                <FiCheckCircle size={11} />
                              </span>
                            )}
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => deleteMessage(msg._id, activeRoom._id)}
                                className="hidden group-hover:inline-block text-rose-400 hover:text-rose-300 ml-1"
                                title="Delete message"
                              >
                                <FiTrash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* RIGHT AVATAR IMAGE (For Own Messages) */}
                        {isOwn && (
                          <div className="shrink-0 pb-1">
                            {renderAvatar(user, true, 'h-8 w-8')}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Live Typing Indicator */}
                {activeTyping.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 italic py-1 px-2">
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

              {/* EMOJI PICKER DRAWER */}
              {showEmojiPicker && (
                <div className="border-t border-emerald-900/30 bg-[#041a10] px-4 py-2 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                  {QUICK_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => addEmoji(emoji)}
                      className="rounded-xl bg-[#062619] p-2 text-lg hover:bg-emerald-900/60 hover:scale-110 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT BAR (BOTTOM OF RIGHT PANEL) */}
              {canSendInActiveRoom ? (
                isRecording ? (
                  <div className="border-t border-emerald-900/30 bg-[#051c12] p-4">
                    <div className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <span className="text-xs font-bold text-rose-300">Recording Voice Note...</span>
                        <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60 < 10 ? '0' : '') + (recordingDuration % 60)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                          title="Cancel recording"
                        >
                          <FiX size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={stopAndSendRecording}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          title="Send Voice Note"
                        >
                          <FiSend size={15} />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="border-t border-emerald-900/30 bg-[#051c12] p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                      <span>Shift + Enter for new line</span>
                      <span className={inputContent.length > 900 ? 'text-amber-400 font-bold' : ''}>
                        {inputContent.length} / 1000
                      </span>
                    </div>

                    <div className="flex items-end gap-2.5">
                      {/* Emoji Icon */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition shrink-0 ${
                          showEmojiPicker
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : 'border-emerald-900/40 bg-[#020e07] text-slate-400 hover:text-white hover:border-emerald-500/40'
                        }`}
                        title="Emoji Picker"
                      >
                        <FiSmile size={18} />
                      </button>

                      {/* File Attachment Icon */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/40 bg-[#020e07] text-slate-400 hover:text-white hover:border-emerald-500/40 transition shrink-0"
                        title="Attach File / Image"
                      >
                        <FiPaperclip size={18} />
                      </button>

                      {/* Microphone Voice Note Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/40 bg-[#020e07] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition shrink-0"
                        title="Record Voice Note"
                      >
                        <FiMic size={18} />
                      </button>

                      {/* Auto-resizing Textarea Input */}
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder={`Message ${getRoomDisplayName(activeRoom)}...`}
                        value={inputContent}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        maxLength={1000}
                        className="flex-1 rounded-xl border border-emerald-900/40 bg-[#020e07] px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none max-h-32 leading-relaxed"
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!inputContent.trim() || isSending}
                        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                          inputContent.trim()
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 cursor-pointer'
                            : 'bg-emerald-900/40 text-slate-500 border border-emerald-900/30 cursor-not-allowed opacity-60'
                        }`}
                        title="Send Message (Enter)"
                      >
                        <FiSend size={15} />
                        <span className="hidden sm:inline font-extrabold uppercase tracking-wider text-[11px]">Send</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div className="border-t border-emerald-900/30 bg-[#051c12] p-4 text-center text-xs text-slate-400">
                  Only Administrators can post messages in this room.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <FiMessageSquare size={48} className="text-emerald-900/60" />
              <h3 className="font-anton text-xl text-white uppercase tracking-wider">SELECT A CONVERSATION</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a channel or direct message from the left panel to view messages and start chatting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input for Attachments */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            sendMessage(activeRoom?._id, `📎 Attached file: ${file.name}`);
          }
        }}
      />

      {/* NEW DIRECT MESSAGE MODAL */}
      <NewDirectMessageModal isOpen={isDmModalOpen} onClose={() => setIsDmModalOpen(false)} />
    </div>
  );
}
