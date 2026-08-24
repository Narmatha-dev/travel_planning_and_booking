import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import ReviewsSection from '../components/ReviewsSection';
import InteractiveMapSection from '../components/InteractiveMapSection';
import TransportOptionsSection from '../components/TransportOptionsSection';
import HotelRecommendationsSection from '../components/HotelRecommendationsSection';

export default function DestinationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentLocation } = useAppContext();

  const [destination, setDestination] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    async function loadDestination() {
      setLoading(true);
      setError('');
      try {
        const data = await destinationService.getDestinationDetails(id);
        setDestination(data);
        setIsFavorite(Boolean(data.is_favorite));
        setActiveImage(data.featured_image_url || (data.gallery_images && data.gallery_images[0]) || '');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load destination details');
      } finally {
        setLoading(false);
      }
    }

    loadDestination();
    window.scrollTo(0, 0);
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (!destination || isTogglingFavorite) return;

    const nextState = !isFavorite;
    setIsFavorite(nextState);
    setIsTogglingFavorite(true);

    try {
      if (nextState) {
        await destinationService.addFavorite(destination.id);
      } else {
        await destinationService.removeFavorite(destination.id);
      }
    } catch (err) {
      console.warn('Favorite toggle failed:', err.message);
      setIsFavorite(!nextState);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', color: '#0284c7', fontWeight: '600' }}>
          ✈️ Loading destination details...
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Destination Not Found</h2>
        <p style={{ color: '#64748b', margin: '1rem 0' }}>{error || 'The requested destination could not be located.'}</p>
        <Link to="/destinations" className="btn btn-primary">
          Explore All Destinations
        </Link>
      </div>
    );
  }

  const gallery = destination.gallery_images || [destination.featured_image_url];

  return (
    <section className="section page-section" style={{ paddingTop: '1.5rem' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#0284c7', textDecoration: 'none' }}>Home</Link>
          {' / '}
          <Link to="/destinations" style={{ color: '#0284c7', textDecoration: 'none' }}>Destinations</Link>
          {' / '}
          <span style={{ color: '#0f172a', fontWeight: '600' }}>{destination.name}</span>
        </div>

        {/* Hero Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {destination.category}
            </span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              {destination.name}
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
              📍 {destination.city}, {destination.country}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleToggleFavorite}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderColor: isFavorite ? '#ef4444' : '#cbd5e1',
                color: isFavorite ? '#ef4444' : '#334155',
                background: isFavorite ? '#fef2f2' : '#ffffff',
              }}
            >
              <span>{isFavorite ? '❤️ Saved in Wishlist' : '🤍 Add to Wishlist'}</span>
            </button>
            <Link
              to={`/trip-planner?destinationId=${destination.id}`}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              🗺️ Plan Trip
            </Link>
          </div>
        </div>

        {/* Media Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ height: '420px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <img
              src={activeImage}
              alt={destination.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gallery.slice(0, 3).map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                style={{
                  flex: 1,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeImage === imgUrl ? '3px solid #0284c7' : '2px solid transparent',
                  transition: 'opacity 0.2s',
                  opacity: activeImage === imgUrl ? 1 : 0.8,
                }}
              >
                <img
                  src={imgUrl}
                  alt={`${destination.name} gallery ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          background: '#f8fafc',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '2.5rem',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>⭐ Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              {parseFloat(destination.rating).toFixed(2)} / 5.0
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>🔥 Popularity</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              Top {destination.popularity_score}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>🌤️ Climate</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginTop: '0.2rem' }}>
              {destination.climate || 'Mild & pleasant'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>📅 Best Time to Visit</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginTop: '0.2rem' }}>
              {destination.best_time_to_visit || 'Year round'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>💳 Price Level</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0284c7', marginTop: '0.2rem', textTransform: 'capitalize' }}>
              {destination.price_level}
            </div>
          </div>
        </div>

        {/* Content Grid: Description & Packages */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2.5rem' }}>
          {/* Left Column: Description & Reviews */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
              About {destination.name}
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.7', marginBottom: '2rem' }}>
              {destination.description}
            </p>

            {/* Reviews Section */}
            <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem' }}>
                💬 Traveler Reviews ({destination.reviews?.length || 0})
              </h3>

              {destination.reviews && destination.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {destination.reviews.map((rev) => (
                    <div key={rev.id} style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{rev.user_name || 'Verified Traveler'}</div>
                        <div style={{ color: '#eab308' }}>{'★'.repeat(rev.rating || 5)}</div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {rev.title}
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                  No reviews yet for this destination. Be the first to share your experience!
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Featured Packages */}
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
              📦 Curated Packages
            </h3>

            {destination.packages && destination.packages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {destination.packages.map((pkg) => (
                  <div key={pkg.id} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                          {pkg.duration_days} Days / {pkg.duration_nights} Nights
                        </span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.4rem', marginBottom: '0.25rem' }}>
                          {pkg.title}
                        </h4>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1rem 0', lineHeight: '1.4' }}>
                      {pkg.description}
                    </p>

                    {pkg.inclusions && (
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                        <strong>Includes: </strong>
                        {(Array.isArray(pkg.inclusions) ? pkg.inclusions : []).slice(0, 3).join(' • ')}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Price</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>
                          ${pkg.discount_price || pkg.base_price}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link
                          to={`/packages/${pkg.slug || pkg.id}`}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Details
                        </Link>
                        <Link
                          to={`/booking?packageId=${pkg.id}&destinationId=${destination.id}`}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>Custom itinerary available for this location.</p>
                <Link to={`/trip-planner?destinationId=${destination.id}`} className="btn btn-primary">
                  Create Custom Trip
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Phase 3: Interactive Route & Google Map Navigation */}
        {currentLocation && destination && (
          <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
            <InteractiveMapSection
              origin={currentLocation}
              destination={{
                latitude: destination.latitude || 13.0827,
                longitude: destination.longitude || 80.2707,
                name: destination.name,
                address: `${destination.city}, ${destination.country}`,
                category: destination.category,
              }}
              title={`Live Route & Directions to ${destination.name}`}
            />

            {/* Phase 4: Transport Options Comparison & Selection */}
            <div style={{ marginTop: '2rem' }}>
              <TransportOptionsSection
                origin={currentLocation}
                destination={{
                  latitude: destination.latitude || 13.0827,
                  longitude: destination.longitude || 80.2707,
                  name: destination.name,
                  address: `${destination.city}, ${destination.country}`,
                }}
              />
            </div>

            {/* Phase 7: Hotel & Stay Recommendations */}
            <div style={{ marginTop: '2.5rem' }}>
              <HotelRecommendationsSection
                destination={destination}
                destinationName={destination.name}
                latitude={destination.latitude}
                longitude={destination.longitude}
              />
            </div>
          </div>
        )}

        {/* Phase 7 fallback if user has not allowed GPS yet */}
        {!currentLocation && destination && (
          <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
            <HotelRecommendationsSection
              destination={destination}
              destinationName={destination.name}
              latitude={destination.latitude}
              longitude={destination.longitude}
            />
          </div>
        )}

        {/* Verified Reviews Section */}
        <ReviewsSection destinationId={destination.id} title={destination.name} />
      </div>
    </section>
  );
}
