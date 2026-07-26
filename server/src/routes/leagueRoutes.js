const express = require('express');
const {
  getLeagues,
  createLeague,
  getStandings,
  finalizeLeaguePhase,
  deleteLeague,
  deleteAllLeagues,
  requestJoinLeague,
  getJoinRequests,
  getMyJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} = require('../controllers/leagueController');
const { protect, admin, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Static paths FIRST (must be before /:id to avoid param collision) ──────
router.get('/', getLeagues);
router.post('/', protect, admin, createLeague);

// Join requests — admin
router.get('/join-requests', protect, admin, getJoinRequests);
router.put('/join-requests/:reqId/approve', protect, admin, approveJoinRequest);
router.put('/join-requests/:reqId/reject', protect, admin, rejectJoinRequest);

// Join requests — manager
router.get('/my-join-requests', protect, requireRole('manager'), getMyJoinRequests);

// Bulk delete
router.delete('/all', protect, admin, deleteAllLeagues);
router.delete('/delete/:id', protect, admin, deleteLeague);

// ── Parameterised /:id paths LAST ───────────────────────────────────────────
router.get('/:id/standings', getStandings);
router.post('/:id/finalize-phase', protect, admin, finalizeLeaguePhase);
router.post('/:id/join-request', protect, requireRole('manager'), requestJoinLeague);
router.delete('/:id', protect, admin, deleteLeague);

module.exports = router;
