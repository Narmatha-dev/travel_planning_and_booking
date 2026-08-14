/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${new Date().toISOString()}] [${logLevel}] ${method} ${originalUrl} ${statusCode} - ${duration}ms (${ip})`);
  });

  next();
}

module.exports = requestLogger;
