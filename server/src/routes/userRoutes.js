const express = require('express');
const { getPlayers, updateMe, updateUser, deactivateUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getPlayers);
router.put('/me', protect, updateMe);
router.put('/:id', protect, admin, updateUser);
router.patch('/:id/deactivate', protect, admin, deactivateUser);

module.exports = router;
