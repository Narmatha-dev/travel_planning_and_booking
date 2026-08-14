const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const authService = {
  async register({ fullName, email, password, phoneNumber, role }) {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email address already registered');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = await userModel.create({
      fullName,
      email,
      passwordHash,
      phoneNumber,
      role: role || 'traveler',
    });

    return { id: userId, fullName, email, role: role || 'traveler' };
  },

  async login({ email, password }) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};

module.exports = authService;
