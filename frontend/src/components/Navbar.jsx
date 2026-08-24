import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/packages', label: 'Packages' },
  { to: '/trip-planner', label: 'Trip Planner' },
  { to: '/recommendations', label: 'AI Suggestions ✨' },
];

function Navbar() {
  const {
    user,
    isAuthenticated,
    logout,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext();
  const navigate = useNavigate();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
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

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand" aria-label="Travel home page">
          <span className="brand-mark">T</span>
          <span>Travelora</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <>
              <NavLink
                to="/booking"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Booking
              </NavLink>
              <NavLink
                to="/my-trips"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                My Trips
              </NavLink>
              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                ❤️ Saved
              </NavLink>
              <NavLink
                to="/rewards"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                🏆 Rewards
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Profile
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                  style={{ color: '#0284c7', fontWeight: '800' }}
                >
                  Admin 🛡️
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {/* Feature 1: Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifDropdown((prev) => !prev)}
                  style={{
                    background: showNotifDropdown ? '#e0f2fe' : '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '1.15rem',
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
                        top: '-2px',
                        right: '-2px',
                        background: '#e11d48',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        borderRadius: '9999px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        boxShadow: '0 2px 5px rgba(225, 29, 72, 0.4)',
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
                      width: '340px',
                      background: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                      border: '1px solid #e2e8f0',
                      zIndex: 1000,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification Items */}
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>🔔</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>No notifications yet</div>
                          <div style={{ fontSize: '0.78rem' }}>Trip alerts will appear here</div>
                        </div>
                      ) : (
                        recentNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderBottom: '1px solid #f8fafc',
                              background: n.is_read ? '#ffffff' : '#f0f9ff',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start',
                              transition: 'background 0.15s',
                            }}
                          >
                            <span style={{ fontSize: '1.2rem', lineHeight: 1, marginTop: '2px' }}>
                              {n.type === 'booking_update' ? '🎉' : n.type === 'payment_status' ? '💳' : n.type === 'trip_reminder' ? '📅' : '🔔'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                <strong style={{ fontSize: '0.84rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {n.title}
                                </strong>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem', flexShrink: 0 }}>
                                  {formatRelativeTime(n.created_at)}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {n.message}
                              </p>
                            </div>
                            {!n.is_read && (
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', marginTop: '6px', flexShrink: 0 }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer link */}
                    <div style={{ padding: '0.65rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: '#f8fafc' }}>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0284c7', textDecoration: 'none' }}
                      >
                        View all notifications ➔
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Capsule */}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                  {user.full_name || user.name}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                  color: user.role === 'admin' ? '#92400e' : '#3730a3',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {user.role || 'Traveler'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
