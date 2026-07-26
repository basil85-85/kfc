const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderTeam: { type: String, default: null },
  content: { type: String, trim: true, default: '' },
  messageType: { type: String, enum: ['text', 'audio'], default: 'text' },
  audioUrl: { type: String, default: '' },
  audioDuration: { type: Number, default: 0 },
  sentAt: { type: Date, default: Date.now, index: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
