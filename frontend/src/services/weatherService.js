import api from './api';

const weatherService = {
  /**
   * Fetches real-time current weather by coordinates or destination name/ID
   */
  async getCurrentWeather(params = {}) {
    const response = await api.get('/weather/current', { params });
    return response.data.data;
  },

  /**
   * Fetches multi-day weather forecast (up to 7 days)
   */
  async getWeatherForecast(params = {}) {
    const response = await api.get('/weather/forecast', { params });
    return response.data.data;
  },

  /**
   * Fetches complete weather bundle (current + 7-day forecast + places) for a destination
   */
  async getDestinationWeather(destinationIdOrSlug) {
    const response = await api.get(`/weather/destination/${encodeURIComponent(destinationIdOrSlug)}`);
    return response.data.data;
  },

  /**
   * Fetches indoor/outdoor place recommendations and suggestions
   */
  async getOutdoorIndoorSuggestions(destination) {
    const response = await api.get('/weather/suggestions', {
      params: { destination },
    });
    return response.data.data;
  },
};

export default weatherService;
