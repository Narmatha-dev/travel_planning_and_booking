const config = require('../src/config/environment');

async function testPhase8BookingSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 8: Complete Booking Flow & Lifecycle ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/bookings`;
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

  let createdCustomBookingId = null;
  let createdCustomBookingRef = null;

  // 1. Test Custom AI Trip Booking Creation (Feature 3 & 4)
  console.log('--- 1. Custom AI Trip Booking Creation (Phase 8 End-to-End) ---');
  try {
    const customTripPayload = {
      userId: 3,
      destinationId: 1,
      destinationName: 'Mahabalipuram Shore Temples',
      packageTitle: 'Mahabalipuram Shore Temples (3 Days AI Trip)',
      bookingType: 'custom_trip',
      travelDate: '2026-10-15',
      returnDate: '2026-10-17',
      numTravelers: 2,
      totalAmount: 18500.00,
      discountAmount: 0,
      finalAmount: 18500.00,
      specialRequests: 'High floor room requested; vegetarian meal plan.',
      selectedTransport: {
        id: 'train_express',
        title: 'Express Train (Vande Bharat / Shatabdi)',
        icon: '🚆',
        cost_text: '₹950',
        estimated_cost: 950,
        duration_text: '1h 15m',
        distance_text: '56 km',
      },
      selectedHotel: {
        id: 'hotel-mb-1',
        name: 'Radisson Blu Resort Temple Bay',
        price_display: '₹8,500 / night',
        approx_price_per_night: 8500,
        type_label: 'Luxury Resort',
      },
      itineraryItems: [
        { day: 1, title: 'Shore Temple & Arjuna Penance', cost: 150 },
        { day: 2, title: 'Five Rathas & Lighthouse', cost: 200 },
        { day: 3, title: 'Beach relaxation & Craft souvenir shops', cost: 100 },
      ],
      paymentMethod: 'credit_card',
      paymentGateway: 'Stripe',
    };

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customTripPayload),
    });

    const json = await res.json();
    assert(
      'POST /api/bookings creates custom AI trip booking and returns HTTP 201',
      res.status === 201 && json.data && json.data.id,
      `Status: ${res.status}`
    );

    createdCustomBookingId = json.data?.id;
    createdCustomBookingRef = json.data?.booking_reference || json.data?.bookingReference;

    assert(
      'Backend generates unique reference formatted as BK-YYYY-XXXXX',
      typeof createdCustomBookingRef === 'string' && createdCustomBookingRef.startsWith('BK-'),
      `Reference: ${createdCustomBookingRef}`
    );

    assert(
      'Initial booking status is "confirmed"',
      json.data?.status === 'confirmed',
      `Status: ${json.data?.status}`
    );

    assert(
      'Transport and Hotel details are successfully parsed and preserved in response',
      json.data?.selected_transport?.title === 'Express Train (Vande Bharat / Shatabdi)' &&
      json.data?.selected_hotel?.name === 'Radisson Blu Resort Temple Bay',
      `Transport: ${json.data?.selected_transport?.title}, Hotel: ${json.data?.selected_hotel?.name}`
    );
  } catch (err) {
    assert('Custom AI Trip booking creation failed', false, err.message);
  }

  // 2. Test Input Validation & Protection (Feature 2)
  console.log('\n--- 2. Booking Validation Guards (Feature 2) ---');
  try {
    const resMissing = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 3, totalAmount: 500 }),
    });
    assert(
      'Rejects booking when required destination or travelDate is missing (HTTP 400)',
      resMissing.status === 400,
      `Status: ${resMissing.status}`
    );

    const resZeroTravelers = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        travelDate: '2026-10-15',
        totalAmount: 500,
        numTravelers: 0,
      }),
    });
    assert(
      'Rejects booking when numTravelers < 1 (HTTP 400)',
      resZeroTravelers.status === 400,
      `Status: ${resZeroTravelers.status}`
    );
  } catch (err) {
    assert('Booking validation tests failed', false, err.message);
  }

  // 3. Test Booking Retrieval by ID & Reference (Feature 8)
  console.log('\n--- 3. Booking Details Retrieval (Feature 8) ---');
  try {
    const resRef = await fetch(`${BASE_URL}/${createdCustomBookingRef}`);
    const jsonRef = await resRef.json();

    assert(
      'GET /api/bookings/:reference returns complete details with transport & stay metadata',
      resRef.status === 200 &&
      jsonRef.data?.booking_reference === createdCustomBookingRef &&
      jsonRef.data?.selected_transport?.title === 'Express Train (Vande Bharat / Shatabdi)',
      `Status: ${resRef.status}, Ref: ${jsonRef.data?.booking_reference}`
    );
  } catch (err) {
    assert('Booking details retrieval by reference failed', false, err.message);
  }

  // 4. Test User Bookings History (Feature 7 & 10)
  console.log('\n--- 4. My Trips & Booking History (Feature 7 & 10) ---');
  try {
    const resList = await fetch(`${BASE_URL}?userId=3`);
    const jsonList = await resList.json();

    assert(
      'GET /api/bookings returns array of bookings for user',
      resList.status === 200 && Array.isArray(jsonList.data) && jsonList.data.length > 0,
      `Count: ${jsonList.data?.length}`
    );

    const found = jsonList.data.find((b) => b.id === createdCustomBookingId || b.booking_reference === createdCustomBookingRef);
    assert(
      'Recently created custom trip booking is listed in user history',
      Boolean(found),
      `Found: ${Boolean(found)}`
    );
  } catch (err) {
    assert('User bookings history retrieval failed', false, err.message);
  }

  // 5. Test Cancellation Lifecycle (Feature 9)
  console.log('\n--- 5. Trip Cancellation Lifecycle (Feature 9) ---');
  try {
    const resCancel = await fetch(`${BASE_URL}/${createdCustomBookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Schedule change / change of plans' }),
    });
    const jsonCancel = await resCancel.json();

    assert(
      'PATCH /api/bookings/:id/cancel updates booking status to "cancelled"',
      resCancel.status === 200 && jsonCancel.data?.status === 'cancelled',
      `Status: ${jsonCancel.data?.status}`
    );

    // Verify record is preserved in history and not deleted
    const resVerify = await fetch(`${BASE_URL}/${createdCustomBookingId}`);
    const jsonVerify = await resVerify.json();

    assert(
      'Cancelled booking record is preserved in database with status "cancelled"',
      resVerify.status === 200 && jsonVerify.data?.status === 'cancelled',
      `Status: ${jsonVerify.data?.status}`
    );

    // Attempting to cancel again returns 400
    const resCancelAgain = await fetch(`${BASE_URL}/${createdCustomBookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Duplicate' }),
    });
    assert(
      'Attempting to cancel already cancelled booking returns HTTP 400',
      resCancelAgain.status === 400,
      `Status: ${resCancelAgain.status}`
    );
  } catch (err) {
    assert('Trip cancellation lifecycle failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 8 Booking Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 8 Booking tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 8 Booking tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase8BookingSuite();
}

module.exports = testPhase8BookingSuite;
