import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import weatherService from '../services/weatherService';

export default function LocationSection() {
  const { currentLocation, locationStatus, locationError, detectLocation, isAuthenticated, t } = useAppContext();
  const [localWeather, setLocalWeather] = useState(null);

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

  // If user is not logged in, we do not require active location prompt
  if (!isAuthenticated && !currentLocation) {
    return null;
  }

  return (
    <div className="location-section-container">
      <div className="location-card">
        <div className="location-card-header">
          <div className="location-icon-wrapper">
            <span className="location-pin-icon" role="img" aria-label="location">
              📍
            </span>
          </div>
          <div>
            <h3 className="location-title">Your Location</h3>
            <p className="location-subtitle">GPS Current Location</p>
          </div>
        </div>

        <div className="location-card-body">
          {/* 1. Detecting / Loading State */}
          {locationStatus === 'detecting' && (
            <div className="location-state-box location-loading">
              <div className="location-pulse-indicator" />
              <div className="location-state-text">
                <strong>Detecting your location...</strong>
                <p>Requesting GPS coordinates from your browser</p>
              </div>
            </div>
          )}

          {/* 2. Success State */}
          {locationStatus === 'success' && currentLocation && (
            <div className="location-state-box location-success">
              <div className="location-info">
                <h4 className="location-place-name">
                  {currentLocation.city || 'Detected Location'}
                  {currentLocation.state ? `, ${currentLocation.state}` : ''}
                </h4>
                <div className="location-meta-row">
                  <span className="location-status-badge">✔ Location detected successfully.</span>
                  {currentLocation.country && (
                    <span className="location-country-tag">{currentLocation.country}</span>
                  )}
                  {currentLocation.latitude !== undefined && (
                    <span className="location-coords-tag">
                      {Math.abs(currentLocation.latitude).toFixed(2)}°{currentLocation.latitude >= 0 ? 'N' : 'S'},{' '}
                      {Math.abs(currentLocation.longitude).toFixed(2)}°{currentLocation.longitude >= 0 ? 'E' : 'W'}
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
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      title={`Rain chance: ${localWeather.rain_probability}%, Suitability: ${localWeather.outdoor_suitability}`}
                    >
                      {localWeather.icon} {localWeather.temperature}°C {localWeather.condition}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-location-action btn-refresh"
                onClick={() => detectLocation(true)}
                title="Update Location"
              >
                🔄 Refresh
              </button>
            </div>
          )}

          {/* 3. Permission Denied State */}
          {locationStatus === 'denied' && (
            <div className="location-state-box location-denied">
              <div className="location-state-text">
                <strong className="text-warning">⚠️ Location Permission Required</strong>
                <p>
                  Location access is disabled. Please allow location permission to get personalized travel
                  recommendations.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-try-again"
                onClick={() => detectLocation(true)}
              >
                Try Again
              </button>
            </div>
          )}

          {/* 4. Other Error State */}
          {locationStatus === 'error' && (
            <div className="location-state-box location-error">
              <div className="location-state-text">
                <strong className="text-error">⚠️ Location Detection Error</strong>
                <p>{locationError || 'Unable to retrieve your current location. Please check your connection.'}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-try-again"
                onClick={() => detectLocation(true)}
              >
                Try Again
              </button>
            </div>
          )}

          {/* 5. Idle state (Initial prompt if not detected yet) */}
          {locationStatus === 'idle' && !currentLocation && (
            <div className="location-state-box location-idle">
              <div className="location-state-text">
                <strong>Enable Location Services</strong>
                <p>Discover personalized destinations, nearby itineraries, and travel deals based on your location.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => detectLocation(true)}
              >
                📍 Detect Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
