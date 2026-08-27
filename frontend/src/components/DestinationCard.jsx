import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CATEGORY_LABELS = {
  beaches: '🏖️ Beaches & Islands',
  mountains: '⛰️ Mountains & Alps',
  heritage: '🏛️ Heritage & Wonders',
  historical: '🏛️ Historic Ruins',
  temples: '🛕 Temples & Shrines',
  museums: '🖼️ Art & Museums',
  wildlife: '🐅 Wildlife & Safari',
  nature: '🌿 Nature & Waterfalls',
  adventure: '🧗 Adrenaline & Hiking',
  cities: '🏙️ Iconic Metropolis',
  islands: '🏝️ Tropical Islands',
  spiritual: '✨ Spiritual & Sacred',
  architecture: '🏛️ World Architecture',
  beach: '🏖️ Beach',
  mountain: '⛰️ Mountain',
  cultural: '🏛️ Cultural',
  city_break: '🏙️ City Break',
  luxury: '👑 Luxury',
};

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';

export default function DestinationCard({ destination, onFavoriteToggle, onViewMap }) {
  const { isItemFavorited, toggleFavoriteItem, isAuthenticated, currentLocation } = useAppContext();
  const navigate = useNavigate();
  const isFavorite = isItemFavorited('destination', destination.id) || destination.is_favorite;
  const [isToggling, setIsToggling] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    destination.thumbnail_url || destination.featured_image_url || FALLBACK_PHOTO
  );
  const [showAttribution, setShowAttribution] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      const res = await toggleFavoriteItem('destination', destination);
      if (onFavoriteToggle) {
        onFavoriteToggle(destination.id, res.isFavorite);
      }
    } catch (err) {
      console.warn('Favorite toggle sync failed:', err.message);
    } finally {
      setIsToggling(false);
    }
  };

  const categoryLabel =
    CATEGORY_LABELS[destination.category] ||
    destination.category_label ||
    destination.category ||
    'Travel';

  const hasDistance = destination.distance_km !== undefined && destination.distance_km !== null;
  const formattedDistance = hasDistance
    ? (destination.distance_label || (destination.distance_km < 1 ? `${Math.round(destination.distance_km * 1000)} m` : `${destination.distance_km} km`))
    : null;

  return (
    <div
      className="card destination-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        border: '1.5px solid #F3D2E5',
        boxShadow: '0 8px 20px -4px rgba(190, 89, 133, 0.08)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        background: '#ffffff',
      }}
    >
      {/* Image Container */}
      <div style={{ position: 'relative', height: '230px', width: '100%', overflow: 'hidden', background: '#3D1C2A' }}>
        <img
          src={imgSrc}
          alt={destination.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          loading="lazy"
          onError={() => {
            if (imgSrc !== FALLBACK_PHOTO) {
              setImgSrc(FALLBACK_PHOTO);
            }
          }}
        />

        {/* Category Pill */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(45, 21, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {categoryLabel}
        </span>

        {/* Continent / Region Badge */}
        {destination.continent_label && (
          <span
            style={{
              position: 'absolute',
              top: '40px',
              left: '12px',
              background: 'rgba(190, 89, 133, 0.92)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            🌍 {destination.continent_label}
          </span>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.88)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        {/* Rating Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(45, 21, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          <span>⭐</span>
          <span style={{ color: '#ffffff' }}>{parseFloat(destination.rating || 4.9).toFixed(1)}</span>
          {destination.user_ratings_total && (
            <span style={{ color: '#FFB8E0', fontSize: '0.7rem', fontWeight: '500' }}>
              ({(destination.user_ratings_total / 1000).toFixed(0)}k)
            </span>
          )}
        </div>

        {/* Distance Badge (When Location Granted) */}
        {hasDistance && formattedDistance && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(190, 89, 133, 0.92)',
              backdropFilter: 'blur(6px)',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '800',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <span>📍 {formattedDistance}</span>
            {destination.approx_flight_hours && <span>• ✈️ {destination.approx_flight_hours}</span>}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* City & Country */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            📍 {destination.city}, {destination.country}
          </span>
          {destination.best_time_to_visit && (
            <span style={{ fontSize: '0.72rem', color: '#BE5985', background: '#FFEDFA', border: '1px solid #FFB8E0', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
              ☀️ {destination.best_time_to_visit}
            </span>
          )}
        </div>

        {/* Destination Name */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#BE5985', marginBottom: '0.5rem', lineHeight: '1.3' }}>
          {destination.name}
        </h3>

        {/* Short Description */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#7A5366',
            lineHeight: '1.5',
            marginBottom: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flexGrow: 1,
          }}
        >
          {destination.short_description || destination.description}
        </p>

        {/* Image Attribution Strip */}
        <div
          style={{
            background: '#FFF5FB',
            border: '1px solid #F3D2E5',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.68rem',
            color: '#7A5366',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
            📷 {destination.image_author || 'Photographer'} ({destination.image_license || 'Creative Commons'})
          </span>
          {destination.image_source_url && (
            <a
              href={destination.image_source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#BE5985', textDecoration: 'none', fontWeight: '700', fontSize: '0.65rem' }}
              title="View original Wikimedia Commons file page"
            >
              Source ↗
            </a>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div
          style={{
            borderTop: '1px solid #F3D2E5',
            paddingTop: '0.9rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {/* Explore Button */}
          <Link
            to={`/destinations/${destination.slug || destination.id}`}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '0.55rem 0.5rem',
              fontSize: '0.82rem',
              fontWeight: '800',
              textAlign: 'center',
              textDecoration: 'none',
              borderRadius: '9999px',
            }}
          >
            Explore ➜
          </Link>

          {/* View on Map Button */}
          <button
            type="button"
            onClick={() => {
              if (onViewMap) {
                onViewMap(destination);
              } else {
                navigate(`/destinations?mapFocus=${destination.id}#world-map`);
              }
            }}
            style={{
              background: '#FFF5FB',
              border: '1.5px solid #F3D2E5',
              color: '#BE5985',
              padding: '0.55rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: '700',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title="View this destination on the global map"
          >
            🗺️ Map
          </button>

          {/* Plan Trip Button */}
          <Link
            to={`/trip-planner?destination=${encodeURIComponent(destination.name)}&city=${encodeURIComponent(destination.city)}&country=${encodeURIComponent(destination.country)}`}
            style={{
              background: '#BE5985',
              color: '#ffffff',
              border: '1px solid #BE5985',
              padding: '0.55rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: '800',
              textAlign: 'center',
              textDecoration: 'none',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title="Start planning an AI itinerary to this destination"
          >
            ✈️ Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
