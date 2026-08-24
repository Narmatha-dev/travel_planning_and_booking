const config = require('../src/config/environment');

async function testPhase11ReviewsSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 11: Reviews, Ratings & Trip Feedback ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/reviews`;
  const BOOKINGS_URL = `http://localhost:${config.port}/api/bookings`;
  const NOTIFS_URL = `http://localhost:${config.port}/api/notifications`;
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

  let testBookingId = null;
  let testReviewId = null;

  // 0. Setup: Create a completed trip booking
  console.log('--- 0. Setup: Create Completed Trip Booking ---');
  try {
    const resBooking = await fetch(BOOKINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        destinationName: 'Bali Paradise Island',
        packageTitle: 'Bali Tropical Bliss',
        bookingType: 'package',
        travelDate: '2026-07-15',
        numTravelers: 2,
        totalAmount: 1099.00,
        finalAmount: 1099.00,
        selectedHotel: { name: 'Ubud Serene Villa Resort', approx_price_per_night: 3200 },
        selectedTransport: { title: 'Private SUV Transfer', icon: '🚙', price: 1200 },
      }),
    });
    const jsonBooking = await resBooking.json();
    testBookingId = jsonBooking.data?.id;

    assert('Test booking created for review flow', Boolean(testBookingId), `Booking ID: #${testBookingId}`);
  } catch (err) {
    assert('Setup booking creation failed', false, err.message);
  }

  // 1. Eligibility Check (Feature 1 & 10)
  console.log('\n--- 1. Booking Eligibility Verification (Feature 1 & 10) ---');
  try {
    const resEligible = await fetch(`${BASE_URL}/eligibility?bookingId=${testBookingId}&userId=3`);
    const jsonEligible = await resEligible.json();

    assert(
      'GET /api/reviews/eligibility returns isEligible = true for confirmed traveler',
      resEligible.status === 200 && jsonEligible.data?.isEligible === true,
      `Status: ${resEligible.status}, isEligible: ${jsonEligible.data?.isEligible}`
    );
  } catch (err) {
    assert('Eligibility test failed', false, err.message);
  }

  // 2. Submit Review with Multi-Category Ratings (Feature 2, 3, 4 & 5)
  console.log('\n--- 2. Submit Multi-Category Review (Feature 2, 3, 4 & 5) ---');
  try {
    const reviewPayload = {
      userId: 3,
      bookingId: testBookingId,
      destinationId: 1,
      rating: 5,
      title: 'Flawless Tropical Holiday in Ubud',
      comment: 'The private villa, yoga sessions, and airport transport were executed perfectly. Highly recommended for couples!',
      travelDate: '2026-07-15',
      categoryRatings: {
        places: 5,
        hotel: 5,
        transport: 4,
      },
    };

    const resCreate = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    const jsonCreate = await resCreate.json();

    assert(
      'POST /api/reviews creates review with multi-category ratings (HTTP 201)',
      resCreate.status === 201 && jsonCreate.data?.id,
      `Status: ${resCreate.status}`
    );

    testReviewId = jsonCreate.data?.id;

    assert(
      'Created review is marked as is_verified_booking = true (Verified Traveller)',
      jsonCreate.data?.is_verified_booking === true,
      `is_verified_booking: ${jsonCreate.data?.is_verified_booking}`
    );

    assert(
      'Created review preserves categoryRatings metadata (Places, Hotel, Transport)',
      Boolean(jsonCreate.data?.category_ratings?.hotel === 5 && jsonCreate.data?.category_ratings?.transport === 4),
      `Category Ratings: ${JSON.stringify(jsonCreate.data?.category_ratings)}`
    );
  } catch (err) {
    assert('Review creation test failed', false, err.message);
  }

  // 3. Validation Guards: Rating Bounds & Input Sanitization (Feature 16)
  console.log('\n--- 3. Validation Guards (Feature 16) ---');
  try {
    // 0 stars
    const resZeroStar = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 0,
        title: 'Zero Star',
        comment: 'Testing invalid rating',
      }),
    });
    assert('Rejects review with rating < 1 (HTTP 400 Bad Request)', resZeroStar.status === 400);

    // 6 stars
    const resSixStar = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 6,
        title: 'Six Stars',
        comment: 'Testing invalid rating',
      }),
    });
    assert('Rejects review with rating > 5 (HTTP 400 Bad Request)', resSixStar.status === 400);

    // Empty Title
    const resNoTitle = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 5,
        title: '',
        comment: 'Valid comment here',
      }),
    });
    assert('Rejects review with missing or empty title (HTTP 400 Bad Request)', resNoTitle.status === 400);

    // Empty Comment (< 5 chars)
    const resShortComment = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        rating: 5,
        title: 'Good trip',
        comment: 'Hi',
      }),
    });
    assert('Rejects review with comment < 5 characters (HTTP 400 Bad Request)', resShortComment.status === 400);
  } catch (err) {
    assert('Validation tests failed', false, err.message);
  }

  // 4. Duplicate Review Prevention (Feature 6)
  console.log('\n--- 4. Duplicate Review Prevention (Feature 6) ---');
  try {
    const resDuplicate = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        bookingId: testBookingId,
        destinationId: 1,
        rating: 4,
        title: 'Duplicate Review Attempt',
        comment: 'Attempting to submit a second review for the same booking',
      }),
    });
    const jsonDuplicate = await resDuplicate.json();

    assert(
      'Rejects duplicate review for already reviewed booking (HTTP 409 Conflict)',
      resDuplicate.status === 409,
      `Status: ${resDuplicate.status}, Message: ${jsonDuplicate.message}`
    );
  } catch (err) {
    assert('Duplicate review test failed', false, err.message);
  }

  // 5. Fetch Review by Booking ID (Feature 6)
  console.log('\n--- 5. Get Existing Booking Review (Feature 6) ---');
  try {
    const resGetBookingRev = await fetch(`${BASE_URL}/booking/${testBookingId}?userId=3`);
    const jsonGetBookingRev = await resGetBookingRev.json();

    assert(
      'GET /api/reviews/booking/:bookingId returns existing review',
      resGetBookingRev.status === 200 && jsonGetBookingRev.data?.review?.id === testReviewId,
      `Retrieved review ID: ${jsonGetBookingRev.data?.review?.id}`
    );
  } catch (err) {
    assert('Get booking review test failed', false, err.message);
  }

  // 6. Edit Review (Feature 7)
  console.log('\n--- 6. Edit Review (Feature 7) ---');
  try {
    const updatedTitle = 'Updated: Absolutely Outstanding Balinese Vacation';
    const resUpdate = await fetch(`${BASE_URL}/${testReviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        rating: 5,
        title: updatedTitle,
        comment: 'Updated feedback: Our private villa and daily excursions were top notch. Will return next summer!',
      }),
    });
    const jsonUpdate = await resUpdate.json();

    assert(
      'PUT /api/reviews/:id updates review content for author',
      resUpdate.status === 200 && jsonUpdate.data?.title === updatedTitle,
      `Updated Title: ${jsonUpdate.data?.title}`
    );

    // Test unauthorized update attempt by another user
    const resUnauthorized = await fetch(`${BASE_URL}/${testReviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 4, // non-author
        title: 'Hacked Title',
        comment: 'Attempting to edit someone else review',
      }),
    });

    assert(
      'Rejects edit attempt by non-author user (HTTP 403 Forbidden)',
      resUnauthorized.status === 403,
      `Status: ${resUnauthorized.status}`
    );
  } catch (err) {
    assert('Edit review test failed', false, err.message);
  }

  // 7. Live Rating Distribution & Filtering (Feature 11 & 12)
  console.log('\n--- 7. Rating Distribution & Filters (Feature 11 & 12) ---');
  try {
    const resDist = await fetch(`${BASE_URL}?destinationId=1`);
    const jsonDist = await resDist.json();
    const aggregates = jsonDist.data?.aggregates;

    assert(
      'Calculates real average rating and 5-star distribution breakdown',
      typeof aggregates?.averageRating === 'number' && typeof aggregates?.distribution?.['5'] === 'number',
      `Avg: ${aggregates?.averageRating}, 5-Stars: ${aggregates?.distribution?.['5']}`
    );

    // Test Star Filter
    const resFilter5 = await fetch(`${BASE_URL}?destinationId=1&rating=5`);
    const jsonFilter5 = await resFilter5.json();
    const allAre5Star = (jsonFilter5.data?.reviews || []).every((r) => r.rating === 5);

    assert(
      'Filter reviews by star rating returns only matching reviews',
      allAre5Star && jsonFilter5.data?.reviews?.length > 0,
      `Count: ${jsonFilter5.data?.reviews?.length}`
    );
  } catch (err) {
    assert('Rating distribution test failed', false, err.message);
  }

  // 8. Delete Review & Zero Side-Effect Check (Feature 8)
  console.log('\n--- 8. Delete Review & Data Integrity Guard (Feature 8) ---');
  try {
    const resDelete = await fetch(`${BASE_URL}/${testReviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 3 }),
    });

    assert(
      'DELETE /api/reviews/:id removes review successfully',
      resDelete.status === 200,
      `Status: ${resDelete.status}`
    );

    // Verify booking is NOT affected or deleted
    const resCheckBooking = await fetch(`${BOOKINGS_URL}/${testBookingId}`);
    const jsonCheckBooking = await resCheckBooking.json();

    assert(
      'Deleting review DOES NOT delete or modify linked trip/booking record',
      Boolean(jsonCheckBooking.data?.id),
      `Booking preserved: ID #${jsonCheckBooking.data?.id}`
    );
  } catch (err) {
    assert('Delete review test failed', false, err.message);
  }

  // 9. Phase 10 Notification Trigger (Feature 18)
  console.log('\n--- 9. Notification Trigger Verification (Feature 18) ---');
  try {
    const resNotifs = await fetch(`${NOTIFS_URL}?userId=3`);
    const jsonNotifs = await resNotifs.json();
    const reviewNotif = jsonNotifs.data?.notifications?.find((n) => n.title.includes('Review Submitted'));

    assert(
      'Review submission creates system notification "⭐ Review Submitted"',
      Boolean(reviewNotif),
      `Notification: ${reviewNotif?.title}`
    );
  } catch (err) {
    assert('Notification test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 11 Review Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 11 Review tests passed successfully!');
    if (require.main === module) process.exit(0);
    return true;
  } else {
    console.error('❌ Some Phase 11 Review tests failed.');
    if (require.main === module) process.exit(1);
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase11ReviewsSuite();
}

module.exports = testPhase11ReviewsSuite;
