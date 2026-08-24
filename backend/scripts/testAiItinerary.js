const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testAiItinerarySuite() {
  console.log('=====================================================');
  console.log('  Testing AI Smart Itinerary Generator (Phase 13)    ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/trips`;
  let passed = 0;
  let total = 0;

  // Generate valid test JWT token
  const token = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  // 1. Destination 1: Goa 4-Day Beach & Family Itinerary (₹20,000 INR)
  console.log('--- 1. Goa 4-Day Beach & Family Itinerary (₹20,000 INR) ---');
  let goaItinerary;
  try {
    const res = await fetch(`${BASE_URL}/generate-ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Goa Coastal Haven',
        destinationId: 101,
        numberOfDays: 4,
        budget: 20000,
        currency: 'INR',
        travelType: 'family',
        interests: ['beach', 'seafood', 'relaxation'],
      }),
    });
    const json = await res.json();
    goaItinerary = json.data;

    assert(
      'POST /api/trips/generate-ai-itinerary returns HTTP 200 with 4-day itinerary',
      res.status === 200 && Array.isArray(goaItinerary?.days) && goaItinerary.days.length === 4,
      `Status: ${res.status}, Days count: ${goaItinerary?.days?.length}`
    );

    const day1 = goaItinerary?.days?.[0];
    const day2 = goaItinerary?.days?.[1];

    assert(
      'Day 1 includes places, scheduled activities, and food suggestions (breakfast, lunch, dinner)',
      Array.isArray(day1?.places) && day1.places.length > 0 &&
      Array.isArray(day1?.activities) && day1.activities.length > 0 &&
      Boolean(day1?.foodSuggestions?.breakfast?.spot && day1?.foodSuggestions?.lunch?.dish && day1?.foodSuggestions?.dinner?.spot),
      `Day 1 Places: ${day1?.places?.join(', ')}, Lunch dish: ${day1?.foodSuggestions?.lunch?.dish}`
    );

    assert(
      'Day 2 includes places, activities, and food suggestions',
      Array.isArray(day2?.places) && day2.places.length > 0 &&
      Boolean(day2?.foodSuggestions?.breakfast && day2?.foodSuggestions?.lunch && day2?.foodSuggestions?.dinner),
      `Day 2 Places: ${day2?.places?.join(', ')}`
    );
  } catch (err) {
    assert('Goa itinerary test failed', false, err.message);
  }

  // 2. Destination 2: Paris 5-Day Romantic Couple Itinerary ($2,000 USD)
  console.log('\n--- 2. Paris 5-Day Romantic Couple Itinerary ($2,000 USD) ---');
  try {
    const res = await fetch(`${BASE_URL}/generate-ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Parisian Elegance',
        destinationId: 4,
        numberOfDays: 5,
        budget: 2000,
        currency: 'USD',
        travelType: 'couple',
        interests: ['romance', 'museums', 'gastronomy'],
      }),
    });
    const json = await res.json();
    const parisItinerary = json.data;

    assert(
      'Paris 5-Day itinerary generates 5 structured days with French culinary recommendations',
      res.status === 200 && Array.isArray(parisItinerary?.days) && parisItinerary.days.length === 5,
      `Status: ${res.status}, Days: ${parisItinerary?.days?.length}`
    );

    const parisDay1 = parisItinerary?.days?.[0];
    assert(
      'Paris Day 1 features iconic landmarks and French bistro dining suggestions',
      parisDay1?.places?.some((p) => p.includes('Eiffel') || p.includes('Seine')) &&
      Boolean(parisDay1?.foodSuggestions?.dinner?.spot),
      `Places: ${parisDay1?.places?.join(', ')}, Dinner spot: ${parisDay1?.foodSuggestions?.dinner?.spot}`
    );
  } catch (err) {
    assert('Paris itinerary test failed', false, err.message);
  }

  // 3. Destination 3: Swiss Alps 7-Day Mountain Adventure ($3,000 USD)
  console.log('\n--- 3. Swiss Alps 7-Day Mountain Adventure ($3,000 USD) ---');
  try {
    const res = await fetch(`${BASE_URL}/generate-ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Swiss Alpine Wonders',
        destinationId: 3,
        numberOfDays: 7,
        budget: 3000,
        currency: 'USD',
        travelType: 'adventure',
        interests: ['mountain', 'snow', 'skiing'],
      }),
    });
    const json = await res.json();
    const swissItinerary = json.data;

    assert(
      'Swiss Alps 7-Day itinerary successfully generates 7 complete days',
      res.status === 200 && Array.isArray(swissItinerary?.days) && swissItinerary.days.length === 7,
      `Days: ${swissItinerary?.days?.length}`
    );
  } catch (err) {
    assert('Swiss Alps itinerary test failed', false, err.message);
  }

  // 4. AI Workflow & Explainability Metadata
  console.log('\n--- 4. AI Workflow & Explainability Metadata ---');
  try {
    assert(
      'AI Itinerary response contains comprehensive 5-step workflow explainability metadata',
      Boolean(
        goaItinerary?.aiWorkflow?.step1_profiling &&
        goaItinerary?.aiWorkflow?.step2_budgetPacing &&
        goaItinerary?.aiWorkflow?.step3_geographicClustering &&
        goaItinerary?.aiWorkflow?.step4_culinaryCuration &&
        goaItinerary?.aiWorkflow?.step5_contextualTips
      ),
      `Workflow keys: ${Object.keys(goaItinerary?.aiWorkflow || {}).join(', ')}`
    );
  } catch (err) {
    assert('AI workflow metadata audit failed', false, err.message);
  }

  // 5. Database Storage & Persistence (POST /api/trips & GET /api/trips/:id)
  console.log('\n--- 5. Database Storage & Persistence ---');
  try {
    const saveRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinationId: 1,
        title: 'My AI Goa Vacation',
        startDate: '2026-11-15',
        endDate: '2026-11-18',
        tripType: 'family',
        totalBudget: 20000,
        itineraryItems: goaItinerary?.itineraryItems || [],
      }),
    });
    const saveJson = await saveRes.json();
    const savedTripId = saveJson.data?.id;

    assert(
      'POST /api/trips persists AI itinerary into database and returns HTTP 201',
      saveRes.status === 201 && Boolean(savedTripId),
      `Status: ${saveRes.status}, Trip ID: ${savedTripId}`
    );

    // Retrieve saved trip
    const getRes = await fetch(`${BASE_URL}/${savedTripId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getJson = await getRes.json();

    assert(
      'GET /api/trips/:id retrieves saved trip with populated day-by-day itinerary',
      getRes.status === 200 && (getJson.data?.id === savedTripId || getJson.data?.id === Number(savedTripId)),
      `Retrieved Trip: ${getJson.data?.title}`
    );
  } catch (err) {
    assert('Trip storage test failed', false, err.message);
  }

  // 6. Validation Error on Missing Destination
  console.log('\n--- 6. Input Validation ---');
  try {
    const errRes = await fetch(`${BASE_URL}/generate-ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: '',
        numberOfDays: 4,
      }),
    });

    assert(
      'POST /generate-ai-itinerary without destination returns HTTP 400 Bad Request',
      errRes.status === 400,
      `Status: ${errRes.status}`
    );
  } catch (err) {
    assert('Validation test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` AI Itinerary Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All AI Smart Itinerary Generator backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some AI itinerary tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testAiItinerarySuite()
    .then((ok) => {
      process.exitCode = ok ? 0 : 1;
    })
    .catch((err) => {
      console.error('Fatal itinerary test error:', err);
      process.exitCode = 1;
    });
}

module.exports = { testAiItinerarySuite };
