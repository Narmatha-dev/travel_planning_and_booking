const https = require('https');
const config = require('../config/environment');

/**
 * Helper to perform HTTPS request and parse JSON response
 */
function httpsRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const error = new Error(
              parsed.error_description || parsed.error || `HTTP request failed with status ${res.statusCode}`
            );
            error.statusCode = res.statusCode;
            error.details = parsed;
            reject(error);
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            const error = new Error(`Request failed with status ${res.statusCode}: ${body}`);
            error.statusCode = res.statusCode;
            reject(error);
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

const googleAuthService = {
  /**
   * Generates the Google OAuth 2.0 Consent URL
   */
  getGoogleAuthUrl(customState = null) {
    if (!config.google.clientId) {
      const error = new Error('Google OAuth Client ID is not configured in backend/.env');
      error.statusCode = 500;
      throw error;
    }

    const statePayload = customState
      ? Buffer.from(JSON.stringify(customState)).toString('base64url')
      : Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64url');

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: statePayload,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Parse state parameter safely
   */
  parseState(stateString) {
    if (!stateString) return null;
    try {
      const decoded = Buffer.from(stateString, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  },

  /**
   * Exchange OAuth 2.0 authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    if (!config.google.clientId || !config.google.clientSecret) {
      const error = new Error('Google OAuth Client ID or Secret is not configured in backend/.env');
      error.statusCode = 500;
      throw error;
    }

    const postData = new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.callbackUrl,
      grant_type: 'authorization_code',
    }).toString();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    return httpsRequest('https://oauth2.googleapis.com/token', options, postData);
  },

  /**
   * Fetch user info from Google using access token
   */
  async getUserInfo(accessToken) {
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const userInfo = await httpsRequest('https://www.googleapis.com/oauth2/v3/userinfo', options);

    if (!userInfo || !userInfo.email) {
      const error = new Error('Unable to retrieve email from Google user profile');
      error.statusCode = 400;
      throw error;
    }

    return {
      googleId: userInfo.sub,
      email: userInfo.email.toLowerCase().trim(),
      fullName: userInfo.name || userInfo.email.split('@')[0],
      profileImageUrl: userInfo.picture || null,
      emailVerified: Boolean(userInfo.email_verified),
    };
  },

  /**
   * Verify an ID token (JWT from Google Identity Services / One Tap)
   */
  async verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      const error = new Error('Invalid Google ID Token provided');
      error.statusCode = 400;
      throw error;
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const tokenInfo = await httpsRequest(url, { method: 'GET' });

    // Verify audience matches our Client ID if client ID is configured
    if (config.google.clientId && tokenInfo.aud !== config.google.clientId) {
      const error = new Error('Google Token audience mismatch');
      error.statusCode = 401;
      throw error;
    }

    if (!tokenInfo.email) {
      const error = new Error('Google ID token did not contain an email');
      error.statusCode = 400;
      throw error;
    }

    return {
      googleId: tokenInfo.sub,
      email: tokenInfo.email.toLowerCase().trim(),
      fullName: tokenInfo.name || tokenInfo.email.split('@')[0],
      profileImageUrl: tokenInfo.picture || null,
      emailVerified: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
    };
  },
};

module.exports = googleAuthService;
