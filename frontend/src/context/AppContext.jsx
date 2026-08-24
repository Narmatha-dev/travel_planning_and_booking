import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [trips, setTrips] = useState([
    { id: 1, destination: 'Santorini', date: '12 Aug 2026', status: 'Confirmed' },
    { id: 2, destination: 'Bali', date: '03 Sep 2026', status: 'Planning' },
  ]);

  // Load authenticated user profile from backend on app startup
  useEffect(() => {
    async function loadUser() {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          console.warn('Session check failed or expired:', error.message);
          authService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }

    loadUser();

    // Listen for auth expiration events from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('travel_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('travel_auth_expired', handleAuthExpired);
  }, []);

  /**
   * Login handler
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      setAuthError(message);
      return { success: false, message };
    }
  };

  /**
   * Register handler
   */
  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      setAuthError(message);
      return { success: false, message };
    }
  };

  /**
   * OAuth Success handler
   */
  const handleOAuthSuccess = (authToken, authUserData) => {
    authService.saveAuthSession(authToken, authUserData);
    setToken(authToken);
    setUser(authUserData);
    setAuthError(null);
  };

  /**
   * Google ID Token Login handler
   */
  const loginWithGoogleToken = async (idToken) => {
    setAuthError(null);
    try {
      const data = await authService.googleTokenLogin(idToken);
      setUser(data.user);
      setToken(data.token);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Google authentication failed';
      setAuthError(message);
      return { success: false, message };
    }
  };

  /**
   * Logout handler
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  /**
   * Update profile handler
   */
  const updateUserProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Update failed';
      return { success: false, message };
    }
  };

  const value = {
    user,
    setUser,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    authError,
    setAuthError,
    login,
    register,
    handleOAuthSuccess,
    loginWithGoogleToken,
    logout,
    updateUserProfile,
    trips,
    setTrips,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
