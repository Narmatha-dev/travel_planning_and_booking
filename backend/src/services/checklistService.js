const checklistModel = require('../models/checklistModel');
const bookingModel = require('../models/bookingModel');
const tripModel = require('../models/tripModel');
const packingModel = require('../models/packingModel');
const weatherService = require('./weatherService');
const trustedContactModel = require('../models/trustedContactModel');

const CATEGORIES = [
  { id: 'identification', label: '🪪 Identification', icon: '🪪' },
  { id: 'transport', label: '🎫 Transport Documents', icon: '🎫' },
  { id: 'hotel', label: '🏨 Hotel & Stay', icon: '🏨' },
  { id: 'activities', label: '🎟️ Activity Bookings', icon: '🎟️' },
  { id: 'documents', label: '📄 Other Travel Documents', icon: '📄' },
  { id: 'pre_trip', label: '📋 Pre-Trip Preparation', icon: '📋' },
];

/**
 * Sanitizes user notes to ensure no sensitive passwords, financial codes, or ID numbers are saved
 */
function sanitizeNotes(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(/(?:password|pwd|pin|cvv|cvc)\s*[:=]\s*\S+/gi, '[REDACTED]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD NUMBER REDACTED]')
    .slice(0, 255);
}

const checklistService = {
  CATEGORIES,

  /**
   * Generates default pre-trip checklist items based on trip details and destination
   */
  generateDefaultChecklist({
    destination = 'Mahabalipuram',
    durationDays = 3,
    transportType = 'cab',
    hasHotel = false,
    hasTransport = false,
  }) {
    const items = [];

    // 1. 🪪 Identification
    items.push({
      category: 'identification',
      itemName: 'Government Photo ID / Passport (Physical & Digital Copy)',
      notes: 'Required for security check-in, boarding, and hotel verification',
      isCompleted: false,
      isCustom: false,
    });
    items.push({
      category: 'identification',
      itemName: "Driver's License / Student or Work ID (if applicable)",
      notes: 'Useful for vehicle rentals, student discounts, and auxiliary ID',
      isCompleted: false,
      isCustom: false,
    });

    // 2. 🎫 Transport
    items.push({
      category: 'transport',
      itemName: `${transportType === 'flight' ? 'Flight E-Ticket & Boarding Pass' : transportType === 'train' ? 'Train E-Ticket & PNR Confirmation' : 'Cab / Bus Booking Confirmation Voucher'}`,
      notes: hasTransport ? 'Transport booking is confirmed' : 'Confirm seat reservation details',
      isCompleted: hasTransport,
      isCustom: false,
    });
    items.push({
      category: 'transport',
      itemName: 'Local Transit / Taxi Booking App Ready',
      notes: 'Ensure pickup location and driver contact details are accessible',
      isCompleted: false,
      isCustom: false,
    });

    // 3. 🏨 Hotel & Stay
    items.push({
      category: 'hotel',
      itemName: 'Hotel / Resort Reservation Confirmation Voucher',
      notes: hasHotel ? 'Hotel booking voucher confirmed' : 'Ensure check-in date & time are confirmed',
      isCompleted: hasHotel,
      isCustom: false,
    });
    items.push({
      category: 'hotel',
      itemName: 'Hotel Address & Contact Phone Saved Offline',
      notes: 'Helpful for cab navigation and arrival check-in',
      isCompleted: false,
      isCustom: false,
    });

    // 4. 🎟️ Activities
    items.push({
      category: 'activities',
      itemName: 'Sightseeing / Heritage Monument Entry Tickets',
      notes: 'Pre-book online tickets to skip queue lines at popular sights',
      isCompleted: false,
      isCustom: false,
    });

    // 5. 📄 Other Documents
    items.push({
      category: 'documents',
      itemName: 'Travel Insurance Policy & Emergency Contact Card',
      notes: 'Keep policy number and helpline contact handy',
      isCompleted: false,
      isCustom: false,
    });
    items.push({
      category: 'documents',
      itemName: 'Doctor Prescriptions for Personal Medications',
      notes: 'Carry written prescriptions matching your travel medicines',
      isCompleted: false,
      isCustom: false,
    });

    // 6. 📋 Pre-Trip Preparation Checklist
    items.push({
      category: 'pre_trip',
      itemName: 'Confirm Transport Timings & Pickup Location',
      notes: 'Double-check departure schedule 24 hours prior',
      isCompleted: hasTransport,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Confirm Hotel Check-in Policy & Early Arrival',
      notes: 'Notify hotel in advance if arriving late at night',
      isCompleted: hasHotel,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Review Day-by-Day AI Itinerary Schedule',
      notes: 'Verify opening times for key attractions on your schedule',
      isCompleted: true,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Check & Pack All Smart Packing Checklist Items',
      notes: 'Ensure all clothing, weather gear, and chargers are packed',
      isCompleted: false,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Check Live Weather Forecast for Travel Dates',
      notes: 'Review rain probabilities and pack weather protection accordingly',
      isCompleted: false,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Save Offline Maps & Destination Addresses on Phone',
      notes: 'Download offline Google Maps area for seamless navigation',
      isCompleted: false,
      isCustom: false,
    });
    items.push({
      category: 'pre_trip',
      itemName: 'Review Verified Emergency Hotlines & Trusted Contacts',
      notes: 'Ensure family contacts and 112 emergency services are verified',
      isCompleted: false,
      isCustom: false,
    });

    return items;
  },

  /**
   * Retrieves full checklist with cross-phase readiness metrics (Bookings, Packing, Weather, Itinerary, Safety)
   */
  async getTripChecklist(tripId, userId, tripContext = {}) {
    if (!userId) {
      const error = new Error('User ID is required to access travel checklist');
      error.statusCode = 401;
      throw error;
    }

    const tId = tripId ? parseInt(tripId, 10) : null;
    const uId = parseInt(userId, 10);

    // 1. Fetch Real Cross-Phase Data
    let bookingData = null;
    let tripData = null;
    let hasHotel = false;
    let hasTransport = false;
    let destName = tripContext.destinationName || tripContext.destination || 'Mahabalipuram';
    let duration = parseInt(tripContext.durationDays || tripContext.numberOfDays || 3, 10);
    let transportType = 'cab';

    if (tId) {
      try {
        const booking = await bookingModel.findById(tId);
        if (booking && (booking.user_id === uId || !booking.user_id)) {
          bookingData = booking;
          destName = booking.destination_name || destName;
          hasHotel = Boolean(booking.selected_hotel || booking.hotel_id);
          hasTransport = Boolean(booking.selected_transport || booking.transport_type);
          if (booking.selected_transport?.type) {
            transportType = booking.selected_transport.type;
          }
        }
      } catch {}

      try {
        const trip = await tripModel.findById(tId);
        if (trip && (trip.user_id === uId || !trip.user_id)) {
          tripData = trip;
          destName = trip.destination_name || trip.destination_city || destName;
          if (trip.itineraries?.length > 0) {
            duration = trip.itineraries.length;
          }
        }
      } catch {}
    }

    // 2. Fetch Cross-Phase Subsystem Statuses
    // A. Phase 27: Smart Packing Progress
    let packingStatus = { packed: 0, total: 0, percentage: 0, ready: false };
    try {
      const packingItems = await packingModel.findByTripId(tId, uId);
      if (packingItems && packingItems.length > 0) {
        const packed = packingItems.filter((i) => i.is_packed).length;
        const total = packingItems.length;
        const pct = Math.round((packed / total) * 100);
        packingStatus = {
          packed,
          total,
          percentage: pct,
          ready: packed === total && total > 0,
        };
      }
    } catch {}

    // B. Phase 26: Live Weather Status
    let weatherStatus = { checked: false, available: false, temp: null, condition: 'Unknown', rainChance: 0 };
    try {
      const wData = await weatherService.getWeatherByDestination(destName);
      if (wData && wData.weather_available && wData.current) {
        weatherStatus = {
          checked: true,
          available: true,
          temp: wData.current.temperature,
          condition: wData.current.condition,
          icon: wData.current.icon,
          rainChance: wData.current.rain_probability || 0,
          outdoorSuitability: wData.current.outdoor_suitability || 'Good',
        };
      }
    } catch {}

    // C. Phase 24: Itinerary Status
    const itineraryReady = Boolean(tripData?.itineraries?.length > 0 || bookingData);
    const itineraryStatus = {
      ready: itineraryReady,
      dayCount: tripData?.itineraries?.length || duration,
      title: tripData?.title || `${duration}-Day Trip to ${destName}`,
    };

    // D. Phase 25: Safety & Emergency Contacts
    let safetyStatus = { ready: false, contactsCount: 0 };
    try {
      const contacts = await trustedContactModel.findByUserId(uId);
      safetyStatus = {
        ready: contacts && contacts.length > 0,
        contactsCount: contacts ? contacts.length : 0,
      };
    } catch {}

    // 3. Load or Generate Checklist Items
    let items = await checklistModel.findByTripId(tId, uId);

    if (!items || items.length === 0) {
      const defaults = this.generateDefaultChecklist({
        destination: destName,
        durationDays: duration,
        transportType,
        hasHotel,
        hasTransport,
      });

      // If packing is already completed, mark packing item completed
      if (packingStatus.ready) {
        const packItem = defaults.find((i) => i.itemName.includes('Smart Packing'));
        if (packItem) packItem.isCompleted = true;
      }
      // If weather is available, mark weather check item completed
      if (weatherStatus.checked) {
        const wItem = defaults.find((i) => i.itemName.includes('Weather Forecast'));
        if (wItem) wItem.isCompleted = true;
      }
      // If safety contacts exist, mark safety item completed
      if (safetyStatus.ready) {
        const sItem = defaults.find((i) => i.itemName.includes('Emergency Hotlines'));
        if (sItem) sItem.isCompleted = true;
      }

      items = defaults.map((item, idx) => ({
        id: idx + 1,
        trip_id: tId,
        booking_id: tId,
        user_id: uId,
        category: item.category,
        item_name: item.itemName,
        notes: item.notes,
        is_completed: item.isCompleted,
        is_custom: false,
      }));
    }

    // 4. Calculate Dynamic Progress and Readiness Score
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.is_completed).length;
    const pendingCount = totalCount - completedCount;
    const readinessScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Group by category with progress count
    const categoriesMap = {};
    CATEGORIES.forEach((c) => {
      categoriesMap[c.id] = {
        ...c,
        items: [],
        completedCount: 0,
        totalCount: 0,
      };
    });

    items.forEach((item) => {
      const catId = item.category || 'documents';
      if (!categoriesMap[catId]) {
        categoriesMap[catId] = {
          id: catId,
          label: catId.toUpperCase(),
          icon: '📄',
          items: [],
          completedCount: 0,
          totalCount: 0,
        };
      }
      categoriesMap[catId].items.push(item);
      categoriesMap[catId].totalCount++;
      if (item.is_completed) {
        categoriesMap[catId].completedCount++;
      }
    });

    return {
      tripId: tId,
      destination: destName,
      durationDays: duration,
      bookingReference: bookingData?.booking_reference || null,
      travelDate: bookingData?.travel_date || tripData?.start_date || null,
      totalTasks: totalCount,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      readinessScore,
      isFullyReady: readinessScore === 100 && totalCount > 0,
      integrations: {
        hotel: {
          available: hasHotel,
          hotelName: bookingData?.selected_hotel?.name || 'Hotel stay details confirmed',
        },
        transport: {
          available: hasTransport,
          transportTitle: bookingData?.selected_transport?.title || `${transportType.toUpperCase()} confirmed`,
        },
        packing: packingStatus,
        weather: weatherStatus,
        itinerary: itineraryStatus,
        safety: safetyStatus,
      },
      categories: Object.values(categoriesMap),
      items,
    };
  },

  /**
   * Saves the entire checklist for a user's trip
   */
  async saveTripChecklist(tripId, userId, items = []) {
    if (!userId) {
      const error = new Error('User ID is required to save checklist');
      error.statusCode = 401;
      throw error;
    }
    if (!tripId) {
      const error = new Error('Trip ID is required to save checklist');
      error.statusCode = 400;
      throw error;
    }

    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    // Clear previous items
    await checklistModel.clearByTripId(tId, uId);

    // Format & bulk create
    const formatted = items.map((item) => ({
      tripId: tId,
      bookingId: tId,
      userId: uId,
      category: item.category || 'pre_trip',
      itemName: item.itemName || item.item_name || 'Checklist Item',
      notes: sanitizeNotes(item.notes),
      isCompleted: Boolean(item.isCompleted || item.is_completed),
      isCustom: Boolean(item.isCustom || item.is_custom),
    }));

    await checklistModel.bulkCreateItems(formatted);
    return this.getTripChecklist(tId, uId);
  },

  /**
   * Toggles the completed / ready state of an item
   */
  async toggleItemCompleted(itemId, userId) {
    if (!userId || !itemId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const updated = await checklistModel.toggleCompleted(itemId, userId);
    if (!updated) {
      const error = new Error('Checklist item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * Adds a custom checklist / document reminder
   */
  async addCustomItem(userId, { tripId, category = 'documents', itemName, notes = '' }) {
    if (!userId) {
      const error = new Error('User ID is required');
      error.statusCode = 401;
      throw error;
    }
    if (!itemName || !itemName.trim()) {
      const error = new Error('Item name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    const cleanNotes = sanitizeNotes(notes);

    const item = await checklistModel.createItem({
      tripId: tripId ? parseInt(tripId, 10) : null,
      bookingId: tripId ? parseInt(tripId, 10) : null,
      userId: parseInt(userId, 10),
      category: category || 'documents',
      itemName: itemName.trim(),
      notes: cleanNotes,
      isCompleted: false,
      isCustom: true,
    });

    return item;
  },

  /**
   * Updates an existing custom checklist item
   */
  async updateItem(itemId, userId, updates = {}) {
    if (!itemId || !userId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    if (updates.itemName !== undefined && !updates.itemName.trim()) {
      const error = new Error('Item name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (updates.notes !== undefined) {
      updates.notes = sanitizeNotes(updates.notes);
    }

    const updated = await checklistModel.updateItem(itemId, userId, updates);
    if (!updated) {
      const error = new Error('Checklist item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * Deletes a custom checklist item
   */
  async deleteItem(itemId, userId) {
    if (!itemId || !userId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const deleted = await checklistModel.deleteItem(itemId, userId);
    if (!deleted) {
      const error = new Error('Checklist item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, id: itemId };
  },
};

module.exports = checklistService;
