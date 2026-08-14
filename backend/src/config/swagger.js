const swaggerJsdoc = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Travel Planning & Booking System API',
    version: '1.0.0',
    description: `
Interactive REST API Documentation for the **Travel Planning and Booking Platform**.

### Capabilities:
- **Authentication**: JWT user registration, login, profile management.
- **Destinations**: Search, category filters, ratings, popular highlights, and favorites.
- **Trip Planning**: Interactive itinerary generation, customized multi-day travel schedules.
- **Bookings & Payments**: Complete package booking and payment transaction flows.
    `,
    contact: {
      name: 'Travel Planning Engineering Team',
      email: 'dev@travelplanner.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System Health'],
        summary: 'Server health check',
        responses: {
          '200': {
            description: 'API is running successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Travel Booking API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Alex Reed' },
                  email: { type: 'string', example: 'alex.reed@example.com' },
                  password: { type: 'string', example: 'TravelPass123!' },
                  phoneNumber: { type: 'string', example: '+1-555-0199' },
                  role: { type: 'string', enum: ['traveler', 'agent'], default: 'traveler' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login & authentication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alex.reed@example.com' },
                  password: { type: 'string', example: 'TravelPass123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful with JWT bearer token' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User profile retrieved successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update authenticated user profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Alex Reed' },
                  phoneNumber: { type: 'string', example: '+1-555-0199' },
                  address: { type: 'string', example: '742 Evergreen Terrace, Springfield, OR' },
                  bio: { type: 'string', example: 'Passionate globe-trotter and photographer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User profile updated successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/destinations': {
      get: {
        tags: ['Destinations'],
        summary: 'List destinations',
        description: 'Returns active destinations with optional category, price level, min rating, and sorting filters.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', enum: ['all', 'beach', 'mountain', 'cultural', 'adventure', 'city_break', 'luxury'] },
            description: 'Filter by destination category',
          },
          {
            name: 'priceLevel',
            in: 'query',
            schema: { type: 'string', enum: ['budget', 'moderate', 'expensive', 'luxury'] },
          },
          {
            name: 'minRating',
            in: 'query',
            schema: { type: 'number' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['popularity', 'rating', 'price_asc', 'price_desc'] },
          },
        ],
        responses: {
          '200': { description: 'Destinations retrieved successfully' },
        },
      },
    },
    '/api/destinations/search': {
      get: {
        tags: ['Destinations'],
        summary: 'Search destinations by keyword',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Keyword matching destination name, city, country, description, or category',
            example: 'Bali',
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Search results list' },
        },
      },
    },
    '/api/destinations/popular': {
      get: {
        tags: ['Destinations'],
        summary: 'Get top popular and featured destinations',
        responses: {
          '200': { description: 'Popular destinations list' },
        },
      },
    },
    '/api/destinations/{id}/favorite': {
      post: {
        tags: ['Destinations'],
        summary: 'Add destination to favorites',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            example: 1,
          },
        ],
        responses: {
          '201': { description: 'Added to favorites' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Destinations'],
        summary: 'Remove destination from favorites',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            example: 1,
          },
        ],
        responses: {
          '200': { description: 'Removed from favorites' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/destinations/{identifier}': {
      get: {
        tags: ['Destinations'],
        summary: 'Get destination details by ID or slug',
        parameters: [
          {
            name: 'identifier',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Numeric ID (e.g. 1) or slug (e.g. bali-paradise-island)',
            example: 'bali-paradise-island',
          },
        ],
        responses: {
          '200': { description: 'Destination details with packages and reviews' },
          '404': { description: 'Destination not found' },
        },
      },
    },
    '/api/trips/generate-preview': {
      post: {
        tags: ['Trips'],
        summary: 'Generate a smart day-wise itinerary preview',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['destinationId', 'startDate', 'endDate'],
                properties: {
                  destinationId: { type: 'integer', example: 1 },
                  startDate: { type: 'string', format: 'date', example: '2026-10-01' },
                  endDate: { type: 'string', format: 'date', example: '2026-10-07' },
                  travelers: { type: 'integer', example: 2 },
                  budget: { type: 'number', example: 2000 },
                  tripType: { type: 'string', enum: ['solo', 'couple', 'family', 'friends', 'business'], example: 'couple' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['sightseeing', 'beaches', 'dining'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Generated day-wise itinerary structure' },
        },
      },
    },
    '/api/trips': {
      post: {
        tags: ['Trips'],
        summary: 'Create trip and save day-wise itinerary',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['destinationId', 'startDate', 'endDate'],
                properties: {
                  destinationId: { type: 'integer', example: 1 },
                  title: { type: 'string', example: 'Bali Dream Vacation' },
                  tripType: { type: 'string', example: 'couple' },
                  startDate: { type: 'string', example: '2026-10-01' },
                  endDate: { type: 'string', example: '2026-10-07' },
                  totalBudget: { type: 'number', example: 2500 },
                  notes: { type: 'string', example: 'Looking forward to beach sunset' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Trip created successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Trips'],
        summary: 'Get all trips for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User trips list' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/trips/{id}': {
      get: {
        tags: ['Trips'],
        summary: 'Get trip details with full day-by-day itinerary',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            example: 1,
          },
        ],
        responses: {
          '200': { description: 'Trip details with day-wise itinerary' },
          '404': { description: 'Trip not found' },
        },
      },
      put: {
        tags: ['Trips'],
        summary: 'Update trip details and customized itinerary',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            example: 1,
          },
        ],
        responses: {
          '200': { description: 'Trip updated' },
        },
      },
      delete: {
        tags: ['Trips'],
        summary: 'Delete trip and associated itinerary items',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            example: 1,
          },
        ],
        responses: {
          '200': { description: 'Trip deleted' },
        },
      },
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create a travel reservation booking',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['destinationId', 'travelDate', 'numTravelers', 'totalAmount'],
                properties: {
                  destinationId: { type: 'integer', example: 1 },
                  packageId: { type: 'integer', nullable: true, example: 1 },
                  travelDate: { type: 'string', format: 'date', example: '2026-10-15' },
                  returnDate: { type: 'string', format: 'date', example: '2026-10-22' },
                  numTravelers: { type: 'integer', example: 2 },
                  totalAmount: { type: 'number', example: 2198.00 },
                  specialRequests: { type: 'string', example: 'Vegetarian meals, high floor villa' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created with reference ID' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Bookings'],
        summary: 'Get all bookings for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User bookings list' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #0f172a; padding: 12px 0; }
    .swagger-ui .topbar-wrapper img { content: url('https://img.icons8.com/color/96/airplane-take-off.png'); width: 36px; height: 36px; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #0284c7; font-size: 28px; }
  `,
  customSiteTitle: 'Travel Booking API Documentation (Swagger)',
  customfavIcon: 'https://img.icons8.com/color/48/airplane-take-off.png',
};

module.exports = {
  swaggerDefinition,
  swaggerOptions,
  serve: swaggerJsdoc.serve,
  setup: swaggerJsdoc.setup(swaggerDefinition, swaggerOptions),
};
