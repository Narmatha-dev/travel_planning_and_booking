/**
 * Phase 26: Weather-Based Smart Travel Planner Automated Test Suite
 */
const assert = require('assert');
const weatherService = require('../src/services/weatherService');
const aiTripService = require('../src/services/aiTripService');
const chatbotService = require('../src/services/chatbotService');

async function runTests() {
  console.log('\n================================================================');
  console.log('  🌦️ PHASE 26: WEATHER-BASED SMART TRAVEL PLANNER TESTS ');
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

  // 1. Destination Coordinates Resolution
  await test('1. Destination Coordinates Resolution (Ooty, Chennai, Mahabalipuram)', async () => {
    const ooty = weatherService.resolveCoordinates('Ooty');
    assert(ooty, 'Ooty coordinates should resolve');
    assert.strictEqual(Math.round(ooty.latitude), 11);
    assert.strictEqual(Math.round(ooty.longitude), 77);

    const chennai = weatherService.resolveCoordinates('Chennai');
    assert(chennai, 'Chennai coordinates should resolve');
    assert.strictEqual(Math.round(chennai.latitude), 13);
    assert.strictEqual(Math.round(chennai.longitude), 80);

    const mCity = weatherService.resolveCoordinates('Mahabalipuram');
    assert(mCity, 'Mahabalipuram coordinates should resolve');
  });

  // 2. Current Weather Retrieval
  await test('2. Current Weather Live Retrieval & Schema Verification', async () => {
    const data = await weatherService.getCurrentWeather(11.4102, 76.6950, 'Ooty');
    assert(data, 'Weather data should be returned');
    assert.strictEqual(data.location.city, 'Ooty');
    if (data.weather_available) {
      assert(typeof data.current.temperature === 'number', 'Temperature should be a number');
      assert(typeof data.current.condition === 'string', 'Condition should be a string');
      assert(typeof data.current.rain_probability === 'number', 'Rain probability should be a number');
      assert(['Good', 'Moderate', 'Poor'].includes(data.current.outdoor_suitability), 'Outdoor suitability should be Good, Moderate or Poor');
      assert(typeof data.current.smart_suggestion === 'string', 'Smart suggestion should exist');
      console.log(`     [Live Sample] Ooty Temp: ${data.current.temperature}°C, Condition: ${data.current.condition} ${data.current.icon}, Outdoor Suitability: ${data.current.outdoor_suitability}`);
    }
  });

  // 3. Multi-day Forecast
  await test('3. Multi-Day Weather Forecast (7 Days)', async () => {
    const forecast = await weatherService.getWeatherForecast(13.0827, 80.2707, 7, 'Chennai');
    assert(forecast, 'Forecast object should be returned');
    if (forecast.weather_available) {
      assert(forecast.days.length >= 5, 'Should return at least 5 forecast days');
      const firstDay = forecast.days[0];
      assert(firstDay.date, 'Day should have date');
      assert(firstDay.day_name, 'Day should have day_name');
      assert(typeof firstDay.temperature_max === 'number', 'Max temp should be number');
      assert(typeof firstDay.temperature_min === 'number', 'Min temp should be number');
      assert(typeof firstDay.rain_probability === 'number', 'Rain chance should be number');
      console.log(`     [Forecast Sample] Day 1 (${firstDay.day_name}): ${firstDay.icon} ${firstDay.temperature_max}°C / ${firstDay.temperature_min}°C, Rain: ${firstDay.rain_probability}%`);
    }
  });

  // 4. In-Memory Weather Cache Hit & Invalidation
  await test('4. In-Memory Weather Cache Hit and Expiry', async () => {
    weatherService.clearCache();
    assert.strictEqual(weatherService.getCacheStats().size, 0, 'Cache should be empty initially');

    // First call puts it into cache
    const call1 = await weatherService.getCurrentWeather(11.4102, 76.6950, 'Ooty');
    assert.strictEqual(weatherService.getCacheStats().size, 1, 'Cache size should be 1 after call');

    // Second call retrieves from cache
    const call2 = await weatherService.getCurrentWeather(11.4102, 76.6950, 'Ooty');
    assert.strictEqual(call2.is_cached, true, 'Second call should have is_cached: true');

    weatherService.clearCache();
    assert.strictEqual(weatherService.getCacheStats().size, 0, 'Cache cleared successfully');
  });

  // 5. Indoor vs Outdoor Place Categorization
  await test('5. Indoor vs Outdoor Places Catalog', async () => {
    const ootyPlaces = weatherService.getIndoorOutdoorCatalog('Ooty');
    assert(ootyPlaces.outdoor.length > 0, 'Should have outdoor places for Ooty');
    assert(ootyPlaces.indoor.length > 0, 'Should have indoor places for Ooty');
    assert(ootyPlaces.indoor.some((p) => p.name.includes('Museum') || p.name.includes('Wax') || p.name.includes('Church')), 'Should have indoor museums/heritage');
  });

  // 6. Weather-Aware AI Itinerary Generation
  await test('6. Weather-Aware AI Itinerary Optimization', async () => {
    const itinerary = await aiTripService.generateAiItinerary({
      destination: 'Ooty',
      numberOfDays: 3,
      travelers: 2,
      budget: 15000,
      travelPreference: 'nature',
      startDate: new Date().toISOString().split('T')[0],
      weatherAware: true,
    });

    assert(itinerary, 'Itinerary should be generated');
    assert.strictEqual(itinerary.days.length, 3, 'Should have 3 days');
    assert(itinerary.weatherSummary, 'Should have top-level weatherSummary');
    assert.strictEqual(itinerary.weatherSummary.weatherAwareEnabled, true);

    const day1 = itinerary.days[0];
    assert(day1.weather, 'Day 1 should have weather object');
    assert(day1.weatherAdvice, 'Day 1 should have weatherAdvice');
    console.log(`     [Itinerary Day 1 Weather]: ${day1.weather.condition || 'Forecast'} (${day1.weather.temperature_max || 22}°C) -> Advice: "${day1.weatherAdvice}"`);
  });

  // 7. AI Chatbot Weather Query Handling (English & Tamil)
  await test('7. AI Travel Chatbot Live Weather Queries (English & Tamil)', async () => {
    // English query
    const resEn = await chatbotService.processMessage('test_session_w1', "What is the weather in Ooty?", { preferredLang: 'en' });
    assert(resEn.reply, 'Should have chatbot reply');
    assert(resEn.reply.includes('Weather') || resEn.reply.includes('Ooty'), 'Reply should address weather in Ooty');
    assert(resEn.suggestions.length > 0, 'Should return quick suggestions');

    // Tamil query
    const resTa = await chatbotService.processMessage('test_session_w2', "ஊட்டி வானிலை எப்படி இருக்கிறது?", { preferredLang: 'ta' });
    assert(resTa.reply, 'Should have Tamil chatbot reply');
    assert(resTa.reply.includes('வானிலை') || resTa.reply.includes('வெப்பநிலை') || resTa.reply.includes('Ooty'), 'Reply should be in Tamil for weather');
  });

  // 8. Error Handling & Validation
  await test('8. Coordinates Validation & Error Boundaries', async () => {
    let errorCaught = false;
    try {
      await weatherService.getCurrentWeather(999, 999);
    } catch (e) {
      errorCaught = true;
      assert.strictEqual(e.statusCode, 400);
    }
    assert(errorCaught, 'Should catch invalid coordinates error');
  });

  console.log('\n================================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
