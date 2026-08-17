const express = require('express');

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const destinationRoutes = require('./destinationRoutes');
const packageRoutes = require('./packageRoutes');
const tripRoutes = require('./tripRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const chatbotRoutes = require('./chatbotRoutes');

const router = express.Router();

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/destinations', destinationRoutes);
router.use('/packages', packageRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/chatbot', chatbotRoutes);

module.exports = router;
