const express = require('express');
const recommendationController = require('../controllers/recommendationController');

const router = express.Router();

// 1. Compute AI-personalized recommendations based on custom criteria (POST /api/recommendations)
router.post('/', recommendationController.getRecommendations);

// 2. Retrieve personalized travel recommendation feed (GET /api/recommendations/personalized)
router.get('/personalized', recommendationController.getPersonalizedFeed);

module.exports = router;
