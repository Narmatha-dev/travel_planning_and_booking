import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import tripService from '../services/tripService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import ItineraryTimeline from '../components/ItineraryTimeline';

const tripStatusColors = {
  planned: { bg: '#dbeafe', color: '#1d4ed8' },
  ongoing: { bg: '#dcfce7', color: '#15803d' },
  completed: { bg: '#f1f5f9', color: '#475569' },
  draft: { bg: '#fef3c7', color: '#b45309' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

const bookingStatusColors = {
  confirmed: { bg: '#dcfce7', color: '#15803d', label: 'Confirmed' },
  pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  completed: { bg: '#f1f5f9', color: '#475569', label: 'Completed' },
  refunded: { bg: '#ede9fe', color: '#6d28d9', label: 'Refunded' },
};

const paymentStatusColors = {
  completed: { bg: '#dcfce7', color: '#15803d', label: 'Completed' },
  pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  failed: { bg: '#fee2e2', color: '#b91c1c', label: 'Failed' },
  refunded: { bg: '#ede9fe', color: '#6d28d9', label: 'Refunded' },
};

export default function MyTripsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'trips';

  const [activeTab, setActiveTab] = useState(activeTabParam);

  // Trips State
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripError, setTripError] = useState('');
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [loadingTripDetails, setLoadingTripDetails] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState(null);

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [selectedBookingReceipt, setSelectedBookingReceipt] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Schedule change');
  const [statusFilter, setStatusFilter] = useState('all');

  // Payments History State
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const loadUserTrips = async () => {
    setLoadingTrips(true);
    setTripError('');
    try {
      const data = await tripService.getUserTrips();
      setTrips(data || []);
    } catch (err) {
      setTripError(err.response?.data?.message || err.message || 'Failed to load trips');
    } finally {
      setLoadingTrips(false);
    }
  };

  const loadUserBookings = async () => {
    setLoadingBookings(true);
    setBookingError('');
    try {
      const data = await bookingService.getUserBookings(3);
      setBookings(data || []);
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to load bookings history');
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadUserPayments = async () => {
    setLoadingPayments(true);
    setPaymentError('');
    try {
      const data = await paymentService.getPaymentHistory(3);
      setPayments(data || []);
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || 'Failed to load payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadUserTrips();
    loadUserBookings();
    loadUserPayments();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleViewItinerary = async (tripId) => {
    setLoadingTripDetails(true);
    try {
      const fullTrip = await tripService.getTripDetails(tripId);
      setSelectedTripDetails(fullTrip);
    } catch (err) {
      alert('Failed to load itinerary: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingTripDetails(false);
    }
  };

  const handleDeleteTrip = async (tripId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingTripId(tripId);
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTripDetails?.id === tripId) {
        setSelectedTripDetails(null);
      }
    } catch (err) {
      alert('Failed to delete trip: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancellingBookingId(cancelModalBooking.id);

    try {
      const result = await bookingService.cancelBooking(cancelModalBooking.id, cancelReason);
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b))
      );
      loadUserPayments(); // Refresh payments list to reflect refund status
      setCancelModalBooking(null);
      alert(`Booking #${cancelModalBooking.booking_reference} has been cancelled successfully. Refund processing initiated.`);
    } catch (err) {
      alert('Cancellation error: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancellingBookingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const filteredPayments = payments.filter((p) => {
    if (paymentStatusFilter === 'all') return true;
    return p.payment_status === paymentStatusFilter;
  });

  const totalPlannedBudget = trips.reduce((acc, t) => acc + parseFloat(t.total_budget || 0), 0);
  const totalBookingsSpent = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, b) => acc + parseFloat(b.final_amount || 0), 0);

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Title & CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="eyebrow">Traveler Hub</span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
              My Trips & Financial Activity
            </h1>
            <p style={{ color: '#64748b' }}>
              Manage customized itineraries, inspect confirmed package bookings, and audit transaction payment histories.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/packages" className="btn btn-outline" style={{ padding: '0.75rem 1.25rem' }}>
              📦 Browse Packages
            </Link>
            <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              ➕ Plan New Trip
            </Link>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Custom Trips</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              {trips.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Package Bookings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0284c7', marginTop: '0.2rem' }}>
              {bookings.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
              {payments.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Amount Paid</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              ${totalBookingsSpent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs Switcher: Custom Trips vs Package Bookings vs Payment History */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTabChange('trips')}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              background: 'transparent',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'trips' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'trips' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🗺️</span> Custom Planned Trips ({trips.length})
          </button>

          <button
            onClick={() => handleTabChange('bookings')}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              background: 'transparent',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'bookings' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'bookings' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📦</span> Package Bookings ({bookings.length})
          </button>

          <button
            onClick={() => handleTabChange('payments')}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              background: 'transparent',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'payments' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'payments' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>💳</span> Payment History ({payments.length})
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: CUSTOM TRIPS                                  */}
        {/* ==================================================== */}
        {activeTab === 'trips' && (
          <div>
            {loadingTrips ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#0284c7', marginBottom: '0.5rem' }}>✈️</div>
                <div style={{ fontWeight: '600', color: '#334155' }}>Loading your planned trips...</div>
              </div>
            ) : tripError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>{tripError}</p>
                <button onClick={loadUserTrips} className="btn btn-primary">Try Again</button>
              </div>
            ) : trips.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No trips planned yet</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  Use our interactive trip planner to generate multi-day schedules tailored to your travel style.
                </p>
                <Link to="/trip-planner" className="btn btn-primary">Plan Your First Trip</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {trips.map((trip) => {
                  const statusStyle = tripStatusColors[trip.status] || tripStatusColors.planned;
                  return (
                    <div
                      key={trip.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            {trip.status}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            📍 {trip.destination_name} ({trip.destination_city || ''}, {trip.destination_country || ''})
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                          {trip.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                          <span>📅 {trip.start_date} to {trip.end_date}</span>
                          <span>🎒 {trip.trip_type} trip</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ color: '#94a3b8' }}>Total Budget: </span>
                          <strong style={{ color: '#0f172a' }}>${parseFloat(trip.total_budget || 0).toLocaleString()}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleViewItinerary(trip.id)}
                          className="btn btn-primary"
                          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                        >
                          {loadingTripDetails && selectedTripDetails?.id === trip.id ? 'Loading...' : '📋 View Schedule'}
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                          disabled={deletingTripId === trip.id}
                          className="btn btn-outline"
                          style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PACKAGE BOOKINGS HISTORY                      */}
        {/* ==================================================== */}
        {activeTab === 'bookings' && (
          <div>
            {/* Status Filters Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'confirmed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '9999px',
                      border: statusFilter === st ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: statusFilter === st ? '#e0f2fe' : '#ffffff',
                      color: statusFilter === st ? '#0369a1' : '#475569',
                      fontWeight: statusFilter === st ? '700' : '500',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st === 'all' ? 'All Bookings' : st}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing <strong>{filteredBookings.length}</strong> booking{filteredBookings.length === 1 ? '' : 's'}
              </span>
            </div>

            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#0284c7', marginBottom: '0.5rem' }}>✈️</div>
                <div style={{ fontWeight: '600', color: '#334155' }}>Loading your booking history...</div>
              </div>
            ) : bookingError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>{bookingError}</p>
                <button onClick={loadUserBookings} className="btn btn-primary">Try Again</button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  No package bookings found
                </h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Explore curated travel packages with pre-booked stays, private guides, and instant reservation confirmation.
                </p>
                <Link to="/packages" className="btn btn-primary">Explore Travel Packages</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredBookings.map((b) => {
                  const statusStyle = bookingStatusColors[b.status] || bookingStatusColors.confirmed;
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <div
                      key={b.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '1.5rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        borderLeft: isCancelled ? '4px solid #ef4444' : '4px solid #16a34a',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            {statusStyle.label}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7' }}>
                            {b.booking_reference}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            • {b.created_at?.split(' ')[0] || 'Recently Booked'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                          {b.package_title || 'Curated Travel Package'}
                        </h3>

                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                          <span>📍 <strong>Destination:</strong> {b.destination_name}</span>
                          <span>📅 <strong>Travel Date:</strong> {b.travel_date}</span>
                          <span>👥 <strong>Guests:</strong> {b.num_travelers} Traveler(s)</span>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Amount Paid:</span>
                          <strong style={{ fontSize: '1.15rem', color: isCancelled ? '#94a3b8' : '#16a34a' }}>
                            ${parseFloat(b.final_amount).toLocaleString()}
                          </strong>
                          {b.transaction_id && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              (Txn: {b.transaction_id})
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                        <button
                          onClick={() => setSelectedBookingReceipt(b)}
                          className="btn btn-outline"
                          style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', textAlign: 'center' }}
                        >
                          📄 View Receipt
                        </button>

                        {!isCancelled && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            disabled={cancellingBookingId === b.id}
                            className="btn btn-outline"
                            style={{
                              padding: '0.55rem 1rem',
                              fontSize: '0.85rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              background: '#fff5f5',
                            }}
                          >
                            {cancellingBookingId === b.id ? 'Processing...' : '❌ Cancel Booking'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PAYMENT HISTORY                               */}
        {/* ==================================================== */}
        {activeTab === 'payments' && (
          <div>
            {/* Status Filters Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'completed', 'refunded', 'failed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentStatusFilter(st)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '9999px',
                      border: paymentStatusFilter === st ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: paymentStatusFilter === st ? '#e0f2fe' : '#ffffff',
                      color: paymentStatusFilter === st ? '#0369a1' : '#475569',
                      fontWeight: paymentStatusFilter === st ? '700' : '500',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st === 'all' ? 'All Transactions' : st}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing <strong>{filteredPayments.length}</strong> transaction{filteredPayments.length === 1 ? '' : 's'}
              </span>
            </div>

            {loadingPayments ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#0284c7', marginBottom: '0.5rem' }}>💳</div>
                <div style={{ fontWeight: '600', color: '#334155' }}>Loading payment transaction history...</div>
              </div>
            ) : paymentError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>{paymentError}</p>
                <button onClick={loadUserPayments} className="btn btn-primary">Try Again</button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  No payment transactions found
                </h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Your secure financial transaction audit logs and receipts will appear here once bookings are confirmed.
                </p>
                <Link to="/packages" className="btn btn-primary">Book a Package</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredPayments.map((p) => {
                  const statusStyle = paymentStatusColors[p.payment_status] || paymentStatusColors.completed;
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            {statusStyle.label}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                            {p.transaction_id}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            • {p.paid_at?.split(' ')[0] || p.created_at?.split(' ')[0] || 'Recently Processed'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                          {p.package_title || 'Travel Booking Payment'}
                        </h3>

                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                          <span>📍 <strong>Destination:</strong> {p.destination_name || 'Destination'}</span>
                          <span>🔖 <strong>Booking Reference:</strong> {p.booking_reference}</span>
                          <span>💳 <strong>Method:</strong> {p.payment_method?.toUpperCase()} ({p.payment_gateway})</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '150px' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: p.payment_status === 'refunded' ? '#7c3aed' : '#0f172a' }}>
                          ${parseFloat(p.amount).toLocaleString()} {p.currency || 'USD'}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                          {p.payment_status === 'completed' ? '✓ Paid & Settled' : p.payment_status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL: VIEW BOOKING RECEIPT                          */}
        {/* ==================================================== */}
        {selectedBookingReceipt && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedBookingReceipt(null)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#475569',
                }}
              >
                ✕
              </button>

              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '9999px', fontWeight: '700' }}>
                  OFFICIAL BOOKING & PAYMENT RECEIPT
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0 0.2rem 0' }}>
                  {selectedBookingReceipt.booking_reference}
                </h2>
                <span style={{
                  display: 'inline-block',
                  background: selectedBookingReceipt.status === 'confirmed' ? '#dcfce7' : '#fee2e2',
                  color: selectedBookingReceipt.status === 'confirmed' ? '#15803d' : '#b91c1c',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}>
                  {selectedBookingReceipt.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
                <div><strong>Package:</strong> {selectedBookingReceipt.package_title}</div>
                <div><strong>Destination:</strong> {selectedBookingReceipt.destination_name}</div>
                <div><strong>Departure Date:</strong> {selectedBookingReceipt.travel_date}</div>
                <div><strong>Return Date:</strong> {selectedBookingReceipt.return_date || 'N/A'}</div>
                <div><strong>Guests:</strong> {selectedBookingReceipt.num_travelers} Traveler(s)</div>
                <div><strong>Payment Method:</strong> {selectedBookingReceipt.payment_method || 'Credit Card'}</div>
                <div><strong>Transaction ID:</strong> {selectedBookingReceipt.transaction_id || 'N/A'}</div>
                <div><strong>Payment Status:</strong> <span style={{ color: '#16a34a', fontWeight: '700' }}>{selectedBookingReceipt.payment_status || 'completed'}</span></div>
              </div>

              {selectedBookingReceipt.special_requests && (
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem' }}>
                  <strong>Special Requests:</strong> {selectedBookingReceipt.special_requests}
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <span>Base Booking Amount:</span>
                  <span>${parseFloat(selectedBookingReceipt.total_amount).toLocaleString()}</span>
                </div>
                {parseFloat(selectedBookingReceipt.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#16a34a' }}>
                    <span>Discounts Applied:</span>
                    <span>−${parseFloat(selectedBookingReceipt.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', borderTop: '2px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <span>Total Paid:</span>
                  <span style={{ color: '#0284c7' }}>${parseFloat(selectedBookingReceipt.final_amount).toLocaleString()} USD</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => window.print()} className="btn btn-outline" style={{ padding: '0.65rem 1.25rem' }}>
                  🖨️ Print Receipt
                </button>
                <button onClick={() => setSelectedBookingReceipt(null)} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL: CANCEL BOOKING CONFIRMATION                   */}
        {/* ==================================================== */}
        {cancelModalBooking && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>⚠️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', textAlign: 'center', margin: '0 0 0.5rem 0' }}>
                Cancel Booking?
              </h2>
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                Are you sure you want to cancel reservation <strong>#{cancelModalBooking.booking_reference}</strong> ({cancelModalBooking.package_title})?
              </p>

              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                💵 A full refund of <strong>${parseFloat(cancelModalBooking.final_amount).toLocaleString()} USD</strong> will be credited to your original payment method within 3–5 business days.
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Reason for Cancellation:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="Schedule conflict">Schedule conflict / change of plans</option>
                  <option value="Booking error">Booked incorrect dates/package</option>
                  <option value="Financial reasons">Financial or personal reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Keep Reservation
                </button>
                <button
                  onClick={handleConfirmCancelBooking}
                  disabled={Boolean(cancellingBookingId)}
                  className="btn btn-outline"
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    borderColor: '#dc2626',
                  }}
                >
                  {cancellingBookingId ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Custom Trip Itinerary Details */}
        {selectedTripDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedTripDetails(null)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#475569',
                }}
              >
                ✕
              </button>

              <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  {selectedTripDetails.status}
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                  {selectedTripDetails.title}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  📍 {selectedTripDetails.destination_name} • 📅 {selectedTripDetails.start_date} to {selectedTripDetails.end_date} • 💵 Total Budget: ${selectedTripDetails.total_budget}
                </p>
              </div>

              {/* Itinerary Timeline */}
              <ItineraryTimeline days={selectedTripDetails.days} />

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedTripDetails(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
