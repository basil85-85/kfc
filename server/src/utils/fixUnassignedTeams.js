const Team = require('../models/Team');
const League = require('../models/League');

/**
 * Migration helper: Fixes approved teams that have league: null by auto-linking
 * them to the latest active League in the database.
 */
const fixUnassignedTeams = async () => {
  try {
    const unassignedTeams = await Team.find({
      $or: [{ league: null }, { league: { $exists: false } }],
    });

    if (unassignedTeams.length === 0) return;

    const defaultLeague = await League.findOne({ active: true }).sort({ createdAt: -1 }) || await League.findOne().sort({ createdAt: -1 });

    if (!defaultLeague) {
      console.log(`[DATA AUDIT] Found ${unassignedTeams.length} unassigned teams, but no active League exists yet to link.`);
      return;
    }

    const res = await Team.updateMany(
      { $or: [{ league: null }, { league: { $exists: false } }] },
      { league: defaultLeague._id }
    );

    console.log(`[DATA AUDIT] Backfilled ${res.modifiedCount} unassigned teams into league "${defaultLeague.name}" (${defaultLeague._id})`);
  } catch (err) {
    console.error('[DATA AUDIT] Error backfilling unassigned teams:', err.message);
  }
};

module.exports = fixUnassignedTeams;
