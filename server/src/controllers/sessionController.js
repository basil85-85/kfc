const Session = require('../models/Session');

const getSessions = async (req, res) => {
  const sessions = await Session.find().populate('createdBy', 'name email');
  res.json(sessions);
};

const createSession = async (req, res) => {
  const { name, date, venue, fee, maxPlayers, type } = req.body;
  const session = await Session.create({
    name,
    date,
    venue,
    fee,
    maxPlayers,
    type,
    createdBy: req.user._id,
  });
  res.status(201).json(session);
};

const registerSession = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  const alreadyRegistered = session.registrations.some((id) => id.equals(req.user._id));
  if (alreadyRegistered) {
    res.status(400);
    throw new Error('Already registered');
  }
  if (session.maxPlayers && session.registrations.length >= session.maxPlayers) {
    res.status(400);
    throw new Error('Session is full');
  }
  session.registrations.push(req.user._id);
  await session.save();
  res.json(session);
};

const markAttendance = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  const { playerId, attended } = req.body;
  if (!playerId) {
    res.status(400);
    throw new Error('playerId required');
  }
  const present = session.attended.some((id) => id.equals(playerId));
  if (attended && !present) {
    session.attended.push(playerId);
  } else if (!attended && present) {
    session.attended = session.attended.filter((id) => !id.equals(playerId));
  }
  await session.save();
  res.json(session);
};

const updateSession = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  const { name, date, venue, fee, maxPlayers, type } = req.body;
  if (name) session.name = name;
  if (date) session.date = new Date(date);
  if (venue) session.venue = venue;
  if (fee !== undefined) session.fee = fee;
  if (maxPlayers !== undefined) session.maxPlayers = maxPlayers;
  if (type) session.type = type;

  await session.save();
  res.json(session);
};

const deleteSession = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  await session.deleteOne();
  res.json({ message: 'Session deleted successfully' });
};

module.exports = { getSessions, createSession, registerSession, markAttendance, updateSession, deleteSession };
