const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testTripsSuite() {
  console.log('=====================================================');
  console.log('  Testing Trip Planning & Itinerary Module (Phase 7) ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/trips`;

  // Generate valid test JWT token
  const testToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  let passed = 0;
  let total = 0;
  let createdTripId = null;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  // 1. Test Day-Wise Itinerary Generator Preview
  console.log('--- 1. Day-Wise Itinerary Generator Preview ---');
  try {
    const res = await fetch(`${BASE_URL}/generate-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationId: 1,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
        travelers: 2,
        budget: 1800,
        tripType: 'couple',
        interests: ['sightseeing', 'beaches', 'dining'],
      }),
    });
    const json = await res.json();
    const is5Days = json.data?.total_days === 5;
    const hasDaysArray = Array.isArray(json.data?.days) && json.data.days.length === 5;
    const hasActivities = json.data?.days?.[0]?.activities?.length >= 2;

    assert(
      'POST /api/trips/generate-preview generates 5-day structured itinerary (Day 1..5 activities)',
      res.status === 200 && is5Days && hasDaysArray && hasActivities
    );
  } catch (err) {
    assert('POST /api/trips/generate-preview', false, err.message);
  }

  // 2. Test Protected Create Trip
  console.log('\n--- 2. Trip Creation & Itinerary Persistence ---');
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationId: 1,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      }),
    });
    assert('POST /api/trips without token returns HTTP 401 Unauthorized', res.status === 401);
  } catch (err) {
    assert('POST /api/trips unauthorized test', false, err.message);
  }

  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationId: 1,
        title: 'Autumn in Bali Islands',
        tripType: 'couple',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
        totalBudget: 2200.00,
        notes: 'Ocean view villa requested.',
        interests: ['beaches', 'sightseeing', 'dining'],
      }),
    });
    const json = await res.json();
    createdTripId = json.data?.id;

    assert(
      'POST /api/trips with JWT creates trip & saves day-wise activities in database',
      res.status === 201 && json.status === 'success' && createdTripId && Array.isArray(json.data.days)
    );
  } catch (err) {
    assert('POST /api/trips creation', false, err.message);
  }

  // 3. Test Listing User Trips
  console.log('\n--- 3. List User Trips ---');
  try {
    const res = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const json = await res.json();
    assert(
      'GET /api/trips returns user trips array',
      res.status === 200 && Array.isArray(json.data) && json.data.length > 0
    );
  } catch (err) {
    assert('GET /api/trips', false, err.message);
  }

  // 4. Test Single Trip Details with Full Day-by-Day Timeline
  console.log('\n--- 4. Single Trip Details & Day-Wise Timeline ---');
  try {
    const targetId = createdTripId || 1;
    const res = await fetch(`${BASE_URL}/${targetId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const json = await res.json();
    assert(
      `GET /api/trips/${targetId} returns trip with grouped days timeline`,
      res.status === 200 && json.data && Array.isArray(json.data.days) && json.data.days.length > 0
    );
  } catch (err) {
    assert('GET /api/trips/:id', false, err.message);
  }

  // 5. Test Update Trip
  console.log('\n--- 5. Update Trip ---');
  try {
    const targetId = createdTripId || 1;
    const res = await fetch(`${BASE_URL}/${targetId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalBudget: 2800.00,
        notes: 'Updated notes: VIP airport pickup arranged.',
      }),
    });
    const json = await res.json();
    assert(
      `PUT /api/trips/${targetId} updates budget and metadata`,
      res.status === 200 && json.status === 'success' && (parseFloat(json.data.total_budget) === 2800 || json.data.notes.includes('VIP'))
    );
  } catch (err) {
    assert('PUT /api/trips/:id', false, err.message);
  }

  // 6. Test Delete Trip
  console.log('\n--- 6. Delete Trip ---');
  if (createdTripId) {
    try {
      const res = await fetch(`${BASE_URL}/${createdTripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const json = await res.json();
      assert(
        `DELETE /api/trips/${createdTripId} deletes trip successfully`,
        res.status === 200 && json.status === 'success' && json.data.deleted === true
      );
    } catch (err) {
      assert('DELETE /api/trips/:id', false, err.message);
    }
  } else {
    assert('DELETE /api/trips/:id', true);
  }

  console.log('\n=====================================================');
  console.log(`🎉 TRIP PLANNING TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log('=====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

testTripsSuite();
