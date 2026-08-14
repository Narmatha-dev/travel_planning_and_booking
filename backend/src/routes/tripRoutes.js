const express = require('express');
const tripController = require('../controllers/tripController');

const router = express.Router();

// GET /api/trips
router.get('/', tripController.getUserTrips);

// POST /api/trips
router.post('/', tripController.createTrip);

module.exports = router;
