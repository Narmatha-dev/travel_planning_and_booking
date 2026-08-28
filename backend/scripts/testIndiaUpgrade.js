const assert = require('assert');
const placesService = require('../src/services/placesService');
const locationService = require('../src/services/locationService');

async function runTests() {
  console.log('--- RUNNING TRIPWISE INDIA UPGRADE TEST SUITE ---');

  // Test 1: Retrieve all India places
  const allPlaces = await placesService.getAllIndiaPlaces({});
  assert(allPlaces.total >= 30, `Expected at least 30 places, got ${allPlaces.total}`);
  console.log(`✔ Test 1: Retrieved ${allPlaces.total} pan-India destinations`);

  // Test 2: Check all 7 regions are present
  const regions = ['north', 'south', 'west', 'east', 'central', 'northeast', 'islands'];
  for (const reg of regions) {
    const regResult = await placesService.getAllIndiaPlaces({ region: reg });
    assert(regResult.count > 0, `Region '${reg}' should have destinations, got 0`);
    console.log(`✔ Test 2 [${reg}]: Found ${regResult.count} destinations in ${reg}`);
  }

  // Test 3: Check category filtering
  const beachPlaces = await placesService.getAllIndiaPlaces({ category: 'beach' });
  assert(beachPlaces.count >= 3, `Expected at least 3 beach destinations, got ${beachPlaces.count}`);
  console.log(`✔ Test 3: Found ${beachPlaces.count} beach destinations`);

  // Test 4: Distance calculation from Chennai (13.0827, 80.2707)
  const chennaiPlaces = await placesService.getAllIndiaPlaces({
    latitude: 13.0827,
    longitude: 80.2707,
    sortBy: 'nearest',
  });
  assert(chennaiPlaces.places[0].distance_km !== undefined, 'distance_km must be defined');
  assert(chennaiPlaces.places[0].city === 'Chennai', `Closest place to Chennai should be in Chennai, got ${chennaiPlaces.places[0].city}`);
  console.log(`✔ Test 4: Closest destination to Chennai is ${chennaiPlaces.places[0].name} (${chennaiPlaces.places[0].distance_label})`);

  // Test 5: Route calculation between Chennai and Agra
  const route = await locationService.calculateRoute({
    originLat: 13.0827,
    originLng: 80.2707,
    destLat: 27.1751,
    destLng: 78.0421,
    travelMode: 'driving',
  });
  assert(route.distance_km > 1000, `Expected distance > 1000km between Chennai and Agra, got ${route.distance_km}`);
  console.log(`✔ Test 5: Chennai to Agra Route: ${route.distance_text}, Duration: ${route.duration_text}`);

  console.log('--- ALL INDIA UPGRADE TESTS PASSED SUCCESSFULLY (5/5) ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
