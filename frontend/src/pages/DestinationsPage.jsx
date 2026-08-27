import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import DestinationCard from '../components/DestinationCard';
import WorldMapSection from '../components/WorldMapSection';
import destinationService from '../services/destinationService';

const CATEGORIES = [
  { id: 'all', label: 'All Places', icon: '🌍' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'mountains', label: 'Mountains', icon: '⛰️' },
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
  { id: 'cities', label: 'Cities', icon: '🏙️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'islands', label: 'Islands', icon: '🏝️' },
];

export default function DestinationsPage() {
  const { currentLocation } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [mapFocusId, setMapFocusId] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy: sortBy || 'popularity',
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
  }, [searchQuery, selectedCategory, sortBy, currentLocation]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  return (
    <section className="section page-section" style={{ paddingTop: '2rem', minHeight: '80vh' }}>
      <div className="container">
        {/* Minimal Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="eyebrow">
            🌍 Worldwide Escapes
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#BE5985', margin: '0.3rem 0 0.5rem 0' }}>
            Explore Destinations
          </h1>
          <p style={{ color: '#7A5366', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Browse top tourist landmarks, beaches, mountains, and cultural wonders.
          </p>
        </div>

        {/* Minimal Search & Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #F3D2E5',
            padding: '1.25rem',
            boxShadow: '0 8px 24px -4px rgba(190, 89, 133, 0.08)',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search destinations by city, country or landmark..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #F3D2E5',
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: '#2D1520',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#7A5366',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & View Mode Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #F3D2E5',
                  background: '#ffffff',
                  fontSize: '0.9rem',
                  color: '#2D1520',
                  fontWeight: '700',
                }}
              >
                <option value="popularity">🔥 Most Popular</option>
                <option value="rating_desc">⭐ Highest Rated</option>
                <option value="name_asc">🔤 Alphabetical (A-Z)</option>
              </select>

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', background: '#FFF5FB', padding: '3px', borderRadius: '12px', border: '1px solid #F3D2E5' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.55rem 1rem',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: viewMode === 'grid' ? '#EC7FA9' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : '#BE5985',
                    boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(236, 127, 169, 0.3)' : 'none',
                  }}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  style={{
                    padding: '0.55rem 1rem',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: viewMode === 'map' ? '#EC7FA9' : 'transparent',
                    color: viewMode === 'map' ? '#ffffff' : '#BE5985',
                    boxShadow: viewMode === 'map' ? '0 2px 6px rgba(236, 127, 169, 0.3)' : 'none',
                  }}
                >
                  🗺️ Map
                </button>
              </div>
            </div>
          </div>

          {/* Clean Category Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: isSelected ? '#EC7FA9' : '#FFF5FB',
                    color: isSelected ? '#ffffff' : '#BE5985',
                    border: isSelected ? '1px solid #BE5985' : '1px solid #F3D2E5',
                    padding: '0.45rem 1.1rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#7A5366' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <p>Loading destinations...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #fecdd3' }}>
            <p style={{ margin: 0, fontWeight: '700' }}>⚠️ {error}</p>
          </div>
        )}

        {/* View Mode: Map */}
        {viewMode === 'map' && !loading && (
          <div style={{ marginBottom: '2rem' }}>
            <WorldMapSection destinations={destinations} focusId={mapFocusId} />
          </div>
        )}

        {/* View Mode: Grid */}
        {viewMode === 'grid' && !loading && destinations.length > 0 && (
          <div className="card-grid">
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onViewMap={(target) => {
                  setMapFocusId(target.id);
                  setViewMode('map');
                }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && destinations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#ffffff', borderRadius: '20px', border: '1.5px solid #F3D2E5' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏖️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.5rem 0' }}>
              No destinations found
            </h3>
            <p style={{ color: '#7A5366', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Try searching with different keywords or clear the category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
