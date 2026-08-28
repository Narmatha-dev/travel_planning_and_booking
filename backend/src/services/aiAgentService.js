const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const config = require('../config/environment');

// In-memory multi-turn session cache
const agentSessions = new Map();

// Helper: Get fresh API key from environment
function getApiKeys() {
  let geminiKey = (process.env.GEMINI_API_KEY || config.ai?.geminiApiKey || '').trim();
  let groqKey = (process.env.GROQ_API_KEY || '').trim();
  let openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  let openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim();

  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.GEMINI_API_KEY && !parsed.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
        geminiKey = parsed.GEMINI_API_KEY.trim();
      }
      if (parsed.GROQ_API_KEY) groqKey = parsed.GROQ_API_KEY.trim();
      if (parsed.OPENAI_API_KEY) openaiKey = parsed.OPENAI_API_KEY.trim();
      if (parsed.OPENROUTER_API_KEY) openrouterKey = parsed.OPENROUTER_API_KEY.trim();
    }
  } catch {}

  return { geminiKey, groqKey, openaiKey, openrouterKey };
}

const SYSTEM_INSTRUCTION = `You are Travelora AI Travel Agent, an elite, highly intelligent, and friendly real-world travel advisor for the Travel Planning and Booking platform.

Your primary mission:
1. Understand the traveler's request and automatically extract their travel requirements:
   - Origin / Starting location (e.g., Chennai, Bangalore, Delhi, Mumbai)
   - Destination (e.g., Ooty, Goa, Munnar, Bali, Paris, Manali, Shimla, Dubai)
   - Duration / Number of days (e.g., 3 days, 4 days, 5 days)
   - Number of travelers / group type (e.g., 2 people, solo, family with kids, friends)
   - Budget (e.g., ₹15,000, ₹25,000, $500, luxury)
   - Preferences & Interests (e.g., nature, sightseeing, adventure, beaches, food, relaxation, nightlife)
   - Preferred transport & accommodation

2. If critical information is missing (e.g., user just says "I want a trip"), ask 1-2 friendly clarifying questions.
3. Once sufficient information is provided, generate a complete, personalized, day-by-day smart itinerary, trip overview, and recommendations.
4. When a user asks follow-up modifications (e.g., "Make it cheaper and add more nature places", "Add one extra day", "Make it luxury", "Use public transport"), adjust and update the existing plan while preserving the previous context.

ALWAYS return your response as a valid JSON object matching this exact structure:
{
  "message": "A warm, inspiring, and concise conversational message formatted in Markdown (headers ###, bold **, bullet points *).",
  "isPlanReady": true,
  "extractedRequirements": {
    "origin": "Chennai",
    "destination": "Ooty",
    "days": 3,
    "travelers": 2,
    "budget": "₹15,000",
    "preferences": ["Nature", "Sightseeing"],
    "transportPreference": "Train / Scenic Hill Bus",
    "accommodationPreference": "Cozy Hill Homestay"
  },
  "tripOverview": {
    "destination": "Ooty, Tamil Nadu",
    "duration": "3 Days / 2 Nights",
    "travelers": 2,
    "estimatedBudget": "₹11,500 - ₹14,000",
    "travelStyle": "Nature & Sightseeing",
    "highlightSummary": "Lush Nilgiri tea estates, botanical flora, serene lake boating, and panoramic mountain peaks."
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival, Emerald Lake & Botanical Flora",
      "morning": "Arrival in Ooty, check in to hill homestay, visit Government Botanical Gardens (9:30 AM - 12:30 PM)",
      "afternoon": "Authentic South Indian lunch, followed by peaceful boating on Ooty Lake (1:30 PM - 4:30 PM)",
      "evening": "Stroll through local spice and handmade chocolate shops on Commercial Road (5:30 PM - 8:00 PM)",
      "places": ["Government Botanical Gardens", "Ooty Lake", "Commercial Road"],
      "estimatedDayCost": "₹3,200 for 2"
    }
  ],
  "recommendations": {
    "transport": "Overnight Nilgiri Express Train (Chennai to Mettupalayam) + Heritage Toy Train / State Bus to Ooty (₹1,800 total for 2)",
    "accommodation": "Cozy hill homestay / cottage near Lake Road or Charing Cross (₹1,200 - ₹2,000 / night)",
    "food": "Hot Ooty Varkey, homemade dark chocolates, Nilgiri green tea, and South Indian thalis",
    "budgetDistribution": {
      "transport": "25%",
      "stays": "40%",
      "food": "20%",
      "activities": "15%"
    },
    "topSpots": ["Botanical Gardens", "Doddabetta Peak", "Pykara Waterfalls", "Pine Forest", "Nilgiri Toy Train"]
  },
  "suggestions": [
    "Make it cheaper and add more nature places",
    "Add luxury resort stays",
    "Add an extra day to Coonoor",
    "How do I book this trip?"
  ]
}`;

