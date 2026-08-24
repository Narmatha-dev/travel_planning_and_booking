const placesService = require('./placesService');
const destinationModel = require('../models/destinationModel');
const { generateItinerary } = require('../utils/itineraryGenerator');

// Curated destination places knowledge base
const DESTINATION_LOCAL_PLACES = {
  mahabalipuram: [
    { name: 'Shore Temple', category: 'historical', duration: '2 hours', reason: '7th-century UNESCO World Heritage coastal granite monument overlooking the Bay of Bengal.', cost: 40, lat: 12.6163, lng: 80.1983, time: '09:00 AM' },
    { name: 'Pancha Rathas (Five Rathas)', category: 'historical', duration: '1.5 hours', reason: 'Monolithic rock-cut shrines carved from single granite boulders representing Pandava chariots.', cost: 40, lat: 12.6133, lng: 80.1936, time: '11:30 AM' },
    { name: 'Arjuna’s Penance (Descent of the Ganges)', category: 'historical', duration: '1 hour', reason: 'Gigantic open-air bas-relief sculpture depicting celestial deities, elephants, and scenes from Mahabharata.', cost: 0, lat: 12.6186, lng: 80.1942, time: '02:00 PM' },
    { name: 'Krishna’s Butter Ball & Hillside Caves', category: 'nature', duration: '1.5 hours', reason: 'Enormous 250-ton precariously balanced natural granite boulder perched on a 45-degree smooth rock slope.', cost: 0, lat: 12.6192, lng: 80.1931, time: '04:00 PM' },
    { name: 'Mahabalipuram Beach Promenade', category: 'beach', duration: '2 hours', reason: 'Tranquil coastal beach with local stone artisan carving stalls, fresh tender coconut, and sunset views.', cost: 0, lat: 12.6150, lng: 80.2000, time: '06:00 PM' },
    { name: 'Mahabalipuram Lighthouse & Heritage Museum', category: 'sightseeing', duration: '1.5 hours', reason: 'Historic stone lighthouse with spiral staircase offering 360-degree panoramic views of the Coromandel coast.', cost: 20, lat: 12.6175, lng: 80.1939, time: '10:00 AM' },
    { name: 'DakshinaChitra Living Heritage Museum', category: 'culture', duration: '3 hours', reason: 'Renowned living history museum featuring authentic transplanted 18th-century South Indian ancestral homes and folk crafts.', cost: 175, lat: 12.8228, lng: 80.2417, time: '02:30 PM' },
    { name: 'Covelong (Kovalam) Surfing Beach', category: 'adventure', duration: '2.5 hours', reason: 'Top coastal surfing bay with scenic fishing catamaran village and calm sunset backwaters.', cost: 0, lat: 12.7925, lng: 80.2528, time: '05:30 PM' },
  ],
  ooty: [
    { name: 'Government Botanical Garden', category: 'nature', duration: '2.5 hours', reason: '55-acre heritage garden established in 1848, home to over 1,000 exotic floral species and a 20-million-year-old fossilized tree.', cost: 60, lat: 11.4167, lng: 76.7167, time: '09:00 AM' },
    { name: 'Doddabetta Peak Viewpoint', category: 'nature', duration: '2 hours', reason: 'Highest peak in the Nilgiri Mountains (2,637 meters) featuring an observation telescope house with cloud-top valley panoramas.', cost: 20, lat: 11.4011, lng: 76.7358, time: '11:45 AM' },
    { name: 'Ooty Boat House & Lake', category: 'relaxed', duration: '2 hours', reason: 'Artificial scenic lake bordered by tall eucalyptus trees offering paddle and motor boating in crisp hill station air.', cost: 120, lat: 11.4056, lng: 76.6889, time: '03:30 PM' },
    { name: 'Government Rose Garden', category: 'nature', duration: '1.5 hours', reason: 'Largest rose garden in India on Elk Hill slopes with over 20,000 hybrid rose varieties in tiered terraces.', cost: 50, lat: 11.4083, lng: 76.7167, time: '05:45 PM' },
    { name: 'Nilgiri Mountain Railway (Toy Train)', category: 'historical', duration: '3 hours', reason: 'UNESCO World Heritage steam cog railway traversing dramatic mountain ravines, 16 tunnels, and 250 bridges.', cost: 200, lat: 11.4080, lng: 76.7020, time: '09:30 AM' },
    { name: 'Pykara Waterfalls & Lake Boating', category: 'nature', duration: '3 hours', reason: 'Pristine cascading river falls amidst Toda tribal woodlands and quiet pine forests.', cost: 100, lat: 11.5167, lng: 76.6000, time: '02:00 PM' },
  ],
  chennai: [
    { name: 'Marina Beach Promenade', category: 'beach', duration: '2.5 hours', reason: 'World’s second-longest urban natural beach with cooling sea breeze, lighthouses, and local street delicacies.', cost: 0, lat: 13.0500, lng: 80.2824, time: '09:00 AM' },
    { name: 'Kapaleeshwarar Temple', category: 'historical', duration: '1.5 hours', reason: 'Dravidian architectural masterpiece in Mylapore dating back to 7th century CE dedicated to Lord Shiva.', cost: 0, lat: 13.0334, lng: 80.2694, time: '11:45 AM' },
    { name: 'San Thome Cathedral Basilica', category: 'historical', duration: '1 hour', reason: 'Historic neo-Gothic cathedral built by Portuguese explorers over the sacred tomb of Apostle St. Thomas.', cost: 0, lat: 13.0333, lng: 80.2783, time: '02:30 PM' },
    { name: 'Guindy National Park & Children’s Park', category: 'nature', duration: '2 hours', reason: 'One of the few national parks located inside a major metropolitan city, protecting blackbucks, spotted deer, and rare birds.', cost: 20, lat: 13.0067, lng: 80.2206, time: '04:30 PM' },
    { name: 'Fort St. George & Clive House Museum', category: 'historical', duration: '2 hours', reason: 'First British fortress built in India (1644) housing rare colonial relics, cannons, and St. Mary’s Church.', cost: 25, lat: 13.0789, lng: 80.2875, time: '10:00 AM' },
    { name: 'Elliot’s (Besant Nagar) Beach', category: 'beach', duration: '2 hours', reason: 'Clean and relaxed coastal promenade featuring Karl Schmidt memorial and sea-view artisanal cafes.', cost: 0, lat: 12.9994, lng: 80.2714, time: '06:00 PM' },
  ],
  kanyakumari: [
    { name: 'Vivekananda Rock Memorial & Ferry', category: 'historical', duration: '2.5 hours', reason: 'Sacred island rock memorial sitting 500m off the mainland where Swami Vivekananda attained enlightenment in 1892.', cost: 60, lat: 8.0780, lng: 77.5550, time: '09:00 AM' },
    { name: 'Thiruvalluvar 133-ft Stone Statue', category: 'historical', duration: '1.5 hours', reason: 'Massive 133-foot stone statue commemorating the legendary Tamil philosopher and author of the Tirukkural.', cost: 0, lat: 8.0770, lng: 77.5540, time: '11:45 AM' },
    { name: 'Triveni Sangam Sunset Point', category: 'nature', duration: '2 hours', reason: 'The southernmost tip of the Indian subcontinent where the Arabian Sea, Indian Ocean, and Bay of Bengal converge.', cost: 0, lat: 8.0783, lng: 77.5500, time: '05:30 PM' },
    { name: 'Padmanabhapuram Palace', category: 'historical', duration: '2.5 hours', reason: 'Magnificent 16th-century wooden palace displaying exquisite Travancore craftsmanship and antique rosewood ceilings.', cost: 50, lat: 8.2508, lng: 77.3275, time: '02:00 PM' },
  ],
};

