const mongoose = require('mongoose');
const Fixture  = require('../models/Fixture');
const Team     = require('../models/Team');
const League   = require('../models/League');
const User     = require('../models/User');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createKnockoutFixture = ({ leagueId, homeTeam, awayTeam, date, venue, round }) =>
  Fixture.create({ league: leagueId, homeTeam, awayTeam, date, venue, type: 'knockout', round, status: 'scheduled' });

const getFixtureWinner = (fixture) => {
  if (!fixture || fixture.status !== 'completed') return null;
  const hs = fixture.homeScore ?? 0;
  const as = fixture.awayScore ?? 0;
  if (hs > as) return fixture.homeTeam;
  if (as > hs) return fixture.awayTeam;
  return null;
};

/**
 * Derive homeScore / awayScore purely from goalEvents array.
 * Own goals credit the OPPONENT.
 */
const deriveScores = (goalEvents, homeTeamId, awayTeamId) => {
  const homeId = homeTeamId.toString();
  const awayId = awayTeamId.toString();
  let homeScore = 0;
  let awayScore = 0;
  goalEvents.forEach((g) => {
    const teamId = g.team.toString();
    const isOwnGoal = g.type === 'own_goal';
    if (!isOwnGoal && teamId === homeId) homeScore += 1;
    else if (!isOwnGoal && teamId === awayId) awayScore += 1;
    else if (isOwnGoal && teamId === homeId) awayScore += 1; // home own goal → away score
    else if (isOwnGoal && teamId === awayId) homeScore += 1; // away own goal → home score
  });
  return { homeScore, awayScore };
};

const adjustTeamStandings = async (team, { played, won, drawn, lost, gf, ga, points }) => {
  if (!team) return;
  team.played += played;
  team.won    += won;
  team.drawn  += drawn;
  team.lost   += lost;
  team.gf     += gf;
  team.ga     += ga;
  team.points += points;
  await team.save();
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const getFixtures = async (req, res) => {
  const { page, limit, status, league, all } = req.query;

  let query = {};
  if (status === 'upcoming') {
    query.status = 'scheduled';
    query.date = { $gt: new Date() };
  } else if (status === 'completed') {
    query.status = 'completed';
  }
  if (league) {
    query.league = league;
  }

  if (all === 'true' || (!page && !limit)) {
    const fixtures = await Fixture.find(query)
      .populate('homeTeam awayTeam', 'name logo color')
      .populate('league', 'name season')
      .populate('goalEvents.player', 'name jersey')
      .populate('goalEvents.team', 'name color logo')
      .populate('goalEvents.assistedBy', 'name jersey')
      .sort({ date: 1 });
    return res.json(fixtures);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Fixture.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  const fixtures = await Fixture.find(query)
    .populate('homeTeam awayTeam', 'name logo color')
    .populate('league', 'name season')
    .populate('goalEvents.player', 'name jersey')
    .populate('goalEvents.team', 'name color logo')
    .populate('goalEvents.assistedBy', 'name jersey')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    fixtures,
    totalCount,
    totalPages,
    currentPage: pageNum,
  });
};

