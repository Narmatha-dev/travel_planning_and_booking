const destinationModel = require('../models/destinationModel');
const packageModel = require('../models/packageModel');
const bookingModel = require('../models/bookingModel');
const tripModel = require('../models/tripModel');

// Conversion constant: 1 USD ~ 85 INR
const USD_TO_INR = 85.0;

// Enriched destination knowledge base for the AI recommendation algorithm
const DESTINATION_KNOWLEDGE_BASE = [
  {
    id: 101,
    name: 'Goa Coastal Haven',
    city: 'Goa',
    country: 'India',
    category: 'beach',
    tags: ['beach', 'coastal', 'family', 'watersports', 'seafood', 'relaxation', 'friends', 'nightlife'],
    dailyCostUSD: 45,
    dailyCostINR: 3800,
    optimalDurationDays: [3, 5],
    suitability: { family: 96, couple: 92, solo: 89, friends: 98, luxury: 85, adventure: 86 },
    climate: 'Tropical coastal warm (28°C)',
    bestTimeToVisit: 'November to March',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
    description: 'Golden sand beaches, palm-fringed coastlines, Portuguese heritage villas, and vibrant family beach shacks.',
    topActivities: ['Calangute beach watersports', 'Old Goa heritage church tour', 'Mandovi sunset river cruise', 'Spice plantation lunch'],
    matchedPackageTitle: 'Goa Sun, Sand & Family Adventure',
    matchedPackagePriceUSD: 240,
    matchedPackagePriceINR: 20400,
  },
  {
    id: 102,
    name: 'Kerala Backwaters & Beaches',
    city: 'Kochi & Alleppey',
    country: 'India',
    category: 'beach',
    tags: ['beach', 'wellness', 'backwaters', 'family', 'ayurveda', 'nature', 'relaxation', 'couple'],
    dailyCostUSD: 50,
    dailyCostINR: 4200,
    optimalDurationDays: [4, 7],
    suitability: { family: 98, couple: 96, solo: 86, friends: 88, luxury: 90, wellness: 99 },
    climate: 'Lush tropical maritime (27°C)',
    bestTimeToVisit: 'September to March',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
    description: 'Serene palm-lined lagoons, private luxury houseboats, Marari sandy beaches, and traditional Ayurvedic wellness retreats.',
    topActivities: ['Alleppey houseboat backwater cruise', 'Munnar tea garden trek', 'Kovalam beach relaxation', 'Kathakali cultural show'],
    matchedPackageTitle: 'God’s Own Country Backwater Bliss',
    matchedPackagePriceUSD: 280,
    matchedPackagePriceINR: 23800,
  },
  {
    id: 103,
    name: 'Andaman Marine & Coral Islands',
    city: 'Havelock Island',
    country: 'India',
    category: 'beach',
    tags: ['beach', 'island', 'scuba', 'coral reef', 'family', 'adventure', 'watersports', 'snorkeling'],
    dailyCostUSD: 65,
    dailyCostINR: 5500,
    optimalDurationDays: [4, 7],
    suitability: { family: 94, couple: 96, solo: 88, friends: 94, luxury: 89, adventure: 97 },
    climate: 'Tropical island breeze (29°C)',
    bestTimeToVisit: 'October to May',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800',
    description: 'Crystal-clear turquoise waters, white sand beaches, vibrant coral reefs, and world-class scuba diving.',
    topActivities: ['Radhanagar beach sunset', 'Elephant Beach snorkeling', 'Cellular Jail sound & light show', 'Scuba diving at Havelock'],
    matchedPackageTitle: 'Andaman Exotic Island Explorer',
    matchedPackagePriceUSD: 360,
    matchedPackagePriceINR: 30600,
  },
  {
    id: 1,
    name: 'Bali Paradise Island',
    city: 'Ubud & Seminyak',
    country: 'Indonesia',
    category: 'beach',
    tags: ['beach', 'wellness', 'yoga', 'culture', 'family', 'couple', 'surfing', 'villa'],
    dailyCostUSD: 75,
    dailyCostINR: 6375,
    optimalDurationDays: [5, 10],
    suitability: { family: 94, couple: 98, solo: 95, friends: 92, luxury: 96, adventure: 90 },
    climate: 'Tropical warm (28°C)',
    bestTimeToVisit: 'April to October',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    description: 'Iconic volcanic mountains, emerald rice terraces, cliffside ocean temples, and tranquil private villa retreats.',
    topActivities: ['Ubud rice terrace walk', 'Uluwatu cliff sunset temple', 'Mount Batur sunrise trek', 'Yoga sound healing'],
    matchedPackageTitle: 'Bali Tropical Bliss & Yoga Retreat',
    matchedPackagePriceUSD: 1099,
    matchedPackagePriceINR: 93415,
  },
  {
    id: 3,
    name: 'Swiss Alpine Wonders',
    city: 'Zermatt & Interlaken',
    country: 'Switzerland',
    category: 'mountain',
    tags: ['mountain', 'snow', 'nature', 'hiking', 'adventure', 'luxury', 'couple', 'scenic'],
    dailyCostUSD: 180,
    dailyCostINR: 15300,
    optimalDurationDays: [5, 9],
    suitability: { family: 89, couple: 96, solo: 92, friends: 92, luxury: 99, adventure: 98 },
    climate: 'Alpine mountain crisp (15°C summer / -2°C winter)',
    bestTimeToVisit: 'June to September & Dec to March',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    description: 'Towering Matterhorn peaks, turquoise alpine lakes, glacier express scenic trains, and luxury mountain chalets.',
    topActivities: ['Jungfraujoch Top of Europe excursion', 'Matterhorn glacier trail', 'Lake Geneva cruise', 'Swiss fondue tasting'],
    matchedPackageTitle: 'Swiss Alps Grand Explorer',
    matchedPackagePriceUSD: 3199,
    matchedPackagePriceINR: 271915,
  },
  {
    id: 4,
    name: 'Parisian Elegance & Romance',
    city: 'Paris',
    country: 'France',
    category: 'city_break',
    tags: ['romance', 'culture', 'art', 'museums', 'gastronomy', 'couple', 'city', 'shopping'],
    dailyCostUSD: 145,
    dailyCostINR: 12325,
    optimalDurationDays: [4, 7],
    suitability: { family: 85, couple: 99, solo: 93, friends: 88, luxury: 96, culture: 98 },
    climate: 'Mild temperate oceanic (20°C)',
    bestTimeToVisit: 'April to June & Sept to Nov',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    description: 'Iconic Eiffel Tower views, Louvre art treasures, charming Montmartre bistros, and illuminated Seine river dining.',
    topActivities: ['Louvre VIP tour', 'Seine evening dinner cruise', 'Palace of Versailles day trip', 'Montmartre café walk'],
    matchedPackageTitle: 'Romantic Paris & Versailles Getaway',
    matchedPackagePriceUSD: 1699,
    matchedPackagePriceINR: 144415,
  },
  {
    id: 2,
    name: 'Kyoto & Tokyo Highlights',
    city: 'Tokyo & Kyoto',
    country: 'Japan',
    category: 'cultural',
    tags: ['culture', 'temples', 'modern', 'food', 'safety', 'solo', 'family', 'technology', 'heritage'],
    dailyCostUSD: 135,
    dailyCostINR: 11475,
    optimalDurationDays: [6, 12],
    suitability: { family: 92, couple: 94, solo: 99, friends: 90, luxury: 94, culture: 99 },
    climate: 'Temperate distinct seasons (18°C)',
    bestTimeToVisit: 'March to May (Cherry Blossoms) & Oct to Nov',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    description: 'Futuristic neon skyscrapers, ancient wooden pagodas, Shinkansen bullet trains, and Michelin-starred culinary craft.',
    topActivities: ['Fushimi Inari torii shrine', 'Tokyo teamLab digital art', 'Shinkansen bullet train', 'Tea ceremony in Gion'],
    matchedPackageTitle: 'Grand Japan Explorer: Tokyo to Kyoto',
    matchedPackagePriceUSD: 2699,
    matchedPackagePriceINR: 229415,
  },
  {
    id: 5,
    name: 'Santorini Sunset Haven',
    city: 'Oia & Fira',
    country: 'Greece',
    category: 'luxury',
    tags: ['beach', 'romance', 'luxury', 'views', 'sunset', 'island', 'couple', 'relaxation'],
    dailyCostUSD: 160,
    dailyCostINR: 13600,
    optimalDurationDays: [4, 7],
    suitability: { family: 80, couple: 99, solo: 85, friends: 88, luxury: 98, romance: 99 },
    climate: 'Mediterranean sunny (26°C)',
    bestTimeToVisit: 'May to October',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    description: 'Cliffside whitewashed villas overlooking the sapphire Aegean caldera, volcanic beaches, and world-famous golden sunsets.',
    topActivities: ['Oia sunset catamaran sail', 'Akrotiri prehistoric ruins', 'Red Beach swim', 'Caldera wine tasting'],
    matchedPackageTitle: 'Santorini Luxury Caldera Escape',
    matchedPackagePriceUSD: 1999,
    matchedPackagePriceINR: 169915,
  },
  {
    id: 6,
    name: 'Serengeti Wildlife Safari',
    city: 'Serengeti National Park',
    country: 'Tanzania',
    category: 'adventure',
    tags: ['wildlife', 'safari', 'nature', 'adventure', 'animals', 'family', 'photography'],
    dailyCostUSD: 210,
    dailyCostINR: 17850,
    optimalDurationDays: [5, 8],
    suitability: { family: 88, couple: 92, solo: 90, friends: 95, luxury: 95, adventure: 99 },
    climate: 'Tropical savanna warm (25°C)',
    bestTimeToVisit: 'June to October',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    description: 'The Great Migration, legendary Big Five game drives, luxury tented camps, and breathtaking sunrise balloon safaris.',
    topActivities: ['Big 5 sunrise game drive', 'Hot air balloon safari', 'Ngorongoro crater tour', 'Maasai village cultural visit'],
    matchedPackageTitle: 'Serengeti Wildlife & Safari Adventure',
    matchedPackagePriceUSD: 3499,
    matchedPackagePriceINR: 297415,
  },
  {
    id: 104,
    name: 'Manali & Solang Alpine Retreat',
    city: 'Manali',
    country: 'India',
    category: 'mountain',
    tags: ['mountain', 'snow', 'adventure', 'trekking', 'nature', 'paragliding', 'friends', 'budget'],
    dailyCostUSD: 40,
    dailyCostINR: 3400,
    optimalDurationDays: [4, 6],
    suitability: { family: 90, couple: 94, solo: 95, friends: 96, luxury: 82, adventure: 96 },
    climate: 'Cool Himalayan crisp (16°C summer / 2°C winter)',
    bestTimeToVisit: 'October to June',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    description: 'Majestic Himalayan snow peaks, pine-forested valleys, Solang adventure sports, and cozy riverfront wooden cottages.',
    topActivities: ['Solang valley paragliding', 'Rohtang Pass snow point', 'Old Manali café hopping', 'Jogini waterfall trek'],
    matchedPackageTitle: 'Himalayan Manali Adventure Tour',
    matchedPackagePriceUSD: 210,
    matchedPackagePriceINR: 17850,
  },
  {
    id: 105,
    name: 'Jaipur Royal Heritage',
    city: 'Jaipur',
    country: 'India',
    category: 'cultural',
    tags: ['culture', 'palaces', 'forts', 'heritage', 'family', 'shopping', 'food', 'photography'],
    dailyCostUSD: 35,
    dailyCostINR: 3000,
    optimalDurationDays: [3, 5],
    suitability: { family: 97, couple: 90, solo: 92, friends: 90, luxury: 92, culture: 99 },
    climate: 'Subtropical warm (26°C)',
    bestTimeToVisit: 'October to March',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
    description: 'The Pink City of grand Rajput forts, ornate royal palaces, vibrant bazaars, and opulent Rajasthani dining.',
    topActivities: ['Amber Fort elephant & jeep tour', 'Hawa Mahal photography', 'City Palace royal museum', 'Chokhi Dhani cultural dinner'],
    matchedPackageTitle: 'Jaipur Royal Forts & Heritage Tour',
    matchedPackagePriceUSD: 180,
    matchedPackagePriceINR: 15300,
  }
];

