const packingModel = require('../models/packingModel');
const weatherService = require('./weatherService');
const tripModel = require('../models/tripModel');
const bookingModel = require('../models/bookingModel');

const CATEGORIES = [
  { id: 'clothing', label: '👕 Clothing', icon: '👕' },
  { id: 'documents', label: '📄 Travel Documents', icon: '📄' },
  { id: 'personal', label: '🧴 Personal Items', icon: '🧴' },
  { id: 'electronics', label: '📱 Electronics', icon: '📱' },
  { id: 'essentials', label: '💊 Essentials', icon: '💊' },
  { id: 'gear', label: '🎒 Travel Gear', icon: '🎒' },
  { id: 'weather', label: '☔ Weather Items', icon: '☔' },
  { id: 'activity', label: '🎯 Activity Gear', icon: '🎯' },
];

const packingService = {
  CATEGORIES,

  /**
   * Generates smart, personalized packing checklist items based on trip details, live weather, and activities
   */
  async generateSmartChecklist({
    destination = 'Mahabalipuram',
    durationDays = 3,
    tripType = 'nature',
    travelers = 2,
    transportType = 'cab',
    activities = [],
    weatherForecast = null,
  }) {
    const days = Math.max(1, parseInt(durationDays, 10) || 3);
    const numTravelers = Math.max(1, parseInt(travelers, 10) || 1);
    const items = [];

    // 1. Fetch live destination weather from Phase 26 if not supplied
    let weatherData = weatherForecast;
    let weatherReason = null;

    if (!weatherData && destination) {
      try {
        const destName = typeof destination === 'object' ? destination.name : destination;
        weatherData = await weatherService.getWeatherByDestination(destName);
      } catch (err) {
        // Fallback gracefully without breaking
        weatherData = null;
      }
    }

    // ----------------------------------------------------
    // CATEGORY 1: 👕 CLOTHING (Scaled by Duration)
    // ----------------------------------------------------
    const tShirtCount = days <= 3 ? days + 1 : days <= 7 ? days + 2 : Math.min(10, days + 2);
    const undergarmentCount = days + 1;
    const pantsCount = days <= 3 ? 2 : days <= 7 ? 3 : Math.min(5, Math.ceil(days / 2));
    const socksCount = days <= 3 ? days : Math.min(7, days);

    items.push({
      category: 'clothing',
      itemName: 'Comfortable Cotton T-Shirts / Tops',
      quantity: tShirtCount,
      isCustom: false,
      reason: `Appropriate quantity for a ${days}-day trip`,
    });

    items.push({
      category: 'clothing',
      itemName: 'Undergarments',
      quantity: undergarmentCount,
      isCustom: false,
      reason: 'Essential daily changes',
    });

    items.push({
      category: 'clothing',
      itemName: 'Pants / Jeans / Bottoms',
      quantity: pantsCount,
      isCustom: false,
      reason: `Comfortable travel bottoms for ${days} days`,
    });

    items.push({
      category: 'clothing',
      itemName: 'Pairs of Socks',
      quantity: socksCount,
      isCustom: false,
      reason: 'Fresh pairs for walking and excursions',
    });

    items.push({
      category: 'clothing',
      itemName: 'Comfortable Walking Shoes / Sneakers',
      quantity: 1,
      isCustom: false,
      reason: 'For daytime sightseeing and walking',
    });

    items.push({
      category: 'clothing',
      itemName: 'Nightwear / Sleepwear Sets',
      quantity: Math.min(3, Math.ceil(days / 2)),
      isCustom: false,
      reason: 'Comfortable night attire',
    });

    if (days >= 5) {
      items.push({
        category: 'clothing',
        itemName: 'Light Jacket / Cardigan',
        quantity: 1,
        isCustom: false,
        reason: 'For air-conditioned transit and cooler evenings',
      });
      items.push({
        category: 'clothing',
        itemName: 'Laundry Bag / Travel Wash Pouch',
        quantity: 1,
        isCustom: false,
        reason: 'To keep worn clothes separated during multi-day trip',
      });
    }

    // ----------------------------------------------------
    // CATEGORY 2: 📄 TRAVEL DOCUMENTS (Strictly Non-Sensitive)
    // ----------------------------------------------------
    items.push({
      category: 'documents',
      itemName: 'Government Photo ID / Passport (Physical & Digital)',
      quantity: 1,
      isCustom: false,
      reason: 'Mandatory identification for transit boarding and hotel check-in',
    });

    items.push({
      category: 'documents',
      itemName: 'Travelora Booking Confirmation & Vouchers',
      quantity: 1,
      isCustom: false,
      reason: 'Trip confirmation references and stay vouchers',
    });

    items.push({
      category: 'documents',
      itemName: 'Hotel & Stay Details / Address Card',
      quantity: 1,
      isCustom: false,
      reason: 'Quick reference for local transit and arrival',
    });

    if (transportType === 'flight' || transportType === 'train') {
      items.push({
        category: 'documents',
        itemName: `${transportType === 'flight' ? 'Flight Boarding Pass / E-Ticket' : 'Train E-Ticket / PNR Details'}`,
        quantity: 1,
        isCustom: false,
        reason: 'Required for entry and seat check-in',
      });
    }

    items.push({
      category: 'documents',
      itemName: 'Emergency Contacts & Travel Insurance Card',
      quantity: 1,
      isCustom: false,
      reason: 'Quick emergency contact details for peace of mind',
    });

    // ----------------------------------------------------
    // CATEGORY 3: 🧴 PERSONAL ITEMS
    // ----------------------------------------------------
    items.push({
      category: 'personal',
      itemName: 'Toothbrush & Travel Toothpaste',
      quantity: 1,
      isCustom: false,
      reason: 'Daily hygiene essential',
    });

    items.push({
      category: 'personal',
      itemName: 'Deodorant / Body Spray',
      quantity: 1,
      isCustom: false,
      reason: 'Freshness during daytime sightseeing',
    });

    items.push({
      category: 'personal',
      itemName: 'Travel Size Shampoo & Body Wash',
      quantity: 1,
      isCustom: false,
      reason: 'Personal toiletries kit',
    });

    items.push({
      category: 'personal',
      itemName: 'Hair Comb / Brush',
      quantity: 1,
      isCustom: false,
      reason: 'Grooming essential',
    });

    items.push({
      category: 'personal',
      itemName: 'Moisturizer & Lip Balm',
      quantity: 1,
      isCustom: false,
      reason: 'Skin hydration during travel',
    });

    // ----------------------------------------------------
    // CATEGORY 4: 📱 ELECTRONICS
    // ----------------------------------------------------
    items.push({
      category: 'electronics',
      itemName: 'Smartphone & High-Speed Charging Cable',
      quantity: 1,
      isCustom: false,
      reason: 'Daily communication, maps, and camera',
    });

    items.push({
      category: 'electronics',
      itemName: 'Portable Power Bank (10,000mAh+)',
      quantity: 1,
      isCustom: false,
      reason: 'Keeps devices powered during long outdoor explorations',
    });

    items.push({
      category: 'electronics',
      itemName: 'Headphones / Earphones',
      quantity: 1,
      isCustom: false,
      reason: 'Entertainment and audio guides during travel',
    });

    if (days >= 4) {
      items.push({
        category: 'electronics',
        itemName: 'Multi-Port USB Wall Adapter',
        quantity: 1,
        isCustom: false,
        reason: 'Allows charging multiple traveler devices simultaneously',
      });
    }

    // ----------------------------------------------------
    // CATEGORY 5: 💊 ESSENTIALS
    // ----------------------------------------------------
    items.push({
      category: 'essentials',
      itemName: 'Personal Daily Prescription Medications',
      quantity: 1,
      isCustom: false,
      reason: 'Personal prescribed medications with original packaging',
    });

    items.push({
      category: 'essentials',
      itemName: 'First-Aid Basics (Band-Aids, Antiseptic Wipes, Pain Relief)',
      quantity: 1,
      isCustom: false,
      reason: 'General travel wellness kit',
    });

    items.push({
      category: 'essentials',
      itemName: 'Pocket Hand Sanitizer & Disinfectant Wipes',
      quantity: 2,
      isCustom: false,
      reason: 'Hygiene before dining and after transit',
    });

    items.push({
      category: 'essentials',
      itemName: 'Electrolyte ORS Packets',
      quantity: Math.max(2, days),
      isCustom: false,
      reason: 'Maintains hydration during warm walks and activities',
    });

    // ----------------------------------------------------
    // CATEGORY 6: 🎒 TRAVEL GEAR
    // ----------------------------------------------------
    items.push({
      category: 'gear',
      itemName: 'Lightweight Daypack / Crossbody Bag',
      quantity: 1,
      isCustom: false,
      reason: 'Carries water, documents, and camera during excursions',
    });

    items.push({
      category: 'gear',
      itemName: 'Reusable Stainless Steel Water Bottle',
      quantity: 1,
      isCustom: false,
      reason: 'Eco-friendly hydration throughout your journeys',
    });

    items.push({
      category: 'gear',
      itemName: 'Foldable Eco Shopping / Souvenir Tote',
      quantity: 1,
      isCustom: false,
      reason: 'Useful for local markets, crafts, and souvenirs',
    });

    // ----------------------------------------------------
    // CATEGORY 7: ☔ WEATHER-BASED ITEMS (Live Phase 26 Data)
    // ----------------------------------------------------
    const curr = weatherData?.current;
    const temp = curr?.temperature !== undefined ? curr.temperature : 25;
    const rainProb = curr?.rain_probability || 0;
    const isRainy = curr?.is_rainy || rainProb >= 35;

    if (isRainy) {
      weatherReason = `Rain is possible during your trip (${rainProb}% rain forecast), so rain protection has been added.`;
      items.push({
        category: 'weather',
        itemName: 'Compact Windproof Umbrella',
        quantity: 1,
        isCustom: false,
        reason: `Rain forecast (${rainProb}% chance) for destination`,
      });
      items.push({
        category: 'weather',
        itemName: 'Waterproof Rain Poncho / Jacket',
        quantity: 1,
        isCustom: false,
        reason: 'Keeps you completely dry during sudden downpours',
      });
      items.push({
        category: 'weather',
        itemName: 'Waterproof Phone Pouch / Dry Bag',
        quantity: 1,
        isCustom: false,
        reason: 'Protects phone and electronics from rain moisture',
      });
    }

    if (temp <= 18) {
      const coldReason = `Cooler temperatures forecast (${temp}°C) for your destination.`;
      weatherReason = weatherReason ? `${weatherReason} ${coldReason}` : coldReason;
      items.push({
        category: 'weather',
        itemName: 'Warm Fleece Jacket / Woolen Sweater',
        quantity: 1,
        isCustom: false,
        reason: `Pleasantly chilly weather (${temp}°C) forecast`,
      });
      if (temp <= 12) {
        items.push({
          category: 'weather',
          itemName: 'Thermal Innerwear Set',
          quantity: 1,
          isCustom: false,
          reason: `Cold temperatures (${temp}°C) in the morning and evening`,
        });
        items.push({
          category: 'weather',
          itemName: 'Woolen Beanie / Scarf & Gloves',
          quantity: 1,
          isCustom: false,
          reason: 'Protects against chilly winds',
        });
      }
    }

    if (temp >= 28 || !isRainy) {
      const sunReason = `Sunny & warm weather forecast (${temp}°C).`;
      weatherReason = weatherReason ? `${weatherReason} ${sunReason}` : sunReason;
      items.push({
        category: 'weather',
        itemName: 'UV-Protection Polarized Sunglasses',
        quantity: 1,
        isCustom: false,
        reason: 'Protects eyes from bright sunlight and glare',
      });
      items.push({
        category: 'weather',
        itemName: 'Broad-Spectrum Sunscreen (SPF 50+)',
        quantity: 1,
        isCustom: false,
        reason: 'Protects skin during outdoor sightseeing',
      });
      items.push({
        category: 'weather',
        itemName: 'Wide-Brim Sun Hat / Breathable Cap',
        quantity: 1,
        isCustom: false,
        reason: 'Provides shade during sunny walking tours',
      });
    }

    // ----------------------------------------------------
    // CATEGORY 8: 🎯 ACTIVITY-BASED ITEMS (From Itinerary/Trip Style)
    // ----------------------------------------------------
    const actList = Array.isArray(activities)
      ? activities.map((a) => (typeof a === 'string' ? a.toLowerCase() : String(a?.theme || a?.title || a?.type || '').toLowerCase()))
      : [];
    const style = String(tripType || '').toLowerCase();
    const destStr = String(destination?.name || destination || '').toLowerCase();

    // Check Trekking / Adventure
    if (style.includes('adventure') || style.includes('trek') || actList.some((a) => a.includes('trek') || a.includes('hike') || a.includes('climb') || a.includes('safari') || a.includes('peak'))) {
      items.push({
        category: 'activity',
        itemName: 'Trekking / Trail Grip Shoes',
        quantity: 1,
        isCustom: false,
        reason: 'Essential for nature trails, hillside walks and trekking paths',
      });
      items.push({
        category: 'activity',
        itemName: 'Mini LED Flashlight / Headlamp',
        quantity: 1,
        isCustom: false,
        reason: 'Safe illumination for early morning or evening treks',
      });
      items.push({
        category: 'activity',
        itemName: 'Breathable Quick-Dry Trekking Pants',
        quantity: 2,
        isCustom: false,
        reason: 'Comfortable movement on trails and outdoor climbs',
      });
    }

    // Check Beach / Coastal / Watersports
    if (style.includes('beach') || destStr.includes('beach') || destStr.includes('goa') || destStr.includes('bali') || actList.some((a) => a.includes('beach') || a.includes('swim') || a.includes('boat') || a.includes('surf') || a.includes('coastal') || a.includes('shore'))) {
      items.push({
        category: 'activity',
        itemName: 'Swimwear / Board Shorts',
        quantity: 2,
        isCustom: false,
        reason: 'For beach lounging, swimming, and watersports',
      });
      items.push({
        category: 'activity',
        itemName: 'Quick-Dry Microfiber Beach Towel',
        quantity: 1,
        isCustom: false,
        reason: 'Compact and absorbs moisture quickly on coastal trips',
      });
      items.push({
        category: 'activity',
        itemName: 'Waterproof Beach Slippers / Flip-Flops',
        quantity: 1,
        isCustom: false,
        reason: 'Easy to walk on sandy shores and seaside strolls',
      });
    }

    // Check Temple / Heritage / Cultural
    if (style.includes('historical') || style.includes('heritage') || actList.some((a) => a.includes('temple') || a.includes('heritage') || a.includes('monument') || a.includes('church') || a.includes('palace') || a.includes('museum') || a.includes('unesco'))) {
      items.push({
        category: 'activity',
        itemName: 'Modest Clothing / Temple Shawl / Scarf',
        quantity: 1,
        isCustom: false,
        reason: 'Required for respectful entry at spiritual & sacred heritage sites',
      });
      items.push({
        category: 'activity',
        itemName: 'Easy Slip-On Shoes (Convenient Footwear)',
        quantity: 1,
        isCustom: false,
        reason: 'Quick to take off and put on at temple entrances',
      });
    }

    // Check Photography / Scenic
    if (actList.some((a) => a.includes('photo') || a.includes('viewpoint') || a.includes('sunset') || a.includes('camera')) || style.includes('nature')) {
      items.push({
        category: 'activity',
        itemName: 'Camera & Spare Memory Card (SD)',
        quantity: 1,
        isCustom: false,
        reason: 'Capture high-resolution vacation memories and scenic landscapes',
      });
      items.push({
        category: 'activity',
        itemName: 'Lens Cleaning Microfiber Cloth',
        quantity: 1,
        isCustom: false,
        reason: 'Keeps camera lenses and smartphone cameras smudge-free',
      });
    }

    // Check Family / Kids
    if (style.includes('family') || numTravelers >= 4) {
      items.push({
        category: 'activity',
        itemName: 'Travel Games / Playing Cards / Activity Kit',
        quantity: 1,
        isCustom: false,
        reason: 'Entertainment during transit and family downtime',
      });
      items.push({
        category: 'activity',
        itemName: 'Healthy Travel Snacks Pouch',
        quantity: 1,
        isCustom: false,
        reason: 'Quick energy for travelers on the move',
      });
    }

    // ----------------------------------------------------
    // Transport specific items (Feature 18)
    // ----------------------------------------------------
    if (transportType === 'flight' || transportType === 'train' || transportType === 'bus') {
      items.push({
        category: 'gear',
        itemName: 'Inflatable Travel Neck Pillow & Eye Mask',
        quantity: 1,
        isCustom: false,
        reason: `Comfortable rest during ${transportType} travel`,
      });
    }

    return {
      destination: typeof destination === 'object' ? destination.name : destination,
      durationDays: days,
      tripType,
      travelers: numTravelers,
      weather: weatherData?.current || null,
      weatherReason: weatherReason || 'General packing list tailored to destination climate',
      categories: CATEGORIES,
      items: items.map((item, idx) => ({
        id: idx + 1,
        ...item,
        isPacked: false,
      })),
      totalItems: items.length,
    };
  },

  /**
   * Retrieves packing checklist for a user's trip, or auto-generates if not saved yet
   */
  async getTripPackingList(tripId, userId, tripContext = {}) {
    if (!userId) {
      const error = new Error('User ID is required to access packing assistant');
      error.statusCode = 401;
      throw error;
    }

    const savedItems = await packingModel.findByTripId(tripId, userId);

    if (savedItems && savedItems.length > 0) {
      const packedCount = savedItems.filter((i) => i.is_packed).length;
      const totalCount = savedItems.length;
      const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

      // Group by category
      const categoriesMap = {};
      CATEGORIES.forEach((c) => {
        categoriesMap[c.id] = {
          ...c,
          items: [],
          packedCount: 0,
          totalCount: 0,
        };
      });

      savedItems.forEach((item) => {
        const catId = item.category || 'essentials';
        if (!categoriesMap[catId]) {
          categoriesMap[catId] = {
            id: catId,
            label: catId.toUpperCase(),
            icon: '📦',
            items: [],
            packedCount: 0,
            totalCount: 0,
          };
        }
        categoriesMap[catId].items.push(item);
        categoriesMap[catId].totalCount++;
        if (item.is_packed) {
          categoriesMap[catId].packedCount++;
        }
      });

      return {
        tripId: parseInt(tripId, 10),
        isSaved: true,
        totalItems: totalCount,
        packedItems: packedCount,
        remainingItems: totalCount - packedCount,
        progressPercentage: progressPercent,
        categories: Object.values(categoriesMap),
        items: savedItems,
      };
    }

    // Auto-generate fresh checklist from trip details
    let destName = tripContext.destinationName || tripContext.destination || 'Mahabalipuram';
    let duration = tripContext.durationDays || tripContext.numberOfDays || 3;
    let tripType = tripContext.tripType || tripContext.travelPreference || 'nature';
    let travelers = tripContext.travelers || tripContext.numTravelers || 2;
    let transportType = tripContext.transportType || 'cab';
    let activities = tripContext.activities || [];

    // If tripId is provided, try looking up real booking or trip
    if (tripId) {
      try {
        const booking = await bookingModel.findById(tripId);
        if (booking && (booking.user_id === parseInt(userId, 10) || !booking.user_id)) {
          destName = booking.destination_name || destName;
          travelers = booking.num_travelers || travelers;
          if (booking.selected_transport?.type) {
            transportType = booking.selected_transport.type;
          }
        }
      } catch {}
    }

    const generated = await this.generateSmartChecklist({
      destination: destName,
      durationDays: duration,
      tripType,
      travelers,
      transportType,
      activities,
    });

    const packedCount = 0;
    const totalCount = generated.items.length;

    // Group generated items
    const categoriesMap = {};
    CATEGORIES.forEach((c) => {
      categoriesMap[c.id] = {
        ...c,
        items: [],
        packedCount: 0,
        totalCount: 0,
      };
    });

    generated.items.forEach((item) => {
      const catId = item.category || 'essentials';
      if (!categoriesMap[catId]) {
        categoriesMap[catId] = {
          id: catId,
          label: catId.toUpperCase(),
          icon: '📦',
          items: [],
          packedCount: 0,
          totalCount: 0,
        };
      }
      categoriesMap[catId].items.push(item);
      categoriesMap[catId].totalCount++;
    });

    return {
      tripId: tripId ? parseInt(tripId, 10) : null,
      isSaved: false,
      destination: generated.destination,
      durationDays: generated.durationDays,
      tripType: generated.tripType,
      travelers: generated.travelers,
      weather: generated.weather,
      weatherReason: generated.weatherReason,
      totalItems: totalCount,
      packedItems: packedCount,
      remainingItems: totalCount,
      progressPercentage: 0,
      categories: Object.values(categoriesMap),
      items: generated.items,
    };
  },

  /**
   * Saves the entire packing checklist for a user's trip
   */
  async savePackingList(tripId, userId, items = []) {
    if (!userId) {
      const error = new Error('User ID is required to save packing items');
      error.statusCode = 401;
      throw error;
    }
    if (!tripId) {
      const error = new Error('Trip ID is required to save packing items');
      error.statusCode = 400;
      throw error;
    }

    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    // Clear previous items for this trip
    await packingModel.clearByTripId(tId, uId);

    // Bulk insert new items
    const formatted = items.map((item) => ({
      tripId: tId,
      bookingId: tId,
      userId: uId,
      category: item.category || 'essentials',
      itemName: item.itemName || item.item_name || 'Item',
      quantity: Math.max(1, parseInt(item.quantity || 1, 10)),
      isPacked: Boolean(item.isPacked || item.is_packed),
      isCustom: Boolean(item.isCustom || item.is_custom),
      reason: item.reason || null,
    }));

    const saved = await packingModel.bulkCreateItems(formatted);
    return this.getTripPackingList(tId, uId);
  },

  /**
   * Toggles the packed state of a single item
   */
  async toggleItemPacked(itemId, userId) {
    if (!userId || !itemId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const updated = await packingModel.togglePacked(itemId, userId);
    if (!updated) {
      const error = new Error('Packing item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * Adds a custom item to a user's trip checklist
   */
  async addCustomItem(userId, { tripId, category = 'gear', itemName, quantity = 1, reason = 'User custom item' }) {
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

    const cleanQty = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));

    const item = await packingModel.createItem({
      tripId: tripId ? parseInt(tripId, 10) : null,
      bookingId: tripId ? parseInt(tripId, 10) : null,
      userId: parseInt(userId, 10),
      category: category || 'gear',
      itemName: itemName.trim(),
      quantity: cleanQty,
      isPacked: false,
      isCustom: true,
      reason: reason || 'Custom added item',
    });

    return item;
  },

  /**
   * Updates an existing custom item (name, quantity, category)
   */
  async updateItem(itemId, userId, updates = {}) {
    if (!itemId || !userId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    if (updates.quantity !== undefined) {
      updates.quantity = Math.max(1, Math.min(99, parseInt(updates.quantity, 10) || 1));
    }
    if (updates.itemName !== undefined && !updates.itemName.trim()) {
      const error = new Error('Item name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    const updated = await packingModel.updateItem(itemId, userId, updates);
    if (!updated) {
      const error = new Error('Packing item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  },

  /**
   * Deletes a packing item
   */
  async deleteItem(itemId, userId) {
    if (!itemId || !userId) {
      const error = new Error('Item ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const deleted = await packingModel.deleteItem(itemId, userId);
    if (!deleted) {
      const error = new Error('Packing item not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, id: itemId };
  },
};

module.exports = packingService;
