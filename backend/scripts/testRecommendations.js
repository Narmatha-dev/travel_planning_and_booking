const config = require('../src/config/environment');

async function testRecommendationsSuite() {
  console.log('=====================================================');
  console.log('  Testing AI Travel Recommendations Module (Phase 12)');
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

  // 1. Profile 1: Beach + Family + ₹20,000 + 4 Days
  console.log('--- 1. Profile 1: Beach + Family + ₹20,000 + 4 Days ---');
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 20000,
        currency: 'INR',
        durationDays: 4,
        interest: 'beach',
        travelType: 'family',
      }),
    });
    const json = await res.json();

    assert(
      'POST /api/recommendations returns HTTP 200 with ranked recommendations',
      res.status === 200 && Array.isArray(json.data?.recommendations) && json.data?.recommendations.length > 0,
      `Status: ${res.status}`
    );

    const recs = json.data?.recommendations || [];
    const topNames = recs.map((r) => r.name);
    console.log('   Top Recommendations:', topNames.slice(0, 3).join(', '));

    const hasBeachDestinations = recs.some((r) => r.name.includes('Goa') || r.name.includes('Kerala') || r.name.includes('Andaman'));
    assert(
      'Beach profile recommends Goa, Kerala, or Andaman in top results',
      hasBeachDestinations,
      `Found: ${topNames.slice(0, 3).join(', ')}`
    );

    assert(
      'Top recommendation has high match score (>= 90%) and explainable match reasons',
      recs[0]?.matchScore >= 90 && Array.isArray(recs[0]?.matchReasons) && recs[0]?.matchReasons.length > 0,
      `Score: ${recs[0]?.matchScore}%, Reasons count: ${recs[0]?.matchReasons?.length}`
    );
  } catch (err) {
    assert('Profile 1 test failed', false, err.message);
  }

  // 2. Profile 2: Mountain + Adventure + $2,500 + 7 Days
  console.log('\n--- 2. Profile 2: Mountain + Adventure + $2,500 + 7 Days ---');
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 2500,
        currency: 'USD',
        durationDays: 7,
        interest: 'mountain',
        travelType: 'adventure',
      }),
    });
    const json = await res.json();
    const recs = json.data?.recommendations || [];
    const topNames = recs.map((r) => r.name);

    assert(
      'Mountain & adventure profile prioritizes Swiss Alps or Himalayan Manali',
      recs.some((r) => r.name.includes('Swiss') || r.name.includes('Manali')),
      `Top: ${topNames.slice(0, 2).join(', ')}`
    );
  } catch (err) {
    assert('Profile 2 test failed', false, err.message);
  }

  // 3. Profile 3: Romantic Couple + $2,000 + 5 Days
  console.log('\n--- 3. Profile 3: Romance + Couple + $2,000 + 5 Days ---');
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 2000,
        currency: 'USD',
        durationDays: 5,
        interest: 'romance',
        travelType: 'couple',
      }),
    });
    const json = await res.json();
    const recs = json.data?.recommendations || [];
    const topNames = recs.map((r) => r.name);

    assert(
      'Romantic couple profile prioritizes Santorini, Paris, or Bali',
      recs.some((r) => r.name.includes('Santorini') || r.name.includes('Paris') || r.name.includes('Bali')),
      `Top: ${topNames.slice(0, 2).join(', ')}`
    );
  } catch (err) {
    assert('Profile 3 test failed', false, err.message);
  }

  // 4. Test Explainability Structure & Matched Package Links
  console.log('\n--- 4. Explainability & Package Linkage ---');
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 20000,
        currency: 'INR',
        durationDays: 4,
        interest: 'beach',
        travelType: 'family',
      }),
    });
    const json = await res.json();
    const topRec = json.data?.recommendations?.[0];

    assert(
      'Recommendation includes estimatedTotalCost and matchedPackage with pricing',
      Boolean(topRec?.estimatedTotalCost && topRec?.matchedPackage?.title && topRec?.matchedPackage?.price),
      `Package: ${topRec?.matchedPackage?.title}, Cost: ${topRec?.estimatedTotalCost}`
    );

    assert(
      'Recommendation includes multiple detailed explainability reasons',
      topRec?.matchReasons && topRec.matchReasons.length >= 2,
      `Reasons: ${JSON.stringify(topRec?.matchReasons)}`
    );
  } catch (err) {
    assert('Explainability audit failed', false, err.message);
  }

  // 5. Test Personalized Feed Endpoint (GET /api/recommendations/personalized)
  console.log('\n--- 5. Personalized Recommendation Feed ---');
  try {
    const resFeed = await fetch(`${BASE_URL}/personalized?userId=3`);
    const jsonFeed = await resFeed.json();

    assert(
      'GET /api/recommendations/personalized returns curated feed for user',
      resFeed.status === 200 && Array.isArray(jsonFeed.data?.recommendations),
      `Status: ${resFeed.status}, Count: ${jsonFeed.data?.recommendations?.length}`
    );
  } catch (err) {
    assert('Personalized feed test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Recommendations Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All AI Travel Recommendation backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some recommendation tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testRecommendationsSuite()
    .then((ok) => {
      setTimeout(() => process.exit(ok ? 0 : 1), 100);
    })
    .catch((err) => {
      console.error('Fatal recommendation test error:', err);
      setTimeout(() => process.exit(1), 100);
    });
}

module.exports = { testRecommendationsSuite };
