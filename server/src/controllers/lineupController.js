const Lineup = require('../models/Lineup');
const Fixture = require('../models/Fixture');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getLineupsByFixture = async (req, res) => {
  const { fixtureId } = req.params;

  const fixture = await Fixture.findById(fixtureId)
    .populate('homeTeam', 'name logo color managerEmail createdBy')
    .populate('awayTeam', 'name logo color managerEmail createdBy')
    .populate('league', 'name season');

  if (!fixture) {
    res.status(404);
    throw new Error('Fixture not found');
  }

  const lineups = await Lineup.find({ fixture: fixtureId })
    .populate('team', 'name logo color managerEmail createdBy')
    .populate('startingXI.player', 'name photoURL jersey position overall rating')
    .populate('substitutes', 'name photoURL jersey position overall rating')
    .populate('notSelected', 'name photoURL jersey position overall rating')
    .populate('setBy', 'name email role')
    .populate('lastEditedBy', 'name email role');

  const homeLineup = lineups.find(
    (l) => String(l.team?._id || l.team) === String(fixture.homeTeam?._id || fixture.homeTeam)
  ) || null;

  const awayLineup = lineups.find(
    (l) => String(l.team?._id || l.team) === String(fixture.awayTeam?._id || fixture.awayTeam)
  ) || null;

  res.json({
    fixture,
    homeLineup,
    awayLineup,
    lineups,
  });
};

