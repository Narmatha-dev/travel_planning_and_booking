const express = require('express');
const rewardController = require('../controllers/rewardController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// 1. User Protected Routes (Feature 2, 3, 8 & 9)
router.get('/balance', authMiddleware, rewardController.getRewards);
router.get('/history', authMiddleware, rewardController.getHistory);

// 2. Admin Analytics Route (Feature 11)
router.get('/stats', authMiddleware, adminMiddleware, rewardController.getStats);

module.exports = router;
