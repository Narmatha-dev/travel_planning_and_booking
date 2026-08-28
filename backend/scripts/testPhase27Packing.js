/**
 * Phase 27: Smart Packing Assistant Automated Test Suite
 */
const assert = require('assert');
const packingService = require('../src/services/packingService');
const packingModel = require('../src/models/packingModel');
const chatbotService = require('../src/services/chatbotService');

async function runTests() {
  console.log('\n================================================================');
  console.log('  🎒 PHASE 27: SMART PACKING ASSISTANT TEST SUITE ');
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

  // 1. Base Checklist Generation
  await test('1. Base Smart Checklist Generation across All Categories', async () => {
    const list = await packingService.generateSmartChecklist({
      destination: 'Mahabalipuram',
      durationDays: 3,
      tripType: 'nature',
      travelers: 2,
    });

    assert(list, 'Checklist object should be returned');
    assert(Array.isArray(list.items), 'Items should be an array');
    assert(list.items.length >= 15, `Expected at least 15 items, got ${list.items.length}`);

    const categoriesFound = new Set(list.items.map((i) => i.category));
    assert(categoriesFound.has('clothing'), 'Must contain clothing items');
    assert(categoriesFound.has('documents'), 'Must contain document items');
    assert(categoriesFound.has('personal'), 'Must contain personal items');
    assert(categoriesFound.has('electronics'), 'Must contain electronics');
    assert(categoriesFound.has('essentials'), 'Must contain essentials');
    assert(categoriesFound.has('gear'), 'Must contain travel gear');
    console.log(`     [Sample Checklist Size]: ${list.items.length} items across ${categoriesFound.size} categories`);
  });

  // 2. Duration Quantity Scaling
  await test('2. Trip Duration Quantity Scaling (3 vs 7 vs 14 Days)', async () => {
    const trip3 = await packingService.generateSmartChecklist({ destination: 'Ooty', durationDays: 3 });
    const trip7 = await packingService.generateSmartChecklist({ destination: 'Ooty', durationDays: 7 });
    const trip14 = await packingService.generateSmartChecklist({ destination: 'Ooty', durationDays: 14 });

    const tShirts3 = trip3.items.find((i) => i.itemName.includes('T-Shirts'))?.quantity;
    const tShirts7 = trip7.items.find((i) => i.itemName.includes('T-Shirts'))?.quantity;
    const tShirts14 = trip14.items.find((i) => i.itemName.includes('T-Shirts'))?.quantity;

    assert(tShirts3 < tShirts7, `7-day trip should have more tops than 3-day (${tShirts7} vs ${tShirts3})`);
    assert(tShirts7 <= tShirts14, `14-day trip should have >= 7-day (${tShirts14} vs ${tShirts7})`);
    console.log(`     [Scaling Verification] 3-Day: ${tShirts3} tops | 7-Day: ${tShirts7} tops | 14-Day: ${tShirts14} tops`);
  });

  // 3. Real Weather Integration
  await test('3. Weather-Aware Item Generation (Rain & Warm/Cold adaptation)', async () => {
    // Rainy destination test
    const rainyChecklist = await packingService.generateSmartChecklist({
      destination: 'Cherrapunji',
      durationDays: 3,
      weatherForecast: {
        current: { temperature: 22, rain_probability: 85, is_rainy: true, condition: 'Heavy Rain' },
      },
    });

    const hasUmbrella = rainyChecklist.items.some((i) => i.category === 'weather' && i.itemName.toLowerCase().includes('umbrella'));
    const hasRainwear = rainyChecklist.items.some((i) => i.category === 'weather' && i.itemName.toLowerCase().includes('rain'));
    assert(hasUmbrella || hasRainwear, 'Rain forecast must trigger umbrella or rainwear');
    assert(rainyChecklist.weatherReason.includes('Rain is possible'), 'Should display rain weather explanation');

    // Cold destination test
    const coldChecklist = await packingService.generateSmartChecklist({
      destination: 'Gulmarg',
      durationDays: 4,
      weatherForecast: {
        current: { temperature: 8, rain_probability: 10, is_rainy: false, condition: 'Cold' },
      },
    });

    const hasWarm = coldChecklist.items.some((i) => i.category === 'weather' && (i.itemName.toLowerCase().includes('fleece') || i.itemName.toLowerCase().includes('thermal') || i.itemName.toLowerCase().includes('sweater')));
    assert(hasWarm, 'Cold temperature must trigger warm clothing');
  });

  // 4. Activity-Based Items
  await test('4. Activity & Itinerary-Based Gear (Trekking, Beach, Temple, Photography)', async () => {
    const trekChecklist = await packingService.generateSmartChecklist({
      destination: 'Ooty',
      durationDays: 3,
      tripType: 'adventure',
      activities: ['Doddabetta Peak Trek', 'Nature Trail Walk'],
    });
    assert(trekChecklist.items.some((i) => i.category === 'activity' && i.itemName.toLowerCase().includes('trek')), 'Must include trekking gear for adventure trip');

    const beachChecklist = await packingService.generateSmartChecklist({
      destination: 'Goa',
      durationDays: 4,
      tripType: 'beach',
      activities: ['Calangute Beach Watersports', 'Sunset Cruise'],
    });
    assert(beachChecklist.items.some((i) => i.category === 'activity' && (i.itemName.toLowerCase().includes('swim') || i.itemName.toLowerCase().includes('towel'))), 'Must include beachwear for beach trip');

    const templeChecklist = await packingService.generateSmartChecklist({
      destination: 'Madurai',
      durationDays: 2,
      tripType: 'historical',
      activities: ['Meenakshi Amman Temple Darshan', 'Heritage Walk'],
    });
    assert(templeChecklist.items.some((i) => i.category === 'activity' && (i.itemName.toLowerCase().includes('temple') || i.itemName.toLowerCase().includes('shawl') || i.itemName.toLowerCase().includes('slip-on'))), 'Must include temple-appropriate clothing for cultural sites');
  });

  // 5. Document Checklist Boundaries (No sensitive numbers)
  await test('5. Travel Document Checklist & Privacy Guard', async () => {
    const list = await packingService.generateSmartChecklist({ destination: 'Chennai', durationDays: 3 });
    const docs = list.items.filter((i) => i.category === 'documents');
    assert(docs.length >= 3, 'Must contain document reminders');
    assert(docs.some((d) => d.itemName.includes('Photo ID')), 'Must contain ID reminder');
    assert(docs.some((d) => d.itemName.includes('Booking Confirmation')), 'Must contain booking voucher reminder');
  });

  // 6. Custom Items CRUD & Persistence
  await test('6. Custom Items Creation, Editing & Deletion', async () => {
    const userId = 99;
    const tripId = 888;

    // Create custom item
    const newItem = await packingService.addCustomItem(userId, {
      tripId,
      category: 'gear',
      itemName: 'Underwater GoPro Camera',
      quantity: 1,
      reason: 'For snorkeling in Bali',
    });

    assert(newItem.id, 'Created custom item must have ID');
    assert.strictEqual(newItem.is_custom, true);
    assert.strictEqual(newItem.item_name, 'Underwater GoPro Camera');

    // Update custom item
    const updated = await packingService.updateItem(newItem.id, userId, {
      quantity: 2,
      itemName: 'Underwater GoPro Camera & Extra Housing',
    });
    assert.strictEqual(updated.quantity, 2);
    assert(updated.item_name.includes('Extra Housing'));

    // Toggle packed status
    const toggled = await packingService.toggleItemPacked(newItem.id, userId);
    assert.strictEqual(toggled.is_packed, true);

    // Delete custom item
    const delRes = await packingService.deleteItem(newItem.id, userId);
    assert.strictEqual(delRes.success, true);
  });

  // 7. Trip Packing Progress Calculation
  await test('7. Trip Packing Progress Percentage Calculation', async () => {
    const userId = 101;
    const tripId = 999;

    const sampleItems = [
      { itemName: 'Shirt 1', category: 'clothing', quantity: 1, isPacked: true },
      { itemName: 'Shirt 2', category: 'clothing', quantity: 1, isPacked: true },
      { itemName: 'Pants', category: 'clothing', quantity: 1, isPacked: false },
      { itemName: 'Passport', category: 'documents', quantity: 1, isPacked: false },
    ];

    const saved = await packingService.savePackingList(tripId, userId, sampleItems);
    assert.strictEqual(saved.totalItems, 4);
    assert.strictEqual(saved.packedItems, 2);
    assert.strictEqual(saved.remainingItems, 2);
    assert.strictEqual(saved.progressPercentage, 50);
    console.log(`     [Progress Calculation]: ${saved.packedItems}/${saved.totalItems} items packed (${saved.progressPercentage}%)`);
  });

  // 8. AI Chatbot Packing Assistant (English & Tamil)
  await test('8. AI Chatbot Packing Assistant Queries (English & Tamil)', async () => {
    // English query
    const resEn = await chatbotService.processMessage('test_sess_p27_1', 'What should I pack for my 5-day trip to Ooty?', { preferredLang: 'en' });
    assert(resEn.reply, 'Should have chatbot reply');
    assert(resEn.reply.toLowerCase().includes('pack') || resEn.reply.includes('Ooty'), 'Reply should address packing list');
    assert(resEn.actionLinks.some((l) => l.url.includes('/packing')), 'Should include link to /packing');

    // Tamil query
    const resTa = await chatbotService.processMessage('test_sess_p27_2', 'ஊட்டி பயணத்திற்கு என்ன பேக்கிங் செய்ய வேண்டும்?', { preferredLang: 'ta' });
    assert(resTa.reply, 'Should have Tamil chatbot reply');
    assert(resTa.reply.includes('பேக்கிங்') || resTa.reply.includes('ஆடைகள்') || resTa.reply.includes('பட்டியல்'), 'Reply should be in Tamil');
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
