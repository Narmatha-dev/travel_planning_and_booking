const paymentService = require('../services/paymentService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const paymentController = {
  /**
   * POST /api/payments/process
   * Process / charge a payment (Mock Simulation)
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
   * Retrieve payment transaction history for the user
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
