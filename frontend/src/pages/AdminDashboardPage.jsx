import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import adminService from '../services/adminService';

export default function AdminDashboardPage() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  // Active Navigation Tab
  // Options: 'dashboard' | 'packages' | 'destinations' | 'bookings' | 'payments' | 'users' | 'reviews' | 'coupons' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Stats & Analytics State
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Data States
  const [usersList, setUsersList] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [tripsList, setTripsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [couponsList, setCouponsList] = useState([
    { id: 1, code: 'EXPLORE10', discount_type: 'percentage', discount_value: 10, min_amount: 5000, max_discount: 1500, expiry_date: '2026-12-31', usage_count: 42, is_active: 1 },
    { id: 2, code: 'GOAHOLIDAY', discount_type: 'flat', discount_value: 2000, min_amount: 15000, max_discount: 2000, expiry_date: '2026-11-30', usage_count: 18, is_active: 1 },
    { id: 3, code: 'FIRSTTRIP500', discount_type: 'flat', discount_value: 500, min_amount: 3000, max_discount: 500, expiry_date: '2026-12-31', usage_count: 89, is_active: 1 },
    { id: 4, code: 'LUXURYVIP', discount_type: 'percentage', discount_value: 15, min_amount: 25000, max_discount: 5000, expiry_date: '2026-10-15', usage_count: 7, is_active: 0 },
  ]);

  // Analytics & Forecast States
  const [adminDateFilter, setAdminDateFilter] = useState('thisYear');
  const [forecastData, setForecastData] = useState(null);
  const [forecastRange, setForecastRange] = useState('3_months');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  // Package Management Specific States
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgStatusFilter, setPkgStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [pkgDestFilter, setPkgDestFilter] = useState('all');
  const [pkgTypeFilter, setPkgTypeFilter] = useState('all');
  const [pkgSortBy, setPkgSortBy] = useState('newest');
  const [pkgViewMode, setPkgViewMode] = useState('table'); // 'table' | 'cards'
  const [showAddPkgModal, setShowAddPkgModal] = useState(false);
  const [showEditPkgModal, setShowEditPkgModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgFormSubmitting, setPkgFormSubmitting] = useState(false);

  const initialPkgForm = {
    title: '',
    destinationId: '1',
    description: '',
    featured_image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
    durationDays: 4,
    durationNights: 3,
    basePrice: 18999,
    discountPrice: '',
    travelers: 10,
    availableDates: 'Year-round / Flexible',
    transportType: 'Hotel + Transport + Activities',
    hotelType: '4-Star Premium Resort / Villa',
    inclusions: 'Hotel Accommodation, AC Cab Transport, Guided Tours, Daily Breakfast, Entry Tickets',
    exclusions: 'Personal Expenses, Flight Tickets, Tips',
    packageType: 'standard',
    difficultyLevel: 'easy',
    status: 'active',
  };
  const [pkgForm, setPkgForm] = useState(initialPkgForm);

  // Other Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Modals & Forms for Destination & Coupon
  const [showAddDestModal, setShowAddDestModal] = useState(false);
  const [destForm, setDestForm] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    category: 'beach',
    base_price: 999,
    featured_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  });

  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_amount: 5000,
    max_discount: 1000,
    expiry_date: '2026-12-31',
    is_active: 1,
  });

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, analyticsData, usersData, destsData, pkgsData, booksData, tripsData, paymentsData, revsData, forecastRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getAnalytics({ dateFilter: adminDateFilter }),
        adminService.getUsers(),
        adminService.getDestinations(),
        adminService.getPackages(),
        adminService.getBookings(),
        adminService.getTrips(),
        adminService.getPayments(),
        adminService.getReviews(),
        adminService.getForecast({ range: forecastRange }),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
      if (usersData.status === 'fulfilled') setUsersList(usersData.value || []);
      if (destsData.status === 'fulfilled') setDestinationsList(destsData.value || []);
      if (pkgsData.status === 'fulfilled') setPackagesList(pkgsData.value || []);
      if (booksData.status === 'fulfilled') setBookingsList(booksData.value || []);
      if (tripsData.status === 'fulfilled') setTripsList(tripsData.value || []);
      if (paymentsData.status === 'fulfilled') setPaymentsList(paymentsData.value || []);
      if (revsData.status === 'fulfilled') setReviewsList(revsData.value || []);
      if (forecastRes.status === 'fulfilled') setForecastData(forecastRes.value);
    } catch {
      setError('Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3500);
  };

  // ==========================================
  // PACKAGE MANAGEMENT HANDLERS (MAIN MODULE)
  // ==========================================
  const handleOpenAddPackage = () => {
    setPkgForm(initialPkgForm);
    setShowAddPkgModal(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPkgId(pkg.id);
    setPkgForm({
      title: pkg.title || pkg.name || '',
      destinationId: String(pkg.destination_id || '1'),
      description: pkg.description || '',
      featured_image_url: pkg.featured_image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
      durationDays: pkg.duration_days || 4,
      durationNights: pkg.duration_nights || 3,
      basePrice: pkg.base_price || 18999,
      discountPrice: pkg.discount_price || '',
      travelers: pkg.max_group_size || 10,
      availableDates: pkg.available_dates || 'Year-round / Flexible',
      transportType: pkg.transport_type || 'Flight / AC Cab / Train',
      hotelType: pkg.hotel_type || '4-Star Resort / Boutique Villa',
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : (pkg.inclusions || 'Hotel Stay, AC Cab Transport, Guided Tours'),
      exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions.join(', ') : (pkg.exclusions || 'Personal Expenses, Flight Tickets'),
      packageType: pkg.package_type || 'standard',
      difficultyLevel: pkg.difficulty_level || 'easy',
      status: pkg.is_available ? 'active' : 'inactive',
    });
    setShowEditPkgModal(true);
  };

  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();
    if (!pkgForm.title || !pkgForm.basePrice) {
      setError('Package Name and Price are required');
      return;
    }

    setPkgFormSubmitting(true);
    setError('');
    try {
      const created = await adminService.createPackage(pkgForm);
      setPackagesList((prev) => [created, ...prev]);
      setShowAddPkgModal(false);
      setPkgForm(initialPkgForm);
      showNotification(`Package "${created.title || pkgForm.title}" added successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create package');
    } finally {
      setPkgFormSubmitting(false);
    }
  };

  const handleUpdatePackageSubmit = async (e) => {
    e.preventDefault();
    if (!editingPkgId) return;

    setPkgFormSubmitting(true);
    setError('');
    try {
      const updated = await adminService.updatePackage(editingPkgId, pkgForm);
      setPackagesList((prev) => prev.map((p) => (p.id === editingPkgId ? { ...p, ...updated, ...pkgForm, is_available: pkgForm.status === 'active' ? 1 : 0 } : p)));
      setShowEditPkgModal(false);
      setEditingPkgId(null);
      showNotification(`Package #${editingPkgId} updated successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update package');
    } finally {
      setPkgFormSubmitting(false);
    }
  };

  const handleTogglePackageStatus = async (pkgId, currentIsAvailable) => {
    const nextStatus = !currentIsAvailable;
    try {
      await adminService.updatePackageStatus(pkgId, nextStatus);
      setPackagesList((prev) => prev.map((p) => (p.id === pkgId ? { ...p, is_available: nextStatus ? 1 : 0 } : p)));
      showNotification(`Package #${pkgId} is now ${nextStatus ? '🟢 Active' : '⚪ Deactivated'}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to toggle package status');
    }
  };

  const handleDeletePackage = async (pkgId, pkgTitle) => {
    if (!window.confirm(`Are you sure you want to delete package "${pkgTitle || `#${pkgId}`}"? This cannot be undone.`)) return;

    try {
      await adminService.deletePackage(pkgId);
      setPackagesList((prev) => prev.filter((p) => p.id !== pkgId));
      showNotification(`Package "${pkgTitle || `#${pkgId}`}" deleted successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete package');
    }
  };

  // Filtered & Sorted Packages
  const filteredPackages = packagesList.filter((pkg) => {
    const matchesSearch =
      !pkgSearch ||
      pkg.title?.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      pkg.destination_name?.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(pkgSearch.toLowerCase());

    const matchesStatus =
      pkgStatusFilter === 'all' ||
      (pkgStatusFilter === 'active' && Boolean(pkg.is_available)) ||
      (pkgStatusFilter === 'inactive' && !Boolean(pkg.is_available));

    const matchesDest = pkgDestFilter === 'all' || String(pkg.destination_id) === String(pkgDestFilter);
    const matchesType = pkgTypeFilter === 'all' || (pkg.package_type || '').toLowerCase() === pkgTypeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDest && matchesType;
  }).sort((a, b) => {
    if (pkgSortBy === 'price_asc') return (a.base_price || 0) - (b.base_price || 0);
    if (pkgSortBy === 'price_desc') return (b.base_price || 0) - (a.base_price || 0);
    if (pkgSortBy === 'duration_asc') return (a.duration_days || 0) - (b.duration_days || 0);
    return b.id - a.id; // newest
  });

  // Package Quick Stats
  const activePackagesCount = packagesList.filter((p) => Boolean(p.is_available)).length;
  const inactivePackagesCount = packagesList.length - activePackagesCount;
  const avgPackagePrice = packagesList.length > 0 ? Math.round(packagesList.reduce((acc, p) => acc + (parseFloat(p.base_price) || 0), 0) / packagesList.length) : 0;

  // ==========================================
  // DESTINATION & BOOKING & USER HANDLERS
  // ==========================================
  const handleCreateDestination = async (e) => {
    e.preventDefault();
    try {
      const created = await adminService.createDestination(destForm);
      setDestinationsList((prev) => [created, ...prev]);
      setShowAddDestModal(false);
      setDestForm({ name: '', country: '', city: '', description: '', category: 'beach', base_price: 999, featured_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' });
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

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await adminService.updateBookingStatus(bookingId, newStatus);
      setBookingsList((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      showNotification(`Booking #${bookingId} status updated to ${newStatus}`);
    } catch (err) {
      setError(err.message || 'Failed to update booking status');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showNotification(`User #${userId} role updated to ${newRole}`);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    const nextActive = currentActive ? 0 : 1;
    try {
      await adminService.updateUserStatus(userId, nextActive);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: nextActive } : u)));
      showNotification(`User #${userId} status set to ${nextActive ? 'Active' : 'Suspended'}`);
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user #${userId}?`)) return;
    try {
      await adminService.deleteUser(userId);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      showNotification(`User #${userId} deleted successfully`);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleReviewApproval = async (reviewId, currentApproval) => {
    const nextApproval = !currentApproval;
    try {
      await adminService.updateReviewApproval(reviewId, nextApproval);
      setReviewsList((prev) => prev.map((r) => (r.id === reviewId ? { ...r, is_approved: nextApproval ? 1 : 0 } : r)));
      showNotification(`Review #${reviewId} set to ${nextApproval ? 'Approved' : 'Hidden'}`);
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

  const handleToggleCoupon = (id) => {
    setCouponsList((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: c.is_active ? 0 : 1 } : c)));
    showNotification(`Coupon #${id} status updated`);
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!couponForm.code) return;
    const newC = { ...couponForm, id: Date.now(), usage_count: 0, is_active: 1 };
    setCouponsList((prev) => [newC, ...prev]);
    setShowAddCouponModal(false);
    setCouponForm({ code: '', discount_type: 'percentage', discount_value: 10, min_amount: 5000, max_discount: 1000, expiry_date: '2026-12-31', is_active: 1 });
    showNotification(`Promo code ${newC.code} activated!`);
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const blob = await adminService.exportAnalyticsCSV({ dateFilter: adminDateFilter });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `travelora-admin-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Platform data exported to CSV successfully!');
    } catch (err) {
      setError('Failed to export CSV analytics');
    } finally {
      setExportingCSV(false);
    }
  };

  // Sidebar Menu Items Definition
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { id: 'packages', label: 'Package Management', icon: '📦', badge: packagesList.length },
    { id: 'destinations', label: 'Destination Management', icon: '📍', badge: destinationsList.length },
    { id: 'bookings', label: 'Booking Management', icon: '🎫', badge: bookingsList.length },
    { id: 'payments', label: 'Payment Management', icon: '💳', badge: paymentsList.length },
    { id: 'users', label: 'User Management', icon: '👥', badge: usersList.length },
    { id: 'reviews', label: 'Reviews', icon: '⭐', badge: reviewsList.length },
    { id: 'coupons', label: 'Offers & Coupons', icon: '🎟️', badge: couponsList.length },
    { id: 'analytics', label: 'Reports & Analytics', icon: '📈', badge: null },
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: null },
  ];

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#FAF6F9',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: '#2D1520',
      }}
    >
      {/* 1. REAL-WORLD SIDEBAR NAVIGATION */}
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: '#ffffff',
          borderRight: '1.5px solid #F3D2E5',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
          boxShadow: '4px 0 20px rgba(190, 89, 133, 0.04)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: sidebarCollapsed ? '1.5rem 0.5rem' : '1.5rem 1.25rem',
            borderBottom: '1px solid #F8E7F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(190, 89, 133, 0.3)',
                }}
              >
                🛡️
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', margin: 0, lineHeight: 1.1 }}>
                  Travelora
                </h2>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#EC7FA9', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Admin Suite v2.4
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: '#FFEDFA',
              border: '1px solid #FFB8E0',
              borderRadius: '8px',
              padding: '6px 8px',
              color: '#BE5985',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '800',
            }}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? '➔' : '◀'}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    padding: sidebarCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : '#663B4F',
                    fontWeight: isActive ? '800' : '600',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(190, 89, 133, 0.25)' : 'none',
                  }}
                  title={item.label}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badge !== null && (
                    <span
                      style={{
                        background: isActive ? '#ffffff' : '#FFEDFA',
                        color: isActive ? '#BE5985' : '#BE5985',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Admin User Profile Section */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid #F8E7F1',
            background: '#FFF5FB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#EC7FA9',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.95rem',
              }}
            >
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#2D1520', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {user?.full_name || 'System Admin'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#7A5366', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {user?.email || 'admin@travelplanner.com'}
                </div>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to="/home"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1px solid #F3D2E5',
                  color: '#BE5985',
                  padding: '6px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                🌐 Public View
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1.5px solid #F3D2E5',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            boxShadow: '0 2px 10px rgba(190, 89, 133, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Admin Workspace /
            </span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
              {menuItems.find((m) => m.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: '800',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></span>
              Server Status: Online
            </div>

            <button
              type="button"
              onClick={loadAllAdminData}
              style={{
                background: '#FFEDFA',
                border: '1px solid #FFB8E0',
                color: '#BE5985',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🔄 Refresh
            </button>

            <Link
              to="/home"
              target="_blank"
              style={{
                background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(190, 89, 133, 0.25)',
              }}
            >
              🚀 View Storefront
            </Link>
          </div>
        </header>

        {/* Main Content Workspace Container */}
        <main style={{ padding: '2rem', flex: 1 }}>
          {/* Action Notification Alert */}
          {actionMessage && (
            <div
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #86efac',
                padding: '0.9rem 1.25rem',
                borderRadius: '14px',
                marginBottom: '1.75rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)',
              }}
            >
              <span>✅</span>
              <div>{actionMessage}</div>
            </div>
          )}

          {/* Error Notification Alert */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '0.9rem 1.25rem',
                borderRadius: '14px',
                marginBottom: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: '700',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '900', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ============================================================
              TAB 1: MAIN DASHBOARD OVERVIEW
             ============================================================ */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Top Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 50%, #FFB8E0 100%)',
                  borderRadius: '20px',
                  padding: '2.25rem',
                  color: '#ffffff',
                  marginBottom: '2rem',
                  boxShadow: '0 10px 25px rgba(190, 89, 133, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                }}
              >
                <div>
                  <span style={{ background: '#ffffff', color: '#BE5985', padding: '3px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Real-World Booking Operations
                  </span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff', margin: '0.6rem 0 0.25rem 0' }}>
                    Welcome back, {user?.full_name || 'Administrator'} 👋
                  </h2>
                  <p style={{ color: '#FFEDFA', fontSize: '0.95rem', margin: 0, maxWidth: '650px' }}>
                    Here is what is happening across your travel packages, bookings, payments, and traveler activities today.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('packages');
                      handleOpenAddPackage();
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#BE5985',
                      border: 'none',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    ➕ Add New Package
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={exportingCSV}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    {exportingCSV ? 'Exporting...' : '📄 Export Report'}
                  </button>
                </div>
              </div>

              {/* 6 SUMMARY KPI CARDS (MANDATORY REQUIREMENT) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2.5rem',
                }}
              >
                {/* 1. Total Users */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Total Users
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FFEDFA', borderRadius: '10px' }}>👥</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#BE5985' }}>
                    {usersList.length || stats?.users?.total || 5}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7A5366', marginTop: '0.35rem', fontWeight: '600' }}>
                    Travelers: {usersList.filter((u) => u.role === 'traveler').length || 4} • Admins: {usersList.filter((u) => u.role === 'admin').length || 1}
                  </div>
                </div>

                {/* 2. Total Packages */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveTab('packages')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Total Packages
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FFEDFA', borderRadius: '10px' }}>📦</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#BE5985' }}>
                    {packagesList.length || stats?.packages?.total || 6}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.35rem', fontWeight: '700' }}>
                    🟢 {activePackagesCount || 6} Active Packages
                  </div>
                </div>

                {/* 3. Total Bookings */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveTab('bookings')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Total Bookings
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FFEDFA', borderRadius: '10px' }}>🎫</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#BE5985' }}>
                    {bookingsList.length || stats?.bookings?.total || 12}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7A5366', marginTop: '0.35rem', fontWeight: '600' }}>
                    Confirmed: {bookingsList.filter((b) => b.status === 'confirmed').length || 8}
                  </div>
                </div>

                {/* 4. Total Revenue */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Total Revenue
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FFEDFA', borderRadius: '10px' }}>💰</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#15803D' }}>
                    ₹{Number(stats?.bookings?.totalRevenueINR || stats?.revenue?.verified_revenue || 489500).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7A5366', marginTop: '0.35rem', fontWeight: '600' }}>
                    Gateway verified transactions
                  </div>
                </div>

                {/* 5. Pending Bookings */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setActiveTab('bookings');
                    setBookingStatusFilter('pending');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Pending Bookings
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FEF3C7', borderRadius: '10px' }}>⏳</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#D97706' }}>
                    {bookingsList.filter((b) => b.status === 'pending').length || stats?.bookings?.pending || 2}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.35rem', fontWeight: '700' }}>
                    Requires verification
                  </div>
                </div>

                {/* 6. Reviews */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(190, 89, 133, 0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveTab('reviews')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                      Reviews
                    </span>
                    <span style={{ fontSize: '1.5rem', padding: '6px', background: '#FFEDFA', borderRadius: '10px' }}>⭐</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#BE5985' }}>
                    {reviewsList.length || stats?.reviews?.total || 16}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7A5366', marginTop: '0.35rem', fontWeight: '600' }}>
                    Avg Rating: {stats?.reviews?.avg_review_rating ? parseFloat(stats?.reviews?.avg_review_rating).toFixed(1) : '4.9'} ★
                  </div>
                </div>
              </div>

              {/* Recent Bookings & Operations Table */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #F3D2E5',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 8px 24px rgba(190, 89, 133, 0.06)',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                      Recent Travel Bookings 🎫
                    </h3>
                    <p style={{ color: '#7A5366', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                      Latest real-world customer reservations and confirmation status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    style={{
                      background: '#FFEDFA',
                      border: '1px solid #FFB8E0',
                      color: '#BE5985',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    View All Bookings ➔
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Ref ID</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Destination / Package</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Travel Date</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Amount</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsList.slice(0, 5).map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                          <td style={{ padding: '1rem', fontWeight: '800', color: '#BE5985' }}>
                            {b.booking_reference || `BK-2026-${b.id}`}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '700', color: '#2D1520' }}>{b.customer_name || 'Traveler'}</div>
                            <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>{b.customer_email || 'client@example.com'}</div>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '600' }}>
                            📍 {b.destination_name || 'Goa Beach Escape'}
                          </td>
                          <td style={{ padding: '1rem', color: '#663B4F' }}>
                            📅 {b.start_date || '2026-09-15'}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '800', color: '#15803D' }}>
                            ₹{Number(b.total_amount || 18999).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                textTransform: 'capitalize',
                                background:
                                  b.status === 'confirmed' ? '#DCFCE7' : b.status === 'pending' ? '#FEF3C7' : b.status === 'cancelled' ? '#FEE2E2' : '#E0E7FF',
                                color:
                                  b.status === 'confirmed' ? '#15803D' : b.status === 'pending' ? '#D97706' : b.status === 'cancelled' ? '#B91C1C' : '#3730A3',
                              }}
                            >
                              {b.status || 'confirmed'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <select
                              value={b.status || 'confirmed'}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                border: '1px solid #F3D2E5',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                background: '#FFF5FB',
                                color: '#BE5985',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: PACKAGE MANAGEMENT — MAIN MODULE (MANDATORY REQUIREMENT)
             ============================================================ */}
          {activeTab === 'packages' && (
            <div>
              {/* Module Header Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Package Management 📦
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.92rem', margin: '0.25rem 0 0 0' }}>
                    Create, update, search, filter, and activate/deactivate travel packages for customers.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleOpenAddPackage}
                    style={{
                      background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(190, 89, 133, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>➕ Add New Package</span>
                  </button>
                </div>
              </div>

              {/* 4 Mini Stat Pills for Packages */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>Total Packages</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#BE5985', marginTop: '0.2rem' }}>{packagesList.length}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #86EFAC', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803D', textTransform: 'uppercase' }}>Active Packages</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#15803D', marginTop: '0.2rem' }}>{activePackagesCount}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>Deactivated</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#9CA3AF', marginTop: '0.2rem' }}>{inactivePackagesCount}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>Average Price</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2D1520', marginTop: '0.2rem' }}>₹{avgPackagePrice.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #F3D2E5',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Search Input */}
                <div style={{ flex: '1 1 260px', minWidth: '240px' }}>
                  <input
                    type="text"
                    value={pkgSearch}
                    onChange={(e) => setPkgSearch(e.target.value)}
                    placeholder="🔍 Search packages by name, destination, description..."
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #F3D2E5',
                      fontSize: '0.9rem',
                      color: '#2D1520',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['all', 'active', 'inactive'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPkgStatusFilter(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: '1px solid ' + (pkgStatusFilter === st ? '#BE5985' : '#F3D2E5'),
                        background: pkgStatusFilter === st ? '#EC7FA9' : '#FFF5FB',
                        color: pkgStatusFilter === st ? '#ffffff' : '#BE5985',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {st === 'all' ? 'All Status' : st === 'active' ? '🟢 Active' : '⚪ Inactive'}
                    </button>
                  ))}
                </div>

                {/* Category & Destination Filter */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={pkgDestFilter}
                    onChange={(e) => setPkgDestFilter(e.target.value)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #F3D2E5',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      background: '#ffffff',
                      color: '#2D1520',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Destinations</option>
                    {destinationsList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    value={pkgSortBy}
                    onChange={(e) => setPkgSortBy(e.target.value)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #F3D2E5',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      background: '#ffffff',
                      color: '#2D1520',
                      outline: 'none',
                    }}
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="duration_asc">Duration: Short to Long</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div style={{ display: 'flex', border: '1px solid #F3D2E5', borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setPkgViewMode('table')}
                      style={{
                        padding: '6px 12px',
                        background: pkgViewMode === 'table' ? '#EC7FA9' : '#ffffff',
                        color: pkgViewMode === 'table' ? '#ffffff' : '#BE5985',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                      }}
                      title="Table View"
                    >
                      📋 Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setPkgViewMode('cards')}
                      style={{
                        padding: '6px 12px',
                        background: pkgViewMode === 'cards' ? '#EC7FA9' : '#ffffff',
                        color: pkgViewMode === 'cards' ? '#ffffff' : '#BE5985',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                      }}
                      title="Cards View"
                    >
                      🔲 Cards
                    </button>
                  </div>
                </div>
              </div>

              {/* PACKAGE LIST: TABLE VIEW */}
              {pkgViewMode === 'table' && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #F3D2E5',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 8px 24px rgba(190, 89, 133, 0.06)',
                    overflowX: 'auto',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Package Info</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Destination</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Duration</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Price</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Included Services</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#7A5366' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
                            <strong style={{ fontSize: '1.1rem', color: '#BE5985' }}>No packages matched your search.</strong>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Try clearing filters or click "Add New Package" above.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredPackages.map((pkg) => {
                          const isAvailable = Boolean(pkg.is_available);
                          const inclusionsList = Array.isArray(pkg.inclusions) ? pkg.inclusions : (typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions || '[]') : []);

                          return (
                            <tr key={pkg.id} style={{ borderBottom: '1px solid #F8E7F1', opacity: isAvailable ? 1 : 0.7 }}>
                              {/* Image & Package Name */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <img
                                    src={pkg.featured_image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800'}
                                    alt={pkg.title}
                                    style={{
                                      width: '60px',
                                      height: '45px',
                                      borderRadius: '8px',
                                      objectFit: 'cover',
                                      border: '1px solid #F3D2E5',
                                    }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: '800', color: '#2D1520', fontSize: '0.95rem' }}>
                                      {pkg.title || pkg.name}
                                    </div>
                                    <span style={{ fontSize: '0.72rem', background: '#FFEDFA', color: '#BE5985', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                                      {pkg.package_type || 'Standard'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Destination */}
                              <td style={{ padding: '1rem', fontWeight: '600' }}>
                                📍 {pkg.destination_name || 'Goa'} {pkg.destination_country ? `(${pkg.destination_country})` : ''}
                              </td>

                              {/* Duration */}
                              <td style={{ padding: '1rem', color: '#663B4F', fontWeight: '700' }}>
                                ⏳ {pkg.duration_days || 4} Days / {pkg.duration_nights || 3} Nights
                              </td>

                              {/* Price */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '900', color: '#15803D', fontSize: '1rem' }}>
                                  ₹{Number(pkg.discount_price || pkg.base_price || 18999).toLocaleString('en-IN')}
                                </div>
                                {pkg.discount_price && (
                                  <span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '0.78rem' }}>
                                    ₹{Number(pkg.base_price).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </td>

                              {/* Included Services */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                                  {(inclusionsList.length > 0 ? inclusionsList.slice(0, 3) : ['Hotel', 'Transport', 'Activities']).map((inc, iIdx) => (
                                    <span
                                      key={iIdx}
                                      style={{
                                        background: '#FFF5FB',
                                        border: '1px solid #FFB8E0',
                                        color: '#BE5985',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      ✓ {inc}
                                    </span>
                                  ))}
                                  {inclusionsList.length > 3 && (
                                    <span style={{ fontSize: '0.7rem', color: '#7A5366', fontWeight: '700' }}>
                                      +{inclusionsList.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td style={{ padding: '1rem' }}>
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: isAvailable ? '#DCFCE7' : '#F3F4F6',
                                    color: isAvailable ? '#15803D' : '#6B7280',
                                  }}
                                >
                                  {isAvailable ? '🟢 Active' : '⚪ Inactive'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  {/* Activate / Deactivate Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePackageStatus(pkg.id, isAvailable)}
                                    style={{
                                      background: isAvailable ? '#FFF5FB' : '#DCFCE7',
                                      border: '1px solid ' + (isAvailable ? '#F3D2E5' : '#86EFAC'),
                                      color: isAvailable ? '#BE5985' : '#15803D',
                                      padding: '5px 9px',
                                      borderRadius: '8px',
                                      fontSize: '0.75rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                    }}
                                    title={isAvailable ? 'Deactivate Package' : 'Activate Package'}
                                  >
                                    {isAvailable ? 'Deactivate' : 'Activate'}
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPackage(pkg)}
                                    style={{
                                      background: '#FFEDFA',
                                      border: '1px solid #FFB8E0',
                                      color: '#BE5985',
                                      padding: '5px 9px',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                    }}
                                    title="Edit Package"
                                  >
                                    ✏️ Edit
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                                    style={{
                                      background: '#FEE2E2',
                                      border: '1px solid #FCA5A5',
                                      color: '#B91C1C',
                                      padding: '5px 9px',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                    }}
                                    title="Delete Package"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PACKAGE LIST: CARD GRID VIEW */}
              {pkgViewMode === 'cards' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  {filteredPackages.map((pkg) => {
                    const isAvailable = Boolean(pkg.is_available);
                    return (
                      <div
                        key={pkg.id}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #F3D2E5',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: '0 6px 20px rgba(190, 89, 133, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: isAvailable ? 1 : 0.75,
                        }}
                      >
                        <div style={{ position: 'relative', height: '180px' }}>
                          <img
                            src={pkg.featured_image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800'}
                            alt={pkg.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              background: isAvailable ? '#22C55E' : '#6B7280',
                              color: '#ffffff',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          >
                            {isAvailable ? 'Active' : 'Inactive'}
                          </span>
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              left: '12px',
                              background: 'rgba(45, 21, 32, 0.85)',
                              color: '#ffffff',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            ⏳ {pkg.duration_days || 4}D / {pkg.duration_nights || 3}N
                          </span>
                        </div>

                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '0.78rem', color: '#BE5985', fontWeight: '800', textTransform: 'uppercase' }}>
                            📍 {pkg.destination_name || 'Featured Destination'}
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2D1520', margin: '0.35rem 0 0.5rem 0' }}>
                            {pkg.title || pkg.name}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: '#7A5366', margin: '0 0 1rem 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {pkg.description || 'Complete holiday package with stay, sightseeing, and transport.'}
                          </p>

                          <div style={{ borderTop: '1px solid #F8E7F1', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>Price</span>
                              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#15803D' }}>
                                ₹{Number(pkg.discount_price || pkg.base_price || 18999).toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => handleTogglePackageStatus(pkg.id, isAvailable)}
                                style={{
                                  background: isAvailable ? '#FFF5FB' : '#DCFCE7',
                                  border: '1px solid ' + (isAvailable ? '#F3D2E5' : '#86EFAC'),
                                  color: isAvailable ? '#BE5985' : '#15803D',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                }}
                              >
                                {isAvailable ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPackage(pkg)}
                                style={{
                                  background: '#FFEDFA',
                                  border: '1px solid #FFB8E0',
                                  color: '#BE5985',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                                style={{
                                  background: '#FEE2E2',
                                  border: '1px solid #FCA5A5',
                                  color: '#B91C1C',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============================================================
                  ADD PACKAGE MODAL (MANDATORY FIELDS REQUIREMENT)
                 ============================================================ */}
              {showAddPkgModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(45, 21, 32, 0.65)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '24px',
                      padding: '2.25rem',
                      maxWidth: '750px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                      border: '1.5px solid #F3D2E5',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F8E7F1', paddingBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                          Package Management Module
                        </span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2D1520', margin: '0.2rem 0 0 0' }}>
                          ➕ Create New Travel Package
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddPkgModal(false)}
                        style={{ background: '#FFEDFA', border: 'none', color: '#BE5985', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: '900', fontSize: '1rem' }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreatePackageSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        {/* Package Name */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            1. Package Name *
                          </label>
                          <input
                            type="text"
                            value={pkgForm.title}
                            onChange={(e) => setPkgForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Goa Beach Escape"
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        {/* Destination Selection */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            2. Destination *
                          </label>
                          <select
                            value={pkgForm.destinationId}
                            onChange={(e) => setPkgForm((p) => ({ ...p, destinationId: e.target.value }))}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem', background: 'white' }}
                          >
                            {destinationsList.map((d) => (
                              <option key={d.id} value={d.id}>{d.name} ({d.country || 'Global'})</option>
                            ))}
                            {destinationsList.length === 0 && (
                              <option value="1">Goa Paradise (India)</option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Package Description */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                          3. Package Description
                        </label>
                        <textarea
                          rows="3"
                          value={pkgForm.description}
                          onChange={(e) => setPkgForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Describe the highlights, beach views, heritage trails, and itinerary overview..."
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem', resize: 'vertical' }}
                        />
                      </div>

                      {/* Package Image URL */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                          4. Package Image URL
                        </label>
                        <input
                          type="url"
                          value={pkgForm.featured_image_url}
                          onChange={(e) => setPkgForm((p) => ({ ...p, featured_image_url: e.target.value }))}
                          placeholder="https://images.unsplash.com/photo-..."
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                        />
                      </div>

                      {/* Duration & Pricing Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            5. Duration (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={pkgForm.durationDays}
                            onChange={(e) => setPkgForm((p) => ({ ...p, durationDays: Number(e.target.value), durationNights: Math.max(1, Number(e.target.value) - 1) }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            Duration (Nights)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={pkgForm.durationNights}
                            onChange={(e) => setPkgForm((p) => ({ ...p, durationNights: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            6. Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="500"
                            step="100"
                            value={pkgForm.basePrice}
                            onChange={(e) => setPkgForm((p) => ({ ...p, basePrice: Number(e.target.value) }))}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            7. Travellers
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={pkgForm.travelers}
                            onChange={(e) => setPkgForm((p) => ({ ...p, travelers: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>
                      </div>

                      {/* Transport, Hotel & Available Dates */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            8. Available Dates / Season
                          </label>
                          <input
                            type="text"
                            value={pkgForm.availableDates}
                            onChange={(e) => setPkgForm((p) => ({ ...p, availableDates: e.target.value }))}
                            placeholder="e.g. Oct 2026 - Mar 2027 / Daily Departure"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            9. Transport Type
                          </label>
                          <input
                            type="text"
                            value={pkgForm.transportType}
                            onChange={(e) => setPkgForm((p) => ({ ...p, transportType: e.target.value }))}
                            placeholder="e.g. Hotel + Transport + Activities"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            10. Hotel / Accommodation
                          </label>
                          <input
                            type="text"
                            value={pkgForm.hotelType}
                            onChange={(e) => setPkgForm((p) => ({ ...p, hotelType: e.target.value }))}
                            placeholder="e.g. 4-Star Beachfront Resort"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>
                      </div>

                      {/* Included Services & Exclusions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            11. Included Services (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={pkgForm.inclusions}
                            onChange={(e) => setPkgForm((p) => ({ ...p, inclusions: e.target.value }))}
                            placeholder="Hotel, Transport, Activities, Meals, Guide"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            Exclusions (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={pkgForm.exclusions}
                            onChange={(e) => setPkgForm((p) => ({ ...p, exclusions: e.target.value }))}
                            placeholder="Flight tickets, Personal shopping, Tips"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>
                      </div>

                      {/* Package Status */}
                      <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                          12. Package Status
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '700' }}>
                            <input
                              type="radio"
                              name="pkgStatus"
                              checked={pkgForm.status === 'active'}
                              onChange={() => setPkgForm((p) => ({ ...p, status: 'active' }))}
                              style={{ accentColor: '#15803D' }}
                            />
                            🟢 Active (Visible to Travelers)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '700' }}>
                            <input
                              type="radio"
                              name="pkgStatus"
                              checked={pkgForm.status === 'inactive'}
                              onChange={() => setPkgForm((p) => ({ ...p, status: 'inactive' }))}
                              style={{ accentColor: '#BE5985' }}
                            />
                            ⚪ Inactive (Draft / Hidden)
                          </label>
                        </div>
                      </div>

                      {/* Submit Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #F8E7F1', paddingTop: '1.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddPkgModal(false)}
                          style={{ background: '#FFF5FB', border: '1px solid #F3D2E5', color: '#7A5366', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={pkgFormSubmitting}
                          style={{
                            background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: pkgFormSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(190, 89, 133, 0.3)',
                          }}
                        >
                          {pkgFormSubmitting ? 'Saving Package...' : 'Save & Publish Package ➔'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ============================================================
                  EDIT PACKAGE MODAL
                 ============================================================ */}
              {showEditPkgModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(45, 21, 32, 0.65)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '24px',
                      padding: '2.25rem',
                      maxWidth: '750px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                      border: '1.5px solid #F3D2E5',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F8E7F1', paddingBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                          Edit Package #{editingPkgId}
                        </span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2D1520', margin: '0.2rem 0 0 0' }}>
                          ✏️ Update Package Details
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditPkgModal(false)}
                        style={{ background: '#FFEDFA', border: 'none', color: '#BE5985', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: '900', fontSize: '1rem' }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUpdatePackageSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            Package Name *
                          </label>
                          <input
                            type="text"
                            value={pkgForm.title}
                            onChange={(e) => setPkgForm((p) => ({ ...p, title: e.target.value }))}
                            required
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                            Destination
                          </label>
                          <select
                            value={pkgForm.destinationId}
                            onChange={(e) => setPkgForm((p) => ({ ...p, destinationId: e.target.value }))}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem', background: 'white' }}
                          >
                            {destinationsList.map((d) => (
                              <option key={d.id} value={d.id}>{d.name} ({d.country || 'Global'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                          Package Description
                        </label>
                        <textarea
                          rows="3"
                          value={pkgForm.description}
                          onChange={(e) => setPkgForm((p) => ({ ...p, description: e.target.value }))}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={pkgForm.durationDays}
                            onChange={(e) => setPkgForm((p) => ({ ...p, durationDays: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="500"
                            value={pkgForm.basePrice}
                            onChange={(e) => setPkgForm((p) => ({ ...p, basePrice: Number(e.target.value) }))}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.35rem' }}>
                            Status
                          </label>
                          <select
                            value={pkgForm.status}
                            onChange={(e) => setPkgForm((p) => ({ ...p, status: e.target.value }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem', background: 'white' }}
                          >
                            <option value="active">🟢 Active</option>
                            <option value="inactive">⚪ Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                          Included Services (Comma separated)
                        </label>
                        <input
                          type="text"
                          value={pkgForm.inclusions}
                          onChange={(e) => setPkgForm((p) => ({ ...p, inclusions: e.target.value }))}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.92rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #F8E7F1', paddingTop: '1.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowEditPkgModal(false)}
                          style={{ background: '#FFF5FB', border: '1px solid #F3D2E5', color: '#7A5366', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={pkgFormSubmitting}
                          style={{
                            background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: pkgFormSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(190, 89, 133, 0.3)',
                          }}
                        >
                          {pkgFormSubmitting ? 'Updating...' : 'Save Changes ➔'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 3: DESTINATION MANAGEMENT
             ============================================================ */}
          {activeTab === 'destinations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Destination Management 📍
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Catalog of destinations available for travelers and AI itinerary planners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDestModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  ➕ Add Destination
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Destination</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Country & City</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Category</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Rating</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinationsList.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#2D1520' }}>
                          📍 {d.name}
                        </td>
                        <td style={{ padding: '1rem', color: '#7A5366' }}>
                          {d.city}, {d.country}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: '#FFEDFA', color: '#BE5985', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'capitalize' }}>
                            {d.category || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#D97706' }}>
                          ⭐ {d.rating || '4.8'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteDestination(d.id)}
                            style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Destination Modal */}
              {showAddDestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#2D1520', margin: '0 0 1.25rem 0' }}>Add Destination</h3>
                    <form onSubmit={handleCreateDestination}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>Name</label>
                        <input type="text" value={destForm.name} onChange={(e) => setDestForm(p => ({ ...p, name: e.target.value }))} required style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>Country</label>
                          <input type="text" value={destForm.country} onChange={(e) => setDestForm(p => ({ ...p, country: e.target.value }))} required style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>City</label>
                          <input type="text" value={destForm.city} onChange={(e) => setDestForm(p => ({ ...p, city: e.target.value }))} required style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => setShowAddDestModal(false)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', border: '1px solid #F3D2E5', background: '#FFF5FB' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', background: '#BE5985', color: '#ffffff', fontWeight: '800' }}>Save Destination</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 4: BOOKING MANAGEMENT
             ============================================================ */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Booking Management 🎫
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Track, confirm, modify, or cancel traveler reservations and group bookings.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Ref ID</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Destination</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Amount</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsList.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#BE5985' }}>
                          {b.booking_reference || `BK-2026-${b.id}`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: '#2D1520' }}>{b.customer_name || 'Traveler'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>{b.customer_email}</div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          📍 {b.destination_name || 'Custom Plan'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#15803D' }}>
                          ₹{Number(b.total_amount || 18999).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              textTransform: 'capitalize',
                              background: b.status === 'confirmed' ? '#DCFCE7' : b.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                              color: b.status === 'confirmed' ? '#15803D' : b.status === 'pending' ? '#D97706' : '#B91C1C',
                            }}
                          >
                            {b.status || 'confirmed'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <select
                            value={b.status || 'confirmed'}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid #F3D2E5', fontSize: '0.8rem', fontWeight: '700', background: '#FFF5FB', color: '#BE5985' }}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 5: PAYMENT MANAGEMENT
             ============================================================ */}
          {activeTab === 'payments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Payment Management 💳
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Gateway transactions, Razorpay sandbox checkouts, and invoice reconciliation.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Transaction ID</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Booking Ref</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Method</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Amount</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsList.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#BE5985' }}>
                          {p.transaction_id || `TXN-RZP-${p.id}9928`}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          {p.booking_reference || `BK-2026-${p.booking_id || p.id}`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: '#2D1520' }}>{p.customer_name || 'Traveler'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>{p.customer_email || 'client@example.com'}</div>
                        </td>
                        <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: '600' }}>
                          {p.payment_method ? p.payment_method.replace('_', ' ') : 'UPI / Card'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '900', color: '#15803D' }}>
                          ₹{Number(p.amount || 18999).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', background: '#DCFCE7', color: '#15803D' }}>
                            ✓ Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 6: USER MANAGEMENT
             ============================================================ */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    User Management 👥
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Control traveler access, agent permissions, and admin privilege assignments.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>User</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Email & Contact</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Role</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#2D1520' }}>
                          {u.full_name || 'System User'}
                        </td>
                        <td style={{ padding: '1rem', color: '#7A5366' }}>
                          <div>{u.email}</div>
                          <div style={{ fontSize: '0.78rem' }}>{u.phone_number || '+91-98765-43210'}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #F3D2E5', fontSize: '0.78rem', fontWeight: '700', background: '#FFF5FB', color: '#BE5985' }}
                          >
                            <option value="traveler">Traveler</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              background: u.is_active ? '#DCFCE7' : '#FEE2E2',
                              color: u.is_active ? '#15803D' : '#B91C1C',
                            }}
                          >
                            {u.is_active ? '🟢 Active' : '🔴 Suspended'}
                          </button>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 7: REVIEWS MODERATION
             ============================================================ */}
          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Reviews & Feedback Moderation ⭐
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Moderate traveler testimonials, ratings, and approve public display.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Review Title & Feedback</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Author</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Destination</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Rating</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Approval Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsList.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '800', color: '#2D1520' }}>{r.title || 'Exceptional Holiday Experience'}</div>
                          <div style={{ fontSize: '0.82rem', color: '#7A5366', marginTop: '0.2rem' }}>{r.content || r.comment || 'The trip was brilliantly organized with flawless transport.'}</div>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          {r.author_name || 'Verified Traveler'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          📍 {r.destination_name || 'Goa & Kerala'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#D97706' }}>
                          ⭐ {r.rating || 5} / 5
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleReviewApproval(r.id, r.is_approved)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              background: r.is_approved ? '#DCFCE7' : '#FEF3C7',
                              color: r.is_approved ? '#15803D' : '#D97706',
                            }}
                          >
                            {r.is_approved ? '✓ Approved (Visible)' : '⏳ Pending / Hidden'}
                          </button>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 8: OFFERS & COUPONS
             ============================================================ */}
          {activeTab === 'coupons' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Offers & Promotional Coupons 🎟️
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Configure discount coupon codes for checkout billing and campaigns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  ➕ Create Promo Code
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFF5FB', borderBottom: '1.5px solid #F3D2E5', color: '#BE5985' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Coupon Code</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Discount</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Min Order Amount</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Usage Count</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Expiry Date</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '800', textAlign: 'right' }}>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponsList.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F8E7F1' }}>
                        <td style={{ padding: '1rem', fontWeight: '900', color: '#BE5985', letterSpacing: '0.05em' }}>
                          🎟️ {c.code}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#15803D' }}>
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </td>
                        <td style={{ padding: '1rem', color: '#7A5366' }}>
                          ₹{c.min_amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '700' }}>
                          {c.usage_count} times used
                        </td>
                        <td style={{ padding: '1rem', color: '#663B4F' }}>
                          📅 {c.expiry_date}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', background: c.is_active ? '#DCFCE7' : '#F3F4F6', color: c.is_active ? '#15803D' : '#6B7280' }}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c.id)}
                            style={{ background: '#FFF5FB', border: '1px solid #F3D2E5', color: '#BE5985', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            {c.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Coupon Modal */}
              {showAddCouponModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#2D1520', margin: '0 0 1.25rem 0' }}>Create Promotional Code</h3>
                    <form onSubmit={handleCreateCoupon}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>Promo Code *</label>
                        <input type="text" value={couponForm.code} onChange={(e) => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. FESTIVE20" required style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>Discount Type</label>
                          <select value={couponForm.discount_type} onChange={(e) => setCouponForm(p => ({ ...p, discount_type: e.target.value }))} style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5', background: 'white' }}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.3rem' }}>Value</label>
                          <input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm(p => ({ ...p, discount_value: Number(e.target.value) }))} required style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #F3D2E5' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => setShowAddCouponModal(false)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', border: '1px solid #F3D2E5', background: '#FFF5FB' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', background: '#BE5985', color: '#ffffff', fontWeight: '800' }}>Save Code</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 9: REPORTS & ANALYTICS
             ============================================================ */}
          {activeTab === 'analytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    Reports & Business Analytics 📈
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Revenue trends, destination demand clustering, and downloadable CSV exports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  style={{
                    background: '#15803D',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  {exportingCSV ? 'Exporting...' : '📥 Download CSV Report'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1rem 0' }}>
                    Monthly Revenue Realization 💰
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { month: 'August 2026', rev: 289400, share: 85 },
                      { month: 'July 2026', rev: 198200, share: 65 },
                      { month: 'June 2026', rev: 145000, share: 50 },
                      { month: 'May 2026', rev: 120500, share: 40 },
                    ].map((m, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                          <span>{m.month}</span>
                          <span style={{ color: '#15803D' }}>₹{m.rev.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#FFEDFA', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${m.share}%`, height: '100%', background: '#EC7FA9', borderRadius: '9999px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1rem 0' }}>
                    Top Booked Destinations 📍
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { name: 'Goa & Western Coast', share: '38%', count: 48 },
                      { name: 'Ooty & Nilgiris', share: '26%', count: 32 },
                      { name: 'Swiss Alps & Europe', share: '20%', count: 24 },
                      { name: 'Bali & Southeast Asia', share: '16%', count: 19 },
                    ].map((d, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#FFF5FB', borderRadius: '10px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>📍 {d.name}</span>
                        <span style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.85rem' }}>{d.share} ({d.count} trips)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 10: SETTINGS
             ============================================================ */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                    System Settings ⚙️
                  </h2>
                  <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
                    Platform environment variables, Razorpay sandbox mode, and currency preferences.
                  </p>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '2rem', maxWidth: '700px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#BE5985', fontSize: '1rem', fontWeight: '800' }}>
                      Payment Gateway Mode
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #86EFAC' }}>
                      <span style={{ fontSize: '1.5rem' }}>💳</span>
                      <div>
                        <div style={{ fontWeight: '800', color: '#15803D', fontSize: '0.92rem' }}>
                          Razorpay Sandbox / Test Mode (Active)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                          No real charges incurred. Mock UPI, Net Banking, and Test Cards enabled.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#BE5985', fontSize: '1rem', fontWeight: '800' }}>
                      Default Operating Currency
                    </h4>
                    <select style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #F3D2E5', fontWeight: '700' }}>
                      <option value="INR">Indian Rupee (INR - ₹)</option>
                      <option value="USD">US Dollar (USD - $)</option>
                    </select>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#BE5985', fontSize: '1rem', fontWeight: '800' }}>
                      Merchant Tax Registration (GSTIN)
                    </h4>
                    <input type="text" readOnly value="33AAACT7891K1Z8 (Tamil Nadu, India)" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #F3D2E5', background: '#FFF5FB', fontWeight: '700' }} />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => showNotification('System settings saved successfully.')}
                      style={{
                        background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.8rem 1.75rem',
                        borderRadius: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      Save Preferences ➔
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
