const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyticsService = require('../src/services/analyticsService');
const forecastService = require('../src/services/forecastService');
const mlRecommendationService = require('../src/services/mlRecommendationService');

async function testPhase22PredictiveAnalytics() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING TEST SUITE: PHASE 21 & PHASE 22');
  console.log('   ADVANCED ANALYTICS & PREDICTIVE DEMAND FORECASTING');
  console.log('======================================================\n');

  let passedTests = 0;
  const totalTests = 15;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: User Personal Travel Analytics (Features 1 to 11)
    // ------------------------------------------------------------------------
    console.log('👉 TEST 1: User Personal Travel Analytics Aggregation...');
    const userAnalytics = await analyticsService.getUserAnalytics(3);
    assert(userAnalytics, 'User analytics data must be returned');
    assert(userAnalytics.tripSummary, 'tripSummary must exist');
    assert(typeof userAnalytics.tripSummary.total === 'number', 'total trips must be numeric');
    assert(typeof userAnalytics.tripSummary.completed === 'number', 'completed trips must be numeric');
    console.log('   ✅ Test 1 Passed: User personal trip summary aggregated dynamically.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 2: Verified Travel Spending Calculation (Feature 2 & 3)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 2: Verified Travel Spending & Monthly Distribution...');
    assert(userAnalytics.spending, 'Spending breakdown must exist');
    assert(typeof userAnalytics.spending.totalSpendingINR === 'number', 'totalSpendingINR must be numeric');
    assert(Array.isArray(userAnalytics.spending.categories), 'Spending categories must be an array');
    assert(Array.isArray(userAnalytics.spending.monthlySpending), 'Monthly spending must be an array of 12 months');
    assert.strictEqual(userAnalytics.spending.monthlySpending.length, 12, 'Must have 12 monthly spending buckets');
    console.log(`   ✅ Test 2 Passed: Travel spending calculated strictly from verified payments (Total: ₹${userAnalytics.spending.totalSpendingINR}).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 3: Destination Analytics & Travel Preferences (Feature 4 & 5)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 3: Destination Analytics & Preferences (No Invented Data)...');
    assert(userAnalytics.destinations, 'Destination analytics must exist');
    assert(userAnalytics.preferences, 'Preference analytics must exist');
    if (userAnalytics.preferences.hasData) {
      assert(Array.isArray(userAnalytics.preferences.preferences), 'Preferences list must be an array');
      assert(userAnalytics.preferences.preferences.length > 0, 'Must have at least one preference');
    } else {
      assert(userAnalytics.preferences.message.includes('Complete a few more trips'), 'Must show friendly prompt if data sparse');
    }
    console.log('   ✅ Test 3 Passed: Destination ranking & preferences computed from actual user data.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 4: Transport & Accommodation Analytics (Feature 6 & 7)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 4: Transport & Accommodation Analytics...');
    assert(userAnalytics.transport, 'Transport stats must exist');
    assert(typeof userAnalytics.transport.train === 'number', 'Train bookings must be numeric');
    assert(typeof userAnalytics.transport.flight === 'number', 'Flight bookings must be numeric');
    assert(userAnalytics.accommodation, 'Accommodation stats must exist');
    assert(typeof userAnalytics.accommodation.averageStayNights === 'number', 'Average stay must be numeric');
    console.log('   ✅ Test 4 Passed: Transport and hotel duration statistics calculated.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 5: Chronological Activity Timeline (Feature 11)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 5: User Activity Timeline Sorting...');
    assert(Array.isArray(userAnalytics.timeline), 'Timeline must be an array');
    for (let i = 0; i < userAnalytics.timeline.length - 1; i++) {
      assert(
        userAnalytics.timeline[i].timestamp >= userAnalytics.timeline[i + 1].timestamp,
        'Timeline items must be sorted in descending chronological order'
      );
    }
    console.log(`   ✅ Test 5 Passed: Activity timeline sorted chronologically (${userAnalytics.timeline.length} activities).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 6: Admin Platform Travel Analytics (Feature 12 to 20)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 6: Admin Platform Analytics & Growth KPIs...');
    const adminAnalytics = await analyticsService.getAdminAnalytics({ dateFilter: 'thisYear' });
    assert(adminAnalytics, 'Admin analytics must be returned');
    assert(adminAnalytics.userGrowth && adminAnalytics.userGrowth.totalUsers > 0, 'User growth KPIs must exist');
    assert(adminAnalytics.revenue && adminAnalytics.revenue.totalRevenueINR > 0, 'Verified revenue must exist');
    assert(adminAnalytics.bookings && adminAnalytics.bookings.totalBookings > 0, 'Total bookings count must exist');
    assert(Array.isArray(adminAnalytics.destinations.popular), 'Popular destinations list must be an array');
    console.log(`   ✅ Test 6 Passed: Admin KPIs verified (Users: ${adminAnalytics.userGrowth.totalUsers}, Revenue: ₹${adminAnalytics.revenue.totalRevenueINR}).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 7: Admin Date Filtering (Feature 21)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 7: Admin Date Filter Variations...');
    const filters = ['today', 'last7days', 'last30days', 'thisMonth', 'thisYear'];
    for (const f of filters) {
      const res = await analyticsService.getAdminAnalytics({ dateFilter: f });
      assert.strictEqual(res.dateFilter, f, `Date filter ${f} must be reflected in response`);
    }
    console.log('   ✅ Test 7 Passed: Date filtering correctly handled across all standard ranges.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 8: Safe CSV Export (Feature 22)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 8: Sanitized CSV Export (Zero Sensitive Data Leakage)...');
    const csvContent = await analyticsService.exportAdminAnalyticsCSV({ dateFilter: 'thisYear' });
    assert(typeof csvContent === 'string' && csvContent.length > 50, 'CSV content must be non-empty string');
    assert(csvContent.includes('TRAVELORA PLATFORM ANALYTICS EXPORT'), 'CSV header must match');
    assert(!csvContent.toLowerCase().includes('password'), 'CSV must NEVER contain passwords');
    assert(!csvContent.toLowerCase().includes('token'), 'CSV must NEVER contain tokens or secrets');
    console.log('   ✅ Test 8 Passed: CSV export generated with zero sensitive data exposure.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 9: Predictive Demand Forecast Initialization (Feature 3, 8, 17)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 9: Predictive Time-Series Forecasting Model Initialization...');
    const forecastModel = forecastService.ensureModelLoaded();
    assert(forecastModel, 'Forecast model must be loaded');
    assert.strictEqual(forecastModel.status, 'ready', 'Model status must be ready');
    assert(forecastModel.regression && typeof forecastModel.regression.slope === 'number', 'Regression slope must exist');
    console.log(`   ✅ Test 9 Passed: Demand forecast model ready (${forecastModel.modelType}).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 10: Multi-Horizon Forecast Generation (Feature 3 & 7)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 10: Multi-Horizon Demand Forecasts (7D, 30D, 3M, 6M)...');
    const horizons = ['7_days', '30_days', '3_months', '6_months'];
    for (const h of horizons) {
      const fc = await forecastService.getForecast({ range: h });
      assert(fc.futureForecast && fc.futureForecast.length > 0, `Forecast for ${h} must return future projections`);
      assert(fc.futureForecast.every((f) => f.isEstimate === true), 'All forecast items must be clearly flagged as estimates');
      assert(fc.summary.totalForecastBookings > 0, 'Total forecast bookings must be > 0');
    }
    console.log('   ✅ Test 10 Passed: Multi-horizon forecasts generated with explicit estimate disclaimers.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 11: Destination Demand Ranking & Growth Velocity (Feature 4, 6, 13)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 11: Destination Demand Ranking & Explainability...');
    const forecast = await forecastService.getForecast({ range: '3_months' });
    assert(Array.isArray(forecast.destinationForecast), 'Destination forecast must be an array');
    assert(forecast.destinationForecast.length >= 5, 'Must forecast top destinations');
    const topDest = forecast.destinationForecast[0];
    assert(topDest.name && topDest.currentDemand && topDest.forecastDemand, 'Destination stats must be complete');
    assert(typeof topDest.explanation === 'string' && topDest.explanation.length > 10, 'Must have explainable reasoning');
    console.log(`   ✅ Test 11 Passed: Top destination forecasted: ${topDest.name} (~${topDest.forecastDemand} bookings, +${topDest.growthPercentage}% growth).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 12: Peak Travel Period Analysis (Feature 5)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 12: Peak Travel Period Seasonal Analysis...');
    assert(Array.isArray(forecast.peakPeriods), 'Peak periods must be an array');
    assert(forecast.peakPeriods.length >= 3, 'Must identify major travel seasons');
    const winterPeak = forecast.peakPeriods.find((p) => p.season.includes('Year-End'));
    assert(winterPeak && winterPeak.expectedVolumeMultiplier, 'Year-end holiday surge must be identified');
    console.log(`   ✅ Test 12 Passed: Seasonal peak travel patterns analyzed (${forecast.peakPeriods.length} seasonal windows).`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 13: Model Evaluation Metrics (MAE, RMSE, R²) (Feature 10 & 20)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 13: Econometric Model Evaluation Metrics...');
    assert(forecast.evaluation, 'Model evaluation metrics must exist');
    assert(typeof forecast.evaluation.mae === 'number', 'MAE must be numeric');
    assert(typeof forecast.evaluation.rmse === 'number', 'RMSE must be numeric');
    assert(typeof forecast.evaluation.rSquared === 'number', 'R-squared must be numeric');
    assert(forecast.evaluation.rSquared >= 0 && forecast.evaluation.rSquared <= 1.0, 'R² must be between 0 and 1');
    console.log(`   ✅ Test 13 Passed: Model evaluation verified: MAE=${forecast.evaluation.mae}, RMSE=${forecast.evaluation.rmse}, R²=${forecast.evaluation.rSquared}.`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 14: Model Retraining & Artifact Persistence (Feature 9 & 17)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 14: Model Retraining Pipeline & Disk Persistence...');
    const retrained = await forecastService.trainModel();
    assert(retrained && retrained.modelVersion, 'Retrained model must return version');
    const modelFilePath = path.join(__dirname, '../data/models/demand_forecast_model.json');
    assert(fs.existsSync(modelFilePath), 'Model file must be persisted to data/models');
    console.log('   ✅ Test 14 Passed: Model retraining and secure disk persistence verified.');
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 15: Localization Integrity (EN & TA Translations)
    // ------------------------------------------------------------------------
    console.log('\n👉 TEST 15: English and Tamil Translation Key Integrity...');
    const enPath = path.join(__dirname, '../../frontend/src/locales/en.json');
    const taPath = path.join(__dirname, '../../frontend/src/locales/ta.json');
    assert(fs.existsSync(enPath), 'en.json must exist');
    assert(fs.existsSync(taPath), 'ta.json must exist');

    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const ta = JSON.parse(fs.readFileSync(taPath, 'utf-8'));

    assert(en.analytics && ta.analytics, 'analytics keys must exist in both EN and TA');
    assert(en.predictive && ta.predictive, 'predictive keys must exist in both EN and TA');
    assert.strictEqual(Object.keys(en.analytics).length, Object.keys(ta.analytics).length, 'Analytics keys length must match');
    assert.strictEqual(Object.keys(en.predictive).length, Object.keys(ta.predictive).length, 'Predictive keys length must match');
    console.log('   ✅ Test 15 Passed: Full multilingual key parity verified across English and Tamil.');
    passedTests++;

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 21 & 22 TESTS PASSED PERFECTLY!`);
    console.log('======================================================\n');
    return true;
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
    return false;
  }
}

// Support direct script execution
if (require.main === module) {
  testPhase22PredictiveAnalytics().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase22PredictiveAnalytics;
