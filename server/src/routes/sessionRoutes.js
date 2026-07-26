const express = require('express');
const {
  getSessions,
  createSession,
  registerSession,
  markAttendance,
  updateSession,
  deleteSession,
} = require('../controllers/sessionController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getSessions);
router.post('/', protect, admin, createSession);
router.put('/:id', protect, admin, updateSession);
router.delete('/:id', protect, admin, deleteSession);
router.post('/:id/register', protect, registerSession);
router.patch('/:id/attend', protect, admin, markAttendance);

module.exports = router;
