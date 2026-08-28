const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Get public payment gateway config (GET /api/payments/config) - Public
router.get('/config', paymentController.getGatewayConfig);

// 2. Payment provider webhook (POST /api/payments/webhook) - Public
router.post('/webhook', paymentController.handleWebhook);

// Protected payment endpoints (require authenticated traveler)
router.use(authMiddleware);

// 3. Create payment order / session (POST /api/payments/create-order)
router.post('/create-order', paymentController.createPaymentOrder);

// 4. Verify payment transaction (POST /api/payments/verify)
router.post('/verify', paymentController.verifyPayment);

// 5. Retrieve digital booking & payment receipt (GET /api/payments/receipt/:identifier)
router.get('/receipt/:identifier', paymentController.getReceipt);

// 6. Process payment (backward compatible - POST /api/payments/process)
router.post('/process', paymentController.processPayment);

// 7. Get user payment history (GET /api/payments/history)
router.get('/history', paymentController.getPaymentHistory);

// 8. Process refund (POST /api/payments/:id/refund)
router.post('/:id/refund', paymentController.refundPayment);

// 9. Get payment status by transaction ID or numeric ID (GET /api/payments/:identifier)
router.get('/:identifier', paymentController.getPaymentStatus);

module.exports = router;
