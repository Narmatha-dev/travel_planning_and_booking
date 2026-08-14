const tripModel = require('../models/tripModel');
const destinationModel = require('../models/destinationModel');
const { generateItinerary } = require('../utils/itineraryGenerator');

const tripService = {
  /**
   * Generate an algorithmic day-wise itinerary preview before saving
   */
  async generatePreviewItinerary(params) {
    const { destinationId, startDate, endDate, travelers, budget, tripType, interests } = params;

    if (!destinationId) {
      const error = new Error('Destination is required to generate an itinerary');
      error.statusCode = 400;
      throw error;
    }

    if (!startDate || !endDate) {
      const error = new Error('Both start date and end date are required');
      error.statusCode = 400;
      throw error;
    }

    if (new Date(endDate) < new Date(startDate)) {
      const error = new Error('End date cannot be earlier than start date');
      error.statusCode = 400;
      throw error;
    }

    // Lookup destination name
    let destinationName = 'Destination';
    try {
      const dest = await destinationModel.findByIdOrSlug(destinationId);
      if (dest) destinationName = dest.name;
    } catch {
      // ignore
    }

    return generateItinerary({
      destinationId,
      destinationName,
      startDate,
      endDate,
      travelers: travelers || 1,
      budget: budget || 1500,
      tripType: tripType || 'solo',
      interests: interests || ['sightseeing', 'culture', 'dining'],
    });
  },

  /**
   * Create and save a new trip with day-wise itinerary
   */
  async createTrip(userId, tripPayload) {
    const {
      destinationId,
      packageId,
      title,
      tripType,
      startDate,
      endDate,
      totalBudget,
      estimatedCost,
      status,
      notes,
      itineraryItems,
      interests,
      travelers,
    } = tripPayload;

    if (!destinationId) {
      const error = new Error('Destination ID is required');
      error.statusCode = 400;
      throw error;
    }

    if (!startDate || !endDate) {
      const error = new Error('Start and end travel dates are required');
      error.statusCode = 400;
      throw error;
    }

    // Lookup destination to build title if not provided
    let tripTitle = title;
    let destinationName = 'Dream Getaway';
    try {
      const dest = await destinationModel.findByIdOrSlug(destinationId);
      if (dest) {
        destinationName = dest.name;
        if (!tripTitle) {
          tripTitle = `${dest.name} Adventure`;
        }
      }
    } catch {
      if (!tripTitle) tripTitle = 'My Vacation Trip';
    }

    // If user didn't pass custom itinerary items, auto-generate them!
    let finalItineraries = itineraryItems;
    let finalEstimatedCost = estimatedCost;

    if (!finalItineraries || finalItineraries.length === 0) {
      const generated = generateItinerary({
        destinationId,
        destinationName,
        startDate,
        endDate,
        travelers: travelers || 1,
        budget: totalBudget || 1500,
        tripType: tripType || 'solo',
        interests: interests || ['sightseeing', 'dining', 'culture'],
      });
      finalItineraries = generated.itinerary_items;
      finalEstimatedCost = generated.estimated_cost;
    }

    return tripModel.createTripWithItineraries(
      {
        userId,
        destinationId,
        packageId: packageId || null,
        title: tripTitle,
        tripType: tripType || 'solo',
        startDate,
        endDate,
        totalBudget: totalBudget || 0,
        estimatedCost: finalEstimatedCost || 0,
        status: status || 'planned',
        notes: notes || null,
      },
      finalItineraries
    );
  },

  /**
   * Get all trips for user
   */
  async getUserTrips(userId) {
    return tripModel.findByUserId(userId);
  },

  /**
   * Get trip details by ID
   */
  async getTripDetails(tripId, userId) {
    const trip = await tripModel.findById(tripId, userId);
    if (!trip) {
      const error = new Error('Trip not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return trip;
  },

  /**
   * Update trip
   */
  async updateTrip(tripId, userId, updateData) {
    // Verify ownership
    const existing = await tripModel.findById(tripId, userId);
    if (!existing) {
      const error = new Error('Trip not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const { itineraryItems, ...metaUpdates } = updateData;
    return tripModel.updateTrip(tripId, userId, metaUpdates, itineraryItems);
  },

  /**
   * Delete trip
   */
  async deleteTrip(tripId, userId) {
    const deleted = await tripModel.deleteTrip(tripId, userId);
    if (!deleted) {
      const error = new Error('Trip not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return { tripId: parseInt(tripId, 10), deleted: true };
  },
};

module.exports = tripService;
