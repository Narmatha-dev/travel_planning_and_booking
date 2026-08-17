const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testAdminSuite() {
  console.log('=====================================================');
  console.log('  Testing Admin Dashboard & RBAC Module (Phase 15)   ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/admin`;
  let passed = 0;
  let total = 0;

  // Generate Admin JWT Token
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@example.com', role: 'admin' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  // Generate Normal Traveler JWT Token
  const travelerToken = jwt.sign(
    { id: 3, email: 'john@example.com', role: 'traveler' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  // 1. Test Admin Stats Access
  console.log('--- 1. Admin Authentication & Dashboard Stats ---');
  try {
    const res = await fetch(`${BASE_URL}/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const stats = json.data;

    assert(
      'GET /api/admin/stats with admin token returns HTTP 200 and platform metrics',
      res.status === 200 && Boolean(stats?.users && stats?.bookings && stats?.destinations),
      `Status: ${res.status}`
    );

    assert(
      'Stats payload contains revenue, booking breakdown, and user counts',
      stats?.bookings?.totalRevenueUSD !== undefined && stats?.users?.total >= 1,
      `Revenue: ${stats?.bookings?.formattedRevenueUSD}, Users: ${stats?.users?.total}`
    );
  } catch (err) {
    assert('Admin stats test failed', false, err.message);
  }

  // 2. Test Role-Based Access Rejection (Normal Traveler -> HTTP 403)
  console.log('\n--- 2. Role-Based Access Control (RBAC) Guard ---');
  try {
    const res = await fetch(`${BASE_URL}/stats`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });

    assert(
      'GET /api/admin/stats with normal traveler token returns HTTP 403 Forbidden',
      res.status === 403,
      `Status: ${res.status} (Expected 403)`
    );
  } catch (err) {
    assert('RBAC traveler test failed', false, err.message);
  }

  // 3. Test Unauthenticated Access Rejection (No token -> HTTP 401)
  console.log('\n--- 3. Unauthenticated Access Guard ---');
  try {
    const res = await fetch(`${BASE_URL}/stats`);

    assert(
      'GET /api/admin/stats without token returns HTTP 401 Unauthorized',
      res.status === 401,
      `Status: ${res.status} (Expected 401)`
    );
  } catch (err) {
    assert('Unauthenticated test failed', false, err.message);
  }

  // 4. Test User Management
  console.log('\n--- 4. User Management Operations ---');
  try {
    const listRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listJson = await listRes.json();

    assert(
      'GET /api/admin/users returns list of registered platform users',
      listRes.status === 200 && Array.isArray(listJson.data) && listJson.data.length > 0,
      `Count: ${listJson.data?.length}`
    );

    // Update user role
    const roleRes = await fetch(`${BASE_URL}/users/3/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'agent' }),
    });

    assert(
      'PUT /api/admin/users/:id/role updates user role with admin authorization',
      roleRes.status === 200,
      `Status: ${roleRes.status}`
    );

    // Reset user role back to traveler
    await fetch(`${BASE_URL}/users/3/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'traveler' }),
    });
  } catch (err) {
    assert('User management test failed', false, err.message);
  }

  // 5. Test Destination Management
  console.log('\n--- 5. Destination Management Operations ---');
  let createdDestId = null;
  try {
    const createRes = await fetch(`${BASE_URL}/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Maldives Crystal Atolls',
        country: 'Maldives',
        city: 'Male',
        description: 'Overwater luxury villas and turquoise coral reefs.',
        category: 'beach',
      }),
    });
    const createJson = await createRes.json();
    createdDestId = createJson.data?.id;

    assert(
      'POST /api/admin/destinations creates new destination and returns HTTP 201',
      createRes.status === 201 && Boolean(createdDestId),
      `Status: ${createRes.status}, Dest ID: ${createdDestId}`
    );

    // Update destination
    const updateRes = await fetch(`${BASE_URL}/destinations/${createdDestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ is_featured: 1 }),
    });

    assert(
      'PUT /api/admin/destinations/:id updates destination properties',
      updateRes.status === 200,
      `Status: ${updateRes.status}`
    );
  } catch (err) {
    assert('Destination management test failed', false, err.message);
  }

  // 6. Test Package Management
  console.log('\n--- 6. Package Management Operations ---');
  try {
    const pkgRes = await fetch(`${BASE_URL}/packages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pkgJson = await pkgRes.json();

    assert(
      'GET /api/admin/packages returns packages catalog',
      pkgRes.status === 200 && Array.isArray(pkgJson.data),
      `Count: ${pkgJson.data?.length}`
    );

    const toggleRes = await fetch(`${BASE_URL}/packages/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ is_available: 1 }),
    });

    assert(
      'PUT /api/admin/packages/:id updates package availability',
      toggleRes.status === 200,
      `Status: ${toggleRes.status}`
    );
  } catch (err) {
    assert('Package management test failed', false, err.message);
  }

  // 7. Test Booking Management
  console.log('\n--- 7. Booking Management Operations ---');
  try {
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bookJson = await bookRes.json();

    assert(
      'GET /api/admin/bookings returns platform bookings list',
      bookRes.status === 200 && Array.isArray(bookJson.data),
      `Count: ${bookJson.data?.length}`
    );

    const statusRes = await fetch(`${BASE_URL}/bookings/1/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });

    assert(
      'PUT /api/admin/bookings/:id/status updates booking lifecycle state',
      statusRes.status === 200,
      `Status: ${statusRes.status}`
    );
  } catch (err) {
    assert('Booking management test failed', false, err.message);
  }

  // 8. Test Review Moderation
  console.log('\n--- 8. Review Moderation Operations ---');
  try {
    const revRes = await fetch(`${BASE_URL}/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const revJson = await revRes.json();

    assert(
      'GET /api/admin/reviews returns platform reviews list for moderation',
      revRes.status === 200 && Array.isArray(revJson.data),
      `Count: ${revJson.data?.length}`
    );

    const appRes = await fetch(`${BASE_URL}/reviews/1/approval`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isApproved: true }),
    });

    assert(
      'PUT /api/admin/reviews/:id/approval toggles review approval status',
      appRes.status === 200,
      `Status: ${appRes.status}`
    );
  } catch (err) {
    assert('Review moderation test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Admin Test Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Admin Dashboard and RBAC backend tests passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some admin tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testAdminSuite()
    .then((ok) => {
      process.exitCode = ok ? 0 : 1;
    })
    .catch((err) => {
      console.error('Fatal admin test error:', err);
      process.exitCode = 1;
    });
}

module.exports = { testAdminSuite };
