/**
 * Admin Role-Based Authorization Middleware
 * Enforces that the authenticated user possesses the 'admin' role.
 * Responds with HTTP 403 Forbidden for non-admin accounts.
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required to access administrative resources.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have administrator privileges to perform this action.',
    });
  }

  next();
}

module.exports = adminMiddleware;
