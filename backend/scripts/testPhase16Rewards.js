const app = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

async function testPhase16RewardsSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 16: Travel Rewards & Points System   ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api`;
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

  // Generate Traveler and Admin JWT tokens
  const jwtSecret = config.jwt?.secret || process.env.JWT_SECRET || 'travel_jwt_super_secret_key_2026_secure!';
  const travelerToken = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@travelplanner.com', role: 'admin' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const travelerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${travelerToken}`,
  };

  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // 1. Authentication & Security Guards (Feature 13 & 14)
  console.log('--- 1. Authentication & Security Guards (Feature 13 & 14) ---');
  try {
    const resNoAuth = await fetch(`${BASE_URL}/rewards/balance`);
    assert(
      'GET /api/rewards/balance without token returns HTTP 401 Unauthorized',
      resNoAuth.status === 401,
      `Status: ${resNoAuth.status}`
    );
  } catch (err) {
    assert('Auth test failed', false, err.message);
  }

  // 2. User Reward Balance & Tier Levels (Feature 2, 8 & 9)
  console.log('\n--- 2. Reward Balance & Tier Calculations (Feature 2, 8 & 9) ---');
  try {
    const resBal = await fetch(`${BASE_URL}/rewards/balance`, { headers: travelerHeaders });
    const jsonBal = await resBal.json();
    const data = jsonBal.data;

    assert(
      'GET /api/rewards/balance returns current points and tier metadata (HTTP 200)',
      resBal.status === 200 && data && data.totalPoints !== undefined,
      `Points: ${data?.totalPoints}, Level: ${data?.currentLevel}`
    );

    assert(
      'Calculates dynamic progress bar and points needed for next tier (Feature 9)',
      typeof data?.progressPercentage === 'number' &&
        data.progressPercentage >= 0 &&
        data.progressPercentage <= 100 &&
        data.tier !== undefined,
      `Progress: ${data?.progressPercentage}%, Tier: ${data?.tier}, Next: ${data?.nextLevel}`
    );
  } catch (err) {
    assert('Reward balance test failed', false, err.message);
  }

  // 3. Reward Transaction History (Feature 3 & 4)
  console.log('\n--- 3. Reward Transaction History (Feature 3 & 4) ---');
  try {
    const resHist = await fetch(`${BASE_URL}/rewards/history`, { headers: travelerHeaders });
    const jsonHist = await resHist.json();
    const history = jsonHist.data || [];

    assert(
      'GET /api/rewards/history returns itemized chronological transaction ledger (HTTP 200)',
      resHist.status === 200 && Array.isArray(history) && history.length > 0,
      `Transactions Count: ${history.length}`
    );

    const firstTx = history[0];
    assert(
      'Transaction record contains required fields (id, activity_type, points, description, created_at)',
      firstTx.id && firstTx.activity_type && firstTx.points > 0 && firstTx.description,
      `Sample Tx: ${JSON.stringify(firstTx)}`
    );
  } catch (err) {
    assert('History test failed', false, err.message);
  }

  // 4. Completed Trip Reward Trigger (Feature 5)
  console.log('\n--- 4. Completed Trip Reward Trigger (+100 pts) (Feature 5) ---');
  try {
    const rewardService = require('../src/services/rewardService');
    const result = await rewardService.awardPoints(
      3,
      'trip_completed',
      `test_booking_${Date.now()}`,
      100,
      'Completed Ooty Scenic Mountain Tour'
    );

    assert(
      'awardPoints awards +100 Travel Points on completed trip',
      result.isNew === true && result.points === 100,
      `Awarded: ${result.points}, isNew: ${result.isNew}`
    );
  } catch (err) {
    assert('Completed trip test failed', false, err.message);
  }

  // 5. Verified Review Reward Trigger (Feature 6)
  console.log('\n--- 5. Verified Review Reward Trigger (+25 pts) (Feature 6) ---');
  try {
    const rewardService = require('../src/services/rewardService');
    const result = await rewardService.awardPoints(
      3,
      'review_submitted',
      `test_review_${Date.now()}`,
      25,
      'Submitted verified review for Swiss Alps'
    );

    assert(
      'awardPoints awards +25 Travel Points on verified review submission',
      result.isNew === true && result.points === 25,
      `Awarded: ${result.points}, isNew: ${result.isNew}`
    );
  } catch (err) {
    assert('Review reward test failed', false, err.message);
  }

  // 6. Saved Trip Plan Reward Trigger (Feature 7)
  console.log('\n--- 6. Saved Trip Plan Reward Trigger (+10 pts) (Feature 7) ---');
  try {
    const rewardService = require('../src/services/rewardService');
    const result = await rewardService.awardPoints(
      3,
      'trip_saved',
      `test_trip_${Date.now()}`,
      10,
      'Saved custom itinerary: Kyoto Autumn Exploration'
    );

    assert(
      'awardPoints awards +10 Travel Points on saving new trip blueprint',
      result.isNew === true && result.points === 10,
      `Awarded: ${result.points}, isNew: ${result.isNew}`
    );
  } catch (err) {
    assert('Saved trip reward test failed', false, err.message);
  }

  // 7. Duplicate Reward Prevention (Feature 4, 7 & 14)
  console.log('\n--- 7. Duplicate Reward Prevention (Feature 4, 7 & 14) ---');
  try {
    const rewardService = require('../src/services/rewardService');
    const uniqueRef = `fixed_ref_duplicate_test_${Date.now()}`;

    // First call: Should award points
    const firstCall = await rewardService.awardPoints(3, 'trip_completed', uniqueRef, 100, 'Test Duplicate');
    // Second call with same activity & ref: Must NOT award points
    const secondCall = await rewardService.awardPoints(3, 'trip_completed', uniqueRef, 100, 'Test Duplicate');

    assert(
      'Idempotently prevents duplicate reward points for the same qualifying activity and reference ID',
      firstCall.isNew === true && secondCall.isNew === false && secondCall.points === 0,
      `First Call: ${firstCall.isNew}, Second Call: ${secondCall.isNew}`
    );
  } catch (err) {
    assert('Duplicate prevention test failed', false, err.message);
  }

  // 8. In-App Notification Dispatch (Feature 15)
  console.log('\n--- 8. In-App Notification Dispatch (Feature 15) ---');
  try {
    const resNotif = await fetch(`${BASE_URL}/notifications`, { headers: travelerHeaders });
    const jsonNotif = await resNotif.json();
    const notifs = jsonNotif.data?.notifications || (Array.isArray(jsonNotif.data) ? jsonNotif.data : []);

    const hasRewardNotif = notifs.some(
      (n) => (n.title && n.title.includes('Reward')) || (n.message && n.message.includes('Travel Points'))
    );

    assert(
      'System dispatches in-app notification when reward points are credited',
      hasRewardNotif,
      `Notifications checked: ${notifs.length}`
    );
  } catch (err) {
    assert('Notification check failed', false, err.message);
  }

  // 9. Admin Reward Analytics (Feature 11)
  console.log('\n--- 9. Admin Dashboard Reward Statistics (Feature 11) ---');
  try {
    const resStats = await fetch(`${BASE_URL}/rewards/stats`, { headers: adminHeaders });
    const jsonStats = await resStats.json();
    const stats = jsonStats.data;

    assert(
      'GET /api/rewards/stats returns aggregated platform reward statistics to Admin (HTTP 200)',
      resStats.status === 200 && stats?.totalPointsAwarded !== undefined && stats?.totalTransactions !== undefined,
      `Total Points: ${stats?.totalPointsAwarded}, Transactions: ${stats?.totalTransactions}`
    );

    const resNonAdmin = await fetch(`${BASE_URL}/rewards/stats`, { headers: travelerHeaders });
    assert(
      'GET /api/rewards/stats rejects non-admin users with HTTP 403 Forbidden',
      resNonAdmin.status === 403,
      `Status: ${resNonAdmin.status}`
    );
  } catch (err) {
    assert('Admin stats test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 16 Rewards Suite Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 16 Travel Rewards tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 16 Travel Rewards tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase16RewardsSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase16RewardsSuite;