const createFixture = async (req, res) => {
  const { league, homeTeam, awayTeam, date, venue, type = 'league', round, matchFormat = '11s' } = req.body;

  if (homeTeam === awayTeam) {
    res.status(400);
    throw new Error('Home team and Away team must be different');
  }

  // 1. Minimum active players check for match format
  const { getMatchFormatConfig } = require('../utils/matchFormatConfig');
  const formatConfig = getMatchFormatConfig(matchFormat || '11s');
  const minRequiredPlayers = formatConfig.startingCount;

  const [homePlayerCount, awayPlayerCount] = await Promise.all([
    User.countDocuments({ team: homeTeam, active: true, role: 'player' }),
    User.countDocuments({ team: awayTeam, active: true, role: 'player' }),
  ]);

  const [homeTeamDoc, awayTeamDoc] = await Promise.all([
    Team.findById(homeTeam),
    Team.findById(awayTeam),
  ]);

  if (homePlayerCount < minRequiredPlayers) {
    res.status(400);
    throw new Error(
      `Automatic match scheduling not possible: Home team "${homeTeamDoc?.name || 'Home'}" has only ${homePlayerCount} active players (minimum ${minRequiredPlayers} required for ${formatConfig.label}).`
    );
  }

  if (awayPlayerCount < minRequiredPlayers) {
    res.status(400);
    throw new Error(
      `Automatic match scheduling not possible: Away team "${awayTeamDoc?.name || 'Away'}" has only ${awayPlayerCount} active players (minimum ${minRequiredPlayers} required for ${formatConfig.label}).`
    );
  }

  // 2. Duplicate matchup check (team play each other didn't common play)
  const existingFixture = await Fixture.findOne({
    league,
    $or: [
      { homeTeam, awayTeam },
      { homeTeam: awayTeam, awayTeam: homeTeam },
    ],
  });

  if (existingFixture) {
    res.status(400);
    throw new Error(
      `A fixture between "${homeTeamDoc?.name}" and "${awayTeamDoc?.name}" already exists in this league.`
    );
  }

  const fixture = await Fixture.create({ league, homeTeam, awayTeam, date, venue, type, round, matchFormat, status: 'scheduled' });
  res.status(201).json(fixture);
};

const updateFixture = async (req, res) => {
  const { date, venue, matchFormat } = req.body;

  const fixture = await Fixture.findById(req.params.id);
  if (!fixture) {
    res.status(404);
    throw new Error('Fixture not found');
  }

  // Authorization check: Admin or Manager of a participating team
  const isAdmin = req.user.role === 'admin';
  const isManager = req.user.role === 'manager';
  const managerTeamId = req.user.team?._id?.toString() || req.user.team?.toString();
  const homeId = fixture.homeTeam?._id?.toString() || fixture.homeTeam?.toString();
  const awayId = fixture.awayTeam?._id?.toString() || fixture.awayTeam?.toString();
  const isParticipant = managerTeamId && (managerTeamId === homeId || managerTeamId === awayId);

  if (!isAdmin && !(isManager && isParticipant)) {
    res.status(403);
    throw new Error('Forbidden: You can only edit details for your team’s fixtures.');
  }

  if (date) fixture.date = new Date(date);
  if (venue && venue.trim()) fixture.venue = venue.trim();
  if (matchFormat) fixture.matchFormat = matchFormat;

  await fixture.save();

  const populated = await Fixture.findById(fixture._id)
    .populate('homeTeam awayTeam', 'name logo color')
    .populate('league', 'name season')
    .populate('goalEvents.player', 'name jersey')
    .populate('goalEvents.team', 'name color logo')
    .populate('goalEvents.assistedBy', 'name jersey');

  res.json(populated);
};

const createRoundRobinFixturesForGroup = async (groupTeams, leagueId, matchFormat, groupName, startDate, endDate) => {
  const scheduleTeams = groupTeams.map((t) => t._id.toString());
  if (scheduleTeams.length % 2 === 1) scheduleTeams.push('BYE');

  const rounds = scheduleTeams.length - 1;
  const matchesPerRound = scheduleTeams.length / 2;
  let rotation = [...scheduleTeams];
  const firstHalf = [];

  for (let round = 0; round < rounds; round += 1) {
    const roundMatches = [];
    for (let i = 0; i < matchesPerRound; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') roundMatches.push({ homeTeam: home, awayTeam: away });
    }
    firstHalf.push(roundMatches);
    const fixed = rotation[0];
    rotation = [fixed, rotation[rotation.length - 1], ...rotation.slice(1, rotation.length - 1)];
  }

  const allMatches = [
    ...firstHalf.flat(),
    ...firstHalf.flat().map((m) => ({ homeTeam: m.awayTeam, awayTeam: m.homeTeam })),
  ];

  const teamById = groupTeams.reduce((map, t) => { map[t._id.toString()] = t; return map; }, {});
  const totalDays = Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / 86400000));
  const intervalDays = Math.max(1, Math.floor(totalDays / Math.max(allMatches.length, 1)));
  const createdFixtures = [];
  let matchDate = new Date(startDate);

  for (let i = 0; i < allMatches.length; i += 1) {
    const { homeTeam: hId, awayTeam: aId } = allMatches[i];
    const homeTeam = teamById[hId];
    const awayTeam = teamById[aId];
    if (!homeTeam || !awayTeam) continue;

    const fixture = await Fixture.create({
      league: leagueId,
      homeTeam: homeTeam._id,
      awayTeam: awayTeam._id,
      date: matchDate,
      venue: `${homeTeam.name} Stadium`,
      matchFormat,
      group: groupName,
      status: 'scheduled',
    });
    createdFixtures.push(fixture);
    matchDate = new Date(matchDate.getTime() + intervalDays * 86400000);
  }

  return createdFixtures;
};

