import { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: '🌍 All' },
  { id: 'beach', label: '🏝️ Beach' },
  { id: 'cultural', label: '🏛️ Cultural' },
  { id: 'mountain', label: '⛰️ Mountain' },
  { id: 'city_break', label: '🏙️ City Break' },
  { id: 'luxury', label: '👑 Luxury' },
  { id: 'adventure', label: '🦁 Adventure' },
];

export default function DestinationSearchBar({
  searchTerm = '',
  selectedCategory = 'all',
  onSearchChange,
  onCategoryChange,
  onSearchSubmit,
}) {
  const [localQuery, setLocalQuery] = useState(searchTerm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(localQuery);
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    if (onSearchChange) onSearchChange('');
    if (onSearchSubmit) onSearchSubmit('');
  };

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#ffffff',
        padding: '0.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', fontSize: '1.25rem' }}>
          🔍
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          placeholder="Search by city, country, or destination (e.g. Bali, Paris, Japan, Alps)..."
          style={{
            flexGrow: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            padding: '0.65rem 0.5rem',
            background: 'transparent',
          }}
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#94a3b8',
              padding: '0 0.5rem',
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem' }}
        >
          Search
        </button>
      </form>

      {/* Category Chips Carousel / Pills */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: isActive ? '#0284c7' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
