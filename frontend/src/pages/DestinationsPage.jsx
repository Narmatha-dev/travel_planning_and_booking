import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import DestinationCard from '../components/DestinationCard';
import DestinationFilters from '../components/DestinationFilters';
import WorldMapSection from '../components/WorldMapSection';
import GlobalPlaceSearch from '../components/GlobalPlaceSearch';
import destinationService from '../services/destinationService';

const GLOBAL_CATEGORIES = [
  { id: 'all', label: 'All Places', icon: '🌍' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'mountains', label: 'Mountains', icon: '⛰️' },
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
  { id: 'historical', label: 'Historical', icon: '🏺' },
  { id: 'temples', label: 'Temples', icon: '🛕' },
  { id: 'museums', label: 'Museums', icon: '🖼️' },
  { id: 'wildlife', label: 'Wildlife', icon: '🐅' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'cities', label: 'Cities', icon: '🏙️' },
  { id: 'islands', label: 'Islands', icon: '🏝️' },
  { id: 'spiritual', label: 'Spiritual', icon: '✨' },
  { id: 'architecture', label: 'Architecture', icon: '🏛️' },
];

const CONTINENTS = [
  { id: 'all', label: 'All Continents', icon: '🌐' },
  { id: 'asia', label: 'Asia', icon: '⛩️' },
  { id: 'europe', label: 'Europe', icon: '🏰' },
  { id: 'north_america', label: 'North America', icon: '🗽' },
  { id: 'south_america', label: 'South America', icon: '🦙' },
  { id: 'africa', label: 'Africa', icon: '🦁' },
  { id: 'oceania', label: 'Australia & Oceania', icon: '🦘' },
  { id: 'middle_east', label: 'Middle East', icon: '🕌' },
];

