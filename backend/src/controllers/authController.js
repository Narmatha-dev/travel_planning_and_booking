const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
  register: asyncHandler(async (req, res) => {
    const { fullName, email, password, phoneNumber, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide full name, email, and password',
      });
    }

    const newUser = await authService.register({ fullName, email, password, phoneNumber, role });
    return successResponse(res, 'User registered successfully', newUser, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    const user = await authService.login({ email, password });
    return successResponse(res, 'Login successful', { user });
  }),
};

module.exports = authController;
