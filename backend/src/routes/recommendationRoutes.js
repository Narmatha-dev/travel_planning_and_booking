const express = require('express');
const jwt = require('jsonwebtoken');
const recommendationController = require('../controllers/recommendationController');
const config = require('../config/environment');

const router = express.Router();

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch {}
  }
  next();
}

// 1. Compute AI-personalized recommendations based on custom criteria (POST /api/recommendations)
router.post('/', optionalAuth, recommendationController.getRecommendations);

// 2. Retrieve personalized travel recommendation feed (GET /api/recommendations/personalized)
router.get('/personalized', optionalAuth, recommendationController.getPersonalizedFeed);

// 3. Retrieve nearby recommendations based on GPS coordinates (GET /api/recommendations/nearby)
router.get('/nearby', optionalAuth, recommendationController.getNearbyRecommendations);

// 4. Retrieve and update user travel preferences / interests (GET & PUT /api/recommendations/preferences)
router.get('/preferences', optionalAuth, recommendationController.getUserPreferences);
router.put('/preferences', optionalAuth, recommendationController.saveUserPreferences);

// 5. Submit recommendation feedback (POST /api/recommendations/feedback)
router.post('/feedback', optionalAuth, recommendationController.submitFeedback);

// 6. Inspect ML recommendation model status & evaluation metrics (GET /api/recommendations/ml-status)
router.get('/ml-status', optionalAuth, recommendationController.getMlStatus);

module.exports = router;



