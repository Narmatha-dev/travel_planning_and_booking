import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function Navbar() {
  const {
    user,
    isAuthenticated,
    logout,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    language,
    setLanguage,
    t,
    isOnline,
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const moreRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMoreDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowMoreDropdown(false);
    setShowUserDropdown(false);
    setShowNotifDropdown(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    navigate('/');
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
    }
    setShowNotifDropdown(false);
    if (notif.link_url) {
      navigate(notif.link_url);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - d) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const recentNotifications = (notifications || []).slice(0, 5);

  const isMoreActive =
    location.pathname === '/recommendations' ||
    location.pathname === '/safety' ||
    location.pathname === '/offline-trips';

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/home" className="brand" aria-label="Travelora Home">
          <span className="brand-mark">T</span>
          <span>Travelora</span>
        </Link>

        {/* Desktop Single-Row Navigation Menu (Aligned horizontally) */}
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink
            to="/home"
            className={({ isActive }) => (isActive || location.pathname === '/' ? 'nav-link active' : 'nav-link')}
          >
            <span>{t('nav.home', 'Home')}</span>
          </NavLink>

          <NavLink
            to="/destinations"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span>{t('nav.destinations', 'Destinations')}</span>
          </NavLink>

          <NavLink
            to="/packages"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span>{t('nav.packages', 'Packages')}</span>
          </NavLink>

          <NavLink
            to="/trip-planner"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span>{t('nav.tripPlanner', 'Trip Planner')}</span>
          </NavLink>

          {/* Direct link for Authenticated Users */}
          {isAuthenticated && (
            <NavLink
              to="/my-trips"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span>{t('nav.myTrips', 'My Trips')}</span>
            </NavLink>
          )}
        </nav>

        {/* Right Navigation Actions */}
        <div className="nav-actions">
          {/* Language Switcher Pill */}
          <div className="lang-switch" role="group" aria-label="Language selector">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
              title="தமிழ்"
            >
              தமிழ்
            </button>
          </div>

          {/* Authenticated User Menu vs Guest Auth */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown((prev) => !prev)}
                  style={{
                    background: showNotifDropdown ? '#FFB8E0' : '#FFF5FB',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                  title="Notifications & Trip Reminders"
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        background: '#BE5985',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: '800',
                        borderRadius: '9999px',
                        minWidth: '17px',
                        height: '17px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        boxShadow: '0 2px 6px rgba(190, 89, 133, 0.4)',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '48px',
                      right: 0,
                      width: '330px',
                      background: '#ffffff',
                      borderRadius: '18px',
                      boxShadow: '0 20px 40px rgba(45, 21, 32, 0.15)',
                      border: '1.5px solid #F3D2E5',
                      zIndex: 1000,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid #F3D2E5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFF5FB',
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#BE5985' }}>
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EC7FA9',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#7A5366' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>🔔</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>No new notifications</div>
                        </div>
                      ) : (
                        recentNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '0.8rem 1rem',
                              borderBottom: '1px solid #FFF5FB',
                              background: n.is_read ? '#ffffff' : '#FFEDFA',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span style={{ fontSize: '1.15rem', lineHeight: 1, marginTop: '2px' }}>
                              {n.type === 'booking_update' ? '🎉' : n.type === 'payment_status' ? '💳' : n.type === 'trip_reminder' ? '📅' : '🔔'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.82rem', color: '#BE5985', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {n.title}
                                </strong>
                                <span style={{ fontSize: '0.68rem', color: '#7A5366' }}>
                                  {formatRelativeTime(n.created_at)}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.76rem', color: '#7A5366', margin: '2px 0 0', lineHeight: 1.35 }}>
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ padding: '0.6rem', borderTop: '1px solid #F3D2E5', textAlign: 'center', background: '#FFF5FB' }}>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        style={{ fontSize: '0.78rem', fontWeight: '800', color: '#BE5985', textDecoration: 'none' }}
                      >
                        View all notifications ➔
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Capsule Dropdown */}
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="user-capsule-btn"
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  aria-expanded={showUserDropdown}
                >
                  <div className="user-avatar-circle">
                    {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#2D1520' }}>
                    {(user.full_name || user.name || 'User').split(' ')[0]}
                  </span>
                  <span className={`user-role-badge ${user.role === 'admin' ? 'admin' : 'traveler'}`}>
                    {user.role === 'admin' ? 'Admin' : 'Traveler'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#7A5366' }}>▾</span>
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <span className="user-menu-name">{user.full_name || user.name}</span>
                      <span className="user-menu-email">{user.email || 'traveler@travelora.com'}</span>
                    </div>

                    <Link to="/my-trips" className="user-menu-item" onClick={() => setShowUserDropdown(false)}>
                      <span>✈️</span>
                      <span>{t('nav.myTrips', 'My Trips Hub')}</span>
                    </Link>

                    <Link to="/favorites" className="user-menu-item" onClick={() => setShowUserDropdown(false)}>
                      <span>❤️</span>
                      <span>{t('nav.saved', 'Saved Places')}</span>
                    </Link>

                    <Link to="/safety" className="user-menu-item" onClick={() => setShowUserDropdown(false)}>
                      <span>🛡️</span>
                      <span>Safety & SOS</span>
                    </Link>

                    <Link to="/profile" className="user-menu-item" onClick={() => setShowUserDropdown(false)}>
                      <span>👤</span>
                      <span>{t('nav.profile', 'Profile Settings')}</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link to="/admin" className="user-menu-item" onClick={() => setShowUserDropdown(false)} style={{ color: '#BE5985' }}>
                        <span>🛡️</span>
                        <span>{t('nav.admin', 'Admin Dashboard')}</span>
                      </Link>
                    )}

                    <div className="user-menu-divider" />

                    <button type="button" className="user-menu-item logout-item" onClick={handleLogout}>
                      <span>🚪</span>
                      <span>{t('nav.logout', 'Log Out')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-login-ghost">
                {t('nav.login', 'Log In')}
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ fontWeight: '800' }}>
                {t('nav.getStarted', 'Sign Up')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
                <span className="brand-mark">T</span>
                <span>Travelora</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#7A5366' }}
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-content">
              <NavLink to="/home" end className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🏠</span>
                <span>{t('nav.home', 'Home')}</span>
              </NavLink>

              <NavLink to="/destinations" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🗺️</span>
                <span>{t('nav.destinations', 'Destinations')}</span>
              </NavLink>

              <NavLink to="/packages" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span>📦</span>
                <span>{t('nav.packages', 'Packages')}</span>
              </NavLink>

              <NavLink to="/trip-planner" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <span>🧭</span>
                <span>{t('nav.tripPlanner', 'Trip Planner')}</span>
              </NavLink>

              {isAuthenticated && (
                <>
                  <div style={{ height: '1px', background: '#F3D2E5', margin: '0.5rem 0' }} />
                  <NavLink to="/my-trips" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>✈️</span>
                    <span>{t('nav.myTrips', 'My Trips')}</span>
                  </NavLink>
                  <NavLink to="/favorites" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>❤️</span>
                    <span>{t('nav.saved', 'Saved Places')}</span>
                  </NavLink>
                  <NavLink to="/safety" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>🛡️</span>
                    <span>Safety & SOS</span>
                  </NavLink>
                  <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <span>👤</span>
                    <span>{t('nav.profile', 'Profile')}</span>
                  </NavLink>
                </>
              )}
            </div>

            <div className="mobile-drawer-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7A5366' }}>Language / மொழி:</span>
                <div className="lang-switch">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ta')}
                    className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn-secondary full-width"
                  onClick={handleLogout}
                  style={{ color: '#BE5985', fontWeight: '800' }}
                >
                  🚪 {t('nav.logout', 'Logout')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.login', 'Login')}
                  </Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.register', 'Register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
