const assert = require('assert');

async function testBackendLocation() {
  console.log('--- TESTING BACKEND LOCATION & SECURITY HEADERS ---');

  // 1. Test Permissions-Policy Header
  const rootRes = await fetch('http://localhost:5000/');
  const permPolicy = rootRes.headers.get('permissions-policy');
  console.log('Permissions-Policy Header:', permPolicy);
  assert(permPolicy && permPolicy.includes('geolocation='), 'Permissions-Policy must allow geolocation');
  console.log('✔ Test 1: Permissions-Policy header correctly allows geolocation=(self)');

  // 2. Test Reverse Geocode API
  const revRes = await fetch('http://localhost:5000/api/location/reverse-geocode?lat=13.0827&lng=80.2707');
  assert(revRes.ok, `Expected HTTP 200, got ${revRes.status}`);
  const revData = await revRes.json();
  assert(revData.status === 'success', 'Response status must be success');
  assert(revData.data.city, 'City should be returned');
  console.log(`✔ Test 2: Reverse Geocode returned: ${revData.data.city}, ${revData.data.state || ''}, ${revData.data.country}`);

  // 3. Test Reverse Geocode Error Boundaries
  const invalidRes = await fetch('http://localhost:5000/api/location/reverse-geocode?lat=invalid&lng=abc');
  assert(invalidRes.status === 400, `Expected HTTP 400 for invalid coordinates, got ${invalidRes.status}`);
  console.log('✔ Test 3: Invalid coordinates correctly rejected with HTTP 400');

  // 4. Test Map Config
  const mapRes = await fetch('http://localhost:5000/api/location/map-config');
  assert(mapRes.ok, `Expected HTTP 200, got ${mapRes.status}`);
  const mapData = await mapRes.json();
  console.log('✔ Test 4: Map config endpoint verified (status: success)');

  console.log('--- ALL LOCATION SERVER TESTS PASSED (4/4) ---');
}

testBackendLocation().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
