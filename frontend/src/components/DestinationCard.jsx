import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';

const categoryIcons = {
  beach: '🏝️ Beach',
  mountain: '⛰️ Mountain',
  cultural: '🏛️ Cultural',
  adventure: '🦁 Adventure',
  city_break: '🏙️ City Break',
  luxury: '👑 Luxury',
  wildlife: '🌿 Wildlife',
};

export default function DestinationCard({ destination, onFavoriteToggle }) {
  const { isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(destination.is_favorite || false);
  const [isToggling, setIsToggling] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (isToggling) return;

    const nextState = !isFavorite;
    setIsFavorite(nextState);
    setIsToggling(true);

    try {
      if (nextState) {
        await destinationService.addFavorite(destination.id);
      } else {
        await destinationService.removeFavorite(destination.id);
      }
      if (onFavoriteToggle) {
        onFavoriteToggle(destination.id, nextState);
      }
    } catch (err) {
      console.warn('Favorite toggle sync failed:', err.message);
      setIsFavorite(!nextState); // Rollback on error
    } finally {
      setIsToggling(false);
    }
  };

  const categoryLabel = categoryIcons[destination.category] || destination.category || 'Travel';

  return (
    <div className="card destination-card" style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      background: '#ffffff'
    }}>
      {/* Image Container */}
      <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
        <img
          src={destination.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
          alt={destination.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
          }}
        />

        {/* Category Pill */}
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.02em',
        }}>
          {categoryLabel}
        </span>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        {/* Rating Badge */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          ⭐ {parseFloat(destination.rating || 4.8).toFixed(1)}
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '0.25rem' }}>
          📍 {destination.city}, {destination.country}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', lineHeight: '1.3' }}>
          {destination.name}
        </h3>

        <p style={{
          fontSize: '0.875rem',
          color: '#475569',
          lineHeight: '1.5',
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flexGrow: 1,
        }}>
          {destination.description}
        </p>

        {/* Footer Meta */}
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>From</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
              ${destination.base_price || (destination.price_level === 'luxury' ? '1,999' : '1,099')}
            </div>
          </div>

          <Link
            to={`/destinations/${destination.slug || destination.id}`}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            Explore ➜
          </Link>
        </div>
      </div>
    </div>
  );
}
