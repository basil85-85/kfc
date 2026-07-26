const Rating = require('../models/Rating');
const User = require('../models/User');

const getAllRatings = async (req, res) => {
  const ratings = await Rating.find()
    .populate({
      path: 'player',
      select: 'name position jersey photoURL team',
      populate: { path: 'team', select: 'name' },
    })
    .sort({ overall: -1 });
  res.json(ratings);
};

const getRatingByPlayer = async (req, res) => {
  const rating = await Rating.findOne({ player: req.params.playerId }).populate({
    path: 'player',
    select: 'name position jersey photoURL team',
    populate: { path: 'team', select: 'name' },
  });
  if (!rating) {
    res.status(404);
    throw new Error('Rating not found');
  }
  res.json(rating);
};

const upsertRating = async (req, res) => {
  const { pace, shooting, passing, dribbling, defending, physical, player: bodyPlayerId } = req.body;
  const playerId = req.params.playerId || bodyPlayerId;

  if (!playerId) {
    res.status(400);
    throw new Error('Player ID is required');
  }

  const player = await User.findById(playerId);
  if (!player) {
    res.status(404);
    throw new Error('Player not found');
  }

  let rating = await Rating.findOne({ player: player._id });
  if (!rating) {
    rating = new Rating({
      player: player._id,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      updatedBy: req.user?._id,
    });
  } else {
    rating.pace = pace;
    rating.shooting = shooting;
    rating.passing = passing;
    rating.dribbling = dribbling;
    rating.defending = defending;
    rating.physical = physical;
    rating.updatedBy = req.user?._id;
  }

  await rating.save();
  res.json(rating);
};

module.exports = { getAllRatings, getRatingByPlayer, upsertRating };
