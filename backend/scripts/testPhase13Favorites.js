const app = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testPhase13FavoritesSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 13: Favorites, Wishlist & Saved Places');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/favorites`;
  const RECS_URL = `http://localhost:${config.port}/api/recommendations`;
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

  // Generate Traveler JWT token
  const jwtSecret = config.jwt?.secret || process.env.JWT_SECRET || 'travel_jwt_super_secret_key_2026_secure!';
  const travelerToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const travelerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${travelerToken}`,
  };

  let testPlaceFavId = null;

  // 1. Authentication Guards (Feature 12 & 13)
  console.log('--- 1. Authentication & Security Guards (Feature 12 & 13) ---');
  try {
    // Unauthenticated access
    const resNoAuth = await fetch(BASE_URL);
    assert(
      'GET /api/favorites without token returns HTTP 401 Unauthorized',
      resNoAuth.status === 401,
      `Status: ${resNoAuth.status}`
    );

    const resAddNoAuth = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: 'destination', itemId: '1' }),
    });
    assert(
      'POST /api/favorites without token returns HTTP 401 Unauthorized',
      resAddNoAuth.status === 401,
      `Status: ${resAddNoAuth.status}`
    );
  } catch (err) {
    assert('Auth test failed', false, err.message);
  }

  // 2. Save Destination, Tourist Place, Hotel, and Trip (Feature 2, 3, 4 & 8)
  console.log('\n--- 2. Save Destination, Place, Hotel & Trip (Feature 2, 3, 4 & 8) ---');
  try {
    // Save Destination (Feature 2)
    const resFavDest = await fetch(BASE_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        itemType: 'destination',
        itemId: '1',
        destinationId: 1,
        title: 'Bali Paradise Island',
        subtitle: 'Indonesia • Tropical Beach Haven',
        category: 'beach',
        rating: 4.9,
        base_price: 899,
        image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        location: 'Bali, Indonesia',
      }),
    });
    const jsonFavDest = await resFavDest.json();

    assert(
      'POST /api/favorites saves tourist destination (HTTP 201)',
      resFavDest.status === 201 && jsonFavDest.data?.id,
      `Status: ${resFavDest.status}, ID: ${jsonFavDest.data?.id}`
    );

    // Save Tourist Place / Attraction (Feature 3)
    const resFavPlace = await fetch(BASE_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        itemType: 'place',
        itemId: 'place_ooty_botanical',
        title: 'Government Botanical Garden',
        subtitle: 'Lush 55-acre terraced garden with rare flora',
        category: 'nature',
        rating: 4.7,
        location: 'Ooty, Tamil Nadu',
        image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
      }),
    });
    const jsonFavPlace = await resFavPlace.json();
    testPlaceFavId = jsonFavPlace.data?.id;

    assert(
      'POST /api/favorites saves individual tourist place / attraction (HTTP 201)',
      resFavPlace.status === 201 && jsonFavPlace.data?.id,
      `Status: ${resFavPlace.status}, Place ID: ${jsonFavPlace.data?.id}`
    );

    // Save Hotel (Feature 4)
    const resFavHotel = await fetch(BASE_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        itemType: 'hotel',
        itemId: 'hotel_maha_radisson',
        title: 'Radisson Blu Resort Temple Bay Mamallapuram',
        subtitle: 'Luxury Resort • Beachfront',
        category: 'hotel',
        rating: 4.6,
        approx_price_per_night: 8500,
        location: 'Mamallapuram, Tamil Nadu',
      }),
    });
    assert('POST /api/favorites saves hotel recommendation (HTTP 201)', resFavHotel.status === 201);

    // Save Trip Plan (Feature 8)
    const resFavTrip = await fetch(BASE_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        itemType: 'trip',
        itemId: '1',
        title: "Alex's Bali Summer Escape",
        subtitle: '7-Day Tropical Itinerary',
        category: 'trip',
        rating: 5.0,
        total_budget: 1450,
      }),
    });
    assert('POST /api/favorites saves custom trip plan (HTTP 201)', resFavTrip.status === 201);
  } catch (err) {
    assert('Save items test failed', false, err.message);
  }

  // 3. Duplicate Favorite Prevention (Feature 14)
  console.log('\n--- 3. Duplicate Favorite Prevention (Feature 14) ---');
  try {
    const resDup = await fetch(BASE_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        itemType: 'place',
        itemId: 'place_ooty_botanical',
        title: 'Government Botanical Garden',
      }),
    });
    const jsonDup = await resDup.json();

    assert(
      'Idempotently prevents duplicate favorite entries for same item',
      resDup.status === 201 && jsonDup.data?.isNew === false,
      `isNew: ${jsonDup.data?.isNew}, Msg: ${jsonDup.message}`
    );
  } catch (err) {
    assert('Duplicate prevention test failed', false, err.message);
  }

  // 4. Favorite Status Checking (Feature 9)
  console.log('\n--- 4. Favorite Status Checking (Feature 9) ---');
  try {
    const resCheck = await fetch(`${BASE_URL}/check/place/place_ooty_botanical`, {
      headers: travelerHeaders,
    });
    const jsonCheck = await resCheck.json();

    assert(
      'GET /api/favorites/check/:type/:id returns isFavorite = true for saved item',
      resCheck.status === 200 && jsonCheck.data?.isFavorite === true,
      `isFavorite: ${jsonCheck.data?.isFavorite}`
    );

    const resCheckUnsaved = await fetch(`${BASE_URL}/check/place/non_existent_place_999`, {
      headers: travelerHeaders,
    });
    const jsonCheckUnsaved = await resCheckUnsaved.json();

    assert(
      'GET /api/favorites/check/:type/:id returns isFavorite = false for unsaved item',
      resCheckUnsaved.status === 200 && jsonCheckUnsaved.data?.isFavorite === false,
      `isFavorite: ${jsonCheckUnsaved.data?.isFavorite}`
    );
  } catch (err) {
    assert('Favorite check failed', false, err.message);
  }

  // 5. Get Favorites & Summary (Feature 5 & 15)
  console.log('\n--- 5. Get Favorites List & Summary (Feature 5 & 15) ---');
  try {
    const resList = await fetch(BASE_URL, { headers: travelerHeaders });
    const jsonList = await resList.json();
    const favorites = jsonList.data?.favorites || [];
    const summary = jsonList.data?.summary;

    assert(
      'GET /api/favorites returns list of saved items and category summary',
      resList.status === 200 && favorites.length >= 4 && summary?.total >= 4,
      `Favorites Count: ${favorites.length}, Total Summary: ${summary?.total}`
    );

    // Filter by Places
    const resPlaces = await fetch(`${BASE_URL}?category=places`, { headers: travelerHeaders });
    const jsonPlaces = await resPlaces.json();
    const allPlaces = (jsonPlaces.data?.favorites || []).every(
      (f) => f.item_type === 'destination' || f.item_type === 'place'
    );

    assert(
      'GET /api/favorites?category=places filters only saved attractions and destinations',
      resPlaces.status === 200 && allPlaces && jsonPlaces.data?.favorites?.length > 0,
      `Places count: ${jsonPlaces.data?.favorites?.length}`
    );

    // Filter by Hotels
    const resHotels = await fetch(`${BASE_URL}?category=hotels`, { headers: travelerHeaders });
    const jsonHotels = await resHotels.json();
    const allHotels = (jsonHotels.data?.favorites || []).every((f) => f.item_type === 'hotel');

    assert(
      'GET /api/favorites?category=hotels filters only saved accommodations',
      resHotels.status === 200 && allHotels && jsonHotels.data?.favorites?.length > 0,
      `Hotels count: ${jsonHotels.data?.favorites?.length}`
    );

    // Search query
    const resSearch = await fetch(`${BASE_URL}?search=Botanical`, { headers: travelerHeaders });
    const jsonSearch = await resSearch.json();

    assert(
      'GET /api/favorites?search=... performs live search across saved items',
      resSearch.status === 200 && jsonSearch.data?.favorites?.length === 1,
      `Search results count: ${jsonSearch.data?.favorites?.length}`
    );
  } catch (err) {
    assert('Favorites list test failed', false, err.message);
  }

  // 6. Toggle Favorite (Feature 1 & 6)
  console.log('\n--- 6. Toggle Favorite Endpoint (Feature 1 & 6) ---');
  try {
    const togglePayload = {
      itemType: 'hotel',
      itemId: 'hotel_maha_chariot',
      title: 'Chariot Beach Resort',
    };

    // First toggle: Adds
    const resToggleAdd = await fetch(`${BASE_URL}/toggle`, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify(togglePayload),
    });
    const jsonToggleAdd = await resToggleAdd.json();

    assert(
      'POST /api/favorites/toggle adds item when not previously saved',
      resToggleAdd.status === 200 && jsonToggleAdd.data?.isFavorite === true,
      `isFavorite: ${jsonToggleAdd.data?.isFavorite}`
    );

    // Second toggle: Removes
    const resToggleRem = await fetch(`${BASE_URL}/toggle`, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify(togglePayload),
    });
    const jsonToggleRem = await resToggleRem.json();

    assert(
      'POST /api/favorites/toggle removes item when clicked again',
      resToggleRem.status === 200 && jsonToggleRem.data?.isFavorite === false,
      `isFavorite: ${jsonToggleRem.data?.isFavorite}`
    );
  } catch (err) {
    assert('Toggle test failed', false, err.message);
  }

  // 7. Remove Favorite & Data Integrity (Feature 6)
  console.log('\n--- 7. Remove Favorite & Zero Side-Effect Check (Feature 6) ---');
  try {
    const resRemove = await fetch(`${BASE_URL}/${testPlaceFavId}`, {
      method: 'DELETE',
      headers: travelerHeaders,
    });

    assert(
      'DELETE /api/favorites/:id removes favorite relationship successfully',
      resRemove.status === 200,
      `Status: ${resRemove.status}`
    );
  } catch (err) {
    assert('Remove favorite test failed', false, err.message);
  }

  // 8. AI Recommendations Leveraging User Favorites (Feature 18)
  console.log('\n--- 8. AI Integration with Favorites (Feature 18) ---');
  try {
    const resRecs = await fetch(RECS_URL, {
      method: 'POST',
      headers: travelerHeaders,
      body: JSON.stringify({
        userId: 3,
        interests: ['beach'],
        travelType: 'family',
        includeHistory: true,
      }),
    });
    const jsonRecs = await resRecs.json();

    assert(
      'POST /api/recommendations incorporates user favorites into AI suggestion scores',
      resRecs.status === 200 && Array.isArray(jsonRecs.data?.recommendations),
      `Status: ${resRecs.status}, Recs Count: ${jsonRecs.data?.recommendations?.length}`
    );
  } catch (err) {
    assert('AI integration test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 13 Favorites Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 13 Favorites tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 13 Favorites tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase13FavoritesSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase13FavoritesSuite;

