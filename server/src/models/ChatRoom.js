const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['team', 'broadcast', 'custom', 'direct'],
    required: true,
  },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  videoRoomName: { type: String, trim: true },
}, { timestamps: true });

// Ensure max 1 broadcast room
chatRoomSchema.index({ type: 1 }, { unique: true, partialFilterExpression: { type: 'broadcast' } });
// Ensure max 1 team room per teamId
chatRoomSchema.index({ teamId: 1 }, { unique: true, partialFilterExpression: { type: 'team' } });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