export default function DestinationsPage() {
  const { currentLocation, locationStatus } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [mapFocusId, setMapFocusId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    priceLevel: '',
    minRating: '',
    sortBy: 'popularity',
  });

  // Fetch country list on mount
  useEffect(() => {
    destinationService
      .getCountries()
      .then((data) => setCountries(data || []))
      .catch((err) => console.warn('Failed to load country list:', err));
  }, []);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        continent: selectedContinent !== 'all' ? selectedContinent : undefined,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        priceLevel: filters.priceLevel || undefined,
        minRating: filters.minRating || undefined,
        sortBy: filters.sortBy || 'popularity',
        search: searchQuery.trim() || undefined,
        lat: currentLocation?.latitude || undefined,
        lng: currentLocation?.longitude || undefined,
      };

      const data = await destinationService.getDestinations(params);
      setDestinations(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedContinent, selectedCountry, selectedCategory, filters, currentLocation]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedContinent('all');
    setSelectedCountry('all');
    setSelectedCategory('all');
    setFilters({
      priceLevel: '',
      minRating: '',
      sortBy: 'popularity',
    });
  };

  const handleViewMapFocus = (dest) => {
    setMapFocusId(dest.id);
    setViewMode('map');
    const elem = document.getElementById('world-map-view-container');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const isLocationActive = Boolean(currentLocation?.latitude && currentLocation?.longitude);

  return (
    <section className="section page-section" style={{ paddingTop: '2rem', minHeight: '80vh' }}>
      <div className="container">
        {/* ================================================================= */}
        {/* 1. HERO & GLOBAL SEARCH */}
        {/* ================================================================= */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0284c7', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            <span>🌐 Worldwide Discovery</span>
            <span>• Real Photography & Verified Travel Data</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Discover Global Tourist Destinations
          </h1>

          <p style={{ color: '#64748b', maxWidth: '650px', margin: '0 auto 1.5rem auto', fontSize: '1rem', lineHeight: '1.5' }}>
            Search iconic landmarks across Asia, Europe, Americas, Africa, and Oceania with real photos and smart route planning.
          </p>

          {/* Worldwide Search Input */}
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <GlobalPlaceSearch
              initialQuery={searchQuery}
              onSearchChange={(term) => {
                setSearchQuery(term);
              }}
              onPlaceSelect={(place) => {
                setSearchQuery(place.name);
              }}
              onViewOnMap={(place) => {
                setViewMode('map');
                setMapFocusId(place.id || place.placeId);
                const mapSection = document.getElementById('world-map-visualizer');
                if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
              }}
              onPlanTrip={(place) => {
                window.location.href = `/trip-planner?destination=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`;
              }}
            />
          </div>

          {searchQuery && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: '700', background: '#e0f2fe', padding: '4px 14px', borderRadius: '9999px' }}>
                🔍 Search active: "{searchQuery}"
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. EXPLORE BY COUNTRY CAROUSEL */}
        {/* ================================================================= */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🌍 Explore By Country
            </span>
            {selectedCountry !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCountry('all')}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Show All Countries ✕
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'thin',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCountry('all')}
              style={{
                background: selectedCountry === 'all' ? '#0284c7' : '#ffffff',
                color: selectedCountry === 'all' ? '#ffffff' : '#1e293b',
                border: selectedCountry === 'all' ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              🌐 All Countries ({destinations.length})
            </button>

            {countries.map((c) => {
              const isSelected = selectedCountry.toLowerCase() === c.country.toLowerCase();
              return (
                <button
                  key={c.country}
                  type="button"
                  onClick={() => setSelectedCountry(isSelected ? 'all' : c.country)}
                  style={{
                    background: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#1e293b',
                    border: isSelected ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{c.flag}</span>
                  <span>{c.country}</span>
                  <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({c.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. CONTINENTS & 14 CATEGORY PILLS */}
        {/* ================================================================= */}
        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          {/* Continents Row */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
            {CONTINENTS.map((con) => {
              const isSelected = selectedContinent === con.id;
              return (
                <button
                  key={con.id}
                  type="button"
                  onClick={() => setSelectedContinent(con.id)}
                  style={{
                    background: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {con.icon} {con.label}
                </button>
              );
            })}
          </div>

          {/* 14 Categories Row */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {GLOBAL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. VIEW CONTROLS & DISTANCE BANNER */}
        {/* ================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Origin & Sorting Info */}
          <div>
            {isLocationActive ? (
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                📍 Sorting distance from {currentLocation.city || 'Your Location'}
              </span>
            ) : (
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                }}
              >
                📍 Worldwide Exploration (Global Mode)
              </span>
            )}
          </div>

          {/* Grid / Map Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ▦ Cards View ({destinations.length})
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? '#0284c7' : 'transparent',
                color: viewMode === 'map' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'map' ? '0 2px 6px rgba(2,132,199,0.3)' : 'none',
              }}
            >
              🗺️ World Map View
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 5. MAIN CONTENT: Grid View OR World Map View */}
        {/* ================================================================= */}
        {viewMode === 'map' ? (
          <div id="world-map-view-container">
            <WorldMapSection destinations={destinations} initialSelectedId={mapFocusId} />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: '2rem',
              alignItems: 'flex-start',
            }}
          >
            {/* Filters Sidebar */}
            <aside style={{ position: 'sticky', top: '90px' }}>
              <DestinationFilters filters={filters} onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))} onResetFilters={handleResetFilters} />

              {/* Verified Attribution Info Note */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.78rem',
                  color: '#475569',
                  lineHeight: '1.4',
                }}
              >
                <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem' }}>
                  📷 Real Wikimedia Photography
                </div>
                All photographs displayed are licensed under Creative Commons or Public Domain with author attributions.
              </div>
            </aside>

            {/* Cards Grid */}
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '4px solid #e2e8f0',
                      borderTopColor: '#0284c7',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 1rem auto',
                    }}
                  />
                  <div style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>
                    Searching worldwide destinations...
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Retrieving verified coordinates, photos, and flight telemetry...</p>
                </div>
              ) : error ? (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1.5rem', borderRadius: '14px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Unable to load destinations</h3>
                  <p style={{ margin: '0 0 1rem 0' }}>{error}</p>
                  <button type="button" onClick={fetchDestinations} className="btn btn-primary">
                    Retry
                  </button>
                </div>
              ) : destinations.length === 0 ? (
                <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '16px', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                    {searchQuery ? `No destinations found for "${searchQuery}"` : 'No destinations found'}
                  </h3>
                  <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem auto', fontSize: '0.92rem' }}>
                    {searchQuery
                      ? `We couldn't find any destinations matching "${searchQuery}". Check the spelling, try searching by city, state, or country, or reset your filters.`
                      : "We couldn't find any destinations matching your current filter criteria. Try adjusting or clearing your filters."}
                  </p>
                  <button type="button" onClick={handleResetFilters} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: '800' }}>
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  {destinations.map((destination) => (
                    <DestinationCard key={destination.id} destination={destination} onViewMap={handleViewMapFocus} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
