import api from './api';

const reviewService = {
  /**
   * Get reviews and rating aggregates for a destination, package, or booking
   */
  async getReviews(params = {}) {
    const response = await api.get('/reviews', { params });
    return response.data.data;
  },

  /**
   * Get existing review for a specific booking
   */
  async getReviewByBooking(bookingId) {
    const response = await api.get(`/reviews/booking/${bookingId}`);
    return response.data.data?.review || null;
  },

  /**
   * Check if user is eligible to write a review
   */
  async checkEligibility(params = {}) {
    const response = await api.get('/reviews/eligibility', { params });
    return response.data.data;
  },

  /**
   * Submit a new review & rating
   */
  async createReview(reviewData) {
    const response = await api.post('/reviews', reviewData);
    return response.data.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(id, reviewData) {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data.data;
  },

  /**
   * Delete an existing review
   */
  async deleteReview(id, userId = 3) {
    const response = await api.delete(`/reviews/${id}`, {
      data: { userId },
    });
    return response.data.data;
  },
};

export default reviewService;
