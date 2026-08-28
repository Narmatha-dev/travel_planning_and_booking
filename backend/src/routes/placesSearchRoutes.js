const express = require('express');
const placesSearchController = require('../controllers/placesSearchController');

const router = express.Router();

// GET /api/places/search?q=Eiffel+Tower&lat=...&lng=...
router.get('/search', placesSearchController.searchPlaces);

// GET /api/places/autocomplete?input=taj
router.get('/autocomplete', placesSearchController.getAutocomplete);

// GET /api/places/details/:placeId
router.get('/details/:placeId', placesSearchController.getPlaceDetails);

module.exports = router;
