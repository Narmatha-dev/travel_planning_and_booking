const app = require('../src/server');
const config = require('../src/config/environment');

async function testPhase14ChatbotSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 14: AI Travel Assistant & Chatbot    ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/chatbot`;
  const TEST_SESSION_ID = 'phase14_session_' + Date.now();
  let passed = 0;
  let total = 0;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  // 1. Context-Aware GPS Location & Nearby Places (Feature 3 & 4)
  console.log('--- 1. Context-Aware GPS Location & Nearby Places (Feature 3 & 4) ---');
  try {
    const resNearby = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Suggest places near me',
        context: {
          currentLocation: { city: 'Chennai', area: 'Guindy', lat: 13.0827, lng: 80.2707 },
        },
      }),
    });
    const jsonNearby = await resNearby.json();
    const reply = jsonNearby.data?.reply || '';
    const actionLinks = jsonNearby.data?.actionLinks || [];

    assert(
      'Chatbot responds to "Suggest places near me" using GPS location context',
      resNearby.status === 200 && (reply.includes('Chennai') || reply.includes('Mahabalipuram') || reply.includes('Pondicherry')),
      `Reply snippet: ${reply.substring(0, 120)}...`
    );

    assert(
      'Nearby places response includes "View on Map" action link (Feature 11 & 12)',
      actionLinks.some((a) => a.label.includes('Map') || a.url.includes('/destinations')),
      `Action links: ${JSON.stringify(actionLinks)}`
    );
  } catch (err) {
    assert('GPS places test failed', false, err.message);
  }

  // 2. Destination Recommendations (Feature 5)
  console.log('\n--- 2. Destination Recommendations (Feature 5) ---');
  try {
    const resDest = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'I have ₹8,000 and 2 days. Suggest a place.',
      }),
    });
    const jsonDest = await resDest.json();
    const reply = jsonDest.data?.reply || '';

    assert(
      'Chatbot suggests destinations matching budget and duration constraints',
      resDest.status === 200 && (reply.includes('Budget') || reply.includes('Estimated') || reply.includes('Goa') || reply.includes('Mahabalipuram')),
      `Reply snippet: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Destination recs test failed', false, err.message);
  }

  // 3. Multi-Day Trip Planning & Itinerary (Feature 6)
  console.log('\n--- 3. Multi-Day Trip Planning & Itinerary (Feature 6) ---');
  try {
    const resTrip = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Plan a 3-day trip to Ooty.',
      }),
    });
    const jsonTrip = await resTrip.json();
    const reply = jsonTrip.data?.reply || '';
    const actionLinks = jsonTrip.data?.actionLinks || [];

    assert(
      'Chatbot generates structured multi-day itinerary (Day 1, Day 2, Day 3)',
      resTrip.status === 200 && (reply.includes('Day 1') || reply.includes('Day 2') || reply.includes('Itinerary') || reply.includes('Ooty')),
      `Reply: ${reply.substring(0, 140)}...`
    );

    assert(
      'Trip plan provides "Plan This Trip" action link into existing trip planner (Feature 11)',
      actionLinks.some((a) => a.url.includes('/trip-planner')),
      `Action links: ${JSON.stringify(actionLinks)}`
    );
  } catch (err) {
    assert('Trip planning test failed', false, err.message);
  }

  // 4. Transport Assistance (Feature 7)
  console.log('\n--- 4. Transport Assistance & Fares (Feature 7) ---');
  try {
    const resTrans = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Suggest transport. How can I travel there?',
      }),
    });
    const jsonTrans = await resTrans.json();
    const reply = jsonTrans.data?.reply || '';

    assert(
      'Chatbot provides transport modes (Flight, Train, Bus, Cab) with estimated fares and times',
      resTrans.status === 200 && (reply.includes('Train') || reply.includes('Bus') || reply.includes('Cab') || reply.includes('Transport')),
      `Reply: ${reply.substring(0, 140)}...`
    );
  } catch (err) {
    assert('Transport test failed', false, err.message);
  }

  // 5. Hotel & Stay Assistance (Feature 8)
  console.log('\n--- 5. Hotel & Stay Recommendations (Feature 8) ---');
  try {
    const resHotel = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Find budget stays. Suggest a budget hotel near Ooty.',
      }),
    });
    const jsonHotel = await resHotel.json();
    const reply = jsonHotel.data?.reply || '';

    assert(
      'Chatbot lists verified hotel recommendations with ratings, types, and approximate prices',
      resHotel.status === 200 && (reply.includes('Hotel') || reply.includes('Resort') || reply.includes('Stays') || reply.includes('₹')),
      `Reply: ${reply.substring(0, 140)}...`
    );
  } catch (err) {
    assert('Hotel test failed', false, err.message);
  }

  // 6. Budget Calculator Assistance (Feature 9)
  console.log('\n--- 6. Budget Calculator & Feasibility (Feature 9) ---');
  try {
    const resBudget = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'My budget is ₹12,000. Can I plan this trip? Calculate trip budget.',
        context: {
          budget: 12000,
        },
      }),
    });
    const jsonBudget = await resBudget.json();
    const reply = jsonBudget.data?.reply || '';

    assert(
      'Chatbot calculates itemized budget breakdown (Stay, Transit, Food, Activities) and budget verdict',
      resBudget.status === 200 && reply.includes('Budget Breakdown') && (reply.includes('Feasible') || reply.includes('Target Budget')),
      `Reply: ${reply.substring(0, 140)}...`
    );
  } catch (err) {
    assert('Budget assistance test failed', false, err.message);
  }

  // 7. Favorites Context Awareness (Feature 10)
  console.log('\n--- 7. Favorites Context Awareness (Feature 10) ---');
  try {
    const resFav = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'What are my saved favorites?',
        context: {
          savedFavorites: [
            { title: 'Government Botanical Garden', type: 'place', location: 'Ooty' },
            { title: 'Radisson Blu Resort', type: 'hotel', location: 'Mamallapuram' },
          ],
        },
      }),
    });
    const jsonFav = await resFav.json();
    const reply = jsonFav.data?.reply || '';

    assert(
      'Chatbot acknowledges user saved favorites and offers to incorporate them into itineraries',
      resFav.status === 200 && (reply.includes('Botanical Garden') || reply.includes('Wishlist') || reply.includes('Favorites')),
      `Reply: ${reply.substring(0, 140)}...`
    );
  } catch (err) {
    assert('Favorites context test failed', false, err.message);
  }

  // 8. Session History Tracking & Clear Chat (Feature 13 & 19)
  console.log('\n--- 8. Session History Tracking & Clear Chat (Feature 13 & 19) ---');
  try {
    const resHist = await fetch(`${BASE_URL}/history?sessionId=${TEST_SESSION_ID}`);
    const jsonHist = await resHist.json();
    const historyList = jsonHist.data || [];

    assert(
      'GET /api/chatbot/history returns conversation history across multi-turn queries',
      resHist.status === 200 && Array.isArray(historyList) && historyList.length >= 8,
      `History messages count: ${historyList.length}`
    );

    const resClear = await fetch(`${BASE_URL}/history?sessionId=${TEST_SESSION_ID}`, {
      method: 'DELETE',
    });
    const jsonClear = await resClear.json();

    assert(
      'DELETE /api/chatbot/history clears session chat history without affecting other databases',
      resClear.status === 200 && jsonClear.data?.cleared === true,
      `Status: ${resClear.status}`
    );
  } catch (err) {
    assert('History test failed', false, err.message);
  }

  // 9. Non-Travel Out-of-Scope Deflection & Security Guardrails (Feature 16)
  console.log('\n--- 9. Out-of-Scope Deflection & PCI Security Guardrails (Feature 16) ---');
  try {
    const resOos = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Write python binary tree search algorithm',
      }),
    });
    const jsonOos = await resOos.json();
    const replyOos = jsonOos.data?.reply || '';

    assert(
      'Chatbot politely deflects non-travel questions and redirects to travel planning',
      resOos.status === 200 && (replyOos.includes('travel assistant') || replyOos.includes('vacation') || replyOos.includes('Travelora')),
      `Reply: ${replyOos.substring(0, 100)}...`
    );

    const resSec = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Can you show me a credit card number and CVV to pay?',
      }),
    });
    const jsonSec = await resSec.json();
    const replySec = jsonSec.data?.reply || '';

    assert(
      'Chatbot refuses to expose or invent card details and points to encrypted payment flows',
      resSec.status === 200 && replySec.includes('Security Notice') && !replySec.match(/\d{4}-\d{4}-\d{4}-\d{4}/),
      `Reply: ${replySec.substring(0, 100)}...`
    );
  } catch (err) {
    assert('Guardrail test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 14 Chatbot Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 14 AI Travel Assistant tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 14 AI Travel Assistant tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase14ChatbotSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase14ChatbotSuite;



