const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { triggerSMSNotification } = require('../utils/smsNotifier');

// Rate limiting map: userId -> timestamp (ms)
const lastMessageTimes = new Map();

// Map tracking connected users: userId -> Set<socketId>
const onlineUsers = new Map();

const initSocketServer = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').populate('team', 'name logo color');
      if (!user || !user.active) {
        return next(new Error('Authentication error: User invalid or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket auth failed:', err.message);
      next(new Error('Authentication error: Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userIdStr = user._id.toString();

    // Register active socket connection for online status tracking
    if (!onlineUsers.has(userIdStr)) {
      onlineUsers.set(userIdStr, new Set());
    }
    onlineUsers.get(userIdStr).add(socket.id);

    console.log(`🔌 [Socket] User connected: ${user.name} (${user.role}) [Socket ID: ${socket.id}]`);

    // Automatically join authorized rooms for this user
    socket.on('join_rooms', async () => {
      try {
        const roomsToJoin = [];

        // Broadcast room
        const broadcastRoom = await ChatRoom.findOne({ type: 'broadcast' });
        if (broadcastRoom) {
          roomsToJoin.push(broadcastRoom._id.toString());
        }

        // Team room
        if (user.team) {
          const teamId = user.team._id || user.team;
          const teamRoom = await ChatRoom.findOne({ type: 'team', teamId });
          if (teamRoom) {
            roomsToJoin.push(teamRoom._id.toString());
          }
        }

        // Custom rooms & Direct rooms where user is in members array
        const memberRooms = await ChatRoom.find({ members: user._id });
        memberRooms.forEach((r) => {
          const rId = r._id.toString();
          if (!roomsToJoin.includes(rId)) {
            roomsToJoin.push(rId);
          }
        });

        // Admin access to all rooms
        if (user.role === 'admin') {
          const allRooms = await ChatRoom.find({});
          allRooms.forEach((r) => {
            const rId = r._id.toString();
            if (!roomsToJoin.includes(rId)) {
              roomsToJoin.push(rId);
            }
          });
        }

        roomsToJoin.forEach((roomId) => socket.join(roomId));
        socket.emit('rooms_joined', roomsToJoin);
      } catch (err) {
        console.error('Error joining rooms for socket:', err);
      }
    });

    // Send Message
    socket.on('send_message', async ({ roomId, content, messageType = 'text', audioUrl, audioDuration }, callback) => {
      try {
        if (messageType === 'text' && (!content || !content.trim())) {
          if (callback) callback({ error: 'Message content cannot be empty' });
          return;
        }

        if (messageType === 'audio' && !audioUrl) {
          if (callback) callback({ error: 'Audio recording payload missing' });
          return;
        }

        // Rate limiting: 1 message per second per user
        const now = Date.now();
        const lastSent = lastMessageTimes.get(userIdStr) || 0;
        if (now - lastSent < 1000) {
          if (callback) callback({ error: 'Rate limit exceeded. Please wait a second.' });
          return;
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) {
          if (callback) callback({ error: 'Chat room not found' });
          return;
        }

        // Permission checks
        if (room.type === 'broadcast' && user.role !== 'admin') {
          if (callback) callback({ error: 'Only administrators can post in the Broadcast room.' });
          return;
        }

        if (room.type === 'team') {
          const userTeamId = user.team?._id || user.team;
          const isTeamMember = userTeamId && String(userTeamId) === String(room.teamId);
          const isExplicitMember = room.members.some((m) => String(m) === userIdStr);
          if (!isTeamMember && !isExplicitMember && user.role !== 'admin') {
            if (callback) callback({ error: 'Access denied: You are not a member of this team.' });
            return;
          }
        }

        if (room.type === 'custom' || room.type === 'direct') {
          const isMember = room.members.some((m) => String(m) === userIdStr);
          if (!isMember && user.role !== 'admin') {
            if (callback) callback({ error: 'Access denied: You are not a member of this room.' });
            return;
          }
        }

        lastMessageTimes.set(userIdStr, now);

        const newMsg = await ChatMessage.create({
          roomId: room._id,
          sender: user._id,
          senderName: user.name,
          senderTeam: user.team?.name || null,
          content: content ? content.trim() : (messageType === 'audio' ? '🎤 Voice Note' : ''),
          messageType,
          audioUrl: audioUrl || '',
          audioDuration: audioDuration || 0,
          sentAt: new Date(),
          readBy: [user._id],
        });

        const populatedMsg = {
          ...newMsg.toObject(),
          sender: {
            _id: user._id,
            name: user.name,
            role: user.role,
            photoURL: user.photoURL || '',
            team: user.team || null,
          },
        };

        // 1. Broadcast real-time message to socket room members
        io.to(room._id.toString()).emit('new_message', populatedMsg);

        // 2. Trigger SMS Notification asynchronously for offline members
        triggerSMSNotification(room, populatedMsg, user, onlineUsers);

        if (callback) callback({ success: true, message: populatedMsg });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ error: 'Server error while sending message' });
      }
    });

    // Typing start
    socket.on('typing_start', ({ roomId }) => {
      socket.to(roomId).emit('user_typing', {
        roomId,
        user: { _id: user._id, name: user.name },
      });
    });

    // Typing stop
    socket.on('typing_stop', ({ roomId }) => {
      socket.to(roomId).emit('user_stopped_typing', {
        roomId,
        user: { _id: user._id, name: user.name },
      });
    });

    // Mark messages in room as read
    socket.on('mark_read', async ({ roomId }) => {
      try {
        await ChatMessage.updateMany(
          { roomId, readBy: { $ne: user._id } },
          { $addToSet: { readBy: user._id } }
        );
        io.to(roomId).emit('messages_marked_read', { roomId, userId: user._id });
      } catch (err) {
        console.error('Error marking messages read:', err);
      }
    });

    // Real-Time Video & Audio Call Handlers
    socket.on('start_call', ({ roomId, isVideo }) => {
      socket.to(roomId).emit('incoming_call', {
        roomId,
        callerId: user._id,
        callerName: user.name,
        callerPhoto: user.photoURL || user.avatar || '',
        isVideo: isVideo !== false,
      });
    });

    socket.on('answer_call', ({ roomId }) => {
      io.to(roomId).emit('call_answered', { roomId, answeredBy: user._id, answeredName: user.name });
    });

    socket.on('end_call', ({ roomId }) => {
      io.to(roomId).emit('call_ended', { roomId, endedBy: user._id });
    });

    // Admin Delete Message (Moderation)
    socket.on('delete_message', async ({ messageId, roomId }, callback) => {
      try {
        if (user.role !== 'admin') {
          if (callback) callback({ error: 'Admin permission required' });
          return;
        }

        const msg = await ChatMessage.findById(messageId);
        if (msg) {
          await ChatMessage.findByIdAndDelete(messageId);
          io.to(roomId).emit('message_deleted', { messageId, roomId });
          if (callback) callback({ success: true });
        } else {
          if (callback) callback({ error: 'Message not found' });
        }
      } catch (err) {
        console.error('Error deleting message via socket:', err);
        if (callback) callback({ error: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      lastMessageTimes.delete(userIdStr);

      const userSockets = onlineUsers.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userIdStr);
        }
      }
    });
  });
};

module.exports = { initSocketServer };
