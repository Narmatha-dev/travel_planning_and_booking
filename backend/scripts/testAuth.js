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

  console.log('\n=====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log('=====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

testAuthSuite();
