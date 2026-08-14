import axios from 'axios';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create configured Axios client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travel_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local storage
      const currentToken = localStorage.getItem('travel_auth_token');
      if (currentToken && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('travel_auth_token');
        localStorage.removeItem('travel_auth_user');
        // Dispatch custom event to notify AppContext if needed
        window.dispatchEvent(new Event('travel_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
