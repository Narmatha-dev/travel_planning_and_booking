// In-memory session chat history store
const sessionHistories = new Map();

// Curated travel domain knowledge base
const KNOWLEDGE_BASE = {
  destinations: [
    {
      name: 'Goa',
      country: 'India',
      category: 'Beach & Coastal',
      bestTime: 'November to March (Pleasant 28°C sunny weather)',
      dailyCostINR: '₹3,500 - ₹5,000 / day',
      dailyCostUSD: '$45 - $65 / day',
      idealDuration: '3 to 5 Days',
      highlights: 'Calangute & Baga beaches, Aguada Fort, Mandovi sunset river cruise, Fontainhas Latin quarter, authentic Goan seafood.',
      link: '/destinations',
    },
    {
      name: 'Kerala',
      country: 'India',
      category: 'Backwaters & Wellness',
      bestTime: 'September to March (Cooler lush tropical breezes)',
      dailyCostINR: '₹4,000 - ₹6,500 / day',
      dailyCostUSD: '$50 - $75 / day',
      idealDuration: '4 to 7 Days',
      highlights: 'Alleppey luxury houseboats, Munnar tea plantation trails, Fort Kochi Chinese fishing nets, Ayurvedic rejuvenation spas.',
      link: '/destinations',
    },
    {
      name: 'Bali',
      country: 'Indonesia',
      category: 'Tropical & Cultural',
      bestTime: 'April to October (Dry sunny season, 27°C - 30°C)',
      dailyCostINR: '₹6,000 - ₹9,000 / day',
      dailyCostUSD: '$75 - $110 / day',
      idealDuration: '5 to 9 Days',
      highlights: 'Ubud emerald rice terraces, Uluwatu cliff temple, Mount Batur sunrise volcano trek, private jungle pool villas.',
      link: '/destinations/1',
    },
    {
      name: 'Swiss Alps',
      country: 'Switzerland',
      category: 'Mountain & Adventure',
      bestTime: 'June to Sept (Hiking) & Dec to March (Skiing)',
      dailyCostINR: '₹15,000 - ₹22,000 / day',
      dailyCostUSD: '$180 - $260 / day',
      idealDuration: '5 to 9 Days',
      highlights: 'Matterhorn views in Zermatt, Jungfraujoch Top of Europe, Glacier 3000 suspension walk, Lake Geneva cruises.',
      link: '/destinations/3',
    },
    {
      name: 'Paris',
      country: 'France',
      category: 'Romance & Culture',
      bestTime: 'April to June & September to November',
      dailyCostINR: '₹12,000 - ₹18,000 / day',
      dailyCostUSD: '$140 - $220 / day',
      idealDuration: '4 to 7 Days',
      highlights: 'Eiffel Tower summit, Louvre Museum Mona Lisa tour, illuminated Seine River dinner cruises, Palace of Versailles.',
      link: '/destinations/4',
    },
    {
      name: 'Tokyo & Kyoto',
      country: 'Japan',
      category: 'Culture & Modernity',
      bestTime: 'March to May (Cherry Blossoms) & Oct to Nov (Autumn Foliage)',
      dailyCostINR: '₹11,000 - ₹17,000 / day',
      dailyCostUSD: '$130 - $200 / day',
      idealDuration: '7 to 12 Days',
      highlights: 'Fushimi Inari 10,000 torii gates, Shibuya crossing, Shinkansen bullet train, Gion traditional tea ceremonies.',
      link: '/destinations/2',
    },
    {
      name: 'Santorini',
      country: 'Greece',
      category: 'Island & Luxury Romance',
      bestTime: 'May to October (Sunny Mediterranean, 26°C - 31°C)',
      dailyCostINR: '₹13,500 - ₹20,000 / day',
      dailyCostUSD: '$160 - $240 / day',
      idealDuration: '4 to 6 Days',
      highlights: 'Oia cliffside caldera sunset, black sand volcanic beaches, catamaran caldera sailing, Assyrtiko wine tasting.',
      link: '/destinations/5',
    },
    {
      name: 'Serengeti',
      country: 'Tanzania',
      category: 'Wildlife & Safari',
      bestTime: 'June to October (Great Migration & dry season)',
      dailyCostINR: '₹17,000 - ₹26,000 / day',
      dailyCostUSD: '$200 - $320 / day',
      idealDuration: '5 to 8 Days',
      highlights: 'Big Five 4x4 safari game drives, sunrise hot air balloon flight over savanna, Ngorongoro Crater, luxury tented camps.',
      link: '/destinations/6',
    },
  ],

  packages: [
    {
      title: 'Bali Tropical Bliss & Yoga Retreat',
      price: '$1,099 (₹93,415)',
      duration: '7 Days / 6 Nights',
      type: 'Standard / Wellness',
      inclusions: '4-star boutique resort, daily breakfast, airport transfers, Ubud rice terrace tour, Uluwatu sunset temple tour.',
      exclusions: 'International flights, personal expenses, travel insurance.',
      link: '/packages/1',
    },
    {
      title: 'Swiss Alps Grand Explorer',
      price: '$3,199 (₹2,71,915)',
      duration: '8 Days / 7 Nights',
      type: 'Luxury Alpine',
      inclusions: '5-star Zermatt chalet stay, Swiss Travel Pass, Jungfraujoch Top of Europe rail excursion, daily alpine breakfast & fondue dinner.',
      exclusions: 'Ski rental gear, visa processing fees.',
      link: '/packages/3',
    },
    {
      title: 'Romantic Paris & Versailles Getaway',
      price: '$1,699 (₹1,44,415)',
      duration: '6 Days / 5 Nights',
      type: 'City Break & Romance',
      inclusions: 'Central boutique hotel near Seine, Louvre skip-the-line pass, Seine dinner cruise, Versailles palace day tour.',
      exclusions: 'City tourist tax, lunch meals.',
      link: '/packages/4',
    },
    {
      title: 'Grand Japan Explorer: Tokyo to Kyoto',
      price: '$2,699 (₹2,29,415)',
      duration: '10 Days / 9 Nights',
      type: 'Cultural Heritage',
      inclusions: '7-Day JR Bullet Train pass, 4-star hotels in Tokyo & Kyoto, traditional tea ceremony, guided Fushimi Inari walk.',
      exclusions: 'Personal shopping, optional museum tickets.',
      link: '/packages/2',
    },
  ],

  bookingPolicies: {
    cancellation: 'Free cancellation up to 48 hours prior to your scheduled trip start date with a 100% full refund.',
    paymentMethods: 'We support all major Credit Cards (Visa, MasterCard, Amex), Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Net Banking.',
    security: 'Bank-grade 256-bit SSL encryption. We adhere to strict PCI compliance and never store sensitive CVVs, passwords, or full card numbers.',
    confirmation: 'Instant digital confirmation with unique booking reference ID (e.g. BK-2026-XXXX) and printable receipts available under My Trips.',
    reviews: 'Only verified travelers with confirmed bookings can submit ratings and reviews to guarantee 100% authentic feedback.',
  },
};

