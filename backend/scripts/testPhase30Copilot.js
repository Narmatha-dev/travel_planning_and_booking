/**
 * Phase 30: Final AI Travel Copilot Automated Test Suite
 */
const assert = require('assert');
const copilotService = require('../src/services/copilotService');

async function runTests() {
  console.log('\n================================================================');
  console.log('  🤖 PHASE 30: FINAL AI TRAVEL COPILOT TEST SUITE ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. 12-Facet Copilot Summary Compilation
  await test('1. 12-Facet Copilot Summary Compilation across All Travel Dimensions', async () => {
    const summary = await copilotService.getTripCopilotSummary(1, 3);
    assert(summary, 'Summary object must be returned');
    assert(summary.destination, 'Must contain destination name');
    assert(summary.facets, 'Must contain 12-facets object');

    const f = summary.facets;
    assert(f.location, 'Must contain location facet');
    assert(f.destination, 'Must contain destination facet');
    assert(f.weather, 'Must contain weather facet');
    assert(f.hotel, 'Must contain hotel facet');
    assert(f.transport, 'Must contain transport facet');
    assert(f.budget, 'Must contain budget facet');
    assert(f.itinerary, 'Must contain itinerary facet');
    assert(f.packing, 'Must contain packing facet');
    assert(f.checklist, 'Must contain checklist facet');
    assert(f.safety, 'Must contain safety facet');
    assert(f.offline, 'Must contain offline facet');

    console.log(`     [12-Facet Verification]: Destination: ${summary.destination} | Weather: ${f.weather.condition} (${f.weather.temp}°C) | Hotel: ${f.hotel.name} | Transport: ${f.transport.title}`);
  });

  // 2. Trip Readiness Score & Status Matrix
  await test('2. Unified Trip Readiness Score & Status Matrix Calculation', async () => {
    const summary = await copilotService.getTripCopilotSummary(1, 3);
    assert(typeof summary.overallReadinessScore === 'number', 'Readiness score must be a number');
    assert(summary.overallReadinessScore >= 0 && summary.overallReadinessScore <= 100, 'Score must be between 0 and 100');
    assert(summary.readinessStatus, 'Readiness status text must be present');
    assert(summary.readinessMatrix, 'Readiness matrix must be present');

    const m = summary.readinessMatrix;
    assert('itinerary' in m, 'Matrix must track itinerary');
    assert('hotel' in m, 'Matrix must track hotel');
    assert('transport' in m, 'Matrix must track transport');
    assert('packing' in m, 'Matrix must track packing');
    assert('checklist' in m, 'Matrix must track checklist');
    assert('weather' in m, 'Matrix must track weather');
    assert('safety' in m, 'Matrix must track safety');

    console.log(`     [Readiness Matrix]: Score: ${summary.overallReadinessScore}% (${summary.readinessStatus}) | Itinerary: ${m.itinerary ? '✅' : '⏳'} | Stay: ${m.hotel ? '✅' : '⏳'} | Weather: ${m.weather ? '✅' : '⏳'}`);
  });

  // 3. Natural Language Trip Querying (English)
  await test('3. Natural Language Travel Queries (Weather, Packing, Budget, Checklist)', async () => {
    const resWeather = await copilotService.processCopilotQuery({
      message: 'What is the weather in Ooty?',
      tripId: 1,
      userId: 3,
      language: 'en',
    });
    assert(resWeather.reply, 'Should have reply');
    assert(resWeather.reply.toLowerCase().includes('weather') || resWeather.reply.toLowerCase().includes('temperature') || resWeather.reply.toLowerCase().includes('ooty'));

    const resPacking = await copilotService.processCopilotQuery({
      message: 'What should I pack for my trip?',
      tripId: 1,
      userId: 3,
      language: 'en',
    });
    assert(resPacking.reply.toLowerCase().includes('pack') || resPacking.reply.toLowerCase().includes('clothing'));
    assert(Array.isArray(resPacking.actionCards), 'Should return action cards');
  });

  // 4. Multilingual Processing (Tamil)
  await test('4. Multilingual Copilot Processing in தமிழ் (Tamil)', async () => {
    const resTa = await copilotService.processCopilotQuery({
      message: 'ஊட்டி பயணத்திற்கு என்ன பேக்கிங் செய்ய வேண்டும்?',
      tripId: 1,
      userId: 3,
      language: 'ta',
    });
    assert(resTa.reply, 'Should return Tamil reply');
    assert(resTa.reply.includes('பேக்கிங்') || resTa.reply.includes('ஆடைகள்') || resTa.reply.includes('பட்டியல்'), 'Reply should be in Tamil');
  });

  // 5. Sensitive Action Confirmation Guard
  await test('5. Sensitive Action Confirmation Guard (Booking / Payment prompts)', async () => {
    const resBook = await copilotService.processCopilotQuery({
      message: 'Please book now and confirm my hotel stay',
      tripId: 1,
      userId: 3,
      language: 'en',
    });
    assert.strictEqual(resBook.confirmationRequired, true, 'Booking intent must require confirmation');
    assert.strictEqual(resBook.confirmationType, 'booking_confirmation');

    const resPay = await copilotService.processCopilotQuery({
      message: 'Pay now for my trip using credit card',
      tripId: 1,
      userId: 3,
      language: 'en',
    });
    assert.strictEqual(resPay.confirmationRequired, true, 'Payment intent must require confirmation');
    assert.strictEqual(resPay.confirmationType, 'payment_confirmation');
    console.log('     [Security Guard]: Booking and payment actions flagged for user confirmation');
  });

  console.log('\n================================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
