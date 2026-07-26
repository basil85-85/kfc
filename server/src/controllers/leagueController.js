const mongoose = require('mongoose');
const League = require('../models/League');
const Team = require('../models/Team');
const Fixture = require('../models/Fixture');
const LeagueJoinRequest = require('../models/LeagueJoinRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

const sortStandings = (teams = []) => {
  return [...teams]
    .map((team) => ({
      ...team,
      gd: typeof team.gd === 'number' ? team.gd : (team.gf || 0) - (team.ga || 0),
    }))
    .sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.gd || 0) !== (a.gd || 0)) return (b.gd || 0) - (a.gd || 0);
      if ((b.gf || 0) !== (a.gf || 0)) return (b.gf || 0) - (a.gf || 0);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
};

const getDynamicRankedTeams = async (leagueId) => {
  const league = await League.findById(leagueId).lean();
  if (!league) return [];

  // Collect team IDs from 3 sources:
  // 1. Teams explicitly linked to this league via team.league
  const explicitTeams = await Team.find({ league: leagueId }).lean();
  const teamMap = new Map();
  explicitTeams.forEach((t) => teamMap.set(String(t._id), t));

  // 2. Teams listed in league.groups
  if (league.groups && league.groups.length > 0) {
    const groupTeamIds = [];
    league.groups.forEach((g) => {
      (g.teams || []).forEach((tId) => {
        const idStr = String(tId._id || tId);
        if (idStr && !teamMap.has(idStr)) groupTeamIds.push(idStr);
      });
    });
    if (groupTeamIds.length > 0) {
      const gTeams = await Team.find({ _id: { $in: groupTeamIds } }).lean();
      gTeams.forEach((t) => teamMap.set(String(t._id), t));
    }
  }

  // 3. Teams scheduled in any Fixture for this league
  const leagueFixtures = await Fixture.find({ league: leagueId }).lean();
  const fixtureTeamIds = [];
  leagueFixtures.forEach((f) => {
    const hId = String(f.homeTeam?._id || f.homeTeam);
    const aId = String(f.awayTeam?._id || f.awayTeam);
    if (hId && !teamMap.has(hId)) fixtureTeamIds.push(hId);
    if (aId && !teamMap.has(aId)) fixtureTeamIds.push(aId);
  });
  if (fixtureTeamIds.length > 0) {
    const fTeams = await Team.find({ _id: { $in: fixtureTeamIds } }).lean();
    fTeams.forEach((t) => teamMap.set(String(t._id), t));
  }

  const teams = Array.from(teamMap.values());
  const completedFixtures = leagueFixtures.filter((f) => f.status === 'completed');

  const statsMap = {};
  teams.forEach((t) => {
    statsMap[String(t._id)] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });

  completedFixtures.forEach((f) => {
    const homeId = String(f.homeTeam?._id || f.homeTeam);
    const awayId = String(f.awayTeam?._id || f.awayTeam);

    let hs = 0;
    let as = 0;
    (f.goalEvents || []).forEach((g) => {
      const tId = String(g.team?._id || g.team);
      const isOwn = g.type === 'own_goal';
      if (!isOwn && tId === homeId) hs += 1;
      else if (!isOwn && tId === awayId) as += 1;
      else if (isOwn && tId === homeId) as += 1;
      else if (isOwn && tId === awayId) hs += 1;
    });

    if (statsMap[homeId]) {
      statsMap[homeId].played += 1;
      statsMap[homeId].gf += hs;
      statsMap[homeId].ga += as;
      if (hs > as) { statsMap[homeId].won += 1; statsMap[homeId].points += 3; }
      else if (hs === as) { statsMap[homeId].drawn += 1; statsMap[homeId].points += 1; }
      else { statsMap[homeId].lost += 1; }
    }

    if (statsMap[awayId]) {
      statsMap[awayId].played += 1;
      statsMap[awayId].gf += as;
      statsMap[awayId].ga += hs;
      if (as > hs) { statsMap[awayId].won += 1; statsMap[awayId].points += 3; }
      else if (hs === as) { statsMap[awayId].drawn += 1; statsMap[awayId].points += 1; }
      else { statsMap[awayId].lost += 1; }
    }
  });

  return teams.map((t) => {
    const s = statsMap[String(t._id)] || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    return {
      ...t,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      gf: s.gf,
      ga: s.ga,
      gd: s.gf - s.ga,
      points: s.points,
    };
  });
};

