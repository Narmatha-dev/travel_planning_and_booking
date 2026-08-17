// In-memory session chat history store and language state
const sessionHistories = new Map();
const sessionLanguages = new Map();

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
      link: '/destinations/2',
    },
    {
      name: 'Santorini',
      nameTa: 'சான்டோரினி',
      country: 'Greece',
      countryTa: 'கிரீஸ்',
      category: 'Island & Luxury Romance',
      categoryTa: 'தீவு & சொகுசு காதல் பயணம்',
      bestTime: 'May to October (Sunny Mediterranean, 26°C - 31°C)',
      bestTimeTa: 'மே முதல் அக்டோபர் வரை (சூரிய ஒளி மத்திய தரைக்கடல் பருவம்)',
      bestTimeTh: 'May to October (Sunny Mediterranean weather)',
      dailyCostINR: '₹13,500 - ₹20,000 / day',
      dailyCostUSD: '$160 - $240 / day',
      idealDuration: '4 to 6 Days',
      idealDurationTa: '4 முதல் 6 நாட்கள்',
      idealDurationTh: '4 to 6 Naatkal',
      highlights: 'Oia cliffside caldera sunset, black sand volcanic beaches, catamaran caldera sailing, Assyrtiko wine tasting.',
      highlightsTa: 'ஓயா மலை விளிம்பு சூரிய அஸ்தமனம், கருப்பு மணல் எரிமலை கடற்கரை, படகு சவாரி, அஸிர்டிகோ திராட்சை ரசம்.',
      highlightsTh: 'Oia caldera sunset, black sand volcanic beach, catamaran cruise, Greek wine tasting.',
      link: '/destinations/5',
    },
    {
      name: 'Serengeti',
      nameTa: 'செரெங்கேட்டி',
      country: 'Tanzania',
      countryTa: 'தான்சானியா',
      category: 'Wildlife & Safari',
      categoryTa: 'வனவிலங்கு & சஃபாரி சாகசம்',
      bestTime: 'June to October (Great Migration & dry season)',
      bestTimeTa: 'ஜூன் முதல் அக்டோபர் வரை (மிருகங்களின் பெரும் இடம்பெயர்வு)',
      bestTimeTh: 'June to October (Great Animal Migration season)',
      dailyCostINR: '₹17,000 - ₹26,000 / day',
      dailyCostUSD: '$200 - $320 / day',
      idealDuration: '5 to 8 Days',
      idealDurationTa: '5 முதல் 8 நாட்கள்',
      idealDurationTh: '5 to 8 Naatkal',
      highlights: 'Big Five 4x4 safari game drives, sunrise hot air balloon flight over savanna, Ngorongoro Crater, luxury tented camps.',
      highlightsTa: 'பிக் 5 விலங்குகள் 4x4 சஃபாரி, சவன்னா மீது ஹாட் ஏர் பலூன் சவாரி, நகோரோங்கோரோ பள்ளம், சொகுசு கூடார தங்குமிடம்.',
      highlightsTh: 'Big Five 4x4 safari, hot air balloon flight over savanna, luxury tented camps.',
      link: '/destinations/6',
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
      typeTa: 'நல்வாழ்வு & ஓய்வு',
      inclusions: '4-star boutique resort, daily breakfast, airport transfers, Ubud rice terrace tour, Uluwatu sunset temple tour.',
      inclusionsTa: '4-நட்சத்திர சொகுசு ரிசார்ட் தங்குமிடம், தினசரி காலை உணவு, விமான நிலைய பிக்-அப், உபுட் நெல் வயல் சுற்றுலா, உலுவாட்டு கோவில் பயணம்.',
      inclusionsTh: '4-star luxury resort stay, daily breakfast, airport pickup/drop, Ubud tour, Uluwatu sunset tour.',
      exclusions: 'International flights, personal expenses, travel insurance.',
      exclusionsTa: 'சர்வதேச விமான கட்டணம், தனிப்பட்ட செலவுகள், பயண காப்பீடு.',
      exclusionsTh: 'Flight tickets, personal shopping, travel insurance.',
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
      typeTa: 'சொகுசு ஆல்பைன் சுற்றுலா',
      inclusions: '5-star Zermatt chalet stay, Swiss Travel Pass, Jungfraujoch Top of Europe rail excursion, daily alpine breakfast & fondue dinner.',
      inclusionsTa: '5-நட்சத்திர ஜெர்மாட் மர வில்லா தங்குமிடம், சுவிஸ் டிராவல் பாஸ், ஜங்ஃப்ராவ்ஜோக் ரயில் சுற்றுலா, தினசரி சுவிஸ் காலை உணவு & பான்ட்யூ இரவு உணவு.',
      inclusionsTh: '5-star Zermatt chalet stay, Swiss Travel Pass, Jungfraujoch Top of Europe train, daily breakfast & cheese fondue dinner.',
      exclusions: 'Ski rental gear, visa processing fees.',
      exclusionsTa: 'பனிச்சறுக்கு உபகரண வாடகை, விசா கட்டணம்.',
      exclusionsTh: 'Ski rental equipment, visa fees.',
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
      typeTa: 'காதல் & நகர உலா',
      inclusions: 'Central boutique hotel near Seine, Louvre skip-the-line pass, Seine dinner cruise, Versailles palace day tour.',
      inclusionsTa: 'செய்ன் நதி அருகே மத்திய பூட்டிக் ஹோட்டல், லூவர் விஐபி நுழைவுச்சீட்டு, செய்ன் நதி இரவு படகு உணவு, வெர்சாய் அரண்மனை சுற்றுலா.',
      inclusionsTh: 'Central boutique hotel near Seine river, Louvre skip-line pass, Seine dinner cruise, Versailles palace tour.',
      exclusions: 'City tourist tax, lunch meals.',
      exclusionsTa: 'நகர சுற்றுலா வரி, மதிய உணவு.',
      exclusionsTh: 'City tourist tax, lunch.',
      link: '/packages/4',
    },
    {
      title: 'Grand Japan Explorer: Tokyo to Kyoto',
      titleTa: 'மாபெரும் ஜப்பான் பயணம்: டோக்கியோ முதல் கியோட்டோ வரை',
      price: '$2,699 (₹2,29,415)',
      duration: '10 Days / 9 Nights',
      durationTa: '10 நாட்கள் / 9 இரவுகள்',
      durationTh: '10 Naatkal / 9 Iravugal',
      type: 'Cultural Heritage',
      typeTa: 'கலாச்சார பாரம்பரியம்',
      inclusions: '7-Day JR Bullet Train pass, 4-star hotels in Tokyo & Kyoto, traditional tea ceremony, guided Fushimi Inari walk.',
      inclusionsTa: '7-நாள் புல்லட் ரயில் பாஸ், டோக்கியோ & கியோட்டோ 4-நட்சத்திர ஹோட்டல்கள், பாரம்பரிய தேநீர் சடங்கு, புஷிமி இனாரி வழிகாட்டி சுற்றுலா.',
      inclusionsTh: '7-Day JR Bullet Train pass, 4-star hotels, traditional tea ceremony, guided temple walk.',
      exclusions: 'Personal shopping, optional museum tickets.',
      exclusionsTa: 'தனிப்பட்ட ஷாப்பிங், விருப்ப அருங்காட்சியக கட்டணங்கள்.',
      exclusionsTh: 'Shopping expenses, optional tickets.',
      link: '/packages/2',
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
    confirmation: 'Instant digital confirmation with unique booking reference ID (e.g. BK-2026-XXXX) and printable receipts available under My Trips.',
    confirmationTa: 'தனித்துவமான முன்பதிவு எண் (எ.கா. BK-2026-XXXX) மற்றும் உடனடி உறுதிப்படுத்தல் ரசீது வழங்கப்படும்.',
    confirmationTh: 'Instant booking confirmation and unique reference ID (e.g. BK-2026-XXXX) kedaikkum.',
  },
};

