import React, { useState, useEffect } from 'react';
import weatherService from '../services/weatherService';
import { useAppContext } from '../context/AppContext';

export default function WeatherCard({
  destination = 'Ooty',
  coordinates = null,
  showForecastToggle = true,
  allowCurrentLocation = true,
  compact = false,
  onWeatherLoaded = null,
}) {
  const { currentLocation, detectLocation, locationStatus, t } = useAppContext();

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [showForecast, setShowForecast] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'forecast' | 'indoor'

  // Load weather when destination or coordinates change
  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      setLoading(true);
      setError('');

      try {
        let result = null;

        if (isUsingGps && currentLocation?.latitude && currentLocation?.longitude) {
          result = await weatherService.getCurrentWeather({
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            city: currentLocation.city || 'Your Location',
          });
          const fc = await weatherService.getWeatherForecast({
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            city: currentLocation.city || 'Your Location',
            days: 7,
          });
          if (result && fc) {
            result = {
              destination: currentLocation.city || 'Your Location',
              current: result.current,
              forecast: fc.days || [],
              weather_available: result.weather_available || fc.weather_available,
              outdoor_places: [],
              indoor_places: [],
            };
          }
        } else if (coordinates?.latitude && coordinates?.longitude) {
          result = await weatherService.getCurrentWeather({
            lat: coordinates.latitude,
            lng: coordinates.longitude,
            city: destination?.name || destination || 'Destination',
          });
          const fc = await weatherService.getWeatherForecast({
            lat: coordinates.latitude,
            lng: coordinates.longitude,
            city: destination?.name || destination || 'Destination',
            days: 7,
          });
          if (result && fc) {
            result = {
              destination: destination?.name || destination || 'Destination',
              current: result.current,
              forecast: fc.days || [],
              weather_available: result.weather_available || fc.weather_available,
              outdoor_places: [],
              indoor_places: [],
            };
          }
        } else {
          const destParam = typeof destination === 'object' ? destination.name || destination.id : destination;
          result = await weatherService.getDestinationWeather(destParam);
        }

        if (isMounted) {
          setWeatherData(result);
          if (onWeatherLoaded && result) {
            onWeatherLoaded(result);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[WeatherCard] Load weather error:', err.message);
          setError(err.response?.data?.message || err.message || t('weather.weatherUnavailable', 'Weather information is temporarily unavailable.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [destination, coordinates, isUsingGps, currentLocation]);

  const handleGpsWeatherClick = async () => {
    if (isUsingGps) {
      setIsUsingGps(false);
      return;
    }

    if (currentLocation?.latitude && currentLocation?.longitude) {
      setIsUsingGps(true);
    } else {
      // Trigger detection
      await detectLocation(true);
      setIsUsingGps(true);
    }
  };

  const current = weatherData?.current;
  const forecast = weatherData?.forecast || [];
  const destName = isUsingGps
    ? currentLocation?.city || 'Your Location'
    : typeof destination === 'object'
    ? destination.name
    : destination;

  // Suitability style mapping
  const getSuitabilityBadge = (score) => {
    switch (score) {
      case 'Good':
        return { label: t('weather.good', 'Good'), bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'Moderate':
        return { label: t('weather.moderate', 'Moderate'), bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
      case 'Poor':
        return { label: t('weather.poor', 'Poor'), bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      default:
        return { label: score || t('weather.good', 'Good'), bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  if (loading) {
    return (
      <div
        className="weather-card-container"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 255, 0.9))',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #bae6fd',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 10px 25px rgba(2, 132, 199, 0.08)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="location-pulse-indicator" style={{ width: '20px', height: '20px', background: '#0284c7' }} />
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0369a1' }}>
            {t('weather.loadingWeather', 'Loading weather data...')}
          </span>
        </div>
      </div>
    );
  }

  if (error || !weatherData || !current) {
    return (
      <div
        className="weather-card-container"
        style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🌤️</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#334155' }}>
              {t('weather.title', 'Destination Weather')}: {destName}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {t('weather.weatherUnavailable', 'Weather information is temporarily unavailable.')}
            </p>
          </div>
        </div>
        {allowCurrentLocation && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleGpsWeatherClick}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            📍 {t('weather.currentLocationWeather', 'Current Location Weather')}
          </button>
        )}
      </div>
    );
  }

  const badgeInfo = getSuitabilityBadge(current.outdoor_suitability);

  return (
    <div
      className="weather-card-container"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.95))',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid #bae6fd',
        borderRadius: '24px',
        padding: compact ? '1.25rem' : '1.75rem',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.1)',
        marginBottom: '1.75rem',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #e0f2fe',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
            }}
          >
            {current.icon || '🌤️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ✨ Phase 26 Weather AI
              </span>
              {isUsingGps && (
                <span
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #86efac',
                  }}
                >
                  📍 GPS Location
                </span>
              )}
            </div>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', fontWeight: '900', color: '#0f172a' }}>
              {t('weather.weather', 'Weather')} in {destName}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {allowCurrentLocation && (
            <button
              type="button"
              onClick={handleGpsWeatherClick}
              className="btn btn-sm"
              style={{
                background: isUsingGps ? '#0284c7' : '#ffffff',
                color: isUsingGps ? '#ffffff' : '#0369a1',
                border: '1.5px solid #7dd3fc',
                fontWeight: '700',
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={isUsingGps ? 'Switch back to destination weather' : 'Show weather at your current GPS location'}
            >
              📍 {isUsingGps ? destName : t('weather.currentLocationWeather', 'Current Location Weather')}
            </button>
          )}

          {showForecastToggle && forecast.length > 0 && (
            <button
              type="button"
              onClick={() => setShowForecast(!showForecast)}
              className="btn btn-sm btn-outline"
              style={{
                fontWeight: '700',
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
              }}
            >
              📅 {showForecast ? t('weather.hideForecast', 'Hide Forecast') : t('weather.viewForecast', 'View Forecast')}
            </button>
          )}
        </div>
      </div>

      {/* Official Alert Banner (if applicable) */}
      {current.alert && (
        <div
          style={{
            background: '#fee2e2',
            border: '1.5px solid #f87171',
            borderRadius: '14px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>{current.alert.title || t('weather.weatherAlert', 'Weather Advisory')}</strong>
            <p style={{ margin: '0.15rem 0 0 0', color: '#7f1d1d', fontSize: '0.82rem', lineHeight: 1.4 }}>
              {current.alert.description}
            </p>
          </div>
        </div>
      )}

      {/* Main Meteorological Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Temperature Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            {t('weather.temperature', 'Temperature')}
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#0f172a', margin: '0.2rem 0' }}>
            {current.temperature}°C
          </div>
          <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '600' }}>
            {t('weather.feelsLike', 'Feels like')}: {current.apparent_temperature}°C
          </span>
        </div>

        {/* Condition Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            {t('weather.weather', 'Condition')}
          </span>
          <div style={{ fontSize: '1.75rem', margin: '0.3rem 0' }}>{current.icon}</div>
          <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
            {current.condition}
          </strong>
        </div>

        {/* Rain Probability Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            {t('weather.rainChance', 'Rain Chance')}
          </span>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: '900',
              color: current.rain_probability > 50 ? '#0284c7' : '#334155',
              margin: '0.35rem 0',
            }}
          >
            🌧️ {current.rain_probability}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              background: '#f1f5f9',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(5, current.rain_probability))}%`,
                height: '100%',
                background: current.rain_probability > 50 ? '#0284c7' : '#94a3b8',
                borderRadius: '9999px',
              }}
            />
          </div>
        </div>

        {/* Wind & Humidity Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            {t('weather.wind', 'Wind')} & {t('weather.humidity', 'Humidity')}
          </span>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0' }}>
            💨 {current.wind_speed} km/h
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            💧 {t('weather.humidity', 'Humidity')}: {current.humidity}%
          </span>
        </div>

        {/* Outdoor Suitability Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
            {t('weather.outdoorSuitability', 'Outdoor Suitability')}
          </span>
          <div style={{ margin: '0.5rem 0' }}>
            <span
              style={{
                background: badgeInfo.bg,
                color: badgeInfo.color,
                border: `1.5px solid ${badgeInfo.border}`,
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                display: 'inline-block',
              }}
            >
              ● {badgeInfo.label}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {current.is_rainy ? 'Rainy weather' : 'Clear weather'}
          </span>
        </div>
      </div>

      {/* Smart Weather Suggestion Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          marginBottom: showForecast && forecast.length > 0 ? '1.25rem' : 0,
        }}
      >
        <span style={{ fontSize: '1.6rem' }}>🌦️</span>
        <div>
          <strong style={{ fontSize: '0.85rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('weather.smartSuggestion', 'Smart Weather Suggestion')}
          </strong>
          <p style={{ margin: '0.2rem 0 0 0', color: '#0c4a6e', fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.4 }}>
            {current.smart_suggestion}
          </p>
        </div>
      </div>

      {/* Multi-Day Forecast Strip */}
      {showForecast && forecast.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
              📅 {t('weather.multiDayForecast', 'Multi-Day Forecast')} ({forecast.length} {t('common.days', 'Days')})
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {t('weather.liveSatelliteData', 'Live meteorological data powered by Open-Meteo')}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '0.65rem',
            }}
          >
            {forecast.map((day, idx) => {
              const dayBadge = getSuitabilityBadge(day.outdoor_suitability);
              return (
                <div
                  key={day.date || idx}
                  style={{
                    background: idx === 0 ? '#eff6ff' : '#ffffff',
                    border: idx === 0 ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '0.85rem 0.5rem',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', display: 'block' }}>
                    {day.day_name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                    {day.date?.split('-').slice(1).join('/')}
                  </span>
                  <div style={{ fontSize: '1.75rem', margin: '0.2rem 0' }}>{day.icon}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                    {day.temperature_max}° <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>/ {day.temperature_min}°</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700', marginTop: '0.2rem' }}>
                    🌧️ {day.rain_probability}%
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span
                      style={{
                        background: dayBadge.bg,
                        color: dayBadge.color,
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        display: 'inline-block',
                      }}
                    >
                      {dayBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
