import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import DestinationDetailModal from './DestinationDetailModal';

const REGIONS = [
  { key: 'all', label: '🇮🇳 All India' },
  { key: 'north', label: '🏔️ North India' },
  { key: 'south', label: '🌊 South India' },
  { key: 'west', label: '🏜️ West India' },
  { key: 'east', label: '🏛️ East India' },
  { key: 'central', label: '🐅 Central India' },
  { key: 'northeast', label: '🌿 North East' },
  { key: 'islands', label: '🏝️ Islands & UTs' },
];

const CATEGORIES = [
  { key: 'all', label: '🌟 All Categories' },
  { key: 'beach', label: '🏖️ Beaches' },
  { key: 'mountains', label: '🏔️ Mountains' },
  { key: 'heritage', label: '🏛️ Heritage' },
  { key: 'temples', label: '🛕 Temples' },
  { key: 'wildlife', label: '🐅 Wildlife' },
  { key: 'adventure', label: '🧗 Adventure' },
  { key: 'cities', label: '🏙️ Cities' },
  { key: 'nature', label: '🌿 Nature' },
  { key: 'spiritual', label: '✨ Spiritual' },
];

const SORT_OPTIONS = [
  { key: 'popular', label: '🔥 Most Popular' },
  { key: 'nearest', label: '📍 Nearest to Me' },
  { key: 'rating', label: '⭐ Highest Rated' },
  { key: 'budget', label: '💰 Budget Friendly' },
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';

export default function NearbyPlacesSection() {
  const { currentLocation } = useAppContext();
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(false);
  const [activeModalPlace, setActiveModalPlace] = useState(null);

  // Load pan-India destinations whenever filter parameters change
  useEffect(() => {
    let isMounted = true;

    async function loadPlaces() {
      setLoading(true);

      try {
        const data = await destinationService.getIndiaDestinations({
          region: selectedRegion,
          category: selectedCategory,
          search: searchQuery,
          sortBy: sortBy === 'nearest' && !currentLocation ? 'popular' : sortBy,
          latitude: currentLocation?.latitude || null,
          longitude: currentLocation?.longitude || null,
          limit: 36,
        });

        if (isMounted) {
          setPlaces(data.places || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[PanIndiaPlaces] Error fetching places:', err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, [
    selectedRegion,
    selectedCategory,
    searchQuery,
    sortBy,
    currentLocation?.latitude,
    currentLocation?.longitude,
  ]);

  const handlePlanTrip = (place) => {
    navigate(`/trip-planner?destination=${encodeURIComponent(place.city || place.name)}`);
  };

  const handleViewOnMap = (place) => {
    setActiveModalPlace(place);
  };

  const originName = currentLocation?.city || 'Your Location';

  return (
    <section className="section nearby-places-section" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2rem' }}>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            🇮🇳 Incredible India Discovery
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '0.4rem 0 0.6rem', letterSpacing: '-0.02em' }}>
            Famous Tourist Places Across India
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0, lineHeight: '1.6' }}>
            Explore iconic heritage marvels, misty Himalayan valleys, golden coastal beaches, and tranquil backwaters across North, South, West, East, Central, North East, and the Islands.
          </p>
        </div>

        {/* Region Selector Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          {REGIONS.map((reg) => (
            <button
              key={reg.key}
              type="button"
              onClick={() => setSelectedRegion(reg.key)}
              style={{
                background: selectedRegion === reg.key ? '#0f172a' : '#ffffff',
                color: selectedRegion === reg.key ? '#ffffff' : '#475569',
                border: selectedRegion === reg.key ? '1px solid #0f172a' : '1px solid #e2e8f0',
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedRegion === reg.key ? '0 4px 12px rgba(15, 23, 42, 0.18)' : '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              {reg.label}
            </button>
          ))}
        </div>

        {/* Search, Category Filters, and Sorting Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid #e2e8f0',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations across India (e.g. Taj Mahal, Munnar, Goa, Kaziranga)..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.8rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  background: selectedCategory === cat.key ? '#0284c7' : '#f8fafc',
                  color: selectedCategory === cat.key ? '#ffffff' : '#334155',
                  border: selectedCategory === cat.key ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tourist Place Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTopColor: '#0284c7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ fontWeight: '600' }}>Loading destinations across India...</p>
          </div>
        ) : places.length === 0 ? (
          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '20px',
              padding: '3.5rem 1.5rem',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '2rem auto',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🗺️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No destinations found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 1.25rem 0' }}>
              Try adjusting your category, region, or search keyword.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn btn-sm btn-primary"
              style={{ fontWeight: '700' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {places.map((place) => {
              const imageSrc = place.featured_image_url || (place.gallery_images && place.gallery_images[0]) || FALLBACK_IMG;

              return (
                <div
                  key={place.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {/* Real Destination Photo Container */}
                  <div style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#0f172a' }}>
                    <img
                      src={imageSrc}
                      alt={place.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onError={(e) => {
                        e.target.src = FALLBACK_IMG;
                      }}
                    />

                    {/* Category Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                      }}
                    >
                      {place.category_label || place.category}
                    </span>

                    {/* Region Badge */}
                    {place.region_label && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(2, 132, 199, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                        }}
                      >
                        {place.region_label}
                      </span>
                    )}

                    {/* Rating Star Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      <span>⭐</span>
                      <span>{parseFloat(place.rating || 4.7).toFixed(1)}</span>
                      {place.user_ratings_total && (
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
                          ({place.user_ratings_total.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: '1.25rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>
                        {place.name}
                      </h3>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#0284c7', fontWeight: '700', marginBottom: '0.65rem' }}>
                      📍 {place.city}, {place.state}
                    </div>

                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: '#64748b',
                        lineHeight: '1.5',
                        margin: '0 0 0.85rem 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {place.short_description || place.description}
                    </p>

                    {/* Metadata Strip: Best time + Distance */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '10px',
                        padding: '0.55rem 0.85rem',
                        marginBottom: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        fontSize: '0.78rem',
                      }}
                    >
                      {place.best_time_to_visit && (
                        <div style={{ color: '#334155' }}>
                          🗓️ <strong>Best Time:</strong> {place.best_time_to_visit}
                        </div>
                      )}

                      {/* Approximate distance (only shown if location is available) */}
                      {currentLocation && place.distance_label && (
                        <div style={{ color: '#0369a1', fontWeight: '700' }}>
                          📏 <strong>Distance:</strong> {place.distance_label} from {originName}
                          {place.approx_travel_hours ? ` (~${place.approx_travel_hours} hrs)` : ''}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row: Explore, View on Map, Plan Trip */}
                    <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveModalPlace(place)}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          padding: '0.55rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Explore
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewOnMap(place)}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#0284c7',
                          padding: '0.55rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        🗺️ Map
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePlanTrip(place)}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '0.55rem 0.6rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                        }}
                      >
                        Plan Trip →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Place Details & Live Route Map Modal */}
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
