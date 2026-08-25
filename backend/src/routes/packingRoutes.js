const express = require('express');
const packingController = require('../controllers/packingController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Phase 27: Smart Packing Assistant API Endpoints
 */

// Generate checklist for any trip parameters
router.post('/generate', optionalAuth, packingController.generateChecklist);

// Get trip packing checklist
router.get('/trip/:tripId', optionalAuth, packingController.getTripPacking);

// Save complete checklist to a trip
router.post('/trip/:tripId', optionalAuth, packingController.saveTripPacking);

// Add custom packing item
router.post('/items', optionalAuth, packingController.addCustomItem);

// Toggle packed status
router.patch('/items/:id/toggle', optionalAuth, packingController.togglePacked);

// Update item
router.put('/items/:id', optionalAuth, packingController.updateItem);

// Delete item
router.delete('/items/:id', optionalAuth, packingController.deleteItem);

module.exports = router;
