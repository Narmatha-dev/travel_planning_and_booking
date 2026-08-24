const express = require('express');
const shareController = require('../controllers/shareController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Public Endpoint: Get Shared Trip by Secure Token (GET /api/share/trip/:token)
router.get('/trip/:token', shareController.getPublicSharedTrip);

// 2. Protected Endpoints (Owner only)
router.post('/trip/:tripId', authMiddleware, shareController.createShareLink);
router.post('/trip/:tripId/regenerate', authMiddleware, shareController.regenerateShareLink);
router.put('/trip/:tripId/revoke', authMiddleware, shareController.revokeShareLink);
router.get('/trip/:tripId/status', authMiddleware, shareController.getShareStatus);

module.exports = router;