// Multi-provider AI Caller
async function callExternalAI(keys, userPrompt, history = []) {
  const { geminiKey, groqKey, openaiKey, openrouterKey } = keys;

  // 1. Google Gemini AI (@google/genai & @google/generative-ai)
  if (geminiKey && !geminiKey.includes('YOUR_GEMINI_API_KEY')) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      let fullPrompt = `System Instructions:\n${SYSTEM_INSTRUCTION}\n\nConversation History:\n`;
      for (const h of history) {
        fullPrompt += `${h.role === 'user' ? 'Traveler' : 'AI Agent'}: ${h.text || h.content || ''}\n`;
      }
      fullPrompt += `Traveler: ${userPrompt}\n\nRespond ONLY with the structured JSON object:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const text = response.text ? (typeof response.text === 'function' ? response.text() : response.text) : null;
      if (text) {
        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
    } catch {}

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      });
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(userPrompt + '\n\nOutput only valid JSON matching structure.');
      const response = await result.response;
      const text = response.text();
      if (text) {
        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
    } catch {}
  }

  // 2. Groq AI (Llama 3.3 70B Fast Inference)
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION + '\nOutput ONLY valid JSON.' },
            ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content || h.text || '' })),
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (raw) return JSON.parse(raw);
      }
    } catch {}
  }

  // 3. OpenAI (GPT-4o-mini)
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content || h.text || '' })),
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (raw) return JSON.parse(raw);
      }
    } catch {}
  }

  // 4. OpenRouter (Universal AI Gateway)
  if (openrouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content || h.text || '' })),
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (raw) {
          const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(clean);
        }
      }
    } catch {}
  }

  return null;
}

// Universal Intelligent Travel Knowledge & Dynamic AI Planner
function generateUniversalTravelPlan(userPrompt, history = []) {
  const q = userPrompt.toLowerCase();
  const fullText = (history.map((h) => h.content || h.text || '').join(' ') + ' ' + userPrompt).toLowerCase();

  // Known Destinations Knowledge Base
  const destinationDB = {
    ooty: {
      name: 'Ooty, Nilgiris (Tamil Nadu)',
      state: 'Tamil Nadu',
      tagline: 'Queen of Hill Stations',
      defaultDuration: 3,
      avgBudget2P: 14000,
      transport: 'Nilgiri Express Train (to Mettupalayam) + Heritage Toy Train / State Hill Bus',
      stay: 'Hill-view homestays or heritage cottages near Lake Road & Charing Cross',
      food: 'Hot Ooty Varkey, Nilgiri homemade dark chocolates, green tea & traditional South Indian thalis',
      spots: ['Government Botanical Gardens', 'Ooty Lake Boating', 'Doddabetta Peak', 'Pykara Waterfalls', 'Pine Forest', 'Wenlock Downs', 'Nilgiri Toy Train'],
      daySchedules: [
        {
          title: 'Scenic Arrival, Botanical Garden & Lakeside Nature Stroll',
          morning: 'Arrive via scenic hill route, check in to cozy stay. Explore lush Government Botanical Garden (9:30 AM - 12:30 PM)',
          afternoon: 'Delicious Nilgiri lunch followed by pedal/motor boating on Ooty Lake (1:30 PM - 4:30 PM)',
          evening: 'Stroll around Commercial Road; sample fresh homemade chocolates and Nilgiri tea (5:30 PM - 7:30 PM)',
          places: ['Government Botanical Garden', 'Ooty Lake', 'Commercial Road'],
        },
        {
          title: 'High Peaks, Pykara Waterfalls & Fragrant Pine Forests',
          morning: 'Panoramic mountain views from Doddabetta Peak (highest in Nilgiris) and Tea Museum tour (8:30 AM - 12:00 PM)',
          afternoon: 'Scenic drive to Pykara Waterfalls, boating on Pykara Lake, and photography in the Pine Forest (1:00 PM - 4:30 PM)',
          evening: 'Sunset viewpoint at Wenlock Downs 9th Mile shooting meadows (5:00 PM - 7:00 PM)',
          places: ['Doddabetta Peak', 'Pykara Waterfalls', 'Pine Forest', 'Wenlock Downs'],
        },
        {
          title: 'UNESCO Mountain Toy Train, Coonoor & Return Journey',
          morning: 'Experience the heritage UNESCO Nilgiri Mountain Toy Train ride to Coonoor (9:00 AM - 12:30 PM)',
          afternoon: 'Visit Sim’s Park, Lamb’s Rock, and lush organic tea gardens in Coonoor (1:30 PM - 4:00 PM)',
          evening: 'Depart towards Chennai/Bangalore with wonderful mountain memories!',
          places: ['UNESCO Toy Train', "Sim's Park", "Lamb's Rock"],
        },
      ],
    },
    goa: {
      name: 'Goa (North & South Goa)',
      state: 'Goa',
      tagline: 'Sun, Sand & Coastal Serenity',
      defaultDuration: 4,
      avgBudget2P: 18000,
      transport: 'Flight to MOPA / Dabolim or Konkan Railway Train + self-drive scooter / cab',
      stay: 'Beachfront boutique resort or Portuguese heritage villa near Calangute/Candolim',
      food: 'Goan Fish Curry Thali, Bebinca dessert, Prawn Balchão, and seaside shacks',
      spots: ['Baga Beach', 'Fort Aguada', 'Anjuna Flea Market', 'Dudhsagar Waterfalls', 'Basilica of Bom Jesus', 'Palolem Beach'],
      daySchedules: [
        {
          title: 'Coastal Arrival, Calangute Beach & Sunset Shacks',
          morning: 'Arrive in Goa, check in to beach resort, relax and enjoy coastal sea breeze (10:00 AM - 1:00 PM)',
          afternoon: 'Authentic Goan seafood lunch, followed by watersports and relaxation at Calangute/Baga (2:00 PM - 5:00 PM)',
          evening: 'Sunset drinks at Tito’s Lane and seaside shack dining with live acoustic music (6:00 PM - 9:30 PM)',
          places: ['Calangute Beach', 'Baga Beach', "Tito's Lane"],
        },
        {
          title: 'Historic Forts, Anjuna Vibe & Chapora Sunset',
          morning: 'Explore 17th-century Fort Aguada and lighthouse with panoramic Arabian Sea views (9:00 AM - 12:00 PM)',
          afternoon: 'Beachside lunch at Vagator, followed by exploring bohemian Anjuna cafes (1:00 PM - 4:30 PM)',
          evening: 'Watch the golden sunset from the historic ramparts of Chapora Fort (Dil Chahta Hai point) (5:00 PM - 7:30 PM)',
          places: ['Fort Aguada', 'Vagator Beach', 'Chapora Fort'],
        },
        {
          title: 'UNESCO Old Goa Heritage & Mandovi River Cruise',
          morning: 'Visit UNESCO World Heritage Basilica of Bom Jesus and Se Cathedral (9:30 AM - 12:30 PM)',
          afternoon: 'Stroll through colorful Latin Quarter of Fontainhas in Panaji (1:30 PM - 4:30 PM)',
          evening: 'Evening scenic Mandovi River sunset cruise with Goan folk music & dance (5:30 PM - 8:00 PM)',
          places: ['Basilica of Bom Jesus', 'Fontainhas Panaji', 'Mandovi Sunset Cruise'],
        },
        {
          title: 'South Goa Palolem Serenity & Departure',
          morning: 'Drive to pristine crescent-shaped Palolem Beach & Butterfly Beach boat ride (9:00 AM - 1:00 PM)',
          afternoon: 'Beach cafe lunch and souvenir shopping in Margao market (1:30 PM - 4:30 PM)',
          evening: 'Board return flight/train with sun-kissed coastal memories!',
          places: ['Palolem Beach', 'Butterfly Beach', 'Margao'],
        },
      ],
    },
    kerala: {
      name: 'Kerala (Munnar & Alleppey)',
      state: 'Kerala',
      tagline: 'God’s Own Country',
      defaultDuration: 5,
      avgBudget2P: 22000,
      transport: 'Flight/Train to Kochi (COK) + Private cab through scenic Western Ghats',
      stay: 'Tea plantation resort in Munnar + Traditional Luxury Houseboat in Alleppey backwaters',
      food: 'Kerala Sadya on banana leaf, Appam with Stew, Karimeen Pollichathu, fresh coconut water',
      spots: ['Munnar Tea Estates', 'Eravikulam National Park', 'Mattupetty Dam', 'Alleppey Backwaters Houseboat', 'Fort Kochi'],
      daySchedules: [
        {
          title: 'Arrival in Kochi & Scenic Ascent to Munnar',
          morning: 'Arrive in Kochi, drive through misty Cheeyappara and Valara waterfalls to Munnar (9:00 AM - 1:30 PM)',
          afternoon: 'Check in to tea plantation resort; enjoy traditional Kerala lunch and spice garden tour (2:00 PM - 5:00 PM)',
          evening: 'Watch traditional Kathakali and Kalaripayattu martial arts cultural performance (6:00 PM - 8:00 PM)',
          places: ['Cheeyappara Falls', 'Munnar Tea Hills', 'Kathakali Center'],
        },
        {
          title: 'Eravikulam National Park & Tea Museum',
          morning: 'Morning safari in Eravikulam National Park (home to endangered Nilgiri Tahr) (8:30 AM - 12:00 PM)',
          afternoon: 'Visit Tata Tea Museum, learn tea processing, and visit scenic Mattupetty Dam & Echo Point (1:30 PM - 5:00 PM)',
          evening: 'Sunset walk through lush rolling green tea terraces (5:30 PM - 7:30 PM)',
          places: ['Eravikulam National Park', 'Tea Museum', 'Mattupetty Dam', 'Echo Point'],
        },
        {
          title: 'Transit to Alleppey & Houseboat Cruise Check-in',
          morning: 'Scenic descent from Munnar towards the backwaters of Alleppey (Alappuzha) (8:30 AM - 12:30 PM)',
          afternoon: 'Board your private traditional Kettuvallam Houseboat; cruise through palm-fringed canals (1:00 PM - 5:30 PM)',
          evening: 'Sunset over Vembanad Lake followed by fresh Karimeen fish dinner prepared by personal onboard chef (6:00 PM - 9:00 PM)',
          places: ['Alleppey Backwaters', 'Vembanad Lake', 'Canal Villages'],
        },
        {
          title: 'Fort Kochi Heritage, Chinese Fishing Nets & Departure',
          morning: 'Morning village canoe ride through narrow canals; check out and drive to Fort Kochi (9:00 AM - 12:00 PM)',
          afternoon: 'Explore historic Jewish Synagogue, Dutch Palace, and iconic cantilevered Chinese Fishing Nets (1:00 PM - 4:30 PM)',
          evening: 'Depart from Cochin International Airport with timeless Kerala memories!',
          places: ['Fort Kochi', 'Chinese Fishing Nets', 'Jew Town Synagogue'],
        },
      ],
    },
  };

  // Extract Destination (Check current query first, then history fallback)
  let destKey = 'ooty';
  let destName = 'Ooty, Tamil Nadu';
  let detectedCity = 'Ooty';

  // 1. Check current query first
  let found = false;
  for (const [key, data] of Object.entries(destinationDB)) {
    if (q.includes(key)) {
      destKey = key;
      destName = data.name;
      detectedCity = data.name.split(',')[0].trim();
      found = true;
      break;
    }
  }

  // 2. If not found in current query, check full history
  if (!found) {
    for (const [key, data] of Object.entries(destinationDB)) {
      if (fullText.includes(key)) {
        destKey = key;
        destName = data.name;
        detectedCity = data.name.split(',')[0].trim();
        found = true;
        break;
      }
    }
  }

  // 3. If still no destination provided, do NOT auto-fill or assume details!
  if (!found) {
    return {
      message: `👋 **Welcome! I'm your AI Travel Agent.**\n\nTo build your personalized day-wise smart itinerary, please tell me your travel details:\n\n* 📍 **Destination** (e.g. Ooty, Goa, Kerala, Kodaikanal, Manali, Bali, Paris)\n* ⏱️ **Duration / Days** (e.g. 3 days, 4 days, 5 days)\n* 👥 **Number of Travelers** (e.g. 2 people, solo, family of 4)\n* 💰 **Budget** (e.g. ₹15,000 or $500)\n\nSimply type your travel request below!`,
      isPlanReady: false,
      extractedRequirements: null,
      tripOverview: null,
      itinerary: [],
      recommendations: null,
      suggestions: [
        'Plan a 3-day trip to Ooty for 2 people with ₹15,000 budget',
        'Plan a 4-day Goa vacation for 2 people under ₹20,000',
        'Plan a 5-day Kerala family trip with Munnar & Alleppey',
        'Plan a 4-day Manali adventure trip for 4 friends',
      ],
    };
  }

  // Extract Origin
  let origin = 'Chennai';
  const indianCities = ['chennai', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'coimbatore', 'madurai', 'kochi', 'pune', 'kolkata'];
  for (const city of indianCities) {
    if (q.includes(`from ${city}`) || (q.includes(city) && !q.includes(`to ${city}`))) {
      origin = city.charAt(0).toUpperCase() + city.slice(1);
      if (origin === 'Bengaluru') origin = 'Bangalore';
      break;
    }
  }

  // Extract Days (Check current query first)
  let days = destinationDB[destKey].defaultDuration || 3;
  const qDaysMatch = q.match(/(\d+)[-\s]*(day|days|d\b)/);
  const histDaysMatch = fullText.match(/(\d+)[-\s]*(day|days|d\b)/);
  if (qDaysMatch && qDaysMatch[1]) {
    days = Math.min(Math.max(parseInt(qDaysMatch[1], 10), 1), 7);
  } else if (histDaysMatch && histDaysMatch[1]) {
    days = Math.min(Math.max(parseInt(histDaysMatch[1], 10), 1), 7);
  }

  // Extract Travelers (Check current query first)
  let travelers = 2;
  const qTravMatch = q.match(/(\d+)[-\s]*(people|person|traveler|travelers|pax|members|friends)/);
  const histTravMatch = fullText.match(/(\d+)[-\s]*(people|person|traveler|travelers|pax|members|friends)/);
  if (qTravMatch && qTravMatch[1]) {
    travelers = parseInt(qTravMatch[1], 10);
  } else if (histTravMatch && histTravMatch[1]) {
    travelers = parseInt(histTravMatch[1], 10);
  } else if (q.includes('solo') || q.includes('alone')) {
    travelers = 1;
  } else if (q.includes('family') || q.includes('friends')) {
    travelers = 4;
  }

  // Extract Budget (Check current query first)
  let budgetNum = destinationDB[destKey].avgBudget2P;
  let budgetStr = `₹${budgetNum.toLocaleString('en-IN')}`;
  const qBudgetMatch = q.match(/(?:₹|rs\.?|inr|budget\s*is?\s*(?:of)?\s*(?:₹|rs\.?)?)\s*(\d[\d,]*)/);
  const histBudgetMatch = fullText.match(/(?:₹|rs\.?|inr|budget\s*is?\s*(?:of)?\s*(?:₹|rs\.?)?)\s*(\d[\d,]*)/);
  if (qBudgetMatch && qBudgetMatch[1]) {
    const rawVal = parseInt(qBudgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawVal) && rawVal > 0) {
      budgetNum = rawVal;
      budgetStr = `₹${budgetNum.toLocaleString('en-IN')}`;
    }
  } else if (histBudgetMatch && histBudgetMatch[1]) {
    const rawVal = parseInt(histBudgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawVal) && rawVal > 0) {
      budgetNum = rawVal;
      budgetStr = `₹${budgetNum.toLocaleString('en-IN')}`;
    }
  }

  // Check if modification request is detected
  const isCheaper = q.includes('cheaper') || q.includes('reduce') || q.includes('lower') || q.includes('budget friendly') || q.includes('save money') || q.includes('less cost');
  const isAdventure = q.includes('adventure') || q.includes('trekking') || q.includes('hiking') || q.includes('thrill') || q.includes('sports');
  const isFamily = q.includes('child') || q.includes('kid') || q.includes('family') || q.includes('parents');
  const isLuxury = q.includes('luxury') || q.includes('5 star') || q.includes('resort') || q.includes('premium') || q.includes('vip');
  const isExtraDay = q.includes('extra day') || q.includes('one more day') || q.includes('extend');

  if (isExtraDay) days = Math.min(days + 1, 7);

  if (isCheaper) {
    budgetNum = Math.round(budgetNum * 0.65);
    budgetStr = `₹${budgetNum.toLocaleString('en-IN')} (Budget Optimized)`;
  } else if (isLuxury) {
    budgetNum = Math.round(budgetNum * 1.8);
    budgetStr = `₹${budgetNum.toLocaleString('en-IN')} (Luxury Class)`;
  }

  const destData = destinationDB[destKey];
  const schedules = destData.daySchedules.slice(0, days);

  // Pad schedules if user requested more days than default template
  while (schedules.length < days) {
    const nextDayNum = schedules.length + 1;
    schedules.push({
      title: `Extended Exploration & Hidden Gems of ${detectedCity}`,
      morning: `Explore picturesque countryside trails, organic plantations, and viewpoints (9:00 AM - 12:30 PM)`,
      afternoon: `Relaxed authentic dining and exploring artisan craft markets (1:30 PM - 4:30 PM)`,
      evening: `Sunset viewpoints, local specialty dining, and souvenir shopping (5:30 PM - 8:00 PM)`,
      places: [`${detectedCity} Countryside`, 'Local Artisan Market', 'Scenic Sunset Point'],
    });
  }

  // Itinerary generation
  const itinerary = schedules.map((s, idx) => ({
    day: idx + 1,
    title: s.title,
    morning: s.morning,
    afternoon: s.afternoon,
    evening: s.evening,
    places: s.places,
    estimatedDayCost: `₹${Math.round(budgetNum / days).toLocaleString('en-IN')} for ${travelers}`,
  }));

  // Construct response
  let heading = `### 🌟 Personalized Travel Plan: ${origin} to ${detectedCity} (${days} Days / ${travelers} Travelers)`;
  if (isCheaper) heading = `### 🌿 Optimized Budget-Friendly Itinerary: ${origin} to ${detectedCity} (${days} Days / ${travelers} Travelers)`;
  if (isAdventure) heading = `### 🧗 Adventure & Nature Itinerary: ${origin} to ${detectedCity} (${days} Days / ${travelers} Travelers)`;
  if (isFamily) heading = `### 👨‍👩‍👧 Family-Friendly Itinerary: ${origin} to ${detectedCity} (${days} Days / ${travelers} Travelers)`;

  const message = `${heading}\n\nI have crafted a complete, customized day-by-day plan tailored to your preferences with an estimated budget of **${budgetStr}** for **${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}**. Check out the day-by-day timeline on the right!`;

  return {
    message,
    isPlanReady: true,
    extractedRequirements: {
      origin,
      destination: detectedCity,
      days,
      travelers,
      budget: budgetStr,
      preferences: isAdventure ? ['Adventure', 'Trekking', 'Scenic Trails'] : isFamily ? ['Family Friendly', 'Leisure', 'Kid Safe'] : isCheaper ? ['Budget Optimized', 'Public Transit', 'Nature'] : ['Nature', 'Sightseeing', 'Scenic Views'],
      transportPreference: destData.transport.split('+')[0].trim(),
      accommodationPreference: isCheaper ? 'Budget-Friendly Verified Homestay' : isLuxury ? 'Luxury 5-Star Boutique Resort' : 'Scenic 3-Star Resort / Homestay',
    },
    tripOverview: {
      destination: destData.name,
      duration: `${days} Days / ${days - 1} Nights`,
      travelers: `${travelers} ${travelers === 1 ? 'Traveler' : 'Travelers'}`,
      estimatedBudget: budgetStr,
      travelStyle: isAdventure ? 'Adventure & Trekking' : isFamily ? 'Family & Leisure' : isCheaper ? 'Budget Exploration' : 'Nature & Sightseeing',
      highlightSummary: destData.spots.slice(0, 5).join(', ') + '.',
    },
    itinerary,
    recommendations: {
      transport: destData.transport,
      accommodation: isCheaper ? 'Verified budget cottages or backpacker homestays (₹900 - ₹1,400/night).' : isLuxury ? 'Luxury heritage suites & valley view villas (₹4,500 - ₹8,000/night).' : destData.stay,
      food: destData.food,
      budgetDistribution: isCheaper ? { transport: '25%', stays: '35%', food: '25%', activities: '15%' } : { transport: '28%', stays: '42%', food: '18%', activities: '12%' },
      topSpots: destData.spots,
    },
    suggestions: [
      'Make it cheaper and add more nature places',
      'Add more adventure activities',
      'Make it suitable for children',
      'How do I book this trip?',
    ],
  };
}

