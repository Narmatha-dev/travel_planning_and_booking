const express = require('express');
const transportController = require('../controllers/transportController');

const router = express.Router();

// GET /api/transport/options?originLat=...&originLng=...&destLat=...&destLng=...&preference=cheapest
router.get('/options', transportController.getTransportOptions);

module.exports = router;
