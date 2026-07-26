const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

/**
 * Get all rooms accessible to the logged-in user
 */
const getRooms = async (req, res) => {
  const user = req.user;
  const userTeamId = user.team?._id || user.team;

  let queryFilter = {};

  if (user.role === 'admin') {
    // Admin sees all rooms
    queryFilter = {};
  } else {
    // Regular users / managers see:
    // 1. Broadcast room
    // 2. Team room matching their team
    // 3. Custom rooms where they are in members array
    const orConditions = [{ type: 'broadcast' }, { members: user._id }];
    if (userTeamId) {
      orConditions.push({ type: 'team', teamId: userTeamId });
    }
    queryFilter = { $or: orConditions };
  }

  const rooms = await ChatRoom.find(queryFilter)
    .populate('teamId', 'name logo color')
    .populate('members', 'name role position photoURL team')
    .populate('createdBy', 'name role')
    .sort({ updatedAt: -1 })
    .lean();

  // Attach unread counts & last message for each room
  const roomsWithMeta = await Promise.all(
    rooms.map(async (room) => {
      const unreadCount = await ChatMessage.countDocuments({
        roomId: room._id,
        readBy: { $ne: user._id },
      });

      const lastMessage = await ChatMessage.findOne({ roomId: room._id })
        .sort({ sentAt: -1 })
        .lean();

      // Ensure fallback videoRoomName if not set
      const videoRoomName = room.videoRoomName || `kfc-room-${room._id}`;

      return {
        ...room,
        videoRoomName,
        unreadCount,
        lastMessage: lastMessage || null,
      };
    })
  );

  res.json(roomsWithMeta);
};

/**
 * Get message history for a specific room (paginated)
 */
