const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// 1. User Personal Travel Analytics (Protected: Authenticated Travelers)
router.get('/user', authMiddleware, analyticsController.getUserAnalytics);

// 2. Admin Platform Travel Analytics (Protected: Administrators Only)
router.get('/admin', authMiddleware, adminMiddleware, analyticsController.getAdminAnalytics);

// 3. Admin Analytics CSV Export (Protected: Administrators Only)
router.get('/admin/export', authMiddleware, adminMiddleware, analyticsController.exportAdminAnalytics);

// 4. Admin Predictive Travel Demand Forecast (Phase 22 - Protected: Administrators Only)
router.get('/admin/forecast', authMiddleware, adminMiddleware, analyticsController.getForecast);
router.post('/admin/forecast/train', authMiddleware, adminMiddleware, analyticsController.trainForecastModel);

module.exports = router;
