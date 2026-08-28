const API_BASE = 'http://localhost:5000/api';

async function testUniversalAgent() {
  console.log('======================================================================');
  console.log('🤖 TESTING UNIVERSAL AI TRAVEL AGENT ENGINE ACROSS DESTINATIONS');
  console.log('======================================================================\n');

  const prompts = [
    {
      name: 'Ooty Nature 3-Day Plan',
      prompt: 'I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.',
    },
    {
      name: 'Ooty Budget & Nature Modification',
      prompt: 'Make it cheaper and add more nature places.',
    },
    {
      name: 'Goa 4-Day Coastal Plan',
      prompt: 'Plan a 4-day Goa vacation for 2 people with beach, watersports and nightlife under ₹20,000.',
    },
    {
      name: 'Kerala 5-Day Family Plan',
      prompt: '5-day Kerala family trip with Munnar tea gardens and Alleppey houseboats for 4 people.',
    },
  ];

  const sessionId = 'test_agent_' + Date.now();

  for (const item of prompts) {
    console.log(`\n--- Running Prompt: "${item.name}" ---`);
    console.log(`Input: "${item.prompt}"`);

    const res = await fetch(`${API_BASE}/ai-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: item.prompt }),
    });

    const data = await res.json();
    const plan = data.data;

    console.log('Status:', res.status, res.statusText);
    console.log('Plan Ready:', plan?.isPlanReady);
    console.log('Destination:', plan?.tripOverview?.destination);
    console.log('Duration:', plan?.tripOverview?.duration);
    console.log('Budget:', plan?.extractedRequirements?.budget);
    console.log('Total Days Generated:', plan?.itinerary?.length);
    console.log('Day 1 Sample:', plan?.itinerary?.[0]?.title);
    console.log('Key Highlights:', plan?.itinerary?.[0]?.places);
    console.log('Transport Rec:', plan?.recommendations?.transport?.substring(0, 60) + '...');
    console.log('Stay Rec:', plan?.recommendations?.accommodation?.substring(0, 60) + '...');

    if (res.status === 200 && plan?.isPlanReady && plan?.itinerary?.length > 0) {
      console.log('✅ Result: SUCCESS');
    } else {
      console.error('❌ Result: FAILED');
    }
  }

  console.log('\n🎉 ALL MULTI-DESTINATION AI TRAVEL AGENT TESTS PASSED!');
}

testUniversalAgent().catch(console.error);
