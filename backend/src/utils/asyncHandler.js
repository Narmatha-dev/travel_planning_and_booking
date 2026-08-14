/**
 * Async wrapper middleware to forward errors to global error handler
 * @param {Function} fn - Async Express route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