const generateFixtures = async (req, res) => {
  const { leagueId, matchFormat = '11s', teamIds, customGroups } = req.body;
  const league = await League.findById(leagueId);
  if (!league) { res.status(404); throw new Error('League not found'); }

  let query = { league: league._id, status: 'approved' };
  if (Array.isArray(teamIds) && teamIds.length > 0) {
    if (new Set(teamIds).size !== teamIds.length) {
      res.status(400);
      throw new Error('Invalid request payload: duplicate team IDs detected.');
    }

    const validTeamsCount = await Team.countDocuments({
      _id: { $in: teamIds },
      league: league._id,
      status: 'approved',
    });

    if (validTeamsCount !== teamIds.length) {
      res.status(400);
      throw new Error('One or more selected teams do not belong to this league or are not approved.');
    }

    query._id = { $in: teamIds };
  }

  const teams = await Team.find(query).sort('name');
  if (teams.length < 2) { res.status(400); throw new Error('At least two teams required to generate fixtures.'); }

  const { getMatchFormatConfig } = require('../utils/matchFormatConfig');
  const genFormatConfig = getMatchFormatConfig(matchFormat || '11s');
  const genMinRequired = genFormatConfig.startingCount;

  // Active player count check per team
  for (const t of teams) {
    const playerCount = await User.countDocuments({ team: t._id, active: true, role: 'player' });
    if (playerCount < genMinRequired) {
      res.status(400);
      throw new Error(
        `Automatic fixture generation not possible: Team "${t.name}" has only ${playerCount} active players (minimum ${genMinRequired} required for ${genFormatConfig.label}).`
      );
    }
  }

  await Fixture.deleteMany({ league: league._id });

  let generatedFixtures = [];

  // <= 10 TEAMS: Single Group Round Robin
  if (teams.length <= 10 && (!customGroups || customGroups.length <= 1)) {
    league.groups = [];
    await league.save();

    generatedFixtures = await createRoundRobinFixturesForGroup(teams, league._id, matchFormat, null, league.startDate, league.endDate);
  } else {
    // > 10 TEAMS: Multi-Group Stage Round Robin
    let groupStructure = [];

    if (Array.isArray(customGroups) && customGroups.length > 0) {
      groupStructure = customGroups.map((g) => ({
        name: g.name,
        teams: (g.teamIds || g.teams || []).map((id) => teams.find((t) => String(t._id) === String(id))).filter(Boolean),
      }));
    } else {
      // Auto-split into ~4-5 teams per group
      const numTeams = teams.length;
      let numGroups = Math.ceil(numTeams / 5);
      if (numGroups < 2) numGroups = 2;

      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const groupsArray = Array.from({ length: numGroups }, (_, i) => ({
        name: `Group ${String.fromCharCode(65 + i)}`,
        teams: [],
      }));

      shuffled.forEach((t, idx) => {
        groupsArray[idx % numGroups].teams.push(t);
      });

      groupStructure = groupsArray;
    }

    league.groups = groupStructure.map((g) => ({
      name: g.name,
      teams: g.teams.map((t) => t._id),
    }));
    await league.save();

    let matchDate = new Date(league.startDate);
    for (const g of groupStructure) {
      const gFixtures = await createRoundRobinFixturesForGroup(g.teams, league._id, matchFormat, g.name, matchDate, league.endDate);
      generatedFixtures.push(...gFixtures);
    }
  }

  res.status(201).json({
    message: `${generatedFixtures.length} fixtures generated across ${league.groups?.length || 1} group(s) for ${league.name}.`,
    groups: league.groups,
    fixturesCount: generatedFixtures.length,
  });
};

