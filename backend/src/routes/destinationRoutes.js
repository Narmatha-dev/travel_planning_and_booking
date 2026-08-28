const express = require('express');
const destinationController = require('../controllers/destinationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. List all destinations (with optional filters: category, priceLevel, minRating, isFeatured, sortBy)
router.get('/', destinationController.getAllDestinations);

// 2. Search destinations by keyword query (?q=...)
router.get('/search', destinationController.searchDestinations);

// 3. Get popular & featured destinations
router.get('/popular', destinationController.getPopularDestinations);

// 3a. Get nearby tourist destinations based on GPS coordinates (Phase 2)
router.get('/nearby', destinationController.getNearbyDestinations);
router.get('/nearby/:placeId', destinationController.getNearbyPlaceDetails);

// 3b. Get Pan-India tourist destinations across all 7 regions
router.get('/india', destinationController.getIndiaPlaces);

// 3c. Worldwide Discovery Endpoints
router.get('/countries', destinationController.getCountries);
router.get('/continents', destinationController.getContinents);
router.get('/map-data', destinationController.getMapMarkers);
router.get('/image-lookup', destinationController.lookupImage);

// 4. Add destination to favorites (Protected)
router.post('/:id/favorite', authMiddleware, destinationController.addFavorite);

// 5. Remove destination from favorites (Protected)
router.delete('/:id/favorite', authMiddleware, destinationController.removeFavorite);

// 6. Get single destination by ID or slug (Keep as last route)
router.get('/:identifier', destinationController.getDestinationByIdOrSlug);

module.exports = router;
