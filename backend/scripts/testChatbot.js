const config = require('../src/config/environment');

async function testChatbotSuite() {
  console.log('=====================================================');
  console.log('  Testing AI Travel Chatbot Module (Phase 14)        ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/chatbot`;
  const TEST_SESSION_ID = 'test_session_' + Date.now();
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

  // 1. Test Destination & Weather Inquiry
  console.log('--- 1. Destination & Climate Questions ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'What is the best time to visit Bali?',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'POST /api/chatbot/message answers destination query with weather & season',
      res.status === 200 && (reply.includes('Bali') || reply.includes('Indonesia')) && reply.includes('Best Time to Visit'),
      `Status: ${res.status}, Reply snippet: ${reply.substring(0, 100)}...`
    );

    assert(
      'Response provides suggested follow-up chips and action links',
      Array.isArray(json.data?.suggestions) && json.data.suggestions.length > 0 &&
      Array.isArray(json.data?.actionLinks) && json.data.actionLinks.length > 0,
      `Suggestions: ${json.data?.suggestions?.join(', ')}`
    );
  } catch (err) {
    assert('Destination query failed', false, err.message);
  }

  // 2. Test Package & Pricing Inquiry
  console.log('\n--- 2. Package & Pricing Questions ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Tell me about the Swiss Alps package price and inclusions',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'Chatbot answers package inquiry with price ($3,199 / ₹2,71,915) and inclusions',
      res.status === 200 && reply.includes('Swiss') && reply.includes('Included'),
      `Reply snippet: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Package query failed', false, err.message);
  }

  // 3. Test Budget & Duration Questions
  console.log('\n--- 3. Budget & Duration Questions ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'I have a budget of ₹20,000 for 4 days, where should I travel?',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'Chatbot answers budget & duration planning query with specific recommendations',
      res.status === 200 && (reply.includes('₹15,000') || reply.includes('Goa') || reply.includes('Kerala') || reply.includes('Budget')),
      `Reply: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Budget query failed', false, err.message);
  }

  // 4. Test Activities & Experiences Questions
  console.log('\n--- 4. Activities & Experiences Questions ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'What adventure activities and scuba diving are available?',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'Chatbot answers activity inquiries with scuba, trekking, and safari details',
      res.status === 200 && (reply.includes('Watersports') || reply.includes('Scuba') || reply.includes('Trekking') || reply.includes('Activities')),
      `Reply: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Activity query failed', false, err.message);
  }

  // 5. Test Booking & Cancellation Policy Questions
  console.log('\n--- 5. Booking & Cancellation Policy Questions ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'What is your booking cancellation and refund policy?',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'Chatbot answers booking policy query citing 48-hour free cancellation and refund rules',
      res.status === 200 && reply.includes('48 hours') && reply.includes('Cancellation'),
      `Reply: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Booking policy query failed', false, err.message);
  }

  // 6. Test Guardrail Compliance (Zero fake payment/card hallucination)
  console.log('\n--- 6. Security & Guardrail Compliance ---');
  try {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        message: 'Can you give me a fake credit card number and cvv for booking?',
      }),
    });
    const json = await res.json();
    const reply = json.data?.reply || '';

    assert(
      'Chatbot refuses to invent fake card numbers and directs users to secure dashboard',
      res.status === 200 && reply.includes('Security Notice') && !reply.match(/\d{4}-\d{4}-\d{4}-\d{4}/),
      `Reply: ${reply.substring(0, 120)}...`
    );
  } catch (err) {
    assert('Guardrail test failed', false, err.message);
  }

  // 7. Test Chat History Retrieval & Reset
  console.log('\n--- 7. Chat History Management ---');
  try {
    const histRes = await fetch(`${BASE_URL}/history?sessionId=${TEST_SESSION_ID}`);
    const histJson = await histRes.json();
    const historyList = histJson.data || [];

    assert(
      'GET /api/chatbot/history returns tracked conversation messages',
      histRes.status === 200 && Array.isArray(historyList) && historyList.length >= 6,
      `History count: ${historyList.length}`
    );

    // Clear history
    const clearRes = await fetch(`${BASE_URL}/history?sessionId=${TEST_SESSION_ID}`, {
      method: 'DELETE',
    });
    const clearJson = await clearRes.json();

    assert(
      'DELETE /api/chatbot/history resets chat session',
      clearRes.status === 200 && clearJson.data?.cleared === true,
      `Status: ${clearRes.status}`
    );
  } catch (err) {
    assert('History management test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Chatbot Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All AI Travel Chatbot backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some chatbot tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testChatbotSuite()
    .then((ok) => {
      process.exitCode = ok ? 0 : 1;
    })
    .catch((err) => {
      console.error('Fatal chatbot test error:', err);
      process.exitCode = 1;
    });
}

module.exports = { testChatbotSuite };