const saveLineup = async (req, res) => {
  const { fixtureId, teamId, formation, startingXI, substitutes, notSelected, matchFormat } = req.body;

  if (!fixtureId || !teamId) {
    res.status(400);
    throw new Error('Fixture ID and Team ID are required');
  }

  const fixture = await Fixture.findById(fixtureId)
    .populate('homeTeam', 'name')
    .populate('awayTeam', 'name');

  if (!fixture) {
    res.status(404);
    throw new Error('Fixture not found');
  }

  if (fixture.status === 'completed') {
    res.status(400);
    throw new Error('Lineups are locked for completed matches and cannot be modified.');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Authorization check: Admin or Manager of team
  const isManager =
    req.user.role === 'manager' &&
    ((req.user.team && String(req.user.team._id || req.user.team) === String(team._id)) ||
     (team.createdBy && String(team.createdBy) === String(req.user._id)) ||
     (team.managerEmail && req.user.email && team.managerEmail.toLowerCase() === req.user.email.toLowerCase()));
  const isAdmin = req.user.role === 'admin';

  if (!isManager && !isAdmin) {
    res.status(403);
    throw new Error('Forbidden: You can only manage lineups for your own team.');
  }

  // Format-aware validation
  const targetFormat = matchFormat || fixture.matchFormat || '11s';
  if (matchFormat && fixture.matchFormat !== matchFormat) {
    fixture.matchFormat = matchFormat;
    await fixture.save();
  }

  const { getMatchFormatConfig } = require('../utils/matchFormatConfig');
  const formatConfig = getMatchFormatConfig(targetFormat);
  const requiredStarters = formatConfig.startingCount;
  const maxSubs = formatConfig.maxSubs;

  if (!Array.isArray(startingXI) || startingXI.length !== requiredStarters) {
    res.status(400);
    throw new Error(
      `Exactly ${requiredStarters} starting players are required for ${formatConfig.label} format. You currently have ${startingXI?.length || 0}/${requiredStarters} placed.`
    );
  }

  const validSubstitutes = Array.isArray(substitutes) ? substitutes.slice(0, maxSubs) : [];
  const validNotSelected = Array.isArray(notSelected) ? notSelected : [];

  const playerIds = startingXI.map((item) => String(item.player || item.playerId));
  const uniquePlayerIds = new Set(playerIds);
  if (uniquePlayerIds.size !== requiredStarters) {
    res.status(400);
    throw new Error('Duplicate players detected in Starting XI. Each player can only be placed once.');
  }

  let lineup = await Lineup.findOne({ fixture: fixtureId, team: teamId });

  const formattedXI = startingXI.map((item) => ({
    player: item.player || item.playerId,
    position: item.position || 'CM',
    x: typeof item.x === 'number' ? item.x : 50,
    y: typeof item.y === 'number' ? item.y : 50,
  }));

  if (!lineup) {
    lineup = new Lineup({
      fixture: fixtureId,
      team: teamId,
      formation: formation || '4-4-2',
      startingXI: formattedXI,
      substitutes: validSubstitutes,
      notSelected: validNotSelected,
      setBy: req.user._id,
    });
  } else {
    lineup.formation = formation || lineup.formation;
    lineup.startingXI = formattedXI;
    lineup.substitutes = validSubstitutes;
    lineup.notSelected = validNotSelected;
  }

  if (isAdmin) {
    lineup.lastEditedBy = req.user._id;
    lineup.lastEditedAt = new Date();

    // Trigger Notification for Manager
    try {
      await Notification.create({
        title: `⚡ Admin Lineup Override: ${team.name}`,
        body: `An admin has modified ${team.name}'s tactical lineup for ${fixture.homeTeam?.name || 'Home'} vs ${fixture.awayTeam?.name || 'Away'}. Please review the updated setup.`,
        type: 'match',
        sentTo: 'all',
        createdBy: req.user._id,
      });
    } catch (err) {
      console.error('Failed to dispatch manager notification:', err);
    }
  } else {
    lineup.setBy = req.user._id;
  }

  await lineup.save();

  // Notify included players when manager submits lineup
  if (!isAdmin) {
    try {
      const allIncludedIds = [
        ...formattedXI.map((item) => String(item.player)),
        ...validSubstitutes.map((id) => String(id)),
      ].filter(Boolean);

      if (allIncludedIds.length > 0) {
        await Notification.create({
          title: `📋 Lineup Announced: ${team.name}`,
          body: `The manager has submitted the tactical lineup for ${fixture.homeTeam?.name || 'Home'} vs ${fixture.awayTeam?.name || 'Away'} on ${new Date(fixture.date).toLocaleDateString()}. Check your match-day status now!`,
          type: 'match',
          sentTo: 'players',
          createdBy: req.user._id,
        });
      }
    } catch (err) {
      console.error('Failed to fire lineup-announced notification:', err);
    }
  }

  const populated = await Lineup.findById(lineup._id)
    .populate('team', 'name logo color')
    .populate('startingXI.player', 'name photoURL jersey position overall rating')
    .populate('substitutes', 'name photoURL jersey position overall rating')
    .populate('notSelected', 'name photoURL jersey position overall rating')
    .populate('setBy', 'name email role')
    .populate('lastEditedBy', 'name email role');

  res.status(201).json(populated);
};

const sendLineupReminder = async (req, res) => {
  const { fixtureId, teamId } = req.body;
  if (!fixtureId || !teamId) {
    res.status(400);
    throw new Error('fixtureId and teamId are required');
  }

  const [fixture, team] = await Promise.all([
    Fixture.findById(fixtureId).populate('homeTeam awayTeam', 'name'),
    Team.findById(teamId),
  ]);

  if (!fixture || !team) {
    res.status(404);
    throw new Error('Fixture or Team not found');
  }

  await Notification.create({
    title: `📋 Lineup Submission Reminder: ${team.name}`,
    body: `Urgent: Tactical lineup for ${team.name} in match ${fixture.homeTeam?.name} vs ${fixture.awayTeam?.name} (${new Date(fixture.date).toLocaleDateString()}) is pending submission. Please log in to submit your starting XI.`,
    type: 'alert',
    sentTo: 'all',
    createdBy: req.user._id,
  });

  res.json({ message: `Reminder notification sent for ${team.name}` });
};

module.exports = { getLineupsByFixture, saveLineup, sendLineupReminder };
