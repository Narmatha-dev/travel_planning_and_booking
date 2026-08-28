const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/environment');
const { testConnection } = require('./config/db');
const swaggerDocument = require('./config/swagger');

const requestLogger = require('./middleware/logger');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || config.port || 5000;
const HOST = '0.0.0.0';

// =====================================================
// 1. CORS Configuration (Local + Production Vercel)
// =====================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

if (config.clientUrl) {
  const normalizedClientUrl = config.clientUrl.replace(/\/$/, '');
  if (!allowedOrigins.includes(normalizedClientUrl)) {
    allowedOrigins.push(normalizedClientUrl);
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser tools, curl, health-checks, server-to-server or same-origin requests
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      (config.clientUrl && cleanOrigin === config.clientUrl.replace(/\/$/, '')) ||
      (process.env.NODE_ENV !== 'production' && (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1'))) ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

app.use(cors(corsOptions));

// =====================================================
// 2. HTTP Security Headers
// =====================================================

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self)');
  next();
});

// =====================================================
// 3. Request Parsing Middleware
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// 4. Custom Request Logging
// =====================================================

app.use(requestLogger);

// =====================================================
// 5. Swagger API Documentation
// =====================================================

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Travel Booking API Documentation',
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Raw OpenAPI JSON Spec
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// =====================================================
// 6. Root Endpoint
// =====================================================

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Travel Planning & Booking API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      docs: 'GET /docs',
      destinations: 'GET /api/destinations',
      packages: 'GET /api/packages',
      trips: 'GET /api/trips',
      bookings: 'GET /api/bookings',
      auth: 'POST /api/auth/login, POST /api/auth/admin/login',
    },
  });
});

// =====================================================
// 7. Mount API Routes
// =====================================================

app.use('/api', apiRoutes);

// =====================================================
// 8. Handle 404
// =====================================================

app.use(notFoundHandler);

// =====================================================
// 9. Global Error Handler
// =====================================================

app.use(errorHandler);

// =====================================================
// 10. Start HTTP Server on 0.0.0.0
// =====================================================

const server = app.listen(PORT, HOST, async () => {
  console.log('=====================================================');
  console.log(`🚀 Travel Booking Backend running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`📚 API Docs:     http://${HOST}:${PORT}/docs`);
  console.log(`🔑 Google OAuth: ${config.google.clientId ? 'Configured' : 'Optional'}`);
  console.log('=====================================================');

  // Verify database connection
  await testConnection();
});

module.exports = {
  app,
  server,
};