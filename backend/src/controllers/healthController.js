/**
 * Health check controller
 * Endpoint: GET /api/health
 */
function getHealthStatus(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Travel Booking API is running',
  });
}

module.exports = {
  getHealthStatus,
};