const getLeagues = async (req, res) => {
  const leagues = await League.find().populate('createdBy', 'name');
  res.json(leagues);
};

const createLeague = async (req, res) => {
  const { name, season, startDate, endDate } = req.body;
  const league = await League.create({
    name,
    season,
    startDate,
    endDate,
    createdBy: req.user._id,
  });

  // Notify approved managers whose team is NOT already in a league
  try {
    const unassignedTeams = await Team.find({
      status: 'approved',
      $or: [{ league: null }, { league: { $exists: false } }],
    }).select('createdBy managerEmail');

    const managerIds = [...new Set(
      unassignedTeams.map((t) => String(t.createdBy)).filter(Boolean)
    )];

    if (managerIds.length > 0) {
      await Notification.create({
        title: `🏆 New League Available: ${league.name}`,
        body: `A new league competition has been created: ${league.name} (${league.season}), running from ${new Date(league.startDate).toLocaleDateString()} to ${new Date(league.endDate).toLocaleDateString()}. Log in to request to join with your team!`,
        type: 'info',
        sentTo: 'all',
        createdBy: req.user._id,
      });
    }
  } catch (err) {
    console.error('Failed to send new-league notifications:', err);
  }

  res.status(201).json(league);
};

/* ─── Join Request: Manager submits ───────────────────────── */
const requestJoinLeague = async (req, res) => {
  const { id: leagueId } = req.params;

  const league = await League.findById(leagueId);
  if (!league || !league.active) {
    res.status(404);
    throw new Error('League not found or is no longer active.');
  }

  const team = await Team.findOne({
    createdBy: req.user._id,
    status: 'approved',
  });
  if (!team) {
    res.status(403);
    throw new Error('You must have an approved team to request league entry.');
  }

  // One-league rule: block if team is already in an active league
  if (team.league) {
    const currentLeague = await League.findById(team.league).select('name active');
    if (currentLeague && currentLeague.active) {
      res.status(400);
      throw new Error(
        `Your team is already participating in "${currentLeague.name}". A team can only be in one active league at a time.`
      );
    }
  }

  // Duplicate-pending guard
  const existing = await LeagueJoinRequest.findOne({
    league: leagueId,
    team: team._id,
    status: 'pending',
  });
  if (existing) {
    res.status(400);
    throw new Error('You already have a pending request to join this league.');
  }

  const request = await LeagueJoinRequest.create({
    league: leagueId,
    team: team._id,
    requestedBy: req.user._id,
  });

  const populated = await LeagueJoinRequest.findById(request._id)
    .populate('league', 'name season')
    .populate('team', 'name logo color')
    .populate('requestedBy', 'name email');

  res.status(201).json(populated);
};

/* ─── Join Requests: Admin views all ──────────────────────── */
const getJoinRequests = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const requests = await LeagueJoinRequest.find(filter)
    .populate('league', 'name season active')
    .populate('team', 'name logo color managerEmail')
    .populate('requestedBy', 'name email')
    .populate('respondedBy', 'name')
    .sort({ requestedAt: -1 });

  res.json(requests);
};

/* ─── Join Requests: Manager views own ────────────────────── */
const getMyJoinRequests = async (req, res) => {
  const team = await Team.findOne({ createdBy: req.user._id, status: 'approved' });
  if (!team) return res.json([]);

  const requests = await LeagueJoinRequest.find({ team: team._id })
    .populate('league', 'name season startDate endDate active')
    .populate('respondedBy', 'name')
    .sort({ requestedAt: -1 });

  res.json(requests);
};

