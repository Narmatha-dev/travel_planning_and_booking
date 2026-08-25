import { useState, useEffect, useRef } from 'react';
import locationService from '../services/locationService';
import weatherService from '../services/weatherService';

const TRAVEL_MODES = [
  { key: 'driving', label: '🚗 Car', googleKey: 'DRIVING' },
  { key: 'transit', label: '🚌 Bus', googleKey: 'TRANSIT' },
  { key: 'train', label: '🚆 Train', googleKey: 'TRANSIT' },
  { key: 'flight', label: '✈️ Flight', googleKey: 'DRIVING' },
];

export default function InteractiveMapSection({
  origin, // { latitude, longitude, city, label }
  destination, // { latitude, longitude, name, address, category }
  title = 'Route & Travel Information',
  onPlanTripClick,
}) {
  const [travelMode, setTravelMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [destWeather, setDestWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);

  const oLat = origin?.latitude;
  const oLng = origin?.longitude;
  const dLat = destination?.latitude;
  const dLng = destination?.longitude;

  // 1. Check & optionally load Google Maps JavaScript API
  useEffect(() => {
    let isMounted = true;

    async function initGoogleMaps() {
      if (window.google?.maps) {
        if (isMounted) setGoogleMapsLoaded(true);
        return;
      }

      try {
        const config = await locationService.getMapConfig();
        const apiKey = config?.googleMapsApiKey || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

        if (apiKey && !window.google?.maps && !document.getElementById('google-maps-script')) {
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (isMounted) setGoogleMapsLoaded(true);
          };
          script.onerror = () => {
            console.warn('[Map] Google Maps JS API unavailable. Using vector map.');
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.warn('[Map] Map config check:', err.message);
      }
    }

    initGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch directions route whenever origin, destination, or travelMode change
  useEffect(() => {
    if (!oLat || !oLng || !dLat || !dLng) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchRoute() {
      setLoading(true);
      setError(null);

      try {
        const data = await locationService.getRouteDirections({
          originLat: oLat,
          originLng: oLng,
          destLat: dLat,
          destLng: dLng,
          travelMode: travelMode === 'flight' || travelMode === 'train' ? 'transit' : travelMode,
        });

        if (isMounted) {
          let adjustedData = { ...data };
          const distKm = parseFloat(data.distance_km || 300);

          if (travelMode === 'flight') {
            const flightHours = (distKm / 750) + 1.5; // flight cruise + boarding
            adjustedData.duration_text = `${flightHours.toFixed(1)} hrs (Flight)`;
            adjustedData.duration_minutes = Math.round(flightHours * 60);
          } else if (travelMode === 'train') {
            const trainHours = distKm / 65;
            adjustedData.duration_text = `${Math.floor(trainHours)} hrs ${Math.round((trainHours % 1) * 60)} min (Express Rail)`;
            adjustedData.duration_minutes = Math.round(trainHours * 60);
          }

          setRouteData(adjustedData);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Map] Route calculation error:', err.message);
          setError('Unable to calculate route right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // Fetch live destination weather for map context
      try {
        const wData = await weatherService.getCurrentWeather({
          lat: dLat,
          lng: dLng,
          city: destination?.name || 'Destination',
        });
        if (isMounted && wData?.current) {
          setDestWeather(wData.current);
        }
      } catch {}
    }

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [oLat, oLng, dLat, dLng, travelMode]);

  // Dynamic coordinates for SVG rendering
  let originX = 100;
  let originY = 200;
  let destX = 400;
  let destY = 100;
  let pathD = `M 100 200 Q 250 80 400 100`;

  if (oLat && oLng && dLat && dLng) {
    const latSpan = Math.abs(dLat - oLat) || 1;
    const lngSpan = Math.abs(dLng - oLng) || 1;

    originX = 80 + Math.min(340, Math.max(0, ((oLng - Math.min(oLng, dLng)) / lngSpan) * 340));
    originY = 220 - Math.min(160, Math.max(0, ((oLat - Math.min(oLat, dLat)) / latSpan) * 160));

    destX = 80 + Math.min(340, Math.max(0, ((dLng - Math.min(oLng, dLng)) / lngSpan) * 340));
    destY = 220 - Math.min(160, Math.max(0, ((dLat - Math.min(oLat, dLat)) / latSpan) * 160));

    const midX = (originX + destX) / 2;
    const midY = Math.min(originY, destY) - 35;
    pathD = `M ${originX} ${originY} Q ${midX} ${midY} ${destX} ${destY}`;
  }

  const googleMapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    origin?.city || `${oLat},${oLng}`
  )}&destination=${encodeURIComponent(
    destination?.name || `${dLat},${dLng}`
  )}&travelmode=${travelMode === 'flight' ? 'transit' : travelMode}`;

  return (
    <div className="interactive-map-section" style={{ borderRadius: '20px', overflow: 'hidden' }}>
      <div className="map-card" style={{ background: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        {/* Visual Route Header (Feature 4 Requirement) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            border: '1.5px solid #bae6fd',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7' }}>
              📍 {origin?.city || 'Current Location'}
            </span>
            <span style={{ color: '#64748b' }}>➔</span>
            <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
              ROUTE
            </span>
            <span style={{ color: '#64748b' }}>➔</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#15803d' }}>
              🗺️ {destination?.name || 'Destination'}
            </span>
          </div>

          {destWeather && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', color: '#166534' }}>
              <span>{destWeather.icon || '🌤️'}</span>
              <span>{destWeather.temperature}°C {destWeather.condition}</span>
              <span style={{ color: '#0284c7' }}>• 🌧️ {destWeather.rain_probability}% Rain</span>
            </div>
          )}
        </div>

        {/* Map Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Live distance and travel duration between origin and destination
            </p>
          </div>

          {/* Transport Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            {TRAVEL_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`map-mode-btn ${travelMode === mode.key ? 'active' : ''}`}
                onClick={() => setTravelMode(mode.key)}
                disabled={loading}
                style={{
                  background: travelMode === mode.key ? '#0284c7' : 'transparent',
                  color: travelMode === mode.key ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas / Visualizer Container */}
        <div className="map-canvas-container" style={{ position: 'relative', height: '280px', borderRadius: '16px', overflow: 'hidden', background: '#0f172a' }}>
          <div
            ref={mapContainerRef}
            className={`google-map-embed ${googleMapsLoaded ? 'active' : 'hidden'}`}
            style={{ width: '100%', height: '100%' }}
          />

          {!googleMapsLoaded && (
            <div className="vector-map-viewport" style={{ width: '100%', height: '100%', position: 'relative' }}>
              <div className="vector-map-bg-grid" />
              <svg viewBox="0 0 500 280" className="vector-map-svg" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Route Path */}
                <path d={pathD} fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animated-route-stroke"
                />

                {/* Origin Marker */}
                <g transform={`translate(${originX}, ${originY})`} className="svg-marker origin-marker">
                  <circle r="16" fill="#0284c7" fillOpacity="0.25" className="marker-pulse" />
                  <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  <text y="24" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
                    📍 {origin?.city || 'Origin'}
                  </text>
                </g>

                {/* Destination Marker */}
                <g transform={`translate(${destX}, ${destY})`} className="svg-marker dest-marker">
                  <circle r="18" fill="#ef4444" fillOpacity="0.2" className="marker-pulse" />
                  <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
                  <text y="24" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
                    📌 {destination?.name || 'Destination'}
                  </text>
                </g>
              </svg>

              <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                📍 Interactive Route Visualizer
              </div>
            </div>
          )}

          {loading && (
            <div className="map-loading-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', gap: '0.75rem' }}>
              <span>Calculating live route telemetry...</span>
            </div>
          )}
        </div>

        {/* Route Metrics & Distance Bar */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>📏 Total Distance</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284c7' }}>
                {routeData?.distance_text || (routeData?.distance_km ? `${routeData.distance_km} km` : 'Calculating...')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>⏱️ Est. Duration</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#16a34a' }}>
                {routeData?.duration_text || 'Calculating...'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>🚦 Selected Mode</span>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                {TRAVEL_MODES.find((m) => m.key === travelMode)?.label || travelMode}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a
              href={googleMapsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ fontWeight: '700' }}
            >
              🗺️ Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
