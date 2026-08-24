const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Enforce both JWT authentication and Administrator role globally across all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// 1. Dashboard Statistics & Key Metrics (Feature 2)
router.get('/stats', adminController.getStats);

// 2. Analytics & Reporting (Feature 3 & 4)
router.get('/analytics', adminController.getAnalytics);

// 3. User Management (Feature 5 & 6)
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// 4. Destination Management (Feature 7)
router.get('/destinations', adminController.getDestinations);
router.post('/destinations', adminController.createDestination);
router.put('/destinations/:id', adminController.updateDestination);
router.delete('/destinations/:id', adminController.deleteDestination);

// 5. Package Management
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// 6. Booking Lifecycle Management (Feature 8)
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// 7. Trip Management (Feature 9)
router.get('/trips', adminController.getTrips);

// 8. Payment View (Feature 11)
router.get('/payments', adminController.getPayments);

// 9. Review Moderation & Approval (Feature 10)
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/approval', adminController.updateReviewApproval);
router.delete('/reviews/:id', adminController.deleteReview);

// 10. ML Recommendation Engine Status & Management (Feature 18)
router.get('/ml/status', adminController.getMlStatus);
router.post('/ml/train', adminController.trainMlModel);

module.exports = router;

