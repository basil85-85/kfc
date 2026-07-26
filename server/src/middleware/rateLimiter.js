const rateLimit = require('express-rate-limit');

/**
 * Limit fixture result submission to 20 requests per 15 minutes per IP.
 * Prevents spam-updating match scores.
 */
const resultSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many result submissions. Please try again in 15 minutes.' },
});

/**
 * Limit team registration to 5 requests per hour per IP.
 * Prevents spam registration of duplicate teams.
 */
const teamRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many team registration attempts. Please try again in an hour.' },
});

module.exports = { resultSubmitLimiter, teamRegisterLimiter };
