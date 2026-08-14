export default function DestinationFilters({
  filters,
  onFilterChange,
  onResetFilters,
}) {
  return (
    <div style={{
      background: '#ffffff',
      padding: '1.25rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
          ⚙️ Filters & Sort
        </h4>
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Reset All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
          Sort By
        </label>
        <select
          value={filters.sortBy || 'popularity'}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '0.85rem',
            color: '#1e293b',
          }}
        >
          <option value="popularity">🔥 Most Popular</option>
          <option value="rating">⭐ Highest Rated</option>
          <option value="price_asc">💵 Price: Low to High</option>
          <option value="price_desc">💎 Price: High to Low</option>
        </select>
      </div>

      {/* Price Level */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
          Price Level
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          {[
            { id: '', label: 'Any Price' },
            { id: 'budget', label: '💵 Budget' },
            { id: 'moderate', label: '💳 Moderate' },
            { id: 'expensive', label: '💎 Premium' },
            { id: 'luxury', label: '👑 Luxury' },
          ].map((item) => {
            const isSelected = (filters.priceLevel || '') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange('priceLevel', item.id)}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: isSelected ? '#0284c7' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
          Minimum Rating
        </label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: '', label: 'All' },
            { id: '4.0', label: '⭐ 4.0+' },
            { id: '4.5', label: '⭐ 4.5+' },
            { id: '4.8', label: '⭐ 4.8+' },
          ].map((item) => {
            const isSelected = (filters.minRating || '') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange('minRating', item.id)}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: isSelected ? '#0284c7' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
