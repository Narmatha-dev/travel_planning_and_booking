import { useState, useEffect } from 'react';
import InteractiveMapSection from './InteractiveMapSection';
import TransportOptionsSection from './TransportOptionsSection';
import HotelRecommendationsSection from './HotelRecommendationsSection';
import ReviewsSection from './ReviewsSection';
import WeatherCard from './WeatherCard';

export default function DestinationDetailModal({ place, userLocation, onClose }) {
  const [activeImage, setActiveImage] = useState(
    place?.featured_image_url || (place?.gallery_images && place.gallery_images[0]) || ''
  );
  const [showPlanNotice, setShowPlanNotice] = useState(false);

  useEffect(() => {
    if (place) {
      setActiveImage(place.featured_image_url || (place.gallery_images && place.gallery_images[0]) || '');
      setShowPlanNotice(false);
    }
  }, [place]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!place) return null;

  const gallery = place.gallery_images && place.gallery_images.length > 0
    ? place.gallery_images
    : [place.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'];

  const googleMapsUrl =
    place.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.address || place.city || ''))}`;

  const handlePlanClick = () => {
    setShowPlanNotice(true);
    setTimeout(() => {
      setShowPlanNotice(false);
    }, 4500);
  };

  return (
    <div className="place-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="place-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px' }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="place-modal-close-btn"
          onClick={onClose}
          aria-label="Close details"
        >
          ✕
        </button>

        {/* Modal Grid Layout */}
        <div className="place-modal-grid">
          {/* Left Column: Real Photo & Gallery */}
          <div className="place-modal-media-col">
            <div className="place-modal-hero-img-box">
              <img
                src={activeImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900'}
                alt={place.name}
                className="place-modal-hero-img"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900';
                }}
              />
              <span className="place-modal-category-badge">
                {place.category_label || place.category || 'Tourist Attraction'}
              </span>
            </div>

            {gallery.length > 1 && (
              <div className="place-modal-gallery-row">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`place-modal-thumb-btn ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`${place.name} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Place Information */}
          <div className="place-modal-info-col">
            <div className="place-modal-header">
              <div className="place-modal-meta-top">
                <span className="place-modal-rating-badge">
                  ⭐ {parseFloat(place.rating || 4.5).toFixed(1)}
                  {place.user_ratings_total ? (
                    <span className="place-modal-reviews-count">
                      {' '}({place.user_ratings_total.toLocaleString()} reviews)
                    </span>
                  ) : null}
                </span>

                {place.distance_label && (
                  <span className="place-modal-distance-badge">
                    📍 {place.distance_label}
                  </span>
                )}
              </div>

              <h2 className="place-modal-title">{place.name}</h2>
              <p className="place-modal-address">📍 {place.address || `${place.city}, ${place.country}`}</p>
            </div>

            {/* Coordinates & Opening Hours Strip */}
            <div className="place-modal-specs-strip">
              {place.latitude !== undefined && place.longitude !== undefined && (
                <div className="place-modal-spec-item">
                  <span className="spec-label">Coordinates</span>
                  <span className="spec-value">
                    {Math.abs(place.latitude).toFixed(4)}°{place.latitude >= 0 ? 'N' : 'S'},{' '}
                    {Math.abs(place.longitude).toFixed(4)}°{place.longitude >= 0 ? 'E' : 'W'}
                  </span>
                </div>
              )}

              {place.opening_hours && (
                <div className="place-modal-spec-item">
                  <span className="spec-label">Opening Hours</span>
                  <span className="spec-value">{place.opening_hours}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="place-modal-description">
              <h3>About this place</h3>
              <p>{place.description || 'A popular and scenic tourist attraction with memorable sights and rich travel experiences.'}</p>
            </div>
          </div>
        </div>

        {/* Phase 26: Weather & Forecast Card */}
        <div style={{ padding: '0 1.5rem 1rem' }}>
          <WeatherCard
            destination={place.city || place.name}
            coordinates={place.latitude && place.longitude ? { latitude: place.latitude, longitude: place.longitude } : null}
            showForecastToggle={true}
            allowCurrentLocation={false}
            compact={true}
          />
        </div>

        {/* Phase 3: Interactive Google Map & Road Route Section */}
        {userLocation && place.latitude && place.longitude && (
          <div style={{ padding: '0 1.5rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <InteractiveMapSection
              origin={userLocation}
              destination={place}
              title={`Live Route to ${place.name}`}
              onPlanTripClick={handlePlanClick}
            />

            {/* Phase 4: Transport Options Comparison & Selection */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
              <TransportOptionsSection
                origin={userLocation}
                destination={place}
                distanceKm={place.distance_km}
                onContinueToTripPlanning={handlePlanClick}
              />
            </div>

            {/* Phase 7: Hotel & Stay Recommendations */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
              <HotelRecommendationsSection
                destination={place}
                destinationName={place.name}
                latitude={place.latitude}
                longitude={place.longitude}
                onContinueToTripPlanning={handlePlanClick}
              />
            </div>

            {/* Phase 11: Verified Customer Reviews & Ratings */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
              <ReviewsSection destinationId={place.id || 1} title={place.name} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
