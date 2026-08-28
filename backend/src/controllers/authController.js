const authService = require('../services/authService');
const googleAuthService = require('../services/googleAuthService');
const config = require('../config/environment');
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
   * POST /api/auth/admin/login
   * Dedicated Admin Authentication
   */
  adminLogin: asyncHandler(async (req, res) => {
    const result = await authService.adminLogin(req.body);
    return successResponse(res, 'Administrator authentication successful', result, 200);
  }),

  /**
   * GET /api/auth/google
   * Initiates Google OAuth 2.0 flow
   */
  initiateGoogle: asyncHandler(async (req, res) => {
    const { redirect, format } = req.query;

    if (!config.google.clientId) {
      const errorMsg = 'Google OAuth Client ID is not configured on the backend server.';
      if (format === 'json' || req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(503).json({
          status: 'error',
          message: errorMsg,
          code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        });
      }
      return res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    // Capture dynamic client origin (handles port 5173 or 5174 smoothly)
    let clientOrigin = config.clientUrl;
    const referer = req.headers.referer || req.headers.origin;
    if (referer) {
      try {
        const refUrl = new URL(referer);
        if (refUrl.hostname === 'localhost' || refUrl.hostname === '127.0.0.1') {
          clientOrigin = `${refUrl.protocol}//${refUrl.host}`;
        }
      } catch {}
    }

    const state = {
      redirect: redirect || '/',
      clientOrigin,
      timestamp: Date.now(),
    };

    const authUrl = googleAuthService.getGoogleAuthUrl(state);

    if (format === 'json' || req.query.json === 'true') {
      return successResponse(res, 'Google OAuth authorization URL generated', { url: authUrl });
    }

    return res.redirect(authUrl);
  }),

  /**
   * GET /api/auth/google/callback
   * Handles redirect callback from Google OAuth consent screen
   */
  handleGoogleCallback: async (req, res) => {
    const { code, state, error, error_description } = req.query;
    const parsedState = googleAuthService.parseState(state);
    const targetOrigin = parsedState?.clientOrigin || config.clientUrl;

    // Handle Google cancellation / refusal
    if (error) {
      const reason = error_description || error;
      console.warn(`[Google OAuth] Flow cancelled or error received from Google: ${reason}`);
      return res.redirect(
        `${targetOrigin}/auth/callback?error=${encodeURIComponent(
          error === 'access_denied' ? 'Google sign-in was cancelled.' : reason
        )}`
      );
    }

    try {
      const result = await authService.googleAuthCallback({ code, state });

      const redirectDestination = result.redirectDestination || '/';
      const redirectUrl = new URL(`${targetOrigin}/auth/callback`);
      redirectUrl.searchParams.set('token', result.token);
      redirectUrl.searchParams.set('user', JSON.stringify(result.user));
      redirectUrl.searchParams.set('redirect', redirectDestination);
      if (result.isNewUser) {
        redirectUrl.searchParams.set('isNewUser', 'true');
      }

      return res.redirect(redirectUrl.toString());
    } catch (err) {
      console.error('[Google OAuth] Callback authentication error:', err.message);
      const errorMessage = err.message || 'Google authentication failed';
      return res.redirect(
        `${targetOrigin}/auth/callback?error=${encodeURIComponent(errorMessage)}`
      );
    }
  },

  /**
   * POST /api/auth/google
   * Authenticate directly with verified Google ID Token / Credential (e.g. from One Tap or popup)
   */
  googleTokenAuth: asyncHandler(async (req, res) => {
    const { idToken, credential } = req.body;
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify) {
      const error = new Error('Google ID token or credential is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await authService.googleLoginWithIdToken({ idToken: tokenToVerify });
    return successResponse(res, 'Google authentication successful', result, 200);
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
