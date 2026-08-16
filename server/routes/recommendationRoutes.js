const express = require('express');
const router = express.Router();
const { getRecommendations, getMoodRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all recommendation endpoints
router.get('/', getRecommendations);
router.get('/mood', getMoodRecommendations);

module.exports = router;
