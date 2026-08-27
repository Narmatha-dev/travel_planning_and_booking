import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import tripService from '../services/tripService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import ItineraryTimeline from '../components/ItineraryTimeline';
import LocationSection from '../components/LocationSection';
import InteractiveMapSection from '../components/InteractiveMapSection';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import TripReviewModal from '../components/TripReviewModal';
import ShareTripModal from '../components/ShareTripModal';
import TripSafetyCard from '../components/TripSafetyCard';
import WeatherCard from '../components/WeatherCard';
import offlineStorageService from '../services/offlineStorageService';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

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

export default function MyTripsPage() {
  const { user, isItemFavorited, toggleFavoriteItem } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'upcoming';

  const [activeTab, setActiveTab] = useState(activeTabParam);

  // Trips State
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripError, setTripError] = useState('');
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [loadingTripDetails, setLoadingTripDetails] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState(null);
  const [sharingTrip, setSharingTrip] = useState(null);

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Schedule change / change of plans');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  // Payments History State
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState('');

  // Digital Receipt Modal State (Phase 9)
  const [receiptModalBookingRef, setReceiptModalBookingRef] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Trip Feedback & Reviews State (Phase 11)
  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  // Offline Caching State (Phase 29)
  const [savedOfflineIds, setSavedOfflineIds] = useState(new Set());
  const [savingOfflineId, setSavingOfflineId] = useState(null);

  const checkSavedOffline = async () => {
    try {
      const trips = await offlineStorageService.getOfflineTrips(user?.id || 3);
      setSavedOfflineIds(new Set(trips.map((t) => t.id)));
    } catch {}
  };

  useEffect(() => {
    checkSavedOffline();
  }, [user]);

  const handleSaveForOffline = async (booking) => {
    setSavingOfflineId(booking.id);
    try {
      const res = await api.get(`/offline/trip/${booking.id}/bundle`);
      if (res.data?.data) {
        await offlineStorageService.saveTripForOffline(res.data.data);
        setSavedOfflineIds((prev) => new Set([...prev, booking.id]));
        alert('✅ Trip saved for offline access! You can view it in the Offline Trips page anytime.');
      }
    } catch (err) {
      alert(`Could not download offline bundle: ${err.message}`);
    } finally {
      setSavingOfflineId(null);
    }
  };

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
      const data = await bookingService.getUserBookings(user?.id || 3);
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
      const data = await paymentService.getPaymentHistory(user?.id || 3);
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
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleViewTripItinerary = async (tripId) => {
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

  const handleViewBookingDetails = async (booking) => {
    setSelectedBookingDetails(booking);
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

  // Feature 9: Cancel Booking
  const handleConfirmCancelBooking = async () => {
    if (!cancelModalBooking) return;
    const targetBooking = cancelModalBooking;
    setCancellingBookingId(targetBooking.id);

    try {
      await bookingService.cancelBooking(targetBooking.id, cancelReason);
      setBookings((prev) =>
        prev.map((b) => (b.id === targetBooking.id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b))
      );
      loadUserPayments();
      setCancelSuccessMsg(`Trip reservation #${targetBooking.booking_reference} has been cancelled successfully. Full refund initiated.`);
      setCancelModalBooking(null);
      setTimeout(() => setCancelSuccessMsg(''), 6000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      if (errMsg.toLowerCase().includes('already cancelled')) {
        setBookings((prev) =>
          prev.map((b) => (b.id === targetBooking.id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b))
        );
        setCancelSuccessMsg(`Trip reservation #${targetBooking.booking_reference} is already cancelled.`);
        setCancelModalBooking(null);
        setTimeout(() => setCancelSuccessMsg(''), 6000);
      } else {
        alert('Cancellation error: ' + errMsg);
      }
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Feature 10: Upcoming / Completed / Cancelled Categorization
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter((b) => b.status !== 'cancelled' && (!b.travel_date || b.travel_date >= todayStr));
  const completedBookings = bookings.filter((b) => b.status !== 'cancelled' && b.travel_date && b.travel_date < todayStr);
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const totalBookingsSpent = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, b) => acc + parseFloat(b.final_amount || 0), 0);

  const renderBookingCard = (booking, canCancel = false) => {
    const statusStyle = bookingStatusColors[booking.status] || bookingStatusColors.confirmed;
    const isCustom = booking.booking_type === 'custom_trip';

    return (
      <div
        key={booking.id}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #F3D2E5',
          padding: '1.75rem',
          boxShadow: '0 8px 24px -4px rgba(190, 89, 133, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          {booking.featured_image_url && (
            <img
              src={booking.featured_image_url}
              alt={booking.destination_name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '16px',
                objectFit: 'cover',
                border: '1px solid #F3D2E5',
              }}
            />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                }}
              >
                ● Booking: {statusStyle.label}
              </span>

              {/* Phase 9: Payment Status Badge */}
              <span
                style={{
                  background: booking.payment_status === 'completed' || booking.status === 'confirmed' ? '#dcfce7' : booking.status === 'cancelled' ? '#ede9fe' : '#fef3c7',
                  color: booking.payment_status === 'completed' || booking.status === 'confirmed' ? '#15803d' : booking.status === 'cancelled' ? '#6d28d9' : '#b45309',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                }}
              >
                💳 Payment: {booking.payment_status === 'completed' || booking.status === 'confirmed' ? 'Paid' : booking.status === 'cancelled' ? 'Refunded' : 'Pending'}
              </span>

              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#BE5985' }}>
                #{booking.booking_reference}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#7A5366' }}>
                ({isCustom ? 'AI Custom Trip' : 'Curated Package'})
              </span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.35rem 0' }}>
              {booking.destination_name || 'Selected Destination'}
            </h3>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#7A5366', marginBottom: '0.5rem' }}>
              <span>📅 {booking.travel_date} {booking.return_date ? `➔ ${booking.return_date}` : ''}</span>
              <span>👥 {booking.num_travelers} Traveler(s)</span>
            </div>

            {/* Transport & Stay Highlights */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {booking.selected_transport && (
                <span style={{ background: '#FFF5FB', color: '#BE5985', border: '1px solid #F3D2E5', padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
                  {booking.selected_transport.icon || '🚆'} {booking.selected_transport.title}
                </span>
              )}
              {booking.selected_hotel && (
                <span style={{ background: '#FFF5FB', color: '#BE5985', border: '1px solid #F3D2E5', padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
                  🏨 {booking.selected_hotel.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '180px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '700' }}>Total Amount</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#BE5985' }}>
              ₹{parseFloat(booking.final_amount || 0).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Complete Payment Button for Pending Bookings */}
            {booking.status === 'pending' && booking.payment_status !== 'completed' && (
              <Link
                to={`/booking?customTrip=${booking.booking_type === 'custom_trip'}&packageId=${booking.package_id || ''}&destinationId=${booking.destination_id || ''}&date=${booking.travel_date || ''}&travelers=${booking.num_travelers || 2}`}
                className="btn btn-primary btn-sm"
                style={{
                  fontWeight: '900',
                  padding: '0.5rem 0.95rem',
                }}
                title="Complete payment for this pending reservation"
              >
                💳 Pay Now
              </Link>
            )}

            {/* Feature 1: Rate Completed / Confirmed Trip (Phase 11) */}
            {booking.status !== 'cancelled' && (
              <button
                onClick={() => setReviewModalBooking(booking)}
                className="btn btn-secondary btn-sm"
                style={{
                  fontWeight: '800',
                  padding: '0.5rem 0.85rem',
                }}
                title="Rate your trip, places, stay and transport"
              >
                ⭐ Rate Trip
              </button>
            )}

            <button
              onClick={() => {
                setReceiptModalBookingRef(booking.booking_reference);
                setShowReceiptModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: '800', padding: '0.5rem 0.85rem' }}
              title="View / Print Digital Receipt"
            >
              🧾 Receipt
            </button>

            {/* Phase 29: Save for Offline Button */}
            {booking.status !== 'cancelled' && (
              <button
                onClick={() => handleSaveForOffline(booking)}
                disabled={savingOfflineId === booking.id}
                className="btn btn-secondary btn-sm"
                style={{
                  fontWeight: '800',
                  padding: '0.5rem 0.85rem',
                }}
                title="Save itinerary, stays, checklists & contacts for offline use"
              >
                {savingOfflineId === booking.id
                  ? '⏳ Saving...'
                  : savedOfflineIds.has(booking.id)
                  ? '📱 Saved Offline'
                  : '💾 Save Offline'}
              </button>
            )}

            <button
              onClick={() => handleViewBookingDetails(booking)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: '700', padding: '0.5rem 0.95rem' }}
            >
              🔍 Details
            </button>

            {canCancel && booking.status !== 'cancelled' && (
              <button
                onClick={() => setCancelModalBooking(booking)}
                className="btn btn-sm"
                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: '800', padding: '0.5rem 0.85rem', borderRadius: '10px' }}
              >
                ✕ Cancel Trip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="eyebrow">Traveler Hub</span>
            <h1 style={{ fontSize: '2.3rem', fontWeight: '900', color: '#BE5985', margin: '0.4rem 0 0.2rem 0' }}>
              My Trips & Bookings Hub
            </h1>
            <p style={{ color: '#7A5366', margin: 0 }}>
              Track confirmed reservations, review day-by-day itineraries, manage cancellations, and view payment receipts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', fontWeight: '800' }}>
              ➕ Plan New Trip
            </Link>
          </div>
        </div>

        {/* Current GPS Location Section (Phase 1) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <LocationSection />
        </div>

        {/* Cancel Success Alert Banner */}
        {cancelSuccessMsg && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac', padding: '1rem 1.25rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            <strong>{cancelSuccessMsg}</strong>
          </div>
        )}

        {/* Stats Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '20px',
            border: '1.5px solid #F3D2E5',
            boxShadow: '0 8px 24px -4px rgba(190, 89, 133, 0.08)',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>🚀 Upcoming Trips</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#BE5985', marginTop: '0.2rem' }}>
              {upcomingBookings.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>📜 Completed Trips</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#16a34a', marginTop: '0.2rem' }}>
              {completedBookings.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>❌ Cancelled Trips</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#b91c1c', marginTop: '0.2rem' }}>
              {cancelledBookings.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>💡 Draft Itineraries</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2D1520', marginTop: '0.2rem' }}>
              {trips.length}
            </div>
          </div>
        </div>

        {/* Feature 7: Categorized Tabs Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #F3D2E5', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTabChange('upcoming')}
            style={{
              padding: '0.85rem 1.35rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: '900',
              cursor: 'pointer',
              color: activeTab === 'upcoming' ? '#BE5985' : '#7A5366',
              borderBottom: activeTab === 'upcoming' ? '3px solid #EC7FA9' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            🚀 Upcoming Trips ({upcomingBookings.length})
          </button>

          <button
            onClick={() => handleTabChange('completed')}
            style={{
              padding: '0.85rem 1.35rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: '900',
              cursor: 'pointer',
              color: activeTab === 'completed' ? '#BE5985' : '#7A5366',
              borderBottom: activeTab === 'completed' ? '3px solid #EC7FA9' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            📜 Completed Trips ({completedBookings.length})
          </button>

          <button
            onClick={() => handleTabChange('cancelled')}
            style={{
              padding: '0.85rem 1.35rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: '900',
              cursor: 'pointer',
              color: activeTab === 'cancelled' ? '#BE5985' : '#7A5366',
              borderBottom: activeTab === 'cancelled' ? '3px solid #EC7FA9' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            ❌ Cancelled Trips ({cancelledBookings.length})
          </button>

          <button
            onClick={() => handleTabChange('trips')}
            style={{
              padding: '0.85rem 1.35rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: '800',
              cursor: 'pointer',
              color: activeTab === 'trips' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'trips' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            💡 Draft Itineraries ({trips.length})
          </button>

          <button
            onClick={() => handleTabChange('payments')}
            style={{
              padding: '0.85rem 1.35rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: '800',
              cursor: 'pointer',
              color: activeTab === 'payments' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'payments' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            💳 Payments History ({payments.length})
          </button>
        </div>

        {/* Loading / Error states */}
        {loadingBookings && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✈️</div>
            <div style={{ fontWeight: '700', color: '#0f172a' }}>Loading your travel bookings...</div>
          </div>
        )}

        {bookingError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ color: '#b91c1c', margin: '0 0 0.5rem 0' }}>{bookingError}</p>
            <button onClick={loadUserBookings} className="btn btn-primary btn-sm">Try Again</button>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: UPCOMING TRIPS                                */}
        {/* ==================================================== */}
        {!loadingBookings && activeTab === 'upcoming' && (
          <div>
            {upcomingBookings.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌴</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No upcoming trips planned</h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Your upcoming adventures will appear here. Plan your next personalized trip or choose from popular destinations!
                </p>
                <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: '800' }}>
                  Plan a Trip with AI
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {upcomingBookings.map((b) => renderBookingCard(b, true))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: COMPLETED TRIPS                               */}
        {/* ==================================================== */}
        {!loadingBookings && activeTab === 'completed' && (
          <div>
            {completedBookings.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📜</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No completed trips yet</h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Trips whose travel dates have passed will automatically be recorded here in your journey history.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {completedBookings.map((b) => renderBookingCard(b, false))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CANCELLED TRIPS                               */}
        {/* ==================================================== */}
        {!loadingBookings && activeTab === 'cancelled' && (
          <div>
            {cancelledBookings.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✨</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No cancelled reservations</h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                  All your active and completed trips remain intact.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {cancelledBookings.map((b) => renderBookingCard(b, false))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: DRAFT ITINERARIES                             */}
        {/* ==================================================== */}
        {!loadingTrips && activeTab === 'trips' && (
          <div>
            {trips.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎒</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No draft itineraries</h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Save multi-day schedules generated by the AI Trip Planner to review or edit later.
                </p>
                <Link to="/trip-planner" className="btn btn-primary">Plan New Trip</Link>
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
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>
                            {trip.status}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            📍 {trip.destination_name}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                          {trip.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                          <span>📅 {trip.start_date} to {trip.end_date}</span>
                          <span>🎒 {trip.trip_type}</span>
                          <span>💵 Budget: ${parseFloat(trip.total_budget || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSharingTrip(trip)}
                          className="btn btn-outline btn-sm"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#0284c7',
                            borderColor: '#bae6fd',
                            background: '#f0f9ff',
                            fontWeight: '700',
                          }}
                        >
                          🔗 Share
                        </button>
                        <button
                          onClick={() => toggleFavoriteItem('trip', {
                            ...trip,
                            id: trip.id,
                            title: trip.title,
                            location: trip.destination_name,
                            category: trip.trip_type || 'trip',
                            price_display: `$${parseFloat(trip.total_budget || 0).toLocaleString()} Budget`,
                          })}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {isItemFavorited('trip', trip.id) ? '❤️ Saved' : '🤍 Save Trip'}
                        </button>
                        <button
                          onClick={() => handleViewTripItinerary(trip.id)}
                          disabled={loadingTripDetails}
                          className="btn btn-outline btn-sm"
                        >
                          👁️ View Schedule
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                          disabled={deletingTripId === trip.id}
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
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
        {/* TAB 5: PAYMENTS HISTORY                              */}
        {/* ==================================================== */}
        {!loadingPayments && activeTab === 'payments' && (
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem' }}>Transaction ID</th>
                  <th style={{ padding: '0.75rem' }}>Method</th>
                  <th style={{ padding: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0284c7' }}>{p.transaction_id}</td>
                    <td style={{ padding: '0.75rem' }}>{p.payment_method?.toUpperCase()} ({p.payment_gateway})</td>
                    <td style={{ padding: '0.75rem', fontWeight: '800' }}>${parseFloat(p.amount).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: p.payment_status === 'completed' ? '#dcfce7' : '#fee2e2', color: p.payment_status === 'completed' ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{p.paid_at || 'Recent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Feature 9: Cancel Booking Modal */}
        {cancelModalBooking && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
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
                padding: '2.25rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>⚠️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', textAlign: 'center', margin: '0 0 0.5rem 0' }}>
                Cancel Trip Reservation?
              </h2>
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                Are you sure you want to cancel reservation <strong>#{cancelModalBooking.booking_reference}</strong> ({cancelModalBooking.destination_name})?
              </p>

              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                💵 A refund request will be registered and your booking status will update to Cancelled.
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
                  <option value="Schedule conflict / change of plans">Schedule conflict / change of plans</option>
                  <option value="Booked incorrect dates">Booked incorrect dates or destination</option>
                  <option value="Financial reasons">Financial or personal reasons</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Keep Reservation
                </button>
                <button
                  onClick={handleConfirmCancelBooking}
                  disabled={Boolean(cancellingBookingId)}
                  className="btn"
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: '800',
                  }}
                >
                  {cancellingBookingId ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature 8: Rich Trip Details Modal (Map + Itinerary + Stay + Transport) */}
        {selectedBookingDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
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
                borderRadius: '24px',
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedBookingDetails(null)}
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

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  ● {selectedBookingDetails.status}
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                  {selectedBookingDetails.destination_name}
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Booking Ref: <strong>#{selectedBookingDetails.booking_reference}</strong> • 📅 {selectedBookingDetails.travel_date} • 👥 {selectedBookingDetails.num_travelers} Travelers
                </div>
              </div>

              {/* Transport & Stay Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {selectedBookingDetails.selected_transport && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>🚆 Confirmed Transport</div>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{selectedBookingDetails.selected_transport.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBookingDetails.selected_transport.duration_text} ({selectedBookingDetails.selected_transport.distance_text})</div>
                  </div>
                )}

                {selectedBookingDetails.selected_hotel && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>🏨 Confirmed Stay</div>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{selectedBookingDetails.selected_hotel.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBookingDetails.selected_hotel.distance_label || 'Near Destination'}</div>
                  </div>
                )}
              </div>

              {/* Phase 26: Destination Weather for Upcoming Trip */}
              {selectedBookingDetails.status !== 'completed' && selectedBookingDetails.status !== 'cancelled' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <WeatherCard
                    destination={selectedBookingDetails.destination_name}
                    allowCurrentLocation={false}
                    compact={true}
                  />
                </div>
              )}

              {/* Trip Safety Card (Phase 25 - Feature 10) */}
              <TripSafetyCard trip={selectedBookingDetails} />

              {/* Interactive Route Map (Phase 3) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>📍 Route & Destination Map</h4>
                <InteractiveMapSection
                  destination={{
                    latitude: selectedBookingDetails.destination_lat || 12.612,
                    longitude: selectedBookingDetails.destination_lng || 80.1928,
                    name: selectedBookingDetails.destination_name,
                  }}
                  title="Route & Live Navigation"
                />
              </div>

              {/* Special Requests / Notes */}
              {selectedBookingDetails.special_requests && typeof selectedBookingDetails.special_requests === 'string' && !selectedBookingDetails.special_requests.startsWith('{') && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                  <strong>📝 Special Requests / Notes:</strong> {selectedBookingDetails.special_requests}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Final Amount</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7' }}>
                    ₹{parseFloat(selectedBookingDetails.final_amount).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setReceiptModalBookingRef(selectedBookingDetails.booking_reference);
                      setShowReceiptModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.65rem 1.25rem', fontWeight: '800', background: '#0284c7' }}
                  >
                    🧾 View Digital Receipt
                  </button>
                  <button onClick={() => setSelectedBookingDetails(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.65rem 1.5rem' }}>
                    Close
                  </button>
                </div>
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
              background: 'rgba(15, 23, 42, 0.75)',
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

              {/* Trip Safety Card (Phase 25 - Feature 10) */}
              <TripSafetyCard trip={selectedTripDetails} />

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

        {/* Digital Receipt Modal (Phase 9) */}
        <DigitalReceiptModal
          identifier={receiptModalBookingRef}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />

        {/* Trip Feedback & Review Modal (Phase 11) */}
        {reviewModalBooking && (
          <TripReviewModal
            booking={reviewModalBooking}
            onClose={() => setReviewModalBooking(null)}
            onReviewUpdated={loadUserBookings}
          />
        )}

        {/* Share Trip Modal (Phase 15) */}
        {sharingTrip && (
          <ShareTripModal
            trip={sharingTrip}
            onClose={() => setSharingTrip(null)}
          />
        )}

        {/* ==================================================== */}
        {/* CANCELLATION & 100% REFUND MODAL                     */}
        {/* ==================================================== */}
        {cancelModalBooking && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(45, 21, 32, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            onClick={() => setCancelModalBooking(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: '1.5px solid #F3D2E5',
                padding: '2rem',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(45, 21, 32, 0.25)',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#FFF5FB',
                  border: '1px solid #F3D2E5',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#7A5366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#FFEDFA',
                    border: '1px solid #FFB8E0',
                    color: '#BE5985',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#BE5985', margin: 0 }}>
                    Cancel Trip & Refund
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#7A5366', fontWeight: '600' }}>
                    Booking Ref: #{cancelModalBooking.booking_reference}
                  </span>
                </div>
              </div>

              {/* Trip Summary Card */}
              <div
                style={{
                  background: '#FFF5FB',
                  border: '1.5px solid #F3D2E5',
                  borderRadius: '16px',
                  padding: '1.1rem 1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#7A5366' }}>Destination:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#2D1520' }}>
                    {cancelModalBooking.destination_name || 'Selected Destination'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#7A5366' }}>Travel Date:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#2D1520' }}>
                    {cancelModalBooking.travel_date}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#7A5366' }}>Total Paid:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#BE5985' }}>
                    ₹{parseFloat(cancelModalBooking.final_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 100% Refund Policy Banner */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '16px',
                  padding: '0.9rem 1.1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: '1px' }}>🛡️</span>
                <div style={{ fontSize: '0.82rem', color: '#166534', lineHeight: '1.45' }}>
                  <strong>100% Full Refund Guarantee:</strong> A full refund of{' '}
                  <strong>₹{parseFloat(cancelModalBooking.final_amount || 0).toLocaleString()}</strong> will be automatically credited to your original payment method within 3–5 business days.
                </div>
              </div>

              {/* Cancellation Reason Selector */}
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                Reason for cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #F3D2E5',
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  background: '#ffffff',
                  color: '#2D1520',
                  outline: 'none',
                  fontWeight: '600',
                }}
              >
                <option value="Schedule change / change of plans">Schedule change / change of plans</option>
                <option value="Found alternative vacation destination">Found alternative vacation destination</option>
                <option value="Personal / Medical emergency">Personal / Medical emergency</option>
                <option value="Adverse weather conditions">Adverse weather conditions</option>
                <option value="Travel dates no longer suitable">Travel dates no longer suitable</option>
                <option value="Other reason">Other reason</option>
              </select>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  disabled={cancellingBookingId === cancelModalBooking.id}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.65rem 1.25rem', fontWeight: '800' }}
                >
                  Keep My Trip
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelBooking}
                  disabled={cancellingBookingId === cancelModalBooking.id}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.35rem',
                    fontWeight: '900',
                    fontSize: '0.88rem',
                    cursor: cancellingBookingId === cancelModalBooking.id ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 3px 10px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  {cancellingBookingId === cancelModalBooking.id ? '⏳ Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
