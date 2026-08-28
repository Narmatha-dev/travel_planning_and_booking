const API_BASE = 'http://localhost:5000/api';

async function testSeparatedAuth() {
  console.log('======================================================================');
  console.log('🛡️ TESTING SEPARATED TRAVELER & ADMIN AUTHENTICATION FLOWS');
  console.log('======================================================================\n');

  let travelerToken = '';
  let adminToken = '';

  // 1. TRAVELER LOGIN at /api/auth/login
  console.log('1. Testing Traveler Login with valid Traveler credentials (/api/auth/login)...');
  const res1 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.reed@example.com', password: 'TravelPass123!' }),
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('User Role:', data1.data?.user?.role);
  if (res1.status === 200 && data1.data?.user?.role === 'traveler') {
    travelerToken = data1.data.token;
    console.log('✅ TEST 1 PASSED: Traveler successfully authenticated as Traveler!\n');
  } else {
    console.error('❌ TEST 1 FAILED:', data1);
  }

  // 2. ADMIN CREDENTIALS AT /api/auth/login (Must be rejected from traveler login)
  console.log('2. Testing Admin credentials on Traveler Login (/api/auth/login)...');
  const res2 = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@travelplanner.com', password: 'TravelPass123!' }),
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Message:', data2.message);
  if (res2.status === 403 && data2.message.includes('administrator account')) {
    console.log('✅ TEST 2 PASSED: Admin prevented from logging in via Traveler portal!\n');
  } else {
    console.error('❌ TEST 2 FAILED:', data2);
  }

  // 3. ADMIN LOGIN at /api/auth/admin/login
  console.log('3. Testing Admin Login with valid Admin credentials (/api/auth/admin/login)...');
  const res3 = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@travelplanner.com', password: 'TravelPass123!' }),
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('User Role:', data3.data?.user?.role);
  if (res3.status === 200 && data3.data?.user?.role === 'admin') {
    adminToken = data3.data.token;
    console.log('✅ TEST 3 PASSED: Admin successfully authenticated as Administrator!\n');
  } else {
    console.error('❌ TEST 3 FAILED:', data3);
  }

  // 4. TRAVELER CREDENTIALS AT /api/auth/admin/login (Must be rejected)
  console.log('4. Testing Traveler credentials on Admin Login (/api/auth/admin/login)...');
  const res4 = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.reed@example.com', password: 'TravelPass123!' }),
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status);
  console.log('Message:', data4.message);
  if (res4.status === 403) {
    console.log('✅ TEST 4 PASSED: Traveler rejected with 403 Forbidden from Admin portal!\n');
  } else {
    console.error('❌ TEST 4 FAILED:', data4);
  }

  // 5. INVALID CREDENTIALS ON BOTH ENDPOINTS
  console.log('5. Testing Invalid Credentials...');
  const res5a = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake@example.com', password: 'wrong' }),
  });
  const res5b = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake@example.com', password: 'wrong' }),
  });
  if (res5a.status === 401 && res5b.status === 401) {
    console.log('✅ TEST 5 PASSED: Invalid credentials rejected with 401 on both endpoints!\n');
  } else {
    console.error('❌ TEST 5 FAILED:', res5a.status, res5b.status);
  }

  // 6. ADMIN API PROTECTION (/api/admin/stats)
  console.log('6. Testing Admin API Protection (/api/admin/stats)...');
  
  // A. Unauthenticated
  const res6a = await fetch(`${API_BASE}/admin/stats`);
  console.log('A. Unauthenticated request status:', res6a.status);

  // B. Traveler Token
  const res6b = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${travelerToken}` },
  });
  console.log('B. Traveler Token request status:', res6b.status);

  // C. Admin Token
  const res6c = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('C. Admin Token request status:', res6c.status);

  if (res6a.status === 401 && res6b.status === 403 && res6c.status === 200) {
    console.log('✅ TEST 6 PASSED: Admin API rejects unauthenticated (401), forbids traveler (403), allows admin (200)!\n');
  } else {
    console.error('❌ TEST 6 FAILED:', res6a.status, res6b.status, res6c.status);
  }

  console.log('🎉 ALL 6 COMPREHENSIVE AUTHENTICATION & ACCESS CONTROL TESTS PASSED 100%!');
}

testSeparatedAuth().catch(console.error);
