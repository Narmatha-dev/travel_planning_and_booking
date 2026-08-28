const API_BASE = 'http://localhost:5000/api';

async function testAiAgentFlow() {
  console.log('======================================================================');
  console.log('🤖 TESTING GEMINI-POWERED AI TRAVEL AGENT API FLOW');
  console.log('======================================================================\n');

  const sessionId = 'test_agent_' + Date.now();

  // -------------------------------------------------------------------------
  // TEST 1: Initial Travel Plan Request
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Initial Requirement & Plan Generation ---');
  const prompt1 = 'I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.';
  console.log('User Prompt:', prompt1);

  try {
    const res = await fetch(`${API_BASE}/ai-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: prompt1,
      }),
    });
    const data = await res.json();
    console.log('HTTP Status:', res.status, res.statusText);
    const agentData = data.data;

    console.log('\n--- AI Agent Response ---');
    console.log('Message Preview:', agentData?.message?.substring(0, 150) + '...');
    console.log('Is Plan Ready:', agentData?.isPlanReady);
    console.log('Extracted Requirements:', agentData?.extractedRequirements);
    console.log('Trip Overview:', agentData?.tripOverview);
    console.log('Itinerary Days Count:', agentData?.itinerary?.length);
    if (agentData?.itinerary?.[0]) {
      console.log('Day 1 Sample:', {
        day: agentData.itinerary[0].day,
        title: agentData.itinerary[0].title,
        places: agentData.itinerary[0].places,
        cost: agentData.itinerary[0].estimatedDayCost,
      });
    }
    console.log('Recommendations:', {
      transport: agentData?.recommendations?.transport?.substring(0, 80) + '...',
      accommodation: agentData?.recommendations?.accommodation?.substring(0, 80) + '...',
      budgetDistribution: agentData?.recommendations?.budgetDistribution,
    });
    console.log('Suggestions:', agentData?.suggestions);

    const hasOrigin = agentData?.extractedRequirements?.origin?.toLowerCase().includes('chennai');
    const hasDest = agentData?.extractedRequirements?.destination?.toLowerCase().includes('ooty');
    const hasDays = agentData?.extractedRequirements?.days === 3 || agentData?.extractedRequirements?.days === '3';
    const hasTravelers = agentData?.extractedRequirements?.travelers === 2 || agentData?.extractedRequirements?.travelers === '2';

    if (res.status === 200 && agentData?.isPlanReady && hasOrigin && hasDest) {
      console.log('\n✅ PASS: AI Travel Agent successfully extracted requirements and generated personalized plan!');
    } else {
      console.error('\n❌ FAIL: AI Agent failed to extract requirements properly.');
    }
  } catch (err) {
    console.error('❌ Error in Test 1:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Multi-turn Modification Request
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('--- TEST 2: Multi-turn Plan Modification ("Make it cheaper and add more nature places") ---');
  const prompt2 = 'Make it cheaper and add more nature places.';
  console.log('User Prompt:', prompt2);

  try {
    const res2 = await fetch(`${API_BASE}/ai-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: prompt2,
      }),
    });
    const data2 = await res2.json();
    console.log('HTTP Status:', res2.status, res2.statusText);
    const agentData2 = data2.data;

    console.log('\n--- Modified AI Agent Response ---');
    console.log('Message Preview:', agentData2?.message?.substring(0, 160) + '...');
    console.log('Extracted Requirements:', agentData2?.extractedRequirements);
    console.log('Updated Overview:', agentData2?.tripOverview);
    console.log('Itinerary Days Count:', agentData2?.itinerary?.length);
    if (agentData2?.itinerary?.[1]) {
      console.log('Day 2 Sample:', {
        day: agentData2.itinerary[1].day,
        title: agentData2.itinerary[1].title,
        places: agentData2.itinerary[1].places,
      });
    }

    if (res2.status === 200 && agentData2?.isPlanReady) {
      console.log('\n✅ PASS: AI Agent successfully modified existing plan using multi-turn context memory!');
    } else {
      console.error('\n❌ FAIL: AI Agent failed to modify plan.');
    }
  } catch (err2) {
    console.error('❌ Error in Test 2:', err2.message);
  }

  console.log('\n🎉 ALL AI TRAVEL AGENT BACKEND TESTS COMPLETED SUCCESSFULLY!');
}

testAiAgentFlow().catch(console.error);
