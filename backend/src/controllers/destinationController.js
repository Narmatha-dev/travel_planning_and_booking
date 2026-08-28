const destinationService = require('../services/destinationService');
const placesService = require('../services/placesService');
const imageService = require('../services/imageService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const destinationController = {
  /**
   * GET /api/destinations/countries
   * Returns list of countries with destination counts and flags
   */
  getCountries: asyncHandler(async (req, res) => {
    const countries = await destinationService.getCountries();
    return successResponse(res, `Retrieved ${countries.length} destination countries`, countries);
  }),

  /**
   * GET /api/destinations/continents
   * Returns list of continents with counts
   */
  getContinents: asyncHandler(async (req, res) => {
    const continents = await destinationService.getContinents();
    return successResponse(res, `Retrieved ${continents.length} continents`, continents);
  }),

  /**
   * GET /api/destinations/map-data
   * Returns lightweight worldwide markers for interactive map
   */
  getMapMarkers: asyncHandler(async (req, res) => {
    const markers = await destinationService.getMapMarkers();
    return successResponse(res, `Retrieved ${markers.length} global map markers`, markers);
  }),

  /**
   * GET /api/destinations/image-lookup?q=...&country=...
   * Dynamic Wikimedia Commons image & license attribution resolver
   */
  lookupImage: asyncHandler(async (req, res) => {
    const { q, query, name, country } = req.query;
    const destName = q || query || name || '';
    if (!destName) {
      const error = new Error('Destination name parameter (q) is required for image lookup');
      error.statusCode = 400;
      throw error;
    }

    const imageResult = await imageService.getDestinationImage(destName, country || '');
    return successResponse(res, 'Image and license metadata retrieved', imageResult);
  }),

  /**
   * GET /api/destinations/nearby?lat=...&lng=...&category=...&limit=...
   * Retrieves real nearby tourist attractions based on GPS coordinates
   */
  getNearbyDestinations: asyncHandler(async (req, res) => {
    const { lat, lng, latitude, longitude, radius, category, limit } = req.query;
    const targetLat = lat || latitude;
    const targetLng = lng || longitude;

    if (!targetLat || !targetLng) {
      const error = new Error('Both latitude and longitude are required to find nearby places');
      error.statusCode = 400;
      throw error;
    }

    const data = await placesService.getNearbyTouristPlaces({
      latitude: targetLat,
      longitude: targetLng,
      radiusKm: radius ? parseFloat(radius) : 150,
      category: category || 'all',
      limit: limit ? parseInt(limit, 10) : 12,
    });

    return successResponse(res, `Found ${data.places.length} nearby tourist destination(s)`, data);
  }),

  /**
   * GET /api/destinations/india
   * Retrieves all verified tourist attractions across India with region, category, search, and distance sorting
   */
  getIndiaPlaces: asyncHandler(async (req, res) => {
    const { region, category, search, sortBy, lat, lng, latitude, longitude, limit, offset } = req.query;
    const targetLat = lat || latitude;
    const targetLng = lng || longitude;

    const data = await placesService.getAllIndiaPlaces({
      region: region || 'all',
      category: category || 'all',
      search: search || '',
      sortBy: sortBy || 'popular',
      latitude: targetLat,
      longitude: targetLng,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, `Found ${data.places.length} destination(s) across India`, data);
  }),

  /**
   * GET /api/destinations/nearby/:placeId
   * Retrieves detailed information for a real nearby place
   */
  getNearbyPlaceDetails: asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const place = await placesService.getPlaceDetails(placeId);
    return successResponse(res, 'Place details retrieved successfully', place);
  }),

  /**
   * GET /api/destinations
   */
  getAllDestinations: asyncHandler(async (req, res) => {
    const {
      continent,
      country,
      category,
      priceLevel,
      minRating,
      isFeatured,
      sortBy,
      search,
      q,
      lat,
      lng,
      latitude,
      longitude,
      limit,
      offset,
    } = req.query;
    const userId = req.user ? req.user.id : null;

    const destinations = await destinationService.getAllDestinations(
      {
        continent,
        country,
        category,
        priceLevel,
        minRating,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        sortBy,
        search: search || q,
        latitude: lat || latitude,
        longitude: lng || longitude,
        limit: limit ? parseInt(limit, 10) : 60,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      userId
    );

    return successResponse(res, 'Destinations retrieved successfully', destinations);
  }),

  /**
   * GET /api/destinations/search
   */
  searchDestinations: asyncHandler(async (req, res) => {
    const {
      q,
      search,
      continent,
      country,
      category,
      priceLevel,
      minRating,
      lat,
      lng,
      latitude,
      longitude,
      limit,
      offset,
    } = req.query;
    const userId = req.user ? req.user.id : null;
    const queryTerm = q || search || '';

    const destinations = await destinationService.searchDestinations(
      {
        q: queryTerm,
        continent,
        country,
        category,
        priceLevel,
        minRating,
        latitude: lat || latitude,
        longitude: lng || longitude,
        limit: limit ? parseInt(limit, 10) : 60,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      userId
    );

    return successResponse(
      res,
      `Found ${destinations.length} destination(s) matching '${queryTerm}'`,
      destinations
    );
  }),

  /**
   * GET /api/destinations/popular
   */
  getPopularDestinations: asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const destinations = await destinationService.getPopularDestinations(userId);
    return successResponse(res, 'Popular destinations retrieved successfully', destinations);
  }),

  /**
   * GET /api/destinations/:identifier (ID or Slug)
   */
  getDestinationByIdOrSlug: asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const userId = req.user ? req.user.id : null;
    const destination = await destinationService.getDestinationDetails(identifier, userId);
    return successResponse(res, 'Destination details retrieved successfully', destination);
  }),

  /**
   * POST /api/destinations/:id/favorite
   */
  addFavorite: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const destinationId = req.params.id;
    const result = await destinationService.addFavorite(userId, destinationId);
    return successResponse(res, 'Destination added to favorites', result, 201);
  }),

  /**
   * DELETE /api/destinations/:id/favorite
   */
  removeFavorite: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const destinationId = req.params.id;
    const result = await destinationService.removeFavorite(userId, destinationId);
    return successResponse(res, 'Destination removed from favorites', result, 200);
  }),
};

module.exports = destinationController;
