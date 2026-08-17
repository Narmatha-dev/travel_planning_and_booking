const reviewModel = require('../models/reviewModel');

const reviewService = {
  /**
   * Get reviews list along with aggregate ratings and distribution
   */
  async getReviews(options = {}) {
    const { destinationId, packageId, userId, limit = 50, offset = 0 } = options;

    const [reviews, aggregates] = await Promise.all([
      reviewModel.findAll({ destinationId, packageId, userId, limit, offset }),
      reviewModel.calculateAggregates({ destinationId, packageId }),
    ]);

    return {
      reviews,
      aggregates,
    };
  },

  /**
   * Check if user is eligible to write a review
   */
  async checkEligibility(userId, { destinationId, packageId } = {}) {
    if (!userId) {
      return { isEligible: false, reason: 'User not authenticated' };
    }
    return reviewModel.checkUserBookingEligibility(userId, { destinationId, packageId });
  },

  /**
   * Create a new review
   */
  async createReview(reviewData) {
    const {
      userId,
      destinationId,
      packageId,
      rating,
      title,
      comment,
    } = reviewData;

    if (!userId) {
      const error = new Error('User authentication required to submit a review');
      error.statusCode = 401;
      throw error;
    }

    if (!destinationId && !packageId) {
      const error = new Error('Either destinationId or packageId is required to submit a review');
      error.statusCode = 400;
      throw error;
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5 stars');
      error.statusCode = 400;
      throw error;
    }

    if (!title || !title.trim()) {
      const error = new Error('Review title is required');
      error.statusCode = 400;
      throw error;
    }

    if (!comment || comment.trim().length < 5) {
      const error = new Error('Review comment must be at least 5 characters long');
      error.statusCode = 400;
      throw error;
    }

    // Check booking eligibility & verified status
    const eligibility = await reviewModel.checkUserBookingEligibility(userId, { destinationId, packageId });

    const newReview = await reviewModel.createReview({
      ...reviewData,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      bookingId: eligibility.bookingId || null,
      isVerifiedBooking: Boolean(eligibility.isEligible),
    });

    return newReview;
  },

  /**
   * Update an existing review (Author only)
   */
  async updateReview(id, userId, updateData) {
    const existing = await reviewModel.findById(id);
    if (!existing) {
      const error = new Error(`Review #${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Authorization check
    if (existing.user_id !== parseInt(userId, 10)) {
      const error = new Error('Unauthorized: You can only edit your own reviews');
      error.statusCode = 403;
      throw error;
    }

    if (updateData.rating !== undefined) {
      const numRating = parseInt(updateData.rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        const error = new Error('Rating must be an integer between 1 and 5 stars');
        error.statusCode = 400;
        throw error;
      }
      updateData.rating = numRating;
    }

    if (updateData.title !== undefined && !updateData.title.trim()) {
      const error = new Error('Review title cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (updateData.comment !== undefined && updateData.comment.trim().length < 5) {
      const error = new Error('Review comment must be at least 5 characters long');
      error.statusCode = 400;
      throw error;
    }

    return reviewModel.updateReview(id, updateData);
  },

  /**
   * Delete a review (Author only)
   */
  async deleteReview(id, userId) {
    const existing = await reviewModel.findById(id);
    if (!existing) {
      const error = new Error(`Review #${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Authorization check
    if (existing.user_id !== parseInt(userId, 10)) {
      const error = new Error('Unauthorized: You can only delete your own reviews');
      error.statusCode = 403;
      throw error;
    }

    await reviewModel.deleteReview(id);
    return { success: true, message: `Review #${id} deleted successfully` };
  },
};

module.exports = reviewService;
