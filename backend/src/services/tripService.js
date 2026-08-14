const tripModel = require('../models/tripModel');

const tripService = {
  async getUserTrips(userId) {
    const trips = await tripModel.findByUserId(userId);
    for (const trip of trips) {
      trip.itineraries = await tripModel.findItinerariesByTripId(trip.id);
    }
    return trips;
  },

  async planNewTrip(tripData) {
    if (!tripData.title || !tripData.destinationId || !tripData.startDate || !tripData.endDate) {
      const error = new Error('Missing required trip details (title, destinationId, startDate, endDate)');
      error.statusCode = 400;
      throw error;
    }
    const tripId = await tripModel.createTrip(tripData);
    return { id: tripId, ...tripData };
  },
};

module.exports = tripService;
