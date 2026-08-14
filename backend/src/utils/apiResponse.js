/**
 * Standardized API response formatters
 */

function successResponse(res, message = 'Operation successful', data = null, statusCode = 200) {
  const payload = {
    status: 'success',
    message,
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const payload = {
    status: 'error',
    message,
  };

  if (errors !== null && errors !== undefined) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};
