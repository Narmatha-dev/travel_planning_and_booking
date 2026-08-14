const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Travel Planning & Booking System API',
    version: '1.0.0',
    description: 'Comprehensive REST API documentation for the Travel Planning & Booking System. Includes endpoints for authentication, destinations, travel packages, trip planning, bookings, and payments.',
    contact: {
      name: 'API Support',
      email: 'support@travelplanner.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health & diagnostic endpoints' },
    { name: 'Auth', description: 'User authentication & account registration' },
    { name: 'Destinations', description: 'Destination catalog, search, and details' },
    { name: 'Packages', description: 'Curated travel packages and itineraries' },
    { name: 'Trips', description: 'User trip planning and day-by-day itineraries' },
    { name: 'Bookings', description: 'Package and activity reservations' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'System health check',
        description: 'Returns the operational status of the Travel Booking API.',
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
                  fullName: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
                  password: { type: 'string', format: 'password', example: 'SecurePass123!' },
                  phoneNumber: { type: 'string', example: '+1-555-0199' },
                  role: { type: 'string', enum: ['traveler', 'agent', 'admin'], example: 'traveler' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully with bcrypt password hash',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 6 },
                        fullName: { type: 'string', example: 'Jane Doe' },
                        email: { type: 'string', example: 'jane.doe@example.com' },
                        role: { type: 'string', example: 'traveler' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or duplicate email',
          },
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
          '200': {
            description: 'Login successful',
          },
          '401': {
            description: 'Invalid credentials',
          },
        },
      },
    },
    '/api/destinations': {
      get: {
        tags: ['Destinations'],
        summary: 'List destinations',
        description: 'Returns active destinations with optional category and keyword search filters.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', enum: ['beach', 'mountain', 'cultural', 'adventure', 'city_break', 'luxury'] },
            description: 'Filter by destination category',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search keyword matching city, country, or destination name',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Destinations retrieved successfully',
          },
        },
      },
    },
    '/api/destinations/{identifier}': {
      get: {
        tags: ['Destinations'],
        summary: 'Get destination by ID or slug',
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
          '200': { description: 'Destination details retrieved' },
          '404': { description: 'Destination not found' },
        },
      },
    },
    '/api/packages': {
      get: {
        tags: ['Packages'],
        summary: 'List curated travel packages',
        parameters: [
          {
            name: 'destinationId',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filter packages by destination ID',
          },
          {
            name: 'packageType',
            in: 'query',
            schema: { type: 'string', enum: ['standard', 'premium', 'luxury', 'custom'] },
          },
        ],
        responses: {
          '200': { description: 'Packages retrieved successfully' },
        },
      },
    },
    '/api/packages/{id}': {
      get: {
        tags: ['Packages'],
        summary: 'Get travel package by ID',
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
          '200': { description: 'Package details retrieved' },
          '404': { description: 'Package not found' },
        },
      },
    },
    '/api/trips': {
      get: {
        tags: ['Trips'],
        summary: 'Get user planned trips and day-by-day itineraries',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'integer', default: 3 },
            description: 'User ID to fetch trips for',
          },
        ],
        responses: {
          '200': { description: 'Trips list with itinerary details' },
        },
      },
      post: {
        tags: ['Trips'],
        summary: 'Create a new trip plan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'destinationId', 'title', 'startDate', 'endDate'],
                properties: {
                  userId: { type: 'integer', example: 3 },
                  destinationId: { type: 'integer', example: 1 },
                  packageId: { type: 'integer', nullable: true, example: 1 },
                  title: { type: 'string', example: 'Winter Holiday in Bali' },
                  tripType: { type: 'string', enum: ['solo', 'family', 'couple', 'friends', 'business'], example: 'solo' },
                  startDate: { type: 'string', format: 'date', example: '2026-12-15' },
                  endDate: { type: 'string', format: 'date', example: '2026-12-22' },
                  totalBudget: { type: 'number', example: 2500 },
                  estimatedCost: { type: 'number', example: 1800 },
                  notes: { type: 'string', example: 'Visiting temples and beach diving' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Trip created successfully' },
        },
      },
    },
    '/api/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'Get user bookings and reservation histories',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'integer', default: 3 },
          },
        ],
        responses: {
          '200': { description: 'Bookings list retrieved' },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create a new booking reservation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'destinationId', 'travelDate', 'numTravelers', 'totalAmount'],
                properties: {
                  userId: { type: 'integer', example: 3 },
                  packageId: { type: 'integer', example: 1 },
                  destinationId: { type: 'integer', example: 1 },
                  bookingType: { type: 'string', example: 'package' },
                  travelDate: { type: 'string', format: 'date', example: '2026-09-10' },
                  returnDate: { type: 'string', format: 'date', example: '2026-09-17' },
                  numTravelers: { type: 'integer', example: 2 },
                  totalAmount: { type: 'number', example: 2198.00 },
                  discountAmount: { type: 'number', example: 198.00 },
                  finalAmount: { type: 'number', example: 2000.00 },
                  specialRequests: { type: 'string', example: 'Window seats and ocean view villa' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created with generated reference (e.g. BK-2026-XXXX)' },
        },
      },
    },
    '/api/bookings/{reference}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking details by reference code',
        parameters: [
          {
            name: 'reference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'BK-2026-001',
          },
        ],
        responses: {
          '200': { description: 'Booking details retrieved' },
          '404': { description: 'Booking not found' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
