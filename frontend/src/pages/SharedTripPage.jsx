import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import shareService from '../services/shareService';
import { useAppContext } from '../context/AppContext';

export default function SharedTripPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toggleFavoriteItem, isAuthenticated, showToast } = useAppContext();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSharedTrip() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const data = await shareService.getPublicSharedTrip(token);
        setTrip(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Sorry, this shared trip link is no longer available.');
      } finally {
        setLoading(false);
      }
    }
    loadSharedTrip();
  }, [token]);

  const handlePlanSimilar = () => {
    if (!trip) return;
    const destParam = encodeURIComponent(trip.destination_name || trip.destination_city || 'Bali');
    navigate(`/trip-planner?destination=${destParam}`);
  };

  const handleSaveToFavorites = async () => {
    if (!isAuthenticated) {
      if (showToast) showToast('⚠️ Please login to save this trip to your wishlist.');
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    if (!trip) return;

    await toggleFavoriteItem('trip', {
      title: trip.title,
      location: trip.destination_name,
      category: trip.trip_type || 'Shared Trip',
      price_display: `$${trip.total_budget || trip.estimated_cost} Budget`,
      image_url: trip.featured_image_url,
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 1.5s infinite' }}>✈️</div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          Loading Shared Travel Plan...
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Fetching itinerary details and route preview</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px dashed #cbd5e1',
            padding: '3.5rem 2rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
            Trip Link Unavailable
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 auto 1.75rem auto' }}>
            {error || 'This shared trip plan is no longer active or may have been made private by the traveler.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/destinations" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: '800' }}>
              🌍 Explore Destinations
            </Link>
            <Link to="/trip-planner" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontWeight: '700' }}>
              🚀 Plan New Trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysCount = (trip.days && trip.days.length) || (trip.itineraries ? new Set(trip.itineraries.map((i) => i.day_number)).size : 3);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
            🔗 Public Shared Trip Plan
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
            👁️ {trip.views_count || 1} Views
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleSaveToFavorites}
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '10px', fontWeight: '700', fontSize: '0.82rem' }}
          >
            ❤️ Save to Wishlist
          </button>
          <button
            type="button"
            onClick={handlePlanSimilar}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem' }}
          >
            🚀 Plan Similar Trip
          </button>
        </div>
      </div>

      {/* Hero Media Card */}
      <div
        style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '280px',
          marginBottom: '2rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <img
          src={trip.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
          alt={trip.title}
          style={{ width: '100%', height: '320px', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)',
            padding: '2rem',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>
              📍 {trip.destination_name} {trip.destination_country ? `• ${trip.destination_country}` : ''}
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>
            {trip.title}
          </h1>
          {trip.notes && (
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '650px', lineHeight: '1.4' }}>
              {trip.notes}
            </p>
          )}
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>⏳ Duration</span>
          <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
            {daysCount} Days
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {trip.start_date ? `${trip.start_date} to ${trip.end_date || ''}` : 'Flexible dates'}
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>🎒 Travel Style</span>
          <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>
            {trip.trip_type || 'Leisure'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Customized itinerary</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>💰 Estimated Budget</span>
          <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
            ${parseFloat(trip.total_budget || trip.estimated_cost || 0).toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '700' }}>Approximate guideline</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Day-by-Day Itinerary Schedule */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              📅 Day-by-Day Travel Schedule
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
              {daysCount} Days Planned
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(trip.days && trip.days.length > 0) ? (
              trip.days.map((day) => (
                <div
                  key={day.day_number}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: '#ffffff',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                      }}
                    >
                      {day.day_number}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                        Day {day.day_number} {day.date ? `• ${day.date}` : ''}
                      </h4>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    {(day.activities || []).map((act, aIdx) => (
                      <div
                        key={aIdx}
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284c7' }}>
                              ⏱️ {act.activity_time || 'Morning'}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {act.activity_type || 'sightseeing'}
                            </span>
                          </div>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                            {act.title}
                          </h5>
                          {act.description && (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                              {act.description}
                            </p>
                          )}
                          {act.location_name && (
                            <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
                              📍 {act.location_name}
                            </span>
                          )}
                        </div>

                        {act.cost > 0 && (
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>
                            ${act.cost}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Flat Itineraries list fallback */
              <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <p style={{ color: '#64748b', margin: 0 }}>
                  This trip features full sightseeing and activity blueprints in {trip.destination_name}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Bottom Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌟</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>
            Love this travel blueprint?
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Clone this itinerary into our AI Trip Planner, adjust dates, pick verified stays, and calculate live transport fares.
          </p>
          <button
            type="button"
            onClick={handlePlanSimilar}
            className="btn btn-primary"
            style={{
              padding: '0.85rem 2rem',
              fontWeight: '800',
              fontSize: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            }}
          >
            🚀 Plan Similar Trip with AI
          </button>
        </div>
      </div>
    </div>
  );
}
