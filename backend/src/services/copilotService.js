const bookingModel = require('../models/bookingModel');
const tripModel = require('../models/tripModel');
const weatherService = require('./weatherService');
const packingService = require('./packingService');
const checklistService = require('./checklistService');
const trustedContactModel = require('../models/trustedContactModel');
const chatbotService = require('./chatbotService');

const copilotService = {
  /**
   * Generates a complete 12-facet Copilot Summary & Readiness Matrix for a trip
   */
  async getTripCopilotSummary(tripId = 1, userId = 3) {
    const tId = parseInt(tripId, 10) || 1;
    const uId = parseInt(userId, 10) || 3;

    // 1. Fetch Booking or Trip Context
    let bookingData = null;
    let tripData = null;

    try {
      bookingData = await bookingModel.findByIdOrReference(tId);
      if (bookingData && bookingData.user_id && bookingData.user_id !== uId) {
        bookingData = null;
      }
    } catch {}

    try {
      tripData = await tripModel.findById(tId);
      if (tripData && tripData.user_id && tripData.user_id !== uId) {
        tripData = null;
      }
    } catch {}

    const destName = bookingData?.destination_name || tripData?.destination_name || tripData?.destination_city || 'Ooty';
    const destCity = bookingData?.destination_city || tripData?.destination_city || destName;
    const destCountry = bookingData?.destination_country || tripData?.destination_country || 'India';
    const travelDate = bookingData?.travel_date || tripData?.start_date || '2026-09-10';
    const returnDate = bookingData?.return_date || tripData?.end_date || '2026-09-15';
    const durationDays = bookingData?.duration_days || tripData?.itineraries?.length || 3;
    const numTravelers = bookingData?.num_travelers || tripData?.travelers || 2;

    // 2. Weather Status (Phase 26)
    let weatherFacet = { available: false, temp: 24, condition: 'Clear', rainChance: 10, outdoorSuitability: 'Good' };
    try {
      const w = await weatherService.getWeatherByDestination(destName);
      if (w && w.weather_available && w.current) {
        weatherFacet = {
          available: true,
          temp: w.current.temperature,
          condition: w.current.condition,
          icon: w.current.icon,
          rainChance: w.current.rain_probability || 0,
          outdoorSuitability: w.current.outdoor_suitability || 'Good',
          smartSuggestion: w.current.smart_suggestion,
        };
      }
    } catch {}

    // 3. Hotel Stay Status (Phase 7 & 8)
    const hasHotel = Boolean(bookingData?.selected_hotel || bookingData?.hotel_id || bookingData?.status === 'confirmed');
    const hotelFacet = {
      confirmed: hasHotel,
      name: bookingData?.selected_hotel?.name || `${destName} Valley View Resort`,
      checkIn: `${travelDate} 14:00`,
      status: hasHotel ? 'Confirmed' : 'Pending Selection',
    };

    // 4. Transport Status (Phase 4 & 8)
    const hasTransport = Boolean(bookingData?.selected_transport || bookingData?.transport_type);
    const transportFacet = {
      confirmed: hasTransport,
      type: bookingData?.selected_transport?.type || 'cab',
      title: bookingData?.selected_transport?.title || 'Private AC Chauffeur Cab',
      status: hasTransport ? 'Confirmed' : 'Pending Selection',
    };

    // 5. Budget & Cost Breakdown (Phase 23)
    const budgetFacet = {
      estimatedTotal: bookingData?.final_amount || 8500,
      transport: 2200,
      hotel: 4500,
      food: 1200,
      activities: 600,
      currency: 'INR',
    };

    // 6. Itinerary Status (Phase 24)
    const itineraryFacet = {
      ready: true,
      dayCount: durationDays,
      title: `${durationDays}-Day AI Optimized Itinerary to ${destName}`,
    };

    // 7. Packing Checklist (Phase 27)
    let packingFacet = { packed: 0, total: 18, percentage: 0, ready: false };
    try {
      const p = await packingService.getTripPackingList(tId, uId, { destinationName: destName, durationDays });
      if (p) {
        packingFacet = {
          packed: p.packedItems || 0,
          total: p.totalItems || 18,
          percentage: p.progressPercentage || 0,
          ready: p.packedItems === p.totalItems && p.totalItems > 0,
        };
      }
    } catch {}

    // 8. Travel Checklist & Readiness (Phase 28)
    let checklistFacet = { completed: 0, total: 10, percentage: 0, score: 0, ready: false };
    try {
      const chk = await checklistService.getTripChecklist(tId, uId, { destinationName: destName, durationDays });
      if (chk) {
        checklistFacet = {
          completed: chk.completedTasks || 0,
          total: chk.totalTasks || 10,
          percentage: chk.readinessScore || 0,
          score: chk.readinessScore || 0,
          ready: chk.readinessScore >= 80,
        };
      }
    } catch {}

    // 9. Safety Contacts (Phase 25)
    let safetyFacet = { ready: false, contactsCount: 0 };
    try {
      const contacts = await trustedContactModel.findByUserId(uId);
      safetyFacet = {
        ready: contacts && contacts.length > 0,
        contactsCount: contacts ? contacts.length : 0,
      };
    } catch {}

    // 10. Compute Unified Readiness Matrix (Feature 27)
    const matrix = {
      itinerary: itineraryFacet.ready,
      hotel: hotelFacet.confirmed,
      transport: transportFacet.confirmed,
      packing: packingFacet.percentage >= 80,
      checklist: checklistFacet.percentage >= 70,
      weather: weatherFacet.available,
      safety: safetyFacet.ready,
    };

    const completedMatrixCount = Object.values(matrix).filter(Boolean).length;
    const totalMatrixCount = Object.keys(matrix).length;
    const overallReadinessScore = Math.round((completedMatrixCount / totalMatrixCount) * 100);

    let readinessStatus = 'In Progress';
    if (overallReadinessScore >= 85) readinessStatus = 'Ready to Travel! 🚀';
    else if (overallReadinessScore >= 60) readinessStatus = 'Good Progress 👍';

    return {
      tripId: tId,
      destination: destName,
      destinationCity: destCity,
      destinationCountry: destCountry,
      travelDate,
      returnDate,
      durationDays,
      numTravelers,
      overallReadinessScore,
      readinessStatus,
      readinessMatrix: matrix,
      facets: {
        location: { city: destCity, country: destCountry },
        destination: { name: destName, city: destCity },
        weather: weatherFacet,
        hotel: hotelFacet,
        transport: transportFacet,
        budget: budgetFacet,
        itinerary: itineraryFacet,
        packing: packingFacet,
        checklist: checklistFacet,
        safety: safetyFacet,
        offline: { available: true, route: '/offline-trips' },
      },
      actionCards: [
        { id: 'itinerary', label: '🗺️ View Itinerary', url: `/trip-planner?destination=${encodeURIComponent(destName)}` },
        { id: 'weather', label: '🌦️ Weather Forecast', url: `/trip-planner?destination=${encodeURIComponent(destName)}` },
        { id: 'packing', label: '🎒 Packing Assistant', url: `/packing?destination=${encodeURIComponent(destName)}&days=${durationDays}` },
        { id: 'checklist', label: '📋 Travel Checklist', url: `/checklist?destination=${encodeURIComponent(destName)}` },
        { id: 'safety', label: '🛡️ Safety Assistant', url: '/safety' },
        { id: 'offline', label: '📱 Offline Trip Mode', url: '/offline-trips' },
      ],
    };
  },

  /**
   * Process natural language queries with deep trip context
   */
  async processCopilotQuery({ message, tripId = 1, userId = 3, language = 'en', currentLocation = null }) {
    if (!message || !message.trim()) {
      return {
        reply: 'Hello! I am your AI Travel Copilot. How can I assist with your journey today?',
        suggestions: ['Show my trip summary', 'What should I pack?', 'What is the weather?'],
        actionCards: [],
        confirmationRequired: false,
      };
    }

    const sessionId = `copilot_${userId}_${tripId}`;
    const summary = await this.getTripCopilotSummary(tripId, userId);

    const contextPayload = {
      language,
      currentLocation,
      activeTrip: {
        id: tripId,
        destination: summary.destination,
        duration: summary.durationDays,
        travelDate: summary.travelDate,
      },
      selectedHotel: summary.facets.hotel.name,
      selectedTransport: summary.facets.transport.title,
    };

    const chatbotRes = await chatbotService.processMessage(sessionId, message, contextPayload);

    // Detect if user is asking for booking or payment actions requiring confirmation
    const qLower = message.toLowerCase();
    let confirmationRequired = false;
    let confirmationType = null;

    if (qLower.includes('book now') || qLower.includes('confirm booking') || qLower.includes('முன்பதிவு செய்')) {
      confirmationRequired = true;
      confirmationType = 'booking_confirmation';
    } else if (qLower.includes('pay now') || qLower.includes('process payment') || qLower.includes('பணம் செலுத்து')) {
      confirmationRequired = true;
      confirmationType = 'payment_confirmation';
    } else if (qLower.includes('cancel trip') || qLower.includes('cancel booking') || qLower.includes('ரத்து செய்')) {
      confirmationRequired = true;
      confirmationType = 'cancellation_confirmation';
    }

    return {
      reply: chatbotRes.reply,
      suggestions: chatbotRes.suggestions || ['Check weather forecast', 'What should I pack?', 'Show travel checklist'],
      actionLinks: chatbotRes.actionLinks || summary.actionCards,
      actionCards: summary.actionCards,
      tripSummary: summary,
      confirmationRequired,
      confirmationType,
      language: chatbotRes.language || language,
      timestamp: new Date().toISOString(),
    };
  },
};

module.exports = copilotService;