/**
 * Robust Multilingual Language Detector
 * Detects: 'en' (English), 'ta' (Tamil script), 'thanglish' (Tamil in English alphabet)
 * Persists language across continuous session dialogue
 */
function detectLanguage(text, sessionId) {
  const currentSessionLang = sessionLanguages.get(sessionId) || 'en';
  if (!text || typeof text !== 'string') return currentSessionLang;

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Unicode Range Check for Tamil Script (U+0B80 to U+0BFF)
  if (/[\u0B80-\u0BFF]/.test(raw)) {
    sessionLanguages.set(sessionId, 'ta');
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
    'ennaikku', 'nalaikku', 'ippo', 'eppo', 'kooda', 'mattum', 'kitta', 'illai', 'illa',
    'aagum', 'aagudhu', 'theriyum', 'puriyala', 'puriyum', 'mudiyuma', 'theriyuma', 'irukkum',
    'vazhikaatti', 'payanam', 'payana', 'nalladhu', 'beach-la', 'stay-ku', 'packagela',
    'pakka', 'poyitu', 'kelambalam', 'kitta', 'keka'
  ];

  const words = lower.split(/[^a-z0-9]+/);
  const thanglishMatchCount = words.filter((w) => thanglishKeywords.includes(w)).length;

  if (thanglishMatchCount >= 1) {
    sessionLanguages.set(sessionId, 'thanglish');
    return 'thanglish';
  }

  // 3. Clear English Switch Check
  const englishClearMarkers = [
    'what', 'where', 'when', 'how', 'which', 'who', 'tell', 'show', 'give', 'recommend',
    'package', 'flight', 'hotel', 'cancellation', 'itinerary', 'destination', 'budget',
    'price', 'cost', 'trip', 'travel', 'hi', 'hello', 'hey', 'please', 'details'
  ];
  const englishMatchCount = words.filter((w) => englishClearMarkers.includes(w)).length;

  if (englishMatchCount >= 1 && thanglishMatchCount === 0) {
    sessionLanguages.set(sessionId, 'en');
    return 'en';
  }

  return currentSessionLang;
}

