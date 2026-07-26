const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['info', 'alert', 'match', 'payment', 'session', 'general'],
    default: 'info',
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentTo: { type: String, enum: ['all', 'players'], default: 'all' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
