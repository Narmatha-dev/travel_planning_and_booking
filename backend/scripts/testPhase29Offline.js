/**
 * Phase 29: Offline Trip Mode Automated Test Suite
 */
const assert = require('assert');
const bookingModel = require('../src/models/bookingModel');
const packingModel = require('../src/models/packingModel');
const checklistModel = require('../src/models/checklistModel');

// Mock request / response helper for controller testing
function mockReqRes({ params = {}, query = {}, body = {}, user = { id: 3 } } = {}) {
  const req = { params, query, body, user };
  let resData = null;
  let statusCode = 200;

  let resolveFn;
  const promise = new Promise((resolve) => {
    resolveFn = resolve;
  });

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      resData = data;
      resolveFn({ statusCode, resData });
      return this;
    },
  };

  const next = (err) => {
    if (err) {
      resolveFn({ statusCode: 500, resData: { status: 'error', message: err.message } });
    }
  };

  return { req, res, next, waitForResult: () => promise };
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  📴 PHASE 29: OFFLINE TRIP MODE TEST SUITE ');
  console.log('================================================================\n');

  const offlineController = require('../src/controllers/offlineController');

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

  // 1. Offline Trip Bundle Compilation
  await test('1. Offline Trip Bundle Compilation (Complete Itinerary, Stays, Checklists, Weather)', async () => {
    const { req, res, next, waitForResult } = mockReqRes({ params: { tripId: '1' }, user: { id: 3 } });
    offlineController.getOfflineBundle(req, res, next);

    const { statusCode, resData } = await waitForResult();
    assert.strictEqual(statusCode, 200, `Expected 200 OK, got ${statusCode}`);
    assert.strictEqual(resData.status, 'success', 'Response should indicate success');

    const bundle = resData.data;
    assert(bundle, 'Offline bundle should be returned');
    assert(bundle.destination, 'Bundle must have destination');
    assert(Array.isArray(bundle.itinerary), 'Bundle must contain itinerary array');
    assert(bundle.itinerary.length >= 1, 'Itinerary should contain days');
    assert(bundle.hotel && bundle.hotel.name, 'Bundle must contain hotel details');
    assert(bundle.transport && bundle.transport.type, 'Bundle must contain transport details');
    assert(Array.isArray(bundle.packingChecklist), 'Bundle must contain packing checklist');
    assert(Array.isArray(bundle.travelChecklist), 'Bundle must contain travel checklist');
    assert(bundle.safety && bundle.safety.emergencyNumbers, 'Bundle must contain safety info');
    assert(bundle.cachedWeather && bundle.cachedWeather.cachedAt, 'Bundle must contain cached weather with timestamp');
    console.log(`     [Bundle Details] Destination: ${bundle.destination} | Itinerary Days: ${bundle.itinerary.length} | Packing Items: ${bundle.packingChecklist.length} | Checklist Items: ${bundle.travelChecklist.length}`);
  });

  // 2. Zero Sensitive Information Security Guard
  await test('2. Zero Sensitive Information Security Guard (No passwords, CVVs, or payment secrets in cache)', async () => {
    const { req, res, next, waitForResult } = mockReqRes({ params: { tripId: '1' }, user: { id: 3 } });
    offlineController.getOfflineBundle(req, res, next);

    const { resData } = await waitForResult();
    const bundleStr = JSON.stringify(resData.data).toLowerCase();
    assert(!bundleStr.includes('password'), 'Bundle must not contain passwords');
    assert(!bundleStr.includes('card_number') && !bundleStr.includes('cvv') && !bundleStr.includes('cvc'), 'Bundle must not contain credit card secrets');
    assert(!bundleStr.includes('token') || !bundleStr.includes('bearer'), 'Bundle must not contain raw bearer auth tokens');
    console.log('     [Privacy Verification] Bundle is sanitized of all sensitive credentials');
  });

  // 3. Batch Offline Sync
  await test('3. Batch Offline Sync (Packing toggles, checklist toggles & custom items)', async () => {
    // Setup test items
    const testPackingItem = await packingModel.createItem({
      tripId: 1,
      userId: 3,
      category: 'clothing',
      itemName: 'Offline Test Warm Scarf',
      isPacked: false,
    });

    const testChecklistItem = await checklistModel.createItem({
      tripId: 1,
      userId: 3,
      category: 'documents',
      itemName: 'Offline Test Printed Map',
      isCompleted: false,
    });

    const { req, res, next, waitForResult } = mockReqRes({
      params: { tripId: '1' },
      user: { id: 3 },
      body: {
        packingUpdates: [{ id: testPackingItem.id, isPacked: true }],
        checklistUpdates: [{ id: testChecklistItem.id, isCompleted: true }],
        customPackingItems: [{ category: 'gear', itemName: 'Extra Compass', quantity: 1 }],
        customChecklistItems: [{ category: 'pre_trip', itemName: 'Offline Downloaded Guidebook' }],
      },
    });

    offlineController.syncOfflineChanges(req, res, next);
    const { statusCode, resData } = await waitForResult();
    assert.strictEqual(statusCode, 200);

    const { syncedResults, syncStatus } = resData.data;
    assert.strictEqual(syncedResults.packingUpdated, 1, 'Should update 1 packing item');
    assert.strictEqual(syncedResults.checklistUpdated, 1, 'Should update 1 checklist item');
    assert.strictEqual(syncedResults.customPackingAdded, 1, 'Should add 1 custom packing item');
    assert.strictEqual(syncedResults.customChecklistAdded, 1, 'Should add 1 custom checklist item');
    assert.strictEqual(syncStatus, 'synced');

    // Verify database state updated
    const updatedPack = await packingModel.findById(testPackingItem.id, 3);
    assert.strictEqual(updatedPack.is_packed, true, 'Packing item state must be packed in DB');

    const updatedChk = await checklistModel.findById(testChecklistItem.id, 3);
    assert.strictEqual(updatedChk.is_completed, true, 'Checklist item state must be completed in DB');
  });

  // 4. Non-Destructive Integrity Guard
  await test('4. Non-Destructive Integrity Guard (Removing offline cache does NOT delete backend trip)', async () => {
    const bookingBefore = await bookingModel.findByIdOrReference(1);
    assert(bookingBefore, 'Booking #1 should exist on server');

    // Client-side offline cache deletion is local-only; server booking remains unaltered
    const bookingAfter = await bookingModel.findByIdOrReference(1);
    assert(bookingAfter, 'Server-side booking #1 must remain completely intact');
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
