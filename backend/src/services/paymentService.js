const paymentModel = require('../models/paymentModel');
const bookingModel = require('../models/bookingModel');

const paymentService = {
  /**
   * Process and authorize a payment transaction (Safe Mock Simulation)
   */
  async processPayment(paymentData) {
    const {
      bookingId,
      userId,
      amount,
      currency = 'USD',
      paymentMethod = 'credit_card',
      paymentGateway = 'Stripe',
      simulateFailure = false,
      cardBrand = 'Visa',
      cardLast4 = '4242',
      destinationName,
      packageTitle,
    } = paymentData;

    if (!bookingId || !userId || !amount) {
      const error = new Error('Missing required payment parameters: bookingId, userId, and amount are required');
      error.statusCode = 400;
      throw error;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const error = new Error('Invalid payment amount. Amount must be greater than zero');
      error.statusCode = 400;
      throw error;
    }

    // Verify associated booking exists
    const booking = await bookingModel.findByIdOrReference(bookingId);
    if (!booking) {
      const error = new Error(`Booking #${bookingId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Generate unique transaction ID: TXN-{GATEWAY}-{TIMESTAMP_RANDOM}
    const gatewayPrefix = paymentGateway.toUpperCase().slice(0, 5);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `TXN-${gatewayPrefix}-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(0, 3)}`;

    // 1. Handle Simulated Payment Failure
    if (simulateFailure === true || cardLast4 === '0000' || cardLast4 === '9999') {
      const failedResponse = {
        status: 'declined',
        decline_code: 'insufficient_funds_or_simulated_decline',
        message: 'Your payment was declined by the issuer. Please try a different card.',
        card_brand: cardBrand,
        last4: cardLast4,
      };

      const failedPayment = await paymentModel.createPayment({
        bookingId: booking.id,
        userId: parseInt(userId, 10),
        transactionId,
        paymentMethod,
        paymentStatus: 'failed',
        amount: numAmount,
        currency,
        paymentGateway,
        gatewayResponse: failedResponse,
        paidAt: null,
        bookingReference: booking.booking_reference,
        packageTitle: booking.package_title || packageTitle,
        destinationName: booking.destination_name || destinationName,
      });

      const failureError = new Error('Payment authorization failed: The card was declined by the payment gateway (Simulated Failure)');
      failureError.statusCode = 402;
      failureError.details = {
        paymentStatus: 'failed',
        transactionId,
        bookingReference: booking.booking_reference,
        reason: 'Simulated issuer decline or insufficient funds',
      };
      throw failureError;
    }

    // 2. Handle Payment Success
    const successResponse = {
      status: 'succeeded',
      card_brand: cardBrand,
      last4: cardLast4.replace(/\D/g, '').slice(-4) || '4242',
      authorized_at: new Date().toISOString(),
    };

    const payment = await paymentModel.createPayment({
      bookingId: booking.id,
      userId: parseInt(userId, 10),
      transactionId,
      paymentMethod,
      paymentStatus: 'completed',
      amount: numAmount,
      currency,
      paymentGateway,
      gatewayResponse: successResponse,
      paidAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      bookingReference: booking.booking_reference,
      packageTitle: booking.package_title || packageTitle,
      destinationName: booking.destination_name || destinationName,
    });

    // Update booking status to 'confirmed' upon successful payment
    await bookingModel.updateStatus(booking.id, 'confirmed');

    return {
      payment,
      bookingReference: booking.booking_reference,
      transactionId: payment.transaction_id,
      status: 'completed',
      amount: payment.amount,
      currency: payment.currency,
      message: 'Payment authorized and processed successfully. Booking confirmed.',
    };
  },

  /**
   * Get payment status and details by transaction ID or ID
   */
  async getPaymentStatus(transactionIdOrId) {
    if (!transactionIdOrId) {
      const error = new Error('Transaction ID or Payment ID is required');
      error.statusCode = 400;
      throw error;
    }

    const payment = await paymentModel.findByIdOrTransactionId(transactionIdOrId);
    if (!payment) {
      const error = new Error(`Payment transaction "${transactionIdOrId}" not found`);
      error.statusCode = 404;
      throw error;
    }
    return payment;
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId, options = {}) {
    if (!userId) {
      const error = new Error('User ID is required to fetch payment history');
      error.statusCode = 400;
      throw error;
    }
    return paymentModel.findByUserId(userId, options);
  },

  /**
   * Process refund for a payment
   */
  async refundPayment(paymentId, reason = 'Customer cancellation') {
    const payment = await paymentModel.findByIdOrTransactionId(paymentId);
    if (!payment) {
      const error = new Error(`Payment #${paymentId} not found`);
      error.statusCode = 404;
      throw error;
    }

    if (payment.payment_status === 'refunded') {
      const error = new Error(`Payment transaction ${payment.transaction_id} has already been refunded`);
      error.statusCode = 400;
      throw error;
    }

    const updatedPayment = await paymentModel.updateStatus(payment.id, {
      paymentStatus: 'refunded',
      gatewayResponse: {
        ...payment.gateway_response,
        refund_status: 'succeeded',
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      },
    });

    // Update booking status
    if (payment.booking_id) {
      await bookingModel.updateStatus(payment.booking_id, 'cancelled');
    }

    return {
      payment: updatedPayment,
      message: `Refund of $${payment.amount} ${payment.currency} processed successfully`,
    };
  },
};

module.exports = paymentService;
