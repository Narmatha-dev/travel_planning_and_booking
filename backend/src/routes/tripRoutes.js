const express = require('express');
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Generate Day-Wise Itinerary Preview (No auth required to preview)
router.post('/generate-preview', tripController.generatePreview);
router.post('/generate-ai-itinerary', tripController.generatePreview);

// 2. Create Trip & Save Day-Wise Itinerary (Protected)
router.post('/', authMiddleware, tripController.createTrip);

// 3. Get All User Trips (Protected)
router.get('/', authMiddleware, tripController.getUserTrips);

// 4. Get Single Trip with Full Day-by-Day Itinerary (Protected)
router.get('/:id', authMiddleware, tripController.getTripById);

// 5. Update Trip & Itinerary (Protected)
router.put('/:id', authMiddleware, tripController.updateTrip);

// 6. Delete Trip & Cascading Itinerary Items (Protected)
router.delete('/:id', authMiddleware, tripController.deleteTrip);

module.exports = router;
