const express = require('express');
const copilotController = require('../controllers/copilotController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Phase 30: AI Travel Copilot API Endpoints
 */

// Retrieve unified 12-facet trip summary & readiness matrix
router.get('/summary/:tripId', optionalAuth, copilotController.getSummary);

// Conversational natural language & voice processor
router.post('/query', optionalAuth, copilotController.processQuery);

module.exports = router;
