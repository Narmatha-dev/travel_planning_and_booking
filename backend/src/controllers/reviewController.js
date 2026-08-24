const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const reviewController = {
  /**
   * GET /api/reviews
   * Retrieve reviews with aggregate scores, rating filters, and sorting
   */
  getReviews: asyncHandler(async (req, res) => {
    const { destinationId, packageId, bookingId, userId, rating, sortBy, limit, offset } = req.query;

    const data = await reviewService.getReviews({
      destinationId: destinationId ? parseInt(destinationId, 10) : undefined,
      packageId: packageId ? parseInt(packageId, 10) : undefined,
      bookingId: bookingId ? parseInt(bookingId, 10) : undefined,
      userId: userId ? parseInt(userId, 10) : undefined,
      rating: rating ? parseInt(rating, 10) : undefined,
      sortBy,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, 'Reviews and ratings retrieved successfully', data);
  }),

  /**
   * GET /api/reviews/booking/:bookingId
   * Retrieve existing review for a specific booking
   */
  getReviewByBooking: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user?.id || req.query.userId || 3;

    const review = await reviewService.getReviewByBookingId(bookingId, userId);
    return successResponse(res, 'Booking review retrieved', { review });
  }),

  /**
   * GET /api/reviews/eligibility
   * Check if a user is eligible to review
   */
  checkEligibility: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { destinationId, packageId, bookingId } = req.query;

    const eligibility = await reviewService.checkEligibility(userId, {
      destinationId: destinationId ? parseInt(destinationId, 10) : undefined,
      packageId: packageId ? parseInt(packageId, 10) : undefined,
      bookingId: bookingId ? parseInt(bookingId, 10) : undefined,
    });

    return successResponse(res, 'Review eligibility checked', eligibility);
  }),

  /**
   * POST /api/reviews
   * Submit a new rating and review
   */
  createReview: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const review = await reviewService.createReview({
      ...req.body,
      userId,
    });

    return successResponse(res, 'Review submitted successfully', review, 201);
  }),

  /**
   * PUT /api/reviews/:id
   * Update an existing review (Author only)
   */
  updateReview: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId || 3;

    const updated = await reviewService.updateReview(id, userId, req.body);
    return successResponse(res, 'Review updated successfully', updated);
  }),

  /**
   * DELETE /api/reviews/:id
   * Delete an existing review (Author only)
   */
  deleteReview: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId || req.query?.userId || 3;

    const result = await reviewService.deleteReview(id, userId);
    return successResponse(res, 'Review deleted successfully', result);
  }),
};

module.exports = reviewController;
