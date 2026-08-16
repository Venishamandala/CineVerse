const express = require('express');
const router = express.Router();
const { getUserProfile, updatePreferences, getUserAnalytics } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all user routes

router.get('/profile', getUserProfile);
router.post('/preferences', updatePreferences);
router.get('/analytics', getUserAnalytics);

module.exports = router;
