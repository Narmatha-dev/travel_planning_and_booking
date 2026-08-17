import api from './api';

const paymentService = {
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
