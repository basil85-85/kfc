const mongoose = require('mongoose');

const goalEventSchema = new mongoose.Schema({
  player:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  minute:     { type: Number, min: 1, max: 120, required: true },
  assistedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type:       {
    type: String,
    enum: ['open_play', 'penalty', 'own_goal', 'free_kick'],
    default: 'open_play',
  },
}, { _id: true });

const fixtureSchema = new mongoose.Schema({
  league:   { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team',   required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team',   required: true },
  date:     { type: Date,   required: true },
  venue:    { type: String, required: true, trim: true },
  type:     { type: String, enum: ['league', 'knockout'], default: 'league' },
  round:    { type: String, enum: ['SF', 'FINAL', '3RD_PLACE', null], default: null },
  group:    { type: String, default: null },
  matchFormat: { type: String, enum: ['5s', '7s', '11s'], default: '11s' },
  status:   { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },

  // Unified event log — source of truth for all goals & assists
  goalEvents: [goalEventSchema],

  // Legacy fields kept for backward-compat reads; NOT written by new code
  scorers: [{ player: mongoose.Schema.Types.ObjectId, team: mongoose.Schema.Types.ObjectId, minute: Number }],
  assists: [{ player: mongoose.Schema.Types.ObjectId, minute: Number }],
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Derived score virtuals ──────────────────────────────────────────────────
// homeScore = goals by homeTeam's players (non-own-goal) + own goals by awayTeam
fixtureSchema.virtual('homeScore').get(function () {
  if (!this.goalEvents || this.goalEvents.length === 0) return 0;
  const homeId = this.homeTeam?._id?.toString() || this.homeTeam?.toString();
  const awayId = this.awayTeam?._id?.toString() || this.awayTeam?.toString();
  return this.goalEvents.reduce((sum, g) => {
    const teamId = g.team?._id?.toString() || g.team?.toString();
    const isOwnGoal = g.type === 'own_goal';
    // Own-goal by away team → credit home; normal goal by home team → credit home
    if ((!isOwnGoal && teamId === homeId) || (isOwnGoal && teamId === awayId)) return sum + 1;
    return sum;
  }, 0);
});

fixtureSchema.virtual('awayScore').get(function () {
  if (!this.goalEvents || this.goalEvents.length === 0) return 0;
  const homeId = this.homeTeam?._id?.toString() || this.homeTeam?.toString();
  const awayId = this.awayTeam?._id?.toString() || this.awayTeam?.toString();
  return this.goalEvents.reduce((sum, g) => {
    const teamId = g.team?._id?.toString() || g.team?.toString();
    const isOwnGoal = g.type === 'own_goal';
    // Own-goal by home team → credit away; normal goal by away team → credit away
    if ((!isOwnGoal && teamId === awayId) || (isOwnGoal && teamId === homeId)) return sum + 1;
    return sum;
  }, 0);
});

module.exports = mongoose.model('Fixture', fixtureSchema);
