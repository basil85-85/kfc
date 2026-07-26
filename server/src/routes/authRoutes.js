const express = require('express');
const { register, registerManager, login, getMe, verifyEmail, resendVerificationCode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/register-team', registerManager);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);
router.get('/me', protect, getMe);

module.exports = router;

