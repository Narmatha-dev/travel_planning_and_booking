const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
  /**
   * POST /api/auth/register
   */
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  }),

  /**
   * POST /api/auth/login
   */
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return successResponse(res, 'Login successful', result, 200);
  }),

  /**
   * GET /api/auth/profile
   * Protected by authMiddleware
   */
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await authService.getProfile(userId);
    return successResponse(res, 'User profile retrieved successfully', { user });
  }),

  /**
   * PUT /api/auth/profile
   * Protected by authMiddleware
   */
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updatedUser = await authService.updateProfile(userId, req.body);
    return successResponse(res, 'User profile updated successfully', { user: updatedUser });
  }),
};

module.exports = authController;
