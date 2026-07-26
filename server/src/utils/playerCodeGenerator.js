const User = require('../models/User');

const generateRandomCode = () => {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // excludes 0, O, 1, I to avoid confusion
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KFC-${year}-${random}`;
};

const generateUniquePlayerCode = async () => {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateRandomCode();
    const existing = await User.findOne({ playerCode: code });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  // Fallback if 10 collisions happen (extremely rare)
  return `KFC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
};

module.exports = { generateUniquePlayerCode };
