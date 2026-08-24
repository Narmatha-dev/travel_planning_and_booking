const https = require('https');
const http = require('http');

/**
 * Offline known city bounding box database for instant lookup & network failure fallback
 */
const KNOWN_LOCATIONS = [
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', minLat: 12.8, maxLat: 13.3, minLng: 80.0, maxLng: 80.4 },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', minLat: 12.7, maxLat: 13.2, minLng: 77.4, maxLng: 77.8 },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', minLat: 18.8, maxLat: 19.3, minLng: 72.7, maxLng: 73.1 },
  { city: 'New Delhi', state: 'Delhi', country: 'India', minLat: 28.4, maxLat: 28.9, minLng: 76.9, maxLng: 77.4 },
  { city: 'Goa', state: 'Goa', country: 'India', minLat: 14.8, maxLat: 15.8, minLng: 73.6, maxLng: 74.4 },
  { city: 'Kochi', state: 'Kerala', country: 'India', minLat: 9.8, maxLat: 10.2, minLng: 76.1, maxLng: 76.5 },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', minLat: 17.2, maxLat: 17.6, minLng: 78.2, maxLng: 78.7 },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', minLat: 22.4, maxLat: 22.8, minLng: 88.2, maxLng: 88.6 },
  { city: 'Paris', state: 'Île-de-France', country: 'France', minLat: 48.7, maxLat: 49.0, minLng: 2.1, maxLng: 2.6 },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', minLat: 35.5, maxLat: 35.8, minLng: 139.5, maxLng: 140.0 },
  { city: 'Denpasar', state: 'Bali', country: 'Indonesia', minLat: -8.8, maxLat: -8.5, minLng: 115.0, maxLng: 115.4 },
  { city: 'New York', state: 'New York', country: 'United States', minLat: 40.5, maxLat: 40.9, minLng: -74.3, maxLng: -73.7 },
  { city: 'London', state: 'England', country: 'United Kingdom', minLat: 51.3, maxLat: 51.7, minLng: -0.5, maxLng: 0.3 },
  { city: 'Thira', state: 'Santorini', country: 'Greece', minLat: 36.3, maxLat: 36.5, minLng: 25.3, maxLng: 25.5 },
  { city: 'Interlaken', state: 'Bern', country: 'Switzerland', minLat: 46.5, maxLat: 46.8, minLng: 7.7, maxLng: 8.0 },
];

/**
 * Helper to fetch JSON via HTTPS with timeout
 */
