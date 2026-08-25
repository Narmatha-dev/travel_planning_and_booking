const packingService = require('../services/packingService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const packingController = {
  /**
   * POST /api/packing/generate
   * Generate intelligent packing checklist from parameters (no trip ID required)
   */
  generateChecklist: asyncHandler(async (req, res) => {
    const { destination, durationDays, tripType, travelers, transportType, activities, weatherForecast } = req.body;

    const checklist = await packingService.generateSmartChecklist({
      destination: destination || 'Mahabalipuram',
      durationDays: durationDays || 3,
      tripType: tripType || 'nature',
      travelers: travelers || 2,
      transportType: transportType || 'cab',
      activities: activities || [],
      weatherForecast,
    });

    return successResponse(res, 'Packing checklist generated successfully', checklist);
  }),

  /**
   * GET /api/packing/trip/:tripId
   * Retrieve saved or auto-generated packing checklist for a trip
   */
  getTripPacking: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { tripId } = req.params;
    const tripContext = req.query;

    const data = await packingService.getTripPackingList(tripId, userId, tripContext);
    return successResponse(res, 'Trip packing checklist retrieved successfully', data);
  }),

  /**
   * POST /api/packing/trip/:tripId
   * Save complete checklist items to a trip
   */
  saveTripPacking: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { tripId } = req.params;
    const { items } = req.body;

    const saved = await packingService.savePackingList(tripId, userId, items);
    return successResponse(res, 'Trip packing checklist saved successfully', saved);
  }),

  /**
   * POST /api/packing/items
   * Add a custom packing item
   */
  addCustomItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { tripId, category, itemName, quantity, reason } = req.body;

    const item = await packingService.addCustomItem(userId, {
      tripId,
      category,
      itemName,
      quantity,
      reason,
    });

    return successResponse(res, 'Custom packing item added successfully', item, 201);
  }),

  /**
   * PATCH /api/packing/items/:id/toggle
   * Toggle packed state of an item
   */
  togglePacked: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { id } = req.params;

    const updated = await packingService.toggleItemPacked(id, userId);
    return successResponse(res, 'Packing item state updated', updated);
  }),

  /**
   * PUT /api/packing/items/:id
   * Update item details (name, quantity, category)
   */
  updateItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { id } = req.params;

    const updated = await packingService.updateItem(id, userId, req.body);
    return successResponse(res, 'Packing item updated successfully', updated);
  }),

  /**
   * DELETE /api/packing/items/:id
   * Delete a packing item
   */
  deleteItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || req.query.userId || 3;
    const { id } = req.params;

    const result = await packingService.deleteItem(id, userId);
    return successResponse(res, 'Packing item deleted successfully', result);
  }),
};

module.exports = packingController;
