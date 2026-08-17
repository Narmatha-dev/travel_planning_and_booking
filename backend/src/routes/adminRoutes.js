const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Enforce both JWT authentication and Administrator role globally across all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// 1. Dashboard Statistics & Key Metrics
router.get('/stats', adminController.getStats);

// 2. User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// 3. Destination Management
router.get('/destinations', adminController.getDestinations);
router.post('/destinations', adminController.createDestination);
router.put('/destinations/:id', adminController.updateDestination);
router.delete('/destinations/:id', adminController.deleteDestination);

// 4. Package Management
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// 5. Booking Lifecycle Management
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// 6. Review Moderation & Approval
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/approval', adminController.updateReviewApproval);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
