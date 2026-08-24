import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import DestinationDetailModal from './DestinationDetailModal';

const CATEGORIES = [
  { key: 'all', label: '🌟 All Places' },
  { key: 'beach', label: '🏖️ Beaches' },
  { key: 'cultural', label: '🛕 Temples & Heritage' },
  { key: 'park', label: '🌿 Parks & Nature' },
];

export default function NearbyPlacesSection() {
  const { currentLocation, locationStatus, detectLocation } = useAppContext();

  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeModalPlace, setActiveModalPlace] = useState(null);

  // Fetch nearby destinations whenever coordinates or category change
  useEffect(() => {
    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      return;
    }

    let isMounted = true;

    async function loadNearbyPlaces() {
      setLoading(true);
      setError(null);

      try {
        const data = await destinationService.getNearbyDestinations(
          currentLocation.latitude,
          currentLocation.longitude,
          {
            category: selectedCategory,
            limit: 8,
          }
        );

        if (isMounted) {
          setPlaces(data.places || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[NearbyPlacesSection] Failed to load nearby places:', err.message);
          setError('Unable to load nearby places at this moment.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNearbyPlaces();

    return () => {
      isMounted = false;
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, selectedCategory]);

  const cityName = currentLocation?.city || 'Your Location';

  return (
    <section className="section nearby-places-section" style={{ paddingTop: '2rem', paddingBottom: '2.5rem' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📍 Real-Time Exploration
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0' }}>
              Top Tourist Places Near {cityName}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.925rem', margin: 0 }}>
              Curated attractions, coastal spots, and historic monuments sorted by real distance.
            </p>
          </div>

          {/* Category Filter Pills */}
          {currentLocation && (
            <div className="nearby-category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`category-pill-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="nearby-loading-container">
            <div className="nearby-loading-header">
              <div className="location-pulse-indicator" />
              <span>Finding amazing tourist places near {cityName}...</span>
            </div>
            <div className="nearby-grid-layout">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="nearby-skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-content">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-text" />
                    <div className="skeleton-line skeleton-btn" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="nearby-state-card nearby-error-box">
            <p>⚠️ {error}</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedCategory(selectedCategory)}
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. No Location Prompt State */}
        {!loading && !error && !currentLocation && (
          <div className="nearby-state-card nearby-prompt-box">
            <div className="nearby-prompt-icon">📍</div>
            <div>
              <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem' }}>Discover Places Near You</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Enable your browser GPS location to instantly see top tourist destinations, beaches, and temples near your city.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => detectLocation(true)}
              style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
            >
              📍 Detect Location
            </button>
          </div>
        )}

        {/* 4. Loaded Places Grid */}
        {!loading && !error && currentLocation && places.length > 0 && (
          <div className="nearby-grid-layout">
            {places.map((place) => (
              <div key={place.id || place.place_id} className="card nearby-destination-card">
                {/* Real Image Container */}
                <div className="nearby-card-media">
                  <img
                    src={place.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
                    alt={place.name}
                    className="nearby-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
                    }}
                  />

                  {/* Category Pill */}
                  <span className="nearby-card-cat-badge">
                    {place.category_label || place.category || 'Attraction'}
                  </span>

                  {/* Rating Tag */}
                  <span className="nearby-card-rating-badge">
                    ⭐ {parseFloat(place.rating || 4.5).toFixed(1)}
                  </span>
                </div>

                {/* Card Content */}
                <div className="nearby-card-body">
                  {/* Distance Strip */}
                  <div className="nearby-card-dist-row">
                    <span className="nearby-dist-tag">
                      📍 {place.distance_label || `${place.distance_km} km away`}
                    </span>
                    {place.city && <span className="nearby-city-tag">{place.city}</span>}
                  </div>

                  <h3 className="nearby-card-title">{place.name}</h3>

                  <p className="nearby-card-desc">
                    {place.description || place.address}
                  </p>

                  <div className="nearby-card-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-explore"
                      onClick={() => setActiveModalPlace(place)}
                    >
                      Explore ➜
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Empty Results */}
        {!loading && !error && currentLocation && places.length === 0 && (
          <div className="nearby-state-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ fontSize: '1.05rem', color: '#64748b' }}>
              No destinations found for category '{selectedCategory}' near {cityName}.
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedCategory('all')}
              style={{ marginTop: '0.75rem' }}
            >
              View All Nearby Places
            </button>
          </div>
        )}
      </div>

      {/* Destination Detail Modal */}
      {activeModalPlace && (
        <DestinationDetailModal
          place={activeModalPlace}
          userLocation={currentLocation}
          onClose={() => setActiveModalPlace(null)}
        />
      )}
    </section>
  );
}
