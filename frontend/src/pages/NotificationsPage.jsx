import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
  } = useAppContext();

  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNotifications = (notifications || []).filter((n) => {
    if (activeCategory === 'unread') return !n.is_read;
    if (activeCategory === 'reminders') return n.type === 'trip_reminder';
    if (activeCategory === 'bookings') return n.type === 'booking_update' || n.type === 'payment_status';
    return true;
  });

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'booking_update':
        return '🎉';
      case 'payment_status':
        return '💳';
      case 'trip_reminder':
        return '📅';
      case 'promotion':
        return '✨';
      default:
        return '🔔';
    }
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PHASE 10 • NOTIFICATION HUB
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', margin: '0.3rem 0 0.2rem 0' }}>
              Notifications & Trip Reminders
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Stay updated with your confirmed reservations, departure countdowns, and travel updates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="btn btn-outline btn-sm"
                style={{ fontWeight: '700', padding: '0.5rem 1rem' }}
              >
                ✓ Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.5rem 1rem' }}
              >
                🗑️ Clear all
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: '#ffffff',
            padding: '0.5rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All Alerts', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'reminders', label: '📅 Trip Reminders', count: notifications.filter((n) => n.type === 'trip_reminder').length },
            { id: 'bookings', label: '💳 Bookings & Payments', count: notifications.filter((n) => n.type === 'booking_update' || n.type === 'payment_status').length },
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.1rem',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#475569',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feature 16: Loading State */}
        {loadingNotifications && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔔</div>
            <strong style={{ color: '#0f172a' }}>Loading notifications...</strong>
          </div>
        )}

        {/* Feature 17: Empty State */}
        {!loadingNotifications && filteredNotifications.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px dashed #cbd5e1',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔔</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No notifications yet
            </h3>
            <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
              New trip countdowns, booking confirmations, and payment updates will automatically appear here.
            </p>
            <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontWeight: '800' }}>
              Plan a Trip with AI
            </Link>
          </div>
        )}

        {/* Notification List Items */}
        {!loadingNotifications && filteredNotifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  style={{
                    background: notif.is_read ? '#ffffff' : '#f0f9ff',
                    border: notif.is_read ? '1px solid #e2e8f0' : '1.5px solid #7dd3fc',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: notif.is_read ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(2, 132, 199, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: notif.is_read ? '#f1f5f9' : '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                    }}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {notif.title}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {formatFullDate(notif.created_at)}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.92rem', color: '#475569', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {notif.link_url && (
                        <button
                          onClick={() => {
                            if (!notif.is_read) markNotificationAsRead(notif.id);
                            navigate(notif.link_url);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.45rem 1rem', fontWeight: '800', fontSize: '0.82rem', background: '#0284c7' }}
                        >
                          View Details ➔
                        </button>
                      )}

                      {!notif.is_read && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: '700' }}
                        >
                          ✓ Mark as read
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notif.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          padding: '0.4rem 0.6rem',
                        }}
                        title="Delete notification"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
