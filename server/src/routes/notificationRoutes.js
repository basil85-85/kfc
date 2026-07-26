const express = require('express');
const {
  getNotifications,
  pushNotification,
  markRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, admin, pushNotification);
router.patch('/:id/read', protect, markRead);
router.delete('/delete-all', protect, admin, deleteAllNotifications);
router.delete('/all', protect, admin, deleteAllNotifications);
router.delete('/:id', protect, admin, deleteNotification);

module.exports = router;
