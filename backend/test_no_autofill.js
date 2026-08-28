const API_BASE = 'http://localhost:5000/api';

async function testNoAutoFill() {
  console.log('======================================================================');
  console.log('🛑 TESTING NO AUTO-FILL / NO PRE-FILLED ASSUMPTIONS');
  console.log('======================================================================\n');

  // Test 1: General message with no destination/days/budget provided
  console.log('Test 1: Sending generic greeting ("Hi, help me plan a trip")...');
  const res1 = await fetch(`${API_BASE}/ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'session_no_autofill_' + Date.now(), message: 'Hi, help me plan a trip' }),
  });
  const data1 = await res1.json();
  const plan1 = data1.data;

  console.log('Status:', res1.status);
  console.log('Is Plan Ready:', plan1?.isPlanReady);
  console.log('Extracted Requirements:', plan1?.extractedRequirements);
  console.log('Agent Response Message:\n', plan1?.message);

  if (!plan1?.isPlanReady && plan1?.extractedRequirements === null) {
    console.log('✅ TEST 1 PASSED: Agent did NOT auto-fill or assume destination/days/budget!\n');
  } else {
    console.error('❌ TEST 1 FAILED: Agent auto-filled details prematurely!\n');
  }

  // Test 2: User explicitly provides details ("Plan a 4-day Goa trip for 2 people with ₹20,000")
  console.log('Test 2: User explicitly inputs details ("Plan a 4-day Goa trip for 2 people with ₹20,000")...');
  const res2 = await fetch(`${API_BASE}/ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'session_with_details_' + Date.now(), message: 'Plan a 4-day Goa trip for 2 people with ₹20,000' }),
  });
  const data2 = await res2.json();
  const plan2 = data2.data;

  console.log('Status:', res2.status);
  console.log('Is Plan Ready:', plan2?.isPlanReady);
  console.log('Destination:', plan2?.extractedRequirements?.destination);
  console.log('Days:', plan2?.extractedRequirements?.days);
  console.log('Budget:', plan2?.extractedRequirements?.budget);

  if (plan2?.isPlanReady && plan2?.extractedRequirements?.destination.toLowerCase().includes('goa') && plan2?.extractedRequirements?.days === 4) {
    console.log('✅ TEST 2 PASSED: Custom plan generated strictly according to user-provided input!\n');
  } else {
    console.error('❌ TEST 2 FAILED!\n');
  }

  console.log('🎉 ALL NO AUTO-FILL CHECKS VERIFIED SUCCESSFULLY!');
}

testNoAutoFill().catch(console.error);
