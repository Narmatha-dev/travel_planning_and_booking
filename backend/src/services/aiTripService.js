const weatherService = require('./weatherService');
const geminiService = require('./geminiService');

const aiTripService = {
  /**
   * Generates a complete, smart, and budget-optimized AI trip itinerary using Gemini AI
   */
  async generateAiItinerary({
    destination,
    destinationId,
    destinationName,
    numberOfDays = 3,
    travelers = 2,
    budget = 15000,
    currency = 'INR',
    travelPreference = 'nature',
    selectedTransport = null,
    selectedHotel = null,
    currentLocation = null,
    startDate = null,
    weatherAware = true,
    preferOutdoor = false,
    preferIndoor = false,
  }) {
    const rawDest = destinationName || destination || destinationId;
    if (!rawDest) {
      const error = new Error('Destination is required to generate an AI itinerary');
      error.statusCode = 400;
      throw error;
    }

    const daysCount = Math.max(1, Math.min(14, parseInt(numberOfDays, 10) || 3));
    const numTravelers = Math.max(1, parseInt(travelers, 10) || 2);
    const userBudget = parseFloat(budget) || (currency === 'USD' ? 1200 : 15000);
    const pref = (travelPreference || 'nature').toLowerCase();
    const curr = (currency || 'INR').toUpperCase();
    const sDate = startDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // Fetch Weather & Forecast for the destination
    let destinationWeather = null;
    const resolvedCoords = weatherService.resolveCoordinates(rawDest);

    if (resolvedCoords) {
      try {
        const [currW, fcW] = await Promise.all([
          weatherService.getCurrentWeather(resolvedCoords.latitude, resolvedCoords.longitude, resolvedCoords.city),
          weatherService.getWeatherForecast(resolvedCoords.latitude, resolvedCoords.longitude, daysCount + 2, resolvedCoords.city),
        ]);
        destinationWeather = {
          current: currW?.current || null,
          forecast: fcW?.days || [],
        };
      } catch (wErr) {
        console.warn('[AiTripService] Weather fetch non-fatal error:', wErr.message);
      }
    }

    // Execute Trip Planning via Gemini AI
    const result = await geminiService.generateTripPlan({
      destination: rawDest,
      destinationName: rawDest,
      numberOfDays: daysCount,
      travelers: numTravelers,
      budget: userBudget,
      currency: curr,
      travelPreference: pref,
      startDate: sDate,
      weatherContext: destinationWeather,
    });

    // Ensure itineraryItems array is populated for cascading database persistence
    const itineraryItems = (result.days || []).flatMap((d) => {
      const items = [];
      const actDate = d.date || sDate;

      if (d.morning) {
        items.push({
          day_number: d.day,
          activity_date: actDate,
          activity_time: '09:00:00',
          title: d.morning.spot || `Day ${d.day} Morning Sightseeing`,
          description: d.morning.activity || `Morning visit in ${rawDest}`,
          activity_type: 'sightseeing',
          location_name: d.morning.spot || String(rawDest),
          cost: Math.round((d.dailyCostBreakdown?.activitiesCost || 500) * 0.5),
        });
      }

      if (d.afternoon) {
        items.push({
          day_number: d.day,
          activity_date: actDate,
          activity_time: '14:00:00',
          title: d.afternoon.spot || `Day ${d.day} Afternoon Exploration`,
          description: d.afternoon.activity || `Afternoon experience in ${rawDest}`,
          activity_type: 'cultural',
          location_name: d.afternoon.spot || String(rawDest),
          cost: Math.round((d.dailyCostBreakdown?.activitiesCost || 500) * 0.5),
        });
      }

      if (d.evening) {
        items.push({
          day_number: d.day,
          activity_date: actDate,
          activity_time: '18:30:00',
          title: d.evening.spot || `Day ${d.day} Sunset & Dining`,
          description: d.evening.activity || `Evening leisure and dinner in ${rawDest}`,
          activity_type: 'dining',
          location_name: d.evening.spot || String(rawDest),
          cost: d.dailyCostBreakdown?.foodCost || 600,
        });
      }

      return items;
    });

    return {
      ...result,
      destinationId: destinationId || null,
      selectedTransport: selectedTransport || null,
      selectedHotel: selectedHotel || null,
      itineraryItems,
      generatedBy: 'Gemini AI',
    };
  },
};

module.exports = aiTripService;