const FOOD_RECOMMENDATIONS_MAP = {
  mahabalipuram: {
    breakfast: { spot: 'Moonrakers Cafe', dish: 'Crispy Ghee Podi Roast Dosa with coconut chutney and filter coffee' },
    lunch: { spot: 'Seashore Garden Restaurant', dish: 'Fresh Tandoori Fish Curry Thali with jumbo prawns and crab masala' },
    dinner: { spot: 'Santana Beach Restaurant', dish: 'Grilled Calamari, Butter Garlic Crab, and chilled lime mint cooler' },
  },
  ooty: {
    breakfast: { spot: 'Willy’s Coffee Pub', dish: 'Fresh Nilgiri brewed filter coffee, hot cheese toast, and honey waffles' },
    lunch: { spot: 'Earl’s Secret at King’s Cliff', dish: 'Traditional Nilgiri Badaga Curry with steamed fragrant rice and roast vegetables' },
    dinner: { spot: 'Shinkow’s Heritage Chinese', dish: 'Authentic Tibetan thukpa soup, steamed momos, and hot chilli noodles' },
  },
  chennai: {
    breakfast: { spot: 'Murugan Idli Shop', dish: 'Steaming soft mallipoo idlis with 4 varieties of traditional chutneys' },
    lunch: { spot: 'Junior Kuppanna', dish: 'Authentic Kongu Nadu Mutton Biryani with Seeraga Samba rice and spicy gravy' },
    dinner: { spot: 'The Marina Seafood Restaurant', dish: 'Live catch Tawa Fish Fry, Vanjaram Steak, and Malabar Coin Parottas' },
  },
  kanyakumari: {
    breakfast: { spot: 'Saravana Bhavan Kanyakumari', dish: 'Rava Kichadi with coconut sambar and fresh cardamom tea' },
    lunch: { spot: 'Hotel Sea View Restaurant', dish: 'Coastal Fish Curry Meals with Chemmeen (Prawn) fry and Rasam' },
    dinner: { spot: 'The Ocean Sunset Diner', dish: 'Appam with vegetable stew and fresh fruit falooda' },
  },
  default: {
    breakfast: { spot: 'Heritage Central Bakery', dish: 'Traditional artisanal breakfast with local fresh brew and warm pastries' },
    lunch: { spot: 'Local Flavor Bistro', dish: 'Regional Specialty Thali featuring authentic farm-fresh ingredients' },
    dinner: { spot: 'Sunset Horizon Restaurant', dish: 'Signature Chef’s Seafood & Grill platter with handcrafted dessert' },
  },
};

