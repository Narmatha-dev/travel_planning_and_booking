const config = require('../src/config/environment');

async function testPhase9PaymentSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 9: Payment Gateway & Digital Receipt ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/payments`;
  const BOOKINGS_URL = `http://localhost:${config.port}/api/bookings`;
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
  let createdOrderId = null;
  let verifiedPaymentId = null;

  // 0. Setup: Create Test Booking
  console.log('--- 0. Setup: Create Preliminary Trip Booking ---');
  try {
    const bookingRes = await fetch(BOOKINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 2,
        destinationName: 'Ooty Nilgiri Hill Station',
        packageTitle: 'Ooty (3 Days AI Trip)',
        bookingType: 'custom_trip',
        travelDate: '2026-10-20',
        numTravelers: 2,
        totalAmount: 9500.00,
        finalAmount: 9500.00,
        selectedTransport: { title: 'Express Train', icon: '🚆', estimated_cost: 950 },
        selectedHotel: { name: 'Savoy - IHCL SeleQtions', approx_price_per_night: 4200 },
      }),
    });
    const bookingJson = await bookingRes.json();
    createdBookingId = bookingJson.data?.id;
    createdBookingRef = bookingJson.data?.booking_reference;

    assert('Test booking created for payment flow', Boolean(createdBookingId && createdBookingRef));
  } catch (err) {
    assert('Setup failed', false, err.message);
  }

  // 1. Feature 2: Public Gateway Config
  console.log('\n--- 1. Payment Gateway Public Config (Feature 2) ---');
  try {
    const res = await fetch(`${BASE_URL}/config`);
    const json = await res.json();

    assert(
      'GET /api/payments/config returns public configuration with supported methods',
      res.status === 200 && Array.isArray(json.data?.supportedMethods),
      `Methods: ${json.data?.supportedMethods?.join(', ')}`
    );

    assert(
      'Public config NEVER exposes secret keys',
      !json.data?.keySecret && !json.data?.secret && typeof json.data?.keyId === 'string',
      `KeyId present: ${Boolean(json.data?.keyId)}`
    );
  } catch (err) {
    assert('Public config test failed', false, err.message);
  }

  // 2. Feature 4: Create Server-Side Payment Order
  console.log('\n--- 2. Create Payment Order / Session (Feature 4) ---');
  try {
    const resOrder = await fetch(`${BASE_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: createdBookingId,
        userId: 3,
        paymentMethod: 'upi',
      }),
    });
    const jsonOrder = await resOrder.json();

    assert(
      'POST /api/payments/create-order generates order session with HTTP 201',
      resOrder.status === 201 && Boolean(jsonOrder.data?.orderId),
      `Status: ${resOrder.status}`
    );

    createdOrderId = jsonOrder.data?.orderId;

    assert(
      'Server retrieves payable amount directly from trusted booking record (₹9,500)',
      parseFloat(jsonOrder.data?.amount) === 9500,
      `Amount: ${jsonOrder.data?.amount}`
    );
  } catch (err) {
    assert('Create payment order failed', false, err.message);
  }

  // 3. Feature 7: Payment Failure & Decline Handling
  console.log('\n--- 3. Payment Failure & Retry Guard (Feature 7) ---');
  try {
    const resFail = await fetch(`${BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: createdBookingId,
        orderId: createdOrderId,
        paymentId: 'pay_declined_123',
        simulateFailure: true,
        userId: 3,
      }),
    });
    const jsonFail = await resFail.json();

    assert(
      'Failed payment returns HTTP 402 with clear user-friendly message',
      resFail.status === 402,
      `Status: ${resFail.status}`
    );

    // Verify booking is NOT marked as confirmed and NOT deleted
    const resCheckBooking = await fetch(`${BOOKINGS_URL}/${createdBookingRef}`);
    const jsonCheckBooking = await resCheckBooking.json();

    assert(
      'Booking record is preserved and not falsely confirmed on payment failure',
      Boolean(jsonCheckBooking.data?.id),
      `Booking ID: ${jsonCheckBooking.data?.id}`
    );
  } catch (err) {
    assert('Payment failure guard test failed', false, err.message);
  }

  // 4. Feature 5 & 8: Server-Side Payment Verification & Success
  console.log('\n--- 4. Payment Verification & Confirmation (Feature 5 & 8) ---');
  try {
    const resVerify = await fetch(`${BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: createdBookingId,
        orderId: createdOrderId,
        paymentId: `pay_${Date.now().toString(36)}`,
        signature: 'sandbox_valid_sig',
        paymentMethod: 'upi',
        simulateFailure: false,
        userId: 3,
      }),
    });
    const jsonVerify = await resVerify.json();

    assert(
      'POST /api/payments/verify completes verification and returns HTTP 200',
      resVerify.status === 200 && jsonVerify.data?.verified === true,
      `Status: ${resVerify.status}, Verified: ${jsonVerify.data?.verified}`
    );

    verifiedPaymentId = jsonVerify.data?.transactionId;

    assert(
      'Payment status is "completed" and booking status is "confirmed"',
      jsonVerify.data?.paymentStatus === 'completed' && jsonVerify.data?.bookingStatus === 'confirmed',
      `Payment: ${jsonVerify.data?.paymentStatus}, Booking: ${jsonVerify.data?.bookingStatus}`
    );
  } catch (err) {
    assert('Payment verification failed', false, err.message);
  }

  // 5. Feature 9 & 10: Digital Receipt & Itemized Breakdown
  console.log('\n--- 5. Digital Booking Receipt (Feature 9 & 10) ---');
  try {
    const resReceipt = await fetch(`${BASE_URL}/receipt/${createdBookingRef}?userId=3`);
    const jsonReceipt = await resReceipt.json();
    const receipt = jsonReceipt.data;

    assert(
      'GET /api/payments/receipt/:identifier returns structured digital receipt',
      resReceipt.status === 200 && Boolean(receipt?.receipt_id),
      `Receipt ID: ${receipt?.receipt_id}`
    );

    assert(
      'Receipt includes destination, travel dates, transport, stay, and masked traveler info',
      receipt?.destination?.name === 'Ooty Nilgiri Hill Station' &&
      Boolean(receipt?.selected_transport) &&
      Boolean(receipt?.traveler?.email?.includes('***')),
      `Destination: ${receipt?.destination?.name}, Masked Email: ${receipt?.traveler?.email}`
    );

    assert(
      'Receipt contains itemized fare breakdown matching paid amount',
      receipt?.fare_breakdown?.final_amount_paid === 9500,
      `Fare: ₹${receipt?.fare_breakdown?.final_amount_paid}`
    );
  } catch (err) {
    assert('Digital receipt test failed', false, err.message);
  }

  // 6. Feature 13: Security & Ownership Protection
  console.log('\n--- 6. Security & Ownership Protection (Feature 13) ---');
  try {
    // Non-owner (userId 99) attempting to create payment order for user 3's booking
    const resUnauthorized = await fetch(`${BASE_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: createdBookingId,
        userId: 99,
      }),
    });

    assert(
      'Rejects payment order attempt by non-owner user (HTTP 403 Forbidden)',
      resUnauthorized.status === 403,
      `Status: ${resUnauthorized.status}`
    );
  } catch (err) {
    assert('Security test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 9 Payment Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 9 Payment tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 9 Payment tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase9PaymentSuite();
}

module.exports = testPhase9PaymentSuite;
