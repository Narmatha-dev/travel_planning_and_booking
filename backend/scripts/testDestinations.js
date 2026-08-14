const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testDestinationsSuite() {
  console.log('=====================================================');
  console.log('  Testing Destination Module & Search (Phase 6)      ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/destinations`;

  // Generate valid test JWT token
  const testToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

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

  // 1. Test GET /api/destinations
  console.log('--- 1. Listing & Browsing Destinations ---');
  try {
    const res = await fetch(BASE_URL);
    const json = await res.json();
    assert(
      'GET /api/destinations returns HTTP 200 with destination array',
      res.status === 200 && Array.isArray(json.data) && json.data.length > 0
    );
  } catch (err) {
    assert('GET /api/destinations returns HTTP 200', false, err.message);
  }

  // 2. Test GET /api/destinations/search
  console.log('\n--- 2. Destination Search ---');
  try {
    const res = await fetch(`${BASE_URL}/search?q=Bali`);
    const json = await res.json();
    const hasBali = json.data?.some((d) => d.name.includes('Bali') || d.city.includes('Bali'));
    assert(
      'GET /api/destinations/search?q=Bali returns matching destinations',
      res.status === 200 && Array.isArray(json.data) && hasBali
    );
  } catch (err) {
    assert('GET /api/destinations/search?q=Bali', false, err.message);
  }

  // 3. Test Category Filtering
  console.log('\n--- 3. Category & Price Filtering ---');
  try {
    const res = await fetch(`${BASE_URL}?category=mountain`);
    const json = await res.json();
    const allMountain = json.data?.every((d) => d.category === 'mountain');
    assert(
      'GET /api/destinations?category=mountain filters accurately',
      res.status === 200 && Array.isArray(json.data) && allMountain
    );
  } catch (err) {
    assert('GET /api/destinations?category=mountain', false, err.message);
  }

  // 4. Test Popular Destinations
  console.log('\n--- 4. Popular Destinations ---');
  try {
    const res = await fetch(`${BASE_URL}/popular`);
    const json = await res.json();
    assert(
      'GET /api/destinations/popular returns featured destinations',
      res.status === 200 && Array.isArray(json.data) && json.data.length > 0
    );
  } catch (err) {
    assert('GET /api/destinations/popular', false, err.message);
  }

  // 5. Test Destination Details by ID & Slug
  console.log('\n--- 5. Destination Details ---');
  try {
    const res = await fetch(`${BASE_URL}/1`);
    const json = await res.json();
    assert(
      'GET /api/destinations/1 returns destination details with packages',
      res.status === 200 && json.data && json.data.id === 1 && Array.isArray(json.data.packages)
    );
  } catch (err) {
    assert('GET /api/destinations/1 returns destination details', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/bali-paradise-island`);
    const json = await res.json();
    assert(
      'GET /api/destinations/bali-paradise-island resolves slug accurately',
      res.status === 200 && json.data && json.data.slug === 'bali-paradise-island'
    );
  } catch (err) {
    assert('GET /api/destinations/:slug resolves slug', false, err.message);
  }

  // 6. Test Favorite Management (Add & Remove with JWT)
  console.log('\n--- 6. Favorites Management (Protected) ---');
  try {
    const res = await fetch(`${BASE_URL}/1/favorite`, { method: 'POST' });
    assert(
      'POST /api/destinations/1/favorite without token returns HTTP 401 Unauthorized',
      res.status === 401
    );
  } catch (err) {
    assert('POST /api/destinations/1/favorite without token returns 401', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/1/favorite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    assert(
      'POST /api/destinations/1/favorite with valid JWT returns HTTP 201 Created',
      res.status === 201 && json.status === 'success' && json.data.isFavorite === true
    );
  } catch (err) {
    assert('POST /api/destinations/1/favorite with valid JWT', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/1/favorite`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    assert(
      'DELETE /api/destinations/1/favorite with valid JWT returns HTTP 200 OK',
      res.status === 200 && json.status === 'success' && json.data.isFavorite === false
    );
  } catch (err) {
    assert('DELETE /api/destinations/1/favorite with valid JWT', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(`🎉 DESTINATION TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log('=====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

testDestinationsSuite();
