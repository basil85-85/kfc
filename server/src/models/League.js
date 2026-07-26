const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  season: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  stage: {
    type: String,
    enum: ['LEAGUE', 'SEMI_FINAL', 'FINAL', 'COMPLETED'],
    default: 'LEAGUE',
  },
  groups: [
    {
      name: { type: String, required: true },
      teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    },
  ],
  qualifiedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  championTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('League', leagueSchema);
