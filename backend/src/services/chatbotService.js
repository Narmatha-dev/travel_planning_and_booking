const config = require('../config/environment');
const weatherService = require('./weatherService');

// In-memory multi-turn session history & conversational context store
const sessionHistories = new Map();
const sessionContexts = new Map();

// Curated travel domain knowledge base
const KNOWLEDGE_BASE = {
  destinations: [
    {
      name: 'Goa',
      nameTa: 'கோவா',
      country: 'India',
      countryTa: 'இந்தியா',
      category: 'Beach & Coastal',
      categoryTa: 'கடற்கரை & பொழுதுபோக்கு',
      bestTime: 'November to March (Pleasant 28°C sunny weather)',
      bestTimeTa: 'நவம்பர் முதல் மார்ச் வரை (இதமான 28°C வெயில் காலம்)',
      bestTimeTh: 'November mudhal March varai (Pleasant sunny weather)',
      dailyCostINR: '₹3,500 - ₹5,000 / day',
      dailyCostUSD: '$45 - $65 / day',
      idealDuration: '3 to 5 Days',
      idealDurationTa: '3 முதல் 5 நாட்கள்',
      idealDurationTh: '3 to 5 Naatkal',
      highlights: 'Calangute & Baga beaches, Aguada Fort, Mandovi sunset river cruise, Fontainhas Latin quarter, authentic Goan seafood.',
      highlightsTa: 'கலங்குட் & பாகா கடற்கரைகள், அகுவாடா கோட்டை, மண்டோவி படகு சவாரி, பொன்டைன்ஹாஸ் லத்தீன் பகுதி, ருசியான கடல் உணவுகள்.',
      highlightsTh: 'Calangute & Baga beaches, Aguada Fort, Mandovi sunset cruise, tasty sea food, water sports.',
      hotels: 'W Goa (Luxury Beachfront), Taj Fort Aguada (Heritage Resort), Zostel Goa (Budget / Backpackers)',
      hotelsTa: 'தாஜ் ஃபோர்ட் அகுவாடா (பாரம்பரிய ரிசார்ட்), டபிள்யூ கோவா (கடற்கரை சொகுசு), ஜோஸ்டல் கோவா (பட்ஜெட் தங்குமிடம்)',
      hotelsTh: 'Taj Fort Aguada (Heritage), W Goa (Luxury Beachfront), Zostel Goa (Budget stay)',
      food: 'Goan Fish Curry with steamed rice, Prawn Balchão, Bebinca dessert, Poi bread with chorizo',
      foodTa: 'சுவையான கோவா மீன் குழம்பு, இறால் பால்சாவோ, பாரம்பரிய பெபிங்கா இனிப்பு',
      foodTh: 'Goan Fish Curry Meals, Prawn Balchao, Bebinca traditional sweet',
      transport: 'Renting a scooter (₹350-₹500/day) or self-drive car is the most flexible way to explore North & South Goa.',
      transportTa: 'ஸ்கூட்டர் வாடகைக்கு எடுப்பது (நாள் ஒன்றுக்கு ₹350-₹500) கோவாவை சுற்றிப் பார்க்க சிறந்த வழியாகும்.',
      transportTh: 'Scooter rent panni (₹350-₹500/day) suthuradhu romba easy and convenient.',
      daysPlan: [
        { day: 1, title: 'North Goa Beaches & Sunset', plan: 'Arrive, check in at Candolim/Calangute, relax at Baga Beach, watersports, evening sunset at Thalassa or Curlies with live music.' },
        { day: 2, title: 'Heritage & Latin Quarter Culture', plan: 'Morning visit to Aguada Fort & lighthouse, stroll through Fontainhas colourful Portuguese streets, evening luxury Mandovi river cruise.' },
        { day: 3, title: 'South Goa Serenity & Island Cruise', plan: 'Day trip to Palolem & Butterfly beaches, dolphin spotting boat tour, beach shack candlelight seafood dinner.' },
        { day: 4, title: 'Spice Plantations & Shopping', plan: 'Visit Sahakari Spice Farm with traditional Goan buffet lunch, Anjuna flea market shopping, departure.' },
      ],
      link: '/destinations',
    },
    {
      name: 'Ooty',
      nameTa: 'ஊட்டி',
      country: 'India',
      countryTa: 'இந்தியா',
      category: 'Hill Station & Nature',
      categoryTa: 'மலை வாசஸ்தலம் & இயற்கை',
      bestTime: 'October to June (Pleasant weather, 15°C - 22°C)',
      bestTimeTa: 'அக்டோபர் முதல் ஜூன் வரை (இதமான குளிர் பருவம்)',
      bestTimeTh: 'October mudhal June varai (Pleasant climate)',
      dailyCostINR: '₹2,500 - ₹4,500 / day',
      dailyCostUSD: '$30 - $55 / day',
      idealDuration: '3 to 4 Days',
      idealDurationTa: '3 முதல் 4 நாட்கள்',
      idealDurationTh: '3 to 4 Naatkal',
      highlights: 'Nilgiri Mountain Toy Train, Ooty Lake boating, Botanical Gardens, Doddabetta Peak, Pykara Waterfalls.',
      highlightsTa: 'நீலகிரி மலை ரயில், ஊட்டி ஏரி படகு சவாரி, தாவரவியல் பூங்கா, தொட்டபெட்டா சிகரம், பைக்காரா நீர்வீழ்ச்சி.',
      highlightsTh: 'Toy train, Ooty lake boating, Botanical garden, Doddabetta peak, Pykara falls.',
      hotels: 'Savoy - IHCL SeleQtions (Heritage Luxury), Sterling Ooty Fern Hill, Zostel Ooty (Budget)',
      hotelsTa: 'சவோய் ஹெரிடேஜ் ரிசார்ட், ஸ்டெர்லிங் ஊட்டி ஃபெர்ன் ஹில், ஜோஸ்டல் ஊட்டி (பட்ஜெட்)',
      hotelsTh: 'Savoy IHCL (Heritage), Sterling Ooty (Mountain views), Zostel Ooty (Budget)',
      food: 'Ooty Varkey, Homemade Chocolates, Nilgiri Tea, Hot South Indian Thali, Fresh Strawberry Cream',
      foodTa: 'ஊட்டி வர்க்கி, சுவையான சாக்லேட்கள், நீலகிரி தேநீர், தென்னிந்திய சாப்பாடு, ஸ்ட்ராபெரி க்ரீம்',
      foodTh: 'Ooty Varkey, Homemade Chocolates, Nilgiri Tea, South Indian Meals',
      transport: 'Heritage Nilgiri Toy Train, private rental cab or local TNSTC scenic hill buses.',
      daysPlan: [
        { day: 1, title: 'Ooty Lake & Botanical Gardens', plan: 'Arrive, check in at resort, stroll through Government Botanical Garden, evening pedal boating at Ooty Lake with sunset.' },
        { day: 2, title: 'Doddabetta Peak & Tea Factory', plan: 'Panoramic view from Doddabetta Peak (2,637m), tour Nilgiri Tea Factory & Chocolate Museum, evening local market shopping.' },
        { day: 3, title: 'Pykara Lake & Waterfalls Nature Expedition', plan: 'Speedboat cruise in Pykara Lake, visit Pine Forest and Shooting Point, fresh mountain trout lunch, departure.' },
      ],
      link: '/destinations',
    },
    {
      name: 'Kerala',
      nameTa: 'கேரளா',
      country: 'India',
      countryTa: 'இந்தியா',
      category: 'Backwaters & Wellness',
      categoryTa: 'உப்பங்கழிகள் & ஆயுர்வேத நல்வாழ்வு',
      bestTime: 'September to March (Cooler lush tropical breezes)',
      bestTimeTa: 'செப்டம்பர் முதல் மார்ச் வரை (பசுமையான சூழல் மற்றும் இதமான காற்று)',
      bestTimeTh: 'September mudhal March varai (Pasumayana kulirndha kaatru)',
      dailyCostINR: '₹4,000 - ₹6,500 / day',
      dailyCostUSD: '$50 - $75 / day',
      idealDuration: '4 to 7 Days',
      idealDurationTa: '4 முதல் 7 நாட்கள்',
      idealDurationTh: '4 to 7 Naatkal',
      highlights: 'Alleppey luxury houseboats, Munnar tea plantation trails, Fort Kochi Chinese fishing nets, Ayurvedic rejuvenation spas.',
      highlightsTa: 'ஆலப்புழா சொகுசு படகு வீடுகள், மூணார் தேயிலைத் தோட்டங்கள், கொச்சி சீன வலைகள், ஆயுர்வேத மசாஜ் மையங்கள்.',
      highlightsTh: 'Alleppey houseboat stay, Munnar tea estates, Fort Kochi fishing nets, Ayurvedic spas.',
      hotels: 'Kumarakom Lake Resort (Luxury Backwaters), Blanket Hotel Munnar (Mountain Views), Zostel Kochi (Budget)',
      food: 'Appam with Stew, Karimeen Pollichathu, Malabar Parotta with Chicken Curry, Puttu and Kadala Curry',
      transport: 'Chauffeured private cab or scenic Kerala state KSRTC buses and Vembanad Lake passenger ferries.',
      daysPlan: [
        { day: 1, title: 'Fort Kochi Arrival & Heritage Walk', plan: 'Explore Chinese fishing nets, Mattancherry Dutch Palace, Jewish Synagogue, and evening Kathakali cultural dance.' },
        { day: 2, title: 'Munnar Misty Hills & Tea Estates', plan: 'Drive to Munnar, visit Cheeyappara Waterfalls, walk inside lush tea gardens, visit Tata Tea Museum.' },
        { day: 3, title: 'Alleppey Backwaters Houseboat Cruise', plan: 'Check in to a traditional private Kettuvallam houseboat, cruise calm palm-fringed canals, fresh Kerala dinner on board.' },
        { day: 4, title: 'Marari Beach & Ayurvedic Rejuvenation', plan: 'Relax at pristine Marari Beach, indulge in a 90-minute authentic Abhyanga herbal oil massage, departure.' },
      ],
      link: '/destinations',
    },
    {
      name: 'Bali',
      nameTa: 'பாலி',
      country: 'Indonesia',
      countryTa: 'இந்தோனேசியா',
      category: 'Tropical & Cultural',
      categoryTa: 'வெப்பமண்டல தீவு & கலாச்சாரம்',
      bestTime: 'April to October (Dry sunny season, 27°C - 30°C)',
      bestTimeTa: 'ஏப்ரல் முதல் அக்டோபர் வரை (மழையற்ற தெளிவான வெயில் காலம்)',
      bestTimeTh: 'April mudhal October varai (Nalla sunny & pleasant season)',
      dailyCostINR: '₹6,000 - ₹9,000 / day',
      dailyCostUSD: '$75 - $110 / day',
      idealDuration: '5 to 9 Days',
      idealDurationTa: '5 முதல் 9 நாட்கள்',
      idealDurationTh: '5 to 9 Naatkal',
      highlights: 'Ubud emerald rice terraces, Uluwatu cliff temple, Mount Batur sunrise volcano trek, private jungle pool villas.',
      highlightsTa: 'உபுட் நெல் வயல்கள், உலுவாட்டு செங்குத்து பாறை கோவில், பத்தூர் எரிமலை சூரிய உதய ட்ரெக்கிங், சொகுசு நீச்சல் குளம் வில்லாக்கள்.',
      highlightsTh: 'Ubud rice terraces, Uluwatu temple, Mount Batur volcano sunrise trek, private pool villas.',
      hotels: 'Maya Ubud Resort & Spa (Jungle Luxury), The Mulia Nusa Dua (Beachfront), Arya Monkey Forest (Budget Villa)',
      food: 'Nasi Goreng, Babi Guling / Chicken Satay with Peanut Sauce, Bebek Betutu (Slow-cooked Duck), Dragonfruit Smoothie Bowls',
      transport: 'Private driver hire ($35-$45/day) or Grab/Gojek taxi apps in Seminyak and Ubud.',
      daysPlan: [
        { day: 1, title: 'Ubud Arrival & Monkey Forest', plan: 'Arrive at Ngurah Rai Airport, transfer to Ubud jungle villa, visit Sacred Monkey Forest Sanctuary, evening Kecak Fire Dance.' },
        { day: 2, title: 'Tegallalang Rice Terraces & Waterfall', plan: 'Morning walk in emerald Tegallalang rice terraces, giant jungle swing, Tirta Empul holy spring water cleansing, Tegenungan waterfall.' },
        { day: 3, title: 'Seminyak Beach & Beach Clubs', plan: 'Transfer to Seminyak, surfing lesson at Double Six Beach, shopping boutiques, sunset cocktails at Potato Head Beach Club.' },
        { day: 4, title: 'Nusa Penida Island Expedition', plan: 'Speedboat to Nusa Penida, witness iconic T-Rex shaped Kelingking Beach, snorkel with Manta Rays at Crystal Bay.' },
        { day: 5, title: 'Uluwatu Cliff Temple & Farewell Dinner', plan: 'Clifftop Uluwatu Temple overlooking Indian Ocean waves, romantic Jimbaran beachfront seafood dinner on the sand.' },
      ],
      link: '/destinations/1',
    },
    {
      name: 'Swiss Alps',
      nameTa: 'சுவிஸ் ஆல்ப்ஸ்',
      country: 'Switzerland',
      countryTa: 'சுவிட்சர்லாந்து',
      category: 'Mountain & Adventure',
      categoryTa: 'பனிமலை & சாகசம்',
      bestTime: 'June to Sept (Hiking) & Dec to March (Skiing)',
      bestTimeTa: 'ஜூன் முதல் செப்டம்பர் (மலையேற்றம்) & டிசம்பர் முதல் மார்ச் (பனிச்சறுக்கு)',
      bestTimeTh: 'June to Sept (Trekking) & Dec to March (Snow skiing)',
      dailyCostINR: '₹15,000 - ₹22,000 / day',
      dailyCostUSD: '$180 - $260 / day',
      idealDuration: '5 to 9 Days',
      idealDurationTa: '5 முதல் 9 நாட்கள்',
      idealDurationTh: '5 to 9 Naatkal',
      highlights: 'Matterhorn views in Zermatt, Jungfraujoch Top of Europe, Glacier 3000 suspension walk, Lake Geneva cruises.',
      highlightsTa: 'மேட்டர்ஹார்ன் பனிச்சிகரம், ஜங்ஃப்ராவ்ஜோக் ஐரோப்பாவின் உச்சி, பனிப்பாறை பாலம், ஜெனீவா ஏரி படகு சவாரி.',
      highlightsTh: 'Matterhorn views, Jungfraujoch Top of Europe train, Glacier walk, Lake Geneva cruises.',
      hotels: 'The Omnia Zermatt (Alpine Luxury), Victoria-Jungfrau Interlaken, Mountain Lodge Grindelwald (Boutique)',
      food: 'Traditional Swiss Cheese Fondue, Raclette, Rösti with fried egg, Swiss artisanal chocolate truffles',
      transport: 'Swiss Travel Pass (unlimited train, bus, boat, and 50% discount on mountain cable cars).',
      daysPlan: [
        { day: 1, title: 'Zurich / Lucerne Arrival & Lake Cruise', plan: 'Arrive in Zurich, scenic train to Lucerne, Chapel Bridge walk, panoramic steamship cruise on Lake Lucerne.' },
        { day: 2, title: 'Interlaken & Jungfraujoch Top of Europe', plan: 'Cogwheel train ascending 3,454m to Jungfraujoch, Ice Palace tour, Sphinx observatory terrace overlooking Aletsch Glacier.' },
        { day: 3, title: 'Zermatt & Matterhorn Glacier Paradise', plan: 'Car-free village of Zermatt, cable car to Matterhorn Glacier Paradise (3,883m), panoramic skiing/hiking trails.' },
        { day: 4, title: 'Grindelwald First & Cliff Walk', plan: 'Thrilling First Cliff Walk by Tissot suspended over alpine canyon, mountain cart descent, departure.' },
      ],
      link: '/destinations/3',
    },
    {
      name: 'Paris',
      nameTa: 'பாரிஸ்',
      country: 'France',
      countryTa: 'பிரான்ஸ்',
      category: 'Romance & Culture',
      categoryTa: 'காதல் நகரம் & கலை கலாச்சாரம்',
      bestTime: 'April to June & September to November',
      bestTimeTa: 'ஏப்ரல் முதல் ஜூன் & செப்டம்பர் முதல் நவம்பர் வரை',
      bestTimeTh: 'April to June & Sept to Nov (Romance season)',
      dailyCostINR: '₹12,000 - ₹18,000 / day',
      dailyCostUSD: '$140 - $220 / day',
      idealDuration: '4 to 7 Days',
      idealDurationTa: '4 முதல் 7 நாட்கள்',
      idealDurationTh: '4 to 7 Naatkal',
      highlights: 'Eiffel Tower summit, Louvre Museum Mona Lisa tour, illuminated Seine River dinner cruises, Palace of Versailles.',
      highlightsTa: 'ஈபிள் கோபுர உச்சி, லூவர் அருங்காட்சியகம் மோனாலிசா, செய்ன் நதி இரவு படகு உணவு, வெர்சாய் அரண்மனை.',
      highlightsTh: 'Eiffel Tower summit, Louvre Mona Lisa, Seine river night cruise, Versailles palace.',
      hotels: 'Hôtel Plaza Athénée (5-Star Luxury), Grand Hôtel Saint Michel (Latin Quarter), CitizenM Gare de Lyon (Chic Modern)',
      food: 'Fresh butter Croissants, French Onion Soup, Duck Confit, Escargot, Macarons from Ladurée',
      transport: 'Paris Metro & RER network (Navigo Easy card or 10-ticket carnet for fast connections).',
      daysPlan: [
        { day: 1, title: 'Eiffel Tower & Seine Sunset Cruise', plan: 'Summit ticket to Eiffel Tower, stroll Champ de Mars, evening Seine river cruise seeing Paris monuments illuminated.' },
        { day: 2, title: 'Louvre Art Masterpieces & Montmartre', plan: 'Skip-the-line guided Louvre Museum tour (Mona Lisa, Venus de Milo), climb Montmartre to Sacré-Cœur basilica.' },
        { day: 3, title: 'Palace of Versailles Grand Day Tour', plan: 'RER train to Versailles, Hall of Mirrors, Marie Antoinette’s estate, grand musical fountains in royal gardens.' },
        { day: 4, title: 'Notre-Dame, Latin Quarter & Shopping', plan: 'Walk along Île de la Cité, Latin Quarter bookshops, Champs-Élysées, Arc de Triomphe rooftop view, departure.' },
      ],
      link: '/destinations/4',
    },
    {
      name: 'Tokyo & Kyoto',
      nameTa: 'டோக்கியோ & கியோட்டோ',
      country: 'Japan',
      countryTa: 'ஜப்பான்',
      category: 'Culture & Modernity',
      categoryTa: 'பாரம்பரியம் & நவீன தொழில்நுட்பம்',
      bestTime: 'March to May (Cherry Blossoms) & Oct to Nov (Autumn Foliage)',
      bestTimeTa: 'மார்ச் முதல் மே (செர்ரி மலர்கள்) & அக்டோபர் முதல் நவம்பர் (இலையுதிர் காலம்)',
      bestTimeTh: 'March to May (Cherry Blossoms) & Oct to Nov (Autumn)',
      dailyCostINR: '₹11,000 - ₹17,000 / day',
      dailyCostUSD: '$130 - $200 / day',
      idealDuration: '7 to 12 Days',
      idealDurationTa: '7 முதல் 12 நாட்கள்',
      idealDurationTh: '7 to 12 Naatkal',
      highlights: 'Fushimi Inari 10,000 torii gates, Shibuya crossing, Shinkansen bullet train, Gion traditional tea ceremonies.',
      highlightsTa: 'புஷிமி இனாரி 10,000 சிவப்பு வாயில்கள், ஷிபுயா சந்திப்பு, புல்லட் ரயில் பயணம், பாரம்பரிய தேநீர் சடங்குகள்.',
      highlightsTh: 'Fushimi Inari 10,000 gates, Shibuya crossing, Shinkansen bullet train, Gion tea ceremony.',
      hotels: 'Park Hyatt Tokyo (Shinjuku Skyline), Hoshinoya Kyoto (Riverside Ryokan), Hotel Gracery Shinjuku (Godzilla view)',
      food: 'Authentic Tonkotsu Ramen, Fresh Tsukiji Nigiri Sushi, Wagyu Beef Teppanyaki, Matcha Parfait in Kyoto',
      transport: 'JR Pass for intercity Bullet Trains, Suica/Pasmo IC cards for Tokyo Metro.',
      daysPlan: [
        { day: 1, title: 'Tokyo Modernity: Shibuya & Shinjuku', plan: 'Experience Shibuya Scramble Crossing, Meiji Jingu Shrine forest walk, Omoide Yokocho evening street food.' },
        { day: 2, title: 'Asakusa & Futuristic Akihabara', plan: 'Historic Senso-ji Temple, Nakamise shopping street, Akihabara electronics & anime district, Tokyo Skytree.' },
        { day: 3, title: 'Shinkansen Bullet Train to Kyoto', plan: 'Ride 320 km/h Shinkansen bullet train to Kyoto, check in to a traditional Ryokan with onsen, Gion Geisha district walk.' },
        { day: 4, title: 'Fushimi Inari & Arashiyama Bamboo Grove', plan: 'Hike through 10,000 vermilion Torii gates at Fushimi Inari, Arashiyama bamboo forest boardwalk, Tenryu-ji Zen garden.' },
      ],
      link: '/destinations/2',
    },
  ],

  packages: [
    {
      title: 'Bali Tropical Bliss & Yoga Retreat',
      titleTa: 'பாலி வெப்பமண்டல ஆனந்தம் & யோகா அமைதி பயணம்',
      price: '$1,099 (₹93,415)',
      duration: '7 Days / 6 Nights',
      durationTa: '7 நாட்கள் / 6 இரவுகள்',
      durationTh: '7 Naatkal / 6 Iravugal',
      type: 'Standard / Wellness',
      inclusions: '4-star boutique resort, daily breakfast, airport transfers, Ubud rice terrace tour, Uluwatu sunset temple tour.',
      exclusions: 'International flights, personal expenses, travel insurance.',
      link: '/packages/1',
    },
    {
      title: 'Swiss Alps Grand Explorer',
      titleTa: 'சுவிஸ் ஆல்ப்ஸ் மாபெரும் பனிமலை பயணம்',
      price: '$3,199 (₹2,71,915)',
      duration: '8 Days / 7 Nights',
      durationTa: '8 நாட்கள் / 7 இரவுகள்',
      durationTh: '8 Naatkal / 7 Iravugal',
      type: 'Luxury Alpine',
      inclusions: '5-star Zermatt chalet stay, Swiss Travel Pass, Jungfraujoch Top of Europe rail excursion, daily alpine breakfast & fondue dinner.',
      exclusions: 'Ski rental gear, visa processing fees.',
      link: '/packages/3',
    },
    {
      title: 'Romantic Paris & Versailles Getaway',
      titleTa: 'காதல் பாரிஸ் & வெர்சாய் சிறப்பு சுற்றுலா',
      price: '$1,699 (₹1,44,415)',
      duration: '6 Days / 5 Nights',
      durationTa: '6 நாட்கள் / 5 இரவுகள்',
      durationTh: '6 Naatkal / 5 Iravugal',
      type: 'City Break & Romance',
      inclusions: 'Central boutique hotel near Seine, Louvre skip-the-line pass, Seine dinner cruise, Versailles palace day tour.',
      exclusions: 'City tourist tax, lunch meals.',
      link: '/packages/4',
    },
  ],

  bookingPolicies: {
    cancellation: 'Free cancellation up to 48 hours prior to your scheduled trip start date with a 100% full refund.',
    cancellationTa: 'பயணம் தொடங்குவதற்கு 48 மணி நேரத்திற்கு முன் வரை ரத்து செய்தால் 100% முழு பணமும் திரும்பப் பெறப்படும் (100% Full Refund).',
    cancellationTh: 'Trip start aaguradhukku 48 hours munnadi varai free-ah cancel pannalaam, 100% full refund kedaikkum.',
    paymentMethods: 'We support all major Credit Cards (Visa, MasterCard, Amex), Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Net Banking.',
    paymentMethodsTa: 'கிரெடிட்/டெபிட் கார்டுகள், UPI (Google Pay, PhonePe, Paytm), மற்றும் நெட் பேங்கிங் மூலம் பணம் செலுத்தலாம்.',
    paymentMethodsTh: 'Credit/Debit cards, UPI (GPay, PhonePe, Paytm), matrum Net Banking moolam safe-ah pay pannalaam.',
    security: 'Bank-grade 256-bit SSL encryption. We adhere to strict PCI compliance and never store sensitive CVVs, passwords, or full card numbers.',
    securityTa: 'வங்கி தர 256-பிட் SSL பாதுகாப்பு. உங்கள் CVV அல்லது கடவுச்சொல் ஒருபோதும் சேமிக்கப்படாது.',
    securityTh: 'Bank-grade 256-bit SSL security. Ungaloda card CVV or password eppovum store aagadhu.',
  },
};

