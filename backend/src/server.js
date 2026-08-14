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

// 4. Interactive Swagger API Documentation (/docs, /api/docs, /api-docs)
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

// 5. Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Travel Planning & Booking API',
    version: '1.0.0',
    documentationUrl: 'http://localhost:5000/docs',
    endpoints: {
      docs: 'GET /docs (Interactive Swagger UI)',
      health: 'GET /api/health',
      destinations: 'GET /api/destinations',
      packages: 'GET /api/packages',
      trips: 'GET /api/trips',
      bookings: 'GET /api/bookings',
      auth: 'POST /api/auth/login, POST /api/auth/register',
    },
  });
});

// 6. Mount API Routes under /api
app.use('/api', apiRoutes);

// 7. Handle 404 - Not Found
app.use(notFoundHandler);

// 8. Global Error Handler
app.use(errorHandler);

// 9. Start HTTP Server
const server = app.listen(PORT, async () => {
  console.log('=====================================================');
  console.log(`🚀 Travel Booking Backend running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Docs:     http://localhost:${PORT}/docs`);
  console.log('=====================================================');

  // Verify database connection asynchronously
  await testConnection();
});

module.exports = { app, server };