const recommendationService = {
  /**
   * Explainable AI Recommendation Algorithm
   * Computes personalized destinations and packages based on multi-factor scoring
   */
  async getRecommendations(criteria = {}) {
    const {
      budget = 20000,
      currency = 'INR',
      duration = 4,
      durationDays = 4,
      interest = 'beach',
      interests = [],
      travelType = 'family',
      userId,
      includeHistory = true,
      limit = 5,
    } = criteria;

    const chosenDuration = parseInt(duration || durationDays || 4, 10);
    const chosenBudget = parseFloat(budget || 20000);
    const isINR = currency.toUpperCase() === 'INR';
    const isUSD = currency.toUpperCase() === 'USD';

    // Normalize budget to both INR and USD
    const budgetUSD = isINR ? chosenBudget / USD_TO_INR : chosenBudget;
    const budgetINR = isUSD ? chosenBudget * USD_TO_INR : chosenBudget;

    // Normalize interests list
    const requestedInterests = Array.isArray(interests) && interests.length > 0
      ? interests.map((i) => i.toLowerCase().trim())
      : [String(interest || 'beach').toLowerCase().trim()];

    const normalizedTravelType = String(travelType || 'family').toLowerCase().trim();

    // Fetch user travel history (past bookings, trips, favorites) if available
    let pastCategories = [];
    let pastDestinations = [];
    if (userId && includeHistory) {
      try {
        const [bookings, trips] = await Promise.all([
          bookingModel.findByUserId(userId),
          tripModel.findByUserId(userId),
        ]);
        if (bookings && bookings.length > 0) {
          pastDestinations.push(...bookings.map((b) => b.destination_name));
        }
        if (trips && trips.length > 0) {
          pastCategories.push(...trips.map((t) => t.trip_type));
        }
      } catch (err) {
        // Continue smoothly if history is empty
      }
    }

    // Multi-factor scoring across destination knowledge base
    const scoredDestinations = DESTINATION_KNOWLEDGE_BASE.map((dest) => {
      let score = 0;
      const reasons = [];

      // -------------------------------------------------------------
      // FACTOR 1: Interest & Tag Alignment (Weight: 35%)
      // -------------------------------------------------------------
      let interestScore = 0;
      const matchingTags = [];

      requestedInterests.forEach((userInt) => {
        if (dest.category.toLowerCase().includes(userInt) || userInt.includes(dest.category.toLowerCase())) {
          interestScore += 35;
          matchingTags.push(dest.category);
        } else {
          const tagMatch = dest.tags.find((t) => t.includes(userInt) || userInt.includes(t));
          if (tagMatch) {
            interestScore += 25;
            matchingTags.push(tagMatch);
          }
        }
      });

      interestScore = Math.min(35, interestScore);
      score += interestScore;

      if (interestScore >= 25) {
        const matchedInterestNames = [...new Set(matchingTags)].join(', ');
        reasons.push(`Directly matches your interest in ${matchedInterestNames || requestedInterests.join(', ')}.`);
      }

      // -------------------------------------------------------------
      // FACTOR 2: Budget Compatibility & Value (Weight: 25%)
      // -------------------------------------------------------------
      const estimatedTotalCostINR = dest.dailyCostINR * chosenDuration;
      const estimatedTotalCostUSD = dest.dailyCostUSD * chosenDuration;
      const activeEstimatedCost = isINR ? estimatedTotalCostINR : estimatedTotalCostUSD;
      const activeBudget = isINR ? budgetINR : budgetUSD;

      let budgetScore = 0;
      if (activeEstimatedCost <= activeBudget) {
        budgetScore = 25;
        const savingsPct = Math.round(((activeBudget - activeEstimatedCost) / activeBudget) * 100);
        reasons.push(
          `Excellent budget fit: Estimated ${isINR ? `₹${estimatedTotalCostINR.toLocaleString()}` : `$${estimatedTotalCostUSD.toLocaleString()}`} for ${chosenDuration} days (${savingsPct > 0 ? `${savingsPct}% under your limit` : 'within budget'}).`
        );
      } else if (activeEstimatedCost <= activeBudget * 1.25) {
        budgetScore = 18;
        reasons.push(
          `Close budget match: Estimated ${isINR ? `₹${estimatedTotalCostINR.toLocaleString()}` : `$${estimatedTotalCostUSD.toLocaleString()}`} is within 20% of your target.`
        );
      } else if (activeEstimatedCost <= activeBudget * 1.8) {
        budgetScore = 10;
      } else {
        budgetScore = 3;
      }

      score += budgetScore;

      // -------------------------------------------------------------
      // FACTOR 3: Travel Type & Ambiance Fit (Weight: 20%)
      // -------------------------------------------------------------
      const suitabilityRating = dest.suitability[normalizedTravelType] || 85;
      const travelTypeScore = (suitabilityRating / 100) * 20;
      score += travelTypeScore;

      if (suitabilityRating >= 90) {
        reasons.push(
          `Highly rated for ${normalizedTravelType.toUpperCase()} vacations with specialized activities and amenities.`
        );
      }

      // -------------------------------------------------------------
      // FACTOR 4: Duration Suitability (Weight: 10%)
      // -------------------------------------------------------------
      const [minDays, maxDays] = dest.optimalDurationDays;
      let durationScore = 0;

      if (chosenDuration >= minDays && chosenDuration <= maxDays) {
        durationScore = 10;
        reasons.push(`Optimal trip duration: Ideal for a ${chosenDuration}-day itinerary.`);
      } else if (Math.abs(chosenDuration - minDays) <= 2 || Math.abs(chosenDuration - maxDays) <= 2) {
        durationScore = 7;
      } else {
        durationScore = 4;
      }

      score += durationScore;

      // -------------------------------------------------------------
      // FACTOR 5: User History & Discovery Boost (Weight: 10%)
      // -------------------------------------------------------------
      let historyScore = 8; // Default baseline

      if (pastCategories.includes(dest.category)) {
        historyScore += 2;
        reasons.push(`Aligned with your past favorite travel style.`);
      }

      const previouslyVisited = pastDestinations.some((p) => p.toLowerCase().includes(dest.name.toLowerCase()));
      if (!previouslyVisited) {
        reasons.push(`Fresh destination discovery tailored to your preferences.`);
      }

      score += Math.min(10, historyScore);

      // Final score percentage
      const finalMatchScore = Math.min(99, Math.max(50, Math.round(score)));

      return {
        id: dest.id,
        name: dest.name,
        city: dest.city,
        country: dest.country,
        category: dest.category,
        image: dest.image,
        description: dest.description,
        climate: dest.climate,
        bestTimeToVisit: dest.bestTimeToVisit,
        topActivities: dest.topActivities,
        estimatedTotalCost: isINR ? `₹${estimatedTotalCostINR.toLocaleString()}` : `$${estimatedTotalCostUSD.toLocaleString()}`,
        estimatedDailyCost: isINR ? `₹${dest.dailyCostINR.toLocaleString()}/day` : `$${dest.dailyCostUSD.toLocaleString()}/day`,
        costNumeric: isINR ? estimatedTotalCostINR : estimatedTotalCostUSD,
        currency,
        matchScore: finalMatchScore,
        matchPercentage: `${finalMatchScore}%`,
        matchReasons: reasons.slice(0, 4),
        matchedPackage: {
          title: dest.matchedPackageTitle,
          price: isINR ? `₹${dest.matchedPackagePriceINR.toLocaleString()}` : `$${dest.matchedPackagePriceUSD.toLocaleString()}`,
          priceUSD: dest.matchedPackagePriceUSD,
          priceINR: dest.matchedPackagePriceINR,
        },
      };
    });

    // Sort by match score descending
    scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);

    const topResults = scoredDestinations.slice(0, limit);

    return {
      inputCriteria: {
        budget: chosenBudget,
        currency,
        durationDays: chosenDuration,
        interests: requestedInterests,
        travelType: normalizedTravelType,
      },
      recommendationsCount: topResults.length,
      recommendations: topResults,
    };
  },

  /**
   * Get personalized recommendation feed for a logged in user
   */
  async getPersonalizedFeed(userId = 3) {
    let userTrips = [];
    try {
      userTrips = await tripModel.findByUserId(userId);
    } catch (err) {}

    const preferredCategory = userTrips[0]?.trip_type || 'beach';

    return this.getRecommendations({
      budget: 25000,
      currency: 'INR',
      durationDays: 4,
      interests: [preferredCategory, 'wellness'],
      travelType: 'family',
      userId,
      includeHistory: true,
      limit: 4,
    });
  },
};

module.exports = recommendationService;