/* ─── Approve Join Request ─────────────────────────────────── */
const approveJoinRequest = async (req, res) => {
  const { reqId } = req.params;

  const request = await LeagueJoinRequest.findById(reqId)
    .populate('league', 'name season')
    .populate('team', 'name');

  if (!request) {
    res.status(404);
    throw new Error('Join request not found.');
  }
  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('This request has already been responded to.');
  }

  // Set team.league
  await Team.findByIdAndUpdate(request.team._id, { league: request.league._id });

  // Mark approved
  request.status = 'approved';
  request.respondedAt = new Date();
  request.respondedBy = req.user._id;
  await request.save();

  // Auto-reject other pending requests from the same team (one-league rule)
  await LeagueJoinRequest.updateMany(
    { team: request.team._id, status: 'pending', _id: { $ne: request._id } },
    {
      status: 'rejected',
      rejectionReason: 'Your team was approved to join another league.',
      respondedAt: new Date(),
      respondedBy: req.user._id,
    }
  );

  // Notify manager
  try {
    await Notification.create({
      title: `✅ League Join Approved: ${request.league.name}`,
      body: `Your team "${request.team.name}" has been approved to join ${request.league.name} (${request.league.season}). You are now eligible for fixtures in this competition!`,
      type: 'match',
      sentTo: 'all',
      createdBy: req.user._id,
    });
  } catch (err) {
    console.error('Failed to send approval notification:', err);
  }

  res.json({ message: `Team approved for ${request.league.name}.`, request });
};

/* ─── Reject Join Request ──────────────────────────────────── */
const rejectJoinRequest = async (req, res) => {
  const { reqId } = req.params;
  const { rejectionReason } = req.body;

  const request = await LeagueJoinRequest.findById(reqId)
    .populate('league', 'name season')
    .populate('team', 'name');

  if (!request) {
    res.status(404);
    throw new Error('Join request not found.');
  }
  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('This request has already been responded to.');
  }

  request.status = 'rejected';
  request.rejectionReason = rejectionReason || '';
  request.respondedAt = new Date();
  request.respondedBy = req.user._id;
  await request.save();

  // Notify manager
  try {
    await Notification.create({
      title: `❌ League Join Request Declined: ${request.league.name}`,
      body: `Your request for team "${request.team.name}" to join ${request.league.name} (${request.league.season}) was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ' You may submit a new request later.'}`,
      type: 'alert',
      sentTo: 'all',
      createdBy: req.user._id,
    });
  } catch (err) {
    console.error('Failed to send rejection notification:', err);
  }

  res.json({ message: 'Request rejected.', request });
};

const getStandings = async (req, res) => {
  const league = await League.findById(req.params.id).populate('groups.teams', 'name logo color');
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  // Dynamically compute exact standings strictly from completed fixtures
  const dynamicTeams = await getDynamicRankedTeams(league._id);
  const qualifiedIds = new Set((league.qualifiedTeams || []).map((teamId) => String(teamId)));

  if (league.groups && league.groups.length > 0) {
    // Group stage tables
    const groupStandings = league.groups.map((group) => {
      const gTeamIds = new Set((group.teams || []).map((t) => String(t._id || t)));
      const gTeams = dynamicTeams.filter((t) => gTeamIds.has(String(t._id)));
      const rankedGroupTeams = sortStandings(gTeams);

      const table = rankedGroupTeams.map((team, index) => ({
        position: index + 1,
        team: team.name,
        teamId: team._id,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        gf: team.gf,
        ga: team.ga,
        gd: team.gd,
        points: team.points,
        color: team.color,
        logo: team.logo,
        qualified: qualifiedIds.has(String(team._id)),
      }));

      return {
        groupName: group.name,
        standings: table,
      };
    });

    return res.json({ league, isGrouped: true, groups: groupStandings });
  }

  // Single table standings (<= 10 teams)
  const rankedTeams = sortStandings(dynamicTeams);
  const standings = rankedTeams.map((team, index) => ({
    position: index + 1,
    team: team.name,
    teamId: team._id,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    gf: team.gf,
    ga: team.ga,
    gd: team.gd,
    points: team.points,
    color: team.color,
    logo: team.logo,
    qualified: qualifiedIds.has(String(team._id)),
  }));

  res.json({ league, isGrouped: false, standings });
};

