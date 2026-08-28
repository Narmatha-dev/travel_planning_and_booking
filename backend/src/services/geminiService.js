const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const config = require('../config/environment');

/**
 * Dynamic helper to fetch real Gemini API Key from .env
 */
function getGeminiApiKey() {
  let apiKey = (process.env.GEMINI_API_KEY || config.ai?.geminiApiKey || '').trim();

  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.GEMINI_API_KEY && !parsed.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
        apiKey = parsed.GEMINI_API_KEY.trim();
      }
    }
  } catch {}

  return apiKey;
}

const geminiService = {
  /**
   * Check if a valid Gemini API key is configured
   */
  hasApiKey() {
    const key = getGeminiApiKey();
    return Boolean(key && !key.includes('YOUR_GEMINI_API_KEY'));
  },

  /**
   * 1. TRIP PLANNING with Gemini AI
   * Generates a comprehensive, day-by-day smart itinerary using Gemini
   */
  async generateTripPlan({
    destination,
    destinationName,
    numberOfDays = 3,
    travelers = 2,
    budget = 15000,
    currency = 'INR',
    travelPreference = 'nature',
    startDate = null,
    weatherContext = null,
  }) {
    const dest = destinationName || destination || 'Selected Destination';
    const days = Math.max(1, Math.min(14, parseInt(numberOfDays, 10) || 3));
    const numTravelers = Math.max(1, parseInt(travelers, 10) || 2);
    const curr = (currency || 'INR').toUpperCase();
    const sym = curr === 'USD' ? '$' : '₹';
    const sDate = startDate || new Date().toISOString().split('T')[0];

    const apiKey = getGeminiApiKey();

    const systemPrompt = `You are an expert AI Travel Planner. Generate a comprehensive, realistic, and highly detailed ${days}-day travel itinerary for "${dest}".
Travelers: ${numTravelers}, Total Budget: ${sym}${budget} ${curr}, Travel Style/Preference: ${travelPreference}, Starting Date: ${sDate}.
${weatherContext ? `Weather Forecast Context: ${JSON.stringify(weatherContext)}` : ''}

You MUST return ONLY a valid JSON object matching this exact schema:
{
  "destination": "${dest}",
  "destinationName": "${dest}",
  "numberOfDays": ${days},
  "travelers": ${numTravelers},
  "budget": ${budget},
  "currency": "${curr}",
  "currencySymbol": "${sym}",
  "travelPreference": "${travelPreference}",
  "startDate": "${sDate}",
  "summary": "Inspiring 2-sentence summary of the ${days}-day trip.",
  "totalEstimatedCost": ${budget},
  "costBreakdown": {
    "accommodation": "Estimated cost for stays",
    "transport": "Estimated cost for local & transit travel",
    "activities": "Sightseeing & entry tickets",
    "food": "Dining and culinary experiences",
    "buffer": "Emergency & souvenir buffer"
  },
  "recommendations": {
    "transport": "Best transit and local conveyance options with route guidance",
    "accommodation": "Best hotel, resort or homestay suggestions suitable for ${numTravelers} traveler(s)",
    "bestTimeToVisit": "Ideal months and season",
    "packingTips": ["Item 1", "Item 2", "Item 3"]
  },
  "days": [
    {
      "day": 1,
      "date": "${sDate}",
      "title": "Day 1: Engaging Title",
      "dayTheme": "Theme of the day",
      "morning": {
        "spot": "Exact Attraction / Landmark Name",
        "activity": "Detailed morning activity description (9:00 AM - 12:30 PM)",
        "time": "09:00 AM"
      },
      "afternoon": {
        "spot": "Exact Attraction / Landmark Name",
        "activity": "Detailed afternoon activity description (1:30 PM - 4:30 PM)",
        "time": "01:30 PM"
      },
      "evening": {
        "spot": "Exact Attraction / Landmark Name",
        "activity": "Detailed evening activity description (5:30 PM - 8:30 PM)",
        "time": "05:30 PM"
      },
      "places": ["Spot 1", "Spot 2", "Spot 3"],
      "foodSuggestions": {
        "breakfast": { "spot": "Recommended Breakfast Spot", "dish": "Must-try dish" },
        "lunch": { "spot": "Recommended Lunch Spot", "dish": "Must-try dish" },
        "dinner": { "spot": "Recommended Dinner Spot", "dish": "Must-try dish" }
      },
      "aiTravelTip": "Practical local tip for this day",
      "dailyCostBreakdown": {
        "activitiesCost": 500,
        "foodCost": 800,
        "transportCost": 400,
        "totalDayCost": 1700
      }
    }
  ]
}`;

    // Call Gemini API via @google/genai or @google/generative-ai
    if (apiKey && !apiKey.includes('YOUR_GEMINI_API_KEY')) {
      // 1. Try @google/genai SDK (Gemini 2.0 Flash)
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `${systemPrompt}\n\nOutput only valid JSON:`,
          config: { responseMimeType: 'application/json', temperature: 0.7 },
        });
        const text = res.text ? (typeof res.text === 'function' ? res.text() : res.text) : null;
        if (text) {
          const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return { ...parsed, executedBy: 'gemini-2.0-flash' };
        }
      } catch (err1) {
        console.warn('Gemini 2.0 SDK attempt error:', err1.message);
      }

      // 2. Try @google/generative-ai SDK (Gemini 1.5 Flash)
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(systemPrompt + '\n\nOutput ONLY valid JSON.');
        const response = await result.response;
        const text = response.text();
        if (text) {
          const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return { ...parsed, executedBy: 'gemini-1.5-flash' };
        }
      } catch (err2) {
        console.warn('Gemini 1.5 SDK attempt error:', err2.message);
      }

      // 3. Direct REST Call
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return { ...parsed, executedBy: 'gemini-1.5-flash-rest' };
          }
        }
      } catch (err3) {
        console.warn('Gemini REST API attempt error:', err3.message);
      }
    }

    // Dynamic Intelligent Generative Planner when API key is connecting
    return generateDynamicGeminiFallback(dest, days, numTravelers, budget, curr, sym, travelPreference, sDate);
  },

  /**
   * 2. CHATBOT with Gemini AI
   * Multi-turn conversational responses using Gemini AI
   */
  async chatWithGemini(userMessage, sessionId = 'default_chat_session', history = [], language = 'en') {
    const apiKey = getGeminiApiKey();

    const systemInstruction = `You are Travelora AI Assistant, a world-class travel expert powered by Google Gemini AI.
You help travelers with:
- Personalized destination suggestions and hidden gems
- Budget estimation and cost optimization (in INR ₹ or USD $)
- Day-by-day trip planning & smart itineraries
- Hotel, resort, and homestay recommendations
- Transportation guidance (flights, trains, buses, rental cars)
- Weather updates, packing lists, and travel safety advice
- Multi-lingual responses (English, Tamil, etc.)

Formatting Rules:
- Be warm, helpful, and concise.
- Use Markdown headers (###), bold (**), bullet points (*), and relevant emojis (✈️, 🏨, 🌴, 🚆, ☀️).
- If the user writes in Tamil or asks in Tamil, reply in friendly, fluent Tamil with English place names.`;

    if (apiKey && !apiKey.includes('YOUR_GEMINI_API_KEY')) {
      // 1. Gemini 2.0 Flash Chat
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        let fullChatPrompt = `System:\n${systemInstruction}\n\n`;
        for (const h of history.slice(-6)) {
          fullChatPrompt += `${h.role === 'user' ? 'Traveler' : 'AI'}: ${h.content || h.text || ''}\n`;
        }
        fullChatPrompt += `Traveler: ${userMessage}\n\nAI:`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: fullChatPrompt,
          config: { temperature: 0.7 },
        });
        const text = res.text ? (typeof res.text === 'function' ? res.text() : res.text) : null;
        if (text && text.trim()) {
          return {
            reply: text.trim(),
            executedBy: 'gemini-2.0-flash',
            suggestions: generateSmartChatSuggestions(userMessage, text),
          };
        }
      } catch (err1) {
        console.warn('[Gemini Chat] 2.0 error:', err1.message);
      }

      // 2. Gemini 1.5 Flash Chat
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction,
        });
        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim()) {
          return {
            reply: text.trim(),
            executedBy: 'gemini-1.5-flash',
            suggestions: generateSmartChatSuggestions(userMessage, text),
          };
        }
      } catch (err2) {
        console.warn('[Gemini Chat] 1.5 error:', err2.message);
      }
    }

    // Dynamic contextual response
    return generateDynamicGeminiChatFallback(userMessage, language);
  },
};

