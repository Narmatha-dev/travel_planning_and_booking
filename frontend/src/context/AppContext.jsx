import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import locationService from '../services/locationService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Location States (Phase 1)
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_current_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [locationStatus, setLocationStatus] = useState(() =>
    localStorage.getItem('travel_current_location') ? 'success' : 'idle'
  );
  const [locationError, setLocationError] = useState(null);

  // Transport Selection State (Phase 4)
  const [selectedTransport, setSelectedTransportState] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_selected_transport');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [transportPreference, setTransportPreferenceState] = useState(() => {
    return localStorage.getItem('travel_transport_preference') || 'any';
  });

  const setSelectedTransport = (transport) => {
    setSelectedTransportState(transport);
    if (transport) {
      localStorage.setItem('travel_selected_transport', JSON.stringify(transport));
    } else {
      localStorage.removeItem('travel_selected_transport');
    }
  };

  const setTransportPreference = (pref) => {
    setTransportPreferenceState(pref);
    localStorage.setItem('travel_transport_preference', pref);
  };

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
   * Detect current GPS location and reverse geocode (Phase 1)
   */
  const detectLocation = async () => {
    if (locationStatus === 'detecting') return;
    setLocationStatus('detecting');
    setLocationError(null);

    try {
      const data = await locationService.detectCurrentLocation();
      setCurrentLocation(data);
      setLocationStatus('success');
      localStorage.setItem('travel_current_location', JSON.stringify(data));
      return { success: true, data };
    } catch (err) {
      const isDenied = err.code === 'PERMISSION_DENIED';
      setLocationStatus(isDenied ? 'denied' : 'error');
      setLocationError(
        err.message ||
          'Location access is disabled. Please allow location permission to get personalized travel recommendations.'
      );
      return { success: false, error: err.message };
    }
  };

  // Auto-detect location when user signs in if not detected yet
  useEffect(() => {
    if (user && token && locationStatus === 'idle' && !currentLocation) {
      detectLocation();
    }
  }, [user, token]);

  /**
   * Login handler
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      // Trigger location prompt after login
      setTimeout(() => {
        detectLocation();
      }, 500);
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
      setTimeout(() => {
        detectLocation();
      }, 500);
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
    setTimeout(() => {
      detectLocation();
    }, 500);
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
      setTimeout(() => {
        detectLocation();
      }, 500);
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
    // Location Context (Phase 1)
    currentLocation,
    locationStatus,
    locationError,
    detectLocation,
    // Transport Context (Phase 4)
    selectedTransport,
    setSelectedTransport,
    transportPreference,
    setTransportPreference,
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
