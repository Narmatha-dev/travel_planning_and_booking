import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tripService from '../services/tripService';
import ItineraryTimeline from '../components/ItineraryTimeline';

const statusColors = {
  planned: { bg: '#dbeafe', color: '#1d4ed8' },
  ongoing: { bg: '#dcfce7', color: '#15803d' },
  completed: { bg: '#f1f5f9', color: '#475569' },
  draft: { bg: '#fef3c7', color: '#b45309' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

export default function MyTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUserTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tripService.getUserTrips();
      setTrips(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserTrips();
  }, []);

  const handleViewItinerary = async (tripId) => {
    setLoadingDetails(true);
    try {
      const fullTrip = await tripService.getTripDetails(tripId);
      setSelectedTripDetails(fullTrip);
    } catch (err) {
      alert('Failed to load itinerary: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteTrip = async (tripId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingId(tripId);
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTripDetails?.id === tripId) {
        setSelectedTripDetails(null);
      }
    } catch (err) {
      alert('Failed to delete trip: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPlannedBudget = trips.reduce((acc, t) => acc + parseFloat(t.total_budget || 0), 0);

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Title & CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="eyebrow">Travel Dashboard</span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
              My Trips & Custom Itineraries
            </h1>
            <p style={{ color: '#64748b' }}>
              Manage your upcoming vacations, view day-by-day schedules, and track travel budgets.
            </p>
          </div>

          <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            ➕ Plan New Trip
          </Link>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '2.5rem',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Trips</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              {trips.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Planned / Upcoming</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
              {trips.filter((t) => t.status === 'planned').length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Allocated Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0284c7', marginTop: '0.2rem' }}>
              ${totalPlannedBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Content: Trips List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '1.25rem', color: '#0284c7', fontWeight: '600' }}>
              ✈️ Loading your trips...
            </div>
          </div>
        ) : error ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <h3>Error loading trips</h3>
            <p style={{ marginTop: '0.5rem' }}>{error}</p>
            <button onClick={loadUserTrips} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧳</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>No Planned Trips Yet</h3>
            <p style={{ color: '#64748b', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
              Start by choosing your favorite destination and generating a day-wise itinerary!
            </p>
            <Link to="/trip-planner" className="btn btn-primary">
              ✨ Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {trips.map((trip) => {
              const statusStyle = statusColors[trip.status] || statusColors.planned;

              return (
                <div
                  key={trip.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr auto',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.25rem',
                  }}
                >
                  {/* Trip Cover Image */}
                  <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={trip.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
                      alt={trip.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Trip Info */}
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      📍 {trip.destination_name} ({trip.destination_city || ''}, {trip.destination_country || ''})
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                      {trip.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                      <span>📅 {trip.start_date} to {trip.end_date}</span>
                      <span>🎒 {trip.trip_type} trip</span>
                      {trip.activities_count !== undefined && (
                        <span>✨ {trip.activities_count} Scheduled Activities</span>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Budget: </span>
                        <strong style={{ color: '#0f172a' }}>${parseFloat(trip.total_budget).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimated Cost: </span>
                        <strong style={{ color: '#0284c7' }}>${parseFloat(trip.estimated_cost).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                    <button
                      onClick={() => handleViewItinerary(trip.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                    >
                      {loadingDetails && selectedTripDetails?.id === trip.id ? 'Loading...' : '📋 View Itinerary'}
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id, trip.title)}
                      disabled={deletingId === trip.id}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      {deletingId === trip.id ? 'Deleting...' : '🗑️ Delete Trip'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal / Itinerary Viewer Drawer */}
        {selectedTripDetails && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                {selectedTripDetails.notes && (
                  <p style={{ marginTop: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Notes:</strong> {selectedTripDetails.notes}
                  </p>
                )}
              </div>

              {/* Itinerary Timeline */}
              <ItineraryTimeline days={selectedTripDetails.days} />

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedTripDetails(null)}
                  className="btn btn-secondary"
                >
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
