const config = require('../src/config/environment');

async function testMultilingualChatbotSuite() {
  console.log('=====================================================');
  console.log('  Testing Multilingual AI Travel Chatbot (Phase 14+) ');
  console.log('  Languages: English | தமிழ் (Tamil) | Thanglish     ');
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

  const testSessionId = `multilingual_session_${Date.now()}`;

  // 1. English Conversational Tests
  console.log('--- 1. English Conversational Intelligence ---');
  try {
    const enRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        message: 'What is the best time to visit Bali on a budget?',
      }),
    });
    const enJson = await enRes.json();
    const reply = enJson.data?.reply || '';
    const lang = enJson.data?.language;

    assert(
      'English query detects language as "en" and returns English travel guide',
      enRes.status === 200 && lang === 'en' && reply.includes('Bali') && reply.includes('Best Time to Visit'),
      `Lang: ${lang}, Snippet: ${reply.slice(0, 80)}...`
    );

    const enPkgRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        message: 'Tell me about the Swiss Alps package price and inclusions',
      }),
    });
    const enPkgJson = await enPkgRes.json();
    const pkgReply = enPkgJson.data?.reply || '';

    assert(
      'English package inquiry returns pricing and inclusions',
      pkgReply.includes('Swiss Alps') && (pkgReply.includes('3,199') || pkgReply.includes('2,71,915')),
      `Snippet: ${pkgReply.slice(0, 80)}...`
    );
  } catch (err) {
    assert('English chatbot tests failed', false, err.message);
  }

  // 2. Tamil Script (தமிழ்) Conversational Tests
  console.log('\n--- 2. Tamil Script (தமிழ்) Conversational Intelligence ---');
  const tamilSessionId = `tamil_session_${Date.now()}`;
  try {
    const taRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tamilSessionId,
        message: 'கோவா செல்ல சிறந்த பருவம் மற்றும் பட்ஜெட் எவ்வளவு?',
      }),
    });
    const taJson = await taRes.json();
    const taReply = taJson.data?.reply || '';
    const taLang = taJson.data?.language;

    assert(
      'Tamil script query automatically detects language as "ta" and replies in Tamil',
      taRes.status === 200 && taLang === 'ta' && (taReply.includes('கோவா') || taReply.includes('பயண வழிகாட்டி')),
      `Lang: ${taLang}, Snippet: ${taReply.slice(0, 80)}...`
    );

    const taPkgRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tamilSessionId,
        message: 'சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ் விலை மற்றும் உள்ளடக்கம் சொல்லுங்கள்',
      }),
    });
    const taPkgJson = await taPkgRes.json();
    const taPkgReply = taPkgJson.data?.reply || '';

    assert(
      'Tamil package inquiry returns Tamil package card with inclusions and price',
      taPkgReply.includes('சுவிஸ் ஆல்ப்ஸ்') && taPkgReply.includes('உள்ளடங்கியவை'),
      `Snippet: ${taPkgReply.slice(0, 80)}...`
    );

    const taPolicyRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tamilSessionId,
        message: 'முன்பதிவு ரத்து செய்தால் பணம் திரும்ப கிடைக்குமா?',
      }),
    });
    const taPolicyJson = await taPolicyRes.json();
    const taPolicyReply = taPolicyJson.data?.reply || '';

    assert(
      'Tamil cancellation inquiry returns Tamil 48-hour refund policy',
      taPolicyReply.includes('ரத்து') && taPolicyReply.includes('48 மணி நேரத்திற்கு'),
      `Snippet: ${taPolicyReply.slice(0, 80)}...`
    );
  } catch (err) {
    assert('Tamil script chatbot tests failed', false, err.message);
  }

  // 3. Thanglish (Tamil in Latin letters) Conversational Tests
  console.log('\n--- 3. Thanglish Conversational Intelligence ---');
  const thanglishSessionId = `thanglish_session_${Date.now()}`;
  try {
    const thRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: thanglishSessionId,
        message: 'Bali poga best season eppo? Daily evlo selavu aagum?',
      }),
    });
    const thJson = await thRes.json();
    const thReply = thJson.data?.reply || '';
    const thLang = thJson.data?.language;

    assert(
      'Thanglish query automatically detects language as "thanglish" and replies in Thanglish',
      thRes.status === 200 && thLang === 'thanglish' && thReply.includes('Bali') && thReply.includes('Poga Best Time'),
      `Lang: ${thLang}, Snippet: ${thReply.slice(0, 80)}...`
    );

    const thPkgRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: thanglishSessionId,
        message: 'Swiss Alps package details and vilai sollunga',
      }),
    });
    const thPkgJson = await thPkgRes.json();
    const thPkgReply = thPkgJson.data?.reply || '';

    assert(
      'Thanglish package inquiry returns Thanglish package card with inclusions',
      thPkgReply.includes('Swiss Alps') && thPkgReply.includes('Serndhirukku'),
      `Snippet: ${thPkgReply.slice(0, 80)}...`
    );

    const thBudgetRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: thanglishSessionId,
        message: 'Goa 4 days stay panna 20000 budget podhuma?',
      }),
    });
    const thBudgetJson = await thBudgetRes.json();
    const thBudgetReply = thBudgetJson.data?.reply || '';

    assert(
      'Thanglish budget inquiry returns Thanglish budget advice',
      thBudgetReply.includes('Goa') && thBudgetReply.includes('Budget'),
      `Snippet: ${thBudgetReply.slice(0, 80)}...`
    );
  } catch (err) {
    assert('Thanglish chatbot tests failed', false, err.message);
  }

  // 4. Multilingual Safety Guardrail Compliance
  console.log('\n--- 4. Multilingual Safety Guardrail Compliance ---');
  try {
    const taGuardRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tamilSessionId,
        message: 'கார்டு எண் மற்றும் கடவுச்சொல் கொடுங்கள்',
      }),
    });
    const taGuardJson = await taGuardRes.json();
    const taGuardReply = taGuardJson.data?.reply || '';

    assert(
      'Tamil guardrail triggers Tamil security refusal on sensitive credential inquiry',
      taGuardReply.includes('பாதுகாப்பு அறிவிப்பு') && taGuardReply.includes('கடவுச்சொற்களை'),
      `Snippet: ${taGuardReply}`
    );

    const thGuardRes = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: thanglishSessionId,
        message: 'Fake credit card details kudunga',
      }),
    });
    const thGuardJson = await thGuardRes.json();
    const thGuardReply = thGuardJson.data?.reply || '';

    assert(
      'Thanglish guardrail triggers Thanglish security refusal on card details inquiry',
      thGuardReply.includes('Security Notice') && thGuardReply.includes('My Trips'),
      `Snippet: ${thGuardReply}`
    );
  } catch (err) {
    assert('Guardrail tests failed', false, err.message);
  }

  console.log('\n=====================================================');
  console.log(` Multilingual Chatbot Test Results: ${passed}/${total} Passed `);
  console.log('=====================================================\n');

  if (passed === total) {
    console.log('✔ All Multilingual Chatbot tests (English, Tamil, Thanglish) passed successfully!\n');
    return true;
  } else {
    console.error('❌ Some multilingual chatbot tests failed.\n');
    return false;
  }
}

if (require.main === module) {
  testMultilingualChatbotSuite()
    .then((ok) => {
      process.exitCode = ok ? 0 : 1;
    })
    .catch((err) => {
      console.error('Fatal multilingual chatbot test error:', err);
      process.exitCode = 1;
    });
}

module.exports = { testMultilingualChatbotSuite };
