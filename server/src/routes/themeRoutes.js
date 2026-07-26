const express = require('express');
const { getTheme, updateTheme } = require('../controllers/themeController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getTheme);
router.put('/', protect, admin, updateTheme);

module.exports = router;
