const express = require('express');
const router = express.Router();
const { askKickBot } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Optional auth middleware so KickBot works for both guests and logged-in users
router.post('/ask', optionalAuth || ((req, res, next) => next()), askKickBot);

module.exports = router;
