const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// 1. Process payment (Mock Simulation - POST /api/payments/process)
router.post('/process', paymentController.processPayment);

// 2. Get user payment history (GET /api/payments/history)
router.get('/history', paymentController.getPaymentHistory);

// 3. Process refund (POST /api/payments/:id/refund)
router.post('/:id/refund', paymentController.refundPayment);

// 4. Get payment status by transaction ID or numeric ID (GET /api/payments/:identifier)
router.get('/:identifier', paymentController.getPaymentStatus);

module.exports = router;
