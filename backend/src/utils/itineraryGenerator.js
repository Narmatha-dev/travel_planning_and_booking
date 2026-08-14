/**
 * Smart Day-Wise Itinerary Generator
 * Generates an engaging day-by-day travel plan based on destination, duration,
 * trip type, budget, and selected interests.
 */

const DESTINATION_ACTIVITIES = {
  // Bali
  1: {
    sightseeing: ['Uluwatu Temple & Cliff Walk', 'Tegallalang Rice Terraces', 'Tanah Lot Sunset Pavilion', 'Tirta Empul Holy Water Temple'],
    beaches: ['Seminyak Beach Day Club', 'Nusa Dua Snorkeling Reef', 'Padang Padang Beach Surf Experience', 'Sanur Sunrise Coastal Path'],
    culture: ['Ubud Traditional Art Market', 'Balinese Kecak Dance Performance', 'Batik Making Workshop', 'Royal Palace Cultural Tour'],
    adventure: ['Mount Batur Sunrise Volcano Trek', 'Ayung River White Water Rafting', 'ATV Quad Bike Jungle Safari', 'Canyon Tubing Adventure'],
    dining: ['Jimbaran Bay Seafood Candlelight Dinner', 'Bebek Bengil Crispy Duck Feast', 'Locavore Modern Indonesian Tasting', 'Warung Babi Guling Ibu Oka'],
    leisure: ['Luxury Balinese Flower Bath Spa', 'Yoga Barn Wellness Session', 'Campuhan Ridge Morning Stroll', 'Sunset Beach Club Lounge'],
  },
  // Tokyo & Kyoto
  2: {
    sightseeing: ['Tokyo Skytree Panoramic Deck', 'Shibuya Crossing & Hachiko Statue', 'Fushimi Inari-taisha 10,000 Torii Gates', 'Kinkaku-ji Golden Pavilion'],
    culture: ['Senso-ji Ancient Temple Walk', 'Traditional Kyoto Geisha District Tour', 'Gion Tea Ceremony Experience', 'Meiji Jingu Sacred Forest Walk'],
    adventure: ['Akihabara VR & Go-Kart Experience', 'Arashiyama Monkey Mountain Hike', 'Tokyo Bay Speedboat Cruise', 'Mount Takao Alpine Cable Car'],
    dining: ['Tsukiji Outer Market Fresh Sushi Feast', 'Shinjuku Omoide Yokocho Yakitori Alley', 'Kyoto Kaiseki Multi-Course Banquet', 'Ramen Street Michelin Tasting'],
    leisure: ['Ueno Onsen Thermal Bathing', 'Shinjuku Gyoen National Garden Walk', 'Ginza Luxury Shopping Stroll', 'Philosopher’s Path Sakura Walk'],
  },
  // Swiss Alps
  3: {
    sightseeing: ['Gornergrat Matterhorn Viewpoint', 'Jungfraujoch Top of Europe Station', 'Lake Geneva Chillon Castle', 'Interlaken Harder Kulm Panorama'],
    adventure: ['Glacier 3000 Peak Walk Suspension Bridge', 'Grindelwald First Cliff Walk & Zipline', 'Zermatt Ski & Snowboard Excursion', 'Interlaken Paragliding Tandem Flight'],
    culture: ['Swiss Heritage Cheese Fondue Making', 'Château de Chillon Medieval Tour', 'Swiss Chocolate Artisan Workshop', 'Bern UNESCO Old Town Walk'],
    dining: ['Traditional Alpine Fondue & Raclette Tavern', 'Matterhorn Glacier Restaurant', 'Lake Lucerne Steamboat Dinner', 'Zermatt Mountain Lodge Grill'],
    leisure: ['Thermal Mineral Baths & Alpine Spa', 'Scenic Glacier Express Panoramic Train', 'Lake Brienz Turquoise Cruise', 'Alpine Meadow Wildflower Walk'],
  },
  // Paris
  4: {
    sightseeing: ['Eiffel Tower Summit & Champagne Bar', 'Louvre Museum Mona Lisa VIP Tour', 'Arc de Triomphe Panoramic Rooftop', 'Notre-Dame & Sainte-Chapelle Stained Glass'],
    culture: ['Musée d’Orsay Impressionist Masterpieces', 'Palace of Versailles Hall of Mirrors', 'Montmartre Artists Square & Sacré-Cœur', 'Opéra Garnier Grand Tour'],
    dining: ['Romantic Seine River Glass-Canopy Dinner Cruise', 'Le Marais Gourmet Patisserie & Bakery Crawl', 'Classic French Bistro Duck Confit Dinner', 'Champs-Élysées Macaron & Espresso Tasting'],
    leisure: ['Jardin du Luxembourg Stroll', 'Tuileries Gardens Afternoon Reading', 'Canal Saint-Martin Wine & Cheese Picnic', 'Le Marais Vintage Boutique Shopping'],
    adventure: ['Paris Catacombs Underground Labyrinth', 'Vintage 2CV French Car City Tour', 'E-Bike Tour of Historic Paris', 'Disneyland Paris Thrill Rides'],
  },
  // Santorini
  5: {
    sightseeing: ['Oia Blue Domes Sunset Point', 'Akrotiri Prehistoric Bronze Age Ruins', 'Skaros Rock Panoramic Hike', 'Red Beach Volcanic Cliffs'],
    beaches: ['Perissa Black Sand Beach Relaxation', 'Kamari Coastal Promenade', 'White Beach Secret Cove', 'Amoudi Bay Cliff Jumping & Swimming'],
    culture: ['Santorini Wine Museum & Assyrtiko Tasting', 'Traditional Megalochori Village Walk', 'Pyrgos Medieval Castle Lookout', 'Maritime Museum Exploration'],
    dining: ['Cliffside Sunset Seafood Dinner in Oia', 'Traditional Taverna Grilled Octopus & Greek Salad', 'Santo Wines Sunset Terrace Tapas', 'Amoudi Bay Fresh Catch Fishermans Wharf'],
    adventure: ['Catamaran Sunset Sailing & Caldera Hot Springs', 'Santorini Volcano Crater Boat Expedition', 'Sea Kayaking Caldera Sea Caves', 'Quad Bike Island Expedition'],
    leisure: ['Infinity Pool Caldera Relaxation', 'Therasia Island Day Trip', 'Fira to Oia Scenic Cliffside Trail', 'Open Air Cinema Kamari'],
  },
  // Serengeti
  6: {
    sightseeing: ['Serengeti Endless Plains Panoramic Game Drive', 'Ngorongoro Crater UNESCO Caldera Floor', 'Olduvai Gorge Cradle of Humankind', 'Mara River Crossing Lookout'],
    adventure: ['Sunrise Hot Air Balloon Safari with Champagne', 'Big Five Safari 4x4 Expedition', 'Grumeti River Crocodile & Hippo Trail', 'Night Game Safari Stargazing'],
    culture: ['Maasai Village Cultural Encounter & Boma Dance', 'Bushcraft & Tracking Experience', 'Serengeti Visitor Center Heritage Gallery', 'Traditional Swahili Storytelling'],
    dining: ['Bush Dinner Under African Starry Sky', 'Savanna Sunrise Continental Breakfast', 'Safari Lodge Boma BBQ Buffet', 'Campfire Sunset Cocktail & Biltong'],
    leisure: ['Luxury Tented Camp Sunset Deck', 'Serengeti Infinity Pool Watching Elephants', 'Lodge Spa Deep Tissue Massage', 'Birdwatching Bush Walk'],
  },
};