/**
 * PUT /fixtures/:id/result
 * Accepts { goalEvents: [{player, team, minute, assistedBy, type}], status }
 * Derives homeScore/awayScore from events — no manual score entry.
 */
const updateResult = async (req, res) => {
  const fixture = await Fixture.findById(req.params.id);
  if (!fixture) { res.status(404); throw new Error('Fixture not found'); }

  const { goalEvents = [], status = 'completed' } = req.body;

  // ─── Fetch all players that belong to the two teams ───────────────────────
  const [homePlayers, awayPlayers] = await Promise.all([
    User.find({ team: fixture.homeTeam }).select('_id').lean(),
    User.find({ team: fixture.awayTeam }).select('_id').lean(),
  ]);
  const homePlayerIds = new Set(homePlayers.map((p) => p._id.toString()));
  const awayPlayerIds = new Set(awayPlayers.map((p) => p._id.toString()));
  const allPlayerIds  = new Set([...homePlayerIds, ...awayPlayerIds]);

  // ─── Validate each goal event ─────────────────────────────────────────────
  for (let i = 0; i < goalEvents.length; i += 1) {
    const g = goalEvents[i];
    const label = `Goal event #${i + 1}`;

    if (!g.player)              { res.status(400); throw new Error(`${label}: player is required`); }
    if (!g.team)                { res.status(400); throw new Error(`${label}: team is required`); }
    if (!g.minute || g.minute < 1 || g.minute > 120) {
      res.status(400); throw new Error(`${label}: minute must be between 1 and 120`);
    }

    const validTypes = ['open_play', 'penalty', 'own_goal', 'free_kick'];
    if (g.type && !validTypes.includes(g.type)) {
      res.status(400); throw new Error(`${label}: invalid goal type "${g.type}"`);
    }

    const playerId = g.player.toString();
    if (!allPlayerIds.has(playerId)) {
      res.status(400); throw new Error(`${label}: player does not belong to either team in this fixture`);
    }

    // Determine which team the player is actually on (regardless of g.team submitted)
    const playerTeamId = homePlayerIds.has(playerId)
      ? fixture.homeTeam.toString()
      : fixture.awayTeam.toString();

    // Override team in case admin sent wrong value
    g.team = playerTeamId;

    if (g.assistedBy) {
      const assistId = g.assistedBy.toString();
      if (assistId === playerId) {
        res.status(400); throw new Error(`${label}: a player cannot assist their own goal`);
      }
      if (!allPlayerIds.has(assistId)) {
        res.status(400); throw new Error(`${label}: assistedBy player does not belong to either team`);
      }
      const assistTeamId = homePlayerIds.has(assistId)
        ? fixture.homeTeam.toString()
        : fixture.awayTeam.toString();
      if (assistTeamId !== playerTeamId) {
        res.status(400); throw new Error(`${label}: assistedBy must be on the same team as the scorer`);
      }
    }
  }

  // ─── Reverse previous standings if fixture was already completed ──────────
  const homeTeam = await Team.findById(fixture.homeTeam);
  const awayTeam = await Team.findById(fixture.awayTeam);

  if (fixture.status === 'completed' && homeTeam && awayTeam) {
    const prev = deriveScores(fixture.goalEvents, fixture.homeTeam, fixture.awayTeam);
    const ph   = prev.homeScore;
    const pa   = prev.awayScore;
    await adjustTeamStandings(homeTeam, { played: -1, won: ph > pa ? -1 : 0, drawn: ph === pa ? -1 : 0, lost: ph < pa ? -1 : 0, gf: -ph, ga: -pa, points: ph > pa ? -3 : ph === pa ? -1 : 0 });
    await adjustTeamStandings(awayTeam, { played: -1, won: pa > ph ? -1 : 0, drawn: ph === pa ? -1 : 0, lost: pa < ph ? -1 : 0, gf: -pa, ga: -ph, points: pa > ph ? -3 : ph === pa ? -1 : 0 });
  }

  // ─── Save new goalEvents + status ─────────────────────────────────────────
  fixture.goalEvents = goalEvents;
  fixture.status     = status;
  // Clear legacy fields so old data doesn't confuse old code paths
  fixture.scorers = [];
  fixture.assists = [];
  await fixture.save();

  // ─── Derive new scores and update standings ───────────────────────────────
  const { homeScore, awayScore } = deriveScores(goalEvents, fixture.homeTeam, fixture.awayTeam);

  if (status === 'completed' && homeTeam && awayTeam) {
    await adjustTeamStandings(homeTeam, { played: 1, won: homeScore > awayScore ? 1 : 0, drawn: homeScore === awayScore ? 1 : 0, lost: homeScore < awayScore ? 1 : 0, gf: homeScore, ga: awayScore, points: homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0 });
    await adjustTeamStandings(awayTeam, { played: 1, won: awayScore > homeScore ? 1 : 0, drawn: homeScore === awayScore ? 1 : 0, lost: awayScore < homeScore ? 1 : 0, gf: awayScore, ga: homeScore, points: awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0 });
  }

  // ─── Knockout automation — generate Final after both SFs complete ─────────
  if (fixture.type === 'knockout' && fixture.round === 'SF' && fixture.status === 'completed') {
    const sfFixtures = await Fixture.find({ league: fixture.league, type: 'knockout', round: 'SF', status: 'completed' }).lean();
    if (sfFixtures.length === 2) {
      const winners = sfFixtures.map((f) => {
        const hs = deriveScores(f.goalEvents || [], f.homeTeam, f.awayTeam).homeScore;
        const as = deriveScores(f.goalEvents || [], f.homeTeam, f.awayTeam).awayScore;
        if (hs > as) return f.homeTeam;
        if (as > hs) return f.awayTeam;
        return null;
      }).filter(Boolean);

      if (winners.length === 2) {
        const leagueDoc = await League.findById(fixture.league);
        if (leagueDoc) {
          const finalDate = new Date(Math.max(...sfFixtures.map((f) => new Date(f.date).getTime())) + 86400000);
          const finalFixture = await createKnockoutFixture({ leagueId: leagueDoc._id, homeTeam: winners[0], awayTeam: winners[1], date: finalDate, venue: `${leagueDoc.name} Final`, round: 'FINAL' });
          leagueDoc.stage = 'FINAL';
          await leagueDoc.save();
          const populated = await Fixture.findById(fixture._id).populate('goalEvents.player goalEvents.team goalEvents.assistedBy');
          return res.json({ fixture: populated, generatedFinal: finalFixture });
        }
      }
    }
  }

  if (fixture.type === 'knockout' && fixture.round === 'FINAL' && fixture.status === 'completed') {
    const leagueDoc = await League.findById(fixture.league);
    if (leagueDoc) {
      const { homeScore: hs, awayScore: as } = deriveScores(goalEvents, fixture.homeTeam, fixture.awayTeam);
      leagueDoc.stage       = 'COMPLETED';
      leagueDoc.championTeam = hs > as ? fixture.homeTeam : hs < as ? fixture.awayTeam : null;
      await leagueDoc.save();
    }
  }

  const populated = await Fixture.findById(fixture._id)
    .populate('homeTeam awayTeam', 'name logo color')
    .populate('goalEvents.player',     'name jersey')
    .populate('goalEvents.team',       'name color logo')
    .populate('goalEvents.assistedBy', 'name jersey');
  res.json(populated);
};

