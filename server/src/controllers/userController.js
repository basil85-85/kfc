const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Rating = require('../models/Rating');
const { parseHighlightVideo } = require('../utils/videoHelper');

const getPlayers = async (req, res) => {
  try {
    const { page, limit, search, position, team, tier, all } = req.query;

    const query = { role: 'player' };
    if (!req.user || req.user.role !== 'admin') {
      query.active = true;
    }

    // Search filter (case-insensitive on name, email, playerCode, or jersey number)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [{ name: searchRegex }, { email: searchRegex }, { playerCode: searchRegex }];
      const jerseyNum = parseInt(search.trim(), 10);
      if (!isNaN(jerseyNum)) {
        searchConditions.push({ jersey: jerseyNum });
      }
      query.$or = searchConditions;
    }


    // Position filter
    if (position && position !== 'All') {
      query.position = position;
    }

    // Team filter
    if (team && team !== 'All') {
      query.team = team;
    }

    // Tier filter (derived from Rating.overall: Iconic >= 85, Gold 70-84, Platinum 50-69, Bronze < 50)
    if (tier && tier !== 'All') {
      if (tier === 'Iconic') {
        const matching = await Rating.find({ overall: { $gte: 85 } }).select('player').lean();
        query._id = { $in: matching.map((r) => r.player) };
      } else if (tier === 'Gold') {
        const matching = await Rating.find({ overall: { $gte: 70, $lt: 85 } }).select('player').lean();
        query._id = { $in: matching.map((r) => r.player) };
      } else if (tier === 'Platinum') {
        const matching = await Rating.find({ overall: { $gte: 50, $lt: 70 } }).select('player').lean();
        query._id = { $in: matching.map((r) => r.player) };
      } else if (tier === 'Bronze') {
        const higherRated = await Rating.find({ overall: { $gte: 50 } }).select('player').lean();
        const excludeIds = higherRated.map((r) => String(r.player));
        query._id = { $nin: excludeIds };
      }
    }

    // Return flat array if all=true is passed (e.g. for dropdowns)
    if (all === 'true') {
      const players = await User.find(query)
        .select('-password')
        .populate('team', 'name logo color status')
        .sort({ name: 1 });
      return res.json(players);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    const players = await User.find(query)
      .select('-password')
      .populate('team', 'name logo color status')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      players,
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || 'Failed to fetch players');
  }
};

const updateMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { name, phone, position, jersey, photoURL, password, team, highlightVideoUrl, aboutMe, smsNotificationsEnabled } = req.body;

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (position) user.position = position;
  if (jersey !== undefined) user.jersey = jersey;
  if (photoURL !== undefined) user.photoURL = photoURL;
  if (typeof team !== 'undefined') user.team = team || undefined;
  if (typeof smsNotificationsEnabled === 'boolean') user.smsNotificationsEnabled = smsNotificationsEnabled;
  if (password) user.password = await bcrypt.hash(password, 10);

  if (typeof highlightVideoUrl !== 'undefined') {
    if (highlightVideoUrl.trim() === '') {
      user.highlightVideoUrl = '';
      user.highlightVideoEmbed = '';
    } else {
      const videoData = parseHighlightVideo(highlightVideoUrl);
      user.highlightVideoUrl = videoData.raw;
      user.highlightVideoEmbed = videoData.embed;
    }
  }

  if (typeof aboutMe !== 'undefined') {
    if (aboutMe.length > 300) {
      res.status(400);
      throw new Error('About Me bio cannot exceed 300 characters');
    }
    user.aboutMe = aboutMe.trim();
  }

  await user.save();
  const updated = await User.findById(user._id).select('-password').populate('team', 'name logo color status managerEmail');
  res.json(updated);
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Player not found');
  }
  const { name, phone, position, jersey, photoURL, role, active, team, highlightVideoUrl, aboutMe } = req.body;

  const oldTeam = user.team;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (position) user.position = position;
  if (jersey !== undefined) user.jersey = jersey;
  if (photoURL !== undefined) user.photoURL = photoURL;
  if (role) user.role = role;
  if (typeof active === 'boolean') user.active = active;
  if (typeof team !== 'undefined') user.team = team || undefined;

  if (typeof highlightVideoUrl !== 'undefined') {
    if (highlightVideoUrl.trim() === '') {
      user.highlightVideoUrl = '';
      user.highlightVideoEmbed = '';
    } else {
      const videoData = parseHighlightVideo(highlightVideoUrl);
      user.highlightVideoUrl = videoData.raw;
      user.highlightVideoEmbed = videoData.embed;
    }
  }

  if (typeof aboutMe !== 'undefined') {
    if (aboutMe.length > 300) {
      res.status(400);
      throw new Error('About Me bio cannot exceed 300 characters');
    }
    user.aboutMe = aboutMe.trim();
  }

  await user.save();

  // Sync team chat room membership if team changed or active state changed
  const { addUserToTeamRoom, removeUserFromTeamRoom } = require('../utils/chatRoomUtils');
  if (String(oldTeam) !== String(user.team)) {
    if (oldTeam) await removeUserFromTeamRoom(user._id, oldTeam);
    if (user.team && user.active) await addUserToTeamRoom(user._id, user.team);
  } else if (!user.active && oldTeam) {
    await removeUserFromTeamRoom(user._id, oldTeam);
  }

  const updated = await User.findById(user._id).select('-password').populate('team', 'name logo color status');
  res.json(updated);
};

const deactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Player not found');
  }
  user.active = false;
  await user.save();
  if (user.team) {
    const { removeUserFromTeamRoom } = require('../utils/chatRoomUtils');
    await removeUserFromTeamRoom(user._id, user.team);
  }
  res.json({ message: 'Player deactivated' });
};

module.exports = { getPlayers, updateMe, updateUser, deactivateUser };
