import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import locationService from '../services/locationService';
import notificationService from '../services/notificationService';
import favoriteService from '../services/favoriteService';

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

  // Hotel / Accommodation Selection State (Phase 7)
  const [selectedHotel, setSelectedHotelState] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_selected_hotel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSelectedHotel = (hotel) => {
    setSelectedHotelState(hotel);
    if (hotel) {
      localStorage.setItem('travel_selected_hotel', JSON.stringify(hotel));
    } else {
      localStorage.removeItem('travel_selected_hotel');
    }
  };

  const [trips, setTrips] = useState([
    { id: 1, destination: 'Santorini', date: '12 Aug 2026', status: 'Confirmed' },
    { id: 2, destination: 'Bali', date: '03 Sep 2026', status: 'Planning' },
  ]);

  // Notifications State (Phase 10)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoadingNotifications(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // ignore
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  const markNotificationAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch {}
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  // Favorites State (Phase 13)
  const [favorites, setFavorites] = useState([]);
  const [favoriteSummary, setFavoriteSummary] = useState({ total: 0, places: 0, hotels: 0, trips: 0 });
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteSummary({ total: 0, places: 0, hotels: 0, trips: 0 });
      return;
    }
    setLoadingFavorites(true);
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(data?.favorites || []);
      setFavoriteSummary(data?.summary || { total: 0, places: 0, hotels: 0, trips: 0 });
    } catch {
      // ignore
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  const isItemFavorited = useCallback(
    (type, id) => {
      if (!user || !id) return false;
      const normalizedType = String(type).toLowerCase();
      const normalizedId = String(id);
      return favorites.some(
        (f) =>
          (f.item_type === normalizedType || (normalizedType === 'destination' && f.destination_id === parseInt(normalizedId, 10))) &&
          (String(f.item_id) === normalizedId || String(f.destination_id) === normalizedId)
      );
    },
    [user, favorites]
  );

  const toggleFavoriteItem = async (itemType, itemData = {}) => {
    if (!user || !token) {
      showToast('⚠️ Please login to save favorites.');
      return { success: false, message: 'Please login to save favorites.' };
    }

    const normalizedType = String(itemType).toLowerCase();
    const itemId = String(itemData.id || itemData.destination_id || itemData.itemId || '1');
    const wasFavorited = isItemFavorited(normalizedType, itemId);

    // Optimistic UI state update
    if (wasFavorited) {
      setFavorites((prev) =>
        prev.filter(
          (f) => !(f.item_type === normalizedType && (String(f.item_id) === itemId || String(f.destination_id) === itemId))
        )
      );
      showToast('💔 Removed from favorites.');
    } else {
      const optimisticItem = {
        id: Date.now(),
        user_id: user.id,
        item_type: normalizedType,
        item_id: itemId,
        destination_id: normalizedType === 'destination' ? parseInt(itemId, 10) : null,
        title: itemData.title || itemData.name || 'Saved Item',
        subtitle: itemData.subtitle || itemData.city || itemData.category || '',
        category: itemData.category || normalizedType,
        rating: itemData.rating || 4.8,
        price_display: itemData.price_display || (itemData.base_price ? `$${itemData.base_price}` : ''),
        image_url: itemData.image_url || itemData.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        location: itemData.location || (itemData.city ? `${itemData.city}, ${itemData.country || ''}` : ''),
        created_at: new Date().toISOString(),
      };
      setFavorites((prev) => [optimisticItem, ...prev]);
      showToast('❤️ Added to your favorites.');
    }

    try {
      const res = await favoriteService.toggleFavorite({
        itemType: normalizedType,
        itemId,
        destinationId: normalizedType === 'destination' ? parseInt(itemId, 10) : undefined,
        itemData,
      });
      // Re-sync with backend
      fetchFavorites();
      return { success: true, isFavorite: res.isFavorite, message: res.message };
    } catch (err) {
      // Revert on error
      fetchFavorites();
      return { success: false, message: err.message };
    }
  };

  // Automatically fetch notifications & favorites when user logs in or mounts
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      fetchFavorites();
      const interval = setInterval(fetchNotifications, 45000); // Polling every 45s
      return () => clearInterval(interval);
    }
  }, [user, token, fetchNotifications, fetchFavorites]);

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
    // Hotel Context (Phase 7)
    selectedHotel,
    setSelectedHotel,
    login,
    updateUserProfile,
    trips,
    setTrips,
    // Notifications Context (Phase 10)
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    // Favorites Context (Phase 13)
    favorites,
    favoriteSummary,
    loadingFavorites,
    isItemFavorited,
    toggleFavoriteItem,
    fetchFavorites,
    showToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Small floating Toast Notification (Feature 17) */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '0.92rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
