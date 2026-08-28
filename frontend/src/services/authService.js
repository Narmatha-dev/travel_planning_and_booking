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
   * Dedicated Admin Login
   */
  async adminLogin(credentials) {
    const response = await api.post('/auth/admin/login', credentials);
    const data = response.data.data;
    if (data && data.token) {
      localStorage.setItem('travel_auth_token', data.token);
      localStorage.setItem('travel_auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Get Google OAuth redirect URL
   */
  getGoogleAuthUrl(redirectPath = '/') {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${apiBase}/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
  },

  /**
   * Authenticate with direct Google ID Token / Credential
   */
  async googleTokenLogin(idToken) {
    const response = await api.post('/auth/google', { idToken });
    const data = response.data.data;
    if (data && data.token) {
      localStorage.setItem('travel_auth_token', data.token);
      localStorage.setItem('travel_auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Save OAuth session tokens from callback
   */
  saveAuthSession(token, user) {
    if (token) {
      localStorage.setItem('travel_auth_token', token);
    }
    if (user) {
      localStorage.setItem('travel_auth_user', typeof user === 'string' ? user : JSON.stringify(user));
    }
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
