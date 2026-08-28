import api from './api';

const paymentService = {
  /**
   * Dynamically load the official Razorpay Checkout SDK into DOM
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Could not load Razorpay Checkout script over network.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  /**
   * Get public payment gateway configuration
   */
  async getGatewayConfig() {
    const response = await api.get('/payments/config');
    return response.data.data;
  },

  /**
   * Create a server-side payment order
   */
  async createPaymentOrder(bookingId, paymentMethod = 'razorpay') {
    const response = await api.post('/payments/create-order', {
      bookingId,
      paymentMethod,
    });
    return response.data.data;
  },

  /**
   * Verify Razorpay payment transaction server-side
   */
  async verifyPayment(verificationData) {
    const response = await api.post('/payments/verify', verificationData);
    return response.data.data;
  },

  /**
   * Retrieve digital booking & payment receipt
   */
  async getReceipt(identifier) {
    const response = await api.get(`/payments/receipt/${identifier}`);
    return response.data.data;
  },

  /**
   * Process / charge a payment (Fallback)
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
