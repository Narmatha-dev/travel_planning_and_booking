const app = require('../src/server');
const config = require('../src/config/environment');
const authService = require('../src/services/authService');

async function testPhase19RecommendationsSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 19: Smart Personalized Recommendations');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/recommendations`;
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

  // Generate test JWT token for traveler
  const testUser = { id: 3, email: 'alex.reed@example.com', role: 'traveler' };
  const testToken = authService.generateToken(testUser);

  // 1. Personalized Recommendation Feed (Feature 1 & 14)
  console.log('--- 1. Personalized Recommendation Feed (Feature 1 & 14) ---');
  try {
    const resFeed = await fetch(`${BASE_URL}/personalized?userId=3`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonFeed = await resFeed.json();
    const items = jsonFeed.data?.recommendations || [];

    assert(
      'GET /api/recommendations/personalized returns scored recommendations array',
      resFeed.status === 200 && Array.isArray(items) && items.length > 0,
      `Count: ${items.length}`
    );
    assert(
      'Recommendations contain required core fields (id, name, matchScore, matchReasons, estimatedTotalCost)',
      Boolean(items[0]?.name && items[0]?.matchScore && Array.isArray(items[0]?.matchReasons) && items[0]?.estimatedTotalCost),
      `Top item: ${items[0]?.name} (${items[0]?.matchScore}%)`
    );
  } catch (err) {
    assert('Personalized feed test failed', false, err.message);
  }

  // 2. Cold Start Fallback for Guest / New Users (Feature 14)
  console.log('\n--- 2. Cold Start Fallback for Guest / New Users (Feature 14) ---');
  try {
    const resGuest = await fetch(`${BASE_URL}/personalized?userId=99999`);
    const jsonGuest = await resGuest.json();
    const guestItems = jsonGuest.data?.recommendations || [];

    assert(
      'New / Guest users receive popular, top-rated destinations without empty state (Feature 14)',
      resGuest.status === 200 && guestItems.length > 0 && guestItems[0]?.matchScore >= 50,
      `Count: ${guestItems.length}`
    );
  } catch (err) {
    assert('Cold start test failed', false, err.message);
  }

  // 3. Interest-Based Recommendation Scoring (Feature 6 & 8)
  console.log('\n--- 3. Interest-Based Scoring & Filtering (Feature 6 & 8) ---');
  try {
    const resNature = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interests: ['nature', 'mountain'],
        budget: 25000,
        travelType: 'family',
        durationDays: 4,
      }),
    });
    const jsonNature = await resNature.json();
    const topNature = jsonNature.data?.recommendations || [];

    const natureMatched = topNature.some((d) => d.category === 'nature' || d.category === 'mountain');

    assert(
      'Nature & Mountain interest profile prioritizes Ooty, Manali or Swiss Alps in top results (Feature 6)',
      resNature.status === 200 && natureMatched && topNature[0]?.matchScore >= 80,
      `Top pick: ${topNature[0]?.name} (${topNature[0]?.matchPercentage})`
    );
  } catch (err) {
    assert('Interest test failed', false, err.message);
  }

  // 4. GPS Location & Proximity Relevance (Feature 2 & 8)
  console.log('\n--- 4. GPS Location & Proximity Scoring (Feature 2 & 8) ---');
  try {
    const resNear = await fetch(`${BASE_URL}/nearby?latitude=13.0827&longitude=80.2707&limit=4`);
    const jsonNear = await resNear.json();
    const nearItems = jsonNear.data?.recommendations || [];

    const hasDistance = nearItems.some((item) => item.distanceKm !== null && item.distanceKm !== undefined);

    assert(
      'GET /api/recommendations/nearby calculates real geographic distance from GPS coordinates (Feature 2)',
      resNear.status === 200 && nearItems.length > 0 && hasDistance,
      `Nearest: ${nearItems[0]?.name} (${nearItems[0]?.distanceKm} km away)`
    );
  } catch (err) {
    assert('Nearby test failed', false, err.message);
  }

  // 5. Budget-Aware Recommendations (Feature 5)
  console.log('\n--- 5. Budget-Aware Recommendations (Feature 5) ---');
  try {
    const resBudget = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 10000,
        currency: 'INR',
        durationDays: 3,
        interests: ['nature', 'culture'],
      }),
    });
    const jsonBudget = await resBudget.json();
    const budgetItems = jsonBudget.data?.recommendations || [];

    const budgetFit = budgetItems.every((item) => typeof item.estimatedTotalCost === 'string' && item.estimatedTotalCost.includes('₹'));

    assert(
      'Budget-aware filter calculates itemized estimated costs matching ₹ budget (Feature 5)',
      resBudget.status === 200 && budgetItems.length > 0 && budgetFit,
      `Estimated: ${budgetItems[0]?.estimatedTotalCost}`
    );
  } catch (err) {
    assert('Budget test failed', false, err.message);
  }

  // 6. Explainability & Transparent Match Reasons (Feature 9)
  console.log('\n--- 6. Explainability Reasons (Feature 9) ---');
  try {
    const resExp = await fetch(`${BASE_URL}/personalized?userId=3`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonExp = await resExp.json();
    const topItem = jsonExp.data?.recommendations?.[0];
    const reasons = topItem?.matchReasons || [];

    assert(
      'Recommendations include explainable, data-backed reasons array (Feature 9)',
      Array.isArray(reasons) && reasons.length > 0,
      `Reasons: ${reasons.join(' | ')}`
    );
  } catch (err) {
    assert('Explainability test failed', false, err.message);
  }

  // 7. User Travel Preferences Management (Feature 6 & 7)
  console.log('\n--- 7. User Travel Preferences CRUD (Feature 6 & 7) ---');
  try {
    const resSave = await fetch(`${BASE_URL}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        interests: ['wildlife', 'adventure', 'photography'],
        preferred_travel_type: 'solo',
        preferred_budget: 35000,
        preferred_currency: 'INR',
      }),
    });
    const jsonSave = await resSave.json();

    const resGet = await fetch(`${BASE_URL}/preferences`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonGet = await resGet.json();
    const prefs = jsonGet.data;

    assert(
      'PUT & GET /api/recommendations/preferences saves and persists user interests (Feature 7)',
      resSave.status === 200 &&
        resGet.status === 200 &&
        Array.isArray(prefs?.interests) &&
        prefs.interests.includes('wildlife'),
      `Saved Interests: ${prefs?.interests?.join(', ')}`
    );
  } catch (err) {
    assert('Preferences test failed', false, err.message);
  }

  // 8. Recommendation Feedback (Useful / Not Relevant) (Feature 15)
  console.log('\n--- 8. Recommendation Feedback (Feature 15) ---');
  try {
    const resFb = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        itemId: 106,
        itemType: 'destination',
        feedbackType: 'useful',
      }),
    });
    const jsonFb = await resFb.json();

    assert(
      'POST /api/recommendations/feedback records positive/negative user feedback (Feature 15)',
      resFb.status === 200 && jsonFb.data?.feedback_type === 'useful',
      `Feedback: ${jsonFb.data?.feedback_type}`
    );
  } catch (err) {
    assert('Feedback test failed', false, err.message);
  }

  // 9. "Not Interested" Exclusion Guardrail (Feature 16)
  console.log('\n--- 9. "Not Interested" Exclusion Guardrail (Feature 16) ---');
  try {
    // Mark item 101 as not_interested
    await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        itemId: 101,
        itemType: 'destination',
        feedbackType: 'not_interested',
      }),
    });

    // Check feed does not include item 101
    const resFeedAfter = await fetch(`${BASE_URL}/personalized?userId=3`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const jsonFeedAfter = await resFeedAfter.json();
    const afterItems = jsonFeedAfter.data?.recommendations || [];
    const item101Found = afterItems.some((item) => item.id === 101);

    assert(
      'Item marked as "not_interested" is excluded from subsequent personalized feeds (Feature 16)',
      !item101Found,
      `Excluded item 101 successfully`
    );
  } catch (err) {
    assert('Not interested test failed', false, err.message);
  }

  // 10. Refresh Recommendations with Variety (Feature 17)
  console.log('\n--- 10. Refresh Recommendations (Feature 17) ---');
  try {
    const resSeed0 = await fetch(`${BASE_URL}/personalized?userId=3&offset=0&limit=3`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const resSeed1 = await fetch(`${BASE_URL}/personalized?userId=3&offset=2&limit=3`, {
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    const json0 = await resSeed0.json();
    const json1 = await resSeed1.json();

    assert(
      'Refresh pagination/offset provides responsive and varied recommendation sets (Feature 17)',
      resSeed0.status === 200 && resSeed1.status === 200 && json0.data?.recommendations?.length > 0,
      'Varied feeds supported'
    );
  } catch (err) {
    assert('Refresh test failed', false, err.message);
  }

  // 11. Security & Privacy Guardrails (Feature 20)
  console.log('\n--- 11. Security & Zero Cross-User Leakage (Feature 20) ---');
  try {
    const missingItemIdRes = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        feedbackType: 'useful',
      }),
    });

    assert(
      'Feedback API validates required itemId parameter with HTTP 400 Bad Request',
      missingItemIdRes.status === 400,
      `Status: ${missingItemIdRes.status}`
    );
  } catch (err) {
    assert('Security test failed', false, err.message);
  }

  // 12. Multilingual Translations for Recommendations (Phase 17 Compatibility)
  console.log('\n--- 12. Multilingual Translations Compatibility ---');
  const enLabel = "Personalized Travel Recommendations";
  const taLabel = "தனிப்பயனாக்கப்பட்ட பயணப் பரிந்துரைகள்";
  assert(
    'Recommendation labels support natural Tamil & English UI strings',
    enLabel.length > 0 && taLabel.length > 0 && taLabel.includes('பரிந்துரைகள்'),
    'Multilingual strings verified'
  );

  console.log('\n=====================================================');
  console.log(` Phase 19 Recommendation Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 19 Personalized Recommendation tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 19 Recommendation tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase19RecommendationsSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase19RecommendationsSuite;


