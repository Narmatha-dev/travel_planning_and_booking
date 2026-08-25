const express = require('express');
const checklistController = require('../controllers/checklistController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Phase 28: Travel Document & Checklist Manager API Endpoints
 */

// Generate default checklist
router.post('/generate', optionalAuth, checklistController.generateChecklist);

// Get trip checklist with readiness metrics
router.get('/trip/:tripId', optionalAuth, checklistController.getTripChecklist);

// Save complete checklist
router.post('/trip/:tripId', optionalAuth, checklistController.saveTripChecklist);

// Add custom item
router.post('/items', optionalAuth, checklistController.addCustomItem);

// Toggle completed / ready state
router.patch('/items/:id/toggle', optionalAuth, checklistController.toggleCompleted);

// Update item
router.put('/items/:id', optionalAuth, checklistController.updateItem);

// Delete item
router.delete('/items/:id', optionalAuth, checklistController.deleteItem);

module.exports = router;
