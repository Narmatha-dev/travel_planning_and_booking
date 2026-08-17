const tripModel = require('../models/tripModel');
const destinationModel = require('../models/destinationModel');
const { generateItinerary } = require('../utils/itineraryGenerator');

const tripService = {
  /**
   * Generate an algorithmic day-wise itinerary preview before saving
   */
  async generatePreviewItinerary(params) {
    const {
      destination,
      destinationId,
      destinationName,
      numberOfDays,
      duration,
      durationDays,
      startDate,
      endDate,
      travelers = 1,
      budget = 20000,
      currency = 'INR',
      tripType = 'family',
      travelType = 'family',
      interests = ['beach', 'dining', 'sightseeing'],
    } = params;

    const targetDest = destinationName || destination || destinationId;
    if (!targetDest) {
      const error = new Error('Destination is required to generate an itinerary');
      error.statusCode = 400;
      throw error;
    }

    let start = startDate;
    if (!start) {
      const today = new Date();
      start = today.toISOString().split('T')[0];
    }

    let daysCount = parseInt(numberOfDays || duration || durationDays, 10);
    if (!daysCount && startDate && endDate) {
      const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
      daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    if (!daysCount || daysCount < 1) {
      daysCount = 4;
    }

    // Lookup destination name from ID if numeric
    let resolvedDestName = String(targetDest);
    let resolvedDestId = destinationId;
    if (destinationId && !isNaN(destinationId)) {
      try {
        const dest = await destinationModel.findByIdOrSlug(destinationId);
        if (dest) {
          resolvedDestName = dest.name;
          resolvedDestId = dest.id;
        }
      } catch {}
    }

    return generateItinerary({
      destination: resolvedDestName,
      destinationId: resolvedDestId,
      destinationName: resolvedDestName,
      numberOfDays: daysCount,
      startDate: start,
      travelers,
      budget,
      currency,
      travelType: travelType || tripType || 'family',
      tripType: travelType || tripType || 'family',
      interests,
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
      finalItineraries = generated.itineraryItems || generated.itinerary_items || (generated.days ? generated.days.flatMap((d) => d.activities || []) : []);
      finalEstimatedCost = generated.estimated_cost || generated.totalBudget || totalBudget || 0;
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
