import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import weatherService from '../services/weatherService';

const POPULAR_INDIAN_HUBS = [
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, emoji: '🏖️' },
  { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, emoji: '🏛️' },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, emoji: '🌊' },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, emoji: '🌿' },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, emoji: '🌉' },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, emoji: '💎' },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, emoji: '🏰' },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, emoji: '🌴' },
];

export default function LocationSection() {
  const {
    currentLocation,
    locationStatus,
    locationError,
    permissionState,
    detectLocation,
    setManualLocation,
  } = useAppContext();

  const [localWeather, setLocalWeather] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [customCityQuery, setCustomCityQuery] = useState('');

  // Fetch live weather when coordinates change
  useEffect(() => {
    let isMounted = true;
    if (currentLocation?.latitude && currentLocation?.longitude) {
      weatherService
        .getCurrentWeather({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          city: currentLocation.city || 'Your Location',
        })
        .then((data) => {
          if (isMounted && data?.current) {
            setLocalWeather(data.current);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [currentLocation]);

  const handleSelectCity = (hub) => {
    setManualLocation({
      city: hub.city,
      state: hub.state,
      country: 'India',
      latitude: hub.lat,
      longitude: hub.lng,
    });
    setShowManualInput(false);
  };

  const handleCustomCitySubmit = (e) => {
    e.preventDefault();
    if (!customCityQuery.trim()) return;

    const q = customCityQuery.trim().toLowerCase();
    const matched = POPULAR_INDIAN_HUBS.find(
      (h) => h.city.toLowerCase().includes(q) || h.state.toLowerCase().includes(q)
    );

    if (matched) {
      handleSelectCity(matched);
    } else {
      setManualLocation({
        city: customCityQuery.trim(),
        state: 'India',
        country: 'India',
        latitude: 20.5937,
        longitude: 78.9629,
      });
    }
    setCustomCityQuery('');
    setShowManualInput(false);
  };

  const isDetecting = locationStatus === 'detecting';
  const isSuccess = locationStatus === 'success' && currentLocation;
  const isDenied = locationStatus === 'denied' || permissionState === 'denied';
  const isError = locationStatus === 'error';

  return (
    <div className="location-section-container" style={{ padding: '1rem 0' }}>
      <div className="container">
        <div
          className="location-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            border: isDenied ? '1.5px solid #fca5a5' : isSuccess ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0',
            padding: '1.5rem 2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* ================================================================= */}
          {/* 1. LOADING STATE: Detecting GPS Location */}
          {/* ================================================================= */}
          {isDetecting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.25rem 0' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3.5px solid #e2e8f0',
                  borderTopColor: '#0284c7',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
              <div>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  Detecting your location...
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Requesting browser GPS coordinates and analyzing nearby destinations...
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. SUCCESS STATE: Location Detected Successfully */}
          {/* ================================================================= */}
          {!isDetecting && isSuccess && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1.5px solid rgba(34, 197, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.7rem',
                  }}
                >
                  📍
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
                      {currentLocation.city || 'Detected Location'}
                      {currentLocation.state ? `, ${currentLocation.state}` : ''}
                    </h3>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {currentLocation.isManual ? '📍 Selected Origin' : '✔ Location detected'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b' }}>
                    {currentLocation.country && <span>🇮🇳 {currentLocation.country}</span>}
                    {currentLocation.latitude !== undefined && (
                      <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', color: '#334155' }}>
                        {Math.abs(currentLocation.latitude).toFixed(4)}°{currentLocation.latitude >= 0 ? 'N' : 'S'},{' '}
                        {Math.abs(currentLocation.longitude).toFixed(4)}°{currentLocation.longitude >= 0 ? 'E' : 'W'}
                      </span>
                    )}
                    {currentLocation.accuracy && (
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                        ±{Math.round(currentLocation.accuracy)}m accuracy
                      </span>
                    )}
                    {localWeather && (
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        {localWeather.icon || '🌦️'} {localWeather.temperature}°C {localWeather.condition}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Change City ▾
                </button>
                <button
                  type="button"
                  onClick={() => detectLocation()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="Refresh GPS location"
                >
                  🔄 Refresh GPS
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. DENIED / BLOCKED STATE */}
          {/* ================================================================= */}
          {!isDetecting && !isSuccess && isDenied && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      flexShrink: 0,
                    }}
                  >
                    🚫
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#991b1b' }}>
                      Location access is blocked. Please enable location permission in your browser settings.
                    </h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
                      You can still explore destinations by selecting a starting location manually.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => detectLocation()}
                    className="btn btn-sm btn-primary"
                    style={{ fontWeight: '800', padding: '0.6rem 1.2rem', borderRadius: '10px' }}
                  >
                    📍 Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. ERROR / TIMEOUT STATE (Other errors) */}
          {/* ================================================================= */}
          {!isDetecting && !isSuccess && !isDenied && isError && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      flexShrink: 0,
                    }}
                  >
                    ⚠️
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#92400e' }}>
                      Unable to detect location
                    </h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
                      {locationError || 'Please try again or select your starting city manually.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => detectLocation()}
                  className="btn btn-sm btn-primary"
                  style={{ fontWeight: '800', padding: '0.6rem 1.2rem', borderRadius: '10px' }}
                >
                  📍 Try Again
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. INITIAL PROMPT: Location Not Yet Detected / Idle */}
          {/* ================================================================= */}
          {!isDetecting && !isSuccess && !isDenied && !isError && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', maxWidth: '650px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    color: '#ffffff',
                    boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  📍
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
                    Turn on your location
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Allow location access to discover tourist places near you and plan your journey across India.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => detectLocation()}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.6rem',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    boxShadow: '0 6px 16px rgba(2, 132, 199, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  📍 Turn On Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #cbd5e1',
                    color: '#475569',
                    padding: '0.7rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Select City Manually ▾
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MANUAL CITY SELECTION DRAWER */}
          {/* ================================================================= */}
          {(showManualInput || isDenied || (isError && !currentLocation)) && (
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.75rem' }}>
                Select Your Starting Location in India:
              </div>

              {/* Quick City Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {POPULAR_INDIAN_HUBS.map((hub) => (
                  <button
                    key={hub.city}
                    type="button"
                    onClick={() => handleSelectCity(hub)}
                    style={{
                      background: currentLocation?.city === hub.city ? '#0284c7' : '#ffffff',
                      color: currentLocation?.city === hub.city ? '#ffffff' : '#0f172a',
                      border: currentLocation?.city === hub.city ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span>{hub.emoji}</span>
                    <span>{hub.city}</span>
                  </button>
                ))}
              </div>

              {/* Custom City Search Input */}
              <form onSubmit={handleCustomCitySubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '480px' }}>
                <input
                  type="text"
                  value={customCityQuery}
                  onChange={(e) => setCustomCityQuery(e.target.value)}
                  placeholder="Or type another city (e.g. Pune, Varanasi, Agra)..."
                  style={{
                    flex: 1,
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Set Origin
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