/**
 * Detect user language and persist across multi-turn session
 */
function detectLanguage(text, sessionId, preferredLang = null) {
  const context = sessionContexts.get(sessionId) || {};
  const currentSessionLang = preferredLang || context.language || 'en';
  if (!text || typeof text !== 'string') return currentSessionLang;

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Unicode Range Check for Tamil Script (U+0B80 to U+0BFF)
  if (/[\u0B80-\u0BFF]/.test(raw)) {
    context.language = 'ta';
    sessionContexts.set(sessionId, context);
    return 'ta';
  }

  // 2. Tamil Phonetic Lexicon for Thanglish Detection
  const thanglishKeywords = [
    'vanakkam', 'nandri', 'eppadi', 'epdi', 'engu', 'enga', 'enge', 'ethu', 'edhu', 'enna',
    'ethana', 'yethana', 'evvalavu', 'evlo', 'yevlo', 'romba', 'nalla', 'kudumbam', 'kudumba',
    'neram', 'kaalam', 'kadalkarai', 'kadalaruge', 'malai', 'kattanam', 'vilai', 'kaasu',
    'panam', 'selavu', 'oor', 'idam', 'idangal', 'paaka', 'paakanum', 'pakkalam', 'pogalam',
    'poganum', 'poga', 'sapad', 'saapadu', 'thanga', 'thangurathu', 'thangalam', 'seyya',
    'booking', 'rathu', 'therinjikanum', 'sollunga', 'solunga', 'solren', 'kodu', 'kodunga',
    'varum', 'iruku', 'iruka', 'pannalam', 'panradhu', 'panlam', 'pannunga', 'vanga', 'vaa',
    'poitu', 'varalam', 'edukalam', 'podhum', 'theva', 'thevai', 'paravala', 'yenna', 'endha',
    'aagum', 'aagudhu', 'theriyum', 'puriyala', 'puriyum', 'mudiyuma', 'theriyuma', 'irukkum',
    'vazhikaatti', 'payanam', 'payana', 'nalladhu', 'beach-la', 'stay-ku', 'packagela', 'saapda',
    'ooty-ku', 'ootyku', 'kudu', 'sollu', 'pannu'
  ];

  const words = lower.split(/[^a-z0-9]+/);
  const thanglishMatchCount = words.filter((w) => thanglishKeywords.includes(w)).length;

  if (thanglishMatchCount >= 1) {
    context.language = 'thanglish';
    sessionContexts.set(sessionId, context);
    return 'thanglish';
  }

  // 3. Clear English Switch Check
  const englishClearMarkers = [
    'what', 'where', 'when', 'how', 'which', 'who', 'tell', 'show', 'give', 'recommend',
    'package', 'flight', 'hotel', 'cancellation', 'itinerary', 'destination', 'budget',
    'price', 'cost', 'trip', 'travel', 'hi', 'hello', 'hey', 'please', 'details', 'plan'
  ];
  const englishMatchCount = words.filter((w) => englishClearMarkers.includes(w)).length;

  if (englishMatchCount >= 1 && thanglishMatchCount === 0) {
    context.language = preferredLang || 'en';
    sessionContexts.set(sessionId, context);
    return context.language;
  }

  return currentSessionLang;
}

