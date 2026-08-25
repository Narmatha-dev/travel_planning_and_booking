import { useState, useEffect, useRef } from 'react';
import locationService from '../services/locationService';
import weatherService from '../services/weatherService';

const TRAVEL_MODES = [
  { key: 'driving', label: '🚗 Driving', googleKey: 'DRIVING' },
  { key: 'transit', label: '🚌 Transit', googleKey: 'TRANSIT' },
  { key: 'walking', label: '🚶 Walking', googleKey: 'WALKING' },
  { key: 'bicycling', label: '🚲 Bicycling', googleKey: 'BICYCLING' },
];

export default function InteractiveMapSection({
  origin, // { latitude, longitude, city, label }
  destination, // { latitude, longitude, name, address, category }
  title = 'Route & Live Navigation',
  onPlanTripClick,
}) {
  const [travelMode, setTravelMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [destWeather, setDestWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [showPlanNotice, setShowPlanNotice] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

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
            console.warn('[Map] Google Maps JavaScript API load error. Using built-in vector router.');
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.warn('[Map] Map config check error:', err.message);
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
          travelMode,
        });

        if (isMounted) {
          setRouteData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Map] Route calculation error:', err.message);
          setError('Unable to calculate route right now. Please try again.');
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

  // 3. Render Google Maps if loaded
  useEffect(() => {
    if (!googleMapsLoaded || !window.google?.maps || !mapContainerRef.current || !oLat || !dLat) {
      return;
    }

    try {
      const google = window.google;
      const originLatLng = new google.maps.LatLng(oLat, oLng);
      const destLatLng = new google.maps.LatLng(dLat, dLng);

      if (!googleMapInstanceRef.current) {
        const map = new google.maps.Map(mapContainerRef.current, {
          zoom: 12,
          center: originLatLng,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        googleMapInstanceRef.current = map;

        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#0284c7',
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
        });
        directionsRendererRef.current = directionsRenderer;
      }

      // Query Google Directions Service on client if available
      const directionsService = new google.maps.DirectionsService();
      const activeMode = TRAVEL_MODES.find((m) => m.key === travelMode)?.googleKey || 'DRIVING';

      directionsService.route(
        {
          origin: originLatLng,
          destination: destLatLng,
          travelMode: google.maps.TravelMode[activeMode],
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
          }
        }
      );
    } catch (gMapErr) {
      console.warn('[Map] Google Maps rendering warning:', gMapErr.message);
    }
  }, [googleMapsLoaded, oLat, oLng, dLat, dLng, travelMode]);

  if (!oLat || !dLat) {
    return (
      <div className="map-section-wrapper">
        <div className="map-empty-state">
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <p>Location coordinates are required to display the interactive route map.</p>
        </div>
      </div>
    );
  }

  const googleMapsAppUrl =
    routeData?.google_maps_directions_url ||
    `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=${travelMode}`;

  const handlePlanClick = () => {
    if (onPlanTripClick) {
      onPlanTripClick();
    } else {
      setShowPlanNotice(true);
      setTimeout(() => setShowPlanNotice(false), 4500);
    }
  };

  // Compute SVG viewBox for the interactive vector map fallback
  const minLat = Math.min(oLat, dLat);
  const maxLat = Math.max(oLat, dLat);
  const minLng = Math.min(oLng, dLng);
  const maxLng = Math.max(oLng, dLng);
  const latDiff = Math.max(maxLat - minLat, 0.05);
  const lngDiff = Math.max(maxLng - minLng, 0.05);
  const padLat = latDiff * 0.25;
  const padLng = lngDiff * 0.25;

  const toSvgX = (lng) => {
    const min = minLng - padLng;
    const max = maxLng + padLng;
    return ((lng - min) / (max - min)) * 500;
  };

  const toSvgY = (lat) => {
    const min = minLat - padLat;
    const max = maxLat + padLat;
    return 300 - ((lat - min) / (max - min)) * 300;
  };

  const originX = toSvgX(oLng);
  const originY = toSvgY(oLat);
  const destX = toSvgX(dLng);
  const destY = toSvgY(dLat);

  // Generate SVG polyline path string
  let pathD = `M ${originX} ${originY}`;
  if (routeData?.route_points && routeData.route_points.length > 2) {
    // Sample up to 40 points for smooth rendering
    const step = Math.max(1, Math.floor(routeData.route_points.length / 40));
    for (let i = 0; i < routeData.route_points.length; i += step) {
      const [ptLat, ptLng] = routeData.route_points[i];
      pathD += ` L ${toSvgX(ptLng)} ${toSvgY(ptLat)}`;
    }
    pathD += ` L ${destX} ${destY}`;
  } else {
    // Smooth quadratic curve between origin and destination
    const midX = (originX + destX) / 2 + (destY - originY) * 0.15;
    const midY = (originY + destY) / 2 + (originX - destX) * 0.15;
    pathD = `M ${originX} ${originY} Q ${midX} ${midY} ${destX} ${destY}`;
  }

  return (
    <div className="interactive-map-section">
      <div className="map-card">
        {/* Map Header */}
        <div className="map-card-header">
          <div>
            <span className="eyebrow">Interactive Navigation</span>
            <h3 className="map-card-title">{title}</h3>
            <p className="map-card-subtitle">
              From <strong style={{ color: '#0f172a' }}>{origin?.city || 'Your Location'}</strong> to{' '}
              <strong style={{ color: '#0284c7' }}>{destination?.name || 'Selected Destination'}</strong>
            </p>
            {destWeather && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', color: '#166534', marginTop: '0.35rem' }}>
                <span>{destWeather.icon || '🌤️'}</span>
                <span>{destWeather.temperature}°C {destWeather.condition}</span>
                <span style={{ color: '#0284c7' }}>• 🌧️ {destWeather.rain_probability}% Rain</span>
                <span style={{ color: '#15803d' }}>• {destWeather.outdoor_suitability}</span>
              </div>
            )}
          </div>

          {/* Travel Mode Selector */}
          <div className="map-mode-selector">
            {TRAVEL_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`map-mode-btn ${travelMode === mode.key ? 'active' : ''}`}
                onClick={() => setTravelMode(mode.key)}
                disabled={loading}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas / Visualizer Container */}
        <div className="map-canvas-container">
          {/* 1. Google Maps Canvas */}
          <div
            ref={mapContainerRef}
            className={`google-map-embed ${googleMapsLoaded ? 'active' : 'hidden'}`}
            style={{ width: '100%', height: '320px', borderRadius: '16px' }}
          />

          {/* 2. Interactive SVG Map Visualizer (Active when Google Maps key is not set or loading) */}
          {!googleMapsLoaded && (
            <div className="vector-map-viewport">
              <div className="vector-map-bg-grid" />
              <svg
                viewBox="0 0 500 300"
                className="vector-map-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Route Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animated-route-stroke"
                />

                {/* Origin Marker (User GPS) */}
                <g transform={`translate(${originX}, ${originY})`} className="svg-marker origin-marker">
                  <circle r="16" fill="#0284c7" fillOpacity="0.25" className="marker-pulse" />
                  <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  <text y="24" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
                    📍 You
                  </text>
                </g>

                {/* Destination Marker (Target Place) */}
                <g transform={`translate(${destX}, ${destY})`} className="svg-marker dest-marker">
                  <circle r="18" fill="#ef4444" fillOpacity="0.2" className="marker-pulse" />
                  <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
                  <text y="24" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
                    📌 {destination?.name?.length > 15 ? destination.name.substring(0, 15) + '...' : destination?.name || 'Destination'}
                  </text>
                </g>
              </svg>

              <div className="vector-map-overlay-badge">
                <span>📍 Live Route Preview</span>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="map-loading-overlay">
              <div className="location-pulse-indicator" />
              <span>Calculating live route & distance...</span>
            </div>
          )}

          {/* Error Overlay */}
          {error && !loading && (
            <div className="map-error-overlay">
              <p>⚠️ {error}</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setTravelMode(travelMode)}
              >
                Retry Route
              </button>
            </div>
          )}
        </div>

        {/* Route Metrics & Distance Bar */}
        <div className="map-metrics-bar">
          <div className="metric-item">
            <span className="metric-label">📏 Road Distance</span>
            <strong className="metric-value text-primary">
              {routeData?.distance_text || (routeData?.distance_km ? `${routeData.distance_km} km` : 'Calculating...')}
            </strong>
          </div>

          <div className="metric-item">
            <span className="metric-label">⏱️ Estimated Time</span>
            <strong className="metric-value text-success">
              {routeData?.duration_text || 'Calculating...'}
            </strong>
          </div>

          <div className="metric-item">
            <span className="metric-label">🚦 Travel Mode</span>
            <span className="metric-mode-tag">
              {TRAVEL_MODES.find((m) => m.key === travelMode)?.label || travelMode}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="map-actions-group">
            <a
              href={googleMapsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm btn-nav-maps"
            >
              🗺️ Open in Google Maps ↗
            </a>

            <button
              type="button"
              className="btn btn-primary btn-sm btn-plan-trip-map"
              onClick={handlePlanClick}
            >
              ✈️ Plan This Trip
            </button>
          </div>
        </div>

        {/* Plan notice banner */}
        {showPlanNotice && (
          <div className="place-modal-plan-notice" style={{ margin: '1rem 1.25rem 0' }}>
            <span>✈️</span>
            <div>
              <strong>Trip Planning Coming Soon!</strong>
              <p>Itinerary planning, budgets, and transport booking for {destination?.name} will be active in future phases.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
