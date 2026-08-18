const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../src/config/environment');

async function testAuthSuite() {
  console.log('=====================================================');
  console.log('  Testing User Authentication System (Phase 5)       ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/auth`;

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

  // 1. Test Password Hashing with BCrypt
  console.log('--- 1. Password Hashing & Security ---');
  const rawPassword = 'SecretTravelPassword2026!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);
  assert('Password is not stored as plain text', hash !== rawPassword && hash.startsWith('$2'));
  const match = await bcrypt.compare(rawPassword, hash);
  assert('BCrypt compare validates valid password correctly', match === true);
  const mismatch = await bcrypt.compare('WrongPassword', hash);
  assert('BCrypt compare rejects invalid password', mismatch === false);

  // 2. Test JWT Token Creation and Verification
  console.log('\n--- 2. JWT Generation & Validation ---');
  const payload = { id: 42, email: 'test.traveler@example.com', role: 'traveler' };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
  assert('JWT token is generated as signed string', typeof token === 'string' && token.split('.').length === 3);

  const decoded = jwt.verify(token, config.jwt.secret);
  assert('JWT decodes correct payload (id, email, role)', decoded.id === 42 && decoded.email === 'test.traveler@example.com');

  try {
    jwt.verify(token, 'wrong-secret-key');
    assert('JWT verification fails with wrong secret', false, 'Should have thrown error');
  } catch {
    assert('JWT verification rejects tampered / invalid signatures', true);
  }

  // 3. Test HTTP Validation Endpoints
  console.log('\n--- 3. HTTP Authentication Endpoint Tests ---');

  // Test 3.1: Register without email
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'John Doe', password: 'password123' }),
    });
    const data = await res.json();
    assert('Register requires email address (HTTP 400)', res.status === 400 && data.status === 'error');
  } catch (err) {
    assert('Register requires email address (HTTP 400)', false, err.message);
  }

  // Test 3.2: Register with short password (< 6 chars)
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'John Doe', email: 'john@example.com', password: '123' }),
    });
    const data = await res.json();
    assert('Register rejects short password < 6 chars (HTTP 400)', res.status === 400 && data.status === 'error');
  } catch (err) {
    assert('Register rejects short password < 6 chars (HTTP 400)', false, err.message);
  }

  // Test 3.3: Login with missing credentials
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });
    const data = await res.json();
    assert('Login requires email and password (HTTP 400)', res.status === 400 && data.status === 'error');
  } catch (err) {
    assert('Login requires email and password (HTTP 400)', false, err.message);
  }

  // Test 3.4: Protected route GET /api/auth/profile without token
  try {
    const res = await fetch(`${BASE_URL}/profile`);
    const data = await res.json();
    assert('GET /api/auth/profile without token returns HTTP 401 Unauthorized', res.status === 401 && data.status === 'error');
  } catch (err) {
    assert('GET /api/auth/profile without token returns HTTP 401 Unauthorized', false, err.message);
  }

  // Test 3.5: Protected route with invalid Bearer token
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    const data = await res.json();
    assert('GET /api/auth/profile with invalid token returns HTTP 401', res.status === 401 && data.status === 'error');
  } catch (err) {
    assert('GET /api/auth/profile with invalid token returns HTTP 401', false, err.message);
  }

  // 4. End-to-End Registration, Login & Token Flow
  console.log('\n--- 4. End-to-End Registration & Login Flow ---');
  const testUserEmail = `traveler.${Date.now()}@example.com`;
  const testUserPassword = 'MySecretPass2026!';
  let issuedToken = null;

  // Test 4.1: Successful User Registration
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Explorer',
        email: testUserEmail,
        password: testUserPassword,
        phoneNumber: '+1-555-9876',
        role: 'traveler',
      }),
    });
    const json = await res.json();
    assert(
      'POST /api/auth/register successfully creates user and returns JWT token',
      res.status === 201 && json.status === 'success' && Boolean(json.data?.token && json.data?.user?.email === testUserEmail.toLowerCase())
    );
  } catch (err) {
    assert('POST /api/auth/register successfully creates user and returns JWT token', false, err.message);
  }

  // Test 4.2: Duplicate User Registration Prevention
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Explorer',
        email: testUserEmail,
        password: testUserPassword,
      }),
    });
    const json = await res.json();
    assert(
      'Duplicate registration rejected with HTTP 409 Conflict',
      res.status === 409 && json.status === 'error'
    );
  } catch (err) {
    assert('Duplicate registration rejected with HTTP 409 Conflict', false, err.message);
  }

  // Test 4.3: Login with Registered User Credentials
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
      }),
    });
    const json = await res.json();
    issuedToken = json.data?.token;
    assert(
      'POST /api/auth/login with registered user returns HTTP 200 and valid JWT token',
      res.status === 200 && json.status === 'success' && Boolean(issuedToken && json.data?.user?.email === testUserEmail.toLowerCase())
    );
  } catch (err) {
    assert('POST /api/auth/login with registered user returns HTTP 200 and valid JWT token', false, err.message);
  }

  // Test 4.4: Login with Wrong Password
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'IncorrectPassword999!',
      }),
    });
    const json = await res.json();
    assert(
      'Login with incorrect password returns HTTP 401 "Invalid email or password"',
      res.status === 401 && json.status === 'error' && json.message === 'Invalid email or password'
    );
  } catch (err) {
    assert('Login with incorrect password returns HTTP 401', false, err.message);
  }

  // Test 4.5: Login with Non-existent Email
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody_exists_here_999@example.com',
        password: testUserPassword,
      }),
    });
    const json = await res.json();
    assert(
      'Login with non-existent email returns HTTP 401 "Invalid email or password"',
      res.status === 401 && json.status === 'error' && json.message === 'Invalid email or password'
    );
  } catch (err) {
    assert('Login with non-existent email returns HTTP 401', false, err.message);
  }

  // Test 4.6: Access Protected Profile with Issued Token
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${issuedToken}` },
    });
    const json = await res.json();
    assert(
      'GET /api/auth/profile with issued JWT retrieves authenticated user profile',
      res.status === 200 && json.data?.user?.email === testUserEmail.toLowerCase()
    );
  } catch (err) {
    assert('GET /api/auth/profile with issued JWT retrieves authenticated user profile', false, err.message);
  }

  // Test 4.7: Demo Traveler Login (alex.reed@example.com / TravelPass123!)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.reed@example.com',
        password: 'TravelPass123!',
      }),
    });
    const json = await res.json();
    assert(
      'Login with demo traveler (alex.reed@example.com / TravelPass123!) succeeds (HTTP 200)',
      res.status === 200 && json.data?.user?.role === 'traveler' && Boolean(json.data?.token)
    );
  } catch (err) {
    assert('Login with demo traveler succeeds', false, err.message);
  }

  // Test 4.8: Demo Admin Login (admin@travelplanner.com / TravelPass123!)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@travelplanner.com',
        password: 'TravelPass123!',
      }),
    });
    const json = await res.json();
    assert(
      'Login with demo admin (admin@travelplanner.com / TravelPass123!) succeeds with admin role (HTTP 200)',
      res.status === 200 && json.data?.user?.role === 'admin' && Boolean(json.data?.token)
    );
  } catch (err) {
    assert('Login with demo admin succeeds', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log('=====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

testAuthSuite();
