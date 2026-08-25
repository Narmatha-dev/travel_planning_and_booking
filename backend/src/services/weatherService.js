const https = require('https');
const http = require('http');
const config = require('../config/environment');

/**
 * Standard Coordinates Directory for Major Tourist Destinations
 */
const KNOWN_DESTINATION_COORDINATES = {
  ooty: { latitude: 11.4102, longitude: 76.6950, city: 'Ooty', state: 'Tamil Nadu', country: 'India' },
  mahabalipuram: { latitude: 12.6208, longitude: 80.1944, city: 'Mahabalipuram', state: 'Tamil Nadu', country: 'India' },
  chennai: { latitude: 13.0827, longitude: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  kanyakumari: { latitude: 8.0883, longitude: 77.5385, city: 'Kanyakumari', state: 'Tamil Nadu', country: 'India' },
  goa: { latitude: 15.2993, longitude: 74.1240, city: 'Goa', state: 'Goa', country: 'India' },
  kerala: { latitude: 9.9312, longitude: 76.2673, city: 'Kochi', state: 'Kerala', country: 'India' },
  kochi: { latitude: 9.9312, longitude: 76.2673, city: 'Kochi', state: 'Kerala', country: 'India' },
  munnar: { latitude: 10.0889, longitude: 77.0595, city: 'Munnar', state: 'Kerala', country: 'India' },
  bengaluru: { latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  mumbai: { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  delhi: { latitude: 28.6139, longitude: 77.2090, city: 'New Delhi', state: 'Delhi', country: 'India' },
  paris: { latitude: 48.8566, longitude: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
  tokyo: { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
  bali: { latitude: -8.4095, longitude: 115.1889, city: 'Bali', state: 'Bali', country: 'Indonesia' },
  swiss: { latitude: 45.9765, longitude: 7.7491, city: 'Zermatt', state: 'Valais', country: 'Switzerland' },
  switzerland: { latitude: 45.9765, longitude: 7.7491, city: 'Zermatt', state: 'Valais', country: 'Switzerland' },
  santorini: { latitude: 36.3932, longitude: 25.4615, city: 'Santorini', state: 'Cyclades', country: 'Greece' },
  london: { latitude: 51.5074, longitude: -0.1278, city: 'London', state: 'England', country: 'United Kingdom' },
  newyork: { latitude: 40.7128, longitude: -74.0060, city: 'New York', state: 'New York', country: 'United States' },
};

/**
 * Curated Indoor vs Outdoor places catalog by destination
 */
const DESTINATION_PLACES_CATALOG = {
  ooty: {
    outdoor: [
      { name: 'Government Botanical Garden', category: 'nature', type: 'outdoor', reason: '55-acre heritage garden with expansive lush lawns and rare tree species.' },
      { name: 'Doddabetta Peak Viewpoint', category: 'viewpoint', type: 'outdoor', reason: 'Highest Nilgiri peak with open-air panoramic valley observation.' },
      { name: 'Ooty Boat House & Lake', category: 'lake', type: 'outdoor', reason: 'Scenic pedal and motor boating on Ooty lake.' },
      { name: 'Government Rose Garden', category: 'nature', type: 'outdoor', reason: 'Tiered floral terraces with thousands of exotic hybrid roses.' },
      { name: 'Pykara Waterfalls & Pine Forest', category: 'waterfall', type: 'outdoor', reason: 'Pristine mountain river cascades and wooded nature trails.' },
    ],
    indoor: [
      { name: 'Nilgiri Tea Museum & Chocolate Factory', category: 'museum', type: 'indoor', reason: 'Sheltered tea processing factory tour and artisanal chocolate tasting.' },
      { name: 'Wax World Museum Ooty', category: 'museum', type: 'indoor', reason: 'Indoor lifelike wax statues depicting Indian heritage and historical figures.' },
      { name: 'Tribal Research Centre & Heritage Museum', category: 'museum', type: 'indoor', reason: 'Covered anthropological collection of Nilgiri indigenous culture.' },
      { name: 'St. Stephen’s Historic Church', category: 'cultural', type: 'indoor', reason: '19th-century colonial wood architecture with historic stained glass windows.' },
      { name: 'Commercial Road Indoor Tea & Spice Arcade', category: 'shopping', type: 'indoor', reason: 'Covered shopping market for fresh Nilgiri tea, spices, and handmade chocolates.' },
    ],
  },
  mahabalipuram: {
    outdoor: [
      { name: 'Shore Temple Complex', category: 'beach', type: 'outdoor', reason: '7th-century coastal UNESCO World Heritage granite monument by the sea.' },
      { name: 'Pancha Rathas (Five Rathas)', category: 'historical', type: 'outdoor', reason: 'Monolithic open-air rock-cut shrines carved from solid granite boulders.' },
      { name: 'Arjuna’s Penance & Krishna’s Butter Ball', category: 'historical', type: 'outdoor', reason: 'Gigantic open-air bas-relief sculpture and hillside rock park.' },
      { name: 'Mahabalipuram Beach Promenade', category: 'beach', type: 'outdoor', reason: 'Coastal seaside stroll with fresh sea breeze.' },
    ],
    indoor: [
      { name: 'DakshinaChitra Living Heritage Museum', category: 'museum', type: 'indoor', reason: 'Covered traditional architecture museum showcasing South Indian folk arts.' },
      { name: 'Heritage Maritime & Sculpture Museum', category: 'museum', type: 'indoor', reason: 'Indoor galleries with historic nautical relics and ancient Pallava artifacts.' },
      { name: 'Mahabalipuram Lighthouse Heritage Gallery', category: 'museum', type: 'indoor', reason: 'Sheltered museum gallery detailing navigational beacon history.' },
      { name: 'Artisan Stone Sculpture Studios & Gallery', category: 'shopping', type: 'indoor', reason: 'Covered workshops with master stone sculptors creating intricate granite art.' },
    ],
  },
  chennai: {
    outdoor: [
      { name: 'Marina Beach Promenade', category: 'beach', type: 'outdoor', reason: 'World’s second-longest urban natural beach.' },
      { name: 'Guindy National Park', category: 'nature', type: 'outdoor', reason: 'Protected metropolitan forest with blackbucks and deer.' },
      { name: 'Elliot’s Beach (Besant Nagar)', category: 'beach', type: 'outdoor', reason: 'Clean coastal promenade with sea breeze.' },
    ],
    indoor: [
      { name: 'Government Museum & National Art Gallery Egmore', category: 'museum', type: 'indoor', reason: 'Rich collections of Roman relics, bronze statues, and traditional paintings.' },
      { name: 'Fort Museum & St. Mary’s Church', category: 'museum', type: 'indoor', reason: 'First British fortress in India with historic weapons and documents.' },
      { name: 'Birla Planetarium & Science Centre', category: 'indoor_attraction', type: 'indoor', reason: 'Indoor 360-degree sky theatre and interactive physics exhibits.' },
      { name: 'Express Avenue & Phoenix Marketcity', category: 'shopping', type: 'indoor', reason: 'Large modern climate-controlled shopping, dining, and entertainment centers.' },
    ],
  },
  kanyakumari: {
    outdoor: [
      { name: 'Vivekananda Rock Memorial & Ferry', category: 'historical', type: 'outdoor', reason: 'Sacred island rock memorial surrounded by three oceans.' },
      { name: 'Thiruvalluvar 133-ft Stone Statue', category: 'historical', type: 'outdoor', reason: 'Massive offshore statue honoring the ancient Tamil poet.' },
      { name: 'Triveni Sangam Sunset Point', category: 'viewpoint', type: 'outdoor', reason: 'Tri-sea convergence view at the southern tip of India.' },
    ],
    indoor: [
      { name: 'Padmanabhapuram Wooden Palace', category: 'historical', type: 'indoor', reason: '16th-century sheltered royal palace with exquisite rosewood carvings.' },
      { name: 'Vivekananda Pictorial Exhibition & Museum', category: 'museum', type: 'indoor', reason: 'Indoor gallery depicting Swami Vivekananda’s life and philosophy.' },
      { name: 'Government Museum Kanyakumari', category: 'museum', type: 'indoor', reason: 'Sheltered displays of rare coins, ancient sculptures, and marine specimens.' },
    ],
  },
  default: {
    outdoor: [
      { name: 'Scenic City Viewpoint & Public Park', category: 'nature', type: 'outdoor', reason: 'Open-air observation point with panoramic skyline and nature vistas.' },
      { name: 'Historic Heritage Walking Trail', category: 'sightseeing', type: 'outdoor', reason: 'Self-guided outdoor promenade exploring landmark architecture.' },
      { name: 'Local Lake & Botanical Gardens', category: 'nature', type: 'outdoor', reason: 'Lush greenery, fresh open air, and relaxed walking pathways.' },
    ],
    indoor: [
      { name: 'City Heritage & Art Museum', category: 'museum', type: 'indoor', reason: 'Climate-controlled exhibitions showcasing local history, culture, and art.' },
      { name: 'Regional Crafts & Artisan Centre', category: 'shopping', type: 'indoor', reason: 'Covered market featuring authentic regional handicrafts and delicacies.' },
      { name: 'Historic Covered Cathedral / Monument', category: 'cultural', type: 'indoor', reason: 'Sheltered historic sanctum with architectural and cultural heritage.' },
    ],
  },
};

/**
 * In-memory Short-Lived Cache (15 minutes TTL)
 */
class WeatherCache {
  constructor(ttlMs = 15 * 60 * 1000) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
      cachedAt: new Date().toISOString(),
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

const weatherCache = new WeatherCache(15 * 60 * 1000); // 15 mins

/**
 * Low-level HTTP/HTTPS JSON fetcher with timeout
 */
function fetchJson(url, headers = {}, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const req = client.get(url, { headers, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            const err = new Error(`HTTP ${res.statusCode}: ${data}`);
            err.statusCode = res.statusCode;
            reject(err);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Weather API request timed out');
      err.code = 'TIMEOUT';
      reject(err);
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Standard WMO Weather Code Interpreter
 */
function interpretWmoCode(code) {
  const c = parseInt(code, 10);
  switch (c) {
    case 0:
      return { condition: 'Clear Sky', icon: '☀️', category: 'clear', isRainy: false };
    case 1:
      return { condition: 'Mainly Clear', icon: '🌤️', category: 'clear', isRainy: false };
    case 2:
      return { condition: 'Partly Cloudy', icon: '⛅', category: 'cloudy', isRainy: false };
    case 3:
      return { condition: 'Overcast', icon: '☁️', category: 'cloudy', isRainy: false };
    case 45:
    case 48:
      return { condition: 'Foggy', icon: '🌫️', category: 'fog', isRainy: false };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', icon: '🌦️', category: 'drizzle', isRainy: true };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', icon: '🌧️', category: 'drizzle', isRainy: true };
    case 61:
      return { condition: 'Light Rain', icon: '🌧️', category: 'rain', isRainy: true };
    case 63:
      return { condition: 'Moderate Rain', icon: '🌧️', category: 'rain', isRainy: true };
    case 65:
      return { condition: 'Heavy Rain', icon: '🌧️', category: 'heavy_rain', isRainy: true };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', icon: '🌧️', category: 'rain', isRainy: true };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: 'Snow', icon: '❄️', category: 'snow', isRainy: false };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: '🌧️', category: 'rain', isRainy: true };
    case 85:
    case 86:
      return { condition: 'Snow Showers', icon: '🌨️', category: 'snow', isRainy: false };
    case 95:
      return { condition: 'Thunderstorm', icon: '⛈️', category: 'thunderstorm', isRainy: true };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with Hail', icon: '⛈️', category: 'thunderstorm', isRainy: true };
    default:
      return { condition: 'Partly Sunny', icon: '🌤️', category: 'clear', isRainy: false };
  }
}

/**
 * Calculates Transparent Outdoor Suitability Score & Smart Suggestions
 */
function calculateOutdoorSuitability({ temp, rainChance, windSpeed, weatherCategory, isRainy }) {
  let score = 'Good';
  let badgeColor = '#16a34a';
  let suggestion = 'Good weather for outdoor sightseeing, nature trails, and panoramic viewpoints.';

  const rChance = parseInt(rainChance, 10) || 0;
  const wind = parseFloat(windSpeed) || 0;
  const temperature = parseFloat(temp);

  // Severe rain / thunderstorm / snow / high wind
  if (
    weatherCategory === 'thunderstorm' ||
    weatherCategory === 'heavy_rain' ||
    rChance > 65 ||
    wind > 45 ||
    temperature > 42 ||
    temperature < 2
  ) {
    score = 'Poor';
    badgeColor = '#dc2626';
    if (rChance > 65 || isRainy) {
      suggestion = 'Rain is likely. Consider indoor attractions, heritage museums, and cultural centers.';
    } else if (wind > 45) {
      suggestion = 'Strong wind is forecast. Check local conditions before outdoor coastal or cliffside activities.';
    } else {
      suggestion = 'Extreme temperatures forecast. Plan indoor visits or carry appropriate protective gear.';
    }
  }
  // Moderate conditions
  else if (
    rChance >= 30 ||
    weatherCategory === 'drizzle' ||
    weatherCategory === 'rain' ||
    wind > 28 ||
    temperature > 36 ||
    temperature < 10
  ) {
    score = 'Moderate';
    badgeColor = '#d97706';
    if (rChance >= 30) {
      suggestion = 'Possibility of scattered showers. Carry an umbrella and balance outdoor stops with indoor visits.';
    } else if (wind > 28) {
      suggestion = 'Breezy conditions forecast. Great for relaxed walks, but stay alert near coastal water activities.';
    } else {
      suggestion = 'Warm conditions. Stay hydrated and schedule outdoor activities during cooler morning or evening hours.';
    }
  }

  return { score, badgeColor, suggestion };
}

const weatherService = {
  /**
   * Resolves destination name or ID into geographic coordinates
   */
  resolveCoordinates(destination) {
    if (!destination) return null;

    if (typeof destination === 'object') {
      if (destination.latitude && destination.longitude) {
        return {
          latitude: parseFloat(destination.latitude),
          longitude: parseFloat(destination.longitude),
          city: destination.city || destination.name || 'Destination',
          state: destination.state || '',
          country: destination.country || '',
        };
      }
    }

    const key = String(destination).trim().toLowerCase();
    for (const [knownKey, coords] of Object.entries(KNOWN_DESTINATION_COORDINATES)) {
      if (key.includes(knownKey)) {
        return coords;
      }
    }

    return null;
  },

  /**
   * Fetches Real-time Current Weather for GPS coordinates or city name
   */
  async getCurrentWeather(latitude, longitude, cityName = null) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const error = new Error('Valid latitude (-90 to 90) and longitude (-180 to 180) are required');
      error.statusCode = 400;
      throw error;
    }

    const cacheKey = `curr_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached) {
      return { ...cached, is_cached: true };
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const raw = await fetchJson(url, {
        'User-Agent': 'TraveloraWeatherService/1.0',
      });

      if (!raw || !raw.current) {
        throw new Error('Weather API returned invalid payload');
      }

      const current = raw.current;
      const wmo = interpretWmoCode(current.weather_code);
      const rainProbability = raw.daily?.precipitation_probability_max?.[0] !== undefined
        ? raw.daily.precipitation_probability_max[0]
        : (current.precipitation > 0 ? 80 : 10);

      const suitability = calculateOutdoorSuitability({
        temp: current.temperature_2m,
        rainChance: rainProbability,
        windSpeed: current.wind_speed_10m,
        weatherCategory: wmo.category,
        isRainy: wmo.isRainy,
      });

      // Check official/extreme alerts
      let alert = null;
      if (current.weather_code >= 95 || rainProbability >= 85 || current.wind_speed_10m >= 55) {
        alert = {
          title: 'Official Weather Advisory',
          severity: current.weather_code >= 95 ? 'warning' : 'advisory',
          description: `Active weather advisory for ${cityName || 'this region'}: High probability of ${wmo.condition.toLowerCase()} and wind gusts up to ${Math.round(current.wind_speed_10m)} km/h. Please follow local guidelines.`,
        };
      }

      const result = {
        weather_available: true,
        location: {
          city: cityName || 'Detected Coordinates',
          latitude: lat,
          longitude: lng,
          timezone: raw.timezone || 'UTC',
        },
        current: {
          temperature: Math.round(current.temperature_2m),
          temperature_unit: '°C',
          apparent_temperature: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          humidity_unit: '%',
          condition: wmo.condition,
          icon: wmo.icon,
          weather_code: current.weather_code,
          category: wmo.category,
          rain_probability: rainProbability,
          wind_speed: Math.round(current.wind_speed_10m),
          wind_unit: 'km/h',
          wind_direction: current.wind_direction_10m,
          outdoor_suitability: suitability.score,
          outdoor_badge_color: suitability.badgeColor,
          smart_suggestion: suitability.suggestion,
          is_rainy: wmo.isRainy,
          alert,
          timestamp: current.time || new Date().toISOString(),
        },
        attribution: 'Live data powered by Open-Meteo Global Forecast Services',
      };

      weatherCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[WeatherService] Live fetch fallback:', err.message);

      // Return a robust, non-breaking fallback state
      return {
        weather_available: false,
        message: 'Weather information is temporarily unavailable.',
        location: {
          city: cityName || 'Destination',
          latitude: lat,
          longitude: lng,
        },
        current: null,
      };
    }
  },

  /**
   * Fetches Multi-Day Weather Forecast (up to 7 days)
   */
  async getWeatherForecast(latitude, longitude, days = 7, cityName = null) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const numDays = Math.max(1, Math.min(14, parseInt(days, 10) || 7));

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const error = new Error('Valid latitude and longitude coordinates are required');
      error.statusCode = 400;
      throw error;
    }

    const cacheKey = `fc_${lat.toFixed(2)}_${lng.toFixed(2)}_${numDays}`;
    const cached = weatherCache.get(cacheKey);
    if (cached) {
      return { ...cached, is_cached: true };
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=${numDays}&timezone=auto`;
      const raw = await fetchJson(url, {
        'User-Agent': 'TraveloraWeatherService/1.0',
      });

      if (!raw || !raw.daily) {
        throw new Error('Forecast API returned invalid payload');
      }

      const daily = raw.daily;
      const forecastDays = [];

      for (let i = 0; i < (daily.time?.length || 0); i++) {
        const dateStr = daily.time[i];
        const code = daily.weather_code[i];
        const wmo = interpretWmoCode(code);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const rainChance = daily.precipitation_probability_max?.[i] !== undefined
          ? daily.precipitation_probability_max[i]
          : (daily.precipitation_sum?.[i] > 0 ? 70 : 10);
        const wind = Math.round(daily.wind_speed_10m_max?.[i] || 15);

        const suitability = calculateOutdoorSuitability({
          temp: maxTemp,
          rainChance,
          windSpeed: wind,
          weatherCategory: wmo.category,
          isRainy: wmo.isRainy,
        });

        const dayDate = new Date(dateStr);
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });

        forecastDays.push({
          day_index: i + 1,
          date: dateStr,
          day_name: dayName,
          temperature_max: maxTemp,
          temperature_min: minTemp,
          temperature_unit: '°C',
          condition: wmo.condition,
          icon: wmo.icon,
          weather_code: code,
          category: wmo.category,
          rain_probability: rainChance,
          precipitation_sum: daily.precipitation_sum?.[i] || 0,
          wind_speed: wind,
          wind_unit: 'km/h',
          outdoor_suitability: suitability.score,
          outdoor_badge_color: suitability.badgeColor,
          smart_suggestion: suitability.suggestion,
          is_rainy: wmo.isRainy,
        });
      }

      const result = {
        weather_available: true,
        location: {
          city: cityName || 'Destination',
          latitude: lat,
          longitude: lng,
          timezone: raw.timezone || 'UTC',
        },
        forecast_period: `${forecastDays[0]?.date || ''} to ${forecastDays[forecastDays.length - 1]?.date || ''}`,
        total_days: forecastDays.length,
        days: forecastDays,
        attribution: 'Forecast data powered by Open-Meteo Global Models',
      };

      weatherCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[WeatherService] Forecast fetch fallback:', err.message);

      return {
        weather_available: false,
        message: 'Weather forecast is temporarily unavailable.',
        location: {
          city: cityName || 'Destination',
          latitude: lat,
          longitude: lng,
        },
        days: [],
      };
    }
  },

  /**
   * Resolves weather by destination ID or name
   */
  async getWeatherByDestination(destinationIdOrName) {
    if (!destinationIdOrName) {
      const error = new Error('Destination name or ID is required');
      error.statusCode = 400;
      throw error;
    }

    const coords = this.resolveCoordinates(destinationIdOrName);
    if (!coords) {
      return {
        weather_available: false,
        message: `Coordinates could not be resolved for '${destinationIdOrName}'. Weather unavailable.`,
      };
    }

    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(coords.latitude, coords.longitude, coords.city),
      this.getWeatherForecast(coords.latitude, coords.longitude, 7, coords.city),
    ]);

    const suggestions = this.getIndoorOutdoorCatalog(coords.city);

    return {
      destination: coords.city,
      state: coords.state,
      country: coords.country,
      latitude: coords.latitude,
      longitude: coords.longitude,
      current: current.current || null,
      forecast: forecast.days || [],
      weather_available: current.weather_available || forecast.weather_available,
      outdoor_places: suggestions.outdoor,
      indoor_places: suggestions.indoor,
    };
  },

  /**
   * Returns curated indoor and outdoor places for a destination
   */
  getIndoorOutdoorCatalog(destinationName) {
    const rawKey = String(destinationName || '').toLowerCase();
    let matchedKey = 'default';

    if (rawKey.includes('ooty') || rawKey.includes('nilgiri')) matchedKey = 'ooty';
    else if (rawKey.includes('mahabalipuram') || rawKey.includes('mamallapuram')) matchedKey = 'mahabalipuram';
    else if (rawKey.includes('chennai') || rawKey.includes('madras')) matchedKey = 'chennai';
    else if (rawKey.includes('kanya')) matchedKey = 'kanyakumari';

    return DESTINATION_PLACES_CATALOG[matchedKey] || DESTINATION_PLACES_CATALOG.default;
  },

  /**
   * Clears the in-memory weather cache (for tests or manual refresh)
   */
  clearCache() {
    weatherCache.clear();
  },

  /**
   * Returns cache stats
   */
  getCacheStats() {
    return { size: weatherCache.size() };
  },
};

module.exports = weatherService;
