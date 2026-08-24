const jwt = require('jsonwebtoken');
const app = require('../src/server');
const config = require('../src/config/environment');

async function testPhase15SharingSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 15: Shareable Trip Plans & Social    ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/share`;
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

  // Generate Traveler JWT token
  const jwtSecret = config.jwt?.secret || process.env.JWT_SECRET || 'travel_jwt_super_secret_key_2026_secure!';
  const travelerToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const travelerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${travelerToken}`,
  };

  let activeShareToken = null;
  let firstShareToken = null;

  // 1. Authentication & Security Boundaries (Feature 15)
  console.log('--- 1. Authentication & Ownership Boundaries (Feature 15) ---');
  try {
    const resNoAuth = await fetch(`${BASE_URL}/trip/1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(
      'POST /api/share/trip/:tripId without token returns HTTP 401 Unauthorized',
      resNoAuth.status === 401,
      `Status: ${resNoAuth.status}`
    );
  } catch (err) {
    assert('Auth test failed', false, err.message);
  }

  // 2. Generate Secure Share Link (Feature 1, 2 & 13)
  console.log('\n--- 2. Generate Secure Share Link (Feature 1, 2 & 13) ---');
  try {
    const resCreate = await fetch(`${BASE_URL}/trip/1`, {
      method: 'POST',
      headers: travelerHeaders,
    });
    const jsonCreate = await resCreate.json();
    const data = jsonCreate.data;
    firstShareToken = data?.shareToken;
    activeShareToken = data?.shareToken;

    assert(
      'POST /api/share/trip/1 creates secure share link (HTTP 201)',
      resCreate.status === 201 && data?.shareToken && data?.shareUrl,
      `Status: ${resCreate.status}, URL: ${data?.shareUrl}`
    );

    assert(
      'Share token uses cryptographically random identifier (Feature 2)',
      typeof data?.shareToken === 'string' &&
        data.shareToken.startsWith('tr_') &&
        data.shareToken.length >= 10 &&
        !data.shareToken.includes('user') &&
        !data.shareToken.includes('alex'),
      `Token: ${data?.shareToken}`
    );
  } catch (err) {
    assert('Create share link failed', false, err.message);
  }

  // 3. Public Shared Trip Retrieval & Data Sanitization (Feature 3, 4, 9 & 10)
  console.log('\n--- 3. Public Trip Retrieval & Data Sanitization (Feature 3, 4, 9 & 10) ---');
  try {
    const resPublic = await fetch(`${BASE_URL}/trip/${activeShareToken}`);
    const jsonPublic = await resPublic.json();
    const trip = jsonPublic.data;

    assert(
      'GET /api/share/trip/:token returns public trip preview without authentication (HTTP 200)',
      resPublic.status === 200 && trip?.title && trip?.destination_name,
      `Status: ${resPublic.status}, Destination: ${trip?.destination_name}`
    );

    assert(
      'Public trip includes structured day-by-day itineraries and real images (Feature 3 & 10)',
      Array.isArray(trip?.itineraries) && trip.itineraries.length > 0 && Boolean(trip?.featured_image_url),
      `Activities Count: ${trip?.itineraries?.length}, Image: ${trip?.featured_image_url}`
    );

    // Strict Private Data Protection (Feature 4)
    assert(
      'STRICT DATA PROTECTION: Public payload NEVER leaks user_id, email, passwords, payment IDs, or booking refs',
      trip.user_id === undefined &&
        trip.email === undefined &&
        trip.phone === undefined &&
        trip.password === undefined &&
        trip.payment_id === undefined &&
        trip.card_details === undefined &&
        trip.booking_reference === undefined,
      `Keys found: ${Object.keys(trip).join(', ')}`
    );
  } catch (err) {
    assert('Public trip preview failed', false, err.message);
  }

  // 4. View Tracking (Feature 17)
  console.log('\n--- 4. View Count Tracking (Feature 17) ---');
  try {
    // Make another public view call
    await fetch(`${BASE_URL}/trip/${activeShareToken}`);

    const resStatus = await fetch(`${BASE_URL}/trip/1/status`, {
      headers: travelerHeaders,
    });
    const jsonStatus = await resStatus.json();
    const statusData = jsonStatus.data;

    assert(
      'GET /api/share/trip/:tripId/status accurately reports views count to owner (Feature 17)',
      resStatus.status === 200 && statusData?.viewsCount >= 2,
      `Views tracked: ${statusData?.viewsCount}`
    );
  } catch (err) {
    assert('View tracking failed', false, err.message);
  }

  // 5. Regenerate Share Link (Feature 7)
  console.log('\n--- 5. Regenerate Share Link (Feature 7) ---');
  try {
    const resRegen = await fetch(`${BASE_URL}/trip/1/regenerate`, {
      method: 'POST',
      headers: travelerHeaders,
    });
    const jsonRegen = await resRegen.json();
    const newShareToken = jsonRegen.data?.shareToken;

    assert(
      'POST /api/share/trip/1/regenerate generates new share token (HTTP 200)',
      resRegen.status === 200 && newShareToken && newShareToken !== firstShareToken,
      `New Token: ${newShareToken}, Old: ${firstShareToken}`
    );

    // Old token must be invalidated
    const resOldToken = await fetch(`${BASE_URL}/trip/${firstShareToken}`);
    assert(
      'Previous share token is invalidated and returns HTTP 404 Not Found',
      resOldToken.status === 404,
      `Status: ${resOldToken.status}`
    );

    activeShareToken = newShareToken;
  } catch (err) {
    assert('Regenerate test failed', false, err.message);
  }

  // 6. Revoke Share Link (Feature 5 & 6)
  console.log('\n--- 6. Revoke / Stop Sharing (Feature 5 & 6) ---');
  try {
    const resRevoke = await fetch(`${BASE_URL}/trip/1/revoke`, {
      method: 'PUT',
      headers: travelerHeaders,
    });
    const jsonRevoke = await resRevoke.json();

    assert(
      'PUT /api/share/trip/1/revoke disables sharing (HTTP 200)',
      resRevoke.status === 200 && jsonRevoke.data?.success === true,
      `Status: ${resRevoke.status}`
    );

    // Accessing revoked link returns 404
    const resRevokedAccess = await fetch(`${BASE_URL}/trip/${activeShareToken}`);
    assert(
      'Accessing revoked share link returns HTTP 404 with friendly message',
      resRevokedAccess.status === 404,
      `Status: ${resRevokedAccess.status}`
    );
  } catch (err) {
    assert('Revoke test failed', false, err.message);
  }

  // 7. Non-Owner Sharing Prevention (Feature 15)
  console.log('\n--- 7. Non-Owner Sharing Prevention (Feature 15) ---');
  try {
    const intruderToken = jwt.sign(
      { id: 999, email: 'intruder@example.com', role: 'traveler' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const resIntruder = await fetch(`${BASE_URL}/trip/1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${intruderToken}`,
      },
    });

    assert(
      'Cannot generate or modify share link for a trip owned by another user (HTTP 404)',
      resIntruder.status === 404,
      `Status: ${resIntruder.status}`
    );
  } catch (err) {
    assert('Ownership security test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 15 Sharing Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 15 Social Sharing tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 15 Social Sharing tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase15SharingSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase15SharingSuite;

