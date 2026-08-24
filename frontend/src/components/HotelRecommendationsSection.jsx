import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import hotelService from '../services/hotelService';
import HotelCard from './HotelCard';
import HotelDetailModal from './HotelDetailModal';

export default function HotelRecommendationsSection({
  destination,
  destinationName,
  latitude,
  longitude,
  onContinueToTripPlanning,
  userBudget = null,
}) {
  const navigate = useNavigate();
  const { selectedHotel, setSelectedHotel } = useAppContext();

  const [hotelsData, setHotelsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedType, setSelectedType] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [maxDistanceKm, setMaxDistanceKm] = useState(50);
  const [sortBy, setSortBy] = useState('recommended');

  // Modal State
  const [activeModalHotel, setActiveModalHotel] = useState(null);

  const destName = destinationName || destination?.name || destination?.city || 'Selected Destination';
  const destLat = latitude || destination?.latitude;
  const destLng = longitude || destination?.longitude;

  useEffect(() => {
    let isMounted = true;

    async function loadHotels() {
      setLoading(true);
      setError(null);

      try {
        const data = await hotelService.getNearbyHotels({
          destinationName: destName,
          destination: destName,
          latitude: destLat,
          longitude: destLng,
          type: selectedType,
          minRating: minRating > 0 ? minRating : undefined,
          maxPrice: maxPrice < 15000 ? maxPrice : undefined,
          maxDistanceKm: maxDistanceKm < 50 ? maxDistanceKm : undefined,
          sortBy,
          budget: userBudget,
        });

        if (isMounted) {
          setHotelsData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load hotels:', err.message);
          setError('No accommodation information is available for this destination right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHotels();

    return () => {
      isMounted = false;
    };
  }, [destName, destLat, destLng, selectedType, minRating, maxPrice, maxDistanceKm, sortBy, userBudget]);

  const handleSelectStay = (hotel) => {
    setSelectedHotel(hotel);
  };

  const handleContinue = () => {
    if (onContinueToTripPlanning) {
      onContinueToTripPlanning();
    } else {
      const destQuery = destination?.id ? `destinationId=${destination.id}` : `destination=${encodeURIComponent(destName)}`;
      navigate(`/trip-planner?${destQuery}`);
    }
  };

  const hotelsList = hotelsData?.hotels || [];
  const spotlightStay = hotelsData?.recommended_stay;

  return (
    <section className="travelora-hotel-section">
      {/* Section Header */}
      <div className="hotel-section-header">
        <div className="hotel-header-left">
          <span className="hotel-section-eyebrow">🏨 ACCOMMODATION & STAYS</span>
          <h2 className="hotel-section-title">
            Where to Stay near {destName}
          </h2>
          <p className="hotel-section-subtitle">
            Verified hotels, luxury resorts, heritage homestays, and budget guest houses near your destination.
          </p>
        </div>

        {/* Selected Hotel Quick Indicator */}
        {selectedHotel && (
          <div className="hotel-selected-quick-chip">
            <span className="selected-icon">🏨</span>
            <div className="selected-text">
              <strong>{selectedHotel.name}</strong>
              <small>{selectedHotel.price_display || `₹${selectedHotel.approx_price_per_night}/night`}</small>
            </div>
            <button
              type="button"
              className="hotel-clear-btn"
              onClick={() => setSelectedHotel(null)}
              title="Clear selection"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Accommodation Type Tabs */}
      <div className="hotel-type-tabs-wrapper">
        {[
          { id: 'all', label: 'All Accommodations', icon: '🌟' },
          { id: 'hotel', label: 'Hotels', icon: '🏨' },
          { id: 'resort', label: 'Resorts', icon: '🏕️' },
          { id: 'homestay', label: 'Homestays', icon: '🏡' },
          { id: 'guest_house', label: 'Guest Houses', icon: '🏠' },
          { id: 'apartment', label: 'Apartments', icon: '🏢' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`hotel-type-tab-btn ${selectedType === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedType(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="hotel-filter-toolbar">
        {/* Rating Filter */}
        <div className="hotel-filter-item">
          <label htmlFor="rating-filter">Rating</label>
          <select
            id="rating-filter"
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
          >
            <option value={0}>All Ratings</option>
            <option value={4.0}>⭐ 4.0+ High Rated</option>
            <option value={4.5}>⭐ 4.5+ Top Rated</option>
          </select>
        </div>

        {/* Max Price Filter */}
        <div className="hotel-filter-item">
          <label htmlFor="price-filter">Max Nightly Tariff</label>
          <select
            id="price-filter"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
          >
            <option value={15000}>Any Price</option>
            <option value={3000}>Under ₹3,000</option>
            <option value={6000}>Under ₹6,000</option>
            <option value={10000}>Under ₹10,000</option>
          </select>
        </div>

        {/* Distance Filter */}
        <div className="hotel-filter-item">
          <label htmlFor="distance-filter">Distance</label>
          <select
            id="distance-filter"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(parseInt(e.target.value, 10))}
          >
            <option value={50}>Any Distance</option>
            <option value={3}>Within 3 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="hotel-filter-item sort-item">
          <label htmlFor="sort-filter">Sort By</label>
          <select
            id="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recommended">Recommended Value</option>
            <option value="price_low">Lowest Price First</option>
            <option value="rating_high">Highest Rating First</option>
            <option value="distance_near">Closest Distance First</option>
          </select>
        </div>
      </div>

      {/* Recommended Stay Spotlight Banner */}
      {!loading && spotlightStay && selectedType === 'all' && (
        <div className="hotel-spotlight-banner">
          <div className="spotlight-left">
            <span className="spotlight-tag">⭐ RECOMMENDED STAY FOR YOUR TRIP</span>
            <h3 className="spotlight-title">{spotlightStay.name}</h3>
            <p className="spotlight-reason">💡 {spotlightStay.recommendation_reason}</p>
            <div className="spotlight-meta">
              <span className="spotlight-meta-chip">⭐ {spotlightStay.rating} ({spotlightStay.user_ratings_total?.toLocaleString() || '1,000+'} reviews)</span>
              <span className="spotlight-meta-chip">📍 {spotlightStay.distance_label}</span>
              <span className="spotlight-meta-chip price">{spotlightStay.price_display}</span>
            </div>
          </div>

          <div className="spotlight-right">
            <button
              type="button"
              className="spotlight-btn-view"
              onClick={() => setActiveModalHotel(spotlightStay)}
            >
              View Specs
            </button>
            <button
              type="button"
              className={`spotlight-btn-select ${selectedHotel?.id === spotlightStay.id ? 'active' : ''}`}
              onClick={() => handleSelectStay(spotlightStay)}
            >
              {selectedHotel?.id === spotlightStay.id ? '✓ Selected Stay' : 'Select This Stay'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="hotel-cards-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="hotel-card-skeleton">
              <div className="skeleton-img-box" />
              <div className="skeleton-line title" />
              <div className="skeleton-line subtitle" />
              <div className="skeleton-line price" />
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="hotel-error-box">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Hotels Grid */}
      {!loading && !error && hotelsList.length > 0 && (
        <div className="hotel-cards-grid">
          {hotelsList.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isSelected={selectedHotel?.id === hotel.id}
              onSelect={handleSelectStay}
              onViewDetails={setActiveModalHotel}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hotelsList.length === 0 && (
        <div className="hotel-empty-state">
          <p>🔍 No accommodations matched your current filter criteria.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSelectedType('all');
              setMinRating(0);
              setMaxPrice(15000);
              setMaxDistanceKm(50);
              setSortBy('recommended');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Persistent Selected Stay Footer Bar */}
      {selectedHotel && (
        <div className="hotel-confirmed-stay-banner">
          <div className="confirmed-stay-info">
            <span className="confirmed-stay-badge">✓ Selected Accommodation</span>
            <div className="confirmed-stay-name">
              🏨 <strong>{selectedHotel.name}</strong> • {selectedHotel.price_display || `₹${selectedHotel.approx_price_per_night}/night`}
            </div>
            <div className="confirmed-stay-sub">
              📍 {selectedHotel.distance_label} • Automatically included in your Trip Budget & AI Itinerary
            </div>
          </div>

          <div className="confirmed-stay-actions">
            <button
              type="button"
              className="btn btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}
              onClick={() => setSelectedHotel(null)}
            >
              Change Stay
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ background: '#38bdf8', color: '#0f172a', fontWeight: '800' }}
              onClick={handleContinue}
            >
              Continue Trip Planning ➔
            </button>
          </div>
        </div>
      )}

      {/* Hotel Detail Modal */}
      {activeModalHotel && (
        <HotelDetailModal
          hotel={activeModalHotel}
          isOpen={Boolean(activeModalHotel)}
          onClose={() => setActiveModalHotel(null)}
          onSelectStay={handleSelectStay}
          isSelected={selectedHotel?.id === activeModalHotel.id}
        />
      )}
    </section>
  );
}
