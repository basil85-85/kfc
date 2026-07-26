const express = require('express');
const {
  getTeams,
  getTeamById,
  registerTeam,
  getMyTeam,
  getPendingTeams,
  approveTeam,
  rejectTeam,
  assignLeagueToUnassignedTeams,
  createTeam,
  updateTeam,
  getTeamRoster,
  deleteTeam,
} = require('../controllers/teamController');
const { protect, admin, requireRole } = require('../middleware/authMiddleware');
const { teamRegisterLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', getTeams);
router.post('/register', protect, requireRole('manager'), teamRegisterLimiter, registerTeam);
router.get('/my-team', protect, requireRole('manager'), getMyTeam);
router.get('/pending-requests', protect, admin, getPendingTeams);
router.patch('/:id/approve', protect, admin, approveTeam);
router.patch('/:id/reject', protect, admin, rejectTeam);
router.post('/assign-league', protect, admin, assignLeagueToUnassignedTeams);

router.get('/:id', getTeamById);
router.get('/:id/roster', getTeamRoster);
router.post('/', protect, admin, createTeam);
router.put('/:id', protect, admin, updateTeam);
router.delete('/:id', protect, admin, deleteTeam);

module.exports = router;
