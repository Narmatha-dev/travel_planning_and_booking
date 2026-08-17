const express = require('express');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// 1. Get reviews list with aggregate scores (GET /api/reviews)
router.get('/', reviewController.getReviews);

// 2. Check user review eligibility (GET /api/reviews/eligibility)
router.get('/eligibility', reviewController.checkEligibility);

// 3. Create review (POST /api/reviews)
router.post('/', reviewController.createReview);

// 4. Update own review (PUT /api/reviews/:id)
router.put('/:id', reviewController.updateReview);

// 5. Delete own review (DELETE /api/reviews/:id)
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
