const express = require('express');
const locationController = require('../controllers/locationController');

const router = express.Router();

// GET /api/location/reverse-geocode?lat=13.0827&lng=80.2707
router.get('/reverse-geocode', locationController.reverseGeocode);

// GET /api/location/route?originLat=...&originLng=...&destLat=...&destLng=...&mode=driving
router.get('/route', locationController.getRouteDirections);

// GET /api/location/map-config
router.get('/map-config', locationController.getMapConfig);

module.exports = router;
