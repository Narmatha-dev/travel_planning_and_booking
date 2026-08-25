import api from './api';

const locationService = {
  /**
   * Check browser geolocation permission state ('granted' | 'denied' | 'prompt')
   */
  async getPermissionState() {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state; // 'granted' | 'denied' | 'prompt'
      } catch (err) {
        console.warn('[Location] Permissions query not supported:', err.message);
        return 'prompt';
      }
    }
    return 'prompt';
  },

  /**
   * Requests GPS coordinates from the browser Geolocation API
   * Implements robust two-tier fallback: High Accuracy -> Standard Accuracy
   */
  getCurrentCoordinates() {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const error = new Error('Geolocation is not supported by your browser.');
        error.code = 'NOT_SUPPORTED';
        return reject(error);
      }

      // Step 1: Attempt high accuracy first
      const highAccuracyOptions = {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0,
      };

      const fallbackLowAccuracyOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      };

      const mapGeoError = (geoError) => {
        const error = new Error();
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            error.code = 'PERMISSION_DENIED';
            error.message =
              'Location access is blocked. Please enable location permission in your browser settings.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            error.code = 'POSITION_UNAVAILABLE';
            error.message = 'Location information is unavailable on this device.';
            break;
          case geoError.TIMEOUT:
            error.code = 'TIMEOUT';
            error.message = 'Location request timed out. Please try again.';
            break;
          default:
            error.code = 'UNKNOWN_ERROR';
            error.message = geoError.message || 'An unknown error occurred while retrieving location.';
        }
        return error;
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (highAccError) => {
          // If user explicitly denied, do not retry
          if (highAccError.code === highAccError.PERMISSION_DENIED) {
            return reject(mapGeoError(highAccError));
          }

          console.warn('[Location] High accuracy failed, attempting standard accuracy fallback...');
          // Step 2: Fallback to standard accuracy
          navigator.geolocation.getCurrentPosition(
            (fallbackPosition) => {
              resolve({
                latitude: fallbackPosition.coords.latitude,
                longitude: fallbackPosition.coords.longitude,
                accuracy: fallbackPosition.coords.accuracy,
              });
            },
            (fallbackError) => {
              reject(mapGeoError(fallbackError));
            },
            fallbackLowAccuracyOptions
          );
        },
        highAccuracyOptions
      );
    });
  },

  /**
   * Reverse geocodes coordinates into city/state via backend API
   */
  async reverseGeocode(latitude, longitude) {
    const response = await api.get('/location/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
    });
    return response.data.data;
  },

  /**
   * High-level helper: Fetches real browser GPS and reverse-geocodes in one seamless step
   */
  async detectCurrentLocation() {
    const coords = await this.getCurrentCoordinates();

    let geocoded = null;
    try {
      geocoded = await this.reverseGeocode(coords.latitude, coords.longitude);
    } catch (geoErr) {
      console.warn('[Location] Reverse geocoding endpoint failed, using coordinates fallback:', geoErr.message);
      geocoded = {
        city: 'Detected Location',
        state: '',
        country: 'India',
        formatted_address: `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`,
      };
    }

    return {
      ...geocoded,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      detectedAt: new Date().toISOString(),
      isManual: false,
    };
  },

  /**
   * Calculates live route, road distance, and travel time between origin and destination (Phase 3)
   */
  async getRouteDirections({ originLat, originLng, destLat, destLng, travelMode = 'driving' }) {
    const response = await api.get('/location/route', {
      params: {
        originLat,
        originLng,
        destLat,
        destLng,
        mode: travelMode,
      },
    });
    return response.data.data;
  },

  /**
   * Fetches map configuration (Google Maps API Key)
   */
  async getMapConfig() {
    const response = await api.get('/location/map-config');
    return response.data.data;
  },
};

export default locationService;
