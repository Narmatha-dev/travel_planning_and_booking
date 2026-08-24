const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const paymentController = {
  /**
   * GET /api/payments/config
   * Retrieve public payment gateway configuration
   */
  getGatewayConfig: asyncHandler(async (req, res) => {
    const config = paymentService.getGatewayConfig();
    return successResponse(res, 'Payment gateway configuration retrieved successfully', config);
  }),

  /**
   * POST /api/payments/create-order
   * Feature 4: Create a server-side payment order / session
   */
  createPaymentOrder: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { bookingId, paymentMethod } = req.body;

    const orderData = await paymentService.createPaymentOrder({
      bookingId,
      userId,
      paymentMethod,
    });

    return successResponse(res, 'Payment order created successfully', orderData, 201);
  }),

  /**
   * POST /api/payments/verify
   * Feature 5: Verify payment transaction server-side
   */
  verifyPayment: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const result = await paymentService.verifyPayment({
      ...req.body,
      userId,
    });

    return successResponse(res, 'Payment verified successfully', result, 200);
  }),

  /**
   * GET /api/payments/receipt/:identifier
   * Feature 9 & 10: Retrieve digital booking & payment receipt
   */
  getReceipt: asyncHandler(async (req, res) => {
    const identifier = req.params.identifier;
    const userId = req.user?.id || req.query.userId || 3;

    const receipt = await paymentService.getReceipt(identifier, userId);
    return successResponse(res, 'Digital receipt retrieved successfully', receipt);
  }),

  /**
   * POST /api/payments/webhook
   * Feature 14: Payment provider webhook notification
   */
  handleWebhook: asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'] || req.headers['x-signature'] || 'sandbox_sig';
    const result = await paymentService.handleWebhook(req.body, signature);
    return successResponse(res, 'Webhook processed successfully', result);
  }),

  /**
   * POST /api/payments/process
   * Process payment (backward compatible mock)
   */
  processPayment: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const result = await paymentService.processPayment({
      ...req.body,
      userId,
    });
    return successResponse(res, 'Payment authorized and processed successfully', result, 200);
  }),

  /**
   * GET /api/payments/history
   * Retrieve payment transaction history for user
   */
  getPaymentHistory: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { status, limit, offset } = req.query;

    const history = await paymentService.getPaymentHistory(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, 'Payment history retrieved successfully', history);
  }),

  /**
   * GET /api/payments/:identifier
   * Get payment details and status by Transaction ID or Numeric ID
   */
  getPaymentStatus: asyncHandler(async (req, res) => {
    const identifier = req.params.identifier || req.params.transactionId || req.params.id;
    const payment = await paymentService.getPaymentStatus(identifier);
    return successResponse(res, 'Payment details retrieved successfully', payment);
  }),

  /**
   * POST /api/payments/:id/refund
   * Process refund for a transaction
   */
  refundPayment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await paymentService.refundPayment(id, reason);
    return successResponse(res, 'Payment refund processed successfully', result);
  }),
};

module.exports = paymentController;
