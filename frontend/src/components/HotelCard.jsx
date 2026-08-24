import React from 'react';

export default function HotelCard({
  hotel,
  isSelected = false,
  onSelect,
  onViewDetails,
}) {
  if (!hotel) return null;

  return (
    <div className={`travelora-hotel-card ${isSelected ? 'selected' : ''}`}>
      {/* Top Media Container */}
      <div className="hotel-card-media-wrapper">
        <img
          src={hotel.featured_image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'}
          alt={hotel.name}
          className="hotel-card-img"
          loading="lazy"
        />
        <div className="hotel-card-badges-overlay">
          <span className="hotel-type-chip">
            {hotel.type_label || `🏨 ${hotel.type?.toUpperCase()}`}
          </span>
          {isSelected && (
            <span className="hotel-selected-badge">
              ✓ Selected Stay
            </span>
          )}
        </div>
      </div>

      {/* Hotel Content Body */}
      <div className="hotel-card-body">
        <div className="hotel-card-meta-top">
          <div className="hotel-rating-pill">
            ⭐ {parseFloat(hotel.rating || 4.5).toFixed(1)}
            {hotel.user_ratings_total ? (
              <span className="hotel-reviews-count">
                {' '}({hotel.user_ratings_total.toLocaleString()})
              </span>
            ) : null}
          </div>

          {hotel.distance_label && (
            <div className="hotel-distance-pill">
              📍 {hotel.distance_label}
            </div>
          )}
        </div>

        <h3 className="hotel-card-title" title={hotel.name}>
          {hotel.name}
        </h3>

        <p className="hotel-card-address" title={hotel.address}>
          {hotel.address || `${hotel.city || ''}, ${hotel.country || ''}`}
        </p>

        {/* Key Amenities Preview */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="hotel-amenities-tags">
            {hotel.amenities.slice(0, 2).map((amenity, idx) => (
              <span key={idx} className="hotel-amenity-tag">
                • {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Pricing Strip */}
        <div className="hotel-pricing-strip">
          <div className="hotel-price-label-group">
            <span className="hotel-price-sub">Tariff Estimate</span>
            <div className="hotel-price-val">
              {hotel.price_display || `Approx. ₹${hotel.approx_price_per_night || 2500} / night`}
            </div>
          </div>

          <div className="hotel-card-actions">
            <button
              type="button"
              className="hotel-btn-details"
              onClick={() => onViewDetails(hotel)}
              title="View stay specs, full gallery and location"
            >
              View Details
            </button>

            <button
              type="button"
              className={`hotel-btn-select ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(hotel)}
            >
              {isSelected ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
