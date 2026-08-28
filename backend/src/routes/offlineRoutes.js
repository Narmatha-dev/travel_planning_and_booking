const express = require('express');
const offlineController = require('../controllers/offlineController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Phase 29: Offline Trip Mode API Endpoints
 */

// Download complete offline trip bundle for IndexedDB caching
router.get('/trip/:tripId/bundle', optionalAuth, offlineController.getOfflineBundle);

// Sync queued offline changes upon reconnection
router.post('/trip/:tripId/sync', optionalAuth, offlineController.syncOfflineChanges);

module.exports = router;