const chatbotService = {
  /**
   * Process incoming user question and generate AI travel response with multilingual intelligence
   */
  async processMessage(sessionId = 'default', userMessage = '') {
    const rawQuery = String(userMessage || '').trim();
    const query = rawQuery.toLowerCase();

    // Detect language: 'en', 'ta', or 'thanglish'
    const lang = detectLanguage(rawQuery, sessionId);

    if (!rawQuery) {
      if (lang === 'ta') {
        return {
          reply: 'வணக்கம்! நான் டிராவலோராவின் AI பயண உதவியாளர். சுற்றுலா இடங்கள், பேக்கேஜ்கள், பட்ஜெட் திட்டமிடல் அல்லது முன்பதிவு விதிகள் பற்றி என்னிடம் கேட்கலாம்!',
          suggestions: ['₹20,000 பட்ஜெட்டில் சிறந்த கடற்கரை', 'சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ் விவரங்கள்', 'முன்பதிவு ரத்து விதிகள்'],
          language: lang,
        };
      }
      if (lang === 'thanglish') {
        return {
          reply: 'Vanakkam! Naan ungaloda Travelora AI Travel Assistant. Tour planning, destinations, packages, budget matrum booking pathi enkitta kettu therinjikalam!',
          suggestions: ['₹20,000-la nalla beach trip', 'Swiss Alps package evlo aagum?', 'Cancellation policy enna?'],
          language: lang,
        };
      }
      return {
        reply: 'Hello! I am Travelora’s AI Travel Assistant. How can I assist with your vacation planning today? Ask me about destinations, curated packages, budget planning, or booking policies!',
        suggestions: ['Best beach for ₹20,000', 'Tell me about Swiss Alps package', 'What is your cancellation policy?'],
        language: lang,
      };
    }

    // Guardrail Check: Never invent or expose private booking credentials or card numbers
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
      let guardrailSuggestions = [];

      if (lang === 'ta') {
        guardrailReply = '🔒 **பாதுகாப்பு அறிவிப்பு**: உங்கள் பாதுகாப்பிற்காக, டிராவலோரா கிரெடிட் கார்டு எண்கள், CVV அல்லது கடவுச்சொற்களை ஒருபோதும் பகிரவோ கேட்கவோ மாட்டாது. உங்கள் முன்பதிவு மற்றும் கட்டண விவரங்களை பாதுகாப்பாக நிர்வகிக்க [எனது பயணங்கள் பக்கத்திற்கு](/my-trips) செல்லவும்.';
        guardrailSuggestions = ['முன்பதிவுகளை எப்படி பார்ப்பது?', 'கட்டண முறைகள் என்ன?'];
      } else if (lang === 'thanglish') {
        guardrailReply = '🔒 **Security Notice**: Ungaloda paadhukaapukaaga Travelora eppovum sensitive card number, CVV, passwords share pannaadhu. Ungaloda confirmed bookings & safe payments-ai [My Trips Dashboard-la](/my-trips) paarthu manage pannalaam.';
        guardrailSuggestions = ['Bookings-ai epdi paarpadhu?', 'Enna payment methods iruku?'];
      } else {
        guardrailReply = '🔒 **Security Notice**: For your protection, Travelora never shares or requests sensitive card numbers, CVVs, or passwords. To manage your real bookings and payments safely, please visit your encrypted [My Trips Dashboard](/my-trips).';
        guardrailSuggestions = ['How to view my bookings', 'What payment methods are supported?'];
      }

      this.recordMessage(sessionId, rawQuery, guardrailReply);
      return {
        reply: guardrailReply,
        suggestions: guardrailSuggestions,
        language: lang,
      };
    }

    let reply = '';
    const suggestions = [];
    const actionLinks = [];

    // 1. Booking Policy & Cancellation Queries
    if (
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
          `* 🔒 **வங்கி தர பாதுகாப்பு:** ${KNOWLEDGE_BASE.bookingPolicies.securityTa}\n` +
          `* 📄 **உடனடி உறுதிப்படுத்தல்:** ${KNOWLEDGE_BASE.bookingPolicies.confirmationTa}\n\n` +
          `உங்கள் உறுதிசெய்யப்பட்ட பயண விவரங்களை [எனது பயணங்கள்](/my-trips) பக்கத்தில் பார்க்கலாம்.`;

        suggestions.push('பேக்கேஜ் முன்பதிவு செய்வது எப்படி?', 'பட்ஜெட் பயணங்கள்', 'பிரபலமான இடங்கள்');
        actionLinks.push({ label: 'எனது பயணங்கள் (My Trips)', url: '/my-trips' });
      } else if (lang === 'thanglish') {
        reply = `### 📋 Travelora Booking & Cancellation Rules\n\n` +
          `Unga bookings matrum refund details inge:\n\n` +
          `* ⏱️ **Free Cancellation & Full Refund:** ${KNOWLEDGE_BASE.bookingPolicies.cancellationTh}\n` +
          `* 💳 **Payment Methods:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethodsTh}\n` +
          `* 🔒 **Security & Privacy:** ${KNOWLEDGE_BASE.bookingPolicies.securityTh}\n` +
          `* 📄 **Instant Confirmation:** ${KNOWLEDGE_BASE.bookingPolicies.confirmationTh}\n\n` +
          `Unga bookings-ai [My Trips Dashboard-la](/my-trips) paarthu manage pannalaam.`;

        suggestions.push('Package book panradhu epdi?', 'Budget beach trips sollunga', 'Popular places');
        actionLinks.push({ label: 'My Trips Paarkka', url: '/my-trips' });
      } else {
        reply = `### 📋 Travelora Booking & Payment Policies\n\n` +
          `Here are the key details regarding bookings on Travelora:\n\n` +
          `* **Cancellation & Refunds:** ${KNOWLEDGE_BASE.bookingPolicies.cancellation}\n` +
          `* **Payment Methods:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethods}\n` +
          `* **Security & Privacy:** ${KNOWLEDGE_BASE.bookingPolicies.security}\n` +
          `* **Instant Confirmation:** ${KNOWLEDGE_BASE.bookingPolicies.confirmation}\n\n` +
          `You can easily view and manage your confirmed reservations under [My Trips](/my-trips).`;

        suggestions.push('How to book a package', 'Recommend a budget trip', 'Top destinations');
        actionLinks.push({ label: 'View My Trips', url: '/my-trips' });
      }
    }

    // 2. Package Inquiry Queries (Curated Packages, Deals, Inclusions)
    else if (
      query.includes('package') ||
      query.includes('deal') ||
      query.includes('inclusion') ||
      query.includes('exclusion') ||
      query.includes('tour cost') ||
      query.includes('பேக்கேஜ்') ||
      query.includes('விலை') ||
      query.includes('சேர்க்கப்பட்டது') ||
      query.includes('packagela') ||
      query.includes('vilai') ||
      query.includes('evlo aagum') ||
      query.includes('details sollunga')
    ) {
      const matchedPkg = KNOWLEDGE_BASE.packages.find((p) =>
        query.includes('swiss') && p.title.includes('Swiss') ||
        query.includes('சுவிஸ்') && p.title.includes('Swiss') ||
        query.includes('paris') && p.title.includes('Paris') ||
        query.includes('பாரிஸ்') && p.title.includes('Paris') ||
        query.includes('bali') && p.title.includes('Bali') ||
        query.includes('பாலி') && p.title.includes('Bali') ||
        query.includes('japan') && p.title.includes('Japan') ||
        query.includes('ஜப்பான்') && p.title.includes('Japan') ||
        query.includes('tokyo') && p.title.includes('Japan') ||
        query.includes(p.title.toLowerCase().split(' ')[0])
      ) || KNOWLEDGE_BASE.packages[0];

      if (lang === 'ta') {
        reply = `### 📦 பிரத்யேக சுற்றுலா பேக்கேஜ்: ${matchedPkg.titleTa || matchedPkg.title}\n\n` +
          `* 💵 **கட்டணம்:** **${matchedPkg.price}** (ஒரு நபருக்கு)\n` +
          `* ⏳ **கால அளவு:** ${matchedPkg.durationTa || matchedPkg.duration}\n` +
          `* 🏷️ **பயண பாணி:** ${matchedPkg.typeTa || matchedPkg.type}\n\n` +
          `#### ✅ பேக்கேஜில் உள்ளடங்கியவை (Inclusions):\n${matchedPkg.inclusionsTa || matchedPkg.inclusions}\n\n` +
          `#### ❌ பேக்கேஜில் இல்லாதவை (Exclusions):\n${matchedPkg.exclusionsTa || matchedPkg.exclusions}\n\n` +
          `*உடனடி உறுதிப்படுத்தல் மற்றும் 48 மணி நேர இலவச ரத்துசெய்தல் வசதியுடன்.*`;

        suggestions.push('இந்த பேக்கேஜை எப்படி பதிவு செய்வது?', 'அனைத்து பேக்கேஜ்களையும் காட்டு', 'ரத்து விதிகள் என்ன?');
        actionLinks.push({ label: 'பேக்கேஜ் விவரங்கள் (View Details)', url: matchedPkg.link });
        actionLinks.push({ label: 'உடனடி முன்பதிவு (Book Now)', url: '/booking?packageId=1' });
      } else if (lang === 'thanglish') {
        reply = `### 📦 Curated Package: ${matchedPkg.title}\n\n` +
          `* 💵 **Price:** **${matchedPkg.price}** per traveler\n` +
          `* ⏳ **Duration:** ${matchedPkg.durationTh || matchedPkg.duration}\n` +
          `* 🏷️ **Travel Style:** ${matchedPkg.type}\n\n` +
          `#### ✅ Package-la Enna Ellam Serndhirukku (Inclusions):\n${matchedPkg.inclusionsTh || matchedPkg.inclusions}\n\n` +
          `#### ❌ Package-la Illaadhavai (Exclusions):\n${matchedPkg.exclusionsTh || matchedPkg.exclusions}\n\n` +
          `*Instant confirmation matrum 48-hour free cancellation policy irukku.*`;

        suggestions.push('Idha epdi book panradhu?', 'Ella packages-um kaatunga', 'Cancellation policy enna?');
        actionLinks.push({ label: 'Package Details Paarkka', url: matchedPkg.link });
        actionLinks.push({ label: 'Instant Booking', url: '/booking?packageId=1' });
      } else {
        reply = `### 📦 Curated Package: ${matchedPkg.title}\n\n` +
          `* 💵 **Price:** **${matchedPkg.price}** per traveler\n` +
          `* ⏳ **Duration:** ${matchedPkg.duration}\n` +
          `* 🏷️ **Travel Style:** ${matchedPkg.type}\n\n` +
          `#### ✅ Included in Package:\n${matchedPkg.inclusions}\n\n` +
          `#### ❌ Excluded:\n${matchedPkg.exclusions}\n\n` +
          `*Includes instant booking confirmation & 48-hour free cancellation.*`;

        suggestions.push('How do I book this package?', 'Show all available packages', 'What is the cancellation policy?');
        actionLinks.push({ label: 'View Package Details', url: matchedPkg.link });
        actionLinks.push({ label: 'Instant Booking', url: '/booking?packageId=1' });
      }
    }

    // 3. Destination Queries (Goa, Bali, Paris, Swiss Alps, Kerala, Tokyo, Santorini, Serengeti, etc.)
    else if (
      query.includes('goa') ||
      query.includes('கோவா') ||
      query.includes('bali') ||
      query.includes('பாலி') ||
      query.includes('paris') ||
      query.includes('பாரிஸ்') ||
      query.includes('swiss') ||
      query.includes('சுவிஸ்') ||
      query.includes('alps') ||
      query.includes('ஆல்ப்ஸ்') ||
      query.includes('kerala') ||
      query.includes('கேரளா') ||
      query.includes('tokyo') ||
      query.includes('டோக்கியோ') ||
      query.includes('kyoto') ||
      query.includes('கியோட்டோ') ||
      query.includes('japan') ||
      query.includes('ஜப்பான்') ||
      query.includes('santorini') ||
      query.includes('சான்டோரினி') ||
      query.includes('serengeti') ||
      query.includes('செரெங்கேட்டி') ||
      query.includes('best time') ||
      query.includes('weather') ||
      query.includes('destination') ||
      query.includes('நேரம்') ||
      query.includes('பருவம்') ||
      query.includes('இடங்கள்') ||
      query.includes('neram') ||
      query.includes('kaalam') ||
      query.includes('idangal') ||
      query.includes('oor') ||
      query.includes('pogalam')
    ) {
      const matchedDest = KNOWLEDGE_BASE.destinations.find((d) =>
        query.includes(d.name.toLowerCase()) ||
        query.includes(d.country.toLowerCase()) ||
        (d.nameTa && query.includes(d.nameTa)) ||
        (d.countryTa && query.includes(d.countryTa))
      ) || KNOWLEDGE_BASE.destinations[0];

      if (lang === 'ta') {
        reply = `### 🌍 பயண வழிகாட்டி: ${matchedDest.nameTa || matchedDest.name} (${matchedDest.countryTa || matchedDest.country})\n\n` +
          `**வகை (Category):** ${matchedDest.categoryTa || matchedDest.category}\n\n` +
          `* ⛅ **செல்ல சிறந்த பருவம்:** ${matchedDest.bestTimeTa || matchedDest.bestTime}\n` +
          `* ⏱️ **பரிந்துரைக்கப்பட்ட நாட்கள்:** ${matchedDest.idealDurationTa || matchedDest.idealDuration}\n` +
          `* 💰 **மதிப்பிடப்பட்ட தினசரி பட்ஜெட்:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **முக்கிய சுற்றுலா இடங்கள்:** ${matchedDest.highlightsTa || matchedDest.highlights}\n\n` +
          `உங்களுக்கு ${matchedDest.nameTa || matchedDest.name}-க்கான ஸ்மார்ட் பயண திட்டத்தை (AI Itinerary) உருவாக்கவா அல்லது பேக்கேஜ்களை பார்க்கவா?`;

        suggestions.push(`${matchedDest.nameTa || matchedDest.name} பயண திட்டம் உருவாக்கு`, `${matchedDest.nameTa || matchedDest.name} பேக்கேஜ்களைப் பார்`, 'பட்ஜெட் கடற்கரை பயணங்கள்');
        actionLinks.push({ label: `${matchedDest.nameTa || matchedDest.name} திட்டம் உருவாக்கு`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
        actionLinks.push({ label: 'பேக்கேஜ்களைப் பார்', url: '/packages' });
      } else if (lang === 'thanglish') {
        reply = `### 🌍 Payana Vazhikaatti: ${matchedDest.name} (${matchedDest.country})\n\n` +
          `**Category:** ${matchedDest.category}\n\n` +
          `* ⛅ **Poga Best Time / Season:** ${matchedDest.bestTimeTh || matchedDest.bestTime}\n` +
          `* ⏱️ **Thevaipadum Naatkal:** ${matchedDest.idealDurationTh || matchedDest.idealDuration}\n` +
          `* 💰 **Daily Budget Estimation:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **Paarka Vendiya Mukkiya Idangal:** ${matchedDest.highlightsTh || matchedDest.highlights}\n\n` +
          `Ungalukku ${matchedDest.name}-kku day-by-day smart itinerary ready panna kattalaam? Or packages paakka poringala?`;

        suggestions.push(`${matchedDest.name} itinerary generate pannunga`, `${matchedDest.name} packages kaatunga`, 'Budget beach trips');
        actionLinks.push({ label: `${matchedDest.name} Plan Panna`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
        actionLinks.push({ label: 'Packages Paarkka', url: '/packages' });
      } else {
        reply = `### 🌍 Travel Guide: ${matchedDest.name} (${matchedDest.country})\n\n` +
          `**Category:** ${matchedDest.category}\n\n` +
          `* ⛅ **Best Time to Visit:** ${matchedDest.bestTime}\n` +
          `* ⏱️ **Recommended Duration:** ${matchedDest.idealDuration}\n` +
          `* 💰 **Estimated Daily Budget:** ${matchedDest.dailyCostINR} (${matchedDest.dailyCostUSD})\n` +
          `* 🌟 **Must-See Highlights:** ${matchedDest.highlights}\n\n` +
          `Would you like to build a day-by-day smart itinerary or browse curated travel packages for ${matchedDest.name}?`;

        suggestions.push(`Generate itinerary for ${matchedDest.name}`, `View packages for ${matchedDest.name}`, 'Compare budget beach trips');
        actionLinks.push({ label: `Plan ${matchedDest.name} Trip`, url: `/trip-planner?destination=${encodeURIComponent(matchedDest.name)}` });
        actionLinks.push({ label: 'Browse Packages', url: '/packages' });
      }
    }

    // 4. Budget & Duration Planning Queries
    else if (
      query.includes('budget') ||
      query.includes('cost') ||
      query.includes('price') ||
      query.includes('20000') ||
      query.includes('20,000') ||
      query.includes('duration') ||
      query.includes('how many days') ||
      query.includes('cheap') ||
      query.includes('பட்ஜெட்') ||
      query.includes('செலவு') ||
      query.includes('நாட்கள்') ||
      query.includes('குறைந்த') ||
      query.includes('selavu') ||
      query.includes('naatkal') ||
      query.includes('kammi')
    ) {
      if (lang === 'ta') {
        reply = `### 💡 AI பட்ஜெட் மற்றும் பயண கால வழிகாட்டி\n\n` +
          `உங்கள் பட்ஜெட்டிற்கு ஏற்ற சிறந்த பரிந்துரைகள்:\n\n` +
          `* **₹15,000 – ₹25,000 ($200 – $300):** **3 முதல் 5 நாட்களுக்கு** **கோவா**, **கேரளா உப்பங்கழிகள்**, அல்லது **மணாலி** மலைப்பகுதி மிகவும் சிறந்தது.\n` +
          `* **₹50,000 – ₹90,000 ($600 – $1,100):** **6 முதல் 8 நாட்களுக்கு** **பாலி தீவு** அல்லது **அந்தமான் தீவுகள்** அருமையான தேர்வு.\n` +
          `* **₹1,20,000+ ($1,500 – $3,500):** **பாரிஸ்**, **சுவிஸ் ஆல்ப்ஸ்**, அல்லது **டோக்கியோ** போன்ற வெளிநாட்டு பயணங்களுக்கு ஏற்றது.\n\n` +
          `**AI பட்ஜெட் குறிப்பு:** தங்குமிடம் 40%, உணவு 30%, சுற்றுலா அனுபவங்கள் 20%, உள்ளூர் போக்குவரத்து 10%.`;

        suggestions.push('₹20,000-ல் சிறந்த கடற்கரைகள்', '4 நாள் கோவா திட்டம்', 'சொகுசு பேக்கேஜ்கள்');
        actionLinks.push({ label: 'AI பயணத் திட்டம் உருவாக்கு', url: '/trip-planner' });
        actionLinks.push({ label: 'பிரத்யேக பரிந்துரைகள்', url: '/recommendations' });
      } else if (lang === 'thanglish') {
        reply = `### 💡 AI Budget & Trip Duration Guidance\n\n` +
          `Unga budget-kku thagundha smart recommendations inge:\n\n` +
          `* **₹15,000 – ₹25,000 ($200 – $300):** **3 to 5 days-kku** **Goa**, **Kerala Backwaters**, or **Manali** super choice.\n` +
          `* **₹50,000 – ₹90,000 ($600 – $1,100):** **6 to 8 days-kku** **Bali Island** or **Andaman Islands** perfect plan.\n` +
          `* **₹1,20,000+ ($1,500 – $3,500):** **Paris**, **Swiss Alps**, or **Tokyo** international trip-kku best.\n\n` +
          `**AI Budget Tip:** Stay 40%, Saapaadu 30%, Activities 20%, Local travel 10% allocate pannunga.`;

        suggestions.push('₹20,000-la top beaches', '4 days Goa itinerary', 'Luxury packages kaatunga');
        actionLinks.push({ label: 'AI Smart Itinerary Planner', url: '/trip-planner' });
        actionLinks.push({ label: 'Personalized Suggestions', url: '/recommendations' });
      } else {
        reply = `### 💡 AI Budget & Trip Duration Recommendations\n\n` +
          `Here is our smart budget breakdown based on your query:\n\n` +
          `* **₹15,000 – ₹25,000 ($200 – $300):** Ideal for **3 to 5 days** in **Goa**, **Kerala Backwaters**, or **Himalayan Manali**.\n` +
          `* **₹50,000 – ₹90,000 ($600 – $1,100):** Perfect for **6 to 8 days** in **Bali Paradise Island** or **Andaman Islands**.\n` +
          `* **₹1,20,000+ ($1,500 – $3,500):** Ideal for grand 7 to 10 day international vacations in **Paris**, **Swiss Alps**, or **Tokyo**.\n\n` +
          `**AI Budget Tip:** Allocate ~40% for accommodation, 30% for food and dining, 20% for activities/entry passes, and 10% for local transport.`;

        suggestions.push('Top beach destinations for ₹20,000', 'Generate 4-day Goa itinerary', 'Show luxury packages');
        actionLinks.push({ label: 'AI Smart Itinerary Planner', url: '/trip-planner' });
        actionLinks.push({ label: 'Personalized Recommendations', url: '/recommendations' });
      }
    }

    // 5. Activities & Adventure Queries
    else if (
      query.includes('activit') ||
      query.includes('scuba') ||
      query.includes('surf') ||
      query.includes('ski') ||
      query.includes('trek') ||
      query.includes('safari') ||
      query.includes('watersport') ||
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
          `* 🌊 **நீர் விளையாட்டுகள் & ஸ்கூபா டைவிங்:** ஹேவ்லாக் தீவு (அந்தமான்), கலங்குட் கடற்கரை (கோவா), பாலி தீவு.\n` +
          `* 🏔️ **பனிச்சறுக்கு & மலையேற்றம்:** சுவிஸ் ஆல்ப்ஸ் மேட்டர்ஹார்ன், சோலாங் பள்ளத்தாக்கு (மணாலி).\n` +
          `* 🦁 **வனவிலங்கு சஃபாரி:** செரெங்கேட்டி பிக் 5 சஃபாரி & ஹாட் ஏர் பலூன் (தான்சானியா).\n` +
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

    // 6. Generic Friendly AI Travel Assistance
    else {
      if (lang === 'ta') {
        reply = `### 👋 வணக்கம்! நான் டிராவலோராவின் AI பயண உதவியாளர்.\n\n` +
          `உங்கள் பயண திட்டமிடலில் உதவ நான் 24/7 தயாராக உள்ளேன்! நீங்கள் என்னிடம் கேட்கக்கூடியவை:\n\n` +
          `* 🏖️ *"₹20,000 பட்ஜெட்டில் 4 நாட்களுக்கு செல்ல சிறந்த கடற்கரை எது?"*\n` +
          `* 📦 *"சுவிஸ் ஆல்ப்ஸ் மற்றும் பாரிஸ் பேக்கேஜ் கட்டண விவரங்கள் சொல்லுங்கள்."*\n` +
          `* ⛅ *"பாலி அல்லது டோக்கியோ செல்ல ஆண்டின் சிறந்த பருவம் எது?"*\n` +
          `* 📋 *"முன்பதிவு ரத்து செய்தால் பணம் திரும்ப கிடைக்குமா?"*\n` +
          `* 🧭 *"எனக்கு 5 நாள் பயண திட்டம் ஒன்றை உருவாக்கித் தாருங்கள்."*`;

        suggestions.push('சிறந்த 3 கடற்கரைகள்', 'சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ்', 'முன்பதிவு ரத்து விதிகள்');
        actionLinks.push({ label: 'AI பரிந்துரைகள்', url: '/recommendations' });
      } else if (lang === 'thanglish') {
        reply = `### 👋 Vanakkam! Naan ungaloda Travelora AI Travel Assistant.\n\n` +
          `Unga vacation planning-ku 24/7 help panna ready! Neenga enkitta keka koodiyavai:\n\n` +
          `* 🏖️ *"₹20,000 budget-la 4 days stay panna nalla beach enga irukku?"*\n` +
          `* 📦 *"Swiss Alps matrum Paris package details sollunga."*\n` +
          `* ⛅ *"Bali poga best season / time enna?"*\n` +
          `* 📋 *"Booking cancel panna full refund kedaikkuma?"*\n` +
          `* 🧭 *"5 days trip-kku smart itinerary create pannunga."*`;

        suggestions.push('Top 3 budget beach trips', 'Swiss Alps package details', 'Cancellation policy enna?');
        actionLinks.push({ label: 'AI Suggestions Paarkka', url: '/recommendations' });
      } else {
        reply = `### 👋 How Can I Help Your Travel Journey?\n\n` +
          `I am your 24/7 AI Travel Assistant! Here are some things you can ask me:\n\n` +
          `* 🏖️ *"What is the best beach destination for 4 days with a ₹20,000 budget?"*\n` +
          `* 📦 *"Tell me about the Swiss Alps and Paris packages and pricing."*\n` +
          `* ⛅ *"What is the best time of year to visit Bali or Tokyo?"*\n` +
          `* 📋 *"What is Travelora's cancellation and refund policy?"*\n` +
          `* 🧭 *"Generate a personalized 5-day itinerary."*`;

        suggestions.push('Top 3 beach destinations', 'Swiss Alps package details', 'Booking cancellation policy');
        actionLinks.push({ label: 'AI Suggestions', url: '/recommendations' });
      }
    }

    this.recordMessage(sessionId, rawQuery, reply);

    return {
      reply,
      suggestions,
      actionLinks,
      language: lang,
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

    // Keep last 20 messages per session
    if (history.length > 20) {
      history = history.slice(history.length - 20);
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
   * Clear history for a session
   */
  clearHistory(sessionId = 'default') {
    sessionHistories.delete(sessionId);
    sessionLanguages.delete(sessionId);
    return true;
  },
};

module.exports = chatbotService;
