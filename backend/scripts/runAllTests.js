const { execSync } = require('child_process');
const path = require('path');

const SCRIPTS = [
  { name: '1. User Authentication & Registration', file: 'testAuth.js' },
  { name: '2. Destination Catalog & Full-Text Search', file: 'testDestinations.js' },
  { name: '3. Trip Planning & Itineraries', file: 'testTrips.js' },
  { name: '4. Travel Packages & Pricing', file: 'testPackages.js' },
  { name: '5. Booking Creation & Lifecycle', file: 'testBookings.js' },
  { name: '6. Payment Processing & PCI Security', file: 'testPayments.js' },
  { name: '7. Reviews & Star Ratings Aggregates', file: 'testReviews.js' },
  { name: '8. AI Multi-Factor Recommendations', file: 'testRecommendations.js' },
  { name: '9. AI Smart Day-by-Day Itinerary', file: 'testAiItinerary.js' },
  { name: '10. AI Travel Chatbot & Guardrails', file: 'testChatbot.js' },
  { name: '11. Admin Dashboard & RBAC Guards', file: 'testAdmin.js' },
];

function runAllTests() {
  console.log('\n================================================================');
  console.log('  🚀 TRAVELORA FULL END-TO-END REGRESSION & SECURITY TEST SUITE ');
  console.log('================================================================\n');

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
    console.log('🌟 ALL 11 TEST SUITES PASSED! System is 100% stable, secure & production-ready.\n');
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
