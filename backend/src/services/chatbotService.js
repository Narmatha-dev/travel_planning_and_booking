const config = require('../config/environment');
const weatherService = require('./weatherService');
const geminiService = require('./geminiService');

// In-memory multi-turn session history & conversational context store
const sessionHistories = new Map();
const sessionContexts = new Map();

// Comprehensive Curated Travel Knowledge Base (Global + Indian Destinations)
const DESTINATIONS_DB = [
  {
    name: 'Goa',
    nameTa: 'கோவா',
    aliases: ['goa', 'north goa', 'south goa', 'calangute', 'baga', 'panaji', 'candolim', 'anjuna', 'கோவா'],
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
    highlights: 'Calangute & Baga beaches, Aguada Fort, Mandovi sunset river cruise, Fontainhas Latin quarter, authentic Goan seafood & water sports.',
    highlightsTa: 'கலங்குட் & பாகா கடற்கரைகள், அகுவாடா கோட்டை, மண்டோவி படகு சவாரி, பொன்டைன்ஹாஸ் லத்தீன் பகுதி, ருசியான கடல் உணவுகள்.',
    hotels: 'Taj Fort Aguada (Heritage Resort), W Goa (Luxury Beachfront), Zostel Goa (Budget / Backpackers)',
    food: 'Goan Fish Curry Meals, Prawn Balchão, Bebinca traditional dessert, Poi bread with chorizo',
    transport: 'Scooter rentals (₹350-₹500/day) or self-drive cabs are the most flexible way to commute.',
    link: '/destinations',
  },
  {
    name: 'Ooty',
    nameTa: 'ஊட்டி',
    aliases: ['ooty', 'udhagamandalam', 'nilgiris', 'coonoor', 'doddabetta', 'ஊட்டி', 'நீலகிரி', 'குன்னூர்'],
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
    highlights: 'Nilgiri Mountain Toy Train, Ooty Lake boating, Botanical Gardens, Doddabetta Peak, Pykara Waterfalls & Pine forest.',
    highlightsTa: 'நீலகிரி மலை ரயில், ஊட்டி ஏரி படகு சவாரி, தாவரவியல் பூங்கா, தொட்டபெட்டா சிகரம், பைக்காரா நீர்வீழ்ச்சி.',
    hotels: 'Savoy - IHCL SeleQtions (Heritage Luxury), Sterling Ooty Fern Hill, Zostel Ooty (Budget)',
    food: 'Ooty Varkey, Homemade Chocolates, Nilgiri Tea, South Indian Thali, Fresh Strawberry Cream',
    transport: 'Heritage Nilgiri Toy Train, private rental cabs or local TNSTC scenic hill buses.',
    link: '/destinations',
  },
  {
    name: 'Kerala',
    nameTa: 'கேரளா',
    aliases: ['kerala', 'alleppey', 'alappuzha', 'munnar', 'wayanad', 'kochi', 'cochin', 'varkala', 'kovalam', 'கேரளா', 'மூணார்', 'ஆலப்புழா', 'கொச்சி'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Backwaters & Wellness',
    categoryTa: 'உப்பங்கழிகள் & ஆயுர்வேத நல்வாழ்வு',
    bestTime: 'September to March (Cool lush tropical breezes)',
    bestTimeTa: 'செப்டம்பர் முதல் மார்ச் வரை (பசுமையான சூழல் மற்றும் இதமான காற்று)',
    bestTimeTh: 'September mudhal March varai (Lush green season)',
    dailyCostINR: '₹4,000 - ₹6,500 / day',
    dailyCostUSD: '$50 - $75 / day',
    idealDuration: '4 to 7 Days',
    highlights: 'Alleppey luxury houseboats, Munnar tea plantation trails, Fort Kochi Chinese fishing nets, Ayurvedic rejuvenation spas & Athirappilly waterfalls.',
    highlightsTa: 'ஆலப்புழா சொகுசு படகு வீடுகள், மூணார் தேயிலைத் தோட்டங்கள், கொச்சி சீன வலைகள், ஆயுர்வேத மசாஜ் மையங்கள்.',
    hotels: 'Kumarakom Lake Resort (Luxury Backwaters), Blanket Hotel Munnar, Zostel Kochi',
    food: 'Appam with Stew, Karimeen Pollichathu, Malabar Parotta with Chicken Curry, Puttu and Kadala Curry',
    transport: 'Chauffeured private cabs, scenic Kerala state KSRTC buses, and passenger ferries.',
    link: '/destinations',
  },
  {
    name: 'Taj Mahal & Agra',
    nameTa: 'தாஜ்மஹால் & ஆக்ரா',
    aliases: ['agra', 'taj mahal', 'taj', 'fatehpur sikri', 'தாஜ்மஹால்', 'ஆக்ரா'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Heritage Wonder',
    categoryTa: 'உலக அதிசய பாரம்பரியம்',
    bestTime: 'October to March (Pleasant sunshine and clear skies)',
    bestTimeTa: 'அக்டோபர் முதல் மார்ச் வரை (இதமான வெயில் மற்றும் தெளிவான வானிலை)',
    bestTimeTh: 'October mudhal March varai (Pleasant sunny season)',
    dailyCostINR: '₹3,000 - ₹5,500 / day',
    dailyCostUSD: '$40 - $70 / day',
    idealDuration: '1 to 2 Days',
    highlights: 'Taj Mahal sunrise viewing, Agra Fort red sandstone palaces, Mehtab Bagh sunset garden, Fatehpur Sikri.',
    highlightsTa: 'தாஜ்மஹால் சூரியோதய காட்சி, ஆக்ரா கோட்டை, மெஹ்தாப் பாக் சூரிய அஸ்தமனம், ஃபதேபூர் சிக்ரி.',
    hotels: 'The Oberoi Amarvilas (Direct Taj view), ITC Mughal (Luxury Resort), Zostel Agra',
    food: 'Agra Petha, Bedmi Puri with Aloo Sabzi, Mughlai Chicken Korma, Tandoori delicacies',
    transport: 'Gatimaan Express / Vande Bharat train from Delhi, local e-rickshaws and cabs.',
    link: '/destinations/1',
  },
  {
    name: 'Paris',
    nameTa: 'பாரிஸ்',
    aliases: ['paris', 'france', 'eiffel', 'louvre', 'versailles', 'seine', 'பாரிஸ்', 'பிரான்ஸ்'],
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
    highlights: 'Eiffel Tower summit, Louvre Museum Mona Lisa tour, illuminated Seine River dinner cruises, Palace of Versailles, Notre-Dame.',
    highlightsTa: 'ஈபிள் கோபுர உச்சி, லூவர் அருங்காட்சியகம் மோனாலிசா, செய்ன் நதி இரவு படகு உணவு, வெர்சாய் அரண்மனை.',
    hotels: 'Hôtel Plaza Athénée (5-Star Luxury), Grand Hôtel Saint Michel, CitizenM Paris (Chic Modern)',
    food: 'Fresh butter Croissants, French Onion Soup, Duck Confit, Escargot, Macarons from Ladurée',
    transport: 'Paris Metro & RER network (Navigo Easy card for fast connections).',
    link: '/destinations/4',
  },
  {
    name: 'Swiss Alps & Switzerland',
    nameTa: 'சுவிட்சர்லாந்து',
    aliases: ['switzerland', 'swiss', 'swiss alps', 'zurich', 'interlaken', 'zermatt', 'lucerne', 'grindelwald', 'jungfrau', 'matterhorn', 'சுவிஸ்', 'சுவிட்சர்லாந்து'],
    country: 'Switzerland',
    countryTa: 'சுவிட்சர்லாந்து',
    category: 'Alpine Wonderland',
    categoryTa: 'ஆல்ப்ஸ் பனிமலை & ஏரிகள்',
    bestTime: 'June to September (Hiking & Lakes) or Dec to March (Skiing & Snow)',
    bestTimeTa: 'ஜூன் முதல் செப்டம்பர் (மலையேற்றம்) அல்லது டிசம்பர் முதல் மார்ச் (பனிச்சறுக்கு)',
    bestTimeTh: 'June to Sept (Hiking) or Dec to March (Snow & Ski)',
    dailyCostINR: '₹16,000 - ₹25,000 / day',
    dailyCostUSD: '$190 - $300 / day',
    idealDuration: '5 to 9 Days',
    highlights: 'Matterhorn views in Zermatt, Jungfraujoch Top of Europe, Lake Oeschinensee, Glacier 3000 suspension walk, Lake Geneva cruises.',
    highlightsTa: 'மேட்டர்ஹார்ன் பனிச்சிகரம், ஜங்ஃப்ராவ்ஜோக் ஐரோப்பாவின் உச்சி, ஓசினென்சி ஏரி, பனிப்பாறை பாலம்.',
    hotels: 'The Omnia Zermatt (Alpine Luxury), Victoria-Jungfrau Interlaken, Mountain Lodge Grindelwald',
    food: 'Traditional Swiss Cheese Fondue, Raclette, Rösti with fried egg, Swiss artisanal chocolates',
    transport: 'Swiss Travel Pass (unlimited train, bus, boat, and discounts on mountain cable cars).',
    link: '/destinations/3',
  },
  {
    name: 'Bali',
    nameTa: 'பாலி',
    aliases: ['bali', 'indonesia', 'ubud', 'seminyak', 'kuta', 'canggu', 'nusa penida', 'uluwatu', 'பாலி', 'இந்தோனேசியா'],
    country: 'Indonesia',
    countryTa: 'இந்தோனேசியா',
    category: 'Tropical Paradise',
    categoryTa: 'வெப்பமண்டல தீவு & அமைதி',
    bestTime: 'April to October (Dry sunny season, gentle breezes)',
    bestTimeTa: 'ஏப்ரல் முதல் அக்டோபர் வரை (வறண்ட இதமான வெயில் காலம்)',
    bestTimeTh: 'April to October (Dry sunny season)',
    dailyCostINR: '₹4,500 - ₹7,500 / day',
    dailyCostUSD: '$55 - $90 / day',
    idealDuration: '5 to 8 Days',
    highlights: 'Ubud Tegallalang rice terraces, Uluwatu cliff temple & Kecak fire dance, Nusa Penida island beaches, Mount Batur sunrise trek.',
    highlightsTa: 'உபுட் நெல் வயல்கள், உலுவாத்து கோவில் நடனம், நுசா பெனிடா கடற்கரைகள், பதூர் மலை சூரியோதயம்.',
    hotels: 'Four Seasons Resort Bali at Sayan, Maya Ubud Resort & Spa, The Kayon Jungle Resort',
    food: 'Nasi Goreng, Mie Goreng, Babi Guling, Sate Lilit skewers, Fresh Dragon Fruit Smoothie Bowls',
    transport: 'Private chauffeur cars ($40/day) or scooter rentals ($6/day).',
    link: '/destinations/5',
  },
  {
    name: 'Tokyo & Kyoto',
    nameTa: 'டோக்கியோ & கியோட்டோ',
    aliases: ['tokyo', 'kyoto', 'japan', 'osaka', 'shibuya', 'fuji', 'shinjuku', 'டோக்கியோ', 'ஜப்பான்', 'கியோட்டோ'],
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
    highlights: 'Fushimi Inari 10,000 torii gates, Shibuya crossing, Shinkansen bullet train, Gion traditional tea ceremonies, Mount Fuji.',
    highlightsTa: 'புஷிமி இனாரி 10,000 சிவப்பு வாயில்கள், ஷிபுயா சந்திப்பு, புல்லட் ரயில் பயணம், பாரம்பரிய தேநீர் சடங்குகள்.',
    hotels: 'Park Hyatt Tokyo, Hoshinoya Kyoto (Riverside Ryokan), Hotel Gracery Shinjuku',
    food: 'Authentic Tonkotsu Ramen, Fresh Nigiri Sushi, Wagyu Beef Teppanyaki, Matcha Parfaits in Kyoto',
    transport: 'JR Pass for Bullet Trains, Suica/Pasmo IC cards for Tokyo Metro.',
    link: '/destinations/2',
  },
  {
    name: 'Dubai & UAE',
    nameTa: 'துபாய்',
    aliases: ['dubai', 'uae', 'burj khalifa', 'abu dhabi', 'sharjah', 'burj', 'துபாய்'],
    country: 'United Arab Emirates',
    countryTa: 'ஐக்கிய அரபு அமீரகம்',
    category: 'Luxury & Skyline',
    categoryTa: 'சொகுசு நகரம் & பாலைவன சாகசம்',
    bestTime: 'November to March (Pleasant 24°C - 28°C desert winter)',
    bestTimeTa: 'நவம்பர் முதல் மார்ச் வரை (இதமான குளிர் காலம்)',
    bestTimeTh: 'November mudhal March varai (Cool desert weather)',
    dailyCostINR: '₹8,000 - ₹14,000 / day',
    dailyCostUSD: '$100 - $170 / day',
    idealDuration: '4 to 6 Days',
    highlights: 'Burj Khalifa observation deck, Dubai Mall & Fountain show, Desert 4x4 dune safari with BBQ dinner, Palm Jumeirah, Dubai Marina yacht cruise.',
    highlightsTa: 'புர்ஜ் கலீஃபா உச்சி, துபாய் மால் நீரூற்று காட்சி, பாலைவன சஃபாரி, பாம் ஜுமேரா, மெரினா படகு பயணம்.',
    hotels: 'Atlantis The Palm, Burj Al Arab, Rove Downtown (Chic Budget)',
    food: 'Shawarma, Mandi Rice with Lamb, Kunafa dessert, Arabic Mezze with Hummus & Falafel',
    transport: 'Dubai Metro (clean, fast, and connected directly to Dubai Mall/Airport) and Careem/Uber cabs.',
    link: '/destinations',
  },
  {
    name: 'Manali & Himachal',
    nameTa: 'மணாலி',
    aliases: ['manali', 'kullu', 'himachal', 'solang', 'rohtang', 'shimla', 'dharamshala', 'kasol', 'spiti', 'மணாலி', 'சிம்லா'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Snow & Adventure',
    categoryTa: 'பனிமலை & சாகச பயணம்',
    bestTime: 'March to June (Pleasant summers) or Dec to Feb (Snowfall & Skiing)',
    bestTimeTa: 'மார்ச் முதல் ஜூன் (இதமான கோடை) அல்லது டிசம்பர் முதல் பிப்ரவரி (பனிப்பொழிவு)',
    bestTimeTh: 'March to June (Pleasant) or Dec to Feb (Snow & Ice)',
    dailyCostINR: '₹3,000 - ₹5,000 / day',
    dailyCostUSD: '$35 - $60 / day',
    idealDuration: '4 to 6 Days',
    highlights: 'Solang Valley paragliding & skiing, Atal Tunnel, Rohtang Pass snow point, Old Manali riverside cafes, Hadimba Temple.',
    highlightsTa: 'சோலாங் பள்ளத்தாக்கு பாராகிளைடிங், அடல் சுரங்கப்பாதை, ரோஹ்தாங் பனிச்சிகரம், பழைய மணாலி கஃபேக்கள்.',
    hotels: 'Span Resort & Spa, The Himalayan Luxury Castle, Zostel Manali',
    food: 'Himachali Siddu, Trout Fish Fry, Thukpa & Momos, Hot Masala Chai with Maggi',
    transport: 'Volvo overnight buses from Delhi/Chandigarh, private 4x4 cabs for mountain passes.',
    link: '/destinations',
  },
  {
    name: 'Kodaikanal',
    nameTa: 'கொடைக்கானல்',
    aliases: ['kodaikanal', 'kodai', 'vattakanal', 'pillar rocks', 'கொடைக்கானல்', 'கொடை'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Princess of Hill Stations',
    categoryTa: 'மலைகளின் இளவரசி & இயற்கை',
    bestTime: 'September to May (Cool misty breezes, 14°C - 20°C)',
    bestTimeTa: 'செப்டம்பர் முதல் மே வரை (குளுமையான பனிமூட்ட வானிலை)',
    bestTimeTh: 'September to May (Cool misty climate)',
    dailyCostINR: '₹2,500 - ₹4,200 / day',
    dailyCostUSD: '$30 - $50 / day',
    idealDuration: '3 to 4 Days',
    highlights: 'Kodai Lake pedal boating, Coaker’s Walk misty view, Pillar Rocks, Bryant Park, Pine Forest, Bear Shola Falls.',
    highlightsTa: 'கொடை ஏரி படகு சவாரி, கோக்கர்ஸ் வாக் பனிமூட்ட நடைபாதை, பில்லர் ராக்ஸ், பைன் காடுகள், பிரையண்ட் பூங்கா.',
    hotels: 'The Tamara Kodai (Luxury Heritage), Carlton Hotel (Lakefront), Zostel Kodaikanal',
    food: 'Fresh Homemade Dark Chocolates, Kodai Cheese, Hot Butter Corn, South Indian Thali, Herbal Tea',
    transport: 'Cabs from Madurai / Dindigul railway stations, local rental cars and walking trails.',
    link: '/destinations',
  },
  {
    name: 'London & UK',
    nameTa: 'லண்டன்',
    aliases: ['london', 'uk', 'england', 'big ben', 'thames', 'buckingham', 'லண்டன்', 'இங்கிலாந்து'],
    country: 'United Kingdom',
    countryTa: 'இங்கிலாந்து',
    category: 'Royalty & Historic Metropolis',
    categoryTa: 'பாரம்பரிய தலைநகரம் & அருங்காட்சியகங்கள்',
    bestTime: 'May to September (Warm long daylight hours, pleasant 20°C - 24°C)',
    bestTimeTa: 'மே முதல் செப்டம்பர் வரை (நீண்ட பகல் பொழுது மற்றும் இதமான வானிலை)',
    bestTimeTh: 'May to September (Warm pleasant summer)',
    dailyCostINR: '₹14,000 - ₹22,000 / day',
    dailyCostUSD: '$170 - $260 / day',
    idealDuration: '4 to 7 Days',
    highlights: 'Big Ben, London Eye flight, Tower of London & Crown Jewels, British Museum, Buckingham Palace changing of guards, West End musical.',
    highlightsTa: 'பிக் பென், லண்டன் ஐ ராட்டினம், லண்டன் கோபுரம், பிரிட்டிஷ் அருங்காட்சியகம், பக்கிங்ஹாம் அரண்மனை.',
    hotels: 'The Savoy London, CitizenM Tower of London, Premier Inn London County Hall',
    food: 'Traditional Fish and Chips with mushy peas, English Afternoon Tea with scones, Sunday Roast, Shepherd’s Pie',
    transport: 'London Underground (Tube) using contactless card / Oyster card & red double-decker buses.',
    link: '/destinations',
  },
  {
    name: 'Singapore',
    nameTa: 'சிங்கப்பூர்',
    aliases: ['singapore', 'marina bay', 'sentosa', 'changi', 'சிங்கப்பூர்'],
    country: 'Singapore',
    countryTa: 'சிங்கப்பூர்',
    category: 'Futuristic Garden City',
    categoryTa: 'எதிர்கால பூங்கா நகரம்',
    bestTime: 'November to August (Year-round pleasant tropical destination)',
    bestTimeTa: 'ஆண்டு முழுவதும் செல்ல ஏற்றது (நவம்பர் முதல் ஆகஸ்ட் வரை)',
    bestTimeTh: 'Year-round good climate (Nov to August best)',
    dailyCostINR: '₹10,000 - ₹16,000 / day',
    dailyCostUSD: '$120 - $190 / day',
    idealDuration: '3 to 5 Days',
    highlights: 'Gardens by the Bay Supertrees & Cloud Forest, Marina Bay Sands SkyPark, Sentosa Island Universal Studios, Night Safari, Jewel Changi waterfall.',
    highlightsTa: 'கார்டன்ஸ் பை தி பே சூப்பர்ட்ரீஸ், மெரினா பே சாண்ட்ஸ், சென்டோசா தீவு யுனிவர்சல் ஸ்டுடியோஸ், நைட் சஃபாரி.',
    hotels: 'Marina Bay Sands (Infinity Pool), Pan Pacific Singapore, Hotel G Singapore',
    food: 'Hainanese Chicken Rice, Chili Crab with mantou buns, Laksa, Roti Prata at Lau Pa Sat Hawker Center',
    transport: 'Singapore MRT (clean, ultra-fast and air-conditioned) & Grab cabs.',
    link: '/destinations',
  },
  {
    name: 'Maldives',
    nameTa: 'மாலத்தீவு',
    aliases: ['maldives', 'male', 'overwater villa', 'maafushi', 'மாலத்தீவு'],
    country: 'Maldives',
    countryTa: 'மாலத்தீவு',
    category: 'Luxury Island Haven',
    categoryTa: 'கடல் நீர் சொகுசு வில்லா & பவளப்பாறைகள்',
    bestTime: 'November to April (Dry season with crystal clear blue turquoise water)',
    bestTimeTa: 'நவம்பர் முதல் ஏப்ரல் வரை (தெளிவான நீலக் கடல் மற்றும் இதமான வெயில்)',
    bestTimeTh: 'November to April (Crystal blue waters & sunshine)',
    dailyCostINR: '₹18,000 - ₹35,000 / day',
    dailyCostUSD: '$220 - $450 / day',
    idealDuration: '4 to 6 Days',
    highlights: 'Overwater bungalow villa stay, snorkeling with manta rays and sea turtles, sunset dolphin cruise, private sandbank candlelight dinner.',
    highlightsTa: 'கடல் நீர் வில்லா தங்குமிடம், கடல் ஆமைகள் மற்றும் மீன்களுடன் ஸ்நோர்கெலிங், டால்பின் படகு சவாரி.',
    hotels: 'Soneva Fushi, Anantara Veli Maldives, Arena Beach Hotel Maafushi (Affordable Island)',
    food: 'Fresh Grilled Reef Fish, Mas Huni with Roshi, Garudhiya Fish Broth, Coconut Tropical Mocktails',
    transport: 'Speedboat or Seaplane transfers from Malé Velana International Airport directly to resort islands.',
    link: '/destinations',
  },
  {
    name: 'Mahabalipuram & Chennai',
    nameTa: 'மகாபலிபுரம் & சென்னை',
    aliases: ['mahabalipuram', 'mamallapuram', 'chennai', 'madras', 'ecr', 'மகாபலிபுரம்', 'சென்னை'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Coastal Heritage',
    categoryTa: 'கடற்கரை பாரம்பரியம்',
    bestTime: 'November to February (Cool coastal breeze, 22°C - 28°C)',
    bestTimeTa: 'நவம்பர் முதல் பிப்ரவரி வரை (இதமான கடற்கரை காற்று)',
    bestTimeTh: 'November to Feb (Cool coastal breeze)',
    dailyCostINR: '₹2,500 - ₹4,500 / day',
    dailyCostUSD: '$30 - $55 / day',
    idealDuration: '2 to 3 Days',
    highlights: 'Shore Temple UNESCO site, Pancha Rathas monolithic rock shrines, Marina Beach, Krishna Butter Ball, Covelong surfing beach.',
    highlightsTa: 'கடற்கரை கோவில், பஞ்ச ரதங்கள், மரினா கடற்கரை, கிருஷ்ணரின் வெண்ணெய் பந்து.',
    hotels: 'Radisson Blu Resort Temple Bay, Taj Fisherman’s Cove Resort, Grande Bay Resort',
    food: 'Fresh Tandoori Fish, Prawn Masala, Filter Coffee, Hot Mallipoo Idlis with 4 chutneys',
    transport: 'Scenic East Coast Road (ECR) drive, private taxis, and local state buses.',
    link: '/destinations',
  },
  {
    name: 'Jaipur & Rajasthan',
    nameTa: 'ஜெய்ப்பூர் & ராஜஸ்தான்',
    aliases: ['jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'pink city', 'ஜெய்ப்பூர்', 'ராஜஸ்தான்'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'Royal Palaces & Desert',
    categoryTa: 'அரண்மனைகள் & பாலைவன பண்பாடு',
    bestTime: 'October to March (Pleasant winter sunshine)',
    bestTimeTa: 'அக்டோபர் முதல் மார்ச் வரை (இதமான வெயில் காலம்)',
    bestTimeTh: 'October to March (Pleasant sunny days)',
    dailyCostINR: '₹3,000 - ₹6,000 / day',
    dailyCostUSD: '$40 - $75 / day',
    idealDuration: '3 to 5 Days',
    highlights: 'Amber Fort elephant/jeep ascent, Hawa Mahal facade, City Palace museum, Nahargarh sunset view, Jal Mahal.',
    highlightsTa: 'ஆம்பர் கோட்டை, ஹவா மஹால், சிட்டி பேலஸ், நஹர்கர் கோட்டை சூரிய அஸ்தமனம்.',
    hotels: 'Rambagh Palace (Heritage Luxury), ITC Rajputana, Zostel Jaipur',
    food: 'Dal Baati Churma, Laal Maas, Pyaaz Kachori, Ghevar traditional sweet, Masala Lassi',
    transport: 'Auto-rickshaws, app cabs (Uber/Ola), and Jaipur Metro for city sightseeing.',
    link: '/destinations',
  },
  {
    name: 'Ladakh',
    nameTa: 'லடாக்',
    aliases: ['ladakh', 'leh', 'pangong', 'nubra', 'khardung la', 'லடாக்', 'லே'],
    country: 'India',
    countryTa: 'இந்தியா',
    category: 'High-Altitude Mountain Wonder',
    categoryTa: 'உயர் பனிமலை & ஏரிகள்',
    bestTime: 'May to September (Open mountain passes, clear blue skies)',
    bestTimeTa: 'மே முதல் செப்டம்பர் வரை (தெளிவான வானிலை மற்றும் திறந்த கணவாய்கள்)',
    bestTimeTh: 'May to September (Road passes open & clear skies)',
    dailyCostINR: '₹4,500 - ₹8,000 / day',
    dailyCostUSD: '$60 - $100 / day',
    idealDuration: '6 to 9 Days',
    highlights: 'Pangong Tso color-changing blue lake, Nubra Valley double-humped camel ride, Khardung La (17,982 ft), Thiksey Monastery, Magnetic Hill.',
    highlightsTa: 'பாங்கோங் ஏரி, நுப்ரா பள்ளத்தாக்கு ஒட்டக சவாரி, கர்துங் லா கணவாய், திக்சே புத்த மடாலயம்.',
    hotels: 'The Grand Dragon Ladakh, Organic Boutique Hunder Camps, Zostel Leh',
    food: 'Tibetan Thukpa, Steamed Mutton/Veg Momos, Butter Tea (Gur Gur Chai), Skyu stew',
    transport: '4x4 SUVs with experienced local mountain drivers, Royal Enfield rentals.',
    link: '/destinations',
  },
];

// Helper: Detect query language accurately
function detectLanguage(query = '', explicitLang = null) {
  if (explicitLang === 'ta') return 'ta';

  // Check for Tamil Unicode script
  const hasTamilChars = /[\u0B80-\u0BFF]/.test(query);
  if (hasTamilChars) return 'ta';

  // Check for common phonetic Tanglish markers
  const thanglishKeywords = [
    'enna', 'epdi', 'eppadi', 'pannanum', 'panradhu', 'irukku', 'irukka',
    'sollunga', 'kaatunga', 'varuma', 'varum', 'theriyuma', 'kandippa',
    'naatkal', 'evlo', 'evvalavu', 'poga', 'suthuradhu', 'kitta', 'nalla',
    'mudiyuma', 'kudunga', 'venum', 'aagum', 'paththi', 'pathi', 'panna',
    'pesunga', 'ketkuren', 'solli', 'poiduvom', 'podhum'
  ];

  const lower = query.toLowerCase();
  const isTanglish = thanglishKeywords.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower));
  if (isTanglish) return 'thanglish';

  return 'en';
}

// Helper: Find explicit destination match or return null (NEVER default to Goa!)
function findExplicitDestination(query = '') {
  const lower = query.toLowerCase();

  for (const dest of DESTINATIONS_DB) {
    for (const alias of dest.aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lower) || lower.includes(alias.toLowerCase())) {
        return dest;
      }
    }
  }

  return null;
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper: Call Google Gemini API using official SDK & REST fallback
async function callGeminiApi(apiKey, userPrompt, history = [], language = 'en') {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('GEMINI_KEY_NOT_CONFIGURED');
  }

  const cleanKey = apiKey.trim();

  const systemInstructionText = `You are Travelora AI, an intelligent, expert, and friendly travel assistant for the Travel Planning and Booking platform.
Your expertise covers:
- Travel recommendations and destination suggestions across India and worldwide
- Day-by-day customized trip planning, sightseeing itineraries, timings, and schedules (e.g. "Plan a 3-day trip to Ooty for 2 people")
- Budget estimates and cost-saving suggestions (transport, accommodation, meals, entrance fees)
- Adjusting existing itineraries based on follow-ups (e.g. "Make it more budget friendly", "Add more adventure", "What are the best food spots?")
- Transportation options (flights, trains, buses, private cabs, self-drive rentals)
- Packing suggestions, seasonal weather advice, and local tips
- Booking guidance, 100% full refund cancellation policy (free up to 48 hours before departure), and payment methods (UPI, GPay, PhonePe, Cards, Net Banking)

Guidelines:
- Provide structured, practical, inspiring answers formatted with Markdown headers (###), bold text (**), bullet points (*), and emoji accents.
- For itineraries, organize clearly into Day 1, Day 2, Day 3 with Morning, Afternoon, Evening suggestions and estimated costs.
- Always maintain full conversation context across follow-up queries.
- Respond in the language or dialect used by the user (English, Tamil, or Tanglish).`;

  // 1. Try official @google/generative-ai SDK
  try {
    const genAI = new GoogleGenerativeAI(cleanKey);

    const formattedHistory = [];
    for (const item of history) {
      if (!item.content && !item.text) continue;
      const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
      const text = (item.content || item.text || '').trim();
      if (text) {
        formattedHistory.push({
          role,
          parts: [{ text }],
        });
      }
    }

    // Ensure valid history alternating starting with user
    if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift();
    }

    const sdkModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const modelName of sdkModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstructionText,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(userPrompt.trim());
        const response = await result.response;
        const text = response.text();
        if (text && text.trim()) {
          return {
            reply: text.trim(),
            model: modelName,
            isGemini: true,
          };
        }
      } catch (sdkModelErr) {
        // Try next model if current one is unavailable
      }
    }
  } catch (sdkErr) {
    // Fallback to direct REST API below
  }

  // 2. Direct REST API Fallback
  const contents = [];
  for (const item of history) {
    if (!item.content && !item.text) continue;
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    const text = (item.content || item.text || '').trim();
    if (text) {
      contents.push({ role, parts: [{ text }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: userPrompt.trim() }] });

  const requestBody = {
    contents,
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
  };

  const restModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const model of restModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          return { reply: candidateText.trim(), model, isGemini: true };
        }
      }
    } catch (restErr) {
      lastError = restErr;
    }
  }

  throw lastError || new Error('No response from Gemini API');
}

