import api from './api';

const paymentService = {
  /**
   * Get public payment gateway configuration
   */
  async getGatewayConfig() {
    const response = await api.get('/payments/config');
    return response.data.data;
  },

  /**
   * Feature 4: Create a server-side payment order / session
   */
  async createPaymentOrder(bookingId, paymentMethod = 'upi') {
    const response = await api.post('/payments/create-order', {
      bookingId,
      paymentMethod,
    });
    return response.data.data;
  },

  /**
   * Feature 5: Verify payment transaction server-side
   */
  async verifyPayment(verificationData) {
    const response = await api.post('/payments/verify', verificationData);
    return response.data.data;
  },

  /**
   * Feature 9 & 10: Retrieve digital booking & payment receipt
   */
  async getReceipt(identifier) {
    const response = await api.get(`/payments/receipt/${identifier}`);
    return response.data.data;
  },

  /**
   * Process / charge a payment (Mock Simulation)
   */
  async processPayment(paymentData) {
    const response = await api.post('/payments/process', paymentData);
    return response.data.data;
  },

  /**
   * Get payment details and status by Transaction ID or Numeric ID
   */
  async getPaymentStatus(transactionIdOrId) {
    const response = await api.get(`/payments/${transactionIdOrId}`);
    return response.data.data;
  },

  /**
   * Get payment transaction history for a user
   */
  async getPaymentHistory(userId = 3, params = {}) {
    const response = await api.get('/payments/history', {
      params: { userId, ...params },
    });
    return response.data.data;
  },

  /**
   * Process refund for a transaction
   */
  async refundPayment(paymentId, reason) {
    const response = await api.post(`/payments/${paymentId}/refund`, { reason });
    return response.data.data;
  },
};

export default paymentService;
