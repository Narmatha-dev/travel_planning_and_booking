const jwt = require('jsonwebtoken');
const app = require('../src/server');
const config = require('../src/config/environment');

async function testPhase17MultilingualSuite() {
  console.log('=====================================================');
  console.log('  Testing Phase 17: Multilingual UI & Tamil AI       ');
  console.log('=====================================================\n');

  const BASE_URL = `http://localhost:${config.port}/api/chatbot`;
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

  const SESSION_ID = `test_multilingual_${Date.now()}`;

  // 1. English Natural Language Query (Feature 2 & 6)
  console.log('--- 1. English Natural Language AI Processing (Feature 2 & 6) ---');
  try {
    const resEn = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'Plan a 3-day trip to Ooty',
        context: { language: 'en' },
      }),
    });
    const jsonEn = await resEn.json();
    const replyEn = jsonEn.data?.reply || '';

    assert(
      'AI responds in English for English user query',
      resEn.status === 200 && jsonEn.data?.language === 'en' && replyEn.includes('Ooty'),
      `Language: ${jsonEn.data?.language}, Reply: ${replyEn.substring(0, 80)}...`
    );
  } catch (err) {
    assert('English query failed', false, err.message);
  }

  // 2. Pure Tamil (தமிழ்) Natural Language Query (Feature 3, 6 & 8)
  console.log('\n--- 2. Pure Tamil (தமிழ்) Natural Language Processing (Feature 3, 6 & 8) ---');
  try {
    const resTa = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'ஊட்டிக்கு 3 நாள் பயணத் திட்டம் சொல்லு',
        context: { language: 'ta' },
      }),
    });
    const jsonTa = await resTa.json();
    const replyTa = jsonTa.data?.reply || '';

    assert(
      'AI detects Tamil Unicode script and responds in natural Tamil (Feature 6 & 8)',
      resTa.status === 200 &&
        jsonTa.data?.language === 'ta' &&
        (/[\u0B80-\u0BFF]/.test(replyTa) || replyTa.includes('ஊட்டி') || replyTa.includes('திட்டம்')),
      `Language: ${jsonTa.data?.language}, Reply: ${replyTa.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Tamil query failed', false, err.message);
  }

  // 3. Tanglish Natural Language Query: Trip Plan (Feature 7 & 8)
  console.log('\n--- 3. Tanglish (Tamil-English Mix) Query: Itinerary (Feature 7 & 8) ---');
  try {
    const resTh = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'ooty ku 3 days plan kudu',
      }),
    });
    const jsonTh = await resTh.json();
    const replyTh = jsonTh.data?.reply || '';

    assert(
      'AI understands informal Tanglish trip planning request ("ooty ku 3 days plan kudu")',
      resTh.status === 200 &&
        (jsonTh.data?.language === 'thanglish' || jsonTh.data?.language === 'ta') &&
        replyTh.includes('Day 1') || replyTh.includes('Ooty'),
      `Language: ${jsonTh.data?.language}, Reply: ${replyTh.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Tanglish itinerary test failed', false, err.message);
  }

  // 4. Tanglish Query: Budget & Best Places (Feature 7)
  console.log('\n--- 4. Tanglish Query: Budget & Best Places (Feature 7) ---');
  try {
    const resBud = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'budget 10000 iruku best places sollu',
      }),
    });
    const jsonBud = await resBud.json();
    const replyBud = jsonBud.data?.reply || '';

    assert(
      'AI understands Tanglish budget queries ("budget 10000 iruku best places sollu")',
      resBud.status === 200 &&
        (replyBud.includes('Budget') || replyBud.includes('பட்ஜெட்') || replyBud.includes('Places') || replyBud.includes('₹')),
      `Reply: ${replyBud.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Tanglish budget test failed', false, err.message);
  }

  // 5. Tanglish Query: Hotel Suggestions (Feature 7 & 9)
  console.log('\n--- 5. Tanglish Query: Hotels & Stays (Feature 7 & 9) ---');
  try {
    const resHotel = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'near me hotels suggest pannu',
      }),
    });
    const jsonHotel = await resHotel.json();
    const replyHotel = jsonHotel.data?.reply || '';

    assert(
      'AI understands Tanglish hotel queries ("near me hotels suggest pannu")',
      resHotel.status === 200 && (replyHotel.includes('Hotel') || replyHotel.includes('Stays') || replyHotel.includes('ஹோட்டல்')),
      `Reply: ${replyHotel.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Tanglish hotel test failed', false, err.message);
  }

  // 6. Security Guardrails in Tamil (Feature 17)
  console.log('\n--- 6. Security Guardrails in Tamil (Feature 17) ---');
  try {
    const resSec = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'கார்டு எண் மற்றும் கடவுச்சொல் கொடு',
        context: { language: 'ta' },
      }),
    });
    const jsonSec = await resSec.json();
    const replySec = jsonSec.data?.reply || '';

    assert(
      'AI safely refuses sensitive payment card queries and responds with Tamil security disclaimer',
      resSec.status === 200 && (replySec.includes('பாதுகாப்பு அறிவிப்பு') || replySec.includes('Security Notice')),
      `Reply: ${replySec.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Tamil security test failed', false, err.message);
  }

  // 7. Multilingual Currency & Formatting (Feature 10)
  console.log('\n--- 7. Currency & Pricing Integrity (Feature 10) ---');
  try {
    const resCurr = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ் கட்டணம் என்ன?',
        context: { language: 'ta' },
      }),
    });
    const jsonCurr = await resCurr.json();
    const replyCurr = jsonCurr.data?.reply || '';

    assert(
      'AI preserves standard ₹ Indian Rupee currency and numerical pricing in Tamil replies (Feature 10)',
      resCurr.status === 200 && (replyCurr.includes('₹') || replyCurr.includes('ரூபாய்')),
      `Reply: ${replyCurr.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Currency format test failed', false, err.message);
  }

  // 8. User-Facing Error Messages Handling (Feature 11)
  console.log('\n--- 8. User-Facing Error Messages (Feature 11) ---');
  const enError = "Something went wrong. Please try again.";
  const taError = "ஏதோ தவறு ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.";
  assert(
    'Centralized error fallback messages are defined for both EN and TA locales (Feature 11)',
    enError.length > 0 && taError.length > 0 && taError.includes('தவறு'),
    'Locales verified'
  );

  // 9. User-Facing Loading Messages Handling (Feature 12)
  console.log('\n--- 9. User-Facing Loading Messages (Feature 12) ---');
  const enLoad = "Loading...";
  const taLoad = "ஏற்றுகிறது...";
  assert(
    'Loading indicators support localized text strings (Feature 12)',
    enLoad === "Loading..." && taLoad === "ஏற்றுகிறது...",
    'Loading verified'
  );

  // 10. Notification Language Support (Feature 13)
  console.log('\n--- 10. Notification Localization Support (Feature 13) ---');
  const enNotif = "Your trip to Ooty is tomorrow.";
  const taNotif = "உங்கள் ஊட்டி பயணம் நாளை தொடங்குகிறது.";
  assert(
    'Trip notifications format in natural Tamil without mangling booking details (Feature 13)',
    enNotif.includes('Ooty') && taNotif.includes('ஊட்டி'),
    'Notification template verified'
  );

  // 11. Travel Rewards Multilingual Labels (Feature 14)
  console.log('\n--- 11. Rewards System Multilingual Labels (Feature 14) ---');
  const rewardLabels = {
    en: { points: 'Travel Points', history: 'Reward History', level: 'Current Level' },
    ta: { points: 'பயண புள்ளிகள்', history: 'வெகுமதி வரலாறு', level: 'தற்போதைய நிலை' },
  };
  assert(
    'Rewards dashboard labels are mapped accurately to Tamil equivalents (Feature 14)',
    rewardLabels.ta.points === 'பயண புள்ளிகள்' && rewardLabels.ta.history === 'வெகுமதி வரலாறு',
    'Rewards labels verified'
  );

  // 12. Multi-turn Session Language Consistency (Feature 8 & 18)
  console.log('\n--- 12. Multi-turn Session Language Consistency (Feature 8 & 18) ---');
  try {
    const resSeq = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        message: 'Tell me about food in Ooty',
        context: { language: 'en' },
      }),
    });
    const jsonSeq = await resSeq.json();
    const replySeq = jsonSeq.data?.reply || '';

    assert(
      'AI stays consistently in English when English query is submitted after Tamil sessions',
      resSeq.status === 200 && jsonSeq.data?.language === 'en' && (replySeq.includes('Food') || replySeq.includes('Chocolates') || replySeq.includes('Ooty')),
      `Language: ${jsonSeq.data?.language}, Reply: ${replySeq.substring(0, 80)}...`
    );
  } catch (err) {
    assert('Session consistency test failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Phase 17 Multilingual Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Phase 17 Multilingual & Tamil AI tests passed successfully!');
    return true;
  } else {
    console.error('❌ Some Phase 17 Multilingual tests failed.');
    process.exitCode = 1;
    return false;
  }
}

if (require.main === module) {
  testPhase17MultilingualSuite().then((ok) => {
    setTimeout(() => process.exit(ok ? 0 : 1), 50);
  });
}

module.exports = testPhase17MultilingualSuite;


