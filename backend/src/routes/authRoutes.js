const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);

// Google OAuth 2.0 Endpoints
router.get('/google', authController.initiateGoogle);
router.get('/google/callback', authController.handleGoogleCallback);
router.post('/google', authController.googleTokenAuth);

// Protected Profile Endpoints
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;

