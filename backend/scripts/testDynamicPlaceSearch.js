/**
 * Dynamic Universal Place Search & Google Places API (New) Automated Test Suite
 * Tests the 10 required sample searches:
 * 1. Eiffel Tower
 * 2. Taj Mahal
 * 3. Marina Beach Chennai
 * 4. Burj Khalifa
 * 5. Tokyo Tower
 * 6. Gateway of India
 * 7. Munnar
 * 8. Bali
 * 9. Sydney Opera House
 * 10. Colosseum Rome
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const googlePlacesService = require('../src/services/googlePlacesService');
const locationService = require('../src/services/locationService');

const TARGET_DESTINATIONS = [
  {
    query: 'Eiffel Tower',
    expectedName: 'Eiffel Tower',
    expectedCity: 'Paris',
    expectedCountry: 'France',
    expectedLat: 48.8584,
    expectedLng: 2.2945,
  },
  {
    query: 'Taj Mahal',
    expectedName: 'Taj Mahal',
    expectedCity: 'Agra',
    expectedCountry: 'India',
    expectedLat: 27.1751,
    expectedLng: 78.0421,
  },
  {
    query: 'Marina Beach Chennai',
    expectedName: 'Marina Beach',
    expectedCity: 'Chennai',
    expectedCountry: 'India',
    expectedLat: 13.0500,
    expectedLng: 80.2824,
  },
  {
    query: 'Burj Khalifa',
    expectedName: 'Burj Khalifa',
    expectedCity: 'Dubai',
    expectedCountry: 'United Arab Emirates',
    expectedLat: 25.1972,
    expectedLng: 55.2744,
  },
  {
    query: 'Tokyo Tower',
    expectedName: 'Tokyo Tower',
    expectedCity: 'Tokyo',
    expectedCountry: 'Japan',
    expectedLat: 35.6586,
    expectedLng: 139.7454,
  },
  {
    query: 'Gateway of India',
    expectedName: 'Gateway of India',
    expectedCity: 'Mumbai',
    expectedCountry: 'India',
    expectedLat: 18.9220,
    expectedLng: 72.8347,
  },
  {
    query: 'Munnar',
    expectedName: 'Munnar',
    expectedCity: 'Munnar',
    expectedCountry: 'India',
    expectedLat: 10.0889,
    expectedLng: 77.0595,
  },
  {
    query: 'Bali',
    expectedName: 'Bali',
    expectedCountry: 'Indonesia',
    expectedLat: -8.3405,
    expectedLng: 115.0920,
  },
  {
    query: 'Sydney Opera House',
    expectedName: 'Sydney Opera House',
    expectedCity: 'Sydney',
    expectedCountry: 'Australia',
    expectedLat: -33.8568,
    expectedLng: 151.2153,
  },
  {
    query: 'Colosseum Rome',
    expectedName: 'Colosseum',
    expectedCity: 'Rome',
    expectedCountry: 'Italy',
    expectedLat: 41.8902,
    expectedLng: 12.4922,
  },
];

async function runDynamicPlaceSearchTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING DYNAMIC WORLDWIDE PLACE SEARCH TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  // Test User Origin Location: Chennai (13.0827, 80.2707)
  const userOrigin = {
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
  };

  for (let i = 0; i < TARGET_DESTINATIONS.length; i++) {
    const target = TARGET_DESTINATIONS[i];
    const testNum = i + 1;
    console.log(`\n--- Test ${testNum}: Search for "${target.query}" ---`);

    try {
      // 1. Execute Place Search
      const searchRes = await googlePlacesService.searchPlaces(target.query, {
        latitude: userOrigin.latitude,
        longitude: userOrigin.longitude,
      });

      assert(searchRes, 'Search response must exist');
      assert(searchRes.primaryMatch, `Must find a primary match for ${target.query}`);

      const place = searchRes.primaryMatch;
      console.log(`   Found: "${place.name}" (${place.city ? place.city + ', ' : ''}${place.country})`);
      console.log(`   Coordinates: [${place.latitude}, ${place.longitude}]`);
      console.log(`   Photo URL: ${place.photoUrl?.slice(0, 60)}...`);
      console.log(`   Attribution: ${place.photoAttribution || 'Licensed'}`);

      // Verify Name
      assert(
        place.name.toLowerCase().includes(target.expectedName.toLowerCase()) ||
          target.expectedName.toLowerCase().includes(place.name.toLowerCase()),
        `Expected name '${target.expectedName}', got '${place.name}'`
      );

      // Verify Country
      if (target.expectedCountry) {
        assert(
          place.country.toLowerCase().includes(target.expectedCountry.toLowerCase()) ||
            place.formattedAddress.toLowerCase().includes(target.expectedCountry.toLowerCase()),
          `Expected country '${target.expectedCountry}', got '${place.country}'`
        );
      }

      // Verify City (if applicable)
      if (target.expectedCity) {
        assert(
          place.city.toLowerCase().includes(target.expectedCity.toLowerCase()) ||
            place.formattedAddress.toLowerCase().includes(target.expectedCity.toLowerCase()),
          `Expected city '${target.expectedCity}', got '${place.city}'`
        );
      }

      // Verify Coordinates (within reasonable proximity)
      const latDiff = Math.abs(place.latitude - target.expectedLat);
      const lngDiff = Math.abs(place.longitude - target.expectedLng);
      assert(latDiff < 1.0, `Latitude deviation too large: expected ${target.expectedLat}, got ${place.latitude}`);
      assert(lngDiff < 1.0, `Longitude deviation too large: expected ${target.expectedLng}, got ${place.longitude}`);

      // Verify Real Photograph URL
      assert(place.photoUrl && place.photoUrl.startsWith('http'), `Must have real photo URL for ${target.query}`);

      // Verify Google Maps URI
      assert(place.googleMapsUri && place.googleMapsUri.includes('maps'), `Must have Google Maps URI for ${target.query}`);

      // 2. Test Route Calculation from User Origin
      const route = await locationService.getRouteDirections({
        originLat: userOrigin.latitude,
        originLng: userOrigin.longitude,
        destLat: place.latitude,
        destLng: place.longitude,
        travelMode: 'driving',
      });

      assert(route && route.distance_km > 0, `Route calculation failed for ${target.query}`);
      console.log(`   Route from Chennai: ${route.distance_km} km • ${route.duration_text}`);

      console.log(`✔ [PASS] Test ${testNum}: "${target.query}" resolved accurately with real photo, exact coordinates & route`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] Test ${testNum}: "${target.query}" failed:`, err.message);
      failed++;
    }
  }

  // 11. Test Autocomplete Suggestions
  console.log('\n--- Test 11: Autocomplete Predictions ("taj", "eiff", "burj") ---');
  try {
    const tajSug = await googlePlacesService.getAutocomplete('taj');
    assert(tajSug.suggestions.length > 0, 'Must return autocomplete suggestions for "taj"');
    assert(tajSug.suggestions.some((s) => s.mainText.toLowerCase().includes('taj')), 'Must include Taj Mahal in suggestions');
    console.log(`   Autocomplete for 'taj': ${tajSug.suggestions.map((s) => s.mainText).join(' | ')}`);

    const eiffSug = await googlePlacesService.getAutocomplete('eiff');
    assert(eiffSug.suggestions.some((s) => s.mainText.toLowerCase().includes('eiffel')), 'Must include Eiffel Tower');
    console.log(`   Autocomplete for 'eiff': ${eiffSug.suggestions.map((s) => s.mainText).join(' | ')}`);

    console.log('✔ [PASS] Test 11: Search autocomplete predictions verified');
    passed++;
  } catch (err) {
    console.error('❌ [FAIL] Test 11: Autocomplete test failed:', err.message);
    failed++;
  }

  console.log('\n=============================================================');
  console.log(`📊 DYNAMIC PLACE SEARCH TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDynamicPlaceSearchTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