/**
 * POST /fixtures/advance-knockout
 * Admin triggers league-phase → knockout; sorts standings and auto-creates top-4 SF fixtures.
 */
const advanceToKnockout = async (req, res) => {
  const { leagueId, sfDate, venue } = req.body;
  const league = await League.findById(leagueId);
  if (!league) { res.status(404); throw new Error('League not found'); }

  // Check all league fixtures are completed
  const leagueFixtures = await Fixture.find({ league: leagueId, type: 'league' });
  const incomplete = leagueFixtures.filter((f) => f.status !== 'completed');
  if (incomplete.length > 0) {
    res.status(400); throw new Error(`${incomplete.length} league fixture(s) still not completed`);
  }

  // Sort teams by: points → GD → GF → name
  const teams = await Team.find({ league: leagueId }).lean();
  teams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  const top4 = teams.slice(0, 4);
  if (top4.length < 4) { res.status(400); throw new Error('Need at least 4 teams to generate knockouts'); }

  const sfDate1 = sfDate ? new Date(sfDate) : new Date(Date.now() + 7 * 86400000);
  const sfDate2 = new Date(sfDate1.getTime() + 86400000);

  // 1v4 and 2v3
  const [sf1, sf2] = await Promise.all([
    createKnockoutFixture({ leagueId, homeTeam: top4[0]._id, awayTeam: top4[3]._id, date: sfDate1, venue: venue || `${league.name} Semifinal`, round: 'SF' }),
    createKnockoutFixture({ leagueId, homeTeam: top4[1]._id, awayTeam: top4[2]._id, date: sfDate2, venue: venue || `${league.name} Semifinal`, round: 'SF' }),
  ]);

  league.stage = 'KNOCKOUT';
  await league.save();

  res.status(201).json({ message: 'Knockout stage generated', semifinal1: sf1, semifinal2: sf2, qualifiedTeams: top4.map((t) => t.name) });
};