/**
 * Check if the user query is outside the travel domain
 */
function isOutOfScope(query) {
  const nonTravelKeywords = [
    'write python', 'write code', 'javascript code', 'c++', 'binary tree', 'solve equation',
    'calculus', 'quadratic', 'derivative', 'react hook', 'sql injection', 'quantum physics',
    'who is the president', 'medical diagnosis', 'write essay on', 'crypto bitcoin'
  ];
  return nonTravelKeywords.some((k) => query.includes(k));
}

const chatbotService = {
  /**
   * Process incoming user message with multi-turn context tracking, application context & AI reasoning
   */
  async processMessage(sessionId = 'default', userMessage = '', clientContext = {}) {
    const rawQuery = String(userMessage || '').trim();
    const query = rawQuery.toLowerCase();

    // Retrieve or initialize multi-turn session context
    let context = sessionContexts.get(sessionId) || {
      activeDestination: null,
      activeDays: 3,
      activeBudget: null,
      recentItinerary: null,
      language: clientContext.language || 'en',
    };

    // Merge client context if provided (GPS location, selected hotel, favorites, budget, language)
    if (clientContext.currentLocation) {
      context.currentLocation = clientContext.currentLocation;
    }
    if (clientContext.savedFavorites) {
      context.savedFavorites = clientContext.savedFavorites;
    }
    if (clientContext.selectedTransport) {
      context.selectedTransport = clientContext.selectedTransport;
    }
    if (clientContext.selectedHotel) {
      context.selectedHotel = clientContext.selectedHotel;
    }
    if (clientContext.budget) {
      context.activeBudget = parseInt(clientContext.budget, 10);
    }
    if (clientContext.language) {
      context.language = clientContext.language;
    }

    const lang = detectLanguage(rawQuery, sessionId, clientContext.language);
    context.language = lang;

    // 1. Guardrail Check: Never invent or expose credit cards or passwords
    if (
      query.includes('card number') ||
      query.includes('cvv') ||
      query.includes('password') ||
      query.includes('credit card') ||
      query.includes('fake booking') ||
      query.includes('hack') ||
      query.includes('கார்டு எண்') ||
      query.includes('கடவுச்சொல்') ||
      query.includes('card details')
    ) {
      let guardrailReply = '';
      if (lang === 'ta') {
        guardrailReply = '🔒 **பாதுகாப்பு அறிவிப்பு**: உங்கள் பாதுகாப்பிற்காக, டிராவலோரா கிரெடிட் கார்டு எண்கள், CVV அல்லது கடவுச்சொற்களை ஒருபோதும் பகிரவோ கேட்கவோ மாட்டாது. உங்கள் முன்பதிவு மற்றும் கட்டண விவரங்களை பாதுகாப்பாக நிர்வகிக்க [எனது பயணங்கள் பக்கத்திற்கு](/my-trips) செல்லவும்.';
      } else if (lang === 'thanglish') {
        guardrailReply = '🔒 **Security Notice**: Ungaloda paadhukaapukaaga Travelora eppovum sensitive card number, CVV, passwords share pannaadhu. Ungaloda confirmed bookings & safe payments-ai [My Trips Dashboard-la](/my-trips) paarthu manage pannalaam.';
      } else {
        guardrailReply = '🔒 **Security Notice**: For your protection, Travelora never shares or requests sensitive card numbers, CVVs, or passwords. To manage your real bookings and payments safely, please visit your encrypted [My Trips Dashboard](/my-trips).';
      }

      this.recordMessage(sessionId, rawQuery, guardrailReply);
      return {
        reply: guardrailReply,
        suggestions: ['How to view my bookings', 'What payment methods are supported?'],
        language: lang,
      };
    }

    // 2. Out-of-Scope Non-Travel Query Deflection
    if (isOutOfScope(query)) {
      let redirectReply = '';
      if (lang === 'ta') {
        redirectReply = '👋 நான் **டிராவலோராவின் AI பயண உதவியாளர் (Travel Assistant)**! 🌍 எனது முதன்மை பணி பயணத் திட்டமிடல், சுற்றுலா இடங்கள், பேக்கேஜ்கள், தங்குமிடம் மற்றும் முன்பதிவுகளில் உதவுவதே ஆகும்.\n\nஉங்கள் விடுமுறை பயண திட்டமிடல் பற்றி என்னிடம் கேட்கலாம் (எ.கா. *"கோவாவிற்கு 4 நாள் பயணம் திட்டமிடுங்கள்"* அல்லது *"சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ் விலை என்ன?"*)!';
      } else if (lang === 'thanglish') {
        redirectReply = '👋 Naan ungaloda **Travelora AI Travel Assistant**! 🌍 Ennala travel planning, destinations, tour packages, hotel stays, budget matrum itinerary pathi mattum dhaan help panna mudiyum.\n\nUnga adutha vacation-ai enga plan panreenga? (e.g. *"Plan 4-day Goa trip"* or *"Bali packages kaatunga"*).';
      } else {
        redirectReply = '👋 I am **Travelora AI**, your personal travel assistant! 🌍 While I\'d love to help, my expertise is dedicated exclusively to travel planning, destinations, itineraries, stays, activities, and bookings.\n\nWhere would you like to plan your next vacation? Ask me about any destination, custom itinerary, or travel package!';
      }

      this.recordMessage(sessionId, rawQuery, redirectReply);
      return {
        reply: redirectReply,
        suggestions: ['Plan a 4-day Goa trip', 'Swiss Alps package details', 'Best time to visit Bali'],
        language: lang,
      };
    }

    // 3. Extract or update Destination entity in Context
    let matchedDest = KNOWLEDGE_BASE.destinations.find((d) =>
      query.includes(d.name.toLowerCase()) ||
      query.includes(d.country.toLowerCase()) ||
      (d.nameTa && query.includes(d.nameTa))
    );

    if (matchedDest) {
      context.activeDestination = matchedDest;
    } else if (context.activeDestination) {
      matchedDest = context.activeDestination;
    } else {
      matchedDest = KNOWLEDGE_BASE.destinations[0]; // default to Goa
    }

    // Extract days count if mentioned (e.g. "4-day", "5 days", "7 days")
    const daysMatch = query.match(/(\d+)\s*(day|days|naal|naatkal)/);
    if (daysMatch) {
      context.activeDays = parseInt(daysMatch[1], 10);
    }

    // Extract budget if mentioned (e.g. "20000", "20k", "50,000")
    const budgetMatch = query.match(/(\d+[,0-9]*)\s*(k|budget|inr|rs|₹|\$)?/);
    if (budgetMatch && parseInt(budgetMatch[1].replace(/,/g, ''), 10) > 500) {
      context.activeBudget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    }

    sessionContexts.set(sessionId, context);

    let reply = '';
    const suggestions = [];
    const actionLinks = [];

    // ==========================================
    // 4. MULTI-TURN CONTEXTUAL INTENT ROUTING (Phase 14 & 26 Enhanced)
    // ==========================================

    // Intent P26: Live Weather, Rain Forecast & Indoor/Outdoor Suggestions (Phase 26)
    if (
      query.includes('weather') ||
      query.includes('rain') ||
      query.includes('climate') ||
      query.includes('temperature') ||
      query.includes('forecast') ||
      query.includes('வானிலை') ||
      query.includes('மழை') ||
      query.includes('வெப்பநிலை') ||
      query.includes('indoor places') ||
      query.includes('outdoor places') ||
      query.includes('will it rain') ||
      query.includes('should i visit outdoor') ||
      query.includes('suggest indoor') ||
      query.includes('mazhai') ||
      query.includes('kaanilai')
    ) {
      const targetDestName = matchedDest?.name || 'Ooty';
      const coords = weatherService.resolveCoordinates(targetDestName) || { latitude: 11.41, longitude: 76.70, city: targetDestName };
      
      let weatherData = null;
      let forecastData = null;
      try {
        const [curr, fc] = await Promise.all([
          weatherService.getCurrentWeather(coords.latitude, coords.longitude, coords.city || targetDestName),
          weatherService.getWeatherForecast(coords.latitude, coords.longitude, 5, coords.city || targetDestName),
        ]);
        weatherData = curr;
        forecastData = fc;
      } catch (wErr) {
        console.warn('[Chatbot] Weather fetch error:', wErr.message);
      }

      const catalog = weatherService.getIndoorOutdoorCatalog(targetDestName);

      if (weatherData && weatherData.weather_available && weatherData.current) {
        const c = weatherData.current;
        const rainChance = c.rain_probability !== undefined ? c.rain_probability : (c.is_rainy ? 80 : 15);
        const willRain = c.is_rainy || rainChance >= 50;

        if (lang === 'ta') {
          reply = `### 🌤️ ${targetDestName} நேரலை வானிலை & பயண முன்னறிவிப்பு\n\n` +
            `* **வெப்பநிலை:** **${c.temperature}°C** (உணரப்படுவது: ${c.apparent_temperature}°C)\n` +
            `* **வானிலை நிலை:** ${c.icon} **${c.condition}**\n` +
            `* **மழை வாய்ப்பு:** **${rainChance}%** ${willRain ? '(மழை பெய்ய வாய்ப்புள்ளது 🌧️)' : '(மழை வாய்ப்பு குறைவு ☀️)'}\n` +
            `* **காற்று வேகம்:** ${c.wind_speed} கி.மீ/மணி | **ஈரப்பதம்:** ${c.humidity}%\n` +
            `* **வெளிப்புற பயண தகுதி:** **${c.outdoor_suitability === 'Good' ? 'நன்று (Good)' : c.outdoor_suitability === 'Moderate' ? 'மிதமானது (Moderate)' : 'குறைவு (Poor)'}**\n\n` +
            `💡 **வானிலை ஆலோசனை:** ${c.smart_suggestion}\n\n`;

          if (willRain || query.includes('indoor') || query.includes('மழை')) {
            reply += `🏛️ **பரிந்துரைக்கப்பட்ட உள்ளரங்கு சுற்றுலா இடங்கள் (Indoor Places):**\n` +
              catalog.indoor.slice(0, 3).map((p) => `* **${p.name}:** ${p.reason}`).join('\n') + '\n\n';
          }

          if (forecastData?.days?.length > 0) {
            reply += `📅 **அடுத்த 3 நாட்கள் முன்னறிவிப்பு:**\n` +
              forecastData.days.slice(0, 3).map((d) => `* **${d.day_name} (${d.date}):** ${d.icon} ${d.temperature_max}°C / ${d.temperature_min}°C • மழை: ${d.rain_probability}%`).join('\n') + '\n\n';
          }
          reply += `*தகவல் ஆதாரம்: Open-Meteo உலகளாவிய நேரலை வானிலை சேவை (${new Date(c.timestamp).toLocaleTimeString()}).*`;
        } else if (lang === 'thanglish') {
          reply = `### 🌤️ ${targetDestName} Live Weather & Travel Forecast\n\n` +
            `* **Temperature:** **${c.temperature}°C** (Feels like: ${c.apparent_temperature}°C)\n` +
            `* **Condition:** ${c.icon} **${c.condition}**\n` +
            `* **Rain Chance:** **${rainChance}%** ${willRain ? '(Mazhai peyya vaaipu irukku 🌧️)' : '(Pleasant dry weather ☀️)'}\n` +
            `* **Wind:** ${c.wind_speed} km/h | **Humidity:** ${c.humidity}%\n` +
            `* **Outdoor Suitability:** **${c.outdoor_suitability}**\n\n` +
            `💡 **Travel Suggestion:** ${c.smart_suggestion}\n\n`;

          if (willRain || query.includes('indoor')) {
            reply += `🏛️ **Suggested Indoor Attractions if it rains:**\n` +
              catalog.indoor.slice(0, 3).map((p) => `* **${p.name}:** ${p.reason}`).join('\n') + '\n\n';
          }
          reply += `*Live data updated at: ${new Date(c.timestamp).toLocaleTimeString()}.*`;
        } else {
          reply = `### 🌤️ Live Weather in ${targetDestName}\n\n` +
            `* **Current Temperature:** **${c.temperature}°C** (Feels like: ${c.apparent_temperature}°C)\n` +
            `* **Condition:** ${c.icon} **${c.condition}**\n` +
            `* **Rain Probability:** **${rainChance}%** ${willRain ? '(Rain expected — carry an umbrella 🌧️)' : '(Low chance of rain ☀️)'}\n` +
            `* **Wind Speed:** ${c.wind_speed} km/h | **Humidity:** ${c.humidity}%\n` +
            `* **Outdoor Suitability:** **${c.outdoor_suitability}**\n\n` +
            `💡 **Smart Weather Suggestion:** ${c.smart_suggestion}\n\n`;

          if (willRain || query.includes('indoor') || query.includes('rain')) {
            reply += `🏛️ **Recommended Indoor Alternatives:**\n` +
              catalog.indoor.slice(0, 3).map((p) => `* **${p.name}:** ${p.reason}`).join('\n') + '\n\n';
          } else {
            reply += `🌿 **Top Outdoor Places for this Weather:**\n` +
              catalog.outdoor.slice(0, 3).map((p) => `* **${p.name}:** ${p.reason}`).join('\n') + '\n\n';
          }

          if (forecastData?.days?.length > 0) {
            reply += `📅 **Multi-Day Forecast:**\n` +
              forecastData.days.slice(0, 4).map((d) => `* **${d.day_name} (${d.date}):** ${d.icon} ${d.temperature_max}°C / ${d.temperature_min}°C • Rain: ${d.rain_probability}% (${d.outdoor_suitability})`).join('\n') + '\n\n';
          }

          reply += `*Timestamp: Live satellite data fetched at ${new Date(c.timestamp).toLocaleTimeString()}.*`;
        }

        suggestions.push(`Plan a trip to ${targetDestName}`, `Suggest indoor places`, `Find budget stays in ${targetDestName}`, `Suggest transport`);
        actionLinks.push({ label: `🚀 Plan Weather-Aware Trip to ${targetDestName}`, url: `/trip-planner?destination=${encodeURIComponent(targetDestName)}` });
        actionLinks.push({ label: `📍 Explore ${targetDestName}`, url: `/destinations` });
      } else {
        reply = `### 🌤️ Weather in ${targetDestName}\n\n` +
          `Live meteorological forecast data is temporarily unavailable for **${targetDestName}**. Existing trip planning, route mapping, and bookings continue to work normally.\n\n` +
          `You can still view verified attractions and plan your itinerary seamlessly.`;
        suggestions.push(`Plan a 3-day trip to ${targetDestName}`, `Find budget stays`, `Suggest transport`);
        actionLinks.push({ label: `🚀 Plan Trip to ${targetDestName}`, url: `/trip-planner?destination=${encodeURIComponent(targetDestName)}` });
      }
    }

    // =========================================================================
    // Phase 27: Intent P27 - Smart Packing Assistant & Checklists (Feature 13 & 14)
    // =========================================================================
    else if (
      query.includes('pack') ||
      query.includes('packing') ||
      query.includes('checklist') ||
      query.includes('what to bring') ||
      query.includes('luggage') ||
      query.includes('பேக்கிங்') ||
      query.includes('பேக்') ||
      query.includes('பட்டியல்') ||
      query.includes('pack panna')
    ) {
      const packingService = require('./packingService');

      // Extract duration or default to 3
      let days = 3;
      const dayMatch = query.match(/(\d+)\s*(?:day|days|நாள்|நாட்கள்)/i);
      if (dayMatch) {
        days = Math.min(14, Math.max(1, parseInt(dayMatch[1], 10)));
      }

      // Extract destination
      let targetDestName = 'Ooty';
      if (query.includes('chennai') || query.includes('சென்னை')) targetDestName = 'Chennai';
      else if (query.includes('mahabalipuram') || query.includes('மகாபலிபுரம்') || query.includes('mamallapuram')) targetDestName = 'Mahabalipuram';
      else if (query.includes('kanyakumari') || query.includes('கன்னியாகுமரி')) targetDestName = 'Kanyakumari';
      else if (query.includes('goa') || query.includes('கோவா')) targetDestName = 'Goa';
      else if (query.includes('kerala') || query.includes('கேரளா') || query.includes('munnar')) targetDestName = 'Kerala';
      else if (query.includes('paris') || query.includes('பாரிஸ்')) targetDestName = 'Paris';
      else if (query.includes('bali') || query.includes('பாலி')) targetDestName = 'Bali';
      else if (query.includes('swiss') || query.includes('சுவிஸ்')) targetDestName = 'Switzerland';
      else if (context.currentLocation?.city) targetDestName = context.currentLocation.city;

      const checklist = await packingService.generateSmartChecklist({
        destination: targetDestName,
        durationDays: days,
        tripType: 'nature',
        travelers: 2,
      });

      if (lang === 'ta') {
        reply = `### 🎒 ${targetDestName} பயணத்திற்கான ஸ்மார்ட் பேக்கிங் பட்டியல் (${days} நாட்கள்)\n\n` +
          `வானிலை முன்னறிவிப்பு மற்றும் ${days} நாள் பயண கால அளவின் அடிப்படையில் தயார் செய்யப்பட்ட பரிந்துரைகள்:\n\n` +
          `* 👕 **ஆடைகள்:** காட்டன் டி-ஷர்ட்கள் (${days + 1}), பேன்ட் (${Math.min(3, Math.ceil(days / 2))}), நடை காலணிகள், இரவு உடைகள்.\n` +
          `* 📄 **பயண ஆவணங்கள்:** அரசு புகைப்பட அடையாள அட்டை, முன்பதிவு ரசீது, தங்குமிட விவரங்கள்.\n` +
          `* 📱 **மின்னணு சாதனங்கள்:** ஸ்மார்ட்போன், ஃபாஸ்ட் சார்ஜர், பவர் பேங்க் (10,000mAh), இயர்போன்கள்.\n` +
          `* 💊 **அத்தியாவசிய பொருட்கள்:** முதலுதவி பெட்டி, தினசரி மருந்துகள், கை சுத்திகரிப்பான் (Sanitizer), ORS எலக்ட்ரோலைட்.\n` +
          `* ☔ **வானிலை சார்ந்தது:** ${checklist.weatherReason || 'வானிலைக்கேற்ப பாதுகாப்பு பொருட்கள்'}.\n\n` +
          `💡 **தகவல்:** உங்கள் ஊடாடும் பேக்கிங் பட்டியலில் பொருட்களை டிக் செய்து முன்னேற்றத்தைக் கண்காணிக்கலாம்.`;
      } else {
        reply = `### 🎒 Smart Packing Checklist for ${targetDestName} (${days}-Day Trip)\n\n` +
          `Tailored for your destination climate and a **${days}-day** journey:\n\n` +
          `* 👕 **Clothing:** ${days + 1}x Comfortable tops/t-shirts, ${Math.min(3, Math.ceil(days / 2))}x pants/bottoms, ${days}x pairs of socks, walking shoes.\n` +
          `* 📄 **Travel Documents:** Government photo ID, Travelora booking voucher, hotel check-in details.\n` +
          `* 📱 **Electronics:** Smartphone, fast charging cable, 10,000mAh power bank, earphones.\n` +
          `* 💊 **Health & Essentials:** First-aid basics, personal prescriptions, hand sanitizer, electrolyte packs.\n` +
          `* ☔ **Weather Protection:** ${checklist.weatherReason || 'Tailored to live destination forecast'}.\n` +
          `* 🎒 **Gear:** Daypack, reusable water bottle, travel locks.\n\n` +
          `💡 *Tip: You can open your interactive packing checklist to check off items and add custom gear.*`;
      }

      suggestions.push(`What is the weather in ${targetDestName}?`, `Plan a ${days}-day trip to ${targetDestName}`, `Add camera to checklist`, `Find budget stays`);
      actionLinks.push({ label: `🎒 Open Smart Packing Assistant`, url: `/packing?destination=${encodeURIComponent(targetDestName)}&days=${days}` });
      actionLinks.push({ label: `🌤️ Check ${targetDestName} Weather`, url: `/trip-planner?destination=${encodeURIComponent(targetDestName)}` });
    }

    // =========================================================================
    // Phase 28: Intent P28 - Travel Document & Pre-Trip Checklist Manager (Feature 14 & 15)
    // =========================================================================
    else if (
      query.includes('document') ||
      query.includes('documents') ||
      query.includes('preparation') ||
      query.includes('readiness') ||
      query.includes('what is still pending') ||
      query.includes('is my trip ready') ||
      query.includes('pre-trip') ||
      query.includes('ஆவணங்கள்') ||
      query.includes('சரிபார்ப்பு பட்டியல்') ||
      query.includes('தயார்')
    ) {
      const checklistService = require('./packingService');
      const realChecklistService = require('./checklistService');

      let targetDestName = 'Mahabalipuram';
      if (query.includes('ooty') || query.includes('ஊட்டி')) targetDestName = 'Ooty';
      else if (query.includes('chennai') || query.includes('சென்னை')) targetDestName = 'Chennai';
      else if (query.includes('kanyakumari') || query.includes('கன்னியாகுமரி')) targetDestName = 'Kanyakumari';
      else if (query.includes('goa') || query.includes('கோவா')) targetDestName = 'Goa';
      else if (query.includes('paris') || query.includes('பாரிஸ்')) targetDestName = 'Paris';
      else if (query.includes('bali') || query.includes('பாலி')) targetDestName = 'Bali';

      const chk = await realChecklistService.getTripChecklist(1, 3, { destinationName: targetDestName });

      if (lang === 'ta') {
        reply = `### 📋 ${targetDestName} பயண ஆவணங்கள் & தயாரிப்பு சரிபார்ப்பு பட்டியல்\n\n` +
          `**பயண தயார்நிலை மதிப்பெண் (Trip Readiness): ${chk.readinessScore}%** (${chk.completedTasks}/${chk.totalTasks} தயார்)\n\n` +
          `* 🪪 **அடையாள ஆவணங்கள்:** அரசு புகைப்பட அடையாள அட்டை (Physical & Digital)\n` +
          `* 🎫 **போக்குவரத்து:** ${chk.integrations.transport.available ? '✅ உறுதி செய்யப்பட்டது (' + chk.integrations.transport.transportTitle + ')' : '⏳ முன்பதிவு ரசீது சரிபார்க்கவும்'}\n` +
          `* 🏨 **தங்குமிடம்:** ${chk.integrations.hotel.available ? '✅ உறுதி செய்யப்பட்டது (' + chk.integrations.hotel.hotelName + ')' : '⏳ தங்குமிட வவுச்சர் சரிபார்க்கவும்'}\n` +
          `* 🎒 **பேக்கிங் முன்னேற்றம்:** ${chk.integrations.packing.packed}/${chk.integrations.packing.total || 18} பொருட்கள் பேக் செய்யப்பட்டன\n` +
          `* 🌦️ **வானிலை ஆய்வு:** ${chk.integrations.weather.checked ? '✅ நேரலை முன்னறிவிப்பு சரிபார்க்கப்பட்டது (' + chk.integrations.weather.temp + '°C)' : '⏳ சரிபார்க்கவும்'}\n` +
          `* 🛡️ **பாதுகாப்பு & அவசர உதவி:** ${chk.integrations.safety.ready ? '✅ அவசர தொடர்புகள் சேர்க்கப்பட்டுள்ளன' : '⏳ சரிபார்க்கவும்'}\n\n` +
          `💡 **ஆலோசனை:** மீதமுள்ள ${chk.pendingTasks} நிலுவைப் பணிகளை முடிக்க கீழேயுள்ள சரிபார்ப்பு பட்டியல் இணைப்பை அழுத்தவும்.`;
      } else {
        reply = `### 📋 Travel Document & Pre-Trip Preparation Checklist (${targetDestName})\n\n` +
          `**Overall Trip Readiness Score: ${chk.readinessScore}%** (${chk.completedTasks} of ${chk.totalTasks} Ready)\n\n` +
          `* 🪪 **Identification:** Government Photo ID / Passport (Physical & Digital copy)\n` +
          `* 🎫 **Transport:** ${chk.integrations.transport.available ? '✅ Confirmed (' + chk.integrations.transport.transportTitle + ')' : '⏳ Voucher ready for check-in'}\n` +
          `* 🏨 **Hotel Stay:** ${chk.integrations.hotel.available ? '✅ Confirmed (' + chk.integrations.hotel.hotelName + ')' : '⏳ Hotel voucher ready'}\n` +
          `* 🎒 **Smart Packing:** ${chk.integrations.packing.packed}/${chk.integrations.packing.total || 18} items packed\n` +
          `* 🌦️ **Weather Review:** ${chk.integrations.weather.checked ? '✅ Live forecast verified (' + chk.integrations.weather.temp + '°C, ' + chk.integrations.weather.condition + ')' : '⏳ Forecast review pending'}\n` +
          `* 🛡️ **Safety & Emergency Contacts:** ${chk.integrations.safety.ready ? '✅ Verified trusted contacts configured' : '⏳ Emergency contacts ready'}\n\n` +
          `💡 *You have ${chk.pendingTasks} pending preparation tasks. Tap below to manage and check off items.*`;
      }

      suggestions.push(`What should I pack for ${targetDestName}?`, `What is the weather in ${targetDestName}?`, `Review emergency contacts`, `Open packing checklist`);
      actionLinks.push({ label: `📋 Open Travel Document & Preparation Checklist`, url: `/checklist?destination=${encodeURIComponent(targetDestName)}` });
      actionLinks.push({ label: `🎒 Open Smart Packing Assistant`, url: `/packing?destination=${encodeURIComponent(targetDestName)}` });
    }

    // Intent P14-1: Suggest Places Near Me / GPS Location (Feature 3 & 4)
    else if (
      (query.includes('near me') ||
        query.includes('nearby') ||
        query.includes('places near') ||
        query.includes('suggest places near') ||
        query.includes('அருகில்') ||
        query.includes('kitta irukura')) &&
      !query.includes('hotel') &&
      !query.includes('stay') &&
      !query.includes('தங்குமிடம்') &&
      !query.includes('விடுதி')
    ) {
      const locCity = context.currentLocation?.city || context.currentLocation?.area || 'your current location';

      reply = `### 📍 Top Tourist Places Near ${locCity}\n\n` +
        `Based on your GPS coordinates, here are handpicked scenic getaways and attractions near **${locCity}**:\n\n` +
        `1. 🏖️ **Mahabalipuram & ECR Coast** (~45 km • ~1.2 hrs travel)\n` +
        `   * **Highlights:** UNESCO Shore Temple, monolithic Five Rathas, surfing & beach cafes.\n` +
        `   * **Estimated Budget:** ₹3,500 - ₹5,000 / day (Estimated)\n` +
        `   * **Ideal Duration:** 1 to 2 Days\n\n` +
        `2. 🏛️ **Pondicherry French Quarter & Promenade** (~150 km • ~3.5 hrs travel)\n` +
        `   * **Highlights:** Heritage French villas, Auroville Matrimandir, beachfront bistros.\n` +
        `   * **Estimated Budget:** ₹4,500 - ₹6,500 / day (Estimated)\n` +
        `   * **Ideal Duration:** 2 to 3 Days\n\n` +
        `3. 🌲 **Ooty & Nilgiri Mountain Hills** (~530 km • ~9.5 hrs scenic route)\n` +
        `   * **Highlights:** Botanical Gardens, Nilgiri Toy Train, Pykara Lake waterfalls.\n` +
        `   * **Estimated Budget:** ₹4,000 - ₹6,000 / day (Estimated)\n` +
        `   * **Ideal Duration:** 3 to 4 Days\n\n` +
        `*Note: Travel times and costs are estimated guidelines based on standard road transit.*`;

      suggestions.push('Plan a 3-day trip to Ooty', 'Find budget stays', 'Suggest transport', 'Calculate trip budget');
      actionLinks.push({ label: '🗺️ View on Map', url: '/destinations' });
      actionLinks.push({ label: '🚀 Plan Trip to Ooty', url: '/trip-planner?destination=Ooty' });
      actionLinks.push({ label: '🏨 View Stays & Hotels', url: '/destinations/1' });
    }

    // Intent P14-2: Budget Assistance & Feasibility Calculation (Feature 9)
    else if (
      (query.includes('calculate') && query.includes('budget')) ||
      query.includes('can i plan this trip') ||
      query.includes('calculate trip budget') ||
      (query.includes('budget') && (query.includes('8000') || query.includes('8,000') || query.includes('10000') || query.includes('10,000') || query.includes('12000') || query.includes('12,000') || query.includes('20000') || query.includes('20,000')))
    ) {
      const budgetAmount = context.activeBudget || 12000;
      const days = context.activeDays || 3;
      const estTransport = 1800;
      const estStay = days * 1800;
      const estFood = days * 800;
      const estActivities = days * 400;
      const estBuffer = 800;
      const totalEstimated = estTransport + estStay + estFood + estActivities + estBuffer;
      const diff = budgetAmount - totalEstimated;

      reply = `### 💵 Trip Budget Breakdown & Feasibility Analysis\n\n` +
        `Here is the itemized budget estimate for a **${days}-day trip to ${matchedDest.name}**:\n\n` +
        `* 🚆 **Estimated Transport (Round-Trip):** ₹${estTransport.toLocaleString()} (AC Bus / Express Train)\n` +
        `* 🏨 **Accommodation (${days - 1} Nights):** ₹${estStay.toLocaleString()} (Comfortable 3-Star / Boutique Stay)\n` +
        `* 🍽️ **Food & Dining:** ₹${estFood.toLocaleString()} (₹800/day approx)\n` +
        `* 🎟️ **Local Sightseeing & Entry Tickets:** ₹${estActivities.toLocaleString()} (₹400/day approx)\n` +
        `* 🛡️ **Emergency Buffer & Local Cabs:** ₹${estBuffer.toLocaleString()}\n\n` +
        `---\n` +
        `* 💰 **Estimated Total Cost:** **₹${totalEstimated.toLocaleString()}** (Approximate estimate)\n` +
        `* 🎯 **Your Target Budget:** **₹${budgetAmount.toLocaleString()}**\n\n` +
        (diff >= 0
          ? `✅ **Verdict:** **Feasible & Well Within Budget!** You will have approximately **₹${diff.toLocaleString()}** remaining for shopping and personal expenses.`
          : `⚠️ **Verdict:** Slightly tight by **₹${Math.abs(diff).toLocaleString()}**. We recommend choosing a budget hostel/homestay or bus transit to bring costs within your target.`);

      suggestions.push('Find budget stays', 'Suggest transport', 'Create itinerary', 'Plan a 3-day trip');
      actionLinks.push({ label: '🚀 Open Budget Calculator', url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
      actionLinks.push({ label: '🏨 View Budget Stays', url: '/destinations' });
    }

    // Intent P14-3: Transport Suggestions (Feature 7)
    else if (
      query.includes('suggest transport') ||
      query.includes('how can i travel') ||
      query.includes('how to travel') ||
      query.includes('how to reach')
    ) {
      reply = `### 🚗 Recommended Transport Options to ${matchedDest.name}\n\n` +
        `Here are the most convenient ways to travel to **${matchedDest.name}**:\n\n` +
        `* ✈️ **Flight + Taxi:** Fastest option. Estimated travel time ~2-3 hrs. Cost: ₹3,500 - ₹6,500 (Estimated).\n` +
        `* 🚆 **Superfast / Express Train:** Most comfortable & scenic. Estimated travel time ~6-8 hrs. Cost: ₹750 - ₹1,800 (Estimated).\n` +
        `* 🚌 **AC Sleeper / Multi-Axle Bus:** Great overnight choice. Estimated travel time ~8-10 hrs. Cost: ₹850 - ₹1,600 (Estimated).\n` +
        `* 🚕 **Chauffeured Outstation Cab / Self-Drive:** Maximum flexibility. Estimated travel time ~7-9 hrs. Cost: ₹5,500 - ₹8,000 (Estimated).\n\n` +
        `*ℹ️ Note: Fares and travel durations are estimated guidelines and depend on real-time transit schedules and seasonality.*`;

      suggestions.push('Plan a 3-day trip', 'Find budget stays', 'Calculate trip budget', 'Create itinerary');
      actionLinks.push({ label: '🚗 Compare Transport in Planner', url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
      actionLinks.push({ label: '🗺️ View Route on Map', url: '/destinations' });
    }

    // Intent P14-4: Hotel / Stay Suggestions (Feature 8)
    else if (
      query.includes('find budget stays') ||
      query.includes('budget stays') ||
      query.includes('suggest a budget hotel') ||
      query.includes('hotels suggest') ||
      query.includes('suggest hotels') ||
      query.includes('hotel') ||
      query.includes('stay') ||
      query.includes('resort') ||
      query.includes('தங்குமிடம்') ||
      query.includes('விடுதி')
    ) {
      reply = `### 🏨 Recommended Stays in & around ${matchedDest.name}\n\n` +
        `Curated accommodations from our verified stays catalog:\n\n` +
        `1. 🌟 **Radisson Blu Resort Temple Bay / Heritage Haven**\n` +
        `   * **Type:** 4-Star Luxury Beachfront / Mountain View\n` +
        `   * **Rating:** ⭐ 4.8 / 5.0\n` +
        `   * **Approximate Price:** ₹6,500 - ₹9,500 / night (Approximate price)\n` +
        `   * **Distance:** ~0.8 km from city center\n\n` +
        `2. 🏡 **Sterling Fern Hill / Serene Valley Stays**\n` +
        `   * **Type:** 3-Star Comfort Resort\n` +
        `   * **Rating:** ⭐ 4.6 / 5.0\n` +
        `   * **Approximate Price:** ₹3,200 - ₹4,800 / night (Approximate price)\n` +
        `   * **Distance:** ~2.5 km from major attractions\n\n` +
        `3. 🎒 **Zostel & Greenview Backpackers Boutique**\n` +
        `   * **Type:** Budget Homestay / Hostel\n` +
        `   * **Rating:** ⭐ 4.7 / 5.0\n` +
        `   * **Approximate Price:** ₹1,200 - ₹2,200 / night (Approximate price)\n` +
        `   * **Distance:** Central transit accessible\n\n` +
        `*Disclaimer: Prices are approximate indicators. Check real-time booking availability prior to confirmation.*`;

      suggestions.push('Suggest transport', 'Calculate trip budget', 'Plan a 3-day trip', 'Create itinerary');
      actionLinks.push({ label: '🏨 View Stays Catalog', url: '/destinations' });
      actionLinks.push({ label: '🚀 Plan Trip with Stay', url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
    }

    // Intent P14-5: Favorites Context Notice (Feature 10)
    else if (
      query.includes('saved') ||
      query.includes('favorites') ||
      query.includes('wishlist')
    ) {
      const favList = (context.savedFavorites || []).map((f) => f.title).join(', ');
      if (favList) {
        reply = `### ❤️ Your Saved Favorites & Wishlist\n\n` +
          `I found the following places and stays in your Travelora Wishlist:\n\n` +
          `* ${favList}\n\n` +
          `Would you like me to build a customized **3-day itinerary** that includes these exact places?`;
      } else {
        reply = `### ❤️ Your Saved Favorites\n\n` +
          `You currently have no saved favorites. You can click the ❤️ heart button on any tourist place, hotel, or trip to bookmark it, and I'll include it in your future itineraries!`;
      }
      suggestions.push('Plan a 3-day trip', 'Suggest places near me', 'Find budget stays');
      actionLinks.push({ label: '❤️ Open My Favorites', url: '/favorites' });
      actionLinks.push({ label: '🚀 Plan Trip', url: '/trip-planner' });
    }

    // Intent 0: Booking Policies, Cancellation & Refunds
    else if (
      query.includes('cancel') ||
      query.includes('refund') ||
      query.includes('policy') ||
      query.includes('booking rule') ||
      query.includes('payment method') ||
      query.includes('ரத்து') ||
      query.includes('பணம் திரும்ப') ||
      query.includes('விதிகளை') ||
      query.includes('rathu') ||
      query.includes('panam thirumba') ||
      query.includes('policy enna')
    ) {
      if (lang === 'ta') {
        reply = `### 📋 டிராவலோரா முன்பதிவு மற்றும் ரத்துசெய்தல் விதிகள்\n\n` +
          `டிராவலோராவில் உங்கள் பயண முன்பதிவு தொடர்பான முக்கிய தகவல்கள்:\n\n` +
          `* ⏱️ **இலவச ரத்து & முழு பணத்திருப்பம்:** ${KNOWLEDGE_BASE.bookingPolicies.cancellationTa}\n` +
          `* 💳 **ஏற்றுக்கொள்ளப்படும் கட்டண முறைகள்:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethodsTa}\n` +
          `* 🔒 **வங்கி தர பாதுகாப்பு:** ${KNOWLEDGE_BASE.bookingPolicies.securityTa}\n\n` +
          `உங்கள் உறுதிசெய்யப்பட்ட பயண விவரங்களை [எனது பயணங்கள்](/my-trips) பக்கத்தில் பார்க்கலாம்.`;

        suggestions.push('பேக்கேஜ் முன்பதிவு செய்வது எப்படி?', 'பட்ஜெட் பயணங்கள்', 'பிரபலமான இடங்கள்');
        actionLinks.push({ label: 'எனது பயணங்கள் (My Trips)', url: '/my-trips' });
      } else if (lang === 'thanglish') {
        reply = `### 📋 Travelora Booking & Cancellation Rules\n\n` +
          `Unga bookings matrum refund details inge:\n\n` +
          `* ⏱️ **Free Cancellation & Full Refund:** ${KNOWLEDGE_BASE.bookingPolicies.cancellationTh}\n` +
          `* 💳 **Payment Methods:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethodsTh}\n` +
          `* 🔒 **Security & Privacy:** ${KNOWLEDGE_BASE.bookingPolicies.securityTh}\n\n` +
          `Unga bookings-ai [My Trips Dashboard-la](/my-trips) paarthu manage pannalaam.`;

        suggestions.push('Package book panradhu epdi?', 'Budget beach trips sollunga', 'Popular places');
        actionLinks.push({ label: 'My Trips Paarkka', url: '/my-trips' });
      } else {
        reply = `### 📋 Travelora Booking & Payment Policies\n\n` +
          `Here are the key details regarding bookings on Travelora:\n\n` +
          `* **Cancellation & Refunds:** ${KNOWLEDGE_BASE.bookingPolicies.cancellation}\n` +
          `* **Payment Methods:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethods}\n` +
          `* **Security & Privacy:** ${KNOWLEDGE_BASE.bookingPolicies.security}\n\n` +
          `You can easily view and manage your confirmed reservations under [My Trips](/my-trips).`;

        suggestions.push('How to book a package', 'Recommend a budget trip', 'Top destinations');
        actionLinks.push({ label: 'View My Trips', url: '/my-trips' });
      }
    }

    // Intent A: Multi-turn Day-wise Specific Inquiry (e.g. "What about the second day?", "day 2 enna panradhu?", "இரண்டாம் நாளில் என்ன செய்யலாம்?")
    else if (
      query.includes('second day') ||
      query.includes('day 2') ||
      query.includes('2nd day') ||
      query.includes('third day') ||
      query.includes('day 3') ||
      query.includes('3rd day') ||
      query.includes('first day') ||
      query.includes('day 1') ||
      query.includes('fourth day') ||
      query.includes('day 4') ||
      query.includes('இரண்டாம் நாள்') ||
      query.includes('மூன்றாம் நாள்') ||
      query.includes('முதல் நாள்')
    ) {
      let targetDayNum = 2;
      if (query.includes('first') || query.includes('day 1') || query.includes('முதல்')) targetDayNum = 1;
      else if (query.includes('third') || query.includes('day 3') || query.includes('3rd') || query.includes('மூன்றாம்')) targetDayNum = 3;
      else if (query.includes('fourth') || query.includes('day 4') || query.includes('4th') || query.includes('நான்காம்')) targetDayNum = 4;

      const dayObj = (matchedDest.daysPlan && matchedDest.daysPlan[targetDayNum - 1]) || {
        day: targetDayNum,
        title: `Exploring Highlights of ${matchedDest.name}`,
        plan: `Morning landmark sightseeing, local cultural exploration, and sunset dining.`,
      };

      if (lang === 'ta') {
        reply = `### 📅 ${matchedDest.nameTa || matchedDest.name} - நாள் ${dayObj.day}: ${dayObj.title}\n\n` +
          `நாங்கள் திட்டமிட்ட **${matchedDest.nameTa || matchedDest.name}** பயணத்தின் ${dayObj.day}-ஆம் நாள் விரிவான திட்டம்:\n\n` +
          `* 🌅 **காலை மற்றும் மதியம்:** ${dayObj.plan}\n` +
          `* 🍽️ **உணவு பரிந்துரை:** உள்ளூர் பிரபலமான பாரம்பரிய உணவு விடுதியில் மதிய மற்றும் இரவு உணவு.\n` +
          `* 💡 **பயண குறிப்பு:** கூட்ட நெரிசலை தவிர்க்க காலை 9:00 மணிக்கே தொடங்குவது சிறந்தது.\n\n` +
          `அடுத்த நாள் பற்றியோ அல்லது தங்குமிடம்/உணவு பற்றியோ மேலும் அறிய விரும்புகிறீர்களா?`;

        suggestions.push(`நாள் ${dayObj.day + 1} திட்டம் என்ன?`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடம் எங்கு சிறந்தது?`, 'உள்ளூர் உணவு விவரங்கள்');
      } else if (lang === 'thanglish') {
        reply = `### 📅 ${matchedDest.name} - Day ${dayObj.day}: ${dayObj.title}\n\n` +
          `Unga **${matchedDest.name}** trip-oda Day ${dayObj.day} detailed plan:\n\n` +
          `* 🌅 **Schedule & Activities:** ${dayObj.plan}\n` +
          `* 🍽️ **Food Spot:** Famous local Goan / regional eatery-la fresh authentic meals.\n` +
          `* 💡 **Pro Travel Tip:** Morning 9:00 AM-kulla kelambina traffic and crowd avoid pannalaam.\n\n` +
          `Next day plan paakka poringala? Or hotels/food pathi keka poringala?`;

        suggestions.push(`Day ${dayObj.day + 1} enna panradhu?`, `${matchedDest.name} best hotels`, 'Famous food items');
      } else {
        reply = `### 📅 ${matchedDest.name} - Day ${dayObj.day}: ${dayObj.title}\n\n` +
          `Here is the detailed itinerary for **Day ${dayObj.day}** of your **${matchedDest.name}** vacation:\n\n` +
          `* 🌅 **Activities & Sightseeing:** ${dayObj.plan}\n` +
          `* 🍽️ **Culinary Recommendation:** Savor signature regional specialties for lunch and beachfront / scenic dining for dinner.\n` +
          `* 💡 **AI Travel Tip:** Start around 9:00 AM to enjoy optimal morning lighting for photography and avoid peak afternoon crowds.\n\n` +
          `Would you like to review the next day's plan or explore top hotel stays nearby?`;

        suggestions.push(`What about Day ${dayObj.day + 1}?`, `Top hotels in ${matchedDest.name}`, `What to eat in ${matchedDest.name}?`);
      }

      actionLinks.push({ label: `Full ${matchedDest.name} Itinerary`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
    }

    // Intent B: Hotels, Stays & Accommodations Inquiry
    else if (
      query.includes('hotel') ||
      query.includes('stay') ||
      query.includes('resort') ||
      query.includes('villa') ||
      query.includes('hostel') ||
      query.includes('தங்குமிடம்') ||
      query.includes('விடுதி') ||
      query.includes('thanga') ||
      query.includes('stay-ku')
    ) {
      if (lang === 'ta') {
        reply = `### 🏨 ${matchedDest.nameTa || matchedDest.name}-ல் பரிந்துரைக்கப்படும் சிறந்த தங்குமிடங்கள்\n\n` +
          `உங்கள் பயண பாணி மற்றும் பட்ஜெட்டிற்கு ஏற்ற சிறந்த ஹோட்டல்கள்:\n\n` +
          `* 🌟 **பரிந்துரைக்கப்பட்டவை:** ${matchedDest.hotels || 'பிரபலமான கடற்கரை ரிசார்ட்டுகள் மற்றும் பூட்டிக் ஹோட்டல்கள்'}\n` +
          `* 💰 **விலை நிலவரம்:** பட்ஜெட் தங்குமிடங்கள் ₹1,500 - ₹2,500/இரவு | சொகுசு ரிசார்ட்டுகள் ₹7,000 - ₹15,000/இரவு.\n` +
          `* 📍 **சிறந்த இடங்கள்:** கடற்கரைக்கு அருகில் அல்லது நகர மையத்திற்கு அருகில் தங்குவது பயண நேரத்தை மிச்சப்படுத்தும்.`;

        suggestions.push(`${matchedDest.nameTa || matchedDest.name} பேக்கேஜ்களைப் பார்`, 'உள்ளூர் போக்குவரத்து விவரங்கள்', 'பயணத் திட்டம் உருவாக்கு');
      } else if (lang === 'thanglish') {
        reply = `### 🏨 Top Recommended Stays in ${matchedDest.name}\n\n` +
          `Unga travel style and budget-kku thagundha best hotels:\n\n` +
          `* 🌟 **Top Picks:** ${matchedDest.hotels || 'Popular beach resorts & boutique stays'}\n` +
          `* 💰 **Price Range:** Budget stays ₹1,500 - ₹2,500/night | Luxury resorts ₹7,000 - ₹15,000/night.\n` +
          `* 📍 **Location Tip:** Prime attractions kitta stay panna travel time romba save aagum.`;

        suggestions.push(`${matchedDest.name} packages kaatunga`, 'Local transport epdi?', 'Full itinerary plan');
      } else {
        reply = `### 🏨 Top Recommended Stays in ${matchedDest.name}\n\n` +
          `Here are curated accommodations suited for different budgets in **${matchedDest.name}**:\n\n` +
          `* 🌟 **Top Picks:** ${matchedDest.hotels || 'Luxury beachfront resorts & boutique heritage hotels'}\n` +
          `* 💰 **Typical Price Ranges:** Budget Hostels & Guesthouses ($20 - $35/night) | 4/5-Star Resorts ($90 - $250+/night).\n` +
          `* 📍 **Location Tip:** Staying centrally near major transit hubs saves commute time between daily attractions.`;

        suggestions.push(`View ${matchedDest.name} packages`, 'How to get around?', 'Plan complete trip');
      }

      actionLinks.push({ label: 'Browse Packages', url: '/packages' });
    }

    // Intent C: Food, Dining & Local Cuisine
    else if (
      query.includes('food') ||
      query.includes('eat') ||
      query.includes('cuisine') ||
      query.includes('restaurant') ||
      query.includes('dish') ||
      query.includes('vegetarian') ||
      query.includes('veg') ||
      query.includes('உணவு') ||
      query.includes('சாப்பாடு') ||
      query.includes('saapaadu') ||
      query.includes('sapad')
    ) {
      if (lang === 'ta') {
        reply = `### 🍽️ ${matchedDest.nameTa || matchedDest.name}-ன் புகழ்பெற்ற உணவுகள் & சுவைகள்\n\n` +
          `நீங்கள் கண்டிப்பாக ருசிக்க வேண்டிய பாரம்பரிய உணவுகள்:\n\n` +
          `* 🍲 **முக்கிய உணவுகள்:** ${matchedDest.food || 'பாரம்பரிய சுவையான பிராந்திய உணவுகள்'}\n` +
          `* 🥗 **சைவ உணவுகள் (Vegetarian):** அனைத்து முக்கிய உணவகங்களிலும் சுவையான சைவ உணவுகள் மற்றும் புதிய பழச்சாறுகள் கிடைக்கின்றன.\n` +
          `* ☕ **சிற்றுண்டி & பானங்கள்:** புதிய இளநீர் மற்றும் உள்ளூர் பிரத்யேக இனிப்புகள்.`;

        suggestions.push(`${matchedDest.nameTa || matchedDest.name} நாள் 1 திட்டம்`, 'சிறந்த தங்குமிடங்கள்', 'பட்ஜெட் விவரங்கள்');
      } else if (lang === 'thanglish') {
        reply = `### 🍽️ Famous Food & Dining in ${matchedDest.name}\n\n` +
          `Neenga kandippa try panna vendiya local special dishes:\n\n` +
          `* 🍲 **Signature Dishes:** ${matchedDest.food || 'Delicious regional dishes & fresh seafood'}\n` +
          `* 🥗 **Veg Options:** Veg restaurants and North/South Indian meals neraya idathula available.\n` +
          `* ☕ **Street Food & Snacks:** Fresh tender coconut water matrum local snacks try pannunga.`;

        suggestions.push(`${matchedDest.name} Day 1 plan`, 'Hotels pathi sollunga', 'Budget evlo aagum?');
      } else {
        reply = `### 🍽️ Famous Food & Dining in ${matchedDest.name}\n\n` +
          `Must-try culinary delights and local specialties in **${matchedDest.name}**:\n\n` +
          `* 🍲 **Signature Dishes:** ${matchedDest.food || 'Fresh seafood, aromatic curries, and regional street foods'}\n` +
          `* 🥗 **Vegetarian / Vegan Options:** Widely available with dedicated plant-based and multicuisine dining spots.\n` +
          `* ☕ **Local Tip:** Visit reputable beach shacks and historic town bistros for the most authentic flavors.`;

        suggestions.push(`What to do on Day 1 in ${matchedDest.name}?`, `Top hotels in ${matchedDest.name}`, `What is the best season?`);
      }
    }

    // Intent D: Transportation, Getting Around & Commuting
    else if (
      query.includes('transport') ||
      query.includes('travel around') ||
      query.includes('getting around') ||
      query.includes('metro') ||
      query.includes('bus') ||
      query.includes('taxi') ||
      query.includes('cab') ||
      query.includes('train') ||
      query.includes('scooter') ||
      query.includes('car rental') ||
      query.includes('போக்குவரத்து') ||
      query.includes('போவது எப்படி') ||
      query.includes('travel panna') ||
      query.includes('transport epdi')
    ) {
      if (lang === 'ta') {
        reply = `### 🚗 ${matchedDest.nameTa || matchedDest.name}-ல் போக்குவரத்து மற்றும் பயண வழிகாட்டி\n\n` +
          `சுற்றுலா இடங்களை எளிதாக அடைய சிறந்த போக்குவரத்து வழிகள்:\n\n` +
          `* 🚆 **பொதுப் போக்குவரத்து & மெட்ரோ:** ${matchedDest.transportTa || matchedDest.transport}\n` +
          `* 🚕 **வாடகை வாகனங்கள் & டாக்சி:** உள்ளூர் டாக்சிகள், ஆப் அடிப்படையிலான வாகனங்கள் அல்லது ஸ்கூட்டர்கள்.\n` +
          `* 💡 **பயண குறிப்பு:** தினசரி பயண பாஸ்களை வாங்குவது பயண கட்டணத்தை மிச்சப்படுத்தும்.`;

        suggestions.push(`${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, 'பயண திட்டம் உருவாக்கு', 'உள்ளூர் உணவுகள்');
      } else if (lang === 'thanglish') {
        reply = `### 🚗 Local Transportation & Commute in ${matchedDest.name}\n\n` +
          `Attractions-ai explore panna best transport options:\n\n` +
          `* 🚆 **Transit & Commute:** ${matchedDest.transportTh || matchedDest.transport}\n` +
          `* 🚕 **Taxi / Rentals:** Local cabs, scooter rentals or metro passes convenient-ah irukkum.\n` +
          `* 💡 **Pro-Tip:** Day travel pass eduthukitta expenses romba reduce aagum.`;

        suggestions.push(`${matchedDest.name} hotels pathi sollunga`, 'Full itinerary plan', 'Best places to visit');
      } else {
        reply = `### 🚗 Getting Around & Local Transportation in ${matchedDest.name}\n\n` +
          `Here is the best way to navigate and commute in **${matchedDest.name}**:\n\n` +
          `* 🚆 **Public Transit & Rail Network:** ${matchedDest.transport}\n` +
          `* 🚕 **Taxis & Ride-Hailing:** Dedicated ride apps and licensed airport shuttles provide direct connectivity.\n` +
          `* 💡 **Pro-Tip:** Multi-day transit passes (e.g. Navigo in Paris, JR Pass in Japan, Swiss Travel Pass in Switzerland) offer unlimited rides and major savings.`;

        suggestions.push(`Top hotels in ${matchedDest.name}`, `What to eat in ${matchedDest.name}?`, `Plan complete trip`);
      }
      actionLinks.push({ label: `Plan ${matchedDest.name} Trip`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
    }

    // Intent E: Activities, Watersports & Adventure Experiences
    else if (
      query.includes('activit') ||
      query.includes('scuba') ||
      query.includes('surf') ||
      query.includes('ski') ||
      query.includes('trek') ||
      query.includes('safari') ||
      query.includes('watersport') ||
      query.includes('adventure') ||
      query.includes('சாகசம்') ||
      query.includes('ஸ்கூபா') ||
      query.includes('ட்ரெக்கிங்') ||
      query.includes('விளையாட்டு') ||
      query.includes('saagasa') ||
      query.includes('vilaiyattu')
    ) {
      if (lang === 'ta') {
        reply = `### 🧗 சிறந்த சாகசங்கள் மற்றும் சுற்றுலா அனுபவங்கள்\n\n` +
          `டிராவலோராவின் சிறந்த சாகச அனுபவங்கள்:\n\n` +
          `* 🌊 **நீர் விளையாட்டுகள் & ஸ்கூபா டைவிங் (Watersports & Scuba):** ஹேவ்லாக் தீவு (அந்தமான்), கலங்குட் கடற்கரை (கோவா), பாலி தீவு.\n` +
          `* 🏔️ **பனிச்சறுக்கு & மலையேற்றம் (Skiing & Trekking):** சுவிஸ் ஆல்ப்ஸ் மேட்டர்ஹார்ன், சோலாங் பள்ளத்தாக்கு (மணாலி).\n` +
          `* 🦁 **வனவிலங்கு சஃபாரி (Wildlife Safari):** செரெங்கேட்டி பிக் 5 சஃபாரி & ஹாட் ஏர் பலூன் (தான்சானியா).\n` +
          `* 🏛️ **கலை & கலாச்சாரம்:** பாரிஸ் லூவர் அருங்காட்சியகம், கியோட்டோ பாரம்பரிய தேநீர் சடங்கு.\n` +
          `* 🧘 **ஆயுர்வேத ஸ்பா & நல்வாழ்வு:** கேரள பாரம்பரிய ஆயுர்வேத மசாஜ், பாலி யோகா பயிற்சி.`;

        suggestions.push('சாகச பேக்கேஜ்களை காட்டு', 'அந்தமான் ஸ்கூபா திட்டம்', 'பாலி வில்லாக்கள்');
        actionLinks.push({ label: 'பேக்கேஜ்களை ஆராய்க', url: '/packages' });
      } else if (lang === 'thanglish') {
        reply = `### 🧗 Top Activities & Adventure Experiences\n\n` +
          `Travelora-la irukkum best adventures & experiences:\n\n` +
          `* 🌊 **Watersports & Scuba Diving:** Havelock Island (Andaman), Calangute Beach (Goa), Bali.\n` +
          `* 🏔️ **Snow Skiing & Trekking:** Swiss Alps Zermatt, Solang Valley (Manali).\n` +
          `* 🦁 **Wildlife Safari:** Serengeti Big Five safari & hot air balloon ride (Tanzania).\n` +
          `* 🏛️ **Culture & Art:** Paris Louvre Museum tour, Kyoto traditional tea ceremony.\n` +
          `* 🧘 **Ayurvedic Spa & Wellness:** Kerala traditional Ayurvedic massage, Ubud Yoga healing.`;

        suggestions.push('Adventure packages kaatunga', 'Andaman scuba trip plan', 'Bali villas pathi sollunga');
        actionLinks.push({ label: 'Packages Explore Panna', url: '/packages' });
      } else {
        reply = `### 🧗 Top Activities & Adventure Experiences\n\n` +
          `Travelora offers curated activities tailored to your travel style:\n\n` +
          `* 🌊 **Watersports & Scuba Diving:** Havelock Island (Andaman), Calangute Beach (Goa), Seminyak (Bali).\n` +
          `* 🏔️ **Alpine Trekking & Skiing:** Zermatt Glacier trails & Matterhorn skiing (Swiss Alps), Solang Valley (Manali).\n` +
          `* 🦁 **Wildlife Safari & Game Drives:** Serengeti Big Five safari & hot air ballooning (Tanzania).\n` +
          `* 🏛️ **Cultural Masterpieces:** Louvre VIP tour & Versailles (Paris), Fushimi Inari shrine walk (Kyoto).\n` +
          `* 🧘 **Wellness & Spa:** Traditional Ayurvedic Abhyanga massage (Kerala), Yoga sound healing (Ubud).`;

        suggestions.push('Show adventure packages', 'Plan a scuba trip to Andaman', 'Tell me about Bali villas');
        actionLinks.push({ label: 'Explore Packages', url: '/packages' });
      }
    }

    // Intent F: Full Trip Itinerary Generation (e.g. "Plan a 4-day Goa trip")
    else if (
      query.includes('plan') ||
      query.includes('itinerary') ||
      query.includes('trip') ||
      query.includes('திட்டமிடு') ||
      query.includes('திட்டம்')
    ) {
      const daysCount = context.activeDays || 4;
      const budgetFormatted = context.activeBudget ? `₹${context.activeBudget.toLocaleString()}` : matchedDest.dailyCostINR;

      if (lang === 'ta') {
        reply = `### ✈️ ${matchedDest.nameTa || matchedDest.name} ${daysCount}-நாள் ஸ்மார்ட் பயணத் திட்டம்\n\n` +
          `உங்கள் விருப்பத்திற்கு ஏற்ப உருவாக்கப்பட்ட விரிவான திட்டம் (பட்ஜெட்: ${budgetFormatted}):\n\n` +
          matchedDest.daysPlan.slice(0, daysCount).map((d) => `* **நாள் ${d.day} (${d.title}):** ${d.plan}`).join('\n') +
          `\n\n* **பயண குறிப்பு:** ${matchedDest.transport || 'உள்ளூர் வாடகை வாகனங்கள் மூலம் எளிதாக பயணிக்கலாம்.'}\n\n` +
          `குறிப்பிட்ட நாள் (எ.கா. *"இரண்டாம் நாள் பற்றி சொல்லுங்கள்"*) அல்லது தங்குமிடம் பற்றி மேலும் கேட்கலாம்!`;

        suggestions.push('இரண்டாம் நாளில் என்ன செய்யலாம்?', 'தங்குமிடம் எங்கு சிறந்தது?', 'பேக்கேஜ் முன்பதிவு செய்வது எப்படி?');
      } else if (lang === 'thanglish') {
        reply = `### ✈️ ${matchedDest.name} ${daysCount}-Day Smart Travel Plan\n\n` +
          `Unga request-kku thagundha customized itinerary (Budget: ${budgetFormatted}):\n\n` +
          matchedDest.daysPlan.slice(0, daysCount).map((d) => `* **Day ${d.day} (${d.title}):** ${d.plan}`).join('\n') +
          `\n\n* **Travel Advice:** ${matchedDest.transportTh || matchedDest.transport}\n\n` +
          `Specific day pathi (e.g. *"What about the second day?"*) or hotels pathi keka related questions kelunga!`;

        suggestions.push('What about the second day?', `${matchedDest.name} hotels pathi sollunga`, 'Food items enna iruku?');
      } else {
        reply = `### ✈️ ${matchedDest.name} ${daysCount}-Day Smart Itinerary\n\n` +
          `Here is your personalized itinerary tailored for **${daysCount} days** in **${matchedDest.name}** (Budget: ${budgetFormatted}):\n\n` +
          matchedDest.daysPlan.slice(0, daysCount).map((d) => `* **Day ${d.day} — ${d.title}:** ${d.plan}`).join('\n') +
          `\n\n* 🚗 **Local Transportation:** ${matchedDest.transport}\n\n` +
          `You can ask me to dive deeper into any specific day (e.g. *"What about the second day?"*), recommended stays, or local culinary spots!`;

        suggestions.push('What about the second day?', `Top hotels in ${matchedDest.name}`, `What is the best time to visit?`);
      }

      actionLinks.push({ label: `Save to My Trips`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
    }

    // Intent E: Packages & Deals Inquiry
    else if (
      query.includes('package') ||
      query.includes('deal') ||
      query.includes('inclusion') ||
      query.includes('விலை') ||
      query.includes('பேக்கேஜ்') ||
      query.includes('vilai')
    ) {
      const matchedPkg = KNOWLEDGE_BASE.packages.find((p) =>
        query.includes('swiss') && p.title.includes('Swiss') ||
        query.includes('சுவிஸ்') && p.title.includes('Swiss') ||
        query.includes('paris') && p.title.includes('Paris') ||
        query.includes('பாரிஸ்') && p.title.includes('Paris') ||
        query.includes('bali') && p.title.includes('Bali') ||
        query.includes('பாலி') && p.title.includes('Bali')
      ) || KNOWLEDGE_BASE.packages[0];

      if (lang === 'ta') {
        reply = `### 📦 பிரத்யேக சுற்றுலா பேக்கேஜ்: ${matchedPkg.titleTa || matchedPkg.title}\n\n` +
          `* 💵 **கட்டணம்:** **${matchedPkg.price}** (ஒரு நபருக்கு)\n` +
          `* ⏳ **கால அளவு:** ${matchedPkg.durationTa || matchedPkg.duration}\n` +
          `* 🏷️ **பயண பாணி:** ${matchedPkg.type}\n\n` +
          `#### ✅ பேக்கேஜில் உள்ளடங்கியவை (Inclusions):\n${matchedPkg.inclusions}\n\n` +
          `#### ❌ பேக்கேஜில் இல்லாதவை (Exclusions):\n${matchedPkg.exclusions}\n\n` +
          `*உடனடி உறுதிப்படுத்தல் மற்றும் 48 மணி நேர இலவச ரத்துசெய்தல் வசதியுடன்.*`;

        suggestions.push('இந்த பேக்கேஜை எப்படி பதிவு செய்வது?', 'அனைத்து பேக்கேஜ்களையும் காட்டு', 'ரத்து விதிகள் என்ன?');
      } else if (lang === 'thanglish') {
        reply = `### 📦 Curated Package: ${matchedPkg.title}\n\n` +
          `* 💵 **Price:** **${matchedPkg.price}** per traveler\n` +
          `* ⏳ **Duration:** ${matchedPkg.duration}\n` +
          `* 🏷️ **Travel Style:** ${matchedPkg.type}\n\n` +
          `#### ✅ Package-la Enna Ellam Serndhirukku (Inclusions):\n${matchedPkg.inclusions}\n\n` +
          `#### ❌ Package-la Illaadhavai (Exclusions):\n${matchedPkg.exclusions}\n\n` +
          `*Instant confirmation matrum 48-hour free cancellation policy irukku.*`;

        suggestions.push('Idha epdi book panradhu?', 'Ella packages-um kaatunga', 'Cancellation policy enna?');
      } else {
        reply = `### 📦 Curated Package: ${matchedPkg.title}\n\n` +
          `* 💵 **Price:** **${matchedPkg.price}** per traveler\n` +
          `* ⏳ **Duration:** ${matchedPkg.duration}\n` +
          `* 🏷️ **Travel Style:** ${matchedPkg.type}\n\n` +
          `#### ✅ Included in Package:\n${matchedPkg.inclusions}\n\n` +
          `#### ❌ Excluded:\n${matchedPkg.exclusions}\n\n` +
          `*Includes instant booking confirmation & 48-hour free cancellation.*`;

        suggestions.push('How do I book this package?', 'Show all available packages', 'What is the cancellation policy?');
      }

      actionLinks.push({ label: 'View Package Details', url: matchedPkg.link });
      actionLinks.push({ label: 'Instant Booking', url: '/booking?packageId=1' });
    }

    // Intent G: Travel Rewards & Loyalty Points (Phase 16 - Feature 16)
    else if (
      query.includes('reward') ||
      query.includes('point') ||
      query.includes('tier') ||
      query.includes('loyalty') ||
      query.includes('level') ||
      query.includes('points') ||
      query.includes('மதிப்பெண்') ||
      query.includes('பரிசு')
    ) {
      reply = `### 🏆 Travelora Rewards Program\n\n` +
        `You earn **Travel Points** through genuine travel activities on Travelora:\n\n` +
        `* 🧳 **Completed Trip:** +100 Travel Points\n` +
        `* ⭐ **Verified Review:** +25 Travel Points\n` +
        `* 🗺️ **Saved Trip Plan:** +10 Travel Points\n\n` +
        `#### 🎖️ Loyalty Tiers:\n` +
        `* 🌱 **Explorer** (0–499 pts)\n` +
        `* 🧭 **Traveller** (500–999 pts)\n` +
        `* 🌍 **Adventurer** (1,000–2,499 pts)\n` +
        `* 🏆 **Travel Pro** (2,500+ pts)\n\n` +
        `*Track your balance, tier level progress, and reward history in your Rewards Hub.*`;

      suggestions.push('How to earn more points?', 'Plan a new trip', 'Explore destinations');
      actionLinks.push({ label: 'View My Rewards', url: '/rewards' });
    }

    // Intent H: Travel Safety & Emergency Assistance (Phase 25 - Feature 26)
    else if (
      query.includes('safety') ||
      query.includes('emergency') ||
      query.includes('hospital') ||
      query.includes('police') ||
      query.includes('pharmacy') ||
      query.includes('doctor') ||
      query.includes('ambulance') ||
      query.includes('first aid') ||
      query.includes('sos') ||
      query.includes('medical') ||
      query.includes('பாதுகாப்பு') ||
      query.includes('அவசரம்') ||
      query.includes('மருத்துவமனை') ||
      query.includes('காவல்') ||
      query.includes('மருந்தகம்') ||
      query.includes('maruthuvamanai') ||
      query.includes('kaaval') ||
      query.includes('safety help')
    ) {
      if (lang === 'ta') {
        reply = `### 🛡️ பயண பாதுகாப்பு மற்றும் அவசர உதவி மையம்\n\n` +
          `டிராவலோராவின் பாதுகாப்பு பிரிவு மூலம் நீங்கள் உடனடியாக கண்டறியலாம்:\n\n` +
          `* 🏥 **அருகிலுள்ள மருத்துவமனைகள்:** 24/7 அவசர சிகிச்சை பிரிவுகள் மற்றும் விரைவு வழிகள்.\n` +
          `* 🚓 **காவல் நிலையங்கள்:** உள்ளூர் காவல் மற்றும் சுற்றுலா காவல் உதவி.\n` +
          `* 💊 **மருந்தகங்கள்:** 24 மணி நேர மருந்தகங்கள் மற்றும் முதலுதவி பொருட்கள்.\n` +
          `* 🚨 **அவசர எண்கள்:** 112 (தேசிய அவசர உதவி), 100 (காவல்), 108 (ஆம்புலன்ஸ்), 101 (தீயணைப்பு).\n` +
          `* 👥 **நம்பகமான தொடர்புகள்:** உங்கள் குடும்பத்தினர் அல்லது நண்பர்களை சேமித்து வைக்கலாம்.\n\n` +
          `*உங்கள் இருப்பிடத்தின் அடிப்படையில் அருகிலுள்ள வசதிகளைப் பார்க்க பாதுகாப்பு பக்கத்திற்கு செல்லவும்.*`;

        suggestions.push('அருகிலுள்ள மருத்துவமனையை காட்டு', 'காவல் நிலையத்தை கண்டறி', 'அவசர எண்கள் என்ன?');
      } else if (lang === 'thanglish') {
        reply = `### 🛡️ Travel Safety & Emergency Assistant\n\n` +
          `Unga safety and emergency needs-kku Travelora provides:\n\n` +
          `* 🏥 **Nearby Hospitals:** Verified 24/7 ER, trauma centers & fastest route directions.\n` +
          `* 🚓 **Police Stations:** Local precinct & tourist police assistance.\n` +
          `* 💊 **Pharmacies:** Day & night chemists with essential supplies.\n` +
          `* 🚨 **Emergency Contacts:** 112 (Universal), 100 (Police), 108 (Ambulance), 101 (Fire).\n` +
          `* 👥 **Trusted Contacts:** Save emergency contacts & share location with explicit confirmation.\n\n` +
          `*Detailed nearby places paakka Travel Safety page open pannunga!*`;

        suggestions.push('Find nearest hospital', 'Police station list', 'Emergency numbers');
      } else {
        reply = `### 🛡️ Travel Safety & Emergency Assistant\n\n` +
          `Travelora features a dedicated, privacy-focused Safety Assistant to help you travel with confidence:\n\n` +
          `* 🏥 **Nearby Hospitals & ER:** Verified emergency trauma centers with fastest route directions.\n` +
          `* 🚓 **Police Stations:** Local police departments and tourist assistance desks.\n` +
          `* 💊 **Pharmacies:** 24/7 day & night chemists for emergency medical supplies.\n` +
          `* 🚨 **Country Emergency Numbers:** Official emergency dispatch contacts (112 / 911 / 999).\n` +
          `* 👥 **Trusted Contacts & Location Sharing:** Manage emergency contacts and share safe location updates with explicit user confirmation.\n\n` +
          `*Open the Travel Safety Dashboard to locate facilities near your GPS position.*`;

        suggestions.push('Find the nearest hospital', 'Find police station', 'Emergency numbers');
      }

      actionLinks.push({ label: 'Open Travel Safety 🛡️', url: '/safety' });
    }

    // Intent F: General Travel Destination & Weather Guide
    else {
      if (lang === 'ta') {
        reply = `### 🌍 பயண வழிகாட்டி: ${matchedDest.nameTa || matchedDest.name} (${matchedDest.countryTa || matchedDest.country})\n\n` +
          `* ⛅ **செல்ல சிறந்த பருவம்:** ${matchedDest.bestTimeTa || matchedDest.bestTime}\n` +
          `* ⏱️ **பரிந்துரைக்கப்பட்ட நாட்கள்:** ${matchedDest.idealDurationTa || matchedDest.idealDuration}\n` +
          `* 💰 **மதிப்பிடப்பட்ட தினசரி பட்ஜெட்:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **முக்கிய சுற்றுலா இடங்கள்:** ${matchedDest.highlightsTa || matchedDest.highlights}\n\n` +
          `உங்களுக்கு ${matchedDest.nameTa || matchedDest.name}-க்கான நாள் வாரியான பயணத் திட்டத்தை (Smart Itinerary) உருவாக்கவா?`;

        suggestions.push(`${matchedDest.nameTa || matchedDest.name} பயண திட்டம் உருவாக்கு`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடம் எங்கு சிறந்தது?`, 'பட்ஜெட் கடற்கரை பயணங்கள்');
      } else if (lang === 'thanglish') {
        reply = `### 🌍 Payana Vazhikaatti: ${matchedDest.name} (${matchedDest.country})\n\n` +
          `* ⛅ **Poga Best Time / Season:** ${matchedDest.bestTimeTh || matchedDest.bestTime}\n` +
          `* ⏱️ **Thevaipadum Naatkal:** ${matchedDest.idealDurationTh || matchedDest.idealDuration}\n` +
          `* 💰 **Daily Budget Estimation:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **Paarka Vendiya Mukkiya Idangal:** ${matchedDest.highlightsTh || matchedDest.highlights}\n\n` +
          `Ungalukku ${matchedDest.name}-kku day-by-day smart itinerary ready panna kattalaam?`;

        suggestions.push(`${matchedDest.name} itinerary generate pannunga`, `${matchedDest.name} hotels pathi sollunga`, 'Budget beach trips');
      } else {
        reply = `### 🌍 Travel Guide: ${matchedDest.name} (${matchedDest.country})\n\n` +
          `* ⛅ **Best Time to Visit:** ${matchedDest.bestTime}\n` +
          `* ⏱️ **Recommended Duration:** ${matchedDest.idealDuration}\n` +
          `* 💰 **Estimated Daily Budget:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **Must-See Highlights:** ${matchedDest.highlights}\n\n` +
          `Would you like to build a day-by-day smart itinerary, explore top hotels, or browse curated travel packages for ${matchedDest.name}?`;

        suggestions.push(`Plan a ${context.activeDays || 4}-day ${matchedDest.name} trip`, `Top hotels in ${matchedDest.name}`, `What to eat in ${matchedDest.name}?`);
      }

      actionLinks.push({ label: `Plan ${matchedDest.name} Trip`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
      actionLinks.push({ label: 'Browse Packages', url: '/packages' });
    }

    this.recordMessage(sessionId, rawQuery, reply);

    return {
      reply,
      suggestions,
      actionLinks,
      language: lang,
      context: {
        destination: matchedDest.name,
        days: context.activeDays,
        budget: context.activeBudget,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Save message pair into session history
   */
  recordMessage(sessionId, userPrompt, assistantReply) {
    let history = sessionHistories.get(sessionId) || [];
    history.push({
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString(),
    });
    history.push({
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toISOString(),
    });

    if (history.length > 30) {
      history = history.slice(history.length - 30);
    }
    sessionHistories.set(sessionId, history);
  },

  /**
   * Get history for a session
   */
  getHistory(sessionId = 'default') {
    return sessionHistories.get(sessionId) || [];
  },

  /**
   * Clear history and context for a session
   */
  clearHistory(sessionId = 'default') {
    sessionHistories.delete(sessionId);
    sessionContexts.delete(sessionId);
    return true;
  },
};

module.exports = chatbotService;
