const User = require('../models/User');
const { sendSMS } = require('./smsService');

// Map to track 5-minute cooldown per room per user: "roomId_userId" -> timestamp (ms)
const smsCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const triggerSMSNotification = async (room, message, sender, onlineUsers) => {
  try {
    const senderId = sender._id.toString();
    const roomId = room._id.toString();

    let targetUsers = [];

    if (room.type === 'broadcast') {
      // Broadcast room: All active users except sender
      targetUsers = await User.find({
        _id: { $ne: sender._id },
        active: true,
        phone: { $exists: true, $ne: '' },
      }).select('_id name phone smsNotificationsEnabled');
    } else if (room.type === 'team') {
      // Team room: All team members + manager
      targetUsers = await User.find({
        _id: { $ne: sender._id },
        team: room.teamId,
        active: true,
        phone: { $exists: true, $ne: '' },
      }).select('_id name phone smsNotificationsEnabled');
    } else {
      // Direct or Custom rooms: Explicit members array
      const memberIds = (room.members || []).filter((m) => m.toString() !== senderId);
      targetUsers = await User.find({
        _id: { $in: memberIds },
        active: true,
        phone: { $exists: true, $ne: '' },
      }).select('_id name phone smsNotificationsEnabled');
    }

    const now = Date.now();
    const shortContent = message.content.length > 80 ? `${message.content.slice(0, 77)}...` : message.content;

    for (const recipient of targetUsers) {
      const recipientId = recipient._id.toString();

      // 1. Check if recipient is currently online on Socket.io
      const userSockets = onlineUsers.get(recipientId);
      const isOnline = userSockets && userSockets.size > 0;
      if (isOnline) {
        continue; // Skip SMS if user is actively in-app
      }

      // 2. Check user SMS preference (must be true, except for broadcast announcements)
      if (room.type !== 'broadcast' && recipient.smsNotificationsEnabled === false) {
        continue;
      }

      // 3. Check 5-minute per-conversation cooldown
      const cooldownKey = `${roomId}_${recipientId}`;
      const lastSent = smsCooldowns.get(cooldownKey) || 0;
      if (now - lastSent < COOLDOWN_MS) {
        continue; // Cooldown active — skip duplicate SMS
      }

      // Format SMS notification message
      const roomLabel = room.type === 'broadcast' ? 'Announcement' : room.name;
      let smsBody = '';

      if (message.messageType === 'audio') {
        const durationSec = Math.round(message.audioDuration || 0);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        smsBody = `[KFC ${roomLabel}] ${sender.name} sent a 🎤 Voice Note (${durStr})`;
      } else {
        const shortContent = message.content && message.content.length > 80 ? `${message.content.slice(0, 77)}...` : (message.content || 'New message');
        smsBody = `[KFC ${roomLabel}] ${sender.name}: "${shortContent}"`;
      }

      // Dispatch SMS
      await sendSMS({ to: recipient.phone, body: smsBody });

      // Update cooldown timestamp
      smsCooldowns.set(cooldownKey, now);
    }
  } catch (err) {
    console.error('❌ Error triggering SMS notifications:', err.message);
  }
};

module.exports = { triggerSMSNotification };
