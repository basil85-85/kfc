const express = require('express');
const router = express.Router();
const { protect, admin, requireRole } = require('../middleware/authMiddleware');
const {
  getRooms,
  getRoomMessages,
  createCustomRoom,
  updateRoomMembers,
  deleteMessage,
  getUnreadTotal,
  markRoomAsRead,
  getEligibleMembers,
  getOrCreateDirectRoom,
  getEligibleDmMembers,
} = require('../controllers/chatController');

router.use(protect);

router.get('/rooms', getRooms);
router.get('/rooms/unread-total', getUnreadTotal);
router.get('/eligible-members', requireRole('admin', 'manager'), getEligibleMembers);
router.get('/eligible-dms', getEligibleDmMembers);

router.post('/direct', getOrCreateDirectRoom);

router.get('/rooms/:id/messages', getRoomMessages);
router.post('/rooms/:id/read', markRoomAsRead);

router.post('/rooms', requireRole('admin', 'manager'), createCustomRoom);
router.put('/rooms/:id/members', requireRole('admin', 'manager'), updateRoomMembers);

router.delete('/messages/:id', admin, deleteMessage);

module.exports = router;
