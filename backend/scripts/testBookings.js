const config = require('../src/config/environment');

async function testBookingsSuite() {
  console.log('=====================================================');
  console.log('  Testing Booking Module & APIs (Phase 9 Backend)    ');
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

  let createdBookingId = null;
  let createdBookingRef = null;

  // 1. Test Successful Booking Creation
  console.log('--- 1. Booking Creation (Valid Input) ---');
  try {
    const validBooking = {
      userId: 3,
      destinationId: 1,
      packageId: 1,
      bookingType: 'package',
      travelDate: '2026-09-20',
      returnDate: '2026-09-27',
      numTravelers: 2,
      totalAmount: 2598.00,
      discountAmount: 400.00,
      finalAmount: 2374.00,
      specialRequests: 'High floor villa with sunrise view; vegetarian breakfast',
      paymentMethod: 'credit_card',
      paymentGateway: 'Stripe',
    };

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBooking),
    });

    const json = await res.json();
    assert(
      'POST /api/bookings creates booking and returns HTTP 201',
      res.status === 201 && json.data && json.data.id,
      `Status: ${res.status}`
    );

    createdBookingId = json.data?.id;
    createdBookingRef = json.data?.booking_reference || json.data?.bookingReference;

    assert(
      'Created booking includes unique reference matching BK-YYYY-XXXX format',
      typeof createdBookingRef === 'string' && createdBookingRef.startsWith('BK-'),
      `Reference: ${createdBookingRef}`
    );

    assert(
      'Created booking has status "confirmed" and generated transaction ID',
      json.data?.status === 'confirmed' && Boolean(json.data?.transaction_id),
      `Status: ${json.data?.status}, Txn: ${json.data?.transaction_id}`
    );
  } catch (err) {
    assert('POST /api/bookings creation failed', false, err.message);
  }

  // 2. Test Invalid Booking Validation
  console.log('\n--- 2. Booking Validation (Invalid Inputs) ---');
  try {
    // Missing destination & travel date
    const resMissing = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 3 }),
    });
    assert(
      'POST /api/bookings returns HTTP 400 when required fields are missing',
      resMissing.status === 400,
      `Status: ${resMissing.status}`
    );

    // Invalid travelers count (0)
    const resZeroTravelers = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        travelDate: '2026-09-20',
        totalAmount: 1000,
        numTravelers: 0,
      }),
    });
    assert(
      'POST /api/bookings returns HTTP 400 when numTravelers < 1',
      resZeroTravelers.status === 400,
      `Status: ${resZeroTravelers.status}`
    );
  } catch (err) {
    assert('Validation tests failed', false, err.message);
  }

  // 3. Test Booking History Retrieval
  console.log('\n--- 3. Booking History (GET /api/bookings) ---');
  try {
    const resHistory = await fetch(`${BASE_URL}?userId=3`);
    const jsonHistory = await resHistory.json();
    assert(
      'GET /api/bookings returns user bookings array',
      resHistory.status === 200 && Array.isArray(jsonHistory.data) && jsonHistory.data.length > 0,
      `Count: ${jsonHistory.data?.length}`
    );

    const hasCreated = jsonHistory.data?.some((b) => b.id === createdBookingId || b.booking_reference === createdBookingRef);
    assert(
      'Booking history includes recently created booking',
      hasCreated,
      `Found created booking: ${hasCreated}`
    );
  } catch (err) {
    assert('Booking history test failed', false, err.message);
  }

  // 4. Test Single Booking Retrieval by Reference and ID
  console.log('\n--- 4. View Booking Details by Reference & ID ---');
  try {
    if (createdBookingRef) {
      const resRef = await fetch(`${BASE_URL}/${createdBookingRef}`);
      const jsonRef = await resRef.json();
      assert(
        `GET /api/bookings/${createdBookingRef} returns complete booking details`,
        resRef.status === 200 && jsonRef.data?.booking_reference === createdBookingRef,
        `Status: ${resRef.status}`
      );
    }

    if (createdBookingId) {
      const resId = await fetch(`${BASE_URL}/${createdBookingId}`);
      const jsonId = await resId.json();
      assert(
        `GET /api/bookings/${createdBookingId} returns complete booking by numeric ID`,
        resId.status === 200 && jsonId.data?.id === createdBookingId,
        `Status: ${resId.status}`
      );
    }
  } catch (err) {
    assert('View booking details test failed', false, err.message);
  }

  // 5. Test Cancellation
  console.log('\n--- 5. Booking Cancellation ---');
  try {
    if (createdBookingId) {
      const resCancel = await fetch(`${BASE_URL}/${createdBookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Schedule conflict' }),
      });
      const jsonCancel = await resCancel.json();

      assert(
        `PATCH /api/bookings/${createdBookingId}/cancel sets status to "cancelled"`,
        resCancel.status === 200 && jsonCancel.data?.status === 'cancelled',
        `Status: ${jsonCancel.data?.status}`
      );

      // Re-cancellation should fail
      const resReCancel = await fetch(`${BASE_URL}/${createdBookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Try cancel again' }),
      });
      assert(
        'Attempting to cancel already cancelled booking returns HTTP 400',
        resReCancel.status === 400,
        `Status: ${resReCancel.status}`
      );
    }
  } catch (err) {
    assert('Cancellation test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Booking Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Booking backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some booking tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testBookingsSuite()
    .then((ok) => {
      setTimeout(() => process.exit(ok ? 0 : 1), 100);
    })
    .catch((err) => {
      console.error('Fatal booking test error:', err);
      setTimeout(() => process.exit(1), 100);
    });
}

module.exports = { testBookingsSuite };
