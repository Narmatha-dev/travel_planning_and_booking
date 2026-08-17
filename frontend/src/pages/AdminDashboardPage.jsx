import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import adminService from '../services/adminService';

export default function AdminDashboardPage() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Data States
  const [usersList, setUsersList] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);

  // Modals & Form States
  const [showAddDestModal, setShowAddDestModal] = useState(false);
  const [destForm, setDestForm] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    category: 'beach',
    base_price: 999,
  });

  const [showAddPkgModal, setShowAddPkgModal] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    destination_id: 1,
    title: '',
    duration_days: 5,
    duration_nights: 4,
    base_price: 1299,
    package_type: 'standard',
  });

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData, destsData, pkgsData, booksData, revsData] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getUsers(),
        adminService.getDestinations(),
        adminService.getPackages(),
        adminService.getBookings(),
        adminService.getReviews(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (usersData.status === 'fulfilled') setUsersList(usersData.value);
      if (destsData.status === 'fulfilled') setDestinationsList(destsData.value);
      if (pkgsData.status === 'fulfilled') setPackagesList(pkgsData.value);
      if (booksData.status === 'fulfilled') setBookingsList(booksData.value);
      if (revsData.status === 'fulfilled') setReviewsList(revsData.value);
    } catch (err) {
      setError('Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  // User Actions
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showNotification(`User role updated to ${newRole}`);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 1 ? false : true;
    try {
      await adminService.updateUserStatus(userId, nextStatus);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: nextStatus ? 1 : 0 } : u)));
      showNotification(`User status set to ${nextStatus ? 'Active' : 'Suspended'}`);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Destination Actions
  const handleCreateDestination = async (e) => {
    e.preventDefault();
    try {
      const created = await adminService.createDestination(destForm);
      setDestinationsList((prev) => [created, ...prev]);
      setShowAddDestModal(false);
      setDestForm({ name: '', country: '', city: '', description: '', category: 'beach', base_price: 999 });
      showNotification('New destination created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create destination');
    }
  };

  const handleDeleteDestination = async (id) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    try {
      await adminService.deleteDestination(id);
      setDestinationsList((prev) => prev.filter((d) => d.id !== id));
      showNotification('Destination deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete destination');
    }
  };

  // Package Actions
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const created = await adminService.createPackage(pkgForm);
      setPackagesList((prev) => [created, ...prev]);
      setShowAddPkgModal(false);
      setPkgForm({ destination_id: 1, title: '', duration_days: 5, duration_nights: 4, base_price: 1299, package_type: 'standard' });
      showNotification('New travel package created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create package');
    }
  };

  const handleTogglePackage = async (id, currentAvail) => {
    const nextAvail = currentAvail ? 0 : 1;
    try {
      await adminService.updatePackage(id, { is_available: nextAvail });
      setPackagesList((prev) => prev.map((p) => (p.id === id ? { ...p, is_available: nextAvail } : p)));
      showNotification(`Package availability updated`);
    } catch (err) {
      setError(err.message || 'Failed to update package');
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await adminService.deletePackage(id);
      setPackagesList((prev) => prev.filter((p) => p.id !== id));
      showNotification('Package deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete package');
    }
  };

  // Booking Actions
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await adminService.updateBookingStatus(bookingId, newStatus);
      setBookingsList((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      showNotification(`Booking #${bookingId} status updated to ${newStatus}`);
    } catch (err) {
      setError(err.message || 'Failed to update booking');
    }
  };

  // Review Actions
  const handleReviewApprovalToggle = async (reviewId, currentApproval) => {
    const nextVal = !currentApproval;
    try {
      await adminService.updateReviewApproval(reviewId, nextVal);
      setReviewsList((prev) => prev.map((r) => (r.id === reviewId ? { ...r, is_approved: nextVal } : r)));
      showNotification(`Review #${reviewId} approval set to ${nextVal ? 'Approved' : 'Pending'}`);
    } catch (err) {
      setError(err.message || 'Failed to update review approval');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminService.deleteReview(reviewId);
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      showNotification('Review deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete review');
    }
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Top Admin Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            color: '#ffffff',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ background: '#38bdf8', color: '#0f172a', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                🛡️ Admin Console
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Signed in as <strong>{user?.email || 'admin@example.com'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0 }}>
              Platform Administration & Analytics
            </h1>
          </div>

          <button
            onClick={loadAllAdminData}
            className="btn btn-outline"
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: '700' }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Global Notifications & Alerts */}
        {actionMessage && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600' }}>
            ✅ {actionMessage}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Management Tabs Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { id: 'overview', label: '📊 Overview & KPIs' },
            { id: 'users', label: `👥 Users (${usersList.length})` },
            { id: 'destinations', label: `🌍 Destinations (${destinationsList.length})` },
            { id: 'packages', label: `📦 Packages (${packagesList.length})` },
            { id: 'bookings', label: `📅 Bookings (${bookingsList.length})` },
            { id: 'reviews', label: `⭐ Reviews (${reviewsList.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#0284c7' : '#64748b',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>💰 Total Revenue</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0.35rem 0' }}>
                  {stats.bookings.formattedRevenueUSD}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({stats.bookings.formattedRevenueINR})</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>📅 Total Bookings</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0.35rem 0' }}>
                  {stats.bookings.total}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>✓ {stats.bookings.confirmed} Confirmed</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' }}>👥 Platform Users</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0.35rem 0' }}>
                  {stats.users.total}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{stats.users.travelers} Travelers • {stats.users.admins} Admins</span>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>⭐ Review Rating</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0.35rem 0' }}>
                  {stats.reviews.avgRating} / 5.0
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Across {stats.reviews.total} traveler reviews</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1rem 0' }}>
                🚀 Administrator Quick Actions
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAddDestModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                  + Add New Destination
                </button>
                <button onClick={() => setShowAddPkgModal(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                  + Add Travel Package
                </button>
                <button onClick={() => setActiveTab('bookings')} className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                  Manage Bookings ➜
                </button>
                <button onClick={() => setActiveTab('users')} className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                  Manage Users ➜
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Registered Platform Users ({usersList.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>ID</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Name & Email</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Role</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#64748b' }}>#{u.id}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: '700' }}
                        >
                          <option value="traveler">Traveler</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          onClick={() => handleUserStatusToggle(u.id, u.is_active)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: u.is_active ? '#dcfce7' : '#fee2e2',
                            color: u.is_active ? '#15803d' : '#991b1b',
                          }}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => handleUserStatusToggle(u.id, u.is_active)}
                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DESTINATIONS MANAGEMENT */}
        {activeTab === 'destinations' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Destinations Catalog ({destinationsList.length})</h3>
              <button onClick={() => setShowAddDestModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                + Add Destination
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Destination</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Location</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Rating</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinationsList.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#0f172a' }}>{d.name}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>{d.city}, {d.country}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                          {d.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#eab308' }}>⭐ {d.rating || 4.9}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => handleDeleteDestination(d.id)}
                          style={{ padding: '4px 8px', border: '1px solid #fca5a5', color: '#b91c1c', background: '#fff', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PACKAGES MANAGEMENT */}
        {activeTab === 'packages' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Travel Packages ({packagesList.length})</h3>
              <button onClick={() => setShowAddPkgModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                + Add Package
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Package Title</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Duration</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Price</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packagesList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#0f172a' }}>{p.title}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>{p.duration_days}D / {p.duration_nights}N</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#0284c7' }}>${p.base_price}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          onClick={() => handleTogglePackage(p.id, p.is_available)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: p.is_available ? '#dcfce7' : '#fee2e2',
                            color: p.is_available ? '#15803d' : '#991b1b',
                          }}
                        >
                          {p.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => handleDeletePackage(p.id)}
                          style={{ padding: '4px 8px', border: '1px solid #fca5a5', color: '#b91c1c', background: '#fff', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>All Platform Bookings ({bookingsList.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Trip Details</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#0369a1' }}>
                        {b.booking_reference || `BK-2026-000${b.id}`}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '700' }}>{b.customer_name || 'Traveler'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.customer_email || 'user@example.com'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '600' }}>{b.package_title || b.destination_name || 'Custom Package'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.travel_date} ({b.travelers_count} Travelers)</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#0f172a' }}>
                        ${b.total_amount}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <select
                          value={b.status}
                          onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            color: b.status === 'confirmed' ? '#15803d' : b.status === 'cancelled' ? '#b91c1c' : '#0369a1',
                          }}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Review Moderation ({reviewsList.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Author</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Rating</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Review & Comments</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Approval</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '700' }}>{r.author_name || 'Traveler'}</div>
                        {r.is_verified_booking && (
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700' }}>✓ Verified</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#eab308' }}>
                        {'★'.repeat(r.rating || 5)}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{r.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.comment}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          onClick={() => handleReviewApprovalToggle(r.id, r.is_approved)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: r.is_approved ? '#dcfce7' : '#fee2e2',
                            color: r.is_approved ? '#15803d' : '#991b1b',
                          }}
                        >
                          {r.is_approved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          style={{ padding: '4px 8px', border: '1px solid #fca5a5', color: '#b91c1c', background: '#fff', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: Add Destination */}
        {showAddDestModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 1.25rem 0' }}>Add New Destination</h3>
              <form onSubmit={handleCreateDestination}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Destination Name</label>
                  <input
                    type="text"
                    required
                    value={destForm.name}
                    onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Country</label>
                    <input
                      type="text"
                      required
                      value={destForm.country}
                      onChange={(e) => setDestForm({ ...destForm, country: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>City</label>
                    <input
                      type="text"
                      required
                      value={destForm.city}
                      onChange={(e) => setDestForm({ ...destForm, city: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Category</label>
                  <select
                    value={destForm.category}
                    onChange={(e) => setDestForm({ ...destForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="beach">Beach</option>
                    <option value="mountain">Mountain</option>
                    <option value="cultural">Cultural</option>
                    <option value="adventure">Adventure</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowAddDestModal(false)} className="btn btn-outline">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Destination</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add Package */}
        {showAddPkgModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 1.25rem 0' }}>Add Travel Package</h3>
              <form onSubmit={handleCreatePackage}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Package Title</label>
                  <input
                    type="text"
                    required
                    value={pkgForm.title}
                    onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Base Price ($ USD)</label>
                    <input
                      type="number"
                      required
                      value={pkgForm.base_price}
                      onChange={(e) => setPkgForm({ ...pkgForm, base_price: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>Duration Days</label>
                    <input
                      type="number"
                      value={pkgForm.duration_days}
                      onChange={(e) => setPkgForm({ ...pkgForm, duration_days: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowAddPkgModal(false)} className="btn btn-outline">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Package</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