const getRoomMessages = async (req, res) => {
  const { id: roomId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Chat room not found');
  }

  // Access control
  const user = req.user;
  if (user.role !== 'admin') {
    const userTeamId = user.team?._id || user.team;
    const isTeamMember = room.type === 'team' && userTeamId && String(userTeamId) === String(room.teamId);
    const isExplicitMember = room.members.some((m) => String(m) === String(user._id));
    const isBroadcast = room.type === 'broadcast';

    if (!isBroadcast && !isTeamMember && !isExplicitMember) {
      res.status(403);
      throw new Error('Access denied to this chat room');
    }
  }

  const messages = await ChatMessage.find({ roomId })
    .populate('sender', 'name role photoURL team')
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ChatMessage.countDocuments({ roomId });

  // Reverse so frontend gets chronological order (oldest to newest for rendering)
  res.json({
    messages: messages.reverse(),
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

/**
 * Create a custom join room (Admin or Manager)
 */
const createCustomRoom = async (req, res) => {
  const { name, members } = req.body;
  const user = req.user;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Room name is required');
  }

  let memberIds = Array.isArray(members) ? members : [];

  // Creator is automatically a member
  if (!memberIds.some((id) => String(id) === String(user._id))) {
    memberIds.push(user._id);
  }

  // Manager restrictions: Can only add players from their own team + admins
  if (user.role === 'manager') {
    const userTeamId = user.team?._id || user.team;
    const eligibleUsers = await User.find({
      $or: [{ team: userTeamId, active: true }, { role: 'admin' }],
    }).select('_id');
    const eligibleSet = new Set(eligibleUsers.map((u) => String(u._id)));

    memberIds = memberIds.filter((id) => eligibleSet.has(String(id)));
  }

  const newRoom = await ChatRoom.create({
    name: name.trim(),
    type: 'custom',
    members: memberIds,
    createdBy: user._id,
    videoRoomName: `kfc-custom-room-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  });

  const populatedRoom = await ChatRoom.findById(newRoom._id)
    .populate('members', 'name role position photoURL team')
    .populate('createdBy', 'name role')
    .lean();

  res.status(201).json(populatedRoom);
};

/**
 * Update custom room members (add/remove)
 */
const updateRoomMembers = async (req, res) => {
  const { id: roomId } = req.params;
  const { add = [], remove = [] } = req.body;
  const user = req.user;

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Chat room not found');
  }

  if (room.type !== 'custom') {
    res.status(400);
    throw new Error('Only custom room memberships can be manually modified');
  }

  if (user.role !== 'admin' && String(room.createdBy) !== String(user._id)) {
    res.status(403);
    throw new Error('Only room creator or admin can manage room members');
  }

  let currentMembers = room.members.map((m) => String(m));

  // Add members
  if (Array.isArray(add)) {
    add.forEach((id) => {
      if (!currentMembers.includes(String(id))) {
        currentMembers.push(String(id));
      }
    });
  }

  // Remove members
  if (Array.isArray(remove)) {
    currentMembers = currentMembers.filter((id) => !remove.includes(String(id)));
  }

  // Ensure creator remains in member list
  if (!currentMembers.includes(String(room.createdBy))) {
    currentMembers.push(String(room.createdBy));
  }

  room.members = currentMembers;
  await room.save();

  const updated = await ChatRoom.findById(roomId)
    .populate('members', 'name role position photoURL team')
    .populate('createdBy', 'name role')
    .lean();

  res.json(updated);
};

/**
 * Delete a message (Admin moderation)
 */
const deleteMessage = async (req, res) => {
  const { id: messageId } = req.params;
  const msg = await ChatMessage.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  await ChatMessage.findByIdAndDelete(messageId);
  res.json({ success: true, messageId, roomId: msg.roomId });
};

/**
 * Total unread messages for user across all accessible rooms
 */
const getUnreadTotal = async (req, res) => {
  const user = req.user;
  const userTeamId = user.team?._id || user.team;

  let queryFilter = {};
  if (user.role === 'admin') {
    queryFilter = {};
  } else {
    const orConditions = [{ type: 'broadcast' }, { members: user._id }];
    if (userTeamId) {
      orConditions.push({ type: 'team', teamId: userTeamId });
    }
    queryFilter = { $or: orConditions };
  }

  const accessibleRooms = await ChatRoom.find(queryFilter).select('_id');
  const roomIds = accessibleRooms.map((r) => r._id);

  const totalUnread = await ChatMessage.countDocuments({
    roomId: { $in: roomIds },
    readBy: { $ne: user._id },
  });

  res.json({ total: totalUnread });
};

/**
 * Mark all messages in a room as read for user
 */
const markRoomAsRead = async (req, res) => {
  const { id: roomId } = req.params;
  const user = req.user;

  await ChatMessage.updateMany(
    { roomId, readBy: { $ne: user._id } },
    { $addToSet: { readBy: user._id } }
  );

  res.json({ success: true, roomId });
};

/**
 * Get eligible users to invite to a custom room
 */
const getEligibleMembers = async (req, res) => {
  const user = req.user;

  let query = { active: true };
  if (user.role === 'manager') {
    const userTeamId = user.team?._id || user.team;
    query = {
      active: true,
      $or: [{ team: userTeamId }, { role: 'admin' }],
    };
  }

  const users = await User.find(query)
    .select('name role position photoURL team playerCode')
    .populate('team', 'name color')
    .sort({ name: 1 })
    .lean();

  res.json(users);
};

/**
 * Create or fetch a 1-on-1 Direct Message room
 */
const getOrCreateDirectRoom = async (req, res) => {
  const { targetUserId } = req.body;
  const user = req.user;

  if (!targetUserId) {
    res.status(400);
    throw new Error('Target user ID is required');
  }

  if (String(targetUserId) === String(user._id)) {
    res.status(400);
    throw new Error('You cannot start a direct message with yourself');
  }

  const targetUser = await User.findById(targetUserId).populate('team', 'name color');
  if (!targetUser || !targetUser.active) {
    res.status(404);
    throw new Error('Target player not found or inactive');
  }

  // Access control: Teammates / Manager / Admin
  if (user.role !== 'admin') {
    const userTeamId = user.team?._id || user.team;
    const targetTeamId = targetUser.team?._id || targetUser.team;

    const isTeammate = userTeamId && targetTeamId && String(userTeamId) === String(targetTeamId);
    const isTargetAdmin = targetUser.role === 'admin';
    const isUserAdmin = user.role === 'admin';

    if (!isTeammate && !isTargetAdmin && !isUserAdmin) {
      res.status(403);
      throw new Error('Direct messaging is restricted to team members and club admins.');
    }
  }

  // Search for existing direct room between user and targetUser
  let room = await ChatRoom.findOne({
    type: 'direct',
    members: { $all: [user._id, targetUser._id], $size: 2 },
  })
    .populate('members', 'name role position photoURL team')
    .populate('createdBy', 'name role')
    .lean();

  if (!room) {
    const newRoom = await ChatRoom.create({
      name: `${user.name} & ${targetUser.name}`,
      type: 'direct',
      members: [user._id, targetUser._id],
      createdBy: user._id,
      videoRoomName: `kfc-dm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    });

    room = await ChatRoom.findById(newRoom._id)
      .populate('members', 'name role position photoURL team')
      .populate('createdBy', 'name role')
      .lean();
  }

  res.json(room);
};

/**
 * Get eligible users to start a 1-on-1 DM with
 */
const getEligibleDmMembers = async (req, res) => {
  const user = req.user;

  let query = { _id: { $ne: user._id }, active: true };

  if (user.role !== 'admin') {
    const userTeamId = user.team?._id || user.team;
    const orConditions = [{ role: 'admin' }];
    if (userTeamId) {
      orConditions.push({ team: userTeamId });
    }
    query.$or = orConditions;
  }

  const users = await User.find(query)
    .select('name role position photoURL team playerCode')
    .populate('team', 'name color')
    .sort({ name: 1 })
    .lean();

  res.json(users);
};

module.exports = {
  getRooms,
  getRoomMessages,
  createCustomRoom,
  updateRoomMembers,
  deleteMessage,
  getUnreadTotal,
  markRoomAsRead,
  getEligibleMembers,
  getOrCreateDirectRoom,
  getEligibleDmMembers,
};
