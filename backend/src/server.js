const express = require('express');
const cors = require('cors');
const config = require('./config/environment');
const { testConnection } = require('./config/db');
const requestLogger = require('./middleware/logger');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = config.port;

// 1. CORS Configuration
const corsOptions = {
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// 2. Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Custom Request Logging
app.use(requestLogger);

// 4. Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Travel Planning & Booking API',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      destinations: 'GET /api/destinations',
      packages: 'GET /api/packages',
      trips: 'GET /api/trips',
      bookings: 'GET /api/bookings',
      auth: 'POST /api/auth/login, POST /api/auth/register',
    },
  });
});

// 5. Mount API Routes under /api
app.use('/api', apiRoutes);

// 6. Handle 404 - Not Found
app.use(notFoundHandler);

// 7. Global Error Handler
app.use(errorHandler);

// 8. Start HTTP Server
const server = app.listen(PORT, async () => {
  console.log('=====================================================');
  console.log(`🚀 Travel Booking Backend running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log('=====================================================');

  // Verify database connection asynchronously
  await testConnection();
});

module.exports = { app, server };
