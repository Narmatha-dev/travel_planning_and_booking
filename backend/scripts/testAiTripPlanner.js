const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const aiTripService = require('../src/services/aiTripService');
const tripService = require('../src/services/tripService');

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

async function runAiTripPlannerTests() {
  console.log('=====================================================');
  console.log('  Testing AI-Powered Trip Planner (Phase 6)          ');
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Nature & 3-Day Ooty Plan within Budget
    // -----------------------------------------------------------------
    console.log('--- 1. 3-Day Nature Plan in Ooty (₹12,000 Budget) ---');
    try {
      const ootyPlan = await aiTripService.generateAiItinerary({
        destination: 'Ooty',
        numberOfDays: 3,
        travelers: 2,
        budget: 12000,
        currency: 'INR',
        travelPreference: 'nature',
        selectedTransport: {
          id: 'transport_train',
          type: 'train',
          title: 'Train (Express / Rail)',
          estimated_cost: 450,
          cost_text: '₹450',
          duration_text: '5 hr 20 min',
        },
      });

      assert(Array.isArray(ootyPlan.days) && ootyPlan.days.length === 3, 'Must return 3 full days');
      assert.strictEqual(ootyPlan.budgetStatus, 'within_budget');
      assert(ootyPlan.totalEstimatedCost <= 12000, 'Total estimated cost should be within user budget');
      
      const day1 = ootyPlan.days[0];
      assert(day1.activities.length >= 2, 'Day 1 must contain activities');
      assert(day1.foodSuggestions?.breakfast?.dish, 'Day 1 must have breakfast dish suggestion');
      assert(day1.dailyCostBreakdown?.totalDayCost > 0, 'Day 1 must have daily cost breakdown');

      console.log(`   🤖 Summary: ${ootyPlan.summary}`);
      console.log(`   💰 Budget: ₹${ootyPlan.budget} | Estimated: ₹${ootyPlan.totalEstimatedCost}`);
      console.log(`   🌿 Day 1 Theme: ${day1.theme}`);
      console.log(`   🍽️ Breakfast: ${day1.foodSuggestions.breakfast.spot} (${day1.foodSuggestions.breakfast.dish})`);
      logPass('Ooty 3-day nature itinerary generated with real places and daily budget');
    } catch (err) {
      logFail('Ooty nature plan test failed', err);
    }

    // -----------------------------------------------------------------
    // 2. Historical & 2-Day Mahabalipuram Plan with Real UNESCO Monuments
    // -----------------------------------------------------------------
    console.log('\n--- 2. 2-Day Historical Plan in Mahabalipuram ---');
    try {
      const mahaPlan = await aiTripService.generateAiItinerary({
        destination: 'Mahabalipuram',
        numberOfDays: 2,
        travelers: 2,
        budget: 8000,
        currency: 'INR',
        travelPreference: 'historical',
      });

      const day1 = mahaPlan.days[0];
      const placesNames = day1.activities.map((a) => a.placeName || a.title || a.name);

      assert(placesNames.some((p) => p && (p.includes('Shore') || p.includes('Rathas') || p.includes('Arjuna'))), 'Must include UNESCO monuments');
      assert(mahaPlan.recommendations.length > 0, 'Must include smart recommendations');
      assert(mahaPlan.budgetAdvice.length > 0, 'Must include local budget advice');

      console.log(`   🏛️ Day 1 Places: ${placesNames.join(' ➔ ')}`);
      logPass('Mahabalipuram historical monuments clustered with real UNESCO places');
    } catch (err) {
      logFail('Mahabalipuram historical plan test failed', err);
    }

    // -----------------------------------------------------------------
    // 3. Over-Budget Detection & Actionable Alternatives
    // -----------------------------------------------------------------
    console.log('\n--- 3. Over-Budget Detection & Smart Alternatives ---');
    try {
      const tightBudgetPlan = await aiTripService.generateAiItinerary({
        destination: 'Parisian Elegance',
        numberOfDays: 5,
        travelers: 2,
        budget: 500, // unrealistically low $500 for 5 days in Paris
        currency: 'USD',
        travelPreference: 'comfort',
      });

      assert.strictEqual(tightBudgetPlan.budgetStatus, 'over_budget');
      assert(tightBudgetPlan.overBudgetAlert, 'Must generate clear over-budget alert message');
      assert(Array.isArray(tightBudgetPlan.budgetAlternatives) && tightBudgetPlan.budgetAlternatives.length >= 3, 'Must provide 3+ actionable budget alternative tips');

      console.log(`   ⚠️ Alert: ${tightBudgetPlan.overBudgetAlert}`);
      console.log(`   💡 Alternative 1: ${tightBudgetPlan.budgetAlternatives[0]}`);
      logPass('Over-budget alert and actionable alternatives generated accurately');
    } catch (err) {
      logFail('Budget advisor test failed', err);
    }

    // -----------------------------------------------------------------
    // 4. Persistence & Database Compatibility
    // -----------------------------------------------------------------
    console.log('\n--- 4. Database Creation & Itinerary Items Mapping ---');
    try {
      const mockUserId = 3;
      const preview = await tripService.generatePreviewItinerary({
        destination: 'Goa Coastal Haven',
        numberOfDays: 3,
        budget: 15000,
        currency: 'INR',
        travelPreference: 'beach',
      });

      assert(Array.isArray(preview.itineraryItems) && preview.itineraryItems.length > 0, 'Must produce flat itineraryItems for MySQL table insertion');

      const savedTrip = await tripService.createTrip(mockUserId, {
        destinationId: 101,
        title: 'Goa 3-Day Beach AI Plan',
        tripType: 'beach',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        totalBudget: 15000,
        itineraryItems: preview.itineraryItems,
      });

      assert(savedTrip && savedTrip.id, 'Trip must be saved with generated ID');
      logPass('AI itinerary mapped and saved to MySQL database');
    } catch (err) {
      logFail('Database persistence test failed', err);
    }

    // -----------------------------------------------------------------
    // 5. Input Validation
    // -----------------------------------------------------------------
    console.log('\n--- 5. Input Validation ---');
    try {
      let caught = false;
      try {
        await aiTripService.generateAiItinerary({ destination: '' });
      } catch (e) {
        caught = true;
        assert.strictEqual(e.statusCode, 400);
      }
      assert(caught, 'Must reject missing destination with HTTP 400');
      logPass('Missing destination rejected with HTTP 400');
    } catch (err) {
      logFail('Input validation test failed', err);
    }

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n=====================================================');
    console.log(` AI Trip Planner Test Suite Results: ${passCount}/${passCount + failCount} Passed`);
    console.log('=====================================================\n');

    if (require.main === module) {
      process.exit(failCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('Fatal AI Trip Planner test error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runAiTripPlannerTests();
}

module.exports = { runAiTripPlannerTests };
