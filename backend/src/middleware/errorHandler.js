const config = require('../config/environment');

/**
 * Global Central Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] [${req.method} ${req.originalUrl}]:`, err.stack || err);

  const responsePayload = {
    status: 'error',
    message,
  };

  // Include detailed error/stack trace only in development
  if (config.nodeEnv === 'development') {
    responsePayload.stack = err.stack;
    if (err.errors) {
      responsePayload.errors = err.errors;
    }
  }

  res.status(statusCode).json(responsePayload);
}

module.exports = errorHandler;
