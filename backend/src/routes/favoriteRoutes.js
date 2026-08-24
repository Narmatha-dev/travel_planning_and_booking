const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public / Protected resolution:
// For GET endpoints, authMiddleware or query fallback is supported.
// For POST / DELETE endpoints, auth is enforced.

router.get('/', authMiddleware, favoriteController.getFavorites);
router.get('/summary', authMiddleware, favoriteController.getSummary);
router.get('/check/:type/:id', authMiddleware, favoriteController.checkFavorite);

router.post('/', authMiddleware, favoriteController.addFavorite);
router.post('/toggle', authMiddleware, favoriteController.toggleFavorite);
router.delete('/:id', authMiddleware, favoriteController.removeFavorite);
router.delete('/', authMiddleware, favoriteController.removeFavorite);

module.exports = router;
