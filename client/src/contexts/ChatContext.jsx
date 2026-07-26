import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useToast } from '../components/ToastContainer';
import api from '../services/api';

export const ChatContext = createContext();

// Web Audio API Synthesizer for instant notification chime
const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();

  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState({}); // { [roomId]: ChatMessage[] }
  const [typingUsers, setTypingUsers] = useState({}); // { [roomId]: Array<{_id, name}> }
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { callerName, roomName, isVideo }

  const activeRoomIdRef = useRef(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  // Derive Socket server URL
  const getSocketUrl = () => {
    const apiBase = api.defaults?.baseURL || 'http://localhost:4000/api';
    return apiBase.replace(/\/api\/?$/, '');
  };

  // Fetch accessible rooms & unread total with deduplication
  const fetchRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setTotalUnread(0);
      return;
    }
    setLoadingRooms(true);
    try {
      const { data } = await api.get('/chat/rooms');
      const roomList = Array.isArray(data) ? data : [];

      // Deduplicate rooms by unique _id AND by DM target member
      const uniqueRooms = roomList.reduce((acc, room) => {
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

      setRooms(uniqueRooms);

      const unreadSum = uniqueRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
      setTotalUnread(unreadSum);

      if (!activeRoomIdRef.current && uniqueRooms.length > 0) {
        setActiveRoomId(uniqueRooms[0]._id);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, [user]);

  // Load message history for a room
  const loadRoomMessages = useCallback(async (roomId, page = 1) => {
    if (!roomId) return;
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}/messages?page=${page}&limit=50`);
      setMessages((prev) => ({
        ...prev,
        [roomId]: page === 1 ? data.messages : [...data.messages, ...(prev[roomId] || [])],
      }));
    } catch (err) {
      console.error('Failed to load room messages:', err);
    }
  }, []);

  // Mark a room as read
  const markRoomRead = useCallback(
    async (roomId) => {
      if (!roomId || !user) return;
      try {
        await api.post(`/chat/rooms/${roomId}/read`);
        if (socket && socket.connected) {
          socket.emit('mark_read', { roomId });
        }
        setRooms((prev) =>
          prev.map((r) => (r._id === roomId ? { ...r, unreadCount: 0 } : r))
        );
        setTotalUnread((prev) => {
          const room = rooms.find((r) => r._id === roomId);
          const roomUnread = room?.unreadCount || 0;
          return Math.max(0, prev - roomUnread);
        });
      } catch (err) {
        console.error('Failed to mark room read:', err);
      }
    },
    [user, socket, rooms]
  );

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setRooms([]);
      setMessages({});
      setTotalUnread(0);
      setActiveRoomId(null);
      return;
    }

    const token = localStorage.getItem('kfc_token');
    const newSocket = io(getSocketUrl(), {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected:', newSocket.id);
      newSocket.emit('join_rooms');
    });

    newSocket.on('new_message', (msg) => {
      const rId = msg.roomId;

      // Update message list
      setMessages((prev) => {
        const existing = prev[rId] || [];
        if (existing.some((m) => m._id === msg._id)) return prev;
        return {
          ...prev,
          [rId]: [...existing, msg],
        };
      });

      const isCurrentActive = activeRoomIdRef.current === rId && isChatOpenRef.current;

      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r._id === rId) {
            const newUnread = isCurrentActive ? 0 : (r.unreadCount || 0) + 1;
            return {
              ...r,
              lastMessage: msg,
              unreadCount: newUnread,
            };
          }
          return r;
        })
      );

      if (!isCurrentActive) {
        setTotalUnread((prev) => prev + 1);
      }

      // Incoming message chime & toast notification
      if (msg.sender?._id !== user._id && msg.sender !== user._id) {
        playNotificationChime();
        toast?.addToast(`💬 ${msg.senderName || ' Teammate'}: ${msg.content || 'Voice Note'}`, 'info');
      }
    });

    newSocket.on('user_typing', ({ roomId, user: typingUser }) => {
      if (typingUser._id === user._id) return;
      setTypingUsers((prev) => {
        const list = prev[roomId] || [];
        if (list.some((u) => u._id === typingUser._id)) return prev;
        return { ...prev, [roomId]: [...list, typingUser] };
      });
    });

    newSocket.on('user_stopped_typing', ({ roomId, user: typingUser }) => {
      setTypingUsers((prev) => {
        const list = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: list.filter((u) => u._id !== typingUser._id),
        };
      });
    });

    // Incoming Call socket event listener
    newSocket.on('incoming_call', (data) => {
      if (data.callerId !== user._id) {
        playNotificationChime();
        setIncomingCall(data);
      }
    });

    setSocket(newSocket);
    fetchRooms();

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchRooms]);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      loadRoomMessages(activeRoomId);
      markRoomRead(activeRoomId);
    }
  }, [activeRoomId, loadRoomMessages, markRoomRead]);

  // Send message helper
  const sendMessage = async (roomId, content, messageType = 'text', audioUrl = '', audioDuration = 0) => {
    if (!socket || !socket.connected) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve, reject) => {
      socket.emit(
        'send_message',
        { roomId, content, messageType, audioUrl, audioDuration },
        (response) => {
          if (response?.error) {
            toast?.addToast(`Failed: ${response.error}`, 'error');
            reject(new Error(response.error));
          } else {
            resolve(response.message);
          }
        }
      );
    });
  };

  const triggerCallNotification = (roomId, isVideo = true) => {
    if (socket && socket.connected) {
      socket.emit('start_call', { roomId, callerId: user?._id, callerName: user?.name, isVideo });
    }
  };

  const startTyping = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const deleteMessage = async (messageId, roomId) => {
    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter((m) => m._id !== messageId),
      }));
      toast?.addToast('Message deleted', 'success');
    } catch {
      toast?.addToast('Failed to delete message', 'error');
    }
  };

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        socket,
        rooms,
        totalUnread,
        activeRoomId,
        setActiveRoomId,
        messages,
        typingUsers,
        isChatOpen,
        setIsChatOpen,
        toggleChat,
        loadingRooms,
        sendMessage,
        startTyping,
        stopTyping,
        deleteMessage,
        markRoomRead,
        fetchRooms,
        incomingCall,
        setIncomingCall,
        triggerCallNotification
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
