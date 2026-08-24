import React, { useState } from 'react';

export default function HotelDetailModal({
  hotel,
  isOpen,
  onClose,
  onSelectStay,
  isSelected = false,
  nights = 2,
}) {
  const [activeImage, setActiveImage] = useState(() => {
    return hotel?.featured_image_url || (hotel?.gallery_images && hotel?.gallery_images[0]) || '';
  });
  const [stayNights, setStayNights] = useState(nights || 2);

  if (!isOpen || !hotel) return null;

  const gallery = hotel.gallery_images && hotel.gallery_images.length > 0
    ? hotel.gallery_images
    : [hotel.featured_image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80'];

  const currentDisplayImage = activeImage || gallery[0];
  const nightlyRate = hotel.approx_price_per_night || 2500;
  const sym = hotel.currency_symbol || (hotel.currency === 'USD' ? '$' : '₹');
  const estimatedStayTotal = nightlyRate * stayNights;

  return (
    <div className="travelora-hotel-modal-overlay" onClick={onClose}>
      <div className="travelora-hotel-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button type="button" className="hotel-modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Modal Grid */}
        <div className="hotel-modal-grid">
          {/* Left Column: Gallery */}
          <div className="hotel-modal-gallery-col">
            <div className="hotel-modal-main-img-wrapper">
              <img src={currentDisplayImage} alt={hotel.name} className="hotel-modal-main-img" />
              <span className="hotel-modal-type-badge">
                {hotel.type_label || `🏨 ${hotel.type?.toUpperCase()}`}
              </span>
            </div>

            {gallery.length > 1 && (
              <div className="hotel-modal-thumbs-strip">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`hotel-modal-thumb-btn ${currentDisplayImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`${hotel.name} thumb ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Hotel Details & Information */}
          <div className="hotel-modal-info-col">
            <div className="hotel-modal-header">
              <div className="hotel-modal-meta-top">
                <span className="hotel-modal-rating-chip">
                  ⭐ {parseFloat(hotel.rating || 4.5).toFixed(1)}
                  {hotel.user_ratings_total ? (
                    <span className="hotel-modal-reviews-count">
                      {' '}({hotel.user_ratings_total.toLocaleString()} reviews)
                    </span>
                  ) : null}
                </span>

                {hotel.distance_label && (
                  <span className="hotel-modal-distance-chip">
                    📍 {hotel.distance_label}
                  </span>
                )}
              </div>

              <h2 className="hotel-modal-title">{hotel.name}</h2>
              <p className="hotel-modal-address">📍 {hotel.address || `${hotel.city}, ${hotel.country}`}</p>
            </div>

            {/* Coordinates Strip */}
            {hotel.latitude && hotel.longitude && (
              <div className="hotel-modal-coords-strip">
                <span className="coords-label">GPS Location:</span>
                <span className="coords-val">
                  {Math.abs(hotel.latitude).toFixed(4)}°{hotel.latitude >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(hotel.longitude).toFixed(4)}°{hotel.longitude >= 0 ? 'E' : 'W'}
                </span>
              </div>
            )}

            {/* Description */}
            <div className="hotel-modal-description">
              <h3>About this accommodation</h3>
              <p>{hotel.description || 'A comfortable and highly rated accommodation with convenient access to key local attractions.'}</p>
            </div>

            {/* Amenities Grid */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="hotel-modal-amenities-section">
                <h3>Highlights & Amenities</h3>
                <div className="hotel-modal-amenities-grid">
                  {hotel.amenities.map((amenity, idx) => (
                    <span key={idx} className="hotel-modal-amenity-chip">
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Attractions */}
            {hotel.nearby_attractions && hotel.nearby_attractions.length > 0 && (
              <div className="hotel-modal-nearby-section">
                <h3>Nearby Tourist Attractions</h3>
                <div className="hotel-modal-nearby-tags">
                  {hotel.nearby_attractions.map((attr, idx) => (
                    <span key={idx} className="hotel-modal-nearby-tag">
                      🎯 {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Stay Cost Calculator */}
            <div className="hotel-modal-pricing-box">
              <div className="hotel-modal-pricing-header">
                <div>
                  <span className="pricing-title">Estimated Accommodation Cost</span>
                  <div className="pricing-nightly-rate">
                    {hotel.price_display || `Approx. ${sym}${nightlyRate.toLocaleString()} / night`}
                  </div>
                </div>

                <div className="hotel-modal-nights-selector">
                  <label htmlFor="nights-input">Nights:</label>
                  <select
                    id="nights-input"
                    value={stayNights}
                    onChange={(e) => setStayNights(parseInt(e.target.value, 10) || 1)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
                      <option key={n} value={n}>
                        {n} Night{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hotel-modal-cost-breakdown">
                <span>{sym}{nightlyRate.toLocaleString()} × {stayNights} night{stayNights > 1 ? 's' : ''}</span>
                <span className="cost-total-val">= {sym}{estimatedStayTotal.toLocaleString()}</span>
              </div>

              <p className="hotel-modal-pricing-disclaimer">
                ℹ️ {hotel.price_disclaimer || 'Estimated accommodation tariff. Exact booking rates may fluctuate by season and room type.'}
              </p>
            </div>

            {/* Actions */}
            <div className="hotel-modal-actions">
              <button
                type="button"
                className="hotel-modal-btn-cancel"
                onClick={onClose}
              >
                Close
              </button>

              <button
                type="button"
                className={`hotel-modal-btn-select ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectStay({
                    ...hotel,
                    stay_nights: stayNights,
                    estimated_total_stay_cost: estimatedStayTotal,
                  });
                  onClose();
                }}
              >
                {isSelected ? '✓ Confirmed as Selected Stay' : 'Select This Stay'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
