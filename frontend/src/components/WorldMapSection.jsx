import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Simple Equirectangular projection convertor (lat/lng to SVG percentage x, y)
function coordsToSvgPercent(lat, lng) {
  // Longitude: -180 to 180 -> 0% to 100%
  const x = ((lng + 180) / 360) * 100;
  // Latitude: 90 to -90 -> 0% to 100% (clipped between -60 and 80 for standard view)
  const clampedLat = Math.max(-60, Math.min(80, lat));
  const y = ((80 - clampedLat) / 140) * 100;
  return { x, y };
}

// Haversine distance in KM
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const CONTINENT_TABS = [
  { key: 'all', label: '🌍 All Continents' },
  { key: 'asia', label: '⛩️ Asia' },
  { key: 'europe', label: '🏰 Europe' },
  { key: 'north_america', label: '🗽 North America' },
  { key: 'south_america', label: '🦙 South America' },
  { key: 'africa', label: '🦁 Africa' },
  { key: 'oceania', label: '🦘 Australia & Oceania' },
  { key: 'middle_east', label: '🕌 Middle East' },
];

export default function WorldMapSection({ destinations = [], onSelectDestination, initialSelectedId = null }) {
  const { currentLocation } = useAppContext();
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedDestId, setSelectedDestId] = useState(
    initialSelectedId || (destinations.length > 0 ? destinations[0].id : null)
  );

  const filteredMarkers = useMemo(() => {
    if (!destinations || destinations.length === 0) return [];
    if (selectedContinent === 'all') return destinations;
    return destinations.filter((d) => d.continent === selectedContinent);
  }, [destinations, selectedContinent]);

  const activeDestination = useMemo(() => {
    return (
      destinations.find((d) => d.id === selectedDestId) ||
      (filteredMarkers.length > 0 ? filteredMarkers[0] : null)
    );
  }, [destinations, selectedDestId, filteredMarkers]);

  // Calculate route telemetry if user location is available
  const routeTelemetry = useMemo(() => {
    if (!currentLocation?.latitude || !activeDestination) return null;
    const dist = getHaversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      activeDestination.latitude,
      activeDestination.longitude
    );
    const flightHrs = (dist / 780 + 1.5).toFixed(1);
    return {
      distanceKm: dist,
      flightHours: `${flightHrs} hrs`,
      originName: currentLocation.city || 'Your Location',
    };
  }, [currentLocation, activeDestination]);

  // User position percentage
  const userPos = useMemo(() => {
    if (!currentLocation?.latitude || !currentLocation?.longitude) return null;
    return coordsToSvgPercent(currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation]);

  // Destination position percentage
  const destPos = useMemo(() => {
    if (!activeDestination) return null;
    return coordsToSvgPercent(activeDestination.latitude, activeDestination.longitude);
  }, [activeDestination]);

  return (
    <div
      id="world-map"
      style={{
        background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)',
        borderRadius: '24px',
        border: '1px solid #1e293b',
        padding: '2rem',
        color: '#ffffff',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        margin: '2rem 0',
      }}
    >
      {/* Header */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                background: 'rgba(2, 132, 199, 0.25)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              🌐 Global Discovery Map
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            Explore World Wonders on Interactive Map
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Click on any international destination marker to view real photography, details, and flight paths.
          </p>
        </div>

        {/* Route Header Banner */}
        {routeTelemetry && activeDestination && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #334155',
              padding: '0.65rem 1.25rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700' }}>
                Active Flight Route
              </div>
              <div style={{ fontWeight: '800', color: '#f8fafc' }}>
                📍 {routeTelemetry.originName} ➔ ✈️ {activeDestination.city}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #475569', paddingLeft: '1rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: '800' }}>{routeTelemetry.distanceKm.toLocaleString()} km</div>
              <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>
                ~{routeTelemetry.flightHours}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continent Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '0.75rem',
        }}
      >
        {CONTINENT_TABS.map((tab) => {
          const isSelected = selectedContinent === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedContinent(tab.key)}
              style={{
                background: isSelected ? 'rgba(2, 132, 199, 0.9)' : 'rgba(30, 41, 59, 0.6)',
                color: isSelected ? '#ffffff' : '#cbd5e1',
                border: isSelected ? '1px solid #0284c7' : '1px solid #334155',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Map Canvas Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        {/* World Map SVG Visualizer */}
        <div
          style={{
            position: 'relative',
            background: '#060a12',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            overflow: 'hidden',
            minHeight: '440px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
          }}
        >
          {/* Subtle World Map Outline Grid Pattern */}
          <svg
            viewBox="0 0 1000 500"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <pattern id="worldGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#worldGrid)" />

            {/* Latitude & Equator Lines */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="6 4" strokeWidth="1.5" />
            <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" strokeWidth="1" />

            {/* Approximate stylized continent polygons */}
            {/* North America */}
            <path d="M 120 80 Q 200 60 280 90 Q 290 160 240 220 Q 180 230 150 180 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />
            {/* South America */}
            <path d="M 230 250 Q 320 280 290 400 Q 240 440 220 370 Q 200 300 230 250 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />
            {/* Europe */}
            <path d="M 450 70 Q 560 60 540 160 Q 470 170 440 130 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />
            {/* Africa */}
            <path d="M 450 180 Q 560 180 550 330 Q 490 410 440 310 Q 420 230 450 180 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />
            {/* Asia */}
            <path d="M 560 60 Q 820 60 840 220 Q 720 260 620 220 Q 560 170 560 60 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />
            {/* India Subcontinent */}
            <path d="M 660 180 Q 730 190 700 280 Q 660 270 650 210 Z" fill="rgba(30, 41, 59, 0.55)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
            {/* Australia */}
            <path d="M 780 320 Q 890 310 880 400 Q 800 420 770 360 Z" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(51, 65, 85, 0.6)" strokeWidth="1.5" />

            {/* Flight Curve if both user position and destination exist */}
            {userPos && destPos && (
              <g>
                <path
                  d={`M ${userPos.x * 10} ${userPos.y * 5} Q ${(userPos.x + destPos.x) * 5} ${
                    Math.min(userPos.y, destPos.y) * 5 - 40
                  } ${destPos.x * 10} ${destPos.y * 5}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                >
                  <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.5s" repeatCount="indefinite" />
                </path>
              </g>
            )}
          </svg>

          {/* User Location Marker */}
          {userPos && (
            <div
              style={{
                position: 'absolute',
                left: `${userPos.x}%`,
                top: `${userPos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
              title={`Your Origin: ${currentLocation.city || 'Current GPS Location'}`}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '3px solid #ffffff',
                  boxShadow: '0 0 16px #10b981',
                  animation: 'pulse 1.8s infinite',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '22px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(4px)',
                }}
              >
                📍 You
              </span>
            </div>
          )}

          {/* Worldwide Destination Markers */}
          {filteredMarkers.map((dest) => {
            const pos = coordsToSvgPercent(dest.latitude, dest.longitude);
            const isSelected = activeDestination?.id === dest.id;

            return (
              <div
                key={dest.id}
                onClick={() => {
                  setSelectedDestId(dest.id);
                  if (onSelectDestination) onSelectDestination(dest);
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: isSelected ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                  zIndex: isSelected ? 30 : 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                title={`${dest.name} (${dest.city}, ${dest.country})`}
              >
                <div
                  style={{
                    width: isSelected ? '26px' : '16px',
                    height: isSelected ? '26px' : '16px',
                    borderRadius: '50%',
                    background: isSelected ? '#0284c7' : '#f59e0b',
                    border: isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.8)',
                    boxShadow: isSelected ? '0 0 20px #38bdf8' : '0 2px 6px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSelected ? '0.75rem' : '0.6rem',
                  }}
                >
                  {isSelected ? '★' : ''}
                </div>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      border: '1px solid #38bdf8',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {dest.name.split('&')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Destination Card Pane */}
        {activeDestination ? (
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid #334155',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Destination Real Photo Header */}
            <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden' }}>
              <img
                src={
                  activeDestination.thumbnail_url ||
                  activeDestination.featured_image_url ||
                  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
                }
                alt={activeDestination.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />

              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                }}
              >
                {activeDestination.category_label || activeDestination.category}
              </span>

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                ⭐ {parseFloat(activeDestination.rating || 4.9).toFixed(1)}
              </div>
            </div>

            {/* Destination Info */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', marginBottom: '0.25rem' }}>
                📍 {activeDestination.city}, {activeDestination.country}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                {activeDestination.name}
              </h3>

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  margin: '0 0 1rem 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flexGrow: 1,
                }}
              >
                {activeDestination.short_description || activeDestination.description}
              </p>

              {/* Legal Attribution Strip */}
              <div
                style={{
                  background: '#1e293b',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                  📷 {activeDestination.image_author || 'Photographer'} ({activeDestination.image_license || 'CC BY-SA'})
                </span>
                {activeDestination.image_source_url && (
                  <a
                    href={activeDestination.image_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}
                  >
                    Source ↗
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Link
                  to={`/destinations/${activeDestination.slug || activeDestination.id}`}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    borderRadius: '10px',
                  }}
                >
                  Explore ➜
                </Link>

                <Link
                  to={`/trip-planner?destination=${encodeURIComponent(activeDestination.name)}&city=${encodeURIComponent(
                    activeDestination.city
                  )}&country=${encodeURIComponent(activeDestination.country)}`}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✈️ Plan Trip
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              color: '#94a3b8',
              textAlign: 'center',
            }}
          >
            Select any marker on the map to explore destination details.
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
