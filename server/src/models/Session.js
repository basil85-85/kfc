const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  fee: { type: Number, default: 0 },
  maxPlayers: { type: Number, default: 22 },
  type: { type: String, enum: ['Training', 'Friendly', 'Tournament'], default: 'Training' },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attended: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
