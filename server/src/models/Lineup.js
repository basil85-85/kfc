const mongoose = require('mongoose');

const startingXISchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  position: { type: String, default: 'CM' },
  x: { type: Number, required: true }, // percentage 0-100
  y: { type: Number, required: true }, // percentage 0-100
}, { _id: false });

const lineupSchema = new mongoose.Schema({
  fixture: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  formation: { type: String, default: '4-4-2' },
  startingXI: [startingXISchema],
  substitutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notSelected: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastEditedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Lineup', lineupSchema);
