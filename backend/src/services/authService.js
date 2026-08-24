const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const userModel = require('../models/userModel');
const googleAuthService = require('./googleAuthService');

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
    if (!user.password_hash) {
      const error = new Error('This account was created with Google Sign-In. Please use Continue with Google.');
      error.statusCode = 400;
      throw error;
    }

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
   * Core handler for authenticated Google profile data
   */
  async handleGoogleAuth({ googleId, email, fullName, profileImageUrl }) {
    if (!email) {
      const error = new Error('Google authentication did not provide an email address');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName && fullName.trim() ? fullName.trim() : cleanEmail.split('@')[0];

    // 1. Search by Google Subject ID first
    let user = googleId ? await userModel.findByGoogleId(googleId) : null;

    if (user) {
      if (!user.is_active) {
        const error = new Error('Your account has been deactivated. Please contact support.');
        error.statusCode = 403;
        throw error;
      }

      // Update avatar if not present
      if (!user.profile_image_url && profileImageUrl) {
        user = await userModel.updateProfile(user.id, { profileImageUrl });
      }

      const token = this.generateToken(user);
      const { password_hash, ...safeUser } = user;
      return { user: safeUser, token, isNewUser: false };
    }

    // 2. Search by verified email address (Link Google to existing local user account)
    user = await userModel.findByEmail(cleanEmail);
    if (user) {
      if (!user.is_active) {
        const error = new Error('Your account has been deactivated. Please contact support.');
        error.statusCode = 403;
        throw error;
      }

      // Link Google Account to existing user
      if (googleId) {
        user = await userModel.linkGoogleAccount(user.id, googleId, profileImageUrl);
      }

      const token = this.generateToken(user);
      const { password_hash, ...safeUser } = user;
      return { user: safeUser, token, isNewUser: false };
    }

    // 3. Create new user account via Google OAuth
    const defaultAvatar =
      profileImageUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0D8ABC&color=fff`;

    const userId = await userModel.create({
      fullName: cleanName,
      email: cleanEmail,
      passwordHash: null,
      googleId: googleId || null,
      authProvider: 'google',
      role: 'traveler',
      profileImageUrl: defaultAvatar,
    });

    const newUser = await userModel.findById(userId);
    const token = this.generateToken(newUser);

    const { password_hash, ...safeUser } = newUser;
    return {
      user: safeUser,
      token,
      isNewUser: true,
    };
  },

  /**
   * Process Google OAuth callback code
   */
  async googleAuthCallback({ code, state }) {
    if (!code) {
      const error = new Error('Authorization code was not provided by Google');
      error.statusCode = 400;
      throw error;
    }

    // 1. Exchange code for OAuth tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);

    // 2. Fetch verified user profile
    const googleProfile = await googleAuthService.getUserInfo(tokens.access_token);

    // 3. Authenticate or create user in database
    const authResult = await this.handleGoogleAuth(googleProfile);

    // Parse state if return destination was passed
    const parsedState = googleAuthService.parseState(state);

    return {
      ...authResult,
      redirectDestination: parsedState?.redirect || null,
    };
  },

  /**
   * Authenticate with Google ID token (from GIS / Frontend SDK / One Tap)
   */
  async googleLoginWithIdToken({ idToken }) {
    const verifiedProfile = await googleAuthService.verifyIdToken(idToken);
    return this.handleGoogleAuth(verifiedProfile);
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
