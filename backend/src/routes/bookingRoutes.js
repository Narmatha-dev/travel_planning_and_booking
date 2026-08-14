const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// GET /api/bookings
router.get('/', bookingController.getUserBookings);

// GET /api/bookings/:reference
router.get('/:reference', bookingController.getBookingByReference);

// POST /api/bookings
router.post('/', bookingController.createBooking);

module.exports = router;
