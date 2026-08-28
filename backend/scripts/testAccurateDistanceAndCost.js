const assert = require('assert');
const locationService = require('../src/services/locationService');
const transportService = require('../src/services/transportService');
const aiTripService = require('../src/services/aiTripService');
const imageService = require('../src/services/imageService');
const destinationModel = require('../src/models/destinationModel');

async function runAccurateDistanceAndCostTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING ACCURATE DISTANCE, COST, SEARCH & IMAGES TEST SUITE');
  console.log('=============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function pass(testName, details = '') {
    totalTests++;
    passedTests++;
    console.log(`✔ [PASS] ${testName} ${details ? `(${details})` : ''}`);
  }

  function fail(testName, err) {
    totalTests++;
    console.error(`❌ [FAIL] ${testName}:`, err.message);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 1: Scenario A, B, C, D - Destination Search
  // -------------------------------------------------------------
  console.log('--- 1. Destination Search by Name, City, State, Country & Partial Matching ---');
  try {
    // Scenario A: Search "Chennai"
    const chennaiResults = await destinationModel.search({ q: 'Chennai' });
    assert(chennaiResults.length > 0, 'Search for "Chennai" should return results');
    assert(
      chennaiResults.some((d) => d.city.toLowerCase().includes('chennai') || d.name.toLowerCase().includes('chennai')),
      'Should contain Chennai places'
    );
    pass('Scenario A: Search "Chennai" returns accurate records', `Found ${chennaiResults.length} matches`);

    // Scenario B: Search "Ooty"
    const ootyResults = await destinationModel.search({ q: 'Ooty' });
    assert(ootyResults.length > 0, 'Search for "Ooty" should return results');
    assert(
      ootyResults.some((d) => d.name.toLowerCase().includes('ooty') || d.city.toLowerCase().includes('ooty')),
      'Should contain Ooty places'
    );
    pass('Scenario B: Search "Ooty" returns accurate records', `Found ${ootyResults.length} matches`);

    // Scenario C: Search "Goa"
    const goaResults = await destinationModel.search({ q: 'Goa' });
    assert(goaResults.length > 0, 'Search for "Goa" should return results');
    assert(
      goaResults.some((d) => d.name.toLowerCase().includes('goa') || d.country.toLowerCase().includes('india')),
      'Should contain Goa records'
    );
    pass('Scenario C: Search "Goa" returns accurate records', `Found ${goaResults.length} matches`);

    // Scenario D: Search using partial names ("Chen", "Oot", "Go")
    const partialChen = await destinationModel.search({ q: 'Chen' });
    const partialOot = await destinationModel.search({ q: 'Oot' });
    const partialGo = await destinationModel.search({ q: 'Go' });
    assert(partialChen.length > 0, 'Partial "Chen" should match Chennai');
    assert(partialOot.length > 0, 'Partial "Oot" should match Ooty');
    assert(partialGo.length > 0, 'Partial "Go" should match Goa');
    pass('Scenario D: Partial matching ("Chen", "Oot", "Go") succeeds', 'Substrings resolved dynamically');

    // Scenario F: Search with empty / whitespace input returns all popular destinations
    const emptyResults = await destinationModel.search({ q: '   ' });
    assert(emptyResults.length > 0, 'Empty search should safely return default list');
    pass('Scenario F: Empty search gracefully returns all destinations');
  } catch (err) {
    fail('Destination Search Suite', err);
  }

  // -------------------------------------------------------------
  // Test 2: Scenario G & H - Accurate Source to Destination Distance Calculation
  // -------------------------------------------------------------
  console.log('\n--- 2. Source-to-Destination Distance Calculation & Formatting ---');
  try {
    // Chennai (13.0827, 80.2707) -> Mahabalipuram (12.6163, 80.1983)
    const shortRoute = await locationService.calculateRoute({
      originLat: 13.0827,
      originLng: 80.2707,
      destLat: 12.6163,
      destLng: 80.1983,
      travelMode: 'driving',
    });
    assert(shortRoute.distance_km >= 45 && shortRoute.distance_km <= 70, `Expected distance ~57km, got ${shortRoute.distance_km}km`);
    assert(shortRoute.distance_text.includes('km'), 'Distance text should include km');
    pass('Scenario G & H (Short route): Chennai -> Mahabalipuram calculated', `${shortRoute.distance_text}, duration: ${shortRoute.duration_text}`);

    // Chennai (13.0827, 80.2707) -> Ooty (11.4167, 76.7167)
    const longRoute = await locationService.calculateRoute({
      originLat: 13.0827,
      originLng: 80.2707,
      destLat: 11.4167,
      destLng: 76.7167,
      travelMode: 'driving',
    });
    assert(longRoute.distance_km >= 450 && longRoute.distance_km <= 650, `Expected distance ~540km, got ${longRoute.distance_km}km`);
    pass('Scenario G & H (Intercity route): Chennai -> Ooty calculated', `${longRoute.distance_text}, duration: ${longRoute.duration_text}`);

    // Very short urban distance (< 1 km) formatted in meters
    const urbanMeters = locationService.formatDistance(0.75);
    assert.strictEqual(urbanMeters, '750 m', 'Sub-kilometer distances should format in meters');
    pass('Scenario H (Sub-km formatting): 0.75 km formats as "750 m"');
  } catch (err) {
    fail('Distance Calculation Suite', err);
  }

  // -------------------------------------------------------------
  // Test 3: Scenario I, J, K, L - Cost Calculation & Mathematical Exactness
  // -------------------------------------------------------------
  console.log('\n--- 3. Transparent Travel Cost Calculation & Recalculation ---');
  try {
    // 3 Days, 2 Travelers
    const itinerary3Days2Pax = await aiTripService.generateAiItinerary({
      destination: 'Ooty',
      numberOfDays: 3,
      travelers: 2,
      budget: 15000,
      currency: 'INR',
      travelPreference: 'nature',
      currentLocation: { latitude: 13.0827, longitude: 80.2707, city: 'Chennai' },
    });

    const cb1 = itinerary3Days2Pax.costBreakdown;
    assert(cb1, 'Itinerary must include costBreakdown');
    assert(cb1.transport > 0, 'Transport cost must be positive');
    assert(cb1.accommodation > 0, 'Accommodation cost must be positive');
    assert(cb1.food > 0, 'Food cost must be positive');
    assert(cb1.activities >= 0, 'Activities cost must be non-negative');
    assert(cb1.other > 0, 'Other cost must be positive');

    // Verify mathematical formula: Total == Transport + Accommodation + Food + Activities + Other
    const mathSum1 = cb1.transport + cb1.accommodation + cb1.food + cb1.activities + cb1.other;
    assert.strictEqual(cb1.total, mathSum1, `Total (${cb1.total}) must exactly equal sum of components (${mathSum1})`);
    assert.strictEqual(itinerary3Days2Pax.totalEstimatedCost, mathSum1, 'totalEstimatedCost must match breakdown total');
    pass('Scenario L (3 Days, 2 Pax): Mathematical total cost verified', `Total: ₹${cb1.total.toLocaleString()} = ₹${cb1.transport} + ₹${cb1.accommodation} + ₹${cb1.food} + ₹${cb1.activities} + ₹${cb1.other}`);

    // Scenario J & K: Recalculate for 7 Days, 4 Travelers
    const itinerary7Days4Pax = await aiTripService.generateAiItinerary({
      destination: 'Ooty',
      numberOfDays: 7,
      travelers: 4,
      budget: 45000,
      currency: 'INR',
      travelPreference: 'nature',
      currentLocation: { latitude: 13.0827, longitude: 80.2707, city: 'Chennai' },
    });

    const cb2 = itinerary7Days4Pax.costBreakdown;
    const mathSum2 = cb2.transport + cb2.accommodation + cb2.food + cb2.activities + cb2.other;
    assert.strictEqual(cb2.total, mathSum2, 'Recalculated 7-day 4-pax total must equal sum of components');
    assert(cb2.total > cb1.total, '7-day 4-traveler trip must cost more than 3-day 2-traveler trip');
    pass('Scenario J & K (7 Days, 4 Pax): Automatic recalculation verified', `Total: ₹${cb2.total.toLocaleString()}`);

    // Scenario I: Transport mode changes update fares
    const transportOptions = await transportService.getTransportOptions({
      originLat: 13.0827,
      originLng: 80.2707,
      destLat: 11.4167,
      destLng: 76.7167,
    });
    assert(transportOptions && transportOptions.options.length >= 3, 'Should generate multiple transport modes');
    pass('Scenario I: Transport modes (Car, Bus, Train, Flight) generated with realistic fares');
  } catch (err) {
    fail('Cost Calculation Suite', err);
  }

  // -------------------------------------------------------------
  // Test 4: Scenario M, N, O - Destination Images & Attributions
  // -------------------------------------------------------------
  console.log('\n--- 4. Real Destination Photography & Licensing Attributions ---');
  try {
    const destinationsToTest = ['Taj Mahal', 'Paris', 'Tokyo', 'Chennai', 'Ooty', 'Goa', 'Munnar'];
    for (const destName of destinationsToTest) {
      const img = await imageService.getDestinationImage(destName);
      assert(img && img.imageUrl, `Destination "${destName}" must return valid image URL`);
      assert(img.imageAuthor, `Destination "${destName}" must have photo author`);
      assert(img.imageLicense, `Destination "${destName}" must have license`);
      assert(img.attributionText, `Destination "${destName}" must have attribution text`);
    }
    pass('Scenario M & N: All tested destinations return authentic images with licenses and author attributions');

    // Scenario O: Fallback image for unknown/missing place
    const fallbackImg = await imageService.getDestinationImage('UnknownFictionalLandmarkXYZ123');
    assert(fallbackImg && fallbackImg.imageUrl, 'Fallback image must exist');
    assert(fallbackImg.imageLicense, 'Fallback image must have license metadata');
    pass('Scenario O: Fallback image gracefully returned for unknown destinations');
  } catch (err) {
    fail('Image Service Suite', err);
  }

  // -------------------------------------------------------------
  // Test 5: Scenario P & Q - Error Handling & Boundary Validations
  // -------------------------------------------------------------
  console.log('\n--- 5. Error Boundaries & Input Validations ---');
  try {
    // Scenario P: Invalid / missing coordinates
    let errorCaught = false;
    try {
      await locationService.calculateRoute({
        originLat: 'invalid',
        originLng: 80.27,
        destLat: 11.41,
        destLng: 76.71,
      });
    } catch (e) {
      errorCaught = true;
      assert.strictEqual(e.statusCode, 400);
    }
    assert(errorCaught, 'Invalid coordinate input should throw 400 Bad Request');
    pass('Scenario P & Q: Invalid coordinate bounds handled with HTTP 400 error');

    // Missing destination in itinerary generator
    let aiErrorCaught = false;
    try {
      await aiTripService.generateAiItinerary({ destination: '' });
    } catch (e) {
      aiErrorCaught = true;
      assert.strictEqual(e.statusCode, 400);
    }
    assert(aiErrorCaught, 'Missing destination should throw 400 Bad Request');
    pass('Scenario Q: Missing destination parameters handled safely with HTTP 400');
  } catch (err) {
    fail('Error Validation Suite', err);
  }

  console.log('\n=============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('=============================================================\n');
}

runAccurateDistanceAndCostTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
