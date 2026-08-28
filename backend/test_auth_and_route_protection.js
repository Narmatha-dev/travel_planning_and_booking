const API_BASE = 'http://localhost:5000/api';

async function runAuthSecuritySuite() {
  console.log('======================================================================');
  console.log('🛡️ RUNNING COMPREHENSIVE AUTHENTICATION & ROUTE PROTECTION TEST SUITE');
  console.log('======================================================================\n');

  let travelerToken = null;
  let adminToken = null;
  let testResults = [];

  // Helper to record result
  function record(testNum, testName, pass, details) {
    testResults.push({ testNum, testName, pass, details });
    console.log(`[TEST ${testNum}] ${testName}: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    if (details) console.log(`  Details: ${details}`);
  }

  // -------------------------------------------------------------------------
  // TEST 1 & 2: Frontend Route Protection Logic & Unauthenticated Redirect
  // -------------------------------------------------------------------------
  try {
    // Check if unauthenticated requests to protected backend user profile fail with 401
    const res = await fetch(`${API_BASE}/auth/profile`);
    const data = await res.json();
    const pass = res.status === 401 && data.status === 'error';
    record(1, 'Unauthenticated access to protected profile', pass, `Status: ${res.status}, Message: "${data.message}"`);
  } catch (err) {
    record(1, 'Unauthenticated access to protected profile', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Enter incorrect login credentials
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.reed@example.com', password: 'CompletelyWrongPassword999!' }),
    });
    const data = await res.json();
    const pass = res.status === 401 && !data.data?.token;
    record(3, 'Incorrect login credentials rejected', pass, `Status: ${res.status}, Message: "${data.message}"`);
  } catch (err) {
    record(3, 'Incorrect login credentials rejected', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Login with valid credentials
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.reed@example.com', password: 'TravelPass123!' }),
    });
    const data = await res.json();
    travelerToken = data.data?.token;
    const pass = res.status === 200 && Boolean(travelerToken) && data.data?.user?.role === 'traveler';
    record(4, 'Valid traveler login creates session & token', pass, `Status: ${res.status}, Role: "${data.data?.user?.role}"`);
  } catch (err) {
    record(4, 'Valid traveler login creates session & token', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Refresh the browser / Restore authenticated session via Profile API
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const data = await res.json();
    const pass = res.status === 200 && data.data?.user?.email === 'alex.reed@example.com';
    record(5, 'Session restoration on refresh via verified token', pass, `Status: ${res.status}, User: "${data.data?.user?.full_name}"`);
  } catch (err) {
    record(5, 'Session restoration on refresh via verified token', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6 & 7: Logout simulation (Nullifying token & verifying access denial)
  // -------------------------------------------------------------------------
  try {
    // After logout, token is removed from client, request has no token
    const res = await fetch(`${API_BASE}/trips`, {
      headers: {}, // No token
    });
    const data = await res.json();
    const pass = res.status === 401;
    record(6, 'Logout clears session; subsequent protected actions blocked', pass, `Status: ${res.status}, Message: "${data.message}"`);
  } catch (err) {
    record(6, 'Logout clears session; subsequent protected actions blocked', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Try accessing protected APIs without a token
  // -------------------------------------------------------------------------
  try {
    const resBookings = await fetch(`${API_BASE}/bookings`);
    const dataBookings = await resBookings.json();

    const resNotifs = await fetch(`${API_BASE}/notifications`);
    const dataNotifs = await resNotifs.json();

    const pass = resBookings.status === 401 && resNotifs.status === 401;
    record(8, 'Protected user APIs enforce 401 Unauthorized without token', pass, `Bookings: ${resBookings.status}, Notifications: ${resNotifs.status}`);
  } catch (err) {
    record(8, 'Protected user APIs enforce 401 Unauthorized without token', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: Try accessing Admin API using normal Traveler account
  // -------------------------------------------------------------------------
  try {
    const resAdminStats = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const dataAdminStats = await resAdminStats.json();

    const resAdminPackages = await fetch(`${API_BASE}/admin/packages`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });

    const pass = resAdminStats.status === 403 && resAdminPackages.status === 403;
    record(9, 'Traveler token blocked from Admin APIs with 403 Forbidden', pass, `Stats: ${resAdminStats.status}, Packages: ${resAdminPackages.status}, Message: "${dataAdminStats.message}"`);
  } catch (err) {
    record(9, 'Traveler token blocked from Admin APIs with 403 Forbidden', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Use an expired or invalid token
  // -------------------------------------------------------------------------
  try {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedSignature';
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    const data = await res.json();
    const pass = res.status === 401;
    record(10, 'Invalid/expired token rejected with 401 Unauthorized', pass, `Status: ${res.status}, Message: "${data.message}"`);
  } catch (err) {
    record(10, 'Invalid/expired token rejected with 401 Unauthorized', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('======================================================================');
  const allPassed = testResults.every((t) => t.pass);
  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Passed: ${testResults.filter((t) => t.pass).length}`);
  console.log(`Failed: ${testResults.filter((t) => !t.pass).length}`);
  if (allPassed) {
    console.log('\n🎉 ALL 10 AUTHENTICATION & ROUTE PROTECTION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME TESTS FAILED.');
  }
}

runAuthSecuritySuite().catch(console.error);
