const config = require('../src/config/environment');

async function testPaymentsSuite() {
  console.log('=====================================================');
  console.log('  Testing Payment Module & Mock APIs (Phase 10)      ');
  console.log('=====================================================\n');

  const PAYMENTS_URL = `http://localhost:${config.port}/api/payments`;
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

  let testBookingId = null;
  let testBookingRef = null;
  let testTransactionId = null;
  let testPaymentId = null;

  // Setup: Create a preliminary test booking
  console.log('--- 0. Setup: Create Test Booking ---');
  try {
    const resBooking = await fetch(BOOKINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 3,
        destinationId: 1,
        packageId: 1,
        travelDate: '2026-10-15',
        numTravelers: 2,
        totalAmount: 2198.00,
        discountAmount: 200.00,
        finalAmount: 1998.00,
      }),
    });
    const jsonBooking = await resBooking.json();
    testBookingId = jsonBooking.data?.id;
    testBookingRef = jsonBooking.data?.booking_reference || jsonBooking.data?.bookingReference;
    assert('Setup: Test booking created successfully', Boolean(testBookingId && testBookingRef));
  } catch (err) {
    assert('Setup: Failed to create test booking', false, err.message);
  }

  // 1. Test Successful Payment Processing
  console.log('\n--- 1. Successful Payment Processing (Mock Charge) ---');
  try {
    const payload = {
      bookingId: testBookingId,
      userId: 3,
      amount: 1998.00,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentGateway: 'Stripe',
      cardBrand: 'Visa',
      cardLast4: '4242',
      simulateFailure: false,
    };

    const res = await fetch(`${PAYMENTS_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    assert(
      'POST /api/payments/process succeeds and returns HTTP 200',
      res.status === 200 && json.data && json.data.status === 'completed',
      `Status: ${res.status}, Payment status: ${json.data?.status}`
    );

    testTransactionId = json.data?.transactionId || json.data?.payment?.transaction_id;
    testPaymentId = json.data?.payment?.id;

    assert(
      'Payment generates unique transaction ID starting with "TXN-"',
      typeof testTransactionId === 'string' && testTransactionId.startsWith('TXN-'),
      `Transaction ID: ${testTransactionId}`
    );

    // Verify booking status was updated to confirmed
    const resVerifyBooking = await fetch(`${BOOKINGS_URL}/${testBookingRef}`);
    const jsonVerifyBooking = await resVerifyBooking.json();
    assert(
      'Booking status automatically updated to "confirmed" after successful payment',
      jsonVerifyBooking.data?.status === 'confirmed',
      `Booking status: ${jsonVerifyBooking.data?.status}`
    );
  } catch (err) {
    assert('Successful payment processing failed', false, err.message);
  }

  // 2. Test Payment Failure Simulation
  console.log('\n--- 2. Simulated Payment Failure / Decline ---');
  try {
    const failPayload = {
      bookingId: testBookingId,
      userId: 3,
      amount: 1998.00,
      paymentMethod: 'credit_card',
      cardLast4: '0000', // Triggers decline
      simulateFailure: true,
    };

    const resFail = await fetch(`${PAYMENTS_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failPayload),
    });
    const jsonFail = await resFail.json();

    assert(
      'POST /api/payments/process with decline simulation returns HTTP 402 / error response',
      resFail.status === 402 || jsonFail.status === 'error',
      `Status: ${resFail.status}, Response: ${jsonFail.message}`
    );
  } catch (err) {
    assert('Simulated decline test failed', false, err.message);
  }

  // 3. Test Payment Status Query by Transaction ID
  console.log('\n--- 3. Payment Status Query ---');
  try {
    if (testTransactionId) {
      const resStatus = await fetch(`${PAYMENTS_URL}/${testTransactionId}`);
      const jsonStatus = await resStatus.json();

      assert(
        `GET /api/payments/${testTransactionId} returns transaction status "completed"`,
        resStatus.status === 200 && jsonStatus.data?.payment_status === 'completed',
        `Payment status: ${jsonStatus.data?.payment_status}`
      );

      assert(
        'Payment query includes linked booking reference and amount',
        jsonStatus.data?.booking_reference === testBookingRef && parseFloat(jsonStatus.data?.amount) === 1998.00,
        `Booking Ref: ${jsonStatus.data?.booking_reference}, Amount: ${jsonStatus.data?.amount}`
      );
    }
  } catch (err) {
    assert('Payment status query failed', false, err.message);
  }

  // 4. Test Payment History Retrieval
  console.log('\n--- 4. Payment History (GET /api/payments/history) ---');
  try {
    const resHist = await fetch(`${PAYMENTS_URL}/history?userId=3`);
    const jsonHist = await resHist.json();

    assert(
      'GET /api/payments/history returns user transaction list',
      resHist.status === 200 && Array.isArray(jsonHist.data) && jsonHist.data.length > 0,
      `Transactions count: ${jsonHist.data?.length}`
    );

    const hasTxn = jsonHist.data?.some((t) => t.transaction_id === testTransactionId);
    assert(
      'Payment history contains newly created transaction',
      hasTxn,
      `Found transaction: ${hasTxn}`
    );
  } catch (err) {
    assert('Payment history test failed', false, err.message);
  }

  // 5. Security & Zero Sensitive Storage Audit
  console.log('\n--- 5. Security Audit: Zero Sensitive Data Storage ---');
  try {
    if (testTransactionId) {
      const resAudit = await fetch(`${PAYMENTS_URL}/${testTransactionId}`);
      const jsonAudit = await resAudit.json();
      const rawData = JSON.stringify(jsonAudit.data);

      const hasRawCardNumber = /4242\s?4242\s?4242\s?4242/.test(rawData);
      const hasCvv = /"cvv"|"security_code"|"card_cvv"/i.test(rawData);
      const hasPassword = /"password"|"pin"/i.test(rawData);

      assert(
        'Zero sensitive data check: No full card numbers, CVVs, or passwords found in response',
        !hasRawCardNumber && !hasCvv && !hasPassword,
        `Sensitive data check result: clean`
      );
    }
  } catch (err) {
    assert('Security audit check failed', false, err.message);
  }

  // 6. Test Payment Refund
  console.log('\n--- 6. Payment Refund Processing ---');
  try {
    if (testPaymentId) {
      const resRefund = await fetch(`${PAYMENTS_URL}/${testPaymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer requested cancellation' }),
      });
      const jsonRefund = await resRefund.json();

      assert(
        `POST /api/payments/${testPaymentId}/refund sets status to "refunded"`,
        resRefund.status === 200 && jsonRefund.data?.payment?.payment_status === 'refunded',
        `Payment status: ${jsonRefund.data?.payment?.payment_status}`
      );
    }
  } catch (err) {
    assert('Refund processing test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Payment Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Payment backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some payment tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testPaymentsSuite()
    .then((ok) => {
      setTimeout(() => process.exit(ok ? 0 : 1), 100);
    })
    .catch((err) => {
      console.error('Fatal payment test error:', err);
      setTimeout(() => process.exit(1), 100);
    });
}

module.exports = { testPaymentsSuite };
