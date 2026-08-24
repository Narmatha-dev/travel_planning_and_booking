const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const placesService = require('../src/services/placesService');

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

async function runPlacesTests() {
  console.log('=====================================================');
  console.log('  Testing Real Nearby Places & Images (Phase 2)      ');
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Chennai Coordinates (13.0827, 80.2707) - Nearby Attractions
    // -----------------------------------------------------------------
    console.log('--- 1. Chennai Coordinates (13.0827, 80.2707) ---');
    try {
      const result = await placesService.getNearbyTouristPlaces({
        latitude: 13.0827,
        longitude: 80.2707,
        radiusKm: 100,
        limit: 6,
      });

      assert(result.places && result.places.length > 0, 'Must return nearby tourist places');
      console.log(`   Found ${result.places.length} real places near Chennai:`);
      result.places.forEach((p) => {
        console.log(`   - 📍 ${p.name} (${p.category_label}) - ⭐ ${p.rating} | ${p.distance_label}`);
        assert(p.featured_image_url, `Place '${p.name}' must have a real image URL`);
        assert(p.rating > 0, `Place '${p.name}' must have a valid rating`);
        assert(p.address, `Place '${p.name}' must have a real address`);
        assert(p.distance_km !== undefined, `Place '${p.name}' must have distance_km calculated`);
        assert(p.google_maps_url, `Place '${p.name}' must have a Google Maps link`);
      });

      // Closest place to central Chennai should be Marina Beach or Kapaleeshwarar
      const closest = result.places[0];
      assert(closest.distance_km < 15, `Closest place should be < 15km away, got ${closest.distance_km}km`);
      logPass('Chennai nearby tourist places returned with real images, ratings, and distances');
    } catch (err) {
      logFail('Chennai nearby places test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Category Filtering (Beaches)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Category Filtering (Beaches) ---');
    try {
      const beachResult = await placesService.getNearbyTouristPlaces({
        latitude: 13.0827,
        longitude: 80.2707,
        category: 'beach',
        limit: 5,
      });

      assert(beachResult.places.length > 0, 'Must return beach destinations');
      beachResult.places.forEach((p) => {
        assert(p.category === 'beach' || p.category_label.toLowerCase().includes('beach'));
      });
      logPass('Category filtering for beaches verified');
    } catch (err) {
      logFail('Category filtering test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Place Details Lookup
    // -----------------------------------------------------------------
    console.log('\n--- 3. Single Place Details Lookup ---');
    try {
      const placeDetails = await placesService.getPlaceDetails('place_chn_marina');
      assert.strictEqual(placeDetails.name, 'Marina Beach');
      assert(placeDetails.opening_hours, 'Must have opening hours');
      assert(placeDetails.gallery_images.length > 0, 'Must have gallery images');
      logPass('Detailed place information retrieved successfully');
    } catch (err) {
      logFail('Place details lookup failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Paris Coordinates (48.8566, 2.3522) - Global Nearby Places
    // -----------------------------------------------------------------
    console.log('\n--- 4. Global Coordinates (Paris: 48.8566, 2.3522) ---');
    try {
      const parisResult = await placesService.getNearbyTouristPlaces({
        latitude: 48.8566,
        longitude: 2.3522,
        limit: 4,
      });

      assert(parisResult.places.length > 0, 'Must return places for Paris coordinates');
      console.log(`   Closest to Paris: ${parisResult.places[0].name} (${parisResult.places[0].distance_label})`);
      assert(parisResult.places[0].distance_km < 10, 'Closest place in Paris must be < 10km');
      logPass('Paris nearby places accurately calculated with real distances');
    } catch (err) {
      logFail('Paris nearby places test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Places Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exit(failCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal places test error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runPlacesTests();
}

module.exports = { runPlacesTests };
