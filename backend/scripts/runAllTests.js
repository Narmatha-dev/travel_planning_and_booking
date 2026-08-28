const { execSync } = require('child_process');
const path = require('path');

const SCRIPTS = [
  { name: '1. User Authentication & Registration', file: 'testAuth.js' },
  { name: '2. Google OAuth 2.0 Security Flow', file: 'testGoogleAuth.js' },
  { name: '3. GPS Location & Reverse Geocoding', file: 'testLocation.js' },
  { name: '4. Real Nearby Places & Images', file: 'testPlaces.js' },
  { name: '5. Google Maps Route & Directions', file: 'testMapsRoute.js' },
  { name: '6. Transport Options & Fare Comparison', file: 'testTransport.js' },
  { name: '7. Hotel & Stay Recommendations', file: 'testHotels.js' },
  { name: '8. AI Trip Planner & Smart Recommendations', file: 'testAiTripPlanner.js' },
  { name: '9. Destination Catalog & Full-Text Search', file: 'testDestinations.js' },
  { name: '10. Trip Planning & Itineraries', file: 'testTrips.js' },
  { name: '11. Travel Packages & Pricing', file: 'testPackages.js' },
  { name: '12. Booking Creation & Lifecycle', file: 'testBookings.js' },
  { name: '13. Payment Processing & PCI Security', file: 'testPayments.js' },
  { name: '14. Reviews & Star Ratings Aggregates', file: 'testReviews.js' },
  { name: '15. AI Multi-Factor Recommendations', file: 'testRecommendations.js' },
  { name: '16. AI Smart Day-by-Day Itinerary', file: 'testAiItinerary.js' },
  { name: '17. AI Travel Chatbot & Guardrails', file: 'testChatbot.js' },
  { name: '18. Admin Dashboard & RBAC Guards', file: 'testAdmin.js' },
  { name: '19. Phase 8 Booking Lifecycle & Confirmation', file: 'testPhase8Booking.js' },
  { name: '20. Phase 9 Payment Flow & Digital Receipt', file: 'testPhase9Payment.js' },
  { name: '21. Phase 10 Notifications & Trip Reminders', file: 'testPhase10Notifications.js' },
  { name: '22. Phase 11 Reviews, Ratings & Trip Feedback', file: 'testPhase11Reviews.js' },
  { name: '23. Phase 12 Admin Workspace & Business Analytics', file: 'testPhase12Admin.js' },
  { name: '24. Phase 13 Favorites, Wishlist & Saved Places', file: 'testPhase13Favorites.js' },
  { name: '25. Phase 14 AI Travel Assistant & Chatbot', file: 'testPhase14Chatbot.js' },
  { name: '26. Phase 15 Shareable Trip Plans & Social Sharing', file: 'testPhase15Sharing.js' },
  { name: '27. Phase 16 Travel Rewards & Points System', file: 'testPhase16Rewards.js' },
  { name: '28. Phase 17 Multilingual UI & Tamil AI Assistant', file: 'testPhase17Multilingual.js' },
  { name: '29. Phase 18 Voice Travel Assistant (Speech Recognition & TTS)', file: 'testPhase18VoiceAssistant.js' },
  { name: '30. Phase 19 Smart Personalized Recommendation Engine', file: 'testPhase19Recommendations.js' },
  { name: '31. Phase 20 Machine Learning Recommendation System', file: 'testPhase20MlRecommendations.js' },
  { name: '32. Phase 21 & 22 Advanced Travel Analytics & Predictive Forecasting', file: 'testPhase22PredictiveAnalytics.js' },
  { name: '33. Phase 25 Travel Safety & Emergency Assistant', file: 'testPhase25Safety.js' },
  { name: '34. Phase 26 Weather-Based Smart Travel Planner', file: 'testPhase26Weather.js' },
  { name: '35. Phase 27 Smart Packing Assistant', file: 'testPhase27Packing.js' },
  { name: '36. Phase 28 Travel Document & Pre-Trip Checklist Manager', file: 'testPhase28Checklist.js' },
  { name: '37. Phase 29 Offline Trip Mode & Storage Engine', file: 'testPhase29Offline.js' },
  { name: '38. Phase 30 Final AI Travel Copilot Command Center', file: 'testPhase30Copilot.js' },
  { name: '39. Pan-India Discovery & Route Upgrade', file: 'testIndiaUpgrade.js' },
  { name: '40. Worldwide Global Destinations & Wikimedia Legal Photography', file: 'testGlobalDestinations.js' },
  { name: '41. Google Places API (New) & Dynamic Worldwide Search', file: 'testDynamicPlaceSearch.js' },
  { name: '42. Accurate Distance, Transparent Cost, Search & Image Authenticity', file: 'testAccurateDistanceAndCost.js' },
];

const { fork } = require('child_process');

async function ensureServerRunning() {
  try {
    const res = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1000) });
    if (res.ok) return null;
  } catch {}

  // Spawn background server
  const serverProc = fork(path.join(__dirname, '../src/server.js'), {
    stdio: 'ignore',
    env: { ...process.env, PORT: '5000' },
  });

  // Wait up to 5s for server to start
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        return serverProc;
      }
    } catch {}
  }
  return serverProc;
}

async function runAllTests() {
  console.log('\n================================================================');
  console.log('  🚀 TRAVELORA FULL END-TO-END REGRESSION & SECURITY TEST SUITE ');
  console.log('================================================================\n');

  const serverProc = await ensureServerRunning();

  const startTime = Date.now();
  const results = [];
  const scriptsDir = __dirname;

  for (const item of SCRIPTS) {
    const scriptPath = path.join(scriptsDir, item.file);
    try {
      console.log(`\n▶ Running: ${item.name} (${item.file})...`);
      const output = execSync(`node "${scriptPath}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      console.log(output.trim());
      results.push({ name: item.name, file: item.file, passed: true });
    } catch (err) {
      if (err.stdout) console.log(err.stdout.toString().trim());
      if (err.stderr) console.error(err.stderr.toString().trim());
      results.push({ name: item.name, file: item.file, passed: false });
    }
  }

  if (serverProc) {
    serverProc.kill();
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = results.filter((r) => r.passed).length;
  const totalSuites = results.length;

  console.log('\n================================================================');
  console.log('  📊 FINAL SYSTEM TEST MATRIX & VERIFICATION REPORT             ');
  console.log('================================================================');

  results.forEach((r) => {
    const icon = r.passed ? '✔ [PASS]' : '❌ [FAIL]';
    console.log(`  ${icon}  ${r.name}`);
  });

  console.log('----------------------------------------------------------------');
  console.log(`  Total Test Suites: ${totalPassed}/${totalSuites} Passed in ${durationSec}s`);
  console.log('================================================================\n');

  if (totalPassed === totalSuites) {
    console.log(`🌟 ALL ${totalSuites} TEST SUITES PASSED! System is 100% stable, secure & production-ready.\n`);
    process.exitCode = 0;
    return true;
  } else {
    console.error('⚠️ Some test suites failed.\n');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
