import api from './api';

const authService = {
  /**
   * Register a new account
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const data = response.data.data;
    if (data && data.token) {
      localStorage.setItem('travel_auth_token', data.token);
      localStorage.setItem('travel_auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Login with email and password
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const data = response.data.data;
    if (data && data.token) {
      localStorage.setItem('travel_auth_token', data.token);
      localStorage.setItem('travel_auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Fetch authenticated user profile
   */
  async getProfile() {
    const response = await api.get('/auth/profile');
    const user = response.data.data.user;
    localStorage.setItem('travel_auth_user', JSON.stringify(user));
    return user;
  },

  /**
   * Update profile
   */
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    const user = response.data.data.user;
    localStorage.setItem('travel_auth_user', JSON.stringify(user));
    return user;
  },

  /**
   * Logout user and clear tokens
   */
  logout() {
    localStorage.removeItem('travel_auth_token');
    localStorage.removeItem('travel_auth_user');
  },

  /**
   * Retrieve cached user from localStorage
   */
  getCurrentUser() {
    const userJson = localStorage.getItem('travel_auth_user');
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if token exists
   */
  getToken() {
    return localStorage.getItem('travel_auth_token');
  },
};

export default authService;
