const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const hotelService = require('../src/services/hotelService');
const config = require('../src/config/environment');

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

async function runHotelTests() {
  console.log('=====================================================');
  console.log('  Testing Hotel / Stay Recommendations (Phase 7)    ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/hotels`;

  try {
    // -----------------------------------------------------------------
    // 1. Hotel Search for Mahabalipuram with Real Information
    // -----------------------------------------------------------------
    console.log('--- 1. Hotel Search for Mahabalipuram ---');
    try {
      const res = await fetch(`${BASE_URL}/nearby?destinationName=Mahabalipuram&latitude=12.6163&longitude=80.1983`);
      const json = await res.json();
      const data = json.data;

      assert.strictEqual(res.status, 200, 'HTTP 200 required');
      assert(Array.isArray(data.hotels) && data.hotels.length >= 3, 'Must return at least 3 verified hotels for Mahabalipuram');
      
      const radisson = data.hotels.find((h) => h.id === 'hotel_maha_radisson');
      assert(radisson, 'Must include Radisson Blu Resort Temple Bay');
      assert(radisson.rating >= 4.0, 'Radisson rating must be >= 4.0');
      assert(radisson.distance_km >= 0, 'Distance must be calculated via Haversine');
      assert(radisson.featured_image_url && radisson.featured_image_url.startsWith('http'), 'Must have real image URL');
      assert(radisson.is_estimated_price, 'Price must be flagged as estimated');
      assert(radisson.price_display.includes('Approx'), 'Price display must indicate approximate price');

      console.log(`   🏨 Found ${data.total_found} stays near ${data.destination}`);
      console.log(`   📍 Top Match: ${data.hotels[0].name} (${data.hotels[0].distance_label}) - ${data.hotels[0].price_display}`);
      logPass('Mahabalipuram hotels returned with real info, coordinates, photos, and approximate pricing');
    } catch (err) {
      logFail('Mahabalipuram hotel search test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Type Filtering (Resort vs Homestay vs Hotel)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Accommodation Type Filtering ---');
    try {
      const resortRes = await fetch(`${BASE_URL}/nearby?destinationName=Mahabalipuram&type=resort`);
      const resortJson = await resortRes.json();
      const resorts = resortJson.data.hotels;

      assert(resorts.length > 0, 'Must return resorts');
      assert(resorts.every((h) => h.type === 'resort'), 'All returned stays must have type resort');

      const homestayRes = await fetch(`${BASE_URL}/nearby?destinationName=Mahabalipuram&type=homestay`);
      const homestayJson = await homestayRes.json();
      const homestays = homestayJson.data.hotels;

      assert(homestays.length > 0, 'Must return homestays');
      assert(homestays.every((h) => h.type === 'homestay'), 'All returned stays must have type homestay');

      console.log(`   🏕️ Resorts found: ${resorts.map((r) => r.name).join(', ')}`);
      console.log(`   🏡 Homestays found: ${homestays.map((h) => h.name).join(', ')}`);
      logPass('Accommodation type filtering works correctly');
    } catch (err) {
      logFail('Type filtering test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Price & Rating Filtering
    // -----------------------------------------------------------------
    console.log('\n--- 3. Price & Rating Filtering ---');
    try {
      const budgetRes = await fetch(`${BASE_URL}/nearby?destinationName=Ooty&maxPrice=3000&minRating=4.0`);
      const budgetJson = await budgetRes.json();
      const budgetStays = budgetJson.data.hotels;

      assert(budgetStays.length > 0, 'Must return affordable stays in Ooty');
      assert(budgetStays.every((h) => h.approx_price_per_night <= 3000), 'All stays must be <= ₹3,000/night');
      assert(budgetStays.every((h) => h.rating >= 4.0), 'All stays must have rating >= 4.0');

      console.log(`   💰 Budget Stays in Ooty: ${budgetStays.map((h) => `${h.name} (₹${h.approx_price_per_night}, ${h.rating}⭐)`).join(', ')}`);
      logPass('Price and rating filtering works accurately');
    } catch (err) {
      logFail('Price & rating filter test failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Sorting (Lowest Price vs Highest Rating vs Closest Distance)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Multi-Attribute Sorting ---');
    try {
      // Sort by price low
      const priceSortRes = await fetch(`${BASE_URL}/nearby?destinationName=Mahabalipuram&sortBy=price_low`);
      const priceJson = await priceSortRes.json();
      const priceHotels = priceJson.data.hotels;

      for (let i = 0; i < priceHotels.length - 1; i++) {
        assert(priceHotels[i].approx_price_per_night <= priceHotels[i + 1].approx_price_per_night, 'Price must be in ascending order');
      }

      // Sort by rating high
      const ratingSortRes = await fetch(`${BASE_URL}/nearby?destinationName=Mahabalipuram&sortBy=rating_high`);
      const ratingJson = await ratingSortRes.json();
      const ratingHotels = ratingJson.data.hotels;

      for (let i = 0; i < ratingHotels.length - 1; i++) {
        assert(ratingHotels[i].rating >= ratingHotels[i + 1].rating, 'Rating must be in descending order');
      }

      logPass('Sorting by price_low and rating_high verified');
    } catch (err) {
      logFail('Sorting test failed', err);
    }

    // -----------------------------------------------------------------
    // 5. Budget-Aware Recommended Stay Spotlight
    // -----------------------------------------------------------------
    console.log('\n--- 5. Budget-Aware Recommended Stay Spotlight ---');
    try {
      const spotRes = await fetch(`${BASE_URL}/nearby?destinationName=Ooty&budget=12000`);
      const spotJson = await spotRes.json();
      const spotlight = spotJson.data.recommended_stay;

      assert(spotlight && spotlight.name, 'Must return recommended stay spotlight');
      assert(spotlight.badge_label, 'Must include badge label');
      assert(spotlight.recommendation_reason, 'Must provide plain-English reason');

      console.log(`   ⭐ Spotlight: ${spotlight.name} - ${spotlight.recommendation_reason}`);
      logPass('Budget-aware recommended stay spotlight generated');
    } catch (err) {
      logFail('Recommended stay spotlight test failed', err);
    }

    // -----------------------------------------------------------------
    // 6. Single Hotel Details Endpoint
    // -----------------------------------------------------------------
    console.log('\n--- 6. Single Hotel Details Endpoint ---');
    try {
      const detailRes = await fetch(`${BASE_URL}/hotel_maha_radisson`);
      const detailJson = await detailRes.json();
      const hotel = detailJson.data;

      assert.strictEqual(detailRes.status, 200, 'HTTP 200 required');
      assert.strictEqual(hotel.id, 'hotel_maha_radisson');
      assert(Array.isArray(hotel.amenities) && hotel.amenities.length >= 3, 'Must include amenities');
      assert(Array.isArray(hotel.nearby_attractions) && hotel.nearby_attractions.length > 0, 'Must include nearby attractions');

      console.log(`   🏨 Hotel Details: ${hotel.name}`);
      console.log(`   🏊 Amenities: ${hotel.amenities.slice(0, 3).join(' • ')}`);
      logPass('GET /api/hotels/:id returns complete hotel details');
    } catch (err) {
      logFail('Single hotel details test failed', err);
    }

    // -----------------------------------------------------------------
    // 7. Error Handling for Non-Existent Hotel
    // -----------------------------------------------------------------
    console.log('\n--- 7. Error Handling for Non-Existent Hotel ---');
    try {
      const errRes = await fetch(`${BASE_URL}/non_existent_hotel_999`);
      assert.strictEqual(errRes.status, 404, 'Must return HTTP 404 for unknown hotel ID');
      logPass('Unknown hotel ID properly rejected with HTTP 404');
    } catch (err) {
      logFail('Error handling test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Hotel Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (failCount > 0) {
      process.exitCode = 1;
      return false;
    }
    return true;
  } catch (error) {
    console.error('Fatal Hotel test error:', error);
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  runHotelTests();
}

module.exports = { runHotelTests };
