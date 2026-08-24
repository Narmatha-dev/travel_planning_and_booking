const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testPhase12AdminSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 12: Admin Dashboard & Analytics      ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/admin`;
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

  // Generate Admin and Traveler JWT tokens
  const jwtSecret = config.jwt?.secret || process.env.JWT_SECRET || 'travel_jwt_super_secret_key_2026_secure!';
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@travelplanner.com', role: 'admin' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const travelerToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  const travelerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${travelerToken}`,
  };

  // 1. Role-Based Access Control Guards (Feature 1 & 17)
  console.log('--- 1. Admin RBAC & Authorization Boundaries (Feature 1 & 17) ---');
  try {
    // Unauthenticated access
    const resNoAuth = await fetch(`${BASE_URL}/stats`);
    assert(
      'GET /api/admin/stats without token returns HTTP 401 Unauthorized',
      resNoAuth.status === 401,
      `Status: ${resNoAuth.status}`
    );

    // Traveler attempting admin access
    const resTraveler = await fetch(`${BASE_URL}/stats`, { headers: travelerHeaders });
    assert(
      'GET /api/admin/stats with traveler token returns HTTP 403 Forbidden',
      resTraveler.status === 403,
      `Status: ${resTraveler.status}`
    );

    // Admin access
    const resAdmin = await fetch(`${BASE_URL}/stats`, { headers: adminHeaders });
    assert(
      'GET /api/admin/stats with admin token returns HTTP 200 OK',
      resAdmin.status === 200,
      `Status: ${resAdmin.status}`
    );
  } catch (err) {
    assert('RBAC tests failed', false, err.message);
  }

  // 2. Dashboard Statistics & Metrics (Feature 2)
  console.log('\n--- 2. Dashboard Statistics & Aggregations (Feature 2) ---');
  try {
    const resStats = await fetch(`${BASE_URL}/stats`, { headers: adminHeaders });
    const jsonStats = await resStats.json();
    const data = jsonStats.data;

    assert(
      'Stats payload contains real metrics for users, trips, bookings, revenue, and reviews',
      Boolean(
        data?.users?.total &&
        typeof data?.bookings?.total === 'number' &&
        typeof data?.reviews?.total === 'number' &&
        typeof data?.destinations?.total === 'number' &&
        typeof data?.trips?.total === 'number'
      ),
      `Users: ${data?.users?.total}, Bookings: ${data?.bookings?.total}, Trips: ${data?.trips?.total}`
    );
  } catch (err) {
    assert('Stats retrieval failed', false, err.message);
  }

  // 3. Analytics & Monthly Trends (Feature 3 & 4)
  console.log('\n--- 3. Analytics & Trends (Feature 3 & 4) ---');
  try {
    const resAnalytics = await fetch(`${BASE_URL}/analytics`, { headers: adminHeaders });
    const jsonAnalytics = await resAnalytics.json();
    const data = jsonAnalytics.data;

    assert(
      'GET /api/admin/analytics returns monthly trends and category distributions',
      Array.isArray(data?.monthlyTrends) && Array.isArray(data?.categoryBreakdown),
      `Months count: ${data?.monthlyTrends?.length}`
    );
  } catch (err) {
    assert('Analytics test failed', false, err.message);
  }

  // 4. User Management (Feature 5 & 6)
  console.log('\n--- 4. User Management & Status Toggle (Feature 5 & 6) ---');
  try {
    const resUsers = await fetch(`${BASE_URL}/users?search=Alexander`, { headers: adminHeaders });
    const jsonUsers = await resUsers.json();

    assert(
      'GET /api/admin/users with search query returns matching users',
      resUsers.status === 200 && Array.isArray(jsonUsers.data) && jsonUsers.data.length > 0,
      `Count: ${jsonUsers.data?.length}`
    );

    // Update User Role
    const resRole = await fetch(`${BASE_URL}/users/3/role`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ role: 'traveler' }),
    });
    assert('PUT /api/admin/users/:id/role updates user role', resRole.status === 200);

    // Update User Status
    const resStatus = await fetch(`${BASE_URL}/users/3/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: true }),
    });
    assert('PUT /api/admin/users/:id/status updates active status', resStatus.status === 200);
  } catch (err) {
    assert('User management tests failed', false, err.message);
  }

  // 5. Destination Management (Feature 7)
  console.log('\n--- 5. Destination Management (Feature 7) ---');
  try {
    const resDests = await fetch(`${BASE_URL}/destinations`, { headers: adminHeaders });
    const jsonDests = await resDests.json();

    assert(
      'GET /api/admin/destinations returns active destination catalog',
      resDests.status === 200 && Array.isArray(jsonDests.data),
      `Count: ${jsonDests.data?.length}`
    );

    const resCreateDest = await fetch(`${BASE_URL}/destinations`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Varkala Cliff Beach',
        country: 'India',
        city: 'Varkala',
        description: 'Red laterite cliffs overlooking the Arabian sea.',
        category: 'beach',
        base_price: 3500,
      }),
    });

    assert(
      'POST /api/admin/destinations creates new destination record (HTTP 201)',
      resCreateDest.status === 201,
      `Status: ${resCreateDest.status}`
    );
  } catch (err) {
    assert('Destination management failed', false, err.message);
  }

  // 6. Booking Management (Feature 8)
  console.log('\n--- 6. Booking Management & Lifecycle (Feature 8) ---');
  try {
    const resBookings = await fetch(`${BASE_URL}/bookings`, { headers: adminHeaders });
    const jsonBookings = await resBookings.json();

    assert(
      'GET /api/admin/bookings returns platform bookings list',
      resBookings.status === 200 && Array.isArray(jsonBookings.data),
      `Count: ${jsonBookings.data?.length}`
    );

    if (jsonBookings.data?.length > 0) {
      const targetBookingId = jsonBookings.data[0].id;
      const resStatus = await fetch(`${BASE_URL}/bookings/${targetBookingId}/status`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'confirmed' }),
      });

      assert(
        'PUT /api/admin/bookings/:id/status updates booking lifecycle state',
        resStatus.status === 200,
        `Status: ${resStatus.status}`
      );
    }
  } catch (err) {
    assert('Booking management failed', false, err.message);
  }

  // 7. Trip Management (Feature 9)
  console.log('\n--- 7. Trip Management (Feature 9) ---');
  try {
    const resTrips = await fetch(`${BASE_URL}/trips`, { headers: adminHeaders });
    const jsonTrips = await resTrips.json();

    assert(
      'GET /api/admin/trips returns user planned trips list',
      resTrips.status === 200 && Array.isArray(jsonTrips.data),
      `Count: ${jsonTrips.data?.length}`
    );
  } catch (err) {
    assert('Trip management failed', false, err.message);
  }

  // 8. Payment View (Feature 11) - Safe Metadata Only
  console.log('\n--- 8. Payment Record Auditing & PCI Security (Feature 11) ---');
  try {
    const resPayments = await fetch(`${BASE_URL}/payments`, { headers: adminHeaders });
    const jsonPayments = await resPayments.json();
    const payments = jsonPayments.data || [];

    assert(
      'GET /api/admin/payments returns list of payment records',
      resPayments.status === 200 && Array.isArray(payments),
      `Count: ${payments.length}`
    );

    // Verify zero sensitive payment data leaks
    const hasSensitiveLeak = payments.some(
      (p) => p.cvv !== undefined || p.card_number !== undefined || p.upi_pin !== undefined
    );

    assert(
      'Payment audit records NEVER leak CVV, card numbers, or UPI PINs',
      hasSensitiveLeak === false,
      `Safe metadata verified on ${payments.length} records`
    );
  } catch (err) {
    assert('Payment auditing test failed', false, err.message);
  }

  // 9. Review Moderation (Feature 10)
  console.log('\n--- 9. Review Moderation & Approval (Feature 10) ---');
  try {
    const resReviews = await fetch(`${BASE_URL}/reviews`, { headers: adminHeaders });
    const jsonReviews = await resReviews.json();

    assert(
      'GET /api/admin/reviews returns reviews list for moderation',
      resReviews.status === 200 && Array.isArray(jsonReviews.data),
      `Count: ${jsonReviews.data?.length}`
    );

    if (jsonReviews.data?.length > 0) {
      const targetReviewId = jsonReviews.data[0].id;
      const resApproval = await fetch(`${BASE_URL}/reviews/${targetReviewId}/approval`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ isApproved: true }),
      });

      assert(
        'PUT /api/admin/reviews/:id/approval toggles review visibility status',
        resApproval.status === 200,
        `Status: ${resApproval.status}`
      );
    }
  } catch (err) {
    assert('Review moderation failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 12 Admin Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 12 Admin tests passed successfully!');
    if (require.main === module) process.exit(0);
    return true;
  } else {
    console.error('❌ Some Phase 12 Admin tests failed.');
    if (require.main === module) process.exit(1);
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase12AdminSuite();
}

module.exports = testPhase12AdminSuite;
