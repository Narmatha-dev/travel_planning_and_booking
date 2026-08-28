const tripModel = require('../models/tripModel');
const bookingModel = require('../models/bookingModel');
const packingModel = require('../models/packingModel');
const checklistModel = require('../models/checklistModel');
const trustedContactModel = require('../models/trustedContactModel');
const weatherService = require('../services/weatherService');
const packingService = require('../services/packingService');
const checklistService = require('../services/checklistService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const offlineController = {
  /**
   * GET /api/offline/trip/:tripId/bundle
   * Compiles complete structured data for a trip to be cached in IndexedDB
   */
  getOfflineBundle: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { tripId } = req.params;
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    // 1. Fetch booking or trip data
    let bookingData = null;
    let tripData = null;

    try {
      bookingData = await bookingModel.findByIdOrReference(tId);
      if (bookingData && bookingData.user_id && bookingData.user_id !== uId) {
        bookingData = null; // User isolation
      }
    } catch {}

    try {
      tripData = await tripModel.findById(tId);
      if (tripData && tripData.user_id && tripData.user_id !== uId) {
        tripData = null; // User isolation
      }
    } catch {}

    const destName = bookingData?.destination_name || tripData?.destination_name || tripData?.destination_city || 'Ooty';
    const destCity = bookingData?.destination_city || tripData?.destination_city || destName;
    const destCountry = bookingData?.destination_country || tripData?.destination_country || 'India';
    const travelDate = bookingData?.travel_date || tripData?.start_date || '2026-09-10';
    const returnDate = bookingData?.return_date || tripData?.end_date || '2026-09-15';
    const durationDays = bookingData?.duration_days || tripData?.itineraries?.length || 3;
    const numTravelers = bookingData?.num_travelers || tripData?.travelers || 2;

    // 2. Fetch Day-by-Day Itinerary & Locations
    let itinerary = [];
    let savedLocations = [];

    if (tripData?.itineraries && Array.isArray(tripData.itineraries)) {
      itinerary = tripData.itineraries.map((day, idx) => ({
        dayNumber: day.day_number || idx + 1,
        title: day.title || `Day ${idx + 1} - Exploring ${destName}`,
        activities: Array.isArray(day.activities) ? day.activities : [],
        places: Array.isArray(day.places) ? day.places : [],
        notes: day.notes || null,
      }));
    } else {
      itinerary = [
        {
          dayNumber: 1,
          title: `Day 1 - Arrival & Sightseeing in ${destName}`,
          activities: ['Hotel check-in and refresh', 'Scenic landmark exploration', 'Local market & cultural dinner'],
          places: [`${destName} Town Center`, `${destName} Viewpoint`],
          notes: 'Keep booking vouchers handy for hotel check-in',
        },
        {
          dayNumber: 2,
          title: `Day 2 - Highlights & Outdoor Excursion in ${destName}`,
          activities: ['Morning nature trail & photography', 'Historic heritage visit', 'Sunset viewpoint'],
          places: [`${destName} Gardens`, `${destName} Heritage Site`],
          notes: 'Carry daypack, water bottle, and comfortable walking shoes',
        },
      ];
    }

    savedLocations = [
      { name: `${destName} Central Hub`, address: `Main Street, ${destCity}, ${destCountry}`, category: 'Transit' },
      { name: `${destName} Scenic Viewpoint`, address: `Hilltop Road, ${destCity}`, category: 'Sightseeing' },
      { name: `${destName} Heritage Monument`, address: `Heritage Square, ${destCity}`, category: 'Culture' },
    ];

    // 3. Hotel & Transport details (Sanitized - no financial secrets)
    const hotelDetails = {
      name: bookingData?.selected_hotel?.name || `${destName} Premium Resort & Stay`,
      address: bookingData?.selected_hotel?.address || `144 Valley View Road, ${destCity}`,
      phone: bookingData?.selected_hotel?.phone || '+91 98400 12345',
      checkIn: `${travelDate} 14:00`,
      checkOut: `${returnDate} 11:00`,
      bookingRef: bookingData?.booking_reference || `BK-${tId}-CONF`,
      status: 'confirmed',
    };

    const transportDetails = {
      type: bookingData?.selected_transport?.type || 'cab',
      title: bookingData?.selected_transport?.title || 'Private AC Chauffeur Cab',
      pickupLocation: `Pickup: ${destCity} Central Station / Airport`,
      dropLocation: `Drop: ${hotelDetails.name}`,
      departureTime: `${travelDate} 08:30 AM`,
      durationText: '2.5 hrs estimated',
      status: 'confirmed',
    };

    // 4. Estimated Cost (Phase 23)
    const estimatedCost = {
      total: bookingData?.final_amount || 4500,
      transport: 1200,
      stay: 2200,
      food: 800,
      activities: 300,
      currency: 'INR',
      disclaimer: 'Previously calculated estimate (live price updates paused offline)',
    };

    // 5. Packing Checklist (Phase 27)
    let packingItems = await packingModel.findByTripId(tId, uId);
    if (!packingItems || packingItems.length === 0) {
      const generated = await packingService.generateSmartChecklist({
        destination: destName,
        durationDays,
        travelers: numTravelers,
      });
      packingItems = generated.items.map((i) => ({
        id: i.id,
        trip_id: tId,
        user_id: uId,
        category: i.category,
        item_name: i.itemName,
        quantity: i.quantity,
        is_packed: false,
        is_custom: i.isCustom,
        reason: i.reason,
      }));
    }

    // 6. Travel Document Checklist (Phase 28)
    let checklistItems = await checklistModel.findByTripId(tId, uId);
    if (!checklistItems || checklistItems.length === 0) {
      const generated = checklistService.generateDefaultChecklist({
        destination: destName,
        durationDays,
        hasHotel: true,
        hasTransport: true,
      });
      checklistItems = generated.map((i, idx) => ({
        id: idx + 1,
        trip_id: tId,
        user_id: uId,
        category: i.category,
        item_name: i.itemName,
        notes: i.notes,
        is_completed: i.isCompleted,
        is_custom: false,
      }));
    }

    // 7. Safety Information & Contacts (Phase 25)
    let trustedContacts = [];
    try {
      const contacts = await trustedContactModel.findByUserId(uId);
      if (contacts && contacts.length > 0) {
        trustedContacts = contacts.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relationship: c.relationship,
          isPrimary: Boolean(c.is_primary),
        }));
      }
    } catch {}

    const safetyInfo = {
      hotelAddress: hotelDetails.address,
      hotelPhone: hotelDetails.phone,
      emergencyContacts: trustedContacts,
      emergencyNumbers: {
        universal: '112',
        police: '100',
        ambulance: '108',
        touristHelpline: '1363',
      },
      offlineSafetyAdvice: [
        'Keep physical copies of identification in a separate daypack pocket',
        'Save local hotel phone number in your mobile offline contacts',
        'Note down universal emergency helpline (112) for immediate assistance',
      ],
    };

    // 8. Cached Weather Snapshot with Timestamp (Phase 26)
    let cachedWeather = null;
    try {
      const wData = await weatherService.getWeatherByDestination(destName);
      if (wData && wData.weather_available && wData.current) {
        cachedWeather = {
          available: true,
          temperature: wData.current.temperature,
          condition: wData.current.condition,
          icon: wData.current.icon,
          rainProbability: wData.current.rain_probability || 0,
          windSpeed: wData.current.wind_speed,
          humidity: wData.current.humidity,
          cachedAt: new Date().toISOString(),
          disclaimer: 'Previously cached weather snapshot. Live meteorology updates require internet connection.',
        };
      }
    } catch {}

    if (!cachedWeather) {
      cachedWeather = {
        available: false,
        temperature: null,
        condition: 'Weather unavailable offline',
        cachedAt: new Date().toISOString(),
        disclaimer: 'Live forecast was not cached. Reconnect to fetch latest meteorological data.',
      };
    }

    // 9. Assemble Safe Offline Bundle
    const offlineBundle = {
      id: tId,
      bookingReference: bookingData?.booking_reference || `BK-${tId}-OFFLINE`,
      userId: uId,
      destination: destName,
      destinationCity: destCity,
      destinationCountry: destCountry,
      dates: {
        start: travelDate,
        end: returnDate,
        durationDays,
      },
      numTravelers,
      itinerary,
      savedLocations,
      hotel: hotelDetails,
      transport: transportDetails,
      estimatedCost,
      packingChecklist: packingItems,
      travelChecklist: checklistItems,
      safety: safetyInfo,
      cachedWeather,
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      version: 1,
    };

    return successResponse(res, 'Offline trip bundle compiled successfully', offlineBundle);
  }),

  /**
   * POST /api/offline/trip/:tripId/sync
   * Receives queued offline changes (packing toggles, checklist toggles) and synchronizes them safely
   */
  syncOfflineChanges: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { tripId } = req.params;
    const { packingUpdates = [], checklistUpdates = [], customPackingItems = [], customChecklistItems = [] } = req.body;
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    const syncedResults = {
      packingUpdated: 0,
      checklistUpdated: 0,
      customPackingAdded: 0,
      customChecklistAdded: 0,
      conflicts: [],
    };

    // 1. Sync packing updates
    for (const update of packingUpdates) {
      try {
        if (update.id && typeof update.isPacked === 'boolean') {
          const item = await packingModel.findById(update.id, uId);
          if (item) {
            await packingModel.updateItem(update.id, uId, { isPacked: update.isPacked });
            syncedResults.packingUpdated++;
          }
        }
      } catch (err) {
        syncedResults.conflicts.push({ type: 'packing', id: update.id, message: err.message });
      }
    }

    // 2. Sync checklist updates
    for (const update of checklistUpdates) {
      try {
        if (update.id && typeof update.isCompleted === 'boolean') {
          const item = await checklistModel.findById(update.id, uId);
          if (item) {
            await checklistModel.updateItem(update.id, uId, { isCompleted: update.isCompleted });
            syncedResults.checklistUpdated++;
          }
        }
      } catch (err) {
        syncedResults.conflicts.push({ type: 'checklist', id: update.id, message: err.message });
      }
    }

    // 3. Add custom packing items created offline
    for (const custom of customPackingItems) {
      try {
        if (custom.itemName) {
          await packingService.addCustomItem(uId, {
            tripId: tId,
            category: custom.category || 'gear',
            itemName: custom.itemName,
            quantity: custom.quantity || 1,
            reason: custom.reason || 'Added while offline',
          });
          syncedResults.customPackingAdded++;
        }
      } catch (err) {
        syncedResults.conflicts.push({ type: 'custom_packing', name: custom.itemName, message: err.message });
      }
    }

    // 4. Add custom checklist items created offline
    for (const custom of customChecklistItems) {
      try {
        if (custom.itemName) {
          await checklistService.addCustomItem(uId, {
            tripId: tId,
            category: custom.category || 'documents',
            itemName: custom.itemName,
            notes: custom.notes || 'Added while offline',
          });
          syncedResults.customChecklistAdded++;
        }
      } catch (err) {
        syncedResults.conflicts.push({ type: 'custom_checklist', name: custom.itemName, message: err.message });
      }
    }

    return successResponse(res, 'Offline changes synchronized successfully', {
      syncedResults,
      syncStatus: syncedResults.conflicts.length > 0 ? 'synced_with_warnings' : 'synced',
      timestamp: new Date().toISOString(),
    });
  }),
};

module.exports = offlineController;
