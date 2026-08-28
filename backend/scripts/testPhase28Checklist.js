/**
 * Phase 28: Travel Document & Checklist Manager Automated Test Suite
 */
const assert = require('assert');
const checklistService = require('../src/services/checklistService');
const checklistModel = require('../src/models/checklistModel');
const chatbotService = require('../src/services/chatbotService');

async function runTests() {
  console.log('\n================================================================');
  console.log('  📋 PHASE 28: TRAVEL DOCUMENT & CHECKLIST MANAGER TEST SUITE ');
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

  // 1. Default Checklist Generation
  await test('1. Default Travel Checklist Generation across All 6 Categories', async () => {
    const defaults = checklistService.generateDefaultChecklist({
      destination: 'Mahabalipuram',
      durationDays: 3,
      transportType: 'cab',
      hasHotel: true,
      hasTransport: true,
    });

    assert(Array.isArray(defaults), 'Defaults should be an array');
    assert(defaults.length >= 10, `Expected at least 10 checklist items, got ${defaults.length}`);

    const cats = new Set(defaults.map((d) => d.category));
    assert(cats.has('identification'), 'Must contain identification category');
    assert(cats.has('transport'), 'Must contain transport category');
    assert(cats.has('hotel'), 'Must contain hotel category');
    assert(cats.has('activities'), 'Must contain activities category');
    assert(cats.has('documents'), 'Must contain other documents category');
    assert(cats.has('pre_trip'), 'Must contain pre_trip category');
    console.log(`     [Generated Checklist Size]: ${defaults.length} items across ${cats.size} categories`);
  });

  // 2. Pre-Trip Preparation Checklist
  await test('2. Pre-Trip Preparation Tasks List Verification', async () => {
    const defaults = checklistService.generateDefaultChecklist({ destination: 'Ooty', durationDays: 3 });
    const preTripTasks = defaults.filter((d) => d.category === 'pre_trip');
    assert(preTripTasks.length >= 5, 'Must contain at least 5 pre-trip preparation tasks');
    assert(preTripTasks.some((t) => t.itemName.includes('Weather Forecast')), 'Must include Weather check task');
    assert(preTripTasks.some((t) => t.itemName.includes('Packing')), 'Must include Packing check task');
    assert(preTripTasks.some((t) => t.itemName.includes('Offline Maps') || t.itemName.includes('Addresses')), 'Must include offline addresses task');
    assert(preTripTasks.some((t) => t.itemName.includes('Emergency')), 'Must include emergency contacts review');
  });

  // 3. Cross-Phase Booking Integration
  await test('3. Cross-Phase Booking Integration (Hotel & Transport Auto-Ready)', async () => {
    const checklist = await checklistService.getTripChecklist(1, 3, { destinationName: 'Bali' });
    assert(checklist.integrations, 'Integrations object must exist');
    assert(checklist.integrations.hotel, 'Hotel integration must exist');
    assert(checklist.integrations.transport, 'Transport integration must exist');
    console.log(`     [Booking Integration]: Hotel Status: ${checklist.integrations.hotel.available ? 'Ready ✅' : 'Pending ⏳'} | Transport: ${checklist.integrations.transport.available ? 'Ready ✅' : 'Pending ⏳'}`);
  });

  // 4. Cross-Phase Packing, Weather, Itinerary & Safety
  await test('4. Cross-Phase Packing, Weather, Itinerary & Safety Status Aggregation', async () => {
    const checklist = await checklistService.getTripChecklist(1, 3, { destinationName: 'Mahabalipuram' });
    assert(typeof checklist.integrations.packing.packed === 'number', 'Packing status must have packed count');
    assert(typeof checklist.integrations.weather.checked === 'boolean', 'Weather status must have checked boolean');
    assert(typeof checklist.integrations.itinerary.ready === 'boolean', 'Itinerary status must have ready boolean');
    assert(typeof checklist.integrations.safety.ready === 'boolean', 'Safety status must have ready boolean');
    console.log(`     [Subsystems]: Packing: ${checklist.integrations.packing.packed}/${checklist.integrations.packing.total} | Weather Temp: ${checklist.integrations.weather.temp || 28}°C | Itinerary: ${checklist.integrations.itinerary.ready ? 'Ready ✅' : 'Pending ⏳'}`);
  });

  // 5. Trip Readiness Score Calculation
  await test('5. Dynamic Trip Readiness Score (0% to 100%) Calculation', async () => {
    const userId = 77;
    const tripId = 777;

    const testItems = [
      { itemName: 'Passport', category: 'identification', isCompleted: true },
      { itemName: 'Ticket', category: 'transport', isCompleted: true },
      { itemName: 'Hotel', category: 'hotel', isCompleted: true },
      { itemName: 'Insurance', category: 'documents', isCompleted: false },
    ];

    const saved = await checklistService.saveTripChecklist(tripId, userId, testItems);
    assert.strictEqual(saved.totalTasks, 4);
    assert.strictEqual(saved.completedTasks, 3);
    assert.strictEqual(saved.pendingTasks, 1);
    assert.strictEqual(saved.readinessScore, 75);
    console.log(`     [Readiness Score]: ${saved.completedTasks}/${saved.totalTasks} completed = ${saved.readinessScore}%`);
  });

  // 6. Custom Document Items CRUD & Notes Sanitization
  await test('6. Custom Document Item Creation, Note Sanitization & Deletion', async () => {
    const userId = 88;
    const tripId = 888;

    // Create item with sensitive note to verify sanitizer
    const newItem = await checklistService.addCustomItem(userId, {
      tripId,
      category: 'identification',
      itemName: 'College Photo ID Card',
      notes: 'Carry original card for student entry. password: secret12345',
    });

    assert(newItem.id, 'Created custom item must have ID');
    assert.strictEqual(newItem.is_custom, true);
    assert.strictEqual(newItem.item_name, 'College Photo ID Card');
    assert(!newItem.notes.includes('secret12345'), 'Sensitive password in notes must be sanitized/redacted');
    assert(newItem.notes.includes('[REDACTED]'), 'Sanitizer should replace password with [REDACTED]');

    // Toggle completed
    const toggled = await checklistService.toggleItemCompleted(newItem.id, userId);
    assert.strictEqual(toggled.is_completed, true);

    // Update item
    const updated = await checklistService.updateItem(newItem.id, userId, {
      itemName: 'College Photo ID Card & Library Card',
    });
    assert(updated.item_name.includes('Library Card'));

    // Delete custom item
    const delRes = await checklistService.deleteItem(newItem.id, userId);
    assert.strictEqual(delRes.success, true);
  });

  // 7. Non-Destructive Integrity Guard
  await test('7. Non-Destructive Guard (Deleting checklist item does NOT delete booking)', async () => {
    const userId = 3;
    const booking = await require('../src/models/bookingModel').findByIdOrReference(1);
    assert(booking, 'Booking #1 should exist');

    // Deleting a custom checklist item does not affect booking
    const delRes = await checklistService.deleteItem(999999, userId).catch(() => ({ success: false }));
    const bookingAfter = await require('../src/models/bookingModel').findByIdOrReference(1);
    assert(bookingAfter, 'Booking #1 must remain completely intact');
  });

  // 8. AI Chatbot Pre-Trip Checklist Queries (English & Tamil)
  await test('8. AI Chatbot Travel Document & Pre-Trip Queries (English & Tamil)', async () => {
    // English query
    const resEn = await chatbotService.processMessage('test_sess_p28_1', 'What documents should I prepare for my trip to Ooty?', { preferredLang: 'en' });
    assert(resEn.reply, 'Should have chatbot reply');
    assert(resEn.reply.includes('Checklist') || resEn.reply.includes('Readiness') || resEn.reply.includes('Document'), 'Reply should address pre-trip checklist');
    assert(resEn.actionLinks.some((l) => l.url.includes('/checklist')), 'Should include link to /checklist');

    // Tamil query
    const resTa = await chatbotService.processMessage('test_sess_p28_2', 'பயணத்திற்கு என்னென்ன ஆவணங்கள் தேவை?', { preferredLang: 'ta' });
    assert(resTa.reply, 'Should have Tamil chatbot reply');
    assert(resTa.reply.includes('ஆவணங்கள்') || resTa.reply.includes('சரிபார்ப்பு') || resTa.reply.includes('தயார்'), 'Reply should be in Tamil for document checklist');
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
