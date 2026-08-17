export default function PackageFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalPackages = 0,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '0.75rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚙️</span> Filters
        </h3>
        <button
          onClick={onResetFilters}
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0284c7',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Reset All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Availability Toggle */}
        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
            <input
              type="checkbox"
              checked={filters.isAvailable === 'true' || filters.isAvailable === true}
              onChange={(e) => onFilterChange('isAvailable', e.target.checked ? 'true' : '')}
              style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
              🟢 Available Only
            </span>
          </label>
        </div>

        {/* Package Type */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
            Package Tier
          </label>
          <select
            value={filters.packageType || 'all'}
            onChange={(e) => onFilterChange('packageType', e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            <option value="all">All Tiers</option>
            <option value="standard">Standard Package</option>
            <option value="premium">Premium Package</option>
            <option value="luxury">Luxury Elite</option>
          </select>
        </div>

        {/* Difficulty Level */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
            Activity Level
          </label>
          <select
            value={filters.difficultyLevel || 'all'}
            onChange={(e) => onFilterChange('difficultyLevel', e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            <option value="all">All Levels</option>
            <option value="easy">🌿 Easy / Leisure</option>
            <option value="moderate">⛰️ Moderate Adventure</option>
            <option value="challenging">🧗 Challenging</option>
          </select>
        </div>

        {/* Max Budget Filter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Max Price
            </label>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7' }}>
              {filters.maxPrice ? `$${Number(filters.maxPrice).toLocaleString()}` : 'Any Price'}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="5000"
            step="200"
            value={filters.maxPrice || '5000'}
            onChange={(e) => onFilterChange('maxPrice', e.target.value === '5000' ? '' : e.target.value)}
            style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            <span>$1,000</span>
            <span>$5,000+</span>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
            Sort By
          </label>
          <select
            value={filters.sortBy || 'price_asc'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration_asc">Duration: Shortest First</option>
            <option value="duration_desc">Duration: Longest First</option>
            <option value="newest">Newest Releases</option>
          </select>
        </div>

        {/* Results summary pill */}
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
          Showing <strong>{totalPackages}</strong> package{totalPackages === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
