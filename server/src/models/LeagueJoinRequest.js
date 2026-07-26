const mongoose = require('mongoose');

const leagueJoinRequestSchema = new mongoose.Schema(
  {
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index: one pending request per team per league
leagueJoinRequestSchema.index({ league: 1, team: 1, status: 1 });

module.exports = mongoose.model('LeagueJoinRequest', leagueJoinRequestSchema);
