import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useToast } from '../components/ToastContainer';
import api from '../services/api';

export const ChatContext = createContext();

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

  const activeRoomIdRef = useRef(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  // Derive Socket server URL from api baseURL or fallback
  const getSocketUrl = () => {
    const apiBase = api.defaults?.baseURL || 'http://localhost:4000/api';
    return apiBase.replace(/\/api\/?$/, '');
  };

  // Fetch accessible rooms & unread total
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
      setRooms(roomList);

      const unreadSum = roomList.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
      setTotalUnread(unreadSum);

      // Default active room if none set
      if (!activeRoomIdRef.current && roomList.length > 0) {
        setActiveRoomId(roomList[0]._id);
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

      // Update message list for this room
      setMessages((prev) => {
        const existing = prev[rId] || [];
        if (existing.some((m) => m._id === msg._id)) return prev;
        return {
          ...prev,
          [rId]: [...existing, msg],
        };
      });

      // Update room metadata (lastMessage and unread count)
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

      // Check if message is in broadcast room or from admin and user is NOT sender -> Toast notification!
      if (msg.sender?._id !== user._id && msg.senderTeam === null) {
        toast?.addToast(`📢 Broadcast: ${msg.content.slice(0, 60)}...`, 'info');
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

    newSocket.on('message_deleted', ({ messageId, roomId }) => {
      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter((m) => m._id !== messageId),
      }));
    });

    setSocket(newSocket);
    fetchRooms();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // When active room changes or chat drawer opens, auto mark room read & fetch messages
  useEffect(() => {
    if (activeRoomId) {
      if (!messages[activeRoomId]) {
        loadRoomMessages(activeRoomId, 1);
      }
      if (isChatOpen) {
        markRoomRead(activeRoomId);
      }
    }
  }, [activeRoomId, isChatOpen]);

  // Send message via socket
  const sendMessage = useCallback(
    (roomId, content, messageType = 'text', audioUrl = '', audioDuration = 0) => {
      if (!socket || !socket.connected) {
        toast?.addToast('Chat server offline. Reconnecting...', 'error');
        return Promise.reject(new Error('Socket disconnected'));
      }
      return new Promise((resolve, reject) => {
        socket.emit('send_message', { roomId, content, messageType, audioUrl, audioDuration }, (res) => {
          if (res?.error) {
            toast?.addToast(res.error, 'error');
            reject(new Error(res.error));
          } else {
            resolve(res.message);
          }
        });
      });
    },
    [socket, toast]
  );

  // Typing triggers
  const startTyping = useCallback(
    (roomId) => {
      if (socket && socket.connected) {
        socket.emit('typing_start', { roomId });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (roomId) => {
      if (socket && socket.connected) {
        socket.emit('typing_stop', { roomId });
      }
    },
    [socket]
  );

  // Moderation delete message
  const deleteMessage = useCallback(
    (messageId, roomId) => {
      if (socket && socket.connected) {
        socket.emit('delete_message', { messageId, roomId }, (res) => {
          if (res?.error) {
            toast?.addToast(res.error, 'error');
          } else {
            toast?.addToast('Message deleted', 'success');
          }
        });
      }
    },
    [socket, toast]
  );

  // Create custom room
  const createRoom = async (name, members) => {
    try {
      const { data } = await api.post('/chat/rooms', { name, members });
      toast?.addToast(`Room "${data.name}" created!`, 'success');
      await fetchRooms();
      setActiveRoomId(data._id);
      if (socket && socket.connected) {
        socket.emit('join_rooms');
      }
      return data;
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to create room', 'error');
      throw err;
    }
  };

  // Update custom room members
  const updateRoomMembers = async (roomId, add, remove) => {
    try {
      const { data } = await api.put(`/chat/rooms/${roomId}/members`, { add, remove });
      toast?.addToast('Room members updated', 'success');
      await fetchRooms();
      return data;
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to update members', 'error');
      throw err;
    }
  };

  // Create or open 1-on-1 Direct Message
  const startDirectMessage = async (targetUserId) => {
    try {
      const { data: room } = await api.post('/chat/direct', { targetUserId });
      await fetchRooms();
      setActiveRoomId(room._id);
      setIsChatOpen(true);
      if (socket && socket.connected) {
        socket.emit('join_rooms');
      }
      return room;
    } catch (err) {
      toast?.addToast(err.response?.data?.message || 'Failed to start direct message', 'error');
      throw err;
    }
  };

  const toggleChat = () => setIsChatOpen((prev) => !prev);

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
        fetchRooms,
        loadRoomMessages,
        markRoomRead,
        sendMessage,
        startTyping,
        stopTyping,
        deleteMessage,
        createRoom,
        updateRoomMembers,
        startDirectMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