function fetchJson(url, headers = {}, timeoutMs = 4000) {
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
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Reverse geocode request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

const locationService = {
  /**
   * Reverse geocodes latitude and longitude into city, state, country, and formatted address
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      const error = new Error('Invalid latitude or longitude coordinates provided');
      error.statusCode = 400;
      throw error;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const error = new Error('Coordinates are out of geographical bounds');
      error.statusCode = 400;
      throw error;
    }

    // 1. Try OpenStreetMap Nominatim API (Free, high-accuracy global geocoder)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetchJson(url, {
        'User-Agent': 'TraveloraTravelPlanner/1.0 (contact@travelplanner.com)',
        'Accept-Language': 'en',
      });

      if (response && response.address) {
        const addr = response.address;
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.suburb ||
          addr.county ||
          addr.state_district ||
          'Unknown City';
        const state = addr.state || addr.region || addr.province || '';
        const country = addr.country || '';

        const locationLabel = [city, state].filter(Boolean).join(', ');
        const fullAddress = response.display_name || [city, state, country].filter(Boolean).join(', ');

        return {
          latitude: lat,
          longitude: lng,
          city,
          state,
          country,
          locationLabel,
          formattedAddress: fullAddress,
          source: 'nominatim',
        };
      }
    } catch (apiError) {
      console.warn('[LocationService] Remote geocoder failed or timed out:', apiError.message);
    }

    // 2. Offline fallback lookup via known city coordinates
    const matched = KNOWN_LOCATIONS.find(
      (loc) => lat >= loc.minLat && lat <= loc.maxLat && lng >= loc.minLng && lng <= loc.maxLng
    );

    if (matched) {
      return {
        latitude: lat,
        longitude: lng,
        city: matched.city,
        state: matched.state,
        country: matched.country,
        locationLabel: `${matched.city}, ${matched.state}`,
        formattedAddress: `${matched.city}, ${matched.state}, ${matched.country}`,
        source: 'local_database',
      };
    }

    // 3. Coordinate fallback
    return {
      latitude: lat,
      longitude: lng,
      city: `${lat.toFixed(2)}°N`,
      state: `${lng.toFixed(2)}°E`,
      country: '',
      locationLabel: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      source: 'coordinates_fallback',
    };
  },

  /**
   * Calculates live route, road distance, and travel time between origin and destination (Phase 3)
   */
  async calculateRoute({
    originLat,
    originLng,
    destLat,
    destLng,
    travelMode = 'driving',
  }) {
    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      const error = new Error('Valid origin and destination coordinates are required');
      error.statusCode = 400;
      throw error;
    }

    const mode = (travelMode || 'driving').toLowerCase();
    const googleModeMap = {
      driving: 'driving',
      walking: 'walking',
      bicycling: 'bicycling',
      transit: 'transit',
    };

    const osrmProfileMap = {
      driving: 'driving',
      transit: 'driving',
      walking: 'walking',
      bicycling: 'cycling',
    };

    const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=${googleModeMap[mode] || 'driving'}`;

    // 1. Try Google Directions API if key configured in environment
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=${googleModeMap[mode] || 'driving'}&key=${googleApiKey}`;
        const gData = await fetchJson(gUrl, {}, 5000);
        if (gData.status === 'OK' && gData.routes && gData.routes[0]) {
          const leg = gData.routes[0].legs[0];
          const distKm = parseFloat((leg.distance.value / 1000).toFixed(1));
          return {
            distance_km: distKm,
            distance_text: leg.distance.text || `${distKm} km`,
            duration_seconds: leg.duration.value,
            duration_text: leg.duration.text,
            travel_mode: mode,
            start_address: leg.start_address,
            end_address: leg.end_address,
            overview_polyline: gData.routes[0].overview_polyline?.points || '',
            route_points: [
              [oLat, oLng],
              [dLat, dLng],
            ],
            google_maps_directions_url: googleMapsDirUrl,
            source: 'google_directions',
          };
        }
      } catch (gErr) {
        console.warn('[LocationService] Google Directions API query failed:', gErr.message);
      }
    }

    // 2. Try High-Performance OSRM Routing Engine (Roads & Highways turn-by-turn routing)
    const osrmProfile = osrmProfileMap[mode] || 'driving';
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/${osrmProfile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
      const osrmData = await fetchJson(osrmUrl, { 'User-Agent': 'TraveloraTravelPlanner/1.0' }, 4000);

      if (osrmData && osrmData.routes && osrmData.routes[0]) {
        const route = osrmData.routes[0];
        const distKm = parseFloat((route.distance / 1000).toFixed(1));
        let durationSec = Math.round(route.duration);

        // Adjust for mode speeds (walking @ 4.5km/h, bicycling @ 15km/h, transit @ 30km/h + transfer)
        if (mode === 'walking') {
          durationSec = Math.round((distKm / 4.5) * 3600);
        } else if (mode === 'bicycling') {
          durationSec = Math.round((distKm / 15) * 3600);
        } else if (mode === 'transit') {
          durationSec = Math.round((distKm / 30) * 3600 + 600);
        }

        const hrs = Math.floor(durationSec / 3600);
        const mins = Math.round((durationSec % 3600) / 60);
        const durationText = hrs > 0 ? `${hrs} hr ${mins} min` : `${Math.max(1, mins)} min`;

        const coordinates = route.geometry?.coordinates
          ? route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          : [
              [oLat, oLng],
              [dLat, dLng],
            ];

        return {
          distance_km: distKm,
          distance_text: `${distKm} km`,
          duration_seconds: durationSec,
          duration_text: durationText,
          travel_mode: mode,
          route_points: coordinates,
          google_maps_directions_url: googleMapsDirUrl,
          source: 'osrm_road_routing',
        };
      }
    } catch (osrmErr) {
      console.warn('[LocationService] OSRM routing failed or timed out:', osrmErr.message);
    }

    // 3. Fallback: Haversine distance with road winding and mode speed estimation
    const R = 6371;
    const dLatRad = ((dLat - oLat) * Math.PI) / 180;
    const dLonRad = ((dLng - oLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((oLat * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLonRad / 2) *
        Math.sin(dLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;
    const roadDistKm = parseFloat((straightDist * 1.25).toFixed(1)); // road curvature factor

    // Estimated speed in km/h
    const speeds = {
      driving: 50,
      transit: 32,
      bicycling: 15,
      walking: 4.5,
    };
    const speed = speeds[mode] || 50;
    const durationHours = roadDistKm / speed;
    const durationSec = Math.round(durationHours * 3600);
    const hrs = Math.floor(durationHours);
    const mins = Math.round((durationHours - hrs) * 60);
    const durationText = hrs > 0 ? `${hrs} hr ${mins} min` : `${Math.max(1, mins)} min`;

    return {
      distance_km: roadDistKm,
      distance_text: `${roadDistKm} km`,
      duration_seconds: durationSec,
      duration_text: durationText,
      travel_mode: mode,
      route_points: [
        [oLat, oLng],
        [parseFloat(((oLat + dLat) / 2).toFixed(4)), parseFloat(((oLng + dLng) / 2).toFixed(4))],
        [dLat, dLng],
      ],
      google_maps_directions_url: googleMapsDirUrl,
      source: 'road_distance_estimation',
    };
  },
};

module.exports = locationService;