const aiAgentService = {
  /**
   * Process Traveler Message with Gemini AI, external providers, or dynamic knowledge engine
   */
  async processTravelQuery(sessionId = 'default_agent_session', userPrompt = '', context = {}) {
    const q = (userPrompt || '').trim();
    if (!q) {
      return {
        message: '👋 Welcome! Please tell me your starting location, destination, number of days, travelers, and budget!',
        isPlanReady: false,
        extractedRequirements: null,
        tripOverview: null,
        itinerary: [],
        recommendations: null,
        suggestions: [
          'I want to travel from Chennai to Ooty for 3 days with 2 people. Budget ₹15,000.',
          'Plan a 4-day Goa vacation for 2 people under ₹20,000.',
          'Plan a 5-day Kerala family trip with Munnar & Alleppey.',
        ],
      };
    }

    const sessionHistory = agentSessions.get(sessionId) || context.history || [];
    const keys = getApiKeys();

    let result = null;

    // 1. Try external AI (Gemini / Groq / OpenAI / OpenRouter) if keys exist
    if (keys.geminiKey || keys.groqKey || keys.openaiKey || keys.openrouterKey) {
      try {
        result = await callExternalAI(keys, q, sessionHistory);
      } catch (err) {
        console.warn('⚠️ External AI provider error, using universal dynamic planner engine:', err.message);
      }
    }

    // 2. Fall back to Universal Dynamic AI Planner
    if (!result || !result.isPlanReady) {
      result = generateUniversalTravelPlan(q, sessionHistory);
    }

    // Save to session history
    const updatedHistory = [
      ...sessionHistory,
      { role: 'user', content: q, timestamp: new Date().toISOString() },
      { role: 'assistant', content: result.message || 'Personalized plan generated', data: result, timestamp: new Date().toISOString() },
    ];
    agentSessions.set(sessionId, updatedHistory.slice(-16));

    return {
      ...result,
      sessionId,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Retrieve chat and planning history
   */
  getHistory(sessionId = 'default_agent_session') {
    return agentSessions.get(sessionId) || [];
  },

  /**
   * Reset session
   */
  clearHistory(sessionId = 'default_agent_session') {
    agentSessions.delete(sessionId);
    return true;
  },
};

module.exports = aiAgentService;
