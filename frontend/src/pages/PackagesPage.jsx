import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PackageCard from '../components/PackageCard';
import PackageFilters from '../components/PackageFilters';
import packageService from '../services/packageService';

const quickCategories = [
  { id: 'all', label: '🌟 All Packages' },
  { id: 'standard', label: '🏖️ Standard Escapes' },
  { id: 'premium', label: '✨ Premium Tours' },
  { id: 'luxury', label: '👑 Luxury Elite' },
];

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state initialized from URL params if available
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [filters, setFilters] = useState({
    packageType: searchParams.get('type') || 'all',
    difficultyLevel: searchParams.get('difficulty') || 'all',
    destinationId: searchParams.get('destinationId') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    isAvailable: searchParams.get('available') || '',
    sortBy: searchParams.get('sortBy') || 'price_asc',
  });

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        packageType: selectedType !== 'all' ? selectedType : (filters.packageType !== 'all' ? filters.packageType : undefined),
        difficultyLevel: filters.difficultyLevel !== 'all' ? filters.difficultyLevel : undefined,
        destinationId: filters.destinationId || undefined,
        maxPrice: filters.maxPrice || undefined,
        isAvailable: filters.isAvailable || undefined,
        sortBy: filters.sortBy || 'price_asc',
        search: searchQuery.trim() || undefined,
      };

      const data = await packageService.getPackages(params);
      setPackages(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load travel packages');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, filters]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleFilterChange = (key, value) => {
    if (key === 'packageType') {
      setSelectedType(value);
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryTabClick = (typeId) => {
    setSelectedType(typeId);
    setFilters((prev) => ({ ...prev, packageType: typeId }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setFilters({
      packageType: 'all',
      difficultyLevel: 'all',
      destinationId: '',
      maxPrice: '',
      isAvailable: '',
      sortBy: 'price_asc',
    });
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Page Header */}
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="eyebrow">Curated Itineraries</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#BE5985', margin: '0.4rem 0 0.5rem 0' }}>
            Discover Travel Packages
          </h1>
          <p style={{ color: '#7A5366', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            All-inclusive trips with handpicked accommodations, expert local guides, organized activities, and transparent pricing.
          </p>
        </div>

        {/* Search Bar & Quick Categories */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 24px -4px rgba(190, 89, 133, 0.08)',
            border: '1.5px solid #F3D2E5',
            marginBottom: '2.5rem',
          }}
        >
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#7A5366', fontSize: '1.1rem' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages by title, country, city, or keywords (e.g. Bali, Japan, Ski, Luxury)..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.85rem',
                  borderRadius: '12px',
                  border: '1.5px solid #F3D2E5',
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: '#2D1520',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.75rem', whiteSpace: 'nowrap' }}>
              Search Packages
            </button>
          </form>

          {/* Quick Categories Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase', marginRight: '0.5rem' }}>
              Quick Tier:
            </span>
            {quickCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryTabClick(cat.id)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  border: selectedType === cat.id ? '1px solid #BE5985' : '1px solid #F3D2E5',
                  background: selectedType === cat.id ? '#EC7FA9' : '#FFF5FB',
                  color: selectedType === cat.id ? '#ffffff' : '#BE5985',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Layout: Filters Sidebar + Packages Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '270px 1fr',
            gap: '2rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Filters Sidebar */}
          <aside style={{ position: 'sticky', top: '90px' }}>
            <PackageFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalPackages={packages.length}
            />
          </aside>

          {/* Packages Grid Area */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#BE5985', marginBottom: '0.5rem' }}>✈️</div>
                <div style={{ fontWeight: '700', color: '#7A5366' }}>Loading curated packages...</div>
              </div>
            ) : error ? (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fecdd3',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#991b1b', margin: '0 0 1rem 0', fontWeight: '700' }}>{error}</p>
                <button onClick={fetchPackages} className="btn btn-primary">
                  Try Again
                </button>
              </div>
            ) : packages.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px dashed #F3D2E5',
                  borderRadius: '20px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.5rem 0' }}>
                  No packages matched your filters
                </h3>
                <p style={{ color: '#7A5366', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
                  Try adjusting your price range, tier, difficulty level, or search keyword to see more options.
                </p>
                <button onClick={handleResetFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