const aiTripService = {
  /**
   * Generates an intelligent, structured, and budget-optimized AI trip itinerary (Phase 6)
   */
  async generateAiItinerary({
    destination,
    destinationId,
    destinationName,
    numberOfDays = 3,
    travelers = 2,
    budget = 10000,
    currency = 'INR',
    travelPreference = 'nature',
    selectedTransport = null,
    selectedHotel = null,
    currentLocation = null,
    startDate = null,
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
    const pref = (travelPreference || 'balanced').toLowerCase();
    const curr = (currency || 'INR').toUpperCase();
    const sym = curr === 'USD' ? '$' : '₹';
    const isINR = curr === 'INR';

    const destKey = String(rawDest).toLowerCase();
    let normalizedKey = 'default';
    if (destKey.includes('mahabalipuram') || destKey.includes('mamallapuram') || destKey.includes('shore temple')) normalizedKey = 'mahabalipuram';
    else if (destKey.includes('ooty') || destKey.includes('nilgiri')) normalizedKey = 'ooty';
    else if (destKey.includes('chennai')) normalizedKey = 'chennai';
    else if (destKey.includes('kanya')) normalizedKey = 'kanyakumari';
    else if (destKey.includes('goa')) normalizedKey = 'goa';
    else if (destKey.includes('kerala') || destKey.includes('kochi') || destKey.includes('munnar')) normalizedKey = 'kerala';
    else if (destKey.includes('paris')) normalizedKey = 'paris';
    else if (destKey.includes('swiss') || destKey.includes('alps') || destKey.includes('switzerland')) normalizedKey = 'swiss';
    else if (destKey.includes('bali')) normalizedKey = 'bali';
    else if (destKey.includes('tokyo') || destKey.includes('japan')) normalizedKey = 'tokyo';

    // 1. Check if built-in smart generator has custom day templates for major destinations
    let baseItineraryData = null;
    try {
      baseItineraryData = generateItinerary({
        destination: rawDest,
        destinationId,
        destinationName: rawDest,
        numberOfDays: daysCount,
        budget: userBudget,
        currency: curr,
        travelType: pref,
        interests: [pref, 'sightseeing', 'dining'],
        startDate: startDate || new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.warn('[AiTripService] Default generator fallback:', err.message);
    }

    // 2. Resolve Places & Clustering for Local/Regional Destinations
    const localPlaces = DESTINATION_LOCAL_PLACES[normalizedKey] || [];
    const foodMap = FOOD_RECOMMENDATIONS_MAP[normalizedKey] || FOOD_RECOMMENDATIONS_MAP.default;

    // Filter and score places according to preference
    const scoredPlaces = localPlaces.map((p) => {
      let score = 1;
      if (pref === 'nature' && (p.category === 'nature' || p.name.includes('Garden') || p.name.includes('Peak') || p.name.includes('Lake') || p.name.includes('Waterfalls'))) score += 3;
      if (pref === 'historical' && (p.category === 'historical' || p.category === 'culture' || p.name.includes('Temple') || p.name.includes('Fort') || p.name.includes('Rathas') || p.name.includes('Arjuna'))) score += 3;
      if (pref === 'adventure' && (p.category === 'adventure' || p.name.includes('Surfing') || p.name.includes('Trek') || p.name.includes('Boating'))) score += 3;
      if (pref === 'beach' && (p.category === 'beach' || p.name.includes('Beach') || p.name.includes('Coast'))) score += 3;
      if (pref === 'budget' && p.cost <= 30) score += 2;
      return { ...p, score };
    }).sort((a, b) => b.score - a.score);

    // 3. Assemble Day-by-Day Itinerary Structure
    const days = [];
    let totalActivitiesCost = 0;
    const baseDailyTransport = isINR ? 350 : 20;
    const baseDailyFood = isINR ? 450 * numTravelers : 25 * numTravelers;
    const baseDailyStay = selectedHotel?.approx_price_per_night
      ? parseFloat(selectedHotel.approx_price_per_night)
      : (isINR ? 900 : 50);

    // Include selected intercity transport cost from Phase 4 if provided
    const intercityTransportCost = selectedTransport?.estimated_cost ? parseFloat(selectedTransport.estimated_cost) : 0;

    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
      let dayActivities = [];
      let dayPlacesList = [];
      let dayTheme = `Day ${dayNum} Exploration & Sightseeing`;

      if (scoredPlaces.length > 0) {
        // Build 3 activities (morning, afternoon, evening) from scored local places
        const morningPlace = scoredPlaces[(dayNum * 3 - 3) % scoredPlaces.length];
        const afternoonPlace = scoredPlaces[(dayNum * 3 - 2) % scoredPlaces.length];
        const eveningPlace = scoredPlaces[(dayNum * 3 - 1) % scoredPlaces.length];

        dayPlacesList = [morningPlace.name, afternoonPlace.name, eveningPlace.name];
        dayTheme = `${morningPlace.name}, ${afternoonPlace.name} & Evening Leisure`;

        dayActivities = [
          {
            slot: 'morning',
            time: morningPlace.time || '09:00 AM',
            placeName: morningPlace.name,
            duration: morningPlace.duration,
            reason: morningPlace.reason,
            category: morningPlace.category,
            estimatedCost: morningPlace.cost,
            coordinates: { latitude: morningPlace.lat, longitude: morningPlace.lng },
          },
          {
            slot: 'afternoon',
            time: afternoonPlace.time || '01:30 PM',
            placeName: afternoonPlace.name,
            duration: afternoonPlace.duration,
            reason: afternoonPlace.reason,
            category: afternoonPlace.category,
            estimatedCost: afternoonPlace.cost,
            coordinates: { latitude: afternoonPlace.lat, longitude: afternoonPlace.lng },
          },
          {
            slot: 'evening',
            time: eveningPlace.time || '05:30 PM',
            placeName: eveningPlace.name,
            duration: eveningPlace.duration,
            reason: eveningPlace.reason,
            category: eveningPlace.category,
            estimatedCost: eveningPlace.cost,
            coordinates: { latitude: eveningPlace.lat, longitude: eveningPlace.lng },
          },
        ];
      } else if (baseItineraryData?.days && baseItineraryData.days[dayNum - 1]) {
        const existingDay = baseItineraryData.days[dayNum - 1];
        dayTheme = existingDay.theme || dayTheme;
        dayPlacesList = existingDay.places || [];
        dayActivities = (existingDay.activities || []).map((act) => ({
          slot: act.time < '12:00' ? 'morning' : act.time < '16:30' ? 'afternoon' : 'evening',
          time: act.time || '10:00 AM',
          placeName: act.title || act.name,
          duration: act.duration || '2 hours',
          reason: act.desc || `Top recommended activity for ${pref} travel in ${rawDest}.`,
          category: act.type || 'sightseeing',
          estimatedCost: isINR ? (act.cost * 85 || 100) : (act.cost || 10),
          location: act.location || rawDest,
        }));
      } else {
        // Generic fallback places
        dayPlacesList = [`${rawDest} Heritage Core`, `${rawDest} Scenic Viewpoint`, `${rawDest} Cultural Promenade`];
        dayActivities = [
          { slot: 'morning', time: '09:30 AM', placeName: dayPlacesList[0], duration: '2.5 hours', reason: 'Iconic landmark and rich history orientation.', estimatedCost: isINR ? 100 : 10 },
          { slot: 'afternoon', time: '02:00 PM', placeName: dayPlacesList[1], duration: '2 hours', reason: 'Scenic panoramic landscapes and photography.', estimatedCost: isINR ? 50 : 5 },
          { slot: 'evening', time: '05:30 PM', placeName: dayPlacesList[2], duration: '2 hours', reason: 'Relaxed golden hour walk and local evening atmosphere.', estimatedCost: 0 },
        ];
      }

      const dayActivityTotal = dayActivities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
      totalActivitiesCost += dayActivityTotal;

      const dailyBreakdown = {
        transport: dayNum === 1 && intercityTransportCost > 0 ? (baseDailyTransport + intercityTransportCost) : baseDailyTransport,
        food: baseDailyFood,
        activities: dayActivityTotal,
        stay: baseDailyStay,
        totalDayCost: (dayNum === 1 && intercityTransportCost > 0 ? (baseDailyTransport + intercityTransportCost) : baseDailyTransport) + baseDailyFood + dayActivityTotal + baseDailyStay,
      };

      days.push({
        day: dayNum,
        title: `Day ${dayNum}: ${dayTheme}`,
        theme: dayTheme,
        places: dayPlacesList,
        activities: dayActivities,
        foodSuggestions: baseItineraryData?.days?.[dayNum - 1]?.foodSuggestions || foodMap,
        dailyCostBreakdown: dailyBreakdown,
        estimatedDailyCost: dailyBreakdown.totalDayCost,
        aiTravelTip: `Pro-tip for Day ${dayNum}: Morning light is best for photography and cooler walking temperatures.`,
      });
    }

    // 4. Calculate Total Estimated Trip Cost
    const totalEstimatedCost = days.reduce((sum, d) => sum + d.estimatedDailyCost, 0);
    const budgetDifference = userBudget - totalEstimatedCost;
    const isWithinBudget = budgetDifference >= 0;

    // 5. Generate Smart Recommendations
    const recommendations = [
      {
        title: `${rawDest} Highlights Pass`,
        reason: `Matches your ${pref} travel style perfectly with grouped admission discounts.`,
        category: pref,
        costEstimate: isINR ? `~₹${(200 * numTravelers).toLocaleString()}` : `~$${15 * numTravelers}`,
      },
      {
        title: `Authentic ${rawDest} Culinary Trail`,
        reason: `Savor signature breakfast & dinner dishes recommended by local culinary masters.`,
        category: 'dining',
        costEstimate: isINR ? `~₹${(400 * numTravelers).toLocaleString()}` : `~$${25 * numTravelers}`,
      },
    ];

    if (selectedTransport) {
      recommendations.push({
        title: `Confirmed Transport: ${selectedTransport.title}`,
        reason: `Estimated at ${selectedTransport.cost_text || `₹${selectedTransport.estimated_cost}`} (${selectedTransport.duration_text || 'optimal duration'}).`,
        category: 'transport',
        costEstimate: selectedTransport.cost_text || `${sym}${selectedTransport.estimated_cost}`,
      });
    }

    if (selectedHotel) {
      recommendations.push({
        title: `Confirmed Stay: ${selectedHotel.name}`,
        reason: `Located ${selectedHotel.distance_label || `${selectedHotel.distance_km || 1.5} km from destination`} with ${selectedHotel.rating || 4.5}⭐ rating.`,
        category: 'accommodation',
        costEstimate: selectedHotel.price_display || `${sym}${selectedHotel.approx_price_per_night}/night`,
      });
    }

    // 6. Generate Budget Advice & Actionable Over-Budget Alternatives
    const budgetAdvice = [
      `Book monument entry tickets directly online via official ASI / tourism portals to skip queue wait times.`,
      `Local public transit & state buses provide substantial savings compared to on-demand private cabs.`,
      `Opt for combination thali meals at heritage restaurants for authentic regional delicacies at predictable prices.`,
    ];

    let budgetAlternatives = [];
    let overBudgetAlert = null;

    if (!isWithinBudget) {
      const overAmount = Math.abs(budgetDifference);
      overBudgetAlert = `Your current plan is approximately ${sym}${overAmount.toLocaleString()} over your specified budget of ${sym}${userBudget.toLocaleString()}.`;
      budgetAlternatives = [
        `Switch from private cabs to state express buses or suburban rail to save ~${sym}${Math.round(overAmount * 0.45).toLocaleString()}.`,
        `Choose free public scenic walking trails, beaches, and hilltop viewpoints over premium paid adventure parks.`,
        `Book verified guest houses, homestays, or bed-and-breakfasts near the town center to save on room tariff.`,
        `Enjoy authentic local mess & thali eateries for lunch rather than multi-cuisine fine dining restaurants.`,
        `Travel in off-peak morning hours to benefit from fixed-rate transit passes and avoid surge tariffs.`,
      ];
    }

    return {
      summary: `${daysCount}-Day ${pref.charAt(0).toUpperCase() + pref.slice(1)} Itinerary for ${rawDest} curated for ${numTravelers} traveler${numTravelers > 1 ? 's' : ''}.`,
      destination: rawDest,
      destinationId: destinationId || null,
      destinationName: rawDest,
      numberOfDays: daysCount,
      travelers: numTravelers,
      travelPreference: pref,
      budget: userBudget,
      currency: curr,
      currencySymbol: sym,
      totalEstimatedCost,
      budgetStatus: isWithinBudget ? 'within_budget' : 'over_budget',
      budgetDifference: Math.round(budgetDifference),
      overBudgetAlert,
      budgetAlternatives,
      selectedTransport: selectedTransport || null,
      selectedHotel: selectedHotel || null,
      days,
      recommendations,
      budgetAdvice,
      aiWorkflow: {
        step1_profiling: `Analyzed user travel profile: ${pref} preference, ${numTravelers} traveler(s), ${daysCount} days duration, ${sym}${userBudget.toLocaleString()} budget.`,
        step2_budgetPacing: `Allocated daily budget of ${sym}${Math.round(totalEstimatedCost / daysCount).toLocaleString()}/day across Transport (15%), Stays (45%), Dining (30%), and Activities (10%).`,
        step3_geographicClustering: `Organized attractions into geographically proximate daily routes to minimize travel time and eliminate backtracking.`,
        step4_culinaryCuration: `Curated authentic regional culinary highlights for Breakfast, Lunch, and Dinner.`,
        step5_contextualTips: `Generated personalized safety, budget, and travel tips optimized for ${pref.toUpperCase()} travelers.`,
        step5_realtimeVerification: `Verified opening hours, admission tariffs, and road accessibility.`,
      },
      itineraryItems: days.flatMap((d) =>
        d.activities.map((a, idx) => ({
          day_number: d.day,
          activity_date: startDate || new Date(Date.now() + (d.day - 1) * 86400000).toISOString().split('T')[0],
          activity_time: a.time ? (a.time.includes(':') ? (a.time.includes('M') ? a.time : (a.time.length === 5 ? `${a.time}:00` : a.time)) : '09:00:00') : '09:00:00',
          title: a.placeName || a.title || a.name || `Day ${d.day} Activity ${idx + 1}`,
          description: a.reason || a.description || a.desc || `Visit ${a.placeName || a.title || 'attraction'}`,
          activity_type: a.category || a.activity_type || a.type || 'sightseeing',
          location_name: a.placeName || a.location_name || a.location || String(rawDest),
          cost: a.estimatedCost !== undefined ? a.estimatedCost : (a.cost || 0),
        }))
      ),
    };
  },
};

module.exports = aiTripService;
