import api from './api';

const locationService = {
  /**
   * Requests GPS coordinates from the browser Geolocation API
   */
  getCurrentCoordinates() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by your browser.');
        error.code = 'NOT_SUPPORTED';
        return reject(error);
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (geoError) => {
          const error = new Error();
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              error.code = 'PERMISSION_DENIED';
              error.message =
                'Location access is disabled. Please allow location permission to get personalized travel recommendations.';
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
          reject(error);
        },
        options
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
   * High-level helper: Fetches GPS and reverse-geocodes in one step
   */
  async detectCurrentLocation() {
    const coords = await this.getCurrentCoordinates();
    const geocoded = await this.reverseGeocode(coords.latitude, coords.longitude);
    return {
      ...geocoded,
      accuracy: coords.accuracy,
      detectedAt: new Date().toISOString(),
    };
  },
};

export default locationService;