// Generic fallback activity bank
const GENERIC_ACTIVITIES = {
  sightseeing: ['Historic Downtown Walking Tour', 'Iconic City Landmark Observation Deck', 'Scenic Valley Panoramic Viewpoint', 'Famous Architectural Monument Tour'],
  culture: ['National Art & History Museum', 'Local Heritage & Craft Market', 'Traditional Folk Music Performance', 'Historic Castle & Gardens Walk'],
  beaches: ['White Sand Beach Relaxation', 'Snorkeling & Coral Reef Exploration', 'Sunset Coastal Promenade', 'Seaside Water Sports Experience'],
  adventure: ['Scenic Hiking Trail & Mountain Lookout', 'Kayaking & River Expedition', 'Off-Road Buggy & Safari Trek', 'Ziplining & High Canopy Adventure'],
  dining: ['Celebrated Local Food & Night Market', 'Panoramic Rooftop Tasting Dinner', 'Traditional Authentic Family Eatery', 'Gourmet Cooking Class & Wine Pairing'],
  leisure: ['Botanical Gardens Afternoon Stroll', 'Luxury Thermal Spa & Massage', 'Scenic Lake Promenade & Coffee', 'Boutique Shopping & Café Hopping'],
};

/**
 * Generate Day-Wise Itinerary
 */
