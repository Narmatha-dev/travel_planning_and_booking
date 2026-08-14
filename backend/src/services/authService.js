const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const userModel = require('../models/userModel');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authService = {
  /**
   * Helper to sign JWT payload
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  },

  /**
   * Register a new user
   */
  async register({ fullName, email, password, phoneNumber, role, address, bio, profileImageUrl }) {
    // 1. Required field validations
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      const error = new Error('Full name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Email address is required');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Email format validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      const error = new Error('Please provide a valid email address');
      error.statusCode = 400;
      throw error;
    }

    // 3. Password strength validation
    if (!password || typeof password !== 'string' || password.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    // 4. Duplicate user check
    const existingUser = await userModel.findByEmail(cleanEmail);
    if (existingUser) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    // 5. Password hashing with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create user record
    const userId = await userModel.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      role: role && ['traveler', 'agent', 'admin'].includes(role) ? role : 'traveler',
      address: address ? address.trim() : null,
      bio: bio ? bio.trim() : null,
      profileImageUrl: profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=0D8ABC&color=fff`,
    });

    const user = await userModel.findById(userId);
    const token = this.generateToken(user);

    return {
      user,
      token,
    };
  },

  /**
   * Login user with credentials
   */
  async login({ email, password }) {
    // 1. Required field validation
    if (!email || !password) {
      const error = new Error('Please provide both email and password');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Find user in database
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // 4. Generate JWT
    const token = this.generateToken(user);

    // Sanitize user object (exclude password hash)
    const { password_hash, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  },

  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await userModel.updateProfile(userId, updateData);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },
};

module.exports = authService;