const deleteFixture = async (req, res) => {
  const fixture = await Fixture.findById(req.params.id);
  if (!fixture) { res.status(404); throw new Error('Fixture not found'); }

  if (fixture.status === 'completed') {
    const homeTeam = await Team.findById(fixture.homeTeam);
    const awayTeam = await Team.findById(fixture.awayTeam);
    const { homeScore, awayScore } = deriveScores(fixture.goalEvents || [], fixture.homeTeam, fixture.awayTeam);
    if (homeTeam) await adjustTeamStandings(homeTeam, { played: -1, won: homeScore > awayScore ? -1 : 0, drawn: homeScore === awayScore ? -1 : 0, lost: homeScore < awayScore ? -1 : 0, gf: -homeScore, ga: -awayScore, points: homeScore > awayScore ? -3 : homeScore === awayScore ? -1 : 0 });
    if (awayTeam) await adjustTeamStandings(awayTeam, { played: -1, won: awayScore > homeScore ? -1 : 0, drawn: homeScore === awayScore ? -1 : 0, lost: awayScore < homeScore ? -1 : 0, gf: -awayScore, ga: -homeScore, points: awayScore > homeScore ? -3 : homeScore === awayScore ? -1 : 0 });
  }

  await fixture.deleteOne();
  res.json({ message: 'Fixture deleted successfully' });
};

/**
 * DELETE /fixtures/delete-all
 * Deletes all fixtures for a league (or all fixtures globally if no league specified).
 */
const deleteAllFixtures = async (req, res) => {
  const leagueId = req.params.leagueId || req.query.leagueId;

  let fixtureQuery = {};
  let teamQuery = {};

  if (leagueId && typeof leagueId === 'string' && leagueId.trim() !== '' && leagueId !== 'undefined' && leagueId !== 'null') {
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      res.status(400);
      throw new Error('Invalid league ID format');
    }
    fixtureQuery.league = leagueId;
    teamQuery.league = leagueId;
  }

  const deleteResult = await Fixture.deleteMany(fixtureQuery);

  // Reset team standings stats to 0
  await Team.updateMany(teamQuery, {
    $set: {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    },
  });

  res.json({
    success: true,
    message: `Deleted ${deleteResult.deletedCount} fixture(s) and reset team standings.`,
    deletedCount: deleteResult.deletedCount,
  });
};

module.exports = { getFixtures, createFixture, generateFixtures, updateFixture, updateResult, deleteFixture, deleteAllFixtures, advanceToKnockout };
