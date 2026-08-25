const jwt = require('jsonwebtoken');
const app = require('../src/server');
const config = require('../src/config/environment');
const safetyService = require('../src/services/safetyService');
const trustedContactModel = require('../src/models/trustedContactModel');
const chatbotService = require('../src/services/chatbotService');

async function testPhase25SafetySuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 25: Travel Safety & Emergency Assistant');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/safety`;
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

  // Generate User 3 (Alex Reed) Traveler JWT token
  const jwtSecret = config.jwt?.secret || process.env.JWT_SECRET || 'travel_jwt_super_secret_key_2026_secure!';
  const user3Token = jwt.sign(
    { id: 3, email: 'alex.reed@example.com', full_name: 'Alexander Reed', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  // Generate User 4 (Elena Rostova) Traveler JWT token
  const user4Token = jwt.sign(
    { id: 4, email: 'elena.rostova@example.com', full_name: 'Elena Rostova', role: 'traveler' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const user3Headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user3Token}`,
  };

  const user4Headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user4Token}`,
  };

  // -------------------------------------------------------------------
  // 1. Nearby Safety Places (Feature 1, 3, 4, 5)
  // -------------------------------------------------------------------
  console.log('--- 1. Nearby Safety Facilities Retrieval (Feature 1, 3, 4, 5) ---');
  try {
    const resAll = await fetch(`${BASE_URL}/nearby?latitude=13.0604&longitude=80.2518&radiusKm=15`);
    const dataAll = await resAll.json();
    assert(
      'GET /api/safety/nearby returns HTTP 200 with success status',
      resAll.status === 200 && dataAll.status === 'success',
      `Status: ${resAll.status}`
    );
    assert(
      'Returns verified facilities array with distance calculations',
      Array.isArray(dataAll.data?.places) && dataAll.data.places.length > 0,
      `Count: ${dataAll.data?.places?.length}`
    );
    assert(
      'Places contain name, category, address, coordinates, and distance_label',
      dataAll.data.places[0].name && dataAll.data.places[0].distance_label && dataAll.data.places[0].category,
      JSON.stringify(dataAll.data.places[0])
    );
  } catch (err) {
    assert('Nearby places retrieval failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 2. Category & Radius Filtering (Feature 3, 4, 5, 18)
  // -------------------------------------------------------------------
  console.log('\n--- 2. Category & Radius Filtering (Feature 3, 4, 5, 18) ---');
  try {
    // Hospital Filter
    const resHospital = await fetch(`${BASE_URL}/nearby?latitude=13.0604&longitude=80.2518&type=hospital&radiusKm=10`);
    const dataHospital = await resHospital.json();
    const allAreHospitals = dataHospital.data.places.every((p) => p.category === 'hospital');
    assert(
      'Filter type=hospital returns only hospital facilities',
      allAreHospitals && dataHospital.data.places.length > 0,
      `Hospitals: ${dataHospital.data.places.length}`
    );

    // Police Filter
    const resPolice = await fetch(`${BASE_URL}/nearby?latitude=13.0604&longitude=80.2518&type=police&radiusKm=10`);
    const dataPolice = await resPolice.json();
    const allArePolice = dataPolice.data.places.every((p) => p.category === 'police');
    assert(
      'Filter type=police returns only police stations',
      allArePolice && dataPolice.data.places.length > 0,
      `Police: ${dataPolice.data.places.length}`
    );

    // Pharmacy Filter
    const resPharmacy = await fetch(`${BASE_URL}/nearby?latitude=13.0604&longitude=80.2518&type=pharmacy&radiusKm=10`);
    const dataPharmacy = await resPharmacy.json();
    const allArePharmacies = dataPharmacy.data.places.every((p) => p.category === 'pharmacy');
    assert(
      'Filter type=pharmacy returns only pharmacies',
      allArePharmacies && dataPharmacy.data.places.length > 0,
      `Pharmacies: ${dataPharmacy.data.places.length}`
    );
  } catch (err) {
    assert('Category filtering failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 3. Country Emergency Numbers Directory (Feature 6)
  // -------------------------------------------------------------------
  console.log('\n--- 3. Country Emergency Numbers Directory (Feature 6) ---');
  try {
    // India
    const resIndia = await fetch(`${BASE_URL}/emergency-numbers?country=India`);
    const dataIndia = await resIndia.json();
    assert(
      'GET /api/safety/emergency-numbers for India returns 112 universal & 100 police',
      dataIndia.data?.emergency_numbers?.universal === '112' && dataIndia.data?.emergency_numbers?.police === '100',
      JSON.stringify(dataIndia.data?.emergency_numbers)
    );

    // France
    const resFrance = await fetch(`${BASE_URL}/emergency-numbers?country=France`);
    const dataFrance = await resFrance.json();
    assert(
      'GET /api/safety/emergency-numbers for France returns 112 EU universal & 15 SAMU',
      dataFrance.data?.emergency_numbers?.universal === '112' && dataFrance.data?.emergency_numbers?.ambulance === '15',
      JSON.stringify(dataFrance.data?.emergency_numbers)
    );

    // Japan
    const resJapan = await fetch(`${BASE_URL}/emergency-numbers?country=Japan`);
    const dataJapan = await resJapan.json();
    assert(
      'GET /api/safety/emergency-numbers for Japan returns 110 Police & 119 Ambulance/Fire',
      dataJapan.data?.emergency_numbers?.police === '110' && dataJapan.data?.emergency_numbers?.ambulance === '119',
      JSON.stringify(dataJapan.data?.emergency_numbers)
    );

    // United States
    const resUS = await fetch(`${BASE_URL}/emergency-numbers?country=United%20States`);
    const dataUS = await resUS.json();
    assert(
      'GET /api/safety/emergency-numbers for US returns 911',
      dataUS.data?.emergency_numbers?.universal === '911',
      JSON.stringify(dataUS.data?.emergency_numbers)
    );
  } catch (err) {
    assert('Emergency numbers lookup failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 4. Trusted Emergency Contacts CRUD & Boundaries (Feature 12, 21)
  // -------------------------------------------------------------------
  console.log('\n--- 4. Trusted Emergency Contacts CRUD & Boundaries (Feature 12, 21) ---');
  let createdContactId = null;

  try {
    // Unauthenticated access blocked
    const resUnauth = await fetch(`${BASE_URL}/contacts`);
    assert(
      'Unauthenticated GET /api/safety/contacts is rejected with HTTP 401',
      resUnauth.status === 401,
      `Status: ${resUnauth.status}`
    );

    // Get User 3 Contacts
    const resGet = await fetch(`${BASE_URL}/contacts`, { headers: user3Headers });
    const dataGet = await resGet.json();
    assert(
      'Authenticated GET /api/safety/contacts returns user contacts',
      resGet.status === 200 && Array.isArray(dataGet.data?.contacts),
      `Contacts: ${dataGet.data?.contacts?.length}`
    );

    // Create New Contact for User 3
    const resCreate = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: user3Headers,
      body: JSON.stringify({
        name: 'Jessica Reed (Sister)',
        phone: '+1-555-0195',
        relationship: 'Sister',
        email: 'jessica.reed@example.com',
        is_primary: false,
      }),
    });
    const dataCreate = await resCreate.json();
    createdContactId = dataCreate.data?.id;
    assert(
      'POST /api/safety/contacts creates a new trusted contact (HTTP 201)',
      resCreate.status === 201 && dataCreate.data?.name === 'Jessica Reed (Sister)',
      JSON.stringify(dataCreate)
    );

    // Update Contact
    const resUpdate = await fetch(`${BASE_URL}/contacts/${createdContactId}`, {
      method: 'PUT',
      headers: user3Headers,
      body: JSON.stringify({
        phone: '+1-555-9999',
        relationship: 'Sister / Emergency',
      }),
    });
    const dataUpdate = await resUpdate.json();
    assert(
      'PUT /api/safety/contacts/:id updates contact phone and relationship',
      resUpdate.status === 200 && dataUpdate.data?.phone === '+1-555-9999',
      JSON.stringify(dataUpdate)
    );

    // Privacy boundary: User 4 cannot update or delete User 3's contact
    const resUnauthorizedEdit = await fetch(`${BASE_URL}/contacts/${createdContactId}`, {
      method: 'PUT',
      headers: user4Headers,
      body: JSON.stringify({ name: 'Hacked Contact' }),
    });
    assert(
      'User 4 cannot edit User 3 contact (isolated ownership)',
      resUnauthorizedEdit.status === 404 || resUnauthorizedEdit.status === 403,
      `Status: ${resUnauthorizedEdit.status}`
    );

    // Delete Contact
    const resDelete = await fetch(`${BASE_URL}/contacts/${createdContactId}`, {
      method: 'DELETE',
      headers: user3Headers,
    });
    const dataDelete = await resDelete.json();
    assert(
      'DELETE /api/safety/contacts/:id deletes the contact',
      resDelete.status === 200 && dataDelete.status === 'success',
      JSON.stringify(dataDelete)
    );
  } catch (err) {
    assert('Trusted contacts CRUD test failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 5. Emergency Location Sharing (Feature 11 & Feature 16)
  // -------------------------------------------------------------------
  console.log('\n--- 5. Emergency Location Sharing (Feature 11 & Feature 16) ---');
  try {
    const resShare = await fetch(`${BASE_URL}/share-location`, {
      method: 'POST',
      headers: user3Headers,
      body: JSON.stringify({
        latitude: 13.0604,
        longitude: 80.2518,
        customMessage: 'Staying at hotel, need assistance nearby.',
      }),
    });
    const dataShare = await resShare.json();
    assert(
      'POST /api/safety/share-location generates safe location description and pin link',
      resShare.status === 200 &&
        dataShare.data?.google_maps_url?.includes('google.com/maps') &&
        dataShare.data?.share_text?.includes('EMERGENCY / SAFETY LOCATION UPDATE'),
      JSON.stringify(dataShare.data)
    );
    assert(
      'Includes formatted WhatsApp and SMS direct intent URLs',
      dataShare.data?.whatsapp_url?.startsWith('https://api.whatsapp.com') && dataShare.data?.sms_url?.startsWith('sms:'),
      `WhatsApp: ${dataShare.data?.whatsapp_url?.substring(0, 30)}...`
    );
  } catch (err) {
    assert('Emergency location sharing failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 6. Error Handling & Privacy Bounds (Feature 16, 17, 21)
  // -------------------------------------------------------------------
  console.log('\n--- 6. Error Handling & Parameter Validation (Feature 16, 17, 21) ---');
  try {
    // Missing Coordinates
    const resMissing = await fetch(`${BASE_URL}/nearby`);
    assert(
      'GET /api/safety/nearby without coordinates returns HTTP 400 Bad Request',
      resMissing.status === 400,
      `Status: ${resMissing.status}`
    );

    // Invalid Coordinates
    const resInvalid = await fetch(`${BASE_URL}/nearby?latitude=invalid&longitude=abc`);
    assert(
      'GET /api/safety/nearby with invalid coordinates returns HTTP 400 Bad Request',
      resInvalid.status === 400,
      `Status: ${resInvalid.status}`
    );

    // Out of bounds Coordinates
    const resOutOfBounds = await fetch(`${BASE_URL}/nearby?latitude=195.0&longitude=300.0`);
    assert(
      'GET /api/safety/nearby with out-of-bounds coordinates returns HTTP 400 Bad Request',
      resOutOfBounds.status === 400,
      `Status: ${resOutOfBounds.status}`
    );
  } catch (err) {
    assert('Error handling test failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // 7. Multilingual Chatbot Safety Intents (Feature 24, 25, 26)
  // -------------------------------------------------------------------
  console.log('\n--- 7. Multilingual AI Chatbot Safety Intents (Feature 24, 25, 26) ---');
  try {
    // English Query
    const replyEn = await chatbotService.processMessage('test_safety_en', 'Find nearest hospital and emergency help');
    assert(
      'Chatbot responds to English safety query with hospital/police guidance and /safety link',
      replyEn.reply.includes('Travel Safety & Emergency Assistant') &&
        replyEn.actionLinks.some((l) => l.url === '/safety'),
      replyEn.reply.substring(0, 100)
    );

    // Tamil Query
    const replyTa = await chatbotService.processMessage('test_safety_ta', 'அவசர உதவி மற்றும் மருத்துவமனை எங்கு உள்ளது?');
    assert(
      'Chatbot responds in Tamil for safety query with 112 / மருத்துவமனை guidance',
      replyTa.reply.includes('பயண பாதுகாப்பு') || replyTa.reply.includes('மருத்துவமனை'),
      replyTa.reply.substring(0, 100)
    );
  } catch (err) {
    assert('Chatbot safety intent test failed', false, err.message);
  }

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n=====================================================');
  console.log(`  Phase 25 Safety Test Results: ${passed} / ${total} PASSING`);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PHASE 25 TRAVEL SAFETY & EMERGENCY TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} tests failed.`);
    process.exit(1);
  }
}

testPhase25SafetySuite().catch((err) => {
  console.error('Fatal error running Phase 25 tests:', err);
  process.exit(1);
});
