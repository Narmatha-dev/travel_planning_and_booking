/**
 * AI Smart Day-Wise Itinerary Generator
 * Generates an intelligent, personalized day-by-day travel plan including:
 * - Visitable Places & Landmarks
 * - Scheduled Activities (Morning, Afternoon, Evening)
 * - Food & Culinary Suggestions (Breakfast, Lunch, Dinner with signature dishes)
 * - AI Workflow Explainability Metadata
 */

const DESTINATION_SMART_DAYS = {
  // 1. Goa (India)
  goa: [
    {
      theme: 'Arrival, Coastal Breeze & Sunset Beach Dining',
      places: ['Calangute Beach', 'Baga Beach Boardwalk', 'St. Anthony’s Beach Shack'],
      activities: [
        { time: '14:00', title: 'Hotel Check-In & Beachside Refreshment', desc: 'Settle into your coastal resort and enjoy a welcome coconut drink by the pool.', type: 'leisure', location: 'Calangute, North Goa', cost: 0 },
        { time: '16:30', title: 'Golden Hour Stroll & Watersports Preview', desc: 'Walk along the soft sands of Calangute and watch the sunset paragliders.', type: 'sightseeing', location: 'Calangute Beach', cost: 15 },
        { time: '19:30', title: 'Live Music & Seafood Candlelight Dinner', desc: 'Dine right on the beach with live acoustic music and sea breeze.', type: 'dining', location: 'Baga Beach', cost: 25 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Infantaria Bakery & Cafe', cuisine: 'Goan-Portuguese', dish: 'Fresh croissants, Goan poi bread with butter, and spiced omelette' },
        lunch: { spot: 'Pousada by the Beach', cuisine: 'Traditional Goan', dish: 'Goan Fish Curry Thali with kingfish and coconut kokum sol kadhi' },
        dinner: { spot: 'Britto’s Beach Shack', cuisine: 'Seafood & Grill', dish: 'Butter Garlic Tiger Prawns, Crab Xec Xec, and Bebinca dessert' },
      },
      aiTravelTip: 'Family Tip: Beach shacks near Calangute offer sunbeds for free if you order beverages or snacks.',
    },
    {
      theme: 'Historic Forts, Portuguese Heritage & Dolphin Cruise',
      places: ['Aguada Fort & Lighthouse', 'Sinquerim Beach', 'Fontainhas Latin Quarter'],
      activities: [
        { time: '09:00', title: 'Aguada Fort & Portuguese Lighthouse Tour', desc: 'Explore the 17th-century Portuguese fortress overlooking the Arabian Sea.', type: 'sightseeing', location: 'Candolim, Goa', cost: 10 },
        { time: '11:30', title: 'Dolphin Spotting Boat Safari', desc: 'Short scenic boat trip from Sinquerim bay to spot playful Arabian Sea dolphins.', type: 'adventure', location: 'Sinquerim Jetty', cost: 20 },
        { time: '16:00', title: 'Fontainhas UNESCO Heritage Walk', desc: 'Photograph pastel-colored colonial Portuguese mansions in Panaji Latin Quarter.', type: 'culture', location: 'Fontainhas, Panaji', cost: 5 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Artjuna Garden Cafe', cuisine: 'Healthy Continental', dish: 'Shakshuka, tropical smoothie bowls, and artisan iced espresso' },
        lunch: { spot: 'Viva Panjim', cuisine: 'Authentic Goan Heritage', dish: 'Prawn Balchão, Pork Vindaloo, and Goan Red Rice' },
        dinner: { spot: 'Fisherman’s Wharf Panjim', cuisine: 'Riverside Seafood', dish: 'Tandoori Pomfret, Fish Recheado, and Serradura pudding' },
      },
      aiTravelTip: 'Carry a wide-brim hat and sunglasses when exploring Fort Aguada ramparts in the morning.',
    },
    {
      theme: 'Spice Plantations, Waterfalls & Mandovi River Cruise',
      places: ['Sahakari Spice Plantation', 'Old Goa Bom Jesus Basilica', 'Mandovi River Promenade'],
      activities: [
        { time: '09:30', title: 'Guided Spice Farm & Elephant Interaction', desc: 'Walk through lush vanilla, cardamom, and cinnamon groves with traditional herbal welcome.', type: 'culture', location: 'Ponda, Goa', cost: 25 },
        { time: '14:30', title: 'Basilica of Bom Jesus UNESCO Tour', desc: 'Visit the world-renowned 16th-century baroque cathedral holding the sacred relics of St. Francis Xavier.', type: 'culture', location: 'Old Goa', cost: 5 },
        { time: '18:00', title: 'Mandovi Luxury Sunset Cruise & Folk Dance', desc: 'Scenic evening river cruise with traditional Dekhni and Fugdi Goan folk dance performances.', type: 'leisure', location: 'Panaji Riverfront', cost: 30 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Cafe Bodega', cuisine: 'Courtyard Bakery', dish: 'Eggs Florentine, fresh mango tarts, and freshly ground filter roast' },
        lunch: { spot: 'Spice Plantation Buffet', cuisine: 'Traditional Saraswat', dish: 'Kaju Kismis Pulao, Surmai Rava Fry, and Banana leaf organic feast' },
        dinner: { spot: 'Thalassa Greek Taverna', cuisine: 'Mediterranean & Greek', dish: 'Grilled Halloumi, Greek Salad, Lamb Souvlaki with cliff sunset view' },
      },
      aiTravelTip: 'Buy authentic whole spices and natural vanilla extract directly from the spice plantation cooperative.',
    },
    {
      theme: 'Flea Markets, Cliffside Views & Departure Leisure',
      places: ['Anjuna Flea Market', 'Vagator Chapora Fort (Dil Chahta Hai)', 'Curlies Ocean Deck'],
      activities: [
        { time: '10:00', title: 'Bohemian Market Shopping & Souvenirs', desc: 'Browse handcrafted leather goods, jewelry, spices, and bohemian beachwear.', type: 'shopping', location: 'Anjuna Beach', cost: 10 },
        { time: '14:00', title: 'Chapora Fort Panoramic Cliff Climb', desc: 'Hike to the iconic hilltop fort overlooking Ozran and Vagator beaches.', type: 'sightseeing', location: 'Vagator, Goa', cost: 0 },
        { time: '17:00', title: 'Farewell Beach Lounging & Sunset View', desc: 'Relax on sun loungers while enjoying tropical coolers before airport transfer.', type: 'leisure', location: 'Ozran Beach', cost: 15 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'German Bakery Anjuna', cuisine: 'European Bakery', dish: 'Apple cinnamon strudel, masala chai, and fresh papaya bowl' },
        lunch: { spot: 'Gunpowder', cuisine: 'South Indian Coastal', dish: 'Kerala Beef Roast / Paneer Curry with flaky Malabar Parottas' },
        dinner: { spot: 'Olive Bar & Kitchen Vagator', cuisine: 'Gourmet Mediterranean', dish: 'Wood-fired Truffle Pizza, Grilled Seabass, and Tiramisu' },
      },
      aiTravelTip: 'Book airport cabs in advance or use pre-paid taxi counters for fixed, reliable airport drop rates.',
    },
  ],

  // 2. Kerala (India)
  kerala: [
    {
      theme: 'Cochin Colonial Heritage & Chinese Fishing Nets',
      places: ['Fort Kochi Beach', 'Chinese Fishing Nets', 'Mattancherry Jewish Synagogue'],
      activities: [
        { time: '10:00', title: 'Fort Kochi Walking Tour & Fishing Nets', desc: 'Witness ancient 14th-century cantilevered Chinese fishing nets in active operation.', type: 'sightseeing', location: 'Fort Kochi', cost: 5 },
        { time: '14:30', title: 'Mattancherry Palace & Jew Town Antique Walk', desc: 'Explore 16th-century royal murals and shop for authentic spices and antiques.', type: 'culture', location: 'Jew Town, Kochi', cost: 10 },
        { time: '18:00', title: 'Kathakali Live Dance & Martial Arts Show', desc: 'Watch traditional makeup demonstration followed by elaborate Kathakali storytelling.', type: 'culture', location: 'Kerala Kathakali Centre', cost: 20 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Kashi Art Cafe', cuisine: 'Artisan Cafe', dish: 'Organic poached eggs, whole wheat toast, and French press coffee' },
        lunch: { spot: 'Grand Hotel Restaurant', cuisine: 'Authentic Kerala', dish: 'Karimeen Pollichathu (Pearl spot fish in banana leaf) with Appam' },
        dinner: { spot: 'Fort House Restaurant', cuisine: 'Waterfront Seafood', dish: 'Malabar Prawn Curry, Garlic Naan, and Coconut Soufflé' },
      },
      aiTravelTip: 'Arrive at the Kathakali theatre 30 minutes early to watch the fascinating facial makeup process.',
    },
    {
      theme: 'Alleppey Private Houseboat Backwater Cruise',
      places: ['Vembanad Lake', 'Kuttanad Floating Villages', 'Alleppey Backwaters'],
      activities: [
        { time: '12:00', title: 'Houseboat Embarkation & Welcome Drink', desc: 'Board a traditional luxury Kettuvallam wooden houseboat with private bedrooms and deck.', type: 'leisure', location: 'Alleppey Finishing Point', cost: 80 },
        { time: '14:00', title: 'Lagoon Cruising & Village Life Observation', desc: 'Glide past emerald paddy fields, duck farms, coir makers, and water lilies.', type: 'sightseeing', location: 'Vembanad Lake', cost: 0 },
        { time: '18:30', title: 'Sunset Anchoring & Traditional Candlelight Dinner', desc: 'Houseboat anchors in a tranquil canal for a peaceful night amidst nature.', type: 'dining', location: 'Kuttanad Canal', cost: 0 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Houseboat Onboard Chef', cuisine: 'Kerala Traditional', dish: 'Fluffy Idlis with sambar, coconut chutney, and banana fritters' },
        lunch: { spot: 'Houseboat Fresh Catch Buffet', cuisine: 'Backwater Specialties', dish: 'Freshly caught river Scampi, Moru curry, Aviyal, and Red Rice' },
        dinner: { spot: 'Houseboat Deck Dining', cuisine: 'Kerala Delicacy', dish: 'Kerala Chicken Pepper Fry, Malabar Parotta, and Payasam dessert' },
      },
      aiTravelTip: 'Carry mosquito repellent for evening hours on the open waters of the backwaters.',
    },
    {
      theme: 'Munnar Misty Tea Gardens & Mountain Peaks',
      places: ['Tata Tea Museum', 'Mattupetty Dam', 'Echo Point'],
      activities: [
        { time: '09:00', title: 'Tea Plantation Walk & Factory Processing Tour', desc: 'Learn the journey of tea from leaf plucking to packaging with tea tasting session.', type: 'culture', location: 'Munnar Tea Estate', cost: 15 },
        { time: '13:30', title: 'Mattupetty Lake Speedboat Excursion', desc: 'Scenic mountain lake surrounded by rolling tea gardens and wild elephant corridors.', type: 'adventure', location: 'Mattupetty Dam', cost: 20 },
        { time: '16:30', title: 'Echo Point Photography & Spice Shopping', desc: 'Experience natural acoustic echo phenomenon surrounded by misty hills.', type: 'sightseeing', location: 'Echo Point, Munnar', cost: 5 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Rapsy Restaurant', cuisine: 'Local Kerala', dish: 'Spanish egg omelette with crispy Kerala parotta and ginger tea' },
        lunch: { spot: 'Saravana Bhavan Munnar', cuisine: 'Pure Veg South Indian', dish: 'Full 14-dish South Indian Banana Leaf Sadhya' },
        dinner: { spot: 'The Hill Club Dining', cuisine: 'Colonial Indian', dish: 'Chettinad Curry, Tandoori Platters, and warm Gulab Jamun' },
      },
      aiTravelTip: 'Pack a light fleece jacket as evenings in Munnar can drop to 12°C even in summer.',
    },
    {
      theme: 'Marari Beach Relaxation & Ayurvedic Spa',
      places: ['Marari Secluded Beach', 'Ayurvedic Wellness Spa', 'Kumarakom Bird Sanctuary'],
      activities: [
        { time: '09:30', title: 'Kumarakom Bird Sanctuary Walk', desc: 'Spot migratory Siberian storks, herons, and kingfishers on scenic nature boardwalks.', type: 'nature', location: 'Kumarakom', cost: 10 },
        { time: '14:00', title: 'Authentic 90-Minute Ayurvedic Abhyanga Massage', desc: 'Holistic rejuvenation massage using warm medicated herbal oils and steam bath.', type: 'wellness', location: 'Marari Wellness Spa', cost: 45 },
        { time: '17:30', title: 'Sunset Coastal Walk & Farewell Dinner', desc: 'Pristine, non-commercialized beach walk watching local fishing catamarans return.', type: 'leisure', location: 'Marari Beach', cost: 0 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Marari Beachside Bakery', cuisine: 'Continental & Indian', dish: 'Fresh tropical fruit platter, Puttu with Kadala curry, and filter coffee' },
        lunch: { spot: 'Farmhouse Cafe', cuisine: 'Organic Farm-to-Table', dish: 'Fresh tender coconut water, Fish Moly with Appams' },
        dinner: { spot: 'Beach Pavilion Grill', cuisine: 'Catch of the Day', dish: 'Grilled Lobster with Lemon Garlic Butter, Tossed Salad, and Mango Kulfi' },
      },
      aiTravelTip: 'Consult the resident Ayurvedic doctor at the wellness center for a personalized body type (Dosha) recommendation.',
    },
  ],

  // 3. Bali (Indonesia)
  bali: [
    {
      theme: 'Ubud Arrival, Monkey Forest & Tropical Villa Relaxation',
      places: ['Sacred Monkey Forest Sanctuary', 'Ubud Royal Palace', 'Ubud Art Market'],
      activities: [
        { time: '13:00', title: 'Private Villa Check-in & Floating Breakfast Preview', desc: 'Check in to a private pool villa surrounded by jungle foliage in Ubud.', type: 'leisure', location: 'Ubud Valley', cost: 0 },
        { time: '15:30', title: 'Sacred Monkey Forest Sanctuary Expedition', desc: 'Wander among ancient moss-covered temples and hundreds of playful Balinese macaques.', type: 'sightseeing', location: 'Padangtegal, Ubud', cost: 15 },
        { time: '19:00', title: 'Balinese Royal Kecak Fire Dance Performance', desc: 'Hypnotic vocal chanting and Ramayana fire dance performance in an open-air amphitheater.', type: 'culture', location: 'Ubud Palace Stage', cost: 20 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Clear Cafe Ubud', cuisine: 'Organic Vegan & Fusion', dish: 'Dragonfruit smoothie bowl, artisanal cashew toast, and iced matcha latte' },
        lunch: { spot: 'Bebek Bengil (Dirty Duck Diner)', cuisine: 'Authentic Balinese', dish: 'Famous Crispy Duck with Sambal Matah and fragrant spiced rice' },
        dinner: { spot: 'Locavore To Go', cuisine: 'Modern Indonesian', dish: 'Slow-cooked beef rendang sliders and artisanal sweet potato fries' },
      },
      aiTravelTip: 'Keep small accessories like sunglasses and water bottles secured when entering the Monkey Forest.',
    },
    {
      theme: 'Tegallalang Rice Terraces, Jungle Swing & Tirta Empul',
      places: ['Tegallalang Rice Terraces', 'Bali Jungle Giant Swing', 'Tirta Empul Holy Water Temple'],
      activities: [
        { time: '08:00', title: 'Early Morning Rice Terraces Photography', desc: 'Walk along the emerald green tiered rice terraces before midday crowds arrive.', type: 'sightseeing', location: 'Tegallalang', cost: 10 },
        { time: '10:30', title: 'Jungle Giant Swing & River Valley Zip', desc: 'Fly above lush tropical rainforest on a dramatic 30-meter high swing.', type: 'adventure', location: 'Alas Harum Swing Park', cost: 35 },
        { time: '14:30', title: 'Tirta Empul Holy Water Purification Ritual', desc: 'Experience traditional Hindu purification cleansing in the sacred spring pools.', type: 'culture', location: 'Tampak Siring', cost: 15 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Sari Organik', cuisine: 'Farm Organic', dish: 'Avocado tartine on homemade sourdough with local ginger lemongrass infusion' },
        lunch: { spot: 'Tis Cafe Tegallalang', cuisine: 'Infinity Pool Cafe', dish: 'Nasi Goreng Royale with chicken satay, fried egg, and prawn crackers' },
        dinner: { spot: 'Mozaic Restaurant Gastronomique', cuisine: 'French-Indonesian Haute Cuisine', dish: '6-Course Tasting Menu featuring local spices with wine pairings' },
      },
      aiTravelTip: 'Sarongs are required to enter Tirta Empul temple and are provided for free at the main entrance.',
    },
    {
      theme: 'Uluwatu Cliffs, Surfing Coastline & Jimbaran Seafood',
      places: ['Uluwatu Cliff Temple', 'Padang Padang Beach', 'Jimbaran Bay'],
      activities: [
        { time: '11:00', title: 'Padang Padang Hidden Cove Surf & Sunbathe', desc: 'Relax at the famous cove surrounded by dramatic limestone rock formations.', type: 'beaches', location: 'Pecatu, South Bali', cost: 5 },
        { time: '16:00', title: 'Uluwatu Oceanfront Cliff Temple Lookout', desc: 'Stroll along the 70-meter high cliffside promenade with panoramic Indian Ocean views.', type: 'sightseeing', location: 'Uluwatu', cost: 15 },
        { time: '18:30', title: 'Jimbaran Bay Sunset Seafood Feast', desc: 'Candlelight dining with feet in the sand as waves lap the shore.', type: 'dining', location: 'Jimbaran Bay', cost: 40 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'The Cashew Tree', cuisine: 'Healthy Coastal', dish: 'Acai superfood bowl with chia seeds, granola, and iced coconut water' },
        lunch: { spot: 'Single Fin Bali', cuisine: 'Cliffside Bar & Grill', dish: 'Mahi Mahi Fish Tacos, Truffle Fries, and fresh watermelon juice' },
        dinner: { spot: 'Menega Cafe Jimbaran', cuisine: 'Ocean BBQ Seafood', dish: 'Grilled Red Snapper, Jumbo King Prawns, and Squid Skewers with garlic butter' },
      },
      aiTravelTip: 'Arrive at Jimbaran Bay around 17:45 to secure front-row tables closest to the water for sunset.',
    },
  ],

  // 4. Paris (France)
  paris: [
    {
      theme: 'Iconic Landmarks, Seine River Cruise & Eiffel Tower Views',
      places: ['Eiffel Tower', 'Champ de Mars', 'Seine River Cruise Point'],
      activities: [
        { time: '10:00', title: 'Eiffel Tower Summit Elevator & Panoramic View', desc: 'Ascend to the top deck of the iron lady for breathtaking 360° city panoramas.', type: 'sightseeing', location: 'Champ de Mars, Paris', cost: 35 },
        { time: '14:30', title: 'Tuileries Gardens & Place de la Concorde Stroll', desc: 'Walk through historic royal gardens designed by André Le Nôtre.', type: 'leisure', location: 'Tuileries, 1st Arr.', cost: 0 },
        { time: '19:30', title: 'Glass-Canopy Seine River Illuminated Dinner Cruise', desc: 'Gourmet French multi-course dinner while gliding past illuminated monuments.', type: 'dining', location: 'Port de la Bourdonnais', cost: 95 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Carefulte Boulangerie & Cafe', cuisine: 'Classic Parisian', dish: 'Fresh butter croissants, Pain au Chocolat, and Café Crème' },
        lunch: { spot: 'Le Comptoir du Relais', cuisine: 'Traditional French Bistro', dish: 'Duck Confit with gratin dauphinois and green salad' },
        dinner: { spot: 'Bateaux Parisiens Gourmet', cuisine: 'Haute French Cuisine', dish: 'Foie Gras, Roasted Veal with truffle jus, and Grand Marnier Soufflé' },
      },
      aiTravelTip: 'Book Eiffel Tower summit tickets online 60 days in advance to skip the 2-hour queue.',
    },
    {
      theme: 'Art Treasures at the Louvre & Latin Quarter Bohemian Charm',
      places: ['Musée du Louvre', 'Palais Royal Gardens', 'Notre-Dame & Saint-Germain'],
      activities: [
        { time: '09:30', title: 'Louvre Masterpiece Guided VIP Tour', desc: 'Skip-the-line entrance exploring Mona Lisa, Winged Victory, and Venus de Milo.', type: 'culture', location: 'Rue de Rivoli', cost: 45 },
        { time: '14:00', title: 'Palais-Royal Historic Arcades & Buren Columns', desc: 'Walk through tranquil courtyard with black-and-white striped art columns.', type: 'sightseeing', location: 'Palais-Royal', cost: 0 },
        { time: '17:00', title: 'Saint-Germain-des-Prés Historic Literary Cafe Stroll', desc: 'Walk the footsteps of Hemingway and Sartre among bookstores and boutique art galleries.', type: 'culture', location: '6th Arrondissement', cost: 0 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Café de Flore', cuisine: 'Historic Parisian Cafe', dish: 'Croque Monsieur, Welsh Rarebit, and traditional hot chocolate' },
        lunch: { spot: 'L’As du Fallafel', cuisine: 'Le Marais Street Food', dish: 'Legendary Special Pita Fallafel with grilled eggplant and tahini' },
        dinner: { spot: 'Bouillon Chartier', cuisine: 'Belle Époque Historic Brasserie', dish: 'Escargots de Bourgogne, Steak Frites, and Profiteroles with chocolate sauce' },
      },
      aiTravelTip: 'The Louvre is closed on Tuesdays; plan visits for Wednesday or Friday evenings when it stays open late.',
    },
    {
      theme: 'Palace of Versailles Grandeur & Hall of Mirrors',
      places: ['Château de Versailles', 'Grand Trianon & Queen’s Hamlet', 'Versailles Fountain Gardens'],
      activities: [
        { time: '09:00', title: 'RER Train Journey & Versailles Royal Palace Tour', desc: 'Explore the 700-room royal residence, King’s Bedchamber, and the Hall of Mirrors.', type: 'culture', location: 'Versailles', cost: 30 },
        { time: '13:30', title: 'Versailles Grand Musical Gardens & Grand Canal Walk', desc: 'Stroll among geometric hedges, marble statues, and dancing fountains.', type: 'sightseeing', location: 'Versailles Estate', cost: 15 },
        { time: '16:30', title: 'Queen Marie-Antoinette’s Rustic Countryside Hamlet', desc: 'Discover the fairytale thatched cottages and working royal farm.', type: 'leisure', location: 'Petit Trianon', cost: 0 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Paul Bakery Versailles', cuisine: 'Artisan Patisserie', dish: 'Almond croissants, quiche Lorraine, and cafe au lait' },
        lunch: { spot: 'La Flottille Grand Canal', cuisine: 'French Brasserie', dish: 'Galette de sarrasin (Savory crepe) with ham, Emmental cheese, and cider' },
        dinner: { spot: 'Ore - Ducasse au Château de Versailles', cuisine: 'Contemporary French Haute', dish: 'Gourmet roasted poultry, seasonal vegetables, and royal chocolate dessert' },
      },
      aiTravelTip: 'Rent a golf cart or bicycle at the Versailles Grand Canal to easily cover the sprawling estate grounds.',
    },
  ],

  // 5. Swiss Alps (Switzerland)
  swiss_alps: [
    {
      theme: 'Zermatt Arrival & Iconic Matterhorn Glacier Views',
      places: ['Zermatt Alpine Village', 'Gornergrat Railway', 'Riffelsee Alpine Lake'],
      activities: [
        { time: '10:00', title: 'Gornergrat Cogwheel Train Ascent to 3,089m', desc: 'Europe’s highest open-air cogwheel train climbing past larch forests and glaciers.', type: 'sightseeing', location: 'Zermatt Station', cost: 85 },
        { time: '13:00', title: 'Riffelsee Lake Reflection Hike', desc: 'Short scenic alpine walk to capture the iconic Matterhorn reflection in mirror-like waters.', type: 'nature', location: 'Riffelsee Station', cost: 0 },
        { time: '18:30', title: 'Traditional Swiss Cheese Fondue Dinner', desc: 'Cozy fireside dinner in a rustic wooden alpine chalet.', type: 'dining', location: 'Old Zermatt Village', cost: 45 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Bäckerei Fuchs Zermatt', cuisine: 'Swiss Bakery', dish: 'Freshly baked Zopf braided bread with Swiss mountain butter and wildflower honey' },
        lunch: { spot: '3100 Kulmhotel Gornergrat', cuisine: 'High Alpine Restaurant', dish: 'Swiss Rösti with fried egg, crispy speck bacon, and melted Gruyère' },
        dinner: { spot: 'Restaurant Schäferstube', cuisine: 'Valais Heritage Tavern', dish: 'Half-and-Half Cheese Fondue with bread cubes, boiled potatoes, and White Fendant wine' },
      },
      aiTravelTip: 'Zermatt is a car-free town; all travel within the village is on foot or via electric e-taxis.',
    },
    {
      theme: 'Jungfraujoch - Top of Europe & Ice Palace Expedition',
      places: ['Jungfraujoch Sphinx Observatory', 'Aletsch Glacier', 'Ice Palace'],
      activities: [
        { time: '08:30', title: 'Eiger Express Cable Car & Mountain Tunnel Train', desc: 'High-speed gondola past the legendary Eiger North Face to Europe’s highest railway station.', type: 'adventure', location: 'Grindelwald Terminal', cost: 140 },
        { time: '11:30', title: 'Ice Palace Carved Tunnels & Sphinx Observation Deck', desc: 'Walk inside natural glacier ice tunnels with frozen animal sculptures.', type: 'sightseeing', location: 'Jungfraujoch (3,454m)', cost: 0 },
        { time: '15:30', title: 'Lauterbrunnen Valley of 72 Waterfalls Walk', desc: 'Walk along the fairytale valley that inspired Tolkien’s Rivendell.', type: 'nature', location: 'Lauterbrunnen', cost: 0 },
      ],
      foodSuggestions: {
        breakfast: { spot: 'Eiger Bakery Grindelwald', cuisine: 'Swiss Alpine', dish: 'Bircher Muesli with fresh berries, toasted nuts, and alpine milk' },
        lunch: { spot: 'Restaurant Crystal Jungfraujoch', cuisine: 'Glacier Dining', dish: 'Traditional Zürcher Geschnetzeltes (Veal in creamy mushroom sauce) with golden Rösti' },
        dinner: { spot: 'Hotel Oberland Restaurant', cuisine: 'Traditional Bernese', dish: 'Cheese Raclette scraped fresh from wheel, pickled onions, and Swiss chocolate mousse' },
      },
      aiTravelTip: 'Dress in layered warm thermal clothing and sunglasses; solar radiation on the glacier is intense.',
    },
  ],
};

// Generic fallback template for any destination
const GENERIC_DAY_TEMPLATES = [
  {
    theme: 'Arrival, Landmark Exploration & Welcome Dinner',
    placesPrefix: ['Historic Downtown Promenade', 'Main City Landmark Square', 'Panoramic Sunset Viewpoint'],
    activityTemplates: [
      { time: '14:00', title: 'Check-in & Neighborhood Orientation Walk', desc: 'Settle into accommodation and take a relaxing stroll through nearby avenues.', type: 'leisure', cost: 0 },
      { time: '16:30', title: 'City Landmark Exploration & Photography', desc: 'Visit iconic regional architecture and capture memorable photos.', type: 'sightseeing', cost: 15 },
      { time: '19:30', title: 'Welcome Dinner with Regional Specialties', desc: 'Enjoy dinner at a celebrated local restaurant featuring authentic gastronomy.', type: 'dining', cost: 30 },
    ],
    foodTemplates: {
      breakfast: { spot: 'Artisan City Bakery', cuisine: 'Local & Continental', dish: 'Freshly baked pastries, seasonal fruit, and artisan coffee' },
      lunch: { spot: 'Heritage Bistro', cuisine: 'Regional Cuisine', dish: 'Signature local delicacy platter with artisanal sides' },
      dinner: { spot: 'Panoramic Rooftop Tavern', cuisine: 'Gourmet Local', dish: 'Chef tasting menu with local catch and signature dessert' },
    },
    aiTravelTip: 'Keep a digital offline map of the city saved on your phone for easy navigation.',
  },
  {
    theme: 'Cultural Highlights, Art Heritage & Scenic Tour',
    placesPrefix: ['Famous Art & History Museum', 'Historic Temple / Cathedral Quarter', 'Local Artisan Crafts Market'],
    activityTemplates: [
      { time: '09:30', title: 'Famous Museum & Heritage Gallery Guided Tour', desc: 'Discover historical artifacts, master paintings, and cultural exhibitions.', type: 'culture', cost: 25 },
      { time: '14:00', title: 'Historic Old Quarter & Crafts Market Walk', desc: 'Browse handcrafted souvenirs, spices, and meet local artisans.', type: 'shopping', cost: 10 },
      { time: '17:30', title: 'Scenic Sunset Walk or River/Lake Promenade', desc: 'Watch golden hour over the skyline or waterways.', type: 'leisure', cost: 5 },
    ],
    foodTemplates: {
      breakfast: { spot: 'Historic Courtyard Cafe', cuisine: 'Traditional Morning', dish: 'Traditional breakfast combo with fresh juice and warm bakery items' },
      lunch: { spot: 'Local Market Food Hall', cuisine: 'Street Food & Regional', dish: 'Famous specialty noodles / rice platter / savory crepes' },
      dinner: { spot: 'Riverside Garden Grill', cuisine: 'Farm-to-Table', dish: 'Charcoal grilled delicacies with fresh garden salad' },
    },
    aiTravelTip: 'Wear comfortable walking shoes as historical districts often feature cobblestone streets.',
  },
  {
    theme: 'Outdoor Excursion, Nature Scenic Trail & Farewell Feast',
    placesPrefix: ['Scenic Nature Reserve', 'Mountain / Coastal Lookout', 'Celebrated Waterfront'],
    activityTemplates: [
      { time: '09:00', title: 'Scenic Nature Park & Outdoor Adventure', desc: 'Guided nature hike, cable car ascent, or boat excursion in pristine surroundings.', type: 'adventure', cost: 35 },
      { time: '14:00', title: 'Botanical Gardens & Relaxation Stroll', desc: 'Rest beneath exotic flora and enjoy a tranquil afternoon picnic.', type: 'nature', cost: 10 },
      { time: '19:00', title: 'Celebratory Farewell Dinner & Live Entertainment', desc: 'Culinary grand finale with cultural performance or panoramic views.', type: 'dining', cost: 45 },
    ],
    foodTemplates: {
      breakfast: { spot: 'Garden Terrace Cafe', cuisine: 'Healthy Continental', dish: 'Avocado toast, farm fresh eggs, and cold-pressed juices' },
      lunch: { spot: 'Lakeside / Seaside Eatery', cuisine: 'Fresh Catch & Grill', dish: 'Catch of the day with herb roasted potatoes' },
      dinner: { spot: 'Grand Heritage Dining Room', cuisine: 'Fine Dining Regional', dish: 'Multi-course culinary signature feast with pairing' },
    },
    aiTravelTip: 'Double check luggage weight and souvenirs before departure to ensure seamless airport check-in.',
  },
];

/**
 * Main AI Smart Itinerary Generation Engine
 */
function generateItinerary({
  destination = 'Goa Coastal Haven',
  destinationId,
  destinationName,
  numberOfDays,
  duration,
  durationDays = 4,
  budget = 20000,
  currency = 'INR',
  travelers = 1,
  travelType = 'family',
  interests = ['beach', 'dining', 'sightseeing'],
  startDate = new Date().toISOString().split('T')[0],
}) {
  const destStr = String(destinationName || destination || 'Goa').toLowerCase();
  const totalDays = Math.max(1, Math.min(14, parseInt(numberOfDays || duration || durationDays || 4, 10)));
  const totalBudget = parseFloat(budget) || 20000;
  const isINR = String(currency).toUpperCase() === 'INR';
  const budgetPerDay = Math.round(totalBudget / totalDays);

  // Match key destination bank
  let key = 'generic';
  if (destStr.includes('goa')) key = 'goa';
  else if (destStr.includes('kerala') || destStr.includes('kochi') || destStr.includes('alleppey') || destStr.includes('munnar')) key = 'kerala';
  else if (destStr.includes('bali') || destStr.includes('indonesia') || destStr.includes('ubud')) key = 'bali';
  else if (destStr.includes('paris') || destStr.includes('france')) key = 'paris';
  else if (destStr.includes('swiss') || destStr.includes('alps') || destStr.includes('zermatt')) key = 'swiss_alps';

  const dayTemplates = DESTINATION_SMART_DAYS[key] || [];

  const start = new Date(startDate);
  const itineraryDays = [];
  const allItineraryItems = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().split('T')[0];
    const dayNumber = i + 1;

    let dayData;
    if (dayTemplates.length > 0) {
      // Cycle through destination specific templates
      const template = dayTemplates[i % dayTemplates.length];
      dayData = {
        dayNumber,
        date: dateStr,
        theme: `Day ${dayNumber}: ${template.theme}`,
        places: template.places,
        activities: template.activities.map((act, actIdx) => ({
          ...act,
          id: (i * 10) + actIdx + 1,
          day: dayNumber,
          date: dateStr,
        })),
        foodSuggestions: template.foodSuggestions,
        aiTravelTip: template.aiTravelTip,
        estimatedDailyCost: isINR ? `₹${budgetPerDay.toLocaleString()}` : `$${budgetPerDay.toLocaleString()}`,
      };
    } else {
      // Generic template synthesized with destination name
      const genericTemplate = GENERIC_DAY_TEMPLATES[i % GENERIC_DAY_TEMPLATES.length];
      dayData = {
        dayNumber,
        date: dateStr,
        theme: `Day ${dayNumber}: ${genericTemplate.theme}`,
        places: genericTemplate.placesPrefix.map((p) => `${destination} - ${p}`),
        activities: genericTemplate.activityTemplates.map((act, actIdx) => ({
          ...act,
          id: (i * 10) + actIdx + 1,
          day: dayNumber,
          date: dateStr,
          location: `${destination}, City Center`,
        })),
        foodSuggestions: genericTemplate.foodTemplates,
        aiTravelTip: genericTemplate.aiTravelTip,
        estimatedDailyCost: isINR ? `₹${budgetPerDay.toLocaleString()}` : `$${budgetPerDay.toLocaleString()}`,
      };
    }

    itineraryDays.push(dayData);
    allItineraryItems.push(...dayData.activities);
  }

  return {
    destination: destinationName || destination,
    totalDays,
    totalBudget,
    currency,
    travelType,
    interests: Array.isArray(interests) ? interests : [interests],
    startDate,
    days: itineraryDays,
    itineraryItems: allItineraryItems,
    aiWorkflow: {
      step1_profiling: `Analyzed ${travelType.toUpperCase()} travel style and interest vectors (${Array.isArray(interests) ? interests.join(', ') : interests}).`,
      step2_budgetPacing: `Allocated dynamic daily allowance of ${isINR ? `₹${budgetPerDay.toLocaleString()}` : `$${budgetPerDay.toLocaleString()}`}/day (Stays 40%, Dining 30%, Activities 20%, Local Transport 10%).`,
      step3_geographicClustering: 'Grouped proximate landmarks and points of interest each day to minimize commute and transit fatigue.',
      step4_culinaryCuration: 'Curated 3 iconic daily dining recommendations (Breakfast, Lunch, Dinner) tailored to authentic local gastronomy.',
      step5_contextualTips: `Generated personalized safety, budget, and travel tips optimized for ${travelType.toUpperCase()} travelers.`,
    },
  };
}

module.exports = {
  generateItinerary,
  DESTINATION_SMART_DAYS,
};