function generateItinerary({
  destinationId,
  destinationName = 'Destination',
  startDate,
  endDate,
  travelers = 1,
  budget = 1500,
  tripType = 'solo',
  interests = ['sightseeing', 'dining', 'culture'],
}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate total days (inclusive)
  const diffTime = Math.abs(end - start);
  const totalDays = Math.max(1, Math.min(14, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));

  const destBank = DESTINATION_ACTIVITIES[destinationId] || GENERIC_ACTIVITIES;
  const numTravelers = parseInt(travelers, 10) || 1;
  const totalBudget = parseFloat(budget) || 1500;
  const budgetPerDay = totalBudget / totalDays;

  const itineraryDays = [];
  const allItineraryItems = [];

  // Helper to get formatted date string YYYY-MM-DD
  const getDateForDay = (dayIndex) => {
    const current = new Date(start);
    current.setDate(start.getDate() + dayIndex);
    return current.toISOString().split('T')[0];
  };

  // Helper to pick activity
  const pickActivity = (category, fallbackCategory = 'sightseeing') => {
    const list = destBank[category] || destBank[fallbackCategory] || GENERIC_ACTIVITIES[category] || GENERIC_ACTIVITIES.sightseeing;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  };

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = getDateForDay(day - 1);
    const dayActivities = [];

    if (day === 1) {
      // Day 1: Arrival & Welcome
      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '11:00:00',
        title: `Arrival & Hotel Check-in at ${destinationName}`,
        description: `Arrive at destination, transfer to your boutique accommodation, unpack, and freshen up.`,
        activity_type: 'hotel',
        location_name: `${destinationName} Grand Resort`,
        cost: Math.round(budgetPerDay * 0.35),
      });

      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '15:30:00',
        title: `Orientation Stroll & ${pickActivity('sightseeing')}`,
        description: `Explore the nearby neighborhood, visit iconic landmarks, and get oriented with the local atmosphere.`,
        activity_type: 'sightseeing',
        location_name: `${destinationName} Historic Center`,
        cost: Math.round(budgetPerDay * 0.15),
      });

      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '19:30:00',
        title: `Welcome Dinner: ${pickActivity('dining')}`,
        description: `Savor exquisite local specialties with panoramic views to celebrate the beginning of your journey.`,
        activity_type: 'dining',
        location_name: `${destinationName} Gourmet Taverna`,
        cost: Math.round(budgetPerDay * 0.25 * numTravelers),
      });
    } else if (day === totalDays) {
      // Final Day: Souvenirs & Departure
      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '09:00:00',
        title: `Farewell Breakfast & ${pickActivity('leisure')}`,
        description: `Enjoy a leisurely breakfast and take a morning walk through peaceful scenic gardens.`,
        activity_type: 'leisure',
        location_name: `${destinationName} Promenade`,
        cost: Math.round(budgetPerDay * 0.15),
      });

      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '11:30:00',
        title: `Souvenir Shopping: ${pickActivity('culture')}`,
        description: `Pick up handcrafted souvenirs, authentic artisan products, and memorable keepsakes for loved ones.`,
        activity_type: 'sightseeing',
        location_name: `${destinationName} Artisan Bazaar`,
        cost: Math.round(budgetPerDay * 0.2),
      });

      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '15:00:00',
        title: `Hotel Check-Out & Airport Transfer`,
        description: `Private transfer to the airport or train station for your departure journey home.`,
        activity_type: 'transport',
        location_name: `${destinationName} International Terminal`,
        cost: Math.round(budgetPerDay * 0.2),
      });
    } else {
      // Middle Exploration Days
      const selectedInterests = Array.isArray(interests) && interests.length > 0 ? interests : ['sightseeing', 'culture', 'adventure', 'dining'];
      const morningInterest = selectedInterests[(day * 2) % selectedInterests.length] || 'sightseeing';
      const afternoonInterest = selectedInterests[(day * 2 + 1) % selectedInterests.length] || 'culture';

      // Morning Excursion
      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '09:00:00',
        title: `Morning Adventure: ${pickActivity(morningInterest)}`,
        description: `Immerse yourself in ${morningInterest} highlights with guided exploration and photo opportunities.`,
        activity_type: morningInterest === 'adventure' ? 'adventure' : 'sightseeing',
        location_name: `${destinationName} Landmark`,
        cost: Math.round(budgetPerDay * 0.25),
      });

      // Afternoon Cultural / Scenic Spot
      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '14:00:00',
        title: `Afternoon Discovery: ${pickActivity(afternoonInterest)}`,
        description: `Experience the captivating local history, stunning scenery, and hidden treasures of ${destinationName}.`,
        activity_type: afternoonInterest === 'beaches' ? 'leisure' : 'sightseeing',
        location_name: `${destinationName} Scenic Spot`,
        cost: Math.round(budgetPerDay * 0.2),
      });

      // Evening Dining & Sunset
      dayActivities.push({
        day_number: day,
        activity_date: dateStr,
        activity_time: '19:00:00',
        title: `Evening Highlight: ${pickActivity('dining')}`,
        description: `Delight in authentic culinary masterworks and relax under the twilight sky.`,
        activity_type: 'dining',
        location_name: `${destinationName} Sunset Terrace`,
        cost: Math.round(budgetPerDay * 0.3),
      });
    }

    itineraryDays.push({
      day_number: day,
      date: dateStr,
      theme: `Day ${day}: ${day === 1 ? 'Arrival & Exploration' : day === totalDays ? 'Farewell & Departure' : 'Signature Island Journey'}`,
      activities: dayActivities,
    });

    allItineraryItems.push(...dayActivities);
  }

  const estimatedCost = allItineraryItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return {
    total_days: totalDays,
    start_date: startDate,
    end_date: endDate,
    destination_id: destinationId,
    destination_name: destinationName,
    travelers: numTravelers,
    trip_type: tripType,
    total_budget: totalBudget,
    estimated_cost: estimatedCost,
    days: itineraryDays,
    itinerary_items: allItineraryItems,
  };
}

module.exports = {
  generateItinerary,
};
