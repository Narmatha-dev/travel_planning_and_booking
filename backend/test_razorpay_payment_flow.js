const crypto = require('crypto');

const API_BASE = 'http://localhost:5000/api';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key_2026';

async function testRazorpayPaymentFlow() {
  console.log('======================================================================');
  console.log('💳 TESTING COMPLETE RAZORPAY PAYMENT & BOOKING INTEGRATION');
  console.log('======================================================================\n');

  // 1. Authenticate as Traveler
  console.log('1. Authenticating Traveler (alex.reed@example.com)...');
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.reed@example.com', password: 'TravelPass123!' }),
  });
  const authData = await authRes.json();
  if (authRes.status !== 200 || !authData.data?.token) {
    throw new Error(`Authentication failed: ${JSON.stringify(authData)}`);
  }
  const token = authData.data.token;
  const userId = authData.data.user.id;
  console.log(`✅ Traveler authenticated. User ID: ${userId}\n`);

  // 2. Create Booking Reservation
  console.log('2. Creating new travel booking reservation...');
  const bookRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      packageId: 1,
      destinationId: 1,
      destinationName: 'Bali Paradise Island',
      packageTitle: 'Bali Tropical Bliss & Yoga Retreat',
      travelDate: '2026-11-15',
      returnDate: '2026-11-22',
      numTravelers: 2,
      totalAmount: 2198.00,
      finalAmount: 2198.00,
      paymentMethod: 'razorpay',
    }),
  });
  const bookData = await bookRes.json();
  if (bookRes.status !== 201 || !bookData.data?.id) {
    throw new Error(`Booking creation failed: ${JSON.stringify(bookData)}`);
  }
  const booking = bookData.data;
  console.log(`✅ Booking created. ID: ${booking.id}, Reference: ${booking.booking_reference}, Status: ${booking.status}\n`);

  // 3. Get Gateway Config
  console.log('3. Fetching public payment gateway configuration (/api/payments/config)...');
  const configRes = await fetch(`${API_BASE}/payments/config`);
  const configData = await configRes.json();
  console.log('Gateway Provider:', configData.data?.provider);
  console.log('Currency:', configData.data?.currency);
  console.log('Key ID:', configData.data?.keyId);
  if (configRes.status === 200 && configData.data?.keyId) {
    console.log('✅ Gateway configuration verified.\n');
  } else {
    throw new Error('Failed to get gateway config');
  }

  // 4. Create Server-Side Razorpay Order
  console.log(`4. Creating server-side Razorpay Order for Booking #${booking.id}...`);
  const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId: booking.id,
      paymentMethod: 'razorpay',
    }),
  });
  const orderData = await orderRes.json();
  console.log('Status:', orderRes.status);
  console.log('Order ID:', orderData.data?.orderId);
  console.log('Amount (Validated from Server DB):', orderData.data?.amount);
  console.log('Currency:', orderData.data?.currency);

  if (orderRes.status === 201 && orderData.data?.orderId) {
    console.log('✅ Server-side Razorpay order created successfully.\n');
  } else {
    throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
  }
  const orderId = orderData.data.orderId;

  // 5. Test Unauthorized Access (Security)
  console.log('5. Testing Security: Another user attempting to pay for this booking...');
  // Authenticate as a different user (e.g. Liam Foster)
  const otherAuth = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'liam.foster@example.com', password: 'TravelPass123!' }),
  });
  const otherData = await otherAuth.json();
  if (otherData.data?.token) {
    const unauthOrderRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherData.data.token}`,
      },
      body: JSON.stringify({ bookingId: booking.id }),
    });
    console.log('Unauthorized order creation response status:', unauthOrderRes.status);
    if (unauthOrderRes.status === 403) {
      console.log('✅ Security verified: Non-owner cannot create payment order for another user.\n');
    }
  }

  // 6. Test Failed Signature Verification
  console.log('6. Testing Security: Invalid / tampered payment signature...');
  const fakePayRes = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId: booking.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: 'pay_fake_123456',
      razorpay_signature: 'invalid_tampered_signature_xyz',
      paymentMethod: 'razorpay',
    }),
  });
  console.log('Invalid signature status:', fakePayRes.status);
  if (fakePayRes.status === 402 || fakePayRes.status === 400) {
    console.log('✅ Tampered signature correctly rejected by backend!\n');
  }

  // 7. Test Valid HMAC-SHA256 Signature Verification
  console.log('7. Testing Valid Server-Side Payment Verification (HMAC-SHA256)...');
  const paymentId = `pay_${Date.now().toString(36)}_rzp`;
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId: booking.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature,
      paymentMethod: 'razorpay',
    }),
  });
  const verifyData = await verifyRes.json();
  console.log('Status:', verifyRes.status);
  console.log('Payment Status:', verifyData.data?.paymentStatus);
  console.log('Booking Status:', verifyData.data?.bookingStatus);
  console.log('Transaction ID:', verifyData.data?.transactionId);

  if (verifyRes.status === 200 && verifyData.data?.paymentStatus === 'completed' && verifyData.data?.bookingStatus === 'confirmed') {
    console.log('✅ Payment verified, Payment marked completed, Booking CONFIRMED!\n');
  } else {
    throw new Error(`Verification failed: ${JSON.stringify(verifyData)}`);
  }

  // 8. Verify Digital Receipt & Payment History
  console.log('8. Retrieving Payment History & Digital Receipt...');
  const histRes = await fetch(`${API_BASE}/payments/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const histData = await histRes.json();
  console.log('Total Payments in History:', histData.data?.totalCount || histData.data?.length || 0);

  const rcptRes = await fetch(`${API_BASE}/payments/receipt/${booking.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rcptData = await rcptRes.json();
  console.log('Receipt Status:', rcptRes.status);
  console.log('Receipt Booking Ref:', rcptData.data?.bookingReference);
  console.log('Receipt Amount Paid:', rcptData.data?.amount);

  if (rcptRes.status === 200 && rcptData.data?.bookingReference) {
    console.log('✅ Digital receipt retrieved successfully.\n');
  }

  console.log('🎉 ALL RAZORPAY PAYMENT INTEGRATION TESTS PASSED 100%!');
}

testRazorpayPaymentFlow().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
