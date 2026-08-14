import { useState, useEffect, useCallback } from 'react';
import DestinationCard from '../components/DestinationCard';
import DestinationSearchBar from '../components/DestinationSearchBar';
import DestinationFilters from '../components/DestinationFilters';
import destinationService from '../services/destinationService';

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    priceLevel: '',
    minRating: '',
    sortBy: 'popularity',
  });

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        priceLevel: filters.priceLevel || undefined,
        minRating: filters.minRating || undefined,
        sortBy: filters.sortBy || 'popularity',
      };

      if (searchQuery.trim()) {
        data = await destinationService.searchDestinations(searchQuery.trim(), params);
      } else {
        data = await destinationService.getDestinations(params);
      }
      setDestinations(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, filters]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setFilters({
      priceLevel: '',
      minRating: '',
      sortBy: 'popularity',
    });
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Title */}
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="eyebrow">Explore The World</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0' }}>
            Find Your Next Dream Destination
          </h1>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            Discover breathtaking landscapes, vibrant cities, and serene coastal paradises.
          </p>
        </div>

        {/* Search Bar & Quick Categories */}
        <DestinationSearchBar
          searchTerm={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={setSearchQuery}
          onCategoryChange={handleCategoryChange}
          onSearchSubmit={(q) => setSearchQuery(q)}
        />

        {/* Main Content Layout: Filters Sidebar + Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '2rem',
          alignItems: 'flex-start',
        }}>
          {/* Filters Sidebar */}
          <aside style={{ position: 'sticky', top: '90px' }}>
            <DestinationFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />

            {/* Quick Stat Card */}
            <div style={{
              marginTop: '1.5rem',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              padding: '1.25rem',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(2,132,199,0.2)'
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Available Destinations</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
                {destinations.length} Places
              </div>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.5rem', lineHeight: '1.4' }}>
                All packages include verified accommodations and curated activities.
              </p>
            </div>
          </aside>

          {/* Destination Cards Grid */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '1.25rem', color: '#0284c7', fontWeight: '600' }}>
                  ✈️ Searching destinations...
                </div>
              </div>
            ) : error ? (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <h3>Unable to load destinations</h3>
                <p style={{ marginTop: '0.5rem' }}>{error}</p>
                <button
                  onClick={fetchDestinations}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Retry
                </button>
              </div>
            ) : destinations.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏝️</div>
                <h3 style={{ color: '#0f172a', fontWeight: '700' }}>No Destinations Found</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                  We couldn't find any destinations matching your current search or filter criteria.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn btn-primary"
                >
                  Clear Filters & Search
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}>
                {destinations.map((dest) => (
                  <DestinationCard key={dest.id} destination={dest} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
