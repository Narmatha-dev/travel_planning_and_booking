const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authService = require('../src/services/authService');
const googleAuthService = require('../src/services/googleAuthService');
const userModel = require('../src/models/userModel');
const { query } = require('../src/config/db');

let passCount = 0;
let failCount = 0;

function logPass(msg) {
  passCount++;
  console.log(`✔ [PASS] ${msg}`);
}

function logFail(msg, err) {
  failCount++;
  console.error(`❌ [FAIL] ${msg}`);
  if (err) console.error('  ', err.message || err);
}

async function runGoogleAuthTests() {
  console.log('=====================================================');
  console.log('  Testing Google OAuth 2.0 Authentication Flow       ');
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Google OAuth URL Generation
    // -----------------------------------------------------------------
    console.log('--- 1. OAuth URL Generation & State Serialization ---');
    try {
      // Temporarily mock client ID if empty to test URL generator logic
      const originalClientId = require('../src/config/environment').google.clientId;
      if (!require('../src/config/environment').google.clientId) {
        require('../src/config/environment').google.clientId = 'mock-test-client-id.apps.googleusercontent.com';
      }

      const url = googleAuthService.getGoogleAuthUrl({ redirect: '/my-trips' });
      assert(url.includes('accounts.google.com/o/oauth2/v2/auth'), 'URL must target Google OAuth endpoint');
      assert(url.includes('client_id='), 'URL must contain client_id');
      assert(url.includes('scope='), 'URL must contain scope');
      assert(url.includes('state='), 'URL must contain serialized state');

      const urlObj = new URL(url);
      const stateParam = urlObj.searchParams.get('state');
      const parsedState = googleAuthService.parseState(stateParam);
      assert.strictEqual(parsedState.redirect, '/my-trips', 'State redirect parameter must be preserved');

      logPass('Google OAuth authorization URL correctly formatted with state');
      require('../src/config/environment').google.clientId = originalClientId;
    } catch (err) {
      logFail('Google OAuth authorization URL formatting failed', err);
    }

    // -----------------------------------------------------------------
    // 2. New Google User Registration Flow
    // -----------------------------------------------------------------
    console.log('\n--- 2. New Google User Creation Flow ---');
    const testGoogleId = `google_sub_${Date.now()}`;
    const testGoogleEmail = `google.traveler.${Date.now()}@gmail.com`;
    const testFullName = 'Maya Lin';
    const testAvatar = 'https://lh3.googleusercontent.com/a/test-avatar';

    try {
      const result = await authService.handleGoogleAuth({
        googleId: testGoogleId,
        email: testGoogleEmail,
        fullName: testFullName,
        profileImageUrl: testAvatar,
      });

      assert(result.token, 'Must return signed JWT token');
      assert(result.user, 'Must return safe user object');
      assert.strictEqual(result.user.email, testGoogleEmail, 'Email must match');
      assert.strictEqual(result.user.full_name, testFullName, 'Full name must match');
      assert.strictEqual(result.isNewUser, true, 'Flag isNewUser must be true for first registration');

      // Verify persistence in MySQL
      const dbUser = await userModel.findByEmail(testGoogleEmail);
      assert(dbUser, 'User must exist in MySQL database');
      assert.strictEqual(dbUser.google_id, testGoogleId, 'google_id must match');
      assert.strictEqual(dbUser.auth_provider, 'google', 'auth_provider must be google');
      assert.strictEqual(dbUser.password_hash, null, 'password_hash must be null for OAuth user');

      logPass('New user automatically registered via Google OAuth and saved to MySQL');
    } catch (err) {
      logFail('New user registration via Google OAuth failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Repeat Login for Existing Google User
    // -----------------------------------------------------------------
    console.log('\n--- 3. Repeat Login with Existing Google ID ---');
    try {
      const result = await authService.handleGoogleAuth({
        googleId: testGoogleId,
        email: testGoogleEmail,
        fullName: testFullName,
        profileImageUrl: testAvatar,
      });

      assert(result.token, 'Must return signed JWT token');
      assert.strictEqual(result.isNewUser, false, 'isNewUser must be false for existing user');
      assert.strictEqual(result.user.email, testGoogleEmail, 'Email must match');

      // Ensure no duplicate rows were created in users table
      const [countRows] = await query('SELECT COUNT(*) as count FROM users WHERE email = ?', [testGoogleEmail]);
      assert.strictEqual(Number(countRows[0].count), 1, 'Exactly one user record must exist (no duplicates)');

      logPass('Existing Google user logs in seamlessly without duplicate records');
    } catch (err) {
      logFail('Repeat Google user login failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Account Linking: Existing Email/Password User Signs In with Google
    // -----------------------------------------------------------------
    console.log('\n--- 4. Account Linking for Existing Email Account ---');
    const linkedEmail = `existing.traveler.${Date.now()}@example.com`;
    const linkedGoogleId = `google_linked_${Date.now()}`;

    try {
      // 1. First, user registers with traditional email/password
      const localRegister = await authService.register({
        fullName: 'Jordan Reed',
        email: linkedEmail,
        password: 'Password123!',
        role: 'traveler',
      });
      assert(localRegister.user.id, 'Local user must be created');

      // 2. Later, user clicks "Continue with Google" with the same email
      const googleLinkResult = await authService.handleGoogleAuth({
        googleId: linkedGoogleId,
        email: linkedEmail,
        fullName: 'Jordan Reed Google',
        profileImageUrl: 'https://lh3.googleusercontent.com/a/jordan-avatar',
      });

      assert(googleLinkResult.token, 'Must return JWT token for linked user');
      assert.strictEqual(googleLinkResult.user.id, localRegister.user.id, 'User ID must remain identical');
      assert.strictEqual(googleLinkResult.isNewUser, false, 'isNewUser must be false for linked account');

      // 3. Verify user in database now has google_id attached
      const linkedUserDb = await userModel.findById(localRegister.user.id);
      assert.strictEqual(linkedUserDb.google_id, linkedGoogleId, 'google_id must be linked in DB');

      // 4. Verify user can STILL log in with their original email and password!
      const localLoginAgain = await authService.login({
        email: linkedEmail,
        password: 'Password123!',
      });
      assert(localLoginAgain.token, 'Email/password login must remain valid after linking Google');

      logPass('Existing email/password account linked to Google without breaking password authentication');
    } catch (err) {
      logFail('Account linking test failed', err);
    }

    // -----------------------------------------------------------------
    // 5. Deactivated User Guard
    // -----------------------------------------------------------------
    console.log('\n--- 5. Deactivated User Security Guard ---');
    try {
      const deactGoogleId = `google_deact_${Date.now()}`;
      const deactEmail = `deactivated.${Date.now()}@gmail.com`;

      // Create deactivated user
      const userId = await userModel.create({
        fullName: 'Deactivated Traveler',
        email: deactEmail,
        googleId: deactGoogleId,
        authProvider: 'google',
        role: 'traveler',
      });

      await query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);

      let threw = false;
      try {
        await authService.handleGoogleAuth({
          googleId: deactGoogleId,
          email: deactEmail,
        });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 403, 'Must return HTTP 403 Forbidden for deactivated account');
      }

      assert(threw, 'Deactivated account should be blocked from signing in');
      logPass('Deactivated Google account properly blocked with HTTP 403 Forbidden');
    } catch (err) {
      logFail('Deactivated account guard test failed', err);
    }

    // -----------------------------------------------------------------
    // 6. Clean Up Test Records
    // -----------------------------------------------------------------
    try {
      await query('DELETE FROM users WHERE email IN (?, ?, ?)', [
        testGoogleEmail,
        linkedEmail,
        `deactivated.${Date.now()}@gmail.com`,
      ]);
    } catch (e) {
      // Ignore cleanup error
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` Google OAuth Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exit(failCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runGoogleAuthTests();
}

module.exports = { runGoogleAuthTests };
