import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import transportService from '../services/transportService';

const PREFERENCE_TABS = [
  { key: 'any', label: '🌟 All Options' },
  { key: 'cheapest', label: '💰 Cheapest' },
  { key: 'fastest', label: '⚡ Fastest' },
  { key: 'comfortable', label: '🛋️ Comfortable' },
];

export default function TransportOptionsSection({
  origin,
  destination,
  distanceKm,
  duration,
  onContinueToTripPlanning,
}) {
  const {
    selectedTransport,
    setSelectedTransport,
    transportPreference,
    setTransportPreference,
  } = useAppContext();

  const [transportData, setTransportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContinueNotice, setShowContinueNotice] = useState(false);

  const oLat = origin?.latitude;
  const oLng = origin?.longitude;
  const dLat = destination?.latitude;
  const dLng = destination?.longitude;

  // Fetch transport options on origin, destination, or preference changes
  useEffect(() => {
    if (!oLat || !oLng || !dLat || !dLng) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchTransport() {
      setLoading(true);
      setError(null);

      try {
        const data = await transportService.getTransportOptions({
          originLat: oLat,
          originLng: oLng,
          destLat: dLat,
          destLng: dLng,
          distanceKm,
          duration,
          preference: transportPreference,
        });

        if (isMounted) {
          setTransportData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Transport] Error calculating options:', err.message);
          setError('Transport information is currently unavailable. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTransport();

    return () => {
      isMounted = false;
    };
  }, [oLat, oLng, dLat, dLng, distanceKm, duration, transportPreference]);

  const handleSelectTransport = (option) => {
    setSelectedTransport({
      ...option,
      originCity: origin?.city || 'Current Location',
      destinationName: destination?.name || 'Destination',
      selectedAt: new Date().toISOString(),
    });
  };

  const handleContinue = () => {
    if (onContinueToTripPlanning) {
      onContinueToTripPlanning(selectedTransport);
    } else {
      setShowContinueNotice(true);
      setTimeout(() => setShowContinueNotice(false), 4500);
    }
  };

  if (!oLat || !dLat) {
    return null;
  }

  const recommendedOption = transportData?.options?.find(
    (opt) => opt.id === transportData.recommended_transport_id
  );

  return (
    <div className="transport-options-container">
      {/* Header & Preferences */}
      <div className="transport-section-header">
        <div>
          <span className="eyebrow">Phase 4 • Getting There</span>
          <h3 className="transport-section-title">
            Transportation to {destination?.name || 'Destination'}
          </h3>
          <p className="transport-section-subtitle">
            Compare approximate costs, travel times, and comfort from{' '}
            <strong>{origin?.city || 'Your Location'}</strong> ({transportData?.distance_text || `${transportData?.distance_km || distanceKm || '—'} km`})
          </p>
        </div>

        {/* User Preference Filter Tabs */}
        <div className="transport-pref-tabs">
          {PREFERENCE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`transport-pref-btn ${transportPreference === tab.key ? 'active' : ''}`}
              onClick={() => setTransportPreference(tab.key)}
              disabled={loading}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Transport Spotlight Banner */}
      {recommendedOption && !loading && (
        <div className="transport-recommendation-spotlight">
          <div className="spotlight-badge">⭐ Recommended for you</div>
          <div className="spotlight-body">
            <div className="spotlight-mode-info">
              <span className="spotlight-icon">{recommendedOption.icon}</span>
              <div>
                <h4 className="spotlight-title">{recommendedOption.title}</h4>
                <p className="spotlight-reason">{transportData.recommended_reason}</p>
              </div>
            </div>

            <div className="spotlight-stats">
              <div className="spotlight-stat-item">
                <span className="stat-label">Estimated Fare</span>
                <strong className="stat-val text-primary">{recommendedOption.cost_text} approx.</strong>
              </div>
              <div className="spotlight-stat-item">
                <span className="stat-label">Travel Time</span>
                <strong className="stat-val text-success">{recommendedOption.duration_text}</strong>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${
                  selectedTransport?.id === recommendedOption.id ? 'btn-success' : 'btn-primary'
                }`}
                onClick={() => handleSelectTransport(recommendedOption)}
              >
                {selectedTransport?.id === recommendedOption.id ? '✓ Selected' : 'Select Recommended'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="transport-cards-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="transport-card transport-card-skeleton">
              <div className="skeleton-icon" />
              <div className="skeleton-line" style={{ width: '60%', height: '18px', margin: '0.5rem 0' }} />
              <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '1rem' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '36px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="transport-error-state">
          <p>⚠️ {error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setTransportPreference(transportPreference)}
          >
            Retry Loading Transport Options
          </button>
        </div>
      )}

      {/* Transport Cards Grid */}
      {!loading && !error && transportData?.options && (
        <div className="transport-cards-grid">
          {transportData.options.map((option) => {
            const isSelected = selectedTransport?.id === option.id;
            const isRecommended = transportData.recommended_transport_id === option.id;

            return (
              <div
                key={option.id}
                className={`transport-card ${isSelected ? 'selected' : ''} ${
                  isRecommended ? 'recommended-border' : ''
                }`}
              >
                {isRecommended && <span className="card-ribbon">⭐ Recommended</span>}

                {/* Card Header */}
                <div className="transport-card-top">
                  <span className="transport-card-icon">{option.icon}</span>
                  <div>
                    <h4 className="transport-card-name">{option.title}</h4>
                    <span className="transport-card-frequency">{option.frequency_label}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="transport-card-metrics">
                  <div className="metric-box">
                    <span className="m-label">⏱️ Est. Time</span>
                    <strong className="m-val">{option.duration_text}</strong>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">💵 {option.cost_label}</span>
                    <strong className="m-val text-primary">{option.cost_text}</strong>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">📏 Distance</span>
                    <strong className="m-val">{option.distance_text}</strong>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">🛋️ Comfort</span>
                    <strong className="m-val">{'★'.repeat(Math.round(option.comfort_rating))}</strong>
                  </div>
                </div>

                {/* Key Features List */}
                <ul className="transport-features-list">
                  {option.features.map((feat, fIdx) => (
                    <li key={fIdx}>
                      <span className="feat-check">✓</span> {feat}
                    </li>
                  ))}
                </ul>

                {/* Pricing estimation note */}
                <p className="transport-cost-breakdown">
                  ℹ️ {option.cost_breakdown}
                </p>

                {/* Select Button */}
                <button
                  type="button"
                  className={`btn transport-select-btn ${isSelected ? 'btn-success' : 'btn-outline'}`}
                  onClick={() => handleSelectTransport(option)}
                >
                  {isSelected ? '✓ Transport Selected' : 'Select Transport'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Transport Sticky / Footer Bar */}
      {selectedTransport && (
        <div className="selected-transport-banner">
          <div className="selected-transport-info">
            <span className="selected-icon">{selectedTransport.icon}</span>
            <div>
              <span className="selected-tag">Selected Transport</span>
              <h4 className="selected-name">{selectedTransport.title}</h4>
              <p className="selected-details">
                Estimated Cost: <strong>{selectedTransport.cost_text}</strong> • Travel Time:{' '}
                <strong>{selectedTransport.duration_text}</strong> • Distance:{' '}
                <strong>{selectedTransport.distance_text}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-continue-planning"
            onClick={handleContinue}
          >
            ✈️ Continue to Trip Planning ➜
          </button>
        </div>
      )}

      {/* Notice Banner */}
      {showContinueNotice && (
        <div className="place-modal-plan-notice" style={{ marginTop: '1rem' }}>
          <span>✈️</span>
          <div>
            <strong>Transport Choice Saved! ({selectedTransport?.title})</strong>
            <p>
              Your transport selection ({selectedTransport?.cost_text}, {selectedTransport?.duration_text}) is saved and will be automatically loaded into the full Trip Planner and Itinerary generator in the next phase!
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="transport-disclaimer">
        ⚠️ <strong>Note on Fares:</strong> All prices and durations shown are approximate estimates based on standard distance tariffs, fuel averages, and toll calculations. Real booking fares may vary with traffic, surge, and seasonal availability.
      </p>
    </div>
  );
}
