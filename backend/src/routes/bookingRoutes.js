const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// 1. List user bookings / booking history (GET /api/bookings)
router.get('/', bookingController.getUserBookings);

// 2. Create new booking reservation (POST /api/bookings)
router.post('/', bookingController.createBooking);

// 3. Cancel booking (PATCH /api/bookings/:id/cancel)
router.patch('/:id/cancel', bookingController.cancelBooking);

// 4. Update booking status (PATCH /api/bookings/:id/status)
router.patch('/:id/status', bookingController.updateBookingStatus);

// 5. Get single booking details by ID or reference (GET /api/bookings/:identifier)
router.get('/:identifier', bookingController.getBookingByIdOrReference);

module.exports = router;
