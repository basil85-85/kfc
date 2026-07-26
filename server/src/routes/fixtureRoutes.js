const express = require('express');
const {
  getFixtures,
  createFixture,
  generateFixtures,
  updateFixture,
  updateResult,
  deleteFixture,
  deleteAllFixtures,
  advanceToKnockout,
} = require('../controllers/fixtureController');
const { protect, admin } = require('../middleware/authMiddleware');
const { resultSubmitLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/',                         getFixtures);
router.post('/',    protect, admin,     createFixture);
router.post('/generate', protect, admin, generateFixtures);
router.post('/advance-knockout', protect, admin, advanceToKnockout);
router.delete('/delete-all/:leagueId?', protect, admin, deleteAllFixtures);
router.delete('/delete-all', protect, admin, deleteAllFixtures);
router.put('/:id', protect, updateFixture);
router.put('/:id/result', protect, admin, resultSubmitLimiter, updateResult);
router.delete('/:id', protect, admin, deleteFixture);

module.exports = router;
