const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const locationService = require('../src/services/locationService');

let passCount = 0;
let failCount = 0;

function logPass(msg) {
  passCount++;
  console.log(`✔ [PASS] ${msg}`);
}

function logFail(msg, err) {
  failCount++;
  console.error(`❌ [FAIL] ${msg}`);
  if (err) console.error('  ', err.message || err);
}

async function runMapsRouteTests() {
  console.log('=====================================================');
  console.log('  Testing Google Maps Route & Directions (Phase 3)   ');
  console.log('=====================================================\n');

  // Origin: Central Chennai (13.0827, 80.2707)
  // Destination: Mahabalipuram Shore Temple (12.6163, 80.1983)
  const originLat = 13.0827;
  const originLng = 80.2707;
  const destLat = 12.6163;
  const destLng = 80.1983;

  try {
    // -----------------------------------------------------------------
    // 1. Driving Route: Chennai -> Mahabalipuram
    // -----------------------------------------------------------------
    console.log('--- 1. Driving Route: Chennai -> Mahabalipuram ---');
    try {
      const result = await locationService.calculateRoute({
        originLat,
        originLng,
        destLat,
        destLng,
        travelMode: 'driving',
      });

      assert(result.distance_km > 40 && result.distance_km < 70, `Distance should be ~50-60 km, got ${result.distance_km}`);
      assert(result.duration_text, 'Must contain duration text (e.g. 1 hr 15 min)');
      assert(result.distance_text, 'Must contain formatted distance text');
      assert(result.route_points && result.route_points.length >= 2, 'Must return route coordinates polyline');
      assert(result.google_maps_directions_url, 'Must return direct Google Maps directions URL');
      assert.strictEqual(result.travel_mode, 'driving');

      console.log(`   🚗 Mode: ${result.travel_mode}`);
      console.log(`   📏 Distance: ${result.distance_text}`);
      console.log(`   ⏱️ Duration: ${result.duration_text}`);
      console.log(`   🗺️ Source: ${result.source}`);
      logPass('Driving route, distance, and duration calculated accurately');
    } catch (err) {
      logFail('Driving route test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Travel Mode: Walking & Bicycling
    // -----------------------------------------------------------------
    console.log('\n--- 2. Travel Mode: Walking vs Bicycling ---');
    try {
      const walkResult = await locationService.calculateRoute({
        originLat,
        originLng,
        destLat,
        destLng,
        travelMode: 'walking',
      });

      const bikeResult = await locationService.calculateRoute({
        originLat,
        originLng,
        destLat,
        destLng,
        travelMode: 'bicycling',
      });

      assert.strictEqual(walkResult.travel_mode, 'walking');
      assert.strictEqual(bikeResult.travel_mode, 'bicycling');
      assert(walkResult.duration_seconds > bikeResult.duration_seconds, 'Walking duration should be longer than bicycling duration');

      console.log(`   🚶 Walking Duration: ${walkResult.duration_text}`);
      console.log(`   🚲 Bicycling Duration: ${bikeResult.duration_text}`);
      logPass('Travel mode changes dynamically update duration calculations');
    } catch (err) {
      logFail('Travel mode comparison test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Short Urban Route: Marina Beach -> Kapaleeshwarar Temple
    // -----------------------------------------------------------------
    console.log('\n--- 3. Short Urban Route: Marina Beach -> Kapaleeshwarar ---');
    try {
      const urbanResult = await locationService.calculateRoute({
        originLat: 13.0500,
        originLng: 80.2824,
        destLat: 13.0334,
        destLng: 80.2694,
        travelMode: 'driving',
      });

      assert(urbanResult.distance_km < 10, `Short urban distance should be < 10 km, got ${urbanResult.distance_km} km`);
      console.log(`   📏 Distance: ${urbanResult.distance_text}`);
      console.log(`   ⏱️ Estimated Time: ${urbanResult.duration_text}`);
      logPass('Short urban distance and time calculated accurately');
    } catch (err) {
      logFail('Urban route test failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Input Validation & Error Handling
    // -----------------------------------------------------------------
    console.log('\n--- 4. Input Validation & Bounds ---');
    try {
      let caught = false;
      try {
        await locationService.calculateRoute({ originLat: 'abc', originLng: 'xyz', destLat: 12.6, destLng: 80.1 });
      } catch (e) {
        caught = true;
        assert.strictEqual(e.statusCode, 400);
      }
      assert(caught, 'Must reject invalid non-numeric coordinates with HTTP 400');
      logPass('Invalid coordinate inputs rejected with HTTP 400');
    } catch (err) {
      logFail('Input validation test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Maps Route Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exit(failCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal maps route test error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runMapsRouteTests();
}

module.exports = { runMapsRouteTests };