const chatbotService = {
  /**
   * Process incoming user question and generate AI travel response
   */
  async processMessage(sessionId = 'default', userMessage = '') {
    const rawQuery = String(userMessage || '').trim();
    const query = rawQuery.toLowerCase();

    if (!rawQuery) {
      return {
        reply: 'Hello! I am Travelora’s AI Travel Assistant. How can I assist with your vacation planning today? Ask me about destinations, curated packages, budget planning, or booking policies!',
        suggestions: ['Best beach for ₹20,000', 'Tell me about Swiss Alps package', 'What is your cancellation policy?'],
      };
    }

    let history = sessionHistories.get(sessionId) || [];

    // Guardrail Check: Never invent or expose private booking credentials or card numbers
    if (
      query.includes('card number') ||
      query.includes('cvv') ||
      query.includes('password') ||
      query.includes('credit card details') ||
      query.includes('fake booking') ||
      query.includes('hack')
    ) {
      const guardrailReply =
        '🔒 **Security Notice**: For your protection, Travelora never shares or requests sensitive card numbers, CVVs, or passwords. To manage your real bookings and payments safely, please visit your encrypted [My Trips Dashboard](/my-trips).';
      
      this.recordMessage(sessionId, rawQuery, guardrailReply);
      return {
        reply: guardrailReply,
        suggestions: ['How to view my bookings', 'What payment methods are supported?'],
      };
    }

    let reply = '';
    const suggestions = [];
    const actionLinks = [];

    // 1. Booking Policy & Cancellation Queries
    if (
      query.includes('cancel') ||
      query.includes('refund') ||
      query.includes('payment') ||
      query.includes('policy') ||
      query.includes('how to book') ||
      query.includes('upi') ||
      query.includes('security')
    ) {
      reply = `### 📋 Travelora Booking & Payment Policies\n\n` +
        `Here are the key details regarding bookings on Travelora:\n\n` +
        `* **Cancellation & Refunds:** ${KNOWLEDGE_BASE.bookingPolicies.cancellation}\n` +
        `* **Payment Methods:** ${KNOWLEDGE_BASE.bookingPolicies.paymentMethods}\n` +
        `* **Security & Privacy:** ${KNOWLEDGE_BASE.bookingPolicies.security}\n` +
        `* **Instant Confirmation:** ${KNOWLEDGE_BASE.bookingPolicies.confirmation}\n` +
        `* **Verified Reviews:** ${KNOWLEDGE_BASE.bookingPolicies.reviews}\n\n` +
        `You can easily view and manage your confirmed reservations under [My Trips](/my-trips).`;

      suggestions.push('How to book a package', 'Recommend a budget trip', 'Top destinations');
      actionLinks.push({ label: 'View My Trips', url: '/my-trips' });
    }

    // 2. Package Inquiry Queries (Curated Packages, Deals, Inclusions)
    else if (
      query.includes('package') ||
      query.includes('deal') ||
      query.includes('inclusion') ||
      query.includes('exclusion') ||
      query.includes('tour cost')
    ) {
      const matchedPkg = KNOWLEDGE_BASE.packages.find((p) =>
        query.includes('swiss') && p.title.includes('Swiss') ||
        query.includes('paris') && p.title.includes('Paris') ||
        query.includes('bali') && p.title.includes('Bali') ||
        query.includes('japan') && p.title.includes('Japan') ||
        query.includes('tokyo') && p.title.includes('Japan') ||
        query.includes(p.title.toLowerCase().split(' ')[0])
      ) || KNOWLEDGE_BASE.packages[0];

      reply = `### 📦 Curated Package: ${matchedPkg.title}\n\n` +
        `* 💵 **Price:** **${matchedPkg.price}** per traveler\n` +
        `* ⏳ **Duration:** ${matchedPkg.duration}\n` +
        `* 🏷️ **Travel Style:** ${matchedPkg.type}\n\n` +
        `#### ✅ Included in Package:\n${matchedPkg.inclusions}\n\n` +
        `#### ❌ Excluded:\n${matchedPkg.exclusions}\n\n` +
        `*Includes instant booking confirmation & 48-hour free cancellation.*`;

      suggestions.push('How do I book this package?', 'Show all available packages', 'What is the cancellation policy?');
      actionLinks.push({ label: 'View Package Details', url: matchedPkg.link });
      actionLinks.push({ label: 'Instant Booking', url: `/booking?packageId=1` });
    }

    // 3. Destination Queries (Goa, Bali, Paris, Swiss Alps, Kerala, Tokyo, Santorini, etc.)
    else if (
      query.includes('goa') ||
      query.includes('bali') ||
      query.includes('paris') ||
      query.includes('swiss') ||
      query.includes('alps') ||
      query.includes('kerala') ||
      query.includes('tokyo') ||
      query.includes('kyoto') ||
      query.includes('japan') ||
      query.includes('santorini') ||
      query.includes('greece') ||
      query.includes('serengeti') ||
      query.includes('tanzania') ||
      query.includes('best time to visit') ||
      query.includes('weather') ||
      query.includes('destination')
    ) {
      // Find matching destination in knowledge base
      const matchedDest = KNOWLEDGE_BASE.destinations.find((d) =>
        query.includes(d.name.toLowerCase()) || query.includes(d.country.toLowerCase())
      ) || KNOWLEDGE_BASE.destinations[0]; // fallback to Goa/Bali

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

    // 4. Budget & Duration Planning Queries
    else if (
      query.includes('budget') ||
      query.includes('cost') ||
      query.includes('price') ||
      query.includes('20000') ||
      query.includes('20,000') ||
      query.includes('duration') ||
      query.includes('how many days') ||
      query.includes('cheap')
    ) {
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

    // 5. Activities & Adventure Queries
    else if (
      query.includes('activit') ||
      query.includes('scuba') ||
      query.includes('surf') ||
      query.includes('ski') ||
      query.includes('trek') ||
      query.includes('safari') ||
      query.includes('watersport')
    ) {
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

    // 6. Generic Friendly AI Travel Assistance
    else {
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

    this.recordMessage(sessionId, rawQuery, reply);

    return {
      reply,
      suggestions,
      actionLinks,
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
    return true;
  },
};

module.exports = chatbotService;
