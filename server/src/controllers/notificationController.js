const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({
    sentTo: { $in: ['all', 'players'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = notifications.filter(
    (notification) => !notification.readBy.some((id) => id.equals(req.user._id))
  ).length;

  res.json({ notifications, unreadCount });
};

const pushNotification = async (req, res) => {
  const { title, body, type, sentTo, audience } = req.body;
  if (!title || !title.trim() || !body || !body.trim()) {
    res.status(400);
    throw new Error('Please provide both title and body for the notification.');
  }

  const validTypes = ['info', 'alert', 'match', 'payment', 'session', 'general'];
  const safeType = validTypes.includes(type) ? type : 'info';
  const targetAudience = (sentTo || audience || 'all').toLowerCase();
  const safeAudience = ['all', 'players'].includes(targetAudience) ? targetAudience : 'all';

  const notification = await Notification.create({
    title: title.trim(),
    body: body.trim(),
    type: safeType,
    sentTo: safeAudience,
    createdBy: req.user._id,
  });

  res.status(201).json(notification);
};

const markRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (!notification.readBy.some((id) => id.equals(req.user._id))) {
    notification.readBy.push(req.user._id);
    await notification.save();
  }
  res.json(notification);
};

const deleteNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  await notification.deleteOne();
  res.json({ success: true, message: 'Notification deleted successfully.' });
};

const deleteAllNotifications = async (req, res) => {
  const count = await Notification.countDocuments();
  await Notification.deleteMany({});
  res.json({ success: true, message: `Deleted ${count} notification(s) successfully.` });
};

module.exports = { getNotifications, pushNotification, markRead, deleteNotification, deleteAllNotifications };