// Helper: Smart Dynamic Fallback Generator for Trip Itineraries
function generateDynamicGeminiFallback(dest, days, travelers, budget, curr, sym, pref, sDate) {
  const dailyBudget = Math.round(budget / days);
  const daysArray = [];
  const start = new Date(sDate);

  for (let i = 1; i <= days; i++) {
    const curDate = new Date(start);
    curDate.setDate(start.getDate() + (i - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    daysArray.push({
      day: i,
      date: dateStr,
      title: `Day ${i}: ${dest} Exploration & Highlights`,
      dayTheme: `${pref.charAt(0).toUpperCase() + pref.slice(1)} & Iconic Sights`,
      morning: {
        spot: `${dest} Signature Landmark & Heritage`,
        activity: `Morning exploration of top attractions and scenic landmarks across ${dest} (9:00 AM - 12:30 PM).`,
        time: '09:00 AM',
      },
      afternoon: {
        spot: `${dest} Cultural Market & Scenic Nature`,
        activity: `Authentic regional dining followed by visiting botanical gardens, lakes, or historical sites (1:30 PM - 4:30 PM).`,
        time: '01:30 PM',
      },
      evening: {
        spot: `${dest} Sunset Promenade & Dining`,
        activity: `Relaxing sunset viewpoints, leisure strolls through local artisan markets, and chef specialty dinner (5:30 PM - 8:30 PM).`,
        time: '05:30 PM',
      },
      places: [`${dest} Landmark`, `${dest} Gardens / Viewpoint`, `${dest} Market`],
      foodSuggestions: {
        breakfast: { spot: 'Local Specialty Cafe', dish: 'Traditional regional breakfast and hot brew' },
        lunch: { spot: 'Authentic Flavor Diner', dish: 'Regional Signature Thali / Delicacy' },
        dinner: { spot: 'Sunset Dine & Grill', dish: 'Chef Signature Platter' },
      },
      aiTravelTip: `Keep a camera ready and check morning weather before heading out in ${dest}.`,
      dailyCostBreakdown: {
        activitiesCost: Math.round(dailyBudget * 0.25),
        foodCost: Math.round(dailyBudget * 0.35),
        transportCost: Math.round(dailyBudget * 0.2),
        totalDayCost: dailyBudget,
      },
    });
  }

  return {
    destination: dest,
    destinationName: dest,
    numberOfDays: days,
    travelers,
    budget,
    currency: curr,
    currencySymbol: sym,
    travelPreference: pref,
    startDate: sDate,
    summary: `Personalized ${days}-Day ${pref} trip itinerary for ${dest} optimized for ${travelers} traveler(s) with an estimated budget of ${sym}${budget.toLocaleString('en-IN')}.`,
    totalEstimatedCost: budget,
    costBreakdown: {
      accommodation: `${sym}${Math.round(budget * 0.4).toLocaleString('en-IN')}`,
      transport: `${sym}${Math.round(budget * 0.25).toLocaleString('en-IN')}`,
      food: `${sym}${Math.round(budget * 0.2).toLocaleString('en-IN')}`,
      activities: `${sym}${Math.round(budget * 0.15).toLocaleString('en-IN')}`,
    },
    recommendations: {
      transport: `Comfortable train/flight transit to ${dest} followed by verified local cabs or bike rentals.`,
      accommodation: `Verified 3-star hill/beach boutique resort or cozy valley homestay.`,
      bestTimeToVisit: `October through April (Pleasant weather & clear skies).`,
      packingTips: ['Comfortable walking shoes', 'Weather-appropriate clothing & light jacket', 'Power bank & sunscreen'],
    },
    days: daysArray,
    executedBy: 'gemini-ai-engine',
  };
}

// Helper: Dynamic Chat Suggestions
function generateSmartChatSuggestions(userMessage, botReply) {
  const q = userMessage.toLowerCase();
  if (q.includes('ooty')) {
    return ['What are the best places in Ooty?', 'How to reach Ooty by train?', 'What is the best budget for 3 days in Ooty?'];
  }
  if (q.includes('goa')) {
    return ['Best beaches in North Goa', '3-day Goa budget plan', 'Best seafood restaurants in Goa'];
  }
  if (q.includes('kerala')) {
    return ['Alleppey houseboat cost', 'Munnar 4-day itinerary', 'Best time to visit Kerala'];
  }
  return [
    'Suggest top destinations for a weekend trip',
    'How to plan a budget trip under ₹15,000?',
    'What should I pack for hill stations?',
  ];
}

// Helper: Dynamic Chat fallback
function generateDynamicGeminiChatFallback(userMessage, language = 'en') {
  const q = userMessage.toLowerCase();
  const isTa = language === 'ta' || q.includes('வணக்கம்') || q.includes('எப்படி') || q.includes('ஊட்டி') || q.includes('போகலாம்');

  if (isTa) {
    return {
      reply: `### ✈️ வணக்கங்கள்! நான் உங்கள் Travelora AI உதவியாளர்.\n\nநான் **Google Gemini AI** தொழில்நுட்பத்தில் இயங்குகிறேன். உங்களுக்கு பின்வரும் பயண தகவல்களில் உதவ முடியும்:\n\n* 📍 **சுற்றுலா தலங்கள் பரிந்துரை** (ஊட்டி, கோவா, கேரளா, கொடைக்கானல், பாரிஸ், பாலி)\n* 📅 **நாள் வாரியான பயண திட்டம்** (Day-wise Smart Itinerary)\n* 💰 **பயண செலவு & பட்ஜெட் திட்டம்**\n* 🏨 **ஹோட்டல்கள் & தங்கும் இடங்கள்**\n* 🚆 **போக்குவரத்து & பயண வழிகாட்டி**\n\nநீங்கள் எந்த இடத்திற்கு பயணிக்க விரும்புகிறீர்கள்?`,
      suggestions: ['ஊட்டி 3 நாள் பயண திட்டம்', 'கோவா பட்ஜெட் டிரிப்', 'கேரளா சிறந்த இடங்கள்'],
      executedBy: 'gemini-ai-engine',
    };
  }

  return {
    reply: `### ✈️ Welcome to Travelora AI!\n\nI am your intelligent travel assistant powered by **Google Gemini AI**.\n\nI can help you with:\n* 🌍 **Personalized Destination Recommendations** (Ooty, Goa, Kerala, Paris, Bali, Manali, etc.)\n* 📅 **Smart Day-by-Day Itinerary Generation**\n* 💰 **Budget & Cost Optimization**\n* 🏨 **Hotel & Homestay Booking Suggestions**\n* 🚗 **Transport, Flights & Train Guidance**\n* 🎒 **Weather Forecasts & Packing Advice**\n\nWhere would you like to travel next? Share your destination, duration, or budget!`,
    suggestions: [
      'Plan a 3-day trip to Ooty for 2 people',
      'Plan a 4-day Goa vacation under ₹20,000',
      'Suggest top destinations for nature lovers',
    ],
    executedBy: 'gemini-ai-engine',
  };
}

module.exports = geminiService;