const finalizeLeaguePhase = async (req, res) => {
  const league = await League.findById(req.params.id);
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }

  if (league.stage !== 'LEAGUE') {
    res.status(400);
    throw new Error('League phase has already advanced beyond the league stage.');
  }

  const leagueFixtures = await Fixture.find({ league: league._id, type: 'league' }).lean();
  const hasIncompleteFixtures = leagueFixtures.some((fixture) => fixture.status !== 'completed');
  if (hasIncompleteFixtures) {
    res.status(400);
    throw new Error('All league fixtures must be completed before finalizing the league phase.');
  }

  const teams = await getDynamicRankedTeams(league._id);
  let topFour = [];

  if (league.groups && league.groups.length >= 2) {
    // Multi-group qualification: Top 2 from Group A and Top 2 from Group B
    const groupAIds = new Set((league.groups[0].teams || []).map((t) => String(t._id || t)));
    const groupBIds = new Set((league.groups[1].teams || []).map((t) => String(t._id || t)));

    const teamsA = sortStandings(teams.filter((t) => groupAIds.has(String(t._id))));
    const teamsB = sortStandings(teams.filter((t) => groupBIds.has(String(t._id))));

    const A1 = teamsA[0]?._id;
    const A2 = teamsA[1]?._id;
    const B1 = teamsB[0]?._id;
    const B2 = teamsB[1]?._id;

    topFour = [A1, B1, A2, B2].filter(Boolean);
  } else {
    // Single table qualification: Top 4 overall
    const rankedTeams = sortStandings(teams);
    topFour = rankedTeams.slice(0, 4).map((team) => team._id);
  }

  league.qualifiedTeams = topFour;
  league.stage = 'SEMI_FINAL';
  await league.save();

  await Fixture.deleteMany({ league: league._id, type: 'knockout', round: { $in: ['SF', 'FINAL', '3RD_PLACE'] } });

  const [first, second, third, fourth] = topFour;
  const semifinalDate = new Date(league.endDate);
  semifinalDate.setDate(semifinalDate.getDate() + 1);

  const semifinalFixtures = [
    {
      league: league._id,
      homeTeam: first,
      awayTeam: fourth || second,
      date: semifinalDate,
      venue: `${league.name} Semifinal 1`,
      type: 'knockout',
      round: 'SF',
      status: 'scheduled',
    },
    {
      league: league._id,
      homeTeam: second,
      awayTeam: third || first,
      date: new Date(semifinalDate.getTime() + 24 * 60 * 60 * 1000),
      venue: `${league.name} Semifinal 2`,
      type: 'knockout',
      round: 'SF',
      status: 'scheduled',
    },
  ];

  await Fixture.insertMany(semifinalFixtures);

  res.status(201).json({
    message: 'League phase finalized and semifinals generated successfully.',
    league,
    qualifiedTeams: topFour,
  });
};

const deleteLeague = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid League ID format');
  }

  const league = await League.findById(id);
  if (!league) {
    // If league was already removed, clean up orphaned records and return success
    await Fixture.deleteMany({ league: id });
    await Team.updateMany(
      { league: id },
      { $set: { league: null, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 } }
    );
    return res.json({ success: true, message: 'League removed or already cleaned up.' });
  }

  await Fixture.deleteMany({ league: league._id });
  await Team.updateMany(
    { league: league._id },
    { $set: { league: null, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 } }
  );

  await league.deleteOne();
  res.json({ success: true, message: `League "${league.name}" and all associated fixtures deleted successfully.` });
};

const deleteAllLeagues = async (req, res) => {
  const leaguesCount = await League.countDocuments();
  await League.deleteMany({});
  await Fixture.deleteMany({});

  // Unlink all teams & reset standings stats
  await Team.updateMany(
    {},
    { $set: { league: null, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 } }
  );

  res.json({ message: `Deleted ${leaguesCount} league(s) and all system fixtures successfully.` });
};

module.exports = {
  getLeagues,
  createLeague,
  getStandings,
  sortStandings,
  finalizeLeaguePhase,
  deleteLeague,
  deleteAllLeagues,
  requestJoinLeague,
  getJoinRequests,
  getMyJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
};
