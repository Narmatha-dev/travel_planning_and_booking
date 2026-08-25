import api from './api';

const placesSearchService = {
  /**
   * Search for any place worldwide
   */
  async searchPlaces(query, { latitude, longitude, radius = 50000, language = 'en' } = {}) {
    if (!query || !query.trim()) return { places: [], primaryMatch: null };

    const params = {
      q: query.trim(),
      lat: latitude,
      lng: longitude,
      radius,
      lang: language,
    };

    const response = await api.get('/places/search', { params });
    return response.data?.data || { places: [], primaryMatch: null };
  },

  /**
   * Autocomplete predictions while typing
   */
  async getAutocomplete(input, { latitude, longitude } = {}) {
    if (!input || !input.trim()) return { suggestions: [] };

    const params = {
      input: input.trim(),
      lat: latitude,
      lng: longitude,
    };

    const response = await api.get('/places/autocomplete', { params });
    return response.data?.data || { suggestions: [] };
  },

  /**
   * Single place details
   */
  async getPlaceDetails(placeId, { language = 'en' } = {}) {
    if (!placeId) return null;
    const response = await api.get(`/places/details/${encodeURIComponent(placeId)}`, {
      params: { lang: language },
    });
    return response.data?.data || null;
  },
};

export default placesSearchService;
