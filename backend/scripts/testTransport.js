const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const transportService = require('../src/services/transportService');

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

async function runTransportTests() {
  console.log('=====================================================');
  console.log('  Testing Transport Options & Pricing Module (Phase 4)');
  console.log('=====================================================\n');

  // Origin: Central Chennai (13.0827, 80.2707)
  // Destination 1: Mahabalipuram (12.6163, 80.1983) - ~57 km
  // Destination 2: Goa (15.2993, 74.1240) - ~750 km

  try {
    // -----------------------------------------------------------------
    // 1. Short Distance Journey: Chennai -> Mahabalipuram (~57 km)
    // -----------------------------------------------------------------
    console.log('--- 1. Short Journey: Chennai -> Mahabalipuram (~57 km) ---');
    try {
      const result = await transportService.getTransportOptions({
        originLat: 13.0827,
        originLng: 80.2707,
        destLat: 12.6163,
        destLng: 80.1983,
        preference: 'any',
      });

      assert(result.options && result.options.length >= 3, 'Should provide at least 3 transport options for short trip');
      
      const carOpt = result.options.find((o) => o.type === 'car');
      const cabOpt = result.options.find((o) => o.type === 'cab');
      const busOpt = result.options.find((o) => o.type === 'bus');
      const flightOpt = result.options.find((o) => o.type === 'flight');

      assert(carOpt, 'Must include Car / Private Vehicle option');
      assert(cabOpt, 'Must include Cab / Taxi option');
      assert(busOpt, 'Must include Bus option');
      assert(!flightOpt, 'Should NOT include Flight for short 57 km trip');

      assert(carOpt.is_estimated === true, 'Cost must be explicitly labelled as estimated');
      assert(cabOpt.estimated_cost > carOpt.estimated_cost, 'Cab fare should exceed self-drive fuel cost');
      assert(result.recommended_transport_id, 'Must contain a recommended transport ID');
      assert(result.recommended_reason, 'Must contain plain-English recommendation rationale');

      console.log(`   🚗 Car Fuel & Tolls: ${carOpt.cost_text} (${carOpt.duration_text})`);
      console.log(`   🚕 Cab Fare: ${cabOpt.cost_text} (${cabOpt.duration_text})`);
      console.log(`   🚌 Bus Fare: ${busOpt.cost_text} (${busOpt.duration_text})`);
      console.log(`   ⭐ Recommended: ${result.recommended_transport_id} - ${result.recommended_reason}`);
      logPass('Short journey transport options, fares, and modes calculated correctly');
    } catch (err) {
      logFail('Short journey transport test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Long Distance Journey: Chennai -> Goa (> 700 km)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Long Distance Journey: Chennai -> Goa (> 700 km) ---');
    try {
      const longResult = await transportService.getTransportOptions({
        originLat: 13.0827,
        originLng: 80.2707,
        destLat: 15.2993,
        destLng: 74.1240,
        preference: 'any',
      });

      const flightOpt = longResult.options.find((o) => o.type === 'flight');
      const trainOpt = longResult.options.find((o) => o.type === 'train');

      assert(flightOpt, 'Must include Flight option for long distance journey (>320 km)');
      assert(trainOpt, 'Must include Train option for intercity journey');
      assert(flightOpt.duration_seconds < trainOpt.duration_seconds, 'Flight duration must be faster than train');

      console.log(`   ✈️ Flight: ${flightOpt.cost_text} (${flightOpt.duration_text})`);
      console.log(`   🚆 Train: ${trainOpt.cost_text} (${trainOpt.duration_text})`);
      logPass('Long distance journey includes flight and train with accurate durations');
    } catch (err) {
      logFail('Long distance transport test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. User Preference: Cheapest vs Fastest vs Comfortable
    // -----------------------------------------------------------------
    console.log('\n--- 3. User Preference Logic ---');
    try {
      const cheapResult = await transportService.getTransportOptions({
        originLat: 13.0827,
        originLng: 80.2707,
        destLat: 15.2993,
        destLng: 74.1240,
        distanceKm: 750,
        durationSeconds: 48000,
        preference: 'cheapest',
      });

      const fastResult = await transportService.getTransportOptions({
        originLat: 13.0827,
        originLng: 80.2707,
        destLat: 15.2993,
        destLng: 74.1240,
        distanceKm: 750,
        durationSeconds: 48000,
        preference: 'fastest',
      });

      const comfortResult = await transportService.getTransportOptions({
        originLat: 13.0827,
        originLng: 80.2707,
        destLat: 15.2993,
        destLng: 74.1240,
        distanceKm: 750,
        durationSeconds: 48000,
        preference: 'comfortable',
      });

      assert(['transport_train', 'transport_bus'].includes(cheapResult.recommended_transport_id), 'Cheapest preference should pick Train or Bus');
      assert.strictEqual(fastResult.recommended_transport_id, 'transport_flight', 'Fastest preference for long trip should pick Flight');
      assert(['transport_flight', 'transport_cab'].includes(comfortResult.recommended_transport_id), 'Comfortable preference should pick premium mode');

      console.log(`   💰 Cheapest Preference: ${cheapResult.recommended_transport_id}`);
      console.log(`   ⚡ Fastest Preference: ${fastResult.recommended_transport_id}`);
      console.log(`   🛋️ Comfortable Preference: ${comfortResult.recommended_transport_id}`);
      logPass('User preference filters adapt recommendation appropriately');
    } catch (err) {
      logFail('Preference filtering test failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Error Handling on Invalid Coordinates
    // -----------------------------------------------------------------
    console.log('\n--- 4. Error Handling & Coordinate Bounds ---');
    try {
      let caught = false;
      try {
        await transportService.getTransportOptions({ originLat: 'invalid', originLng: null, destLat: 12.6, destLng: 80.1 });
      } catch (e) {
        caught = true;
        assert.strictEqual(e.statusCode, 400);
      }
      assert(caught, 'Must reject invalid coordinates with HTTP 400');
      logPass('Invalid coordinate parameters rejected with HTTP 400');
    } catch (err) {
      logFail('Input validation test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Transport Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exitCode = failCount > 0 ? 1 : 0;
    }
  } catch (error) {
    console.error('Fatal transport test error:', error);
    if (require.main === module) {
      process.exitCode = 1;
    }
  }
}

if (require.main === module) {
  runTransportTests();
}

module.exports = { runTransportTests };
