const Team = require('../models/Team');
const League = require('../models/League');
const User = require('../models/User');
const Fixture = require('../models/Fixture');
const Notification = require('../models/Notification');
const { sortStandings } = require('./leagueController');
const {
  sendTeamRegistrationConfirmation,
  sendTeamApprovalEmail,
  sendTeamRejectionEmail,
} = require('../utils/emailService');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getTeams = async (req, res) => {
  const query = req.query.includeAll === 'true' ? {} : { status: 'approved' };
  const teams = await Team.find(query)
    .populate('league', 'name season')
    .populate('captain', 'name')
    .populate('players', 'name position jersey photoURL team');
  res.json(teams);
};

const getTeamById = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('league', 'name season stage qualifiedTeams championTeam')
    .populate('captain', 'name position jersey photoURL');

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  res.json(team);
};

const registerTeam = async (req, res) => {
  const { leagueId, league, name, color, logo, country, managerName, managerEmail, description } = req.body;

  if (!name || !managerName || !managerEmail) {
    res.status(400);
    throw new Error('Team Name, Manager Name, and Manager Email are required');
  }

  const cleanEmail = String(managerEmail).trim().toLowerCase();

  if (!emailRegex.test(cleanEmail)) {
    res.status(400);
    throw new Error('Invalid manager email format');
  }

  // Uniqueness check — one email or user can't have multiple pending/approved teams
  const existingTeamWithEmail = await Team.findOne({
    managerEmail: cleanEmail,
    status: { $in: ['pending', 'approved'] },
  });

  if (existingTeamWithEmail) {
    res.status(400);
    throw new Error('This manager email already has a pending or approved team registration');
  }

  const existingTeamWithUser = await Team.findOne({
    createdBy: req.user._id,
    status: { $in: ['pending', 'approved'] },
  });

  if (existingTeamWithUser) {
    res.status(400);
    throw new Error('You already have a pending or approved team application');
  }

  const targetLeagueId = leagueId || league;
  let activeLeague = targetLeagueId ? await League.findById(targetLeagueId) : null;
  if (!activeLeague) {
    activeLeague = await League.findOne({ active: true }).sort({ createdAt: -1 }) || await League.findOne().sort({ createdAt: -1 });
  }

  // Create pending team
  const team = await Team.create({
    league: activeLeague ? activeLeague._id : undefined,
    name: name.trim(),
    color: color || '#00d2ff',
    logo: logo || '',
    country: country ? country.trim() : '',
    managerName: managerName.trim(),
    managerEmail: cleanEmail,
    description: description ? description.trim() : '',
    status: 'pending',
    createdBy: req.user._id,
  });

  // Assign team to user as draft/pending
  await User.findByIdAndUpdate(req.user._id, { team: team._id });

  // Send confirmation email
  await sendTeamRegistrationConfirmation({
    managerEmail: cleanEmail,
    managerName: managerName.trim(),
    teamName: team.name,
    logo: team.logo,
    color: team.color,
  });

  res.status(201).json(team);
};

const getMyTeam = async (req, res) => {
  let team = await Team.findOne({ createdBy: req.user._id })
    .populate('league', 'name season')
    .populate('players', 'name position jersey photoURL');

  if (!team && req.user.team) {
    team = await Team.findById(req.user.team)
      .populate('league', 'name season')
      .populate('players', 'name position jersey photoURL');
  }

  if (!team) {
    return res.json(null);
  }

  res.json(team);
};

const getPendingTeams = async (req, res) => {
  const pendingTeams = await Team.find({ status: 'pending' })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json(pendingTeams);
};

const approveTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const { leagueId, league } = req.body;
  const targetLeagueId = leagueId || league;
  if (targetLeagueId) {
    team.league = targetLeagueId;
  } else if (!team.league) {
    const activeLeague = await League.findOne({ active: true }).sort({ createdAt: -1 }) || await League.findOne().sort({ createdAt: -1 });
    if (activeLeague) {
      team.league = activeLeague._id;
    }
  }

  team.status = 'approved';
  team.rejectionReason = '';
  await team.save();

  // Link manager user to approved team if createdBy exists
  if (team.createdBy) {
    await User.findByIdAndUpdate(team.createdBy, { team: team._id });
  }

  // Auto-create team chat room on approval
  const { ensureTeamChatRoom } = require('../utils/chatRoomUtils');
  await ensureTeamChatRoom(team._id, req.user._id);

  // Create in-app notification
  await Notification.create({
    title: `Team Approved: ${team.name}`,
    body: `Congratulations! Your team "${team.name}" has been approved and is now live!`,
    type: 'general',
    sentTo: 'all',
    createdBy: req.user._id,
  });

  // Send HTML approval email
  await sendTeamApprovalEmail({
    managerEmail: team.managerEmail,
    managerName: team.managerName,
    teamName: team.name,
    logo: team.logo,
    dashboardUrl: `${req.protocol}://${req.get('host')}/dashboard`,
  });

  res.json(team);
};

const rejectTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const { reason } = req.body;
  team.status = 'rejected';
  team.rejectionReason = reason || 'Request did not meet league criteria.';
  await team.save();

  // Create in-app notification
  await Notification.create({
    title: `Team Registration Status: ${team.name}`,
    body: `Your team request for "${team.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    type: 'general',
    sentTo: 'all',
    createdBy: req.user._id,
  });

  // Send rejection email
  await sendTeamRejectionEmail({
    managerEmail: team.managerEmail,
    managerName: team.managerName,
    teamName: team.name,
    reason: team.rejectionReason,
  });

  res.json(team);
};

const assignLeagueToUnassignedTeams = async (req, res) => {
  const { leagueId } = req.body;
  if (!leagueId) {
    res.status(400);
    throw new Error('leagueId is required');
  }
  const result = await Team.updateMany(
    { status: 'approved', $or: [{ league: null }, { league: { $exists: false } }] },
    { league: leagueId }
  );
  res.json({ success: true, updatedCount: result.modifiedCount });
};

const createTeam = async (req, res) => {
  const { leagueId, name, color, logo, captain, players, managerName, managerEmail } = req.body;
  const league = leagueId ? await League.findById(leagueId) : null;
  const team = await Team.create({
    league: league ? league._id : undefined,
    name,
    color,
    logo,
    managerName: managerName || 'Admin Manager',
    managerEmail: managerEmail ? String(managerEmail).trim().toLowerCase() : req.user.email,
    status: 'approved',
    captain,
    players,
  });

  if (players && players.length > 0) {
    await User.updateMany({ _id: { $in: players } }, { team: team._id });
  }

  res.status(201).json(team);
};

const updateTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }
  const { leagueId, league, name, color, logo, captain, players, country, description, status } = req.body;
  const targetLeagueId = leagueId !== undefined ? leagueId : league;
  if (targetLeagueId !== undefined) team.league = targetLeagueId || null;
  if (name) team.name = name;
  if (color) team.color = color;
  if (logo) team.logo = logo;
  if (country !== undefined) team.country = country;
  if (description !== undefined) team.description = description;
  if (status) team.status = status;
  if (captain) team.captain = captain;
  if (players) {
    team.players = players;
    await User.updateMany({ team: team._id, _id: { $nin: players } }, { $unset: { team: '' } });
    await User.updateMany({ _id: { $in: players } }, { team: team._id });
  }
  await team.save();
  res.json(team);
};

const getTeamRoster = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('captain', 'name position jersey photoURL')
    .lean();

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const players = await User.find({ team: team._id, role: 'player' })
    .select('name position jersey photoURL team rating overall highlightVideoUrl highlightVideoEmbed aboutMe')
    .sort({ jersey: 1, name: 1 })
    .lean();

  const league = team.league ? await League.findById(team.league).lean() : null;
  const allTeams = team.league ? await Team.find({ league: team.league, status: 'approved' }).lean() : [];
  const rankedTeams = sortStandings(allTeams);
  const currentPosition = rankedTeams.findIndex((item) => String(item._id) === String(team._id)) + 1 || 1;

  const fixtures = team.league
    ? await Fixture.find({
        league: team.league,
        $or: [{ homeTeam: team._id }, { awayTeam: team._id }],
        status: 'completed',
      })
        .populate('homeTeam awayTeam', 'name logo color')
        .sort({ date: -1 })
        .lean()
    : [];

  const lastFive = fixtures.slice(0, 5).map((fixture) => {
    const isHome = String(fixture.homeTeam?._id || fixture.homeTeam) === String(team._id);
    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
    const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
    return {
      fixtureId: fixture._id,
      opponent: isHome ? fixture.awayTeam?.name : fixture.homeTeam?.name,
      score: `${teamScore}-${opponentScore}`,
      result,
      date: fixture.date,
    };
  });

  const playerStats = {};
  const assistStats = {};

  fixtures.forEach((fixture) => {
    fixture.scorers?.forEach((scorer) => {
      const playerId = String(scorer.player?._id || scorer.player);
      if (!playerId) return;
      playerStats[playerId] = playerStats[playerId] || { goals: 0, player: scorer.player || null };
      playerStats[playerId].goals += 1;
    });

    fixture.assists?.forEach((assist) => {
      const playerId = String(assist.player?._id || assist.player);
      if (!playerId) return;
      assistStats[playerId] = assistStats[playerId] || { assists: 0, player: assist.player || null };
      assistStats[playerId].assists += 1;
    });
  });

  const topScorer = Object.values(playerStats).sort((a, b) => b.goals - a.goals)[0] || null;
  const topAssister = Object.values(assistStats).sort((a, b) => b.assists - a.assists)[0] || null;

  const groupByPosition = (position) => {
    if (position === 'GK') return 'GK';
    if (['CB', 'LB', 'RB'].includes(position)) return 'DEF';
    if (['CDM', 'CM', 'CAM'].includes(position)) return 'MID';
    if (['LW', 'RW', 'ST'].includes(position)) return 'FWD';
    return 'MID';
  };

  const squadByPosition = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };

  players.forEach((player) => {
    const group = groupByPosition(player.position);
    squadByPosition[group].push(player);
  });

  res.json({
    team,
    league,
    currentPosition,
    standings: {
      played: team.played,
      won: team.won,
      drawn: team.drawn,
      lost: team.lost,
      gf: team.gf,
      ga: team.ga,
      gd: (team.gf || 0) - (team.ga || 0),
      points: team.points,
    },
    squadByPosition,
    startingXI: players.slice(0, 11),
    substitutes: players.slice(11),
    lastFive,
    topScorer,
    topAssister,
  });
};

const deleteTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  await User.updateMany({ team: team._id }, { $unset: { team: '' } });
  await Fixture.deleteMany({ $or: [{ homeTeam: team._id }, { awayTeam: team._id }] });
  await team.deleteOne();

  res.json({ message: 'Team deleted successfully and related fixtures removed.' });
};

module.exports = {
  getTeams,
  getTeamById,
  registerTeam,
  getMyTeam,
  getPendingTeams,
  approveTeam,
  rejectTeam,
  assignLeagueToUnassignedTeams,
  createTeam,
  updateTeam,
  getTeamRoster,
  deleteTeam,
};
