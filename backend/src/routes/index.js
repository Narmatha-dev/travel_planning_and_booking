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
const adminRoutes = require('./adminRoutes');
const locationRoutes = require('./locationRoutes');
const transportRoutes = require('./transportRoutes');
const hotelRoutes = require('./hotelRoutes');
const notificationRoutes = require('./notificationRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const shareRoutes = require('./shareRoutes');
const rewardRoutes = require('./rewardRoutes');

const router = express.Router();

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/location', locationRoutes);
router.use('/transport', transportRoutes);
router.use('/hotels', hotelRoutes);
router.use('/destinations', destinationRoutes);
router.use('/packages', packageRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/share', shareRoutes);
router.use('/rewards', rewardRoutes);
router.use('/reviews', reviewRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
