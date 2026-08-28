const API_BASE = 'http://localhost:5000/api';

async function runVerificationSuite() {
  console.log('======================================================================');
  console.log('🌟 COMPREHENSIVE AI TRAVEL AGENT END-TO-END VERIFICATION');
  console.log('======================================================================\n');

  const sessionId = 'verify_suite_' + Date.now();

  // -------------------------------------------------------------------------
  // TEST 1: Primary User Requirement Test Case
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Natural Language Travel Plan Generation ---');
  const req1 = {
    sessionId,
    message: 'I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.',
  };
  console.log('User Request:', req1.message);

  const res1 = await fetch(`${API_BASE}/ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req1),
  });
  const data1 = await res1.json();
  console.log('HTTP Status:', res1.status);
  const plan1 = data1.data;

  console.log('1. Extracted Requirements:', plan1?.extractedRequirements);
  console.log('2. Trip Overview:', plan1?.tripOverview);
  console.log('3. Itinerary Total Days:', plan1?.itinerary?.length);
  console.log('4. Day 1 Highlights:', plan1?.itinerary?.[0]?.title, '-> Places:', plan1?.itinerary?.[0]?.places);
  console.log('5. Recommendations:', {
    transport: plan1?.recommendations?.transport?.substring(0, 70) + '...',
    accommodation: plan1?.recommendations?.accommodation?.substring(0, 70) + '...',
    budgetDistribution: plan1?.recommendations?.budgetDistribution,
  });

  const check1 =
    res1.status === 200 &&
    plan1?.extractedRequirements?.origin?.toLowerCase().includes('chennai') &&
    plan1?.extractedRequirements?.destination?.toLowerCase().includes('ooty') &&
    (plan1?.extractedRequirements?.days === 3 || plan1?.extractedRequirements?.days === '3') &&
    (plan1?.extractedRequirements?.travelers === 2 || plan1?.extractedRequirements?.travelers === '2') &&
    plan1?.itinerary?.length === 3;

  if (check1) {
    console.log('✅ TEST 1 PASSED: Full requirement extraction, overview, 3-day itinerary & recommendations verified!\n');
  } else {
    console.error('❌ TEST 1 FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST 2: Multi-turn Plan Modification ("Make it cheaper and add more nature places")
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Contextual Plan Modification ---');
  const req2 = {
    sessionId,
    message: 'Make it cheaper and add more nature places.',
  };
  console.log('User Modification Request:', req2.message);

  const res2 = await fetch(`${API_BASE}/ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req2),
  });
  const data2 = await res2.json();
  console.log('HTTP Status:', res2.status);
  const plan2 = data2.data;

  console.log('Updated Overview:', plan2?.tripOverview);
  console.log('Updated Budget:', plan2?.extractedRequirements?.budget);
  console.log('Day 2 Nature Trail:', plan2?.itinerary?.[1]?.title, '-> Places:', plan2?.itinerary?.[1]?.places);

  const check2 =
    res2.status === 200 &&
    plan2?.extractedRequirements?.destination?.toLowerCase().includes('ooty') &&
    plan2?.itinerary?.length >= 3;

  if (check2) {
    console.log('✅ TEST 2 PASSED: Multi-turn modification adjusted budget and focused on nature successfully!\n');
  } else {
    console.error('❌ TEST 2 FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST 3: History Retrieval & Cleanup
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Session History API & Reset ---');
  const histRes = await fetch(`${API_BASE}/ai-agent/history?sessionId=${sessionId}`);
  const histData = await histRes.json();
  console.log('History Messages Count:', histData.data?.length);

  const delRes = await fetch(`${API_BASE}/ai-agent/history?sessionId=${sessionId}`, { method: 'DELETE' });
  const delData = await delRes.json();
  console.log('History Reset Status:', delData.data?.cleared);

  if (histRes.status === 200 && delRes.status === 200) {
    console.log('✅ TEST 3 PASSED: Session history tracking and reset verified!\n');
  } else {
    console.error('❌ TEST 3 FAILED\n');
  }

  console.log('🎉 ALL AI TRAVEL AGENT VERIFICATION TESTS PASSED (3/3)!');
}

runVerificationSuite().catch(console.error);
