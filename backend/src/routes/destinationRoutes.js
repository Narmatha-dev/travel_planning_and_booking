const express = require('express');
const destinationController = require('../controllers/destinationController');

const router = express.Router();

// GET /api/destinations
router.get('/', destinationController.getAllDestinations);

// GET /api/destinations/:identifier (supports ID or slug)
router.get('/:identifier', destinationController.getDestination);

module.exports = router;
