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

// 4. Add destination to favorites (Protected)
router.post('/:id/favorite', authMiddleware, destinationController.addFavorite);

// 5. Remove destination from favorites (Protected)
router.delete('/:id/favorite', authMiddleware, destinationController.removeFavorite);

// 6. Get single destination by ID or slug (Keep as last route)
router.get('/:identifier', destinationController.getDestinationByIdOrSlug);

module.exports = router;
