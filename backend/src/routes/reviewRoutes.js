const express = require('express');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// 1. Get reviews list with aggregate scores, filter & sorting (GET /api/reviews)
router.get('/', reviewController.getReviews);

// 2. Check user review eligibility (GET /api/reviews/eligibility)
router.get('/eligibility', reviewController.checkEligibility);

// 3. Get existing review for a booking (GET /api/reviews/booking/:bookingId)
router.get('/booking/:bookingId', reviewController.getReviewByBooking);

// 4. Create review (POST /api/reviews)
router.post('/', reviewController.createReview);

// 5. Update own review (PUT /api/reviews/:id)
router.put('/:id', reviewController.updateReview);

// 6. Delete own review (DELETE /api/reviews/:id)
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
