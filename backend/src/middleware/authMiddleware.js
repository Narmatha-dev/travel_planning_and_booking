const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * JWT Authentication Middleware
 * Protects private endpoints by verifying Bearer tokens
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid or malformed authentication token.',
    });
  }
}

module.exports = authMiddleware;
