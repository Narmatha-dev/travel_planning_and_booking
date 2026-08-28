import axios from 'axios';

/**
 * Normalizes the API Base URL from Vite environment variable (VITE_API_URL).
 * Defaults to live Render backend in production and localhost:5000 in development.
 */
export function getApiBaseUrl() {
  const isProduction = import.meta.env.PROD;
  const defaultUrl = isProduction
    ? 'https://travel-planning-and-booking-backend.onrender.com'
    : 'http://localhost:5000';
  const rawUrl = import.meta.env.VITE_API_URL || defaultUrl;
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

// Create configured Axios client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
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
      const currentToken = localStorage.getItem('travel_auth_token');
      if (currentToken && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('travel_auth_token');
        localStorage.removeItem('travel_auth_user');
        window.dispatchEvent(new Event('travel_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
