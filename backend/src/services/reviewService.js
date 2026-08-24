const reviewModel = require('../models/reviewModel');
const notificationService = require('./notificationService');

const reviewService = {
  /**
   * Get reviews list along with aggregate ratings and distribution
   */
  async getReviews(options = {}) {
    const { destinationId, packageId, bookingId, userId, rating, sortBy = 'recent', limit = 50, offset = 0 } = options;

    const [reviews, aggregates] = await Promise.all([
      reviewModel.findAll({ destinationId, packageId, bookingId, userId, rating, sortBy, limit, offset }),
      reviewModel.calculateAggregates({ destinationId, packageId }),
    ]);

    return {
      reviews,
      aggregates,
    };
  },

  /**
   * Get single review for a specific booking
   */
  async getReviewByBookingId(bookingId, userId) {
    if (!bookingId || !userId) {
      return null;
    }
    return reviewModel.findByBookingId(bookingId, userId);
  },

  /**
   * Check if user is eligible to write a review
   */
  async checkEligibility(userId, { destinationId, packageId, bookingId } = {}) {
    if (!userId) {
      return { isEligible: false, reason: 'User not authenticated' };
    }
    return reviewModel.checkUserBookingEligibility(userId, { destinationId, packageId, bookingId });
  },

  /**
   * Create a new review
   */
  async createReview(reviewData) {
    const {
      userId,
      destinationId,
      packageId,
      bookingId,
      rating,
      title,
      comment,
      categoryRatings,
    } = reviewData;

    if (!userId) {
      const error = new Error('User authentication required to submit a review');
      error.statusCode = 401;
      throw error;
    }

    if (!destinationId && !packageId && !bookingId) {
      const error = new Error('Either destinationId, packageId, or bookingId is required to submit a review');
      error.statusCode = 400;
      throw error;
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      const error = new Error('Overall rating must be an integer between 1 and 5 stars');
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

    if (comment.trim().length > 1000) {
      const error = new Error('Review comment cannot exceed 1000 characters');
      error.statusCode = 400;
      throw error;
    }

    // Feature 6: One Review Per Trip Duplicate Prevention
    if (bookingId) {
      const existing = await reviewModel.findByBookingId(bookingId, userId);
      if (existing) {
        const error = new Error('You have already reviewed this trip. Please edit your existing review.');
        error.statusCode = 409;
        error.existingReviewId = existing.id;
        throw error;
      }
    }

    // Check booking eligibility & verified status
    const eligibility = await reviewModel.checkUserBookingEligibility(userId, { destinationId, packageId, bookingId });

    const newReview = await reviewModel.createReview({
      ...reviewData,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      categoryRatings: categoryRatings || null,
      bookingId: bookingId || eligibility.bookingId || null,
      isVerifiedBooking: Boolean(eligibility.isEligible),
    });

    // Feature 18: Phase 10 In-App Notification Hook
    try {
      await notificationService.createSystemNotification({
        userId,
        title: '⭐ Review Submitted',
        message: `Thank you for reviewing your journey! Your feedback helps fellow travelers.`,
        type: 'system',
        linkUrl: '/my-trips?tab=completed',
        preventDuplicate: false,
      });
    } catch {}

    // Feature 6: Phase 16 Verified Review Reward (+25 pts)
    try {
      const rewardService = require('./rewardService');
      await rewardService.awardPoints(
        userId,
        'review_submitted',
        `review_${newReview.id}`,
        25,
        `Submitted review for ${newReview.title || 'travel experience'}`
      );
    } catch (err) {
      console.warn('Review reward trigger failed:', err.message);
    }

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

    if (updateData.comment !== undefined) {
      if (updateData.comment.trim().length < 5) {
        const error = new Error('Review comment must be at least 5 characters long');
        error.statusCode = 400;
        throw error;
      }
      if (updateData.comment.trim().length > 1000) {
        const error = new Error('Review comment cannot exceed 1000 characters');
        error.statusCode = 400;
        throw error;
      }
      updateData.comment = updateData.comment.trim();
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
