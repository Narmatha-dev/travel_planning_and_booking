import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const {
    favorites,
    loadingFavorites,
    toggleFavoriteItem,
    favoriteSummary,
  } = useAppContext();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filteredFavorites = useMemo(() => {
    return favorites.filter((item) => {
      // Category filter
      let matchesCat = true;
      if (activeCategory === 'places') {
        matchesCat = item.item_type === 'destination' || item.item_type === 'place';
      } else if (activeCategory === 'hotels') {
        matchesCat = item.item_type === 'hotel';
      } else if (activeCategory === 'trips') {
        matchesCat = item.item_type === 'trip';
      }

      // Search filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          item.title?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q);
      }

      return matchesCat && matchesSearch;
    });
  }, [favorites, activeCategory, searchQuery]);

  const handleRemove = async (item) => {
    await toggleFavoriteItem(item.item_type, item);
  };

  const handlePlanTrip = (item) => {
    // Navigate to trip planner with pre-selected destination name
    const destinationQuery = item.title || item.location || 'Bali';
    navigate(`/trip-planner?destination=${encodeURIComponent(destinationQuery)}`);
  };

  const categoryTabs = [
    { id: 'all', label: 'All Saved', count: favorites.length },
    { id: 'places', label: '📍 Places & Destinations', count: favorites.filter((f) => f.item_type === 'destination' || f.item_type === 'place').length },
    { id: 'hotels', label: '🏨 Hotels & Stays', count: favorites.filter((f) => f.item_type === 'hotel').length },
    { id: 'trips', label: '🧳 Trip Plans', count: favorites.filter((f) => f.item_type === 'trip').length },
  ];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          PHASE 13 • SAVED WISHLIST
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: '0.3rem 0 0.3rem 0' }}>
          My Favorites & Saved Places ❤️
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.98rem', margin: 0 }}>
          Your hand-picked destinations, luxury stays, and customized trip blueprints in one convenient place.
        </p>
      </div>

      {/* Navigation Tabs & Search Controls (Feature 5 & 15) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: '#ffffff',
            padding: '0.4rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflowX: 'auto',
          }}
        >
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: isActive ? '#e11d48' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.1rem',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search */}
        <div style={{ flex: 1, minWidth: '220px', maxWidth: '340px' }}>
          <input
            type="text"
            placeholder="🔍 Search saved places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Loading State (Feature 20) */}
      {loadingFavorites && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>❤️</div>
          <strong style={{ color: '#0f172a' }}>Loading your favorites...</strong>
        </div>
      )}

      {/* Empty State (Feature 16) */}
      {!loadingFavorites && filteredFavorites.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            background: '#ffffff',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '24px',
            padding: '4rem 2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>❤️</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            No favorites yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Save places, tourist attractions, hotels, and customized trip plans you love to easily find and plan them later.
          </p>
          <Link
            to="/destinations"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontWeight: '800', borderRadius: '12px', background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
          >
            🌍 Explore Places & Stays
          </Link>
        </div>
      )}

      {/* Favorites Grid */}
      {!loadingFavorites && filteredFavorites.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredFavorites.map((item) => {
            const isHotel = item.item_type === 'hotel';
            const isTrip = item.item_type === 'trip';

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Media Header */}
                <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isHotel ? '🏨 Hotel' : isTrip ? '🧳 Trip' : '📍 Destination'}
                  </span>

                  {/* Heart Action Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    title="Remove from favorites"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    ❤️
                  </button>
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      {item.category || (isHotel ? 'Accommodation' : isTrip ? 'Custom Plan' : 'Attraction')}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b' }}>
                      ⭐ {parseFloat(item.rating || 4.8).toFixed(1)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    {item.title}
                  </h3>

                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem 0', flex: 1 }}>
                    {item.subtitle || item.location || 'Saved in your Travelora wishlist'}
                  </p>

                  {/* Price & Action Strip */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid #f1f5f9',
                      gap: '0.5rem',
                    }}
                  >
                    {item.price_display && (
                      <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                        {item.price_display}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      {/* Feature 7: Plan from favorites */}
                      <button
                        type="button"
                        onClick={() => handlePlanTrip(item)}
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: '0.45rem 0.9rem',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        🚀 Plan Trip
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        className="btn btn-outline btn-sm"
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          borderRadius: '8px',
                          color: '#64748b',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