const chatbotService = {
  /**
   * Main AI NLP message processor
   */
  async processMessage(sessionId, rawQuery = '', context = {}) {
    const q = (rawQuery || '').trim();
    if (!q) {
      return {
        reply: "👋 Please type a travel destination or question, such as *'Plan a 3-day trip to Ooty for 2 people'* or *'Top places in Goa'*.",
        suggestions: ['Plan a 3-day trip to Ooty', 'Best places in Goa', 'Budget travel tips', 'How to book a trip?'],
        actionLinks: [{ label: 'Explore Destinations', url: '/destinations' }],
        language: 'en',
        timestamp: new Date().toISOString(),
      };
    }

    const query = q.toLowerCase();
    const lang = detectLanguage(q, context.language);
    // Delegate conversation directly to Gemini AI Engine
    try {
      const geminiResult = await geminiService.chatWithGemini(q, sessionId, existingHistory, lang);
      if (geminiResult && geminiResult.reply) {
        const reply = geminiResult.reply;
        const suggestions = geminiResult.suggestions || [
          'Make it more budget friendly',
          'What is the best time to visit?',
          'Top hotels and stays',
          'How do I book?',
        ];

        const actionLinks = [
          { label: '🧭 Open AI Trip Planner', url: '/trip-planner' },
          { label: '📦 Browse Tour Packages', url: '/packages' },
          { label: '🗺️ Explore Destinations', url: '/destinations' },
        ];

        this.recordMessage(sessionId, q, reply);

        return {
          reply,
          response: reply,
          suggestions,
          actionLinks,
          language: lang,
          model: geminiResult.executedBy || 'gemini-ai',
          isAi: true,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (geminiErr) {
      console.warn('⚠️ Gemini Chatbot execution error:', geminiErr.message);
    }

    let reply = '';
    let suggestions = [];
    let actionLinks = [];

    // Check if an explicit destination was mentioned
    const explicitDest = findExplicitDestination(query);

    // =========================================================================
    // 1. GREETING & IDENTITY INTENTS
    // =========================================================================
    if (
      query === 'hi' ||
      query === 'hello' ||
      query === 'hey' ||
      query.startsWith('hi ') ||
      query.startsWith('hello ') ||
      query.includes('வணக்கம்') ||
      query.includes('vanakkam') ||
      query.includes('who are you') ||
      query.includes('what can you do') ||
      query.includes('how are you')
    ) {
      if (lang === 'ta') {
        reply = `### 👋 வணக்கம்! நான் உங்கள் Travelora AI பயண உதவியாளர்.\n\n` +
          `நான் உங்களுக்கு பின்வரும் அனைத்து பயண தேவைகளிலும் உதவ முடியும்:\n\n` +
          `* 🌍 **சுற்றுலா வழிகாட்டி:** உலகளாவிய சுற்றுலா இடங்கள், செல்ல சிறந்த பருவம், பார்க்க வேண்டிய இடங்கள் & பட்ஜெட்.\n` +
          `* 📅 **AI ஸ்மார்ட் பயணத் திட்டம்:** 1 முதல் 14 நாட்கள் வரை நாள் வாரியான தனிப்பயன் பயண திட்டம்.\n` +
          `* 💳 **முன்பதிவு & கட்டணம்:** UPI (Google Pay, PhonePe, Paytm, QR Code), கார்டுகள் & உடனடி போர்டிங் பாஸ்.\n` +
          `* 🔄 **ரத்து & ரீஃபண்ட்:** 48 மணி நேர இலவச ரத்து மற்றும் 100% முழு பணத்தை திரும்பப் பெறும் வழிமுறைகள்.\n` +
          `* 🏨 **தங்குமிடங்கள் & போக்குவரத்து:** சிறந்த ரிசார்ட்டுகள், வாடகை வாகனங்கள் & வழித்தடங்கள்.\n\n` +
          `நீங்கள் எங்கு செல்ல திட்டமிடுகிறீர்கள் அல்லது உங்களுக்கு என்ன உதவி தேவை?`;

        suggestions = ['முன்பதிவு செய்வது எப்படி?', 'UPI கட்டண முறை', 'ரத்து செய்யும் கொள்கை', 'ஊட்டி 3 நாள் திட்டம்'];
      } else if (lang === 'thanglish') {
        reply = `### 👋 Vanakkam! Naan unga Travelora AI Travel Assistant.\n\n` +
          `Unga travel and booking sambandhapatta ella kelvigalukkum naan instant-ah answer pannuven:\n\n` +
          `* 🌍 **Destinations Guide:** Top tourist places, poga best time, budget, stays & local food.\n` +
          `* 📅 **AI Trip Planner:** 1 to 14 days day-by-day customized smart itinerary.\n` +
          `* 💳 **Easy Booking & Payments:** UPI (Google Pay, PhonePe, Paytm, QR Code), Cards & instant ticket receipt.\n` +
          `* 🔄 **Cancellation & 100% Refund:** 48 hours free cancellation rules.\n` +
          `* 🏨 **Hotels & Transport:** Best resorts, cab / scooter rentals & routes.\n\n` +
          `Neenga entha idathukku travel panna plan panreenga?`;

        suggestions = ['Trip book panna help pannu', 'UPI payment epdi panradhu?', 'Goa poga best time enna?', 'View tour packages'];
      } else {
        reply = `### 👋 Hello! I am your Travelora AI Travel & Booking Assistant.\n\n` +
          `I am trained to answer all your questions regarding travel, destinations, and bookings:\n\n` +
          `* 🌍 **Worldwide Destinations:** Handpicked attractions, optimal travel seasons, budgets, and local dining.\n` +
          `* 📅 **AI Smart Itineraries:** Automated day-by-day travel plans for 1 to 14 days.\n` +
          `* 💳 **Booking & Payment:** Instant UPI checkout (Google Pay, PhonePe, Paytm, Live QR), cards, and digital receipts.\n` +
          `* 🔄 **Cancellations & Refunds:** 48-hour free cancellation policy and instant refund tracking.\n` +
          `* 🏨 **Hotels & Transport:** Verified accommodations, transfers, and route calculations.\n\n` +
          `Where are you planning to travel next, or how can I assist your booking?`;

        suggestions = ['How do I book a trip?', 'How to pay with UPI?', 'Cancellation & Refund policy', 'Suggest best places to visit'];
      }

      actionLinks.push({ label: '🌍 Explore Destinations', url: '/destinations' });
      actionLinks.push({ label: '🗺️ AI Trip Planner', url: '/trip-planner' });
      actionLinks.push({ label: '📦 Tour Packages', url: '/packages' });
    }

    // =========================================================================
    // 2. BOOKING HOW-TO & STEP-BY-STEP HELP
    // =========================================================================
    else if (
      query.includes('how to book') ||
      query.includes('book a trip') ||
      query.includes('booking process') ||
      query.includes('help me book') ||
      query.includes('how do i book') ||
      query.includes('where to book') ||
      query.includes('how can i book') ||
      query.includes('book panradhu epdi') ||
      query.includes('book panna help') ||
      query.includes('booking epdi') ||
      query.includes('முன்பதிவு செய்வது எப்படி') ||
      query.includes('முன்பதிவு செய்ய')
    ) {
      if (lang === 'ta') {
        reply = `### 🎫 Travelora-ல் பயணத்தை முன்பதிவு செய்யும் 5 எளிய வழிகள்:\n\n` +
          `1. **சுற்றுலா இடத்தை தேர்வு செய்யவும்:** [Destinations](/destinations) அல்லது [Tour Packages](/packages) பக்கத்திற்குச் சென்று நீங்கள் விரும்பும் இடத்தை தேர்ந்தெடுக்கவும்.\n` +
          `2. **பயண தேதி & நபர்கள்:** உங்கள் புறப்படும் தேதி மற்றும் பயணிகளின் எண்ணிக்கையை தேர்ந்தெடுக்கவும்.\n` +
          `3. **மதிப்பாய்வு செய்யவும்:** தங்குமிடம் (Hotel) மற்றும் போக்குவரத்து (Transport) தேர்வுகளை சரிபார்க்கவும்.\n` +
          `4. **உடனடி கட்டணம்:** UPI (Google Pay, PhonePe, Paytm, QR Code) அல்லது கார்டுகள் மூலம் பணம் செலுத்துங்கள்.\n` +
          `5. **உடனடி போர்டிங் பாஸ் & ரசீது:** கட்டணம் முடிந்தவுடன் உங்களது உறுதிப்படுத்தப்பட்ட பயண வவுச்சரை பதிவிறக்கலாம்.\n\n` +
          `💡 *நீங்கள் முன்பதிவு செய்த பயணங்களை எப்போது வேண்டுமானாலும் **My Trips** பக்கத்தில் பார்க்கலாம்.*`;

        suggestions = ['பேக்கேஜ்களை காட்டு', 'UPI கட்டண முறை', 'ரத்து செய்யும் கொள்கை'];
      } else if (lang === 'thanglish') {
        reply = `### 🎫 Travelora-la Trip Book Panradhu Romba Simple (5 Steps):\n\n` +
          `1. **Destination Choose Pannunga:** [Destinations](/destinations) or [Packages](/packages) page poi ungalukku pidicha edatha select pannunga.\n` +
          `2. **Travel Date & Guests:** Unga travel date matrum travelers count select pannunga.\n` +
          `3. **Review Itinerary & Stays:** Hotel stay and transport options check pannitu Proceed click pannunga.\n` +
          `4. **Instant Secure Payment:** Google Pay, PhonePe, Paytm, UPI QR Code or Cards moolam seconds-la pay pannalam.\n` +
          `5. **Digital Boarding Pass:** Payment mudinjadhum booking confirmed aagi digital receipt generate aagidum.\n\n` +
          `💡 *Book panna ella trips-aiyum **My Trips** hub-la eppo venaalum track pannikalam.*`;

        suggestions = ['Browse packages', 'UPI payment methods', 'Cancellation rules'];
      } else {
        reply = `### 🎫 How to Book Your Journey on Travelora:\n\n` +
          `1. **Select a Destination or Package:** Browse our curated [Destinations](/destinations) or [Tour Packages](/packages).\n` +
          `2. **Configure Dates & Travelers:** Pick your departure date and guest count.\n` +
          `3. **Review Itinerary & Stays:** Check your selected hotel, transport, and day-wise schedule.\n` +
          `4. **Instant Real-Time Checkout:** Pay securely via **UPI (Google Pay, PhonePe, Paytm, Live QR)**, Cards, or Net Banking.\n` +
          `5. **Instant Boarding Pass & Receipt:** Immediately view and download your confirmed booking receipt.\n\n` +
          `💡 *You can manage and view all confirmed bookings in your **My Trips** hub at any time.*`;

        suggestions = ['Browse Destinations', 'Explore Packages', 'What payment methods are supported?', 'Cancellation & Refund Policy'];
      }

      actionLinks.push({ label: '🌍 Explore Destinations', url: '/destinations' });
      actionLinks.push({ label: '📦 Browse Packages', url: '/packages' });
      actionLinks.push({ label: '✈️ My Trips Hub', url: '/my-trips?tab=upcoming' });
    }

    // =========================================================================
    // 3. PAYMENT, UPI, GPAY, PHONEPE, PAYTM & QR CODE INTENTS
    // =========================================================================
    else if (
      query.includes('payment') ||
      query.includes('upi') ||
      query.includes('gpay') ||
      query.includes('google pay') ||
      query.includes('phonepe') ||
      query.includes('paytm') ||
      query.includes('qr code') ||
      query.includes('qr') ||
      query.includes('credit card') ||
      query.includes('debit card') ||
      query.includes('netbanking') ||
      query.includes('wallet') ||
      query.includes('கட்டணம்') ||
      query.includes('பணம் செலுத்த') ||
      query.includes('pay panna') ||
      query.includes('payment epdi')
    ) {
      if (lang === 'ta') {
        reply = `### 💳 Travelora பாதுகாப்பான நேரலை கட்டண முறைகள் (Payment Modes):\n\n` +
          `* ⚡ **UPI 2.0 Real-Time:**\n` +
          `  * **Google Pay / PhonePe / Paytm / BHIM:** உங்கள் UPI ஐடியை உள்ளிட்டு உடனடி 1-கிளிக் சரிபார்ப்புடன் பணம் செலுத்தலாம்.\n` +
          `  * **நேரலை டைனமிக் QR கோடு:** திரையில் தோன்றும் QR குறியீட்டை ஏதேனும் ஒரு UPI ஆப் மூலம் ஸ்கேன் செய்து உடனடியாக செலுத்தலாம்.\n` +
          `* 💳 **கிரெடிட் & டெபிட் கார்டுகள்:** Visa, Mastercard, RuPay & American Express.\n` +
          `* 🏦 **நெட் பேங்கிங்:** HDFC, ICICI, SBI, Axis உள்ளிட்ட 50+ முன்னணி வங்கிகள்.\n` +
          `* 🔒 **வங்கி தர பாதுகாப்பு:** 256-bit SSL என்க்ரிப்ஷன் மற்றும் NPCI UPI 2.0 சான்றிதழ்.\n\n` +
          `கட்டணம் செலுத்திய உடன் உறுதிப்படுத்தப்பட்ட டிஜிட்டல் ரசீது & போர்டிங் பாஸ் உடனடியாக வழங்கப்படும்.`;

        suggestions = ['ரத்து செய்தால் பணம் திரும்ப வருமா?', 'முன்பதிவு செய்வது எப்படி?', 'பயண பேக்கேஜ்களை காட்டு'];
      } else if (lang === 'thanglish') {
        reply = `### 💳 Travelora Secure Real-Time Payment Methods:\n\n` +
          `* ⚡ **Real-Time UPI Suite:**\n` +
          `  * **Google Pay / PhonePe / Paytm / BHIM:** Unga UPI ID kuduthu direct-ah verify panni pay pannalam.\n` +
          `  * **Live Dynamic QR Code:** Screen-la irukura dynamic QR code-ai entha UPI app vechum scan panni seconds-la pay pannalam.\n` +
          `* 💳 **Credit & Debit Cards:** Visa, Mastercard, RuPay & Amex supported.\n` +
          `* 🏦 **Net Banking:** HDFC, ICICI, SBI, Axis matrum ella major banks.\n` +
          `* 🔒 **Bank-Grade Security:** 256-bit SSL encryption & NPCI UPI 2.0 certified.\n\n` +
          `Payment complete aanadhum instant-ah booking confirmed aagi digital receipt generate aagidum.`;

        suggestions = ['Refund policy epdi?', 'How to book a trip?', 'View tour packages'];
      } else {
        reply = `### 💳 Real-Time Secure Payment Methods on Travelora:\n\n` +
          `* ⚡ **Instant UPI 2.0 Payments:**\n` +
          `  * **Google Pay, PhonePe, Paytm, BHIM:** Enter your VPA/UPI ID for instant 1-click verification.\n` +
          `  * **Dynamic Live QR Code:** Scan the live expiring QR code directly with any UPI application on your mobile.\n` +
          `* 💳 **Credit & Debit Cards:** Full support for Visa, Mastercard, RuPay, and American Express.\n` +
          `* 🏦 **Net Banking:** 50+ partner banks with direct secure gateway handoff.\n` +
          `* 👛 **Digital Wallets:** Amazon Pay, Paytm Wallet, Mobikwik, and PhonePe Wallet.\n` +
          `* 🔒 **Security Guarantee:** 256-bit bank-grade TLS encryption and NPCI UPI 2.0 certified protocols.\n\n` +
          `Every transaction issues an instant timestamped digital boarding pass and tax invoice.`;

        suggestions = ['What is the cancellation and refund policy?', 'How do I book a trip?', 'Where is my digital receipt?'];
      }

      actionLinks.push({ label: 'Proceed to Booking & Payment', url: '/booking' });
      actionLinks.push({ label: 'Browse Packages', url: '/packages' });
    }

    // =========================================================================
    // 4. CANCELLATION, REFUND & MODIFICATION INTENTS
    // =========================================================================
    else if (
      query.includes('cancel') ||
      query.includes('refund') ||
      query.includes('cancellation policy') ||
      query.includes('money back') ||
      query.includes('reschedule') ||
      query.includes('ரத்து') ||
      query.includes('பணம் திரும்ப') ||
      query.includes('refund varuma') ||
      query.includes('cancel panna')
    ) {
      if (lang === 'ta') {
        reply = `### 🔄 Travelora ரத்து மற்றும் பணத்தைத் திரும்பப் பெறுதல் கொள்கை (Cancellation & Refund Policy):\n\n` +
          `* ⏱️ **இலவச ரத்து (Free Cancellation):** பயண தொடக்க தேதிக்கு 48 மணி நேரத்திற்கு முன் ரத்து செய்தால் **100% முழு பணமும் திரும்ப வழங்கப்படும்**.\n` +
          `* 💳 **பணம் திரும்பப் பெறும் காலம் (Refund Timeline):** ரத்து செய்யப்பட்ட 3 முதல் 5 வேலை நாட்களுக்குள் பணம் நீங்கள் செலுத்திய அதே வங்கி/UPI கணக்கில் நேரடியாக வரவு வைக்கப்படும்.\n` +
          `* ✏️ **பயண தேதி மாற்றம்:** உங்கள் பயண தேதியை கூடுதல் கட்டணமின்றி **My Trips** பக்கத்தில் மாற்றியமைக்கலாம்.\n` +
          `* 📱 **ரத்து செய்யும் முறை:** [My Trips](/my-trips?tab=upcoming) பக்கத்திற்குச் சென்று, உங்கள் பயணத்தைத் தேர்ந்தெடுத்து "Cancel Booking" என்பதை அழுத்தவும்.`;

        suggestions = ['எனது பயணங்கள் பக்கத்திற்குச் செல்', 'கட்டண முறைகள்', 'முன்பதிவு செய்வது எப்படி?'];
      } else if (lang === 'thanglish') {
        reply = `### 🔄 Cancellation & 100% Refund Policy:\n\n` +
          `* ⏱️ **Free Cancellation:** Trip start aaguradhukku 48 hours munnadi cancel panna **100% full refund** kedaikkum.\n` +
          `* 💳 **Refund Speed:** Cancel panna 3 to 5 business days-kulla unga source bank/UPI account-kku amount direct-ah credit aagidum.\n` +
          `* ✏️ **Date Rescheduling:** Travel dates-ai **My Trips** page-la easily modify pannikalam.\n` +
          `* 📱 **How to Cancel:** [My Trips](/my-trips?tab=upcoming) page poi unga booking kitta "Cancel Booking" click panna podhum.`;

        suggestions = ['Open My Trips', 'Payment methods', 'How to book?'];
      } else {
        reply = `### 🔄 Transparent Cancellation & Full Refund Policy:\n\n` +
          `* ⏱️ **Free Cancellation Window:** Cancel up to **48 hours prior** to your scheduled travel departure for a **100% full refund** with zero penalty.\n` +
          `* 💳 **Refund Processing:** Approved refunds are initiated immediately and reflected in your original payment account (UPI/Bank/Card) within **3–5 business days**.\n` +
          `* ✏️ **Trip Rescheduling:** Modify guest counts or shift dates without cancellation penalties via the booking manager.\n` +
          `* 📱 **How to Manage:** Go to **[My Trips](/my-trips?tab=upcoming) → Select Booking → Cancel / Modify Booking**.`;

        suggestions = ['Go to My Trips', 'How to book a trip?', 'What payment options are available?'];
      }

      actionLinks.push({ label: '✈️ Go to My Trips', url: '/my-trips?tab=upcoming' });
      actionLinks.push({ label: '📦 Browse Packages', url: '/packages' });
    }

    // =========================================================================
    // 5. GENERAL DESTINATION RECOMMENDATIONS / SUGGESTIONS
    // =========================================================================
    else if (
      !explicitDest &&
      (query.includes('suggest') ||
        query.includes('recommend') ||
        query.includes('where to go') ||
        query.includes('where should i go') ||
        query.includes('best place') ||
        query.includes('best destination') ||
        query.includes('top place') ||
        query.includes('top destination') ||
        query.includes('near me') ||
        query.includes('honeymoon') ||
        query.includes('beach') ||
        query.includes('hill station') ||
        query.includes('weekend') ||
        query.includes('எங்கு செல்லலாம்') ||
        query.includes('பரிந்துரை') ||
        query.includes('enga polam') ||
        query.includes('nalla place') ||
        query.includes('places sollunga'))
    ) {
      if (lang === 'ta') {
        reply = `### 🌟 சிறந்த சுற்றுலா இடங்களின் பரிந்துரைகள் (Top Travel Recommendations):\n\n` +
          `* 🏖️ **கடற்கரை & பொழுதுபோக்கு:** **கோவா (Goa)** மற்றும் **பாலி (Bali)** — சூரிய அஸ்தமனம், நீர் விளையாட்டுகள் & அமைதியான கடற்கரைகள்.\n` +
          `* 🏔️ **மலை வாசஸ்தலங்கள்:** **ஊட்டி (Ooty)**, **கொடைக்கானல் (Kodaikanal)** மற்றும் **மணாலி (Manali)** — குளுமையான பனிமூட்டம் & பசுமையான இயற்கை.\n` +
          `* 👑 **சர்வதேச சொகுசு & அதிசயங்கள்:** **சுவிட்சர்லாந்து (Swiss Alps)**, **பாரிஸ் (Paris)** மற்றும் **துபாய் (Dubai)**.\n` +
          `* 🏛️ **கலாச்சாரம் & பாரம்பரியம்:** **தாஜ்மஹால் (Agra)**, **மகாபலிபுரம் (Mahabalipuram)** மற்றும் **ஜெய்ப்பூர் (Jaipur)**.\n\n` +
          `நீங்கள் இவற்றில் எந்த இடத்தைப் பற்றி மேலும் அறிய விரும்புகிறீர்கள்?`;

        suggestions = ['ஊட்டி பற்றி சொல்', 'கோவா செல்ல சிறந்த நேரம்', 'சுவிட்சர்லாந்து பயண திட்டம்', 'பாலி பேக்கேஜ்'];
      } else if (lang === 'thanglish') {
        reply = `### 🌟 Top Recommended Travel Destinations:\n\n` +
          `* 🏖️ **Beaches & Fun:** **Goa** matrum **Bali** — Water sports, beach shacks, island tours & party vibes.\n` +
          `* 🏔️ **Hill Stations & Misty Nature:** **Ooty**, **Kodaikanal** matrum **Manali** — Cool weather, toy train & waterfalls.\n` +
          `* 👑 **International Wonder Trips:** **Switzerland (Swiss Alps)**, **Paris** matrum **Dubai**.\n` +
          `* 🏛️ **Heritage & Culture:** **Taj Mahal (Agra)**, **Jaipur** matrum **Mahabalipuram**.\n\n` +
          `Idhula ungalukku entha place pathi details venum?`;

        suggestions = ['Tell me about Ooty', 'Best time for Goa', 'Plan Swiss Alps trip', 'Bali tour packages'];
      } else {
        reply = `### 🌟 Handpicked Top Destinations for Your Next Escape:\n\n` +
          `* 🏖️ **Beach & Coastal:** **Goa** & **Bali** — Vibrant shores, scuba diving, beach clubs, and serene island sunsets.\n` +
          `* 🏔️ **Hill Stations & Nature:** **Ooty**, **Kodaikanal**, and **Manali** — Crisp mountain air, waterfalls, and tea estate trails.\n` +
          `* 👑 **Iconic International Escapes:** **Swiss Alps (Switzerland)**, **Paris (France)**, and **Dubai (UAE)**.\n` +
          `* 🏛️ **Heritage & Wonders:** **Taj Mahal (Agra)**, **Jaipur (Pink City)**, and **Mahabalipuram**.\n\n` +
          `Which destination would you like to explore or plan an itinerary for?`;

        suggestions = ['Tell me about Switzerland', 'Best time to visit Goa', 'Plan a 3-day trip to Ooty', 'Browse all packages'];
      }

      actionLinks.push({ label: '🌍 Explore Destinations', url: '/destinations' });
      actionLinks.push({ label: '🗺️ AI Trip Planner', url: '/trip-planner' });
      actionLinks.push({ label: '📦 Browse Packages', url: '/packages' });
    }

    // =========================================================================
    // 6. AI TRIP PLANNER & ITINERARY CREATOR INTENTS
    // =========================================================================
    else if (
      !explicitDest &&
      (query.includes('trip planner') ||
        query.includes('plan a trip') ||
        query.includes('ai planner') ||
        query.includes('itinerary') ||
        query.includes('day plan') ||
        query.includes('generate plan') ||
        query.includes('பயண திட்டம்') ||
        query.includes('திட்டமிடல்') ||
        query.includes('trip plan panna') ||
        query.includes('itinerary epdi'))
    ) {
      if (lang === 'ta') {
        reply = `### 🗺️ AI ஸ்மார்ட் பயணத் திட்டமிடுபவர் (Smart AI Trip Planner):\n\n` +
          `Travelora-ன் AI Trip Planner மூலம் உலகத்தில் உள்ள எந்த இடத்திற்கும் 1 முதல் 14 நாட்கள் வரை நொடிகளில் தனிப்பயன் பயணத் திட்டத்தை உருவாக்கலாம்:\n\n` +
          `1. **சுற்றுலா இடம் & நாட்கள்:** செல்ல விரும்பும் இடம் மற்றும் நாட்களைத் தேர்ந்தெடுக்கவும்.\n` +
          `2. **பட்ஜெட் & விருப்பங்கள்:** ₹ அல்லது $ பட்ஜெட், இயற்கை/சாகசம்/குடும்பம் போன்ற பயண பாணியைத் தேர்ந்தெடுக்கவும்.\n` +
          `3. **வானிலை சார்ந்த AI திட்டம்:** நேரலை வானிலை, நேர வாரியான இடங்கள், சிறந்த உணவகங்கள் மற்றும் போக்குவரத்து வழிகள்.\n` +
          `4. **1-கிளிக் முன்பதிவு:** தயாரான பயணத் திட்டத்தை ஒரே கிளிக்கில் முன்பதிவு செய்யலாம்.\n\n` +
          `இப்போதே பயணத் திட்டத்தை உருவாக்க [AI Trip Planner](/trip-planner) பக்கத்திற்குச் செல்லவும்!`;

        suggestions = ['ஊட்டிக்கு 3 நாள் திட்டம் போடு', 'கோவா பயண திட்டம்', 'சுவிஸ் பயண திட்டம்'];
      } else if (lang === 'thanglish') {
        reply = `### 🗺️ AI Smart Trip Planner Guide:\n\n` +
          `Travelora AI Planner vechu entha destination-kkum 1 to 14 days custom smart itinerary ready pannalam:\n\n` +
          `1. **Destination & Duration:** Place select pannitu days slider set pannunga.\n` +
          `2. **Budget & Preferences:** Unga budget (INR / USD) matrum travel style (Nature, Adventure, Beach) choose pannunga.\n` +
          `3. **Weather-Aware Plan:** Live weather forecast, slot-wise sights, best dining spots & transit automate aagum.\n` +
          `4. **1-Click Booking:** Generate aana itinerary-ai direct-ah payment & booking-kku proceed pannalam.\n\n` +
          `Start panna [AI Trip Planner](/trip-planner) page open pannunga!`;

        suggestions = ['Plan 3-day Ooty trip', 'Goa itinerary plan', 'Swiss Alps 7-day plan'];
      } else {
        reply = `### 🗺️ Next-Gen AI Trip Planner:\n\n` +
          `Travelora's AI Trip Planner generates tailored, optimized day-by-day itineraries for hundreds of destinations:\n\n` +
          `1. **Destination & Duration:** Select any destination and adjust duration from 1 to 14 days.\n` +
          `2. **Budget & Preferences:** Configure budget limits in INR (₹) or USD ($) and select travel style.\n` +
          `3. **Weather & Route Intelligence:** Adapts schedule automatically based on live weather and scenic timing.\n` +
          `4. **Direct Booking Handoff:** Seamlessly carry your configured transport, stay, and activities into instant checkout.\n\n` +
          `Launch the [AI Trip Planner](/trip-planner) to generate your custom travel itinerary now!`;

        suggestions = ['Plan a 3-day trip to Ooty', 'Plan a 5-day trip to Switzerland', 'Browse Tour Packages'];
      }

      actionLinks.push({ label: '🗺️ Launch AI Trip Planner', url: '/trip-planner' });
      actionLinks.push({ label: '📦 Browse Packages', url: '/packages' });
    }

    // =========================================================================
    // 7. TOUR PACKAGES & VACATION OFFERS INTENTS
    // =========================================================================
    else if (
      !explicitDest &&
      (query.includes('package') ||
        query.includes('packages') ||
        query.includes('tour package') ||
        query.includes('vacation offer') ||
        query.includes('all inclusive') ||
        query.includes('பேக்கேஜ்') ||
        query.includes('சுற்றுலா தொகுப்பு') ||
        query.includes('package irukka'))
    ) {
      if (lang === 'ta') {
        reply = `### 📦 Travelora கைதேர்ந்த பயண பேக்கேஜ்கள் (Curated Tour Packages):\n\n` +
          `* 🏖️ **பாலி வெப்பமண்டல அமைதி பயணம் (Bali Bliss):** 7 நாட்கள் / 6 இரவுகள் • $1,099 (₹93,415) — உபுட் நெல் வயல்கள், உலுவாத்து கோவில், கடற்கரை ரிசார்ட்.\n` +
          `* 🏔️ **சுவிஸ் ஆல்ப்ஸ் மாபெரும் பயணம் (Swiss Alps Explorer):** 8 நாட்கள் / 7 இரவுகள் • $3,199 (₹2,71,915) — சுவிஸ் ரயில் பாஸ், ஜங்ஃப்ராவ்ஜோக் உச்சி, செர்மாட் சொகுசு தங்குமிடம்.\n` +
          `* 🏛️ **தாஜ்மஹால் & ஆக்ரா பாரம்பரிய உலா:** 3 நாட்கள் / 2 இரவுகள் • $399 (₹33,915) — விஐபி வழிகாட்டி, 5-நட்சத்திர தங்குமிடம், உணவு.\n\n` +
          `அனைத்து பேக்கேஜ்களிலும் சொகுசு தங்குமிடம், தினசரி காலை உணவு, உள்ளூர் போக்குவரத்து மற்றும் வழிகாட்டிகள் அடங்கும்.`;

        suggestions = ['அனைத்து பேக்கேஜ்களையும் பார்', 'முன்பதிவு செய்வது எப்படி?', 'பயண திட்டம் உருவாக்கு'];
      } else if (lang === 'thanglish') {
        reply = `### 📦 Handpicked Travel Packages on Travelora:\n\n` +
          `* 🏖️ **Bali Tropical Bliss:** 7 Days / 6 Nights • $1,099 (₹93,415) — 4-star resort stay, Ubud tours, airport cab transfers, breakfast included.\n` +
          `* 🏔️ **Swiss Alps Grand Tour:** 8 Days / 7 Nights • $3,199 (₹2,71,915) — Swiss Travel Pass, Jungfraujoch Top of Europe train, Zermatt alpine chalet.\n` +
          `* 🏛️ **Taj Mahal & Golden Triangle:** 3 Days / 2 Nights • $399 (₹33,915) — 5-star hotel, chauffeur cab, sightseeing vouchers.\n\n` +
          `Ella packages-layum accommodation, breakfast, sightseeing tickets & verified guides included.`;

        suggestions = ['View all packages', 'How to book?', 'Plan AI trip'];
      } else {
        reply = `### 📦 Handpicked All-Inclusive Tour Packages:\n\n` +
          `* 🏖️ **Bali Tropical Bliss & Yoga Retreat:** 7 Days / 6 Nights • **$1,099 (₹93,415)**\n` +
          `  * *Inclusions:* 4-star boutique resort, Ubud rice terraces, Uluwatu sunset temple tour, daily breakfast, airport transfers.\n` +
          `* 🏔️ **Swiss Alps Grand Explorer:** 8 Days / 7 Nights • **$3,199 (₹2,71,915)**\n` +
          `  * *Inclusions:* Zermatt luxury chalet, Swiss Travel Pass, Jungfraujoch Top of Europe rail excursion, daily breakfast.\n` +
          `* 🏛️ **Royal Agra & Taj Heritage Tour:** 3 Days / 2 Nights • **$399 (₹33,915)**\n` +
          `  * *Inclusions:* 5-star luxury stay with Taj view, sunrise guided access, chauffeur transport.\n\n` +
          `All packages feature free cancellation up to 48 hours prior to departure.`;

        suggestions = ['Browse All Packages', 'How do I book a package?', 'Customize with AI Planner'];
      }

      actionLinks.push({ label: '📦 Browse All Packages', url: '/packages' });
      actionLinks.push({ label: '🗺️ Customize with AI Planner', url: '/trip-planner' });
    }

    // =========================================================================
    // 8. SPECIFIC DESTINATION MATCHED OR CONVERSATIONAL FOLLOW-UP
    // =========================================================================
    const activeDest = explicitDest || sessionContexts.get(sessionId)?.activeDest;

    if (activeDest) {
      const matchedDest = activeDest;
      // Save active destination in session context for multi-turn follow-ups
      sessionContexts.set(sessionId, { activeDest: matchedDest });

      // Sub-Intent A: Multi-Day Trip Planning / Itinerary Creation
      if (
        query.includes('plan') ||
        query.includes('itinerary') ||
        query.includes('day trip') ||
        query.includes('days trip') ||
        query.includes('schedule') ||
        query.includes('திட்டம்') ||
        query.includes('plan pannu') ||
        query.includes('3-day') ||
        query.includes('3 day') ||
        query.includes('2 day') ||
        query.includes('4 day') ||
        query.includes('5 day')
      ) {
        if (lang === 'ta') {
          reply = `### 📅 ${matchedDest.nameTa || matchedDest.name} - 3 நாள் முழுமையான AI பயணத் திட்டம்:\n\n` +
            `#### 🌄 நாள் 1: வருகை, இயற்கை அழகு & உள்ளூர் இடங்கள்\n` +
            `* **காலை (09:00 AM - 12:30 PM):** ${matchedDest.nameTa || matchedDest.name} வந்தடைதல், தங்குமிடத்தில் ஓய்வெடுத்து முதல் முக்கிய சுற்றுலா இடத்திற்கு செல்லுதல்.\n` +
            `* **மதியம் (01:30 PM - 04:30 PM):** பாரம்பரிய மதிய உணவு & அழகிய படகு சவாரி/இயற்கை பூங்காக்கள்.\n` +
            `* **மாலை (05:30 PM - 08:00 PM):** உள்ளூர் சந்தை உலா, கைவினை பொருட்கள் & பிரத்யேக தின்பண்டங்கள்.\n\n` +
            `#### 🌲 நாள் 2: இயற்கை அதிசயங்கள் & சாகச அனுபவங்கள்\n` +
            `* **காலை (08:30 AM - 12:00 PM):** சிகரங்கள், பசுமை பள்ளத்தாக்குகள் & மலை காட்சி முனைகள்.\n` +
            `* **மதியம் (01:00 PM - 04:30 PM):** நீர்வீழ்ச்சிகள், தேயிலை/காபி தோட்டங்கள் மற்றும் படகு சவாரி.\n` +
            `* **மாலை (05:30 PM - 07:30 PM):** சூரிய அஸ்தமன காட்சி முனை & சுவையான இரவு உணவு.\n\n` +
            `#### 🚂 நாள் 3: பாரம்பரிய பயணம் & புறப்பாடு\n` +
            `* **காலை (09:00 AM - 01:00 PM):** பாரம்பரிய ரயில்/சுற்றுலா தலங்கள் & நினைவு பரிசு வாங்குதல்.\n` +
            `* **மதியம் (02:00 PM onwards):** இனிமையான நினைவுகளுடன் சொந்த ஊர் திரும்புதல்.\n\n` +
            `* 💰 **2 பேருக்கான மதிப்பிடப்பட்ட பட்ஜெட்:** **${matchedDest.dailyCostINR}** (நாள் ஒன்றுக்கு).`;

          suggestions = ['பட்ஜெட்டை மேலும் குறைக்க வழி', `${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, `${matchedDest.nameTa || matchedDest.name} செல்ல சிறந்த போக்குவரத்து`];
        } else {
          reply = `### 📅 3-Day Custom AI Itinerary for ${matchedDest.name} (2 People):\n\n` +
            `#### 🌄 Day 1: Arrival, Town Highlights & Scenic Relaxation\n` +
            `* **Morning (09:00 AM - 12:30 PM):** Arrive in ${matchedDest.name}, check into your accommodation, and explore central iconic landmarks.\n` +
            `* **Afternoon (01:30 PM - 04:30 PM):** Enjoy local dining followed by scenic boating, botanical nature trails, and photography points.\n` +
            `* **Evening (05:30 PM - 08:00 PM):** Stroll through local heritage markets, sample fresh local specialties (${matchedDest.food.split(',')[0] || 'local cuisine'}), and relaxed dinner.\n\n` +
            `#### 🌲 Day 2: Panoramic Peaks, Waterfalls & Tea/Nature Trails\n` +
            `* **Morning (08:30 AM - 12:00 PM):** Early morning excursion to highest panoramic viewpoints and nature reserves.\n` +
            `* **Afternoon (01:00 PM - 04:30 PM):** Visit picturesque waterfalls, lush plantation gardens, and peaceful forest viewpoints.\n` +
            `* **Evening (05:30 PM - 07:30 PM):** Sunset viewpoint followed by authentic dinner.\n\n` +
            `#### 🚂 Day 3: Heritage Excursions & Departure\n` +
            `* **Morning (09:00 AM - 01:00 PM):** Heritage train ride / cultural monuments exploration and souvenir shopping.\n` +
            `* **Afternoon (02:00 PM onwards):** Check-out and departure with unforgettable memories!\n\n` +
            `* 💰 **Estimated Total Budget for 2 People:** **₹7,500 - ₹12,000** (Standard) | **₹5,500 - ₹7,500** (Budget).`;

          suggestions = ['Make it more budget friendly', `Top hotels in ${matchedDest.name}`, `How to reach ${matchedDest.name}?`, `Must-try food in ${matchedDest.name}`];
        }
      }

      // Sub-Intent B: Budget Optimization & Cost-Saving Follow-up
      else if (
        query.includes('budget') ||
        query.includes('cheap') ||
        query.includes('friendly') ||
        query.includes('cost') ||
        query.includes('price') ||
        query.includes('save') ||
        query.includes('பட்ஜெட்') ||
        query.includes('குறைக்க') ||
        query.includes('kammi') ||
        query.includes('kurakka')
      ) {
        if (lang === 'ta') {
          reply = `### 💰 ${matchedDest.nameTa || matchedDest.name} - பட்ஜெட் சேமிப்பு வழிகாட்டி (2 பேருக்கான சிறந்த குறிப்புகள்):\n\n` +
            `* 🏡 **சிக்கன தங்குமிடங்கள்:** தனியார் ரிசார்ட்டுகளுக்குப் பதிலாக தரமான ஹோம்ஸ்டே அல்லது பட்ஜெட் விடுதிகளைத் தேர்ந்தெடுக்கவும் (**₹800 - ₹1,500 / இரவு** - 50% வரை சேமிக்கலாம்).\n` +
            `* 🚌 **பொதுப் போக்குவரத்து:** தனியார் வாடகை கார்களுக்குப் பதிலாக அரசு பேருந்துகள் (TNSTC / KSRTC) அல்லது பகிர்வு வாகனங்களைப் பயன்படுத்துங்கள்.\n` +
            `* 🍽️ **உள்ளூர் பாரம்பரிய உணவகங்கள்:** ஆடம்பர உணவகங்களைத் தவிர்த்து, உள்ளூர் மக்களிடையே பிரபலமான உணவகங்களில் உணவருந்துங்கள் (**₹400 - ₹600 / நாள்** இருவருக்கு).\n` +
            `* 🎟️ **இலவச & குறைந்த கட்டண இடங்கள்:** இயற்கை பூங்காக்கள், ஏரி நடைபாதைகள், அரசு அருங்காட்சியகங்கள் மற்றும் சூரிய அஸ்தமன முனைகள்.\n\n` +
            `* 💡 **3 நாட்களுக்கான மொத்த பட்ஜெட் (2 நபர்கள்):** **₹5,000 - ₹7,000 மட்டுமே!**`;

          suggestions = [`${matchedDest.nameTa || matchedDest.name} 3 நாள் திட்டம்`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, 'பயணத்தை முன்பதிவு செய்'];
        } else {
          reply = `### 💰 Budget-Friendly Travel Guide for ${matchedDest.name} (2 People):\n\n` +
            `* 🏡 **Affordable Accommodations:** Opt for verified homestays, guesthouses, or youth hostels (**₹800 - ₹1,500 / night** — save up to 60% compared to luxury resorts).\n` +
            `* 🚌 **Smart Transportation:** Use public state transit buses (TNSTC/KSRTC) or shared cabs instead of dedicated private chauffeurs for mountain/coastal transit.\n` +
            `* 🍽️ **Authentic Local Eateries:** Enjoy local South Indian thalis, authentic bakeries, and street delicacies (**₹400 - ₹600 / day for 2 people**).\n` +
            `* 🎟️ **Free & Low-Cost Sightseeing:**\n` +
            `  * Government Botanical & Public Gardens (Low entry ₹10-₹40)\n` +
            `  * Scenic lake walks and viewpoint spots\n` +
            `  * Pine forests, tea garden strolls, and waterfall vantage points (Free entry)\n\n` +
            `* 💡 **Optimized 3-Day Total Cost for 2 People:** **₹5,500 - ₹7,500 total** (including stay, local transit, meals, and tickets).`;

          suggestions = [`View 3-day ${matchedDest.name} itinerary`, `Top budget stays in ${matchedDest.name}`, `How to reach ${matchedDest.name}?`, `Browse packages`];
        }
      }

      // Sub-Intent C: Transportation & How to reach
      else if (
        query.includes('reach') ||
        query.includes('transport') ||
        query.includes('route') ||
        query.includes('train') ||
        query.includes('flight') ||
        query.includes('bus') ||
        query.includes('cab') ||
        query.includes('போக') ||
        query.includes('போக்குவரத்து') ||
        query.includes('epdi poga')
      ) {
        reply = `### 🚗 Transportation & How to Reach ${matchedDest.name}:\n\n` +
          `* 🚆 **By Train:** Major nearby railheads connect directly with express and Vande Bharat trains.\n` +
          `* 🚌 **By Road / Bus:** Regular AC Volvo and deluxe state buses operate overnight from all major neighboring cities.\n` +
          `* ✈️ **By Air:** Fly into the nearest domestic/international airport with direct cab transfers.\n` +
          `* 🛵 **Local Commute:** ${matchedDest.transport}\n\n` +
          `Would you like to book verified transfers or include transportation in your customized package?`;

        suggestions = [`Plan a 3-day trip to ${matchedDest.name}`, `Make it more budget friendly`, `Top hotels in ${matchedDest.name}`];
      }

      // Sub-Intent D: Best time to visit / season / weather
      else if (
        query.includes('best time') ||
        query.includes('season') ||
        query.includes('weather') ||
        query.includes('climate') ||
        query.includes('rain') ||
        query.includes('when to visit') ||
        query.includes('வானிலை') ||
        query.includes('பருவம்') ||
        query.includes('eppo poga') ||
        query.includes('best time enna')
      ) {
        if (lang === 'ta') {
          reply = `### ⛅ ${matchedDest.nameTa || matchedDest.name} செல்ல சிறந்த பருவம் & வானிலை வழிகாட்டி:\n\n` +
            `* 🌟 **சிறந்த பருவம் (Best Time):** **${matchedDest.bestTimeTa || matchedDest.bestTime}**\n` +
            `* ⏱️ **பரிந்துரைக்கப்படும் பயண நாட்கள்:** **${matchedDest.idealDuration}**\n` +
            `* 💰 **மதிப்பிடப்பட்ட தினசரி பட்ஜெட்:** **${matchedDest.dailyCostINR}** (${matchedDest.dailyCostUSD})\n` +
            `* 💡 **பயண குறிப்பு:** இந்த பருவத்தில் இதமான வானிலை நிலவுவதால் சுற்றுலா இடங்களை சுற்றிப் பார்க்க மிகவும் சிறந்தது.`;

          suggestions = [`${matchedDest.nameTa || matchedDest.name}-ல் பார்க்க வேண்டிய இடங்கள்`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, `${matchedDest.nameTa || matchedDest.name} 3 நாள் திட்டம்`];
        } else if (lang === 'thanglish') {
          reply = `### ⛅ Best Time & Season to Visit ${matchedDest.name}:\n\n` +
            `* 🌟 **Best Season:** **${matchedDest.bestTimeTh || matchedDest.bestTime}**\n` +
            `* ⏱️ **Ideal Duration:** **${matchedDest.idealDuration}**\n` +
            `* 💰 **Daily Budget:** **${matchedDest.dailyCostINR}** (${matchedDest.dailyCostUSD})\n` +
            `* 💡 **Pro-Tip:** Indha season-la climate romba pleasant-ah irukkum so sightseeing & outdoor activities easy-ah enjoy pannalam.`;

          suggestions = [`Top places in ${matchedDest.name}`, `Hotels in ${matchedDest.name}`, `Plan 3-day ${matchedDest.name} trip`];
        } else {
          reply = `### ⛅ Best Time & Season to Visit ${matchedDest.name}:\n\n` +
            `* 🌟 **Optimal Season:** **${matchedDest.bestTime}**\n` +
            `* ⏱️ **Recommended Duration:** **${matchedDest.idealDuration}**\n` +
            `* 💰 **Estimated Daily Budget:** **${matchedDest.dailyCostINR}** (${matchedDest.dailyCostUSD})\n` +
            `* 💡 **Pro-Tip:** Traveling during these months offers the clearest skies, optimal temperatures, and the best outdoor conditions.`;

          suggestions = [`Must-see sights in ${matchedDest.name}`, `Top stays in ${matchedDest.name}`, `Plan a ${matchedDest.name} trip`];
        }
      }

      // Sub-Intent E: Food & Local Cuisine
      else if (
        query.includes('food') ||
        query.includes('eat') ||
        query.includes('cuisine') ||
        query.includes('restaurant') ||
        query.includes('dish') ||
        query.includes('உணவு') ||
        query.includes('சாப்பாடு') ||
        query.includes('saapaadu')
      ) {
        if (lang === 'ta') {
          reply = `### 🍽️ ${matchedDest.nameTa || matchedDest.name}-ல் புகழ்பெற்ற பாரம்பரிய உணவுகள்:\n\n` +
            `* 🍲 **முக்கிய உணவுகள் (Must-Try):** ${matchedDest.food}\n` +
            `* 🥗 **சைவ உணவுகள் (Vegetarian):** அனைத்து உணவகங்களிலும் சிறந்த சைவ உணவுகள் மற்றும் புதிய பழச்சாறுகள் கிடைக்கின்றன.\n` +
            `* ☕ **சிற்றுண்டிகள் & இனிப்புகள்:** உள்ளூர் பாரம்பரிய பிரத்யேக சிற்றுண்டிகளை தவறவிடாதீர்கள்.`;

          suggestions = [`${matchedDest.nameTa || matchedDest.name} சுற்றுலா இடங்கள்`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, 'பயணத் திட்டம் உருவாக்கு'];
        } else {
          reply = `### 🍽️ Famous Foods & Culinary Specialties in ${matchedDest.name}:\n\n` +
            `* 🍲 **Signature Dishes (Must-Try):** ${matchedDest.food}\n` +
            `* 🥗 **Dietary Options:** Dedicated vegetarian, vegan, and multicuisine restaurants are widely available.\n` +
            `* 💡 **Local Tip:** Visit historic eateries and popular local markets for the most authentic flavors.`;

          suggestions = [`Top attractions in ${matchedDest.name}`, `Where to stay in ${matchedDest.name}?`, `Plan ${matchedDest.name} trip`];
        }
      }

      // Sub-Intent F: Hotels & Stays
      else if (
        query.includes('hotel') ||
        query.includes('stay') ||
        query.includes('resort') ||
        query.includes('hostel') ||
        query.includes('தங்குமிடம்') ||
        query.includes('விடுதி') ||
        query.includes('thanga idatha')
      ) {
        reply = `### 🏨 Top Recommended Stays in ${matchedDest.name}:\n\n` +
          `* 🌟 **Featured Accommodations:** ${matchedDest.hotels}\n` +
          `* 💰 **Typical Price Range:** Budget ($25 - $40/night) | Mid-Range ($60 - $110/night) | Luxury ($180 - $350+/night).\n` +
          `* 📍 **Location Tip:** Staying centrally near major transit points saves commute time between daily sights.`;

        suggestions = [`What are the top sights in ${matchedDest.name}?`, `Plan a trip to ${matchedDest.name}`, `Browse packages`];
      }

      // Comprehensive Destination Overview
      else {
        if (lang === 'ta') {
          reply = `### 🌍 ${matchedDest.nameTa || matchedDest.name} (${matchedDest.countryTa || matchedDest.country}) முழுமையான சுற்றுலா வழிகாட்டி:\n\n` +
            `* ⛅ **செல்ல சிறந்த பருவம்:** ${matchedDest.bestTimeTa || matchedDest.bestTime}\n` +
            `* ⏱️ **பரிந்துரைக்கப்படும் நாட்கள்:** ${matchedDest.idealDuration}\n` +
            `* 💰 **தினசரி பட்ஜெட்:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
            `* 🌟 **முக்கிய சுற்றுலா இடங்கள்:** ${matchedDest.highlightsTa || matchedDest.highlights}\n` +
            `* 🍲 **பாரம்பரிய உணவுகள்:** ${matchedDest.food}\n` +
            `* 🚗 **உள்ளூர் போக்குவரத்து:** ${matchedDest.transport}\n\n` +
            `உங்களுக்கு **${matchedDest.nameTa || matchedDest.name}** பயணத்திற்கான ஸ்மார்ட் பயணத் திட்டத்தை (AI Itinerary) உருவாக்கவா?`;

          suggestions = [`${matchedDest.nameTa || matchedDest.name} 3 நாள் திட்டம் உருவாக்கு`, `${matchedDest.nameTa || matchedDest.name} தங்குமிடங்கள்`, 'பயண பேக்கேஜ்களை பார்'];
        } else if (lang === 'thanglish') {
          reply = `### 🌍 ${matchedDest.name} (${matchedDest.country}) Complete Travel Guide:\n\n` +
            `* ⛅ **Best Time to Visit:** ${matchedDest.bestTimeTh || matchedDest.bestTime}\n` +
            `* ⏱️ **Duration:** ${matchedDest.idealDuration}\n` +
            `* 💰 **Daily Budget:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
            `* 🌟 **Must-See Places:** ${matchedDest.highlights}\n` +
            `* 🍲 **Local Food:** ${matchedDest.food}\n` +
            `* 🚗 **Commuting:** ${matchedDest.transport}\n\n` +
            `Ungalukku **${matchedDest.name}** day-by-day smart itinerary generate panna kattalaama?`;

          suggestions = [`Plan 3-day trip to ${matchedDest.name}`, `Hotels in ${matchedDest.name}`, 'View packages'];
        } else {
          reply = `### 🌍 Travel Guide: ${matchedDest.name} (${matchedDest.country})\n\n` +
            `* ⛅ **Best Time to Visit:** ${matchedDest.bestTime}\n` +
            `* ⏱️ **Recommended Duration:** ${matchedDest.idealDuration}\n` +
            `* 💰 **Estimated Daily Budget:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
            `* 🌟 **Must-See Highlights:** ${matchedDest.highlights}\n` +
            `* 🍲 **Must-Try Cuisine:** ${matchedDest.food}\n` +
            `* 🚗 **Local Transportation:** ${matchedDest.transport}\n\n` +
            `Would you like to build an automated AI day-by-day itinerary or explore verified tour packages for **${matchedDest.name}**?`;

          suggestions = [`Plan a 3-day trip to ${matchedDest.name}`, `Top hotels in ${matchedDest.name}`, `What to eat in ${matchedDest.name}?`];
        }
      }

      actionLinks.push({ label: `🚀 Plan ${matchedDest.name} with AI`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
      actionLinks.push({ label: 'Explore Destinations', url: '/destinations' });
    }

    // =========================================================================
    // 9. DYNAMIC OPEN-WORLD CONVERSATIONAL FALLBACK (No Hardcoded Goa Default!)
    // =========================================================================
    else {
      // Try to extract any place name candidate from query
      const words = q.split(/\s+/);
      const possiblePlace = words.find((w) => w.length > 3 && !['what', 'where', 'when', 'which', 'tell', 'help', 'plan', 'book', 'trip', 'need', 'want', 'cost', 'good', 'some', 'enna', 'epdi', 'enga', 'polam'].includes(w.toLowerCase()));
      const placeName = possiblePlace ? possiblePlace.charAt(0).toUpperCase() + possiblePlace.slice(1) : 'your dream destination';

      if (lang === 'ta') {
        reply = `### 🌍 பயண வழிகாட்டி & AI உதவி:\n\n` +
          `உங்கள் கேள்விக்கு உதவ நான் தயாராக உள்ளேன். நீங்கள் **${placeName}** அல்லது வேறு எந்த சுற்றுலா இடத்திற்கு செல்ல விரும்பினாலும்:\n\n` +
          `* 📅 **ஸ்மார்ட் AI பயண திட்டம்:** நாள் வாரியான இடங்கள், தங்குமிடங்கள் & போக்குவரத்து வழிகள்.\n` +
          `* 💳 **எளிதான முன்பதிவு & UPI கட்டணம்:** Google Pay, PhonePe, Paytm, QR Code.\n` +
          `* 🔄 **100% முழு ரீஃபண்ட்:** 48 மணி நேரத்திற்கு முன் இலவச ரத்து வசதி.\n\n` +
          `உங்களுக்கு தேவையான குறிப்பிட்ட விவரத்தைக் கேளுங்கள் (எ.கா. *${placeName} செல்ல சிறந்த நேரம் எது?* அல்லது *முன்பதிவு செய்வது எப்படி?*).`;

        suggestions = [`${placeName}-க்கு பயண திட்டம் உருவாக்கு`, 'முன்பதிவு செய்வது எப்படி?', 'UPI கட்டண முறை', 'சுற்றுலா பேக்கேஜ்கள்'];
      } else if (lang === 'thanglish') {
        reply = `### 🌍 Travel Assistant & AI Guide:\n\n` +
          `Unga query-kku help panna naan ready. Neenga **${placeName}** or entha place plan pannalam:\n\n` +
          `* 📅 **AI Smart Itinerary:** Day-wise sightseeing, hotels & travel routes ready pannalam.\n` +
          `* 💳 **Instant Booking & Payments:** UPI (Google Pay, PhonePe, Paytm, QR Code) & Cards.\n` +
          `* 🔄 **Free Cancellation & Refund:** 48 hours prior 100% full money back guarantee.\n\n` +
          `Unga exact kelviya sollunga (e.g. *${placeName} poga best time enna?* or *Trip book panna help pannu*).`;

        suggestions = [`Plan trip to ${placeName}`, 'How to book a trip?', 'UPI payment guide', 'View packages'];
      } else {
        reply = `### 🌍 Travel Assistant & Booking Guide:\n\n` +
          `I am here to assist with all your travel planning, destination inquiries, and booking details for **${placeName}**:\n\n` +
          `* 📅 **AI Day-by-Day Itineraries:** Generate tailored schedules with verified attractions, food hotspots, and routes.\n` +
          `* 💳 **Real-Time Booking & UPI Checkout:** Fast, secure payments with instant confirmation vouchers.\n` +
          `* 🔄 **Flexible 100% Refund Policy:** Full refunds on cancellations made up to 48 hours before departure.\n\n` +
          `Feel free to ask specific questions (e.g. *"What is the best time to visit ${placeName}?"* or *"How do I book a tour package?"*).`;

        suggestions = [`Plan a trip to ${placeName}`, 'How do I book a trip?', 'How to pay with UPI?', 'Explore top destinations'];
      }

      actionLinks.push({ label: `🗺️ Plan Trip to ${placeName}`, url: `/trip-planner?destination=${encodeURIComponent(placeName)}` });
      actionLinks.push({ label: 'Explore Destinations', url: '/destinations' });
      actionLinks.push({ label: 'Browse Packages', url: '/packages' });
    }

    this.recordMessage(sessionId, rawQuery, reply);

    return {
      reply,
      suggestions,
      actionLinks,
      language: lang,
      context: {
        lastQuery: rawQuery,
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

    if (history.length > 40) {
      history = history.slice(history.length - 40);
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
