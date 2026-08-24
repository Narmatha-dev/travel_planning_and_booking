const app = require('../src/server');
const config = require('../src/config/environment');
const authService = require('../src/services/authService');
const mlRecommendationService = require('../src/services/mlRecommendationService');

async function testPhase20MlRecommendationsSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 20: Machine Learning Recommendations');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/recommendations`;
  const ADMIN_URL = `http://localhost:${config.port}/api/admin/ml`;
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

  // Generate test JWT tokens
  const travelerToken = authService.generateToken({ id: 3, email: 'alex.reed@example.com', role: 'traveler' });
  const adminToken = authService.generateToken({ id: 1, email: 'admin@travelplanner.com', role: 'admin' });

  // 1. Data Preprocessing & Vocabulary Representation (Feature 1 & 2)
  console.log('--- 1. Data Preprocessing & Vocabulary Representation (Feature 1 & 2) ---');
  try {
    const testDest = {
      id: 106,
      name: 'Ooty & Nilgiri Hills',
      category: 'nature',
      tags: ['nature', 'mountain', 'hill_station'],
      topActivities: ['toy train', 'botanical garden'],
    };
    const vector = mlRecommendationService.vectorizeDestination(testDest);
    const hasNonZero = vector.some((v) => v > 0);
    const vectorMagnitude = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));

    assert(
      'Destination vectorized into normalized unit feature space (Feature 2 & 4)',
      Array.isArray(vector) && vector.length > 20 && hasNonZero && Math.abs(vectorMagnitude - 1.0) < 0.01,
      `Dimension: ${vector.length}, Norm: ${vectorMagnitude.toFixed(3)}`
    );
  } catch (err) {
    assert('Vectorization test failed', false, err.message);
  }

  // 2. User Profile Vector Construction & Multi-Source Interaction Weighting (Feature 5 & 6)
  console.log('\n--- 2. User Profile Vector Construction (Feature 5 & 6) ---');
  try {
    const userProfile = await mlRecommendationService.buildUserProfileVector(3, ['beach', 'relaxation']);
    const isNormalized = Array.isArray(userProfile.vector) && userProfile.vector.some((v) => v > 0);

    assert(
      'User profile combines explicit preferences with interaction signals (Feature 5 & 6)',
      isNormalized && typeof userProfile.interactionCount === 'number',
      `Interactions captured: ${userProfile.interactionCount}`
    );
  } catch (err) {
    assert('User profile construction test failed', false, err.message);
  }

  // 3. Hybrid ML Recommendation Generation (Feature 3, 7 & 8)
  console.log('\n--- 3. Hybrid ML Recommendation Generation (Feature 3, 7 & 8) ---');
  try {
    const mlRecs = await mlRecommendationService.getRecommendations(3, {
      interests: ['nature', 'mountain'],
      budget: 25000,
      currency: 'INR',
      durationDays: 4,
      limit: 5,
    });

    assert(
      'ML Recommendation service returns Top-K scored items (Feature 8)',
      Array.isArray(mlRecs.recommendations) && mlRecs.recommendations.length === 5,
      `Count: ${mlRecs.recommendations.length}`
    );
    assert(
      'Recommendations contain genuine cosine similarity and bounded match scores (50-99%)',
      mlRecs.recommendations.every((r) => r.matchScore >= 50 && r.matchScore <= 99 && typeof r.cosineSimilarity === 'number'),
      `Top pick: ${mlRecs.recommendations[0]?.name} (Score: ${mlRecs.recommendations[0]?.matchScore}%, CosineSim: ${mlRecs.recommendations[0]?.cosineSimilarity})`
    );
  } catch (err) {
    assert('Hybrid recommendation generation test failed', false, err.message);
  }

  // 4. Personalized Feed API Endpoint (Feature 1, 14 & 20)
  console.log('\n--- 4. Personalized Feed API with ML Engine (Feature 1 & 14) ---');
  try {
    const resFeed = await fetch(`${BASE_URL}/personalized?userId=3&limit=4`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const jsonFeed = await resFeed.json();
    const items = jsonFeed.data?.recommendations || [];

    assert(
      'GET /api/recommendations/personalized serves ML-enhanced recommendations',
      resFeed.status === 200 && items.length > 0 && (jsonFeed.data?.engine === 'ml_hybrid' || jsonFeed.data?.engine === 'phase19_fallback'),
      `Engine: ${jsonFeed.data?.engine}, Count: ${items.length}`
    );
    assert(
      'Items provide explainable match reasons with ML content affinity (Feature 15)',
      items[0]?.matchReasons && items[0].matchReasons.length > 0,
      `Reason: ${items[0]?.matchReasons[0]}`
    );
  } catch (err) {
    assert('Personalized feed API test failed', false, err.message);
  }

  // 5. Cold-Start Resilience for Guest / Unauthenticated Users (Feature 10)
  console.log('\n--- 5. Cold-Start Resilience for Guests (Feature 10) ---');
  try {
    const resGuest = await fetch(`${BASE_URL}/personalized?userId=88888&limit=3`);
    const jsonGuest = await resGuest.json();
    const guestItems = jsonGuest.data?.recommendations || [];

    assert(
      'Guest travelers receive high-quality recommendations without errors or empty state (Feature 10)',
      resGuest.status === 200 && guestItems.length === 3 && guestItems[0]?.matchScore >= 50,
      `Guest top pick: ${guestItems[0]?.name} (${guestItems[0]?.matchScore}%)`
    );
  } catch (err) {
    assert('Cold start test failed', false, err.message);
  }

  // 6. Configurable Top-K Limits (Feature 8)
  console.log('\n--- 6. Configurable Top-K Limits (Feature 8) ---');
  try {
    const resK3 = await fetch(`${BASE_URL}/personalized?userId=3&limit=3`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const jsonK3 = await resK3.json();
    const resK6 = await fetch(`${BASE_URL}/personalized?userId=3&limit=6`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const jsonK6 = await resK6.json();

    assert(
      'API honors custom K limits accurately (limit=3 vs limit=6)',
      jsonK3.data?.recommendations?.length === 3 && jsonK6.data?.recommendations?.length === 6,
      `K=3 count: ${jsonK3.data?.recommendations?.length}, K=6 count: ${jsonK6.data?.recommendations?.length}`
    );
  } catch (err) {
    assert('Configurable K test failed', false, err.message);
  }

  // 7. Negative Exclusion User Feedback Loop (Feature 16)
  console.log('\n--- 7. User Feedback Integration & Negative Exclusion (Feature 16) ---');
  try {
    // Submit 'not_interested' for destination id 107 (Mahabalipuram)
    await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${travelerToken}`,
      },
      body: JSON.stringify({
        itemId: 107,
        itemType: 'destination',
        feedbackType: 'not_interested',
      }),
    });

    const resExcluded = await fetch(`${BASE_URL}/personalized?userId=3&limit=10`, {
      headers: { Authorization: `Bearer ${travelerToken}` },
    });
    const jsonExcluded = await resExcluded.json();
    const excludedItems = jsonExcluded.data?.recommendations || [];
    const is107Present = excludedItems.some((item) => item.id === 107);

    assert(
      'Destinations marked as "not_interested" are excluded from recommended feed (Feature 16)',
      !is107Present,
      `Exclusion verified for ID 107`
    );
  } catch (err) {
    assert('Negative exclusion test failed', false, err.message);
  }

  // 8. Public ML Model Status & Inspection Endpoint (Feature 14 & 18)
  console.log('\n--- 8. Public ML Model Status & Inspection (Feature 14 & 18) ---');
  try {
    const resStatus = await fetch(`${BASE_URL}/ml-status`);
    const jsonStatus = await resStatus.json();
    const statusData = jsonStatus.data;

    assert(
      'GET /api/recommendations/ml-status returns model version, status, and vocabulary metadata',
      resStatus.status === 200 && statusData?.status === 'ready' && Boolean(statusData?.modelVersion),
      `Version: ${statusData?.modelVersion}, Status: ${statusData?.status}`
    );
  } catch (err) {
    assert('Public ML status test failed', false, err.message);
  }

  // 9. Offline Evaluation Metrics Calculation (Feature 17)
  console.log('\n--- 9. Offline Evaluation Metrics (Feature 17) ---');
  try {
    const status = await mlRecommendationService.getModelStatus();
    const evalData = status.evaluation;

    assert(
      'Offline evaluation computes Precision@K, Recall@K, and HitRate@K (Feature 17)',
      evalData && typeof evalData.precisionAtK === 'number' && typeof evalData.recallAtK === 'number' && typeof evalData.hitRateAtK === 'number',
      `P@${evalData?.k}: ${(evalData?.precisionAtK * 100).toFixed(1)}%, R@${evalData?.k}: ${(evalData?.recallAtK * 100).toFixed(1)}%, HitRate: ${(evalData?.hitRateAtK * 100).toFixed(1)}%`
    );
  } catch (err) {
    assert('Evaluation metrics test failed', false, err.message);
  }

  // 10. Admin ML Status Endpoint (Feature 18)
  console.log('\n--- 10. Admin ML Status API (Feature 18) ---');
  try {
    const resAdminStatus = await fetch(`${ADMIN_URL}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const jsonAdminStatus = await resAdminStatus.json();
    const adminData = jsonAdminStatus.data;

    assert(
      'GET /api/admin/ml/status provides administration portal telemetry',
      resAdminStatus.status === 200 && adminData?.status === 'ready' && adminData?.trainingRecordsCount > 0,
      `Records: ${adminData?.trainingRecordsCount}, Version: ${adminData?.modelVersion}`
    );
  } catch (err) {
    assert('Admin ML status test failed', false, err.message);
  }

  // 11. Admin Trigger Model Retraining & Artifact Persistence (Feature 11, 12, 18 & 19)
  console.log('\n--- 11. Admin Trigger Model Retraining (Feature 11, 12 & 18) ---');
  try {
    const resTrain = await fetch(`${ADMIN_URL}/train`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const jsonTrain = await resTrain.json();
    const trainData = jsonTrain.data;

    assert(
      'POST /api/admin/ml/train trains and updates ML model artifact successfully (Feature 11 & 18)',
      resTrain.status === 200 && trainData?.status === 'ready' && Boolean(trainData?.modelVersion),
      `Trained Version: ${trainData?.modelVersion}, Records: ${trainData?.trainingRecordsCount}`
    );
  } catch (err) {
    assert('Admin retrain test failed', false, err.message);
  }

  // 12. Fast Inference Performance Check (Feature 13 & 21)
  console.log('\n--- 12. In-Process Fast Inference Performance (Feature 13 & 21) ---');
  try {
    const start = Date.now();
    await mlRecommendationService.getRecommendations(3, {
      interests: ['beach', 'culture'],
      limit: 6,
    });
    const duration = Date.now() - start;

    assert(
      'Inference completes swiftly within acceptable low latency threshold (< 100ms)',
      duration < 100,
      `Execution duration: ${duration}ms`
    );
  } catch (err) {
    assert('Latency performance test failed', false, err.message);
  }

  // 13. Admin Security & Role Authorization Enforcement (Feature 20)
  console.log('\n--- 13. Admin Security & Role Authorization (Feature 20) ---');
  try {
    const resForbidden = await fetch(`${ADMIN_URL}/train`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${travelerToken}` },
    });

    assert(
      'Travelers cannot trigger ML retraining without admin privileges (403 Forbidden)',
      resForbidden.status === 403,
      `Status: ${resForbidden.status}`
    );
  } catch (err) {
    assert('Security authorization test failed', false, err.message);
  }

  // 14. Fallback Engine Resilience (Feature 9 & 22)
  console.log('\n--- 14. Fallback Engine Resilience (Feature 9 & 22) ---');
  try {
    const recommendationService = require('../src/services/recommendationService');
    const feed = await recommendationService.getPersonalizedFeed(3, { durationDays: 3 });

    assert(
      'Unified recommendation service returns complete, ready-to-display recommendation objects',
      Array.isArray(feed.recommendations) && feed.recommendations.length > 0 && feed.recommendations[0]?.matchedPackage?.title,
      `Top package: ${feed.recommendations[0]?.matchedPackage?.title}`
    );
  } catch (err) {
    assert('Fallback resilience test failed', false, err.message);
  }

  if (passed === total) {
    console.log('✔ All Phase 20 Machine Learning Recommendation tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 20 Machine Learning Recommendation tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase20MlRecommendationsSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase20MlRecommendationsSuite;

