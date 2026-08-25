const checklistService = require('../services/checklistService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const checklistController = {
  /**
   * POST /api/checklist/generate
   * Generate default pre-trip checklist for parameters
   */
  generateChecklist: asyncHandler(async (req, res) => {
    const { destination, durationDays, transportType, hasHotel, hasTransport } = req.body;

    const items = checklistService.generateDefaultChecklist({
      destination: destination || 'Mahabalipuram',
      durationDays: durationDays || 3,
      transportType: transportType || 'cab',
      hasHotel: Boolean(hasHotel),
      hasTransport: Boolean(hasTransport),
    });

    return successResponse(res, 'Default travel checklist generated', {
      categories: checklistService.CATEGORIES,
      items,
      totalItems: items.length,
    });
  }),

  /**
   * GET /api/checklist/trip/:tripId
   * Retrieve trip checklist with cross-phase readiness metrics
   */
  getTripChecklist: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { tripId } = req.params;
    const tripContext = req.query;

    const data = await checklistService.getTripChecklist(tripId, userId, tripContext);
    return successResponse(res, 'Trip travel checklist retrieved successfully', data);
  }),

  /**
   * POST /api/checklist/trip/:tripId
   * Save complete checklist items to a trip
   */
  saveTripChecklist: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { tripId } = req.params;
    const { items } = req.body;

    const saved = await checklistService.saveTripChecklist(tripId, userId, items);
    return successResponse(res, 'Trip travel checklist saved successfully', saved);
  }),

  /**
   * POST /api/checklist/items
   * Add a custom document / checklist item
   */
  addCustomItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { tripId, category, itemName, notes } = req.body;

    const item = await checklistService.addCustomItem(userId, {
      tripId,
      category,
      itemName,
      notes,
    });

    return successResponse(res, 'Custom checklist item added successfully', item, 201);
  }),

  /**
   * PATCH /api/checklist/items/:id/toggle
   * Toggle completed/ready status of an item
   */
  toggleCompleted: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { id } = req.params;

    const updated = await checklistService.toggleItemCompleted(id, userId);
    return successResponse(res, 'Checklist item status updated', updated);
  }),

  /**
   * PUT /api/checklist/items/:id
   * Update custom item details
   */
  updateItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { id } = req.params;

    const updated = await checklistService.updateItem(id, userId, req.body);
    return successResponse(res, 'Checklist item updated successfully', updated);
  }),

  /**
   * DELETE /api/checklist/items/:id
   * Delete a custom checklist item
   */
  deleteItem: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || req.query.userId || 3;
    const { id } = req.params;

    const result = await checklistService.deleteItem(id, userId);
    return successResponse(res, 'Checklist item deleted successfully', result);
  }),
};

module.exports = checklistController;
