const express = require('express');
const { getAllRatings, getRatingByPlayer, upsertRating } = require('../controllers/ratingController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllRatings);
router.get('/:playerId', getRatingByPlayer);
router.post('/', protect, admin, upsertRating);
router.put('/:playerId', protect, admin, upsertRating);

module.exports = router;
