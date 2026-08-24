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

async function runLocationTests() {
  console.log('=====================================================');
  console.log('  Testing GPS Location & Reverse Geocoding (Phase 1) ');
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Chennai Coordinates (13.0827, 80.2707)
    // -----------------------------------------------------------------
    console.log('--- 1. Chennai Coordinates (13.0827, 80.2707) ---');
    try {
      const result = await locationService.reverseGeocode(13.0827, 80.2707);
      assert(result.city, 'Result must contain city name');
      assert(result.state, 'Result must contain state name');
      assert(result.locationLabel, 'Result must contain locationLabel');
      assert.strictEqual(result.latitude, 13.0827, 'Latitude must match');
      assert.strictEqual(result.longitude, 80.2707, 'Longitude must match');
      console.log(`   Detected Location: 📍 ${result.locationLabel} (${result.country})`);
      assert(result.city.toLowerCase().includes('chennai') || result.locationLabel.toLowerCase().includes('tamil nadu'), 'Should detect Chennai/Tamil Nadu');
      logPass('Chennai coordinates accurately reverse-geocoded');
    } catch (err) {
      logFail('Chennai reverse geocoding test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Paris Coordinates (48.8566, 2.3522)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Paris Coordinates (48.8566, 2.3522) ---');
    try {
      const result = await locationService.reverseGeocode(48.8566, 2.3522);
      assert(result.city, 'Result must contain city name');
      console.log(`   Detected Location: 📍 ${result.locationLabel} (${result.country})`);
      assert(result.city.toLowerCase().includes('paris') || result.locationLabel.toLowerCase().includes('france'), 'Should detect Paris/France');
      logPass('Paris coordinates accurately reverse-geocoded');
    } catch (err) {
      logFail('Paris reverse geocoding test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Input Validation & Error Handling
    // -----------------------------------------------------------------
    console.log('\n--- 3. Input Validation & Boundaries ---');
    try {
      let caughtNaN = false;
      try {
        await locationService.reverseGeocode('invalid', 'coordinates');
      } catch (e) {
        caughtNaN = true;
        assert.strictEqual(e.statusCode, 400);
      }
      assert(caughtNaN, 'Must reject NaN coordinates with HTTP 400');
      logPass('Invalid non-numeric coordinates rejected with HTTP 400');

      let caughtOutOfBounds = false;
      try {
        await locationService.reverseGeocode(999, 999);
      } catch (e) {
        caughtOutOfBounds = true;
        assert.strictEqual(e.statusCode, 400);
      }
      assert(caughtOutOfBounds, 'Must reject out-of-bounds coordinates with HTTP 400');
      logPass('Out-of-bounds coordinates rejected with HTTP 400');
    } catch (err) {
      logFail('Input validation test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Location Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exit(failCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal location test error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runLocationTests();
}

module.exports = { runLocationTests };
