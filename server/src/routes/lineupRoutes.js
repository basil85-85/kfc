const express = require('express');
const { getLineupsByFixture, saveLineup, sendLineupReminder } = require('../controllers/lineupController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:fixtureId', getLineupsByFixture);
router.post('/', protect, requireRole('manager', 'admin'), saveLineup);
router.post('/reminder', protect, requireRole('admin'), sendLineupReminder);

module.exports = router;

