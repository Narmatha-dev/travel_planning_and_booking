import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import placesSearchService from '../services/placesSearchService';

const SAMPLE_SEARCHES = [
  'Eiffel Tower',
  'Taj Mahal',
  'Marina Beach Chennai',
  'Burj Khalifa',
  'Tokyo Tower',
  'Gateway of India',
  'Munnar',
  'Bali',
  'Sydney Opera House',
  'Colosseum Rome',
];

export default function GlobalPlaceSearch({
  onPlaceSelect,
  onViewOnMap,
  onPlanTrip,
  initialQuery = '',
  compact = false,
}) {
  const navigate = useNavigate();
  const { currentLocation } = useAppContext();

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [searching, setSearching] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef(null);
  const inputContainerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions as user types
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await placesSearchService.getAutocomplete(query, {
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });
        if (res && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          setSuggestions(res.suggestions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, currentLocation]);

  const executeSearch = async (searchTerm, explicitPlaceId = null) => {
    const q = (searchTerm || query).trim();
    if (!q) return;

    setSearching(true);
    setPhotoLoading(true);
    setErrorMessage('');
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      let placeData = null;

      if (explicitPlaceId) {
        try {
          placeData = await placesSearchService.getPlaceDetails(explicitPlaceId);
        } catch {}
      }

      if (!placeData) {
        const res = await placesSearchService.searchPlaces(q, {
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });

        if (res && res.primaryMatch) {
          placeData = res.primaryMatch;
          setSearchResult({
            primary: res.primaryMatch,
            alternatives: res.alternatives || [],
            source: res.source,
          });
        } else {
          setSearchResult(null);
          setErrorMessage('No place found. Try another search.');
        }
      } else {
        setSearchResult({
          primary: placeData,
          alternatives: [],
          source: 'direct_selection',
        });
      }

      if (placeData && onPlaceSelect) {
        onPlaceSelect(placeData);
      }
    } catch (err) {
      console.warn('[GlobalPlaceSearch] Search error:', err.message);
      setErrorMessage('Unable to search for this place right now.');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        setQuery(selected.mainText);
        executeSearch(selected.mainText, selected.placeId);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    setQuery(item.mainText);
    setShowSuggestions(false);
    executeSearch(item.mainText, item.placeId);
  };

  const handleSampleClick = (sampleText) => {
    setQuery(sampleText);
    executeSearch(sampleText);
  };

  const handleViewMap = (place) => {
    if (onViewOnMap) {
      onViewOnMap(place);
    } else {
      const mapElem = document.getElementById('interactive-map-section');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePlanTripClick = (place) => {
    if (onPlanTrip) {
      onPlanTrip(place);
    } else {
      navigate(
        `/trip-planner?destination=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`
      );
    }
  };

  // Distance calculation helper if user GPS is active
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
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
    return parseFloat((R * c).toFixed(1));
  };

  const primaryPlace = searchResult?.primary;
  const userDistKm =
    currentLocation && primaryPlace?.latitude && primaryPlace?.longitude
      ? calculateDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          primaryPlace.latitude,
          primaryPlace.longitude
        )
      : null;

  return (
    <div className="global-place-search-container" style={{ width: '100%', margin: '0 auto' }}>
      {/* Search Input Bar */}
      <div ref={inputContainerRef} style={{ position: 'relative', width: '100%' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '0.45rem 0.6rem',
            border: '2px solid #0284c7',
            boxShadow: '0 8px 30px rgba(2, 132, 199, 0.12)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ padding: '0 0.75rem', fontSize: '1.3rem', color: '#0284c7' }}>
            🌍
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search any destination in the world... (e.g. Eiffel Tower, Taj Mahal, Bali, Dubai)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontWeight: '500',
              padding: '0.65rem 0.25rem',
              color: '#0f172a',
              background: 'transparent',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchResult(null);
                setHasSearched(false);
                setErrorMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0 0.5rem',
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={searching}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              padding: '0.75rem 1.6rem',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            }}
          >
            {searching ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></span>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <span>➔</span>
              </>
            )}
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
              zIndex: 9999,
              overflow: 'hidden',
              maxHeight: '340px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.72rem',
                fontWeight: '800',
                color: '#64748b',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ⚡ Instant Place Suggestions
            </div>

            {suggestions.map((item, idx) => (
              <div
                key={item.placeId || idx}
                onClick={() => handleSuggestionClick(item)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: selectedIndex === idx ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'background 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                    {item.mainText}
                  </div>
                  {item.secondaryText && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                      {item.secondaryText}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
                  Select ➜
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search Suggestions Pills */}
      {!compact && (
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginRight: '0.25rem' }}>
            Popular worldwide searches:
          </span>
          {SAMPLE_SEARCHES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSampleClick(sample)}
              style={{
                background: query.toLowerCase() === sample.toLowerCase() ? '#e0f2fe' : '#ffffff',
                border: query.toLowerCase() === sample.toLowerCase() ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                color: query.toLowerCase() === sample.toLowerCase() ? '#0284c7' : '#334155',
                padding: '0.28rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      )}

      {/* Loading Feedback */}
      {searching && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1.5px dashed #cbd5e1',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0284c7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <strong style={{ color: '#0f172a', fontSize: '1rem' }}>Finding your destination...</strong>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Querying Google Places & verified real destination photography...
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !searching && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '14px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>{errorMessage}</strong>
            <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>
              Check the spelling or try famous landmarks like "Eiffel Tower", "Taj Mahal", "Burj Khalifa", or "Bali".
            </span>
          </div>
        </div>
      )}

      {/* "Did you mean?" Alternatives Disambiguation */}
      {searchResult?.alternatives?.length > 0 && !searching && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1.25rem',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0369a1', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            💡 Did you mean another location?
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {searchResult.alternatives.map((alt, idx) => (
              <button
                key={alt.placeId || idx}
                type="button"
                onClick={() => {
                  setSearchResult({
                    primary: alt,
                    alternatives: searchResult.alternatives.filter((a) => a.placeId !== alt.placeId),
                    source: 'user_selected_alternative',
                  });
                  if (onPlaceSelect) onPlaceSelect(alt);
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #7dd3fc',
                  color: '#0369a1',
                  borderRadius: '16px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>📍</span>
                <span>{alt.name}</span>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({alt.city || alt.country})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Result Card (Feature 4) */}
      {primaryPlace && !searching && (
        <div
          className="search-result-card"
          style={{
            marginTop: '1.5rem',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              padding: '1.5rem',
            }}
          >
            {/* Left: Real Destination Photograph */}
            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', minHeight: '220px', background: '#0f172a' }}>
              {primaryPlace.photoUrl ? (
                <>
                  <img
                    src={primaryPlace.photoUrl}
                    alt={primaryPlace.name}
                    onLoad={() => setPhotoLoading(false)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '220px',
                      maxHeight: '260px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Category & Status Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ⭐ {primaryPlace.rating || 4.7} • {primaryPlace.category?.toUpperCase() || 'DESTINATION'}
                  </div>

                  {/* Photo Attribution Ribbon */}
                  {primaryPlace.photoAttribution && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                        padding: '1rem 0.75rem 0.4rem',
                        color: '#cbd5e1',
                        fontSize: '0.68rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      📷 Photo: {primaryPlace.photoAttribution}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    height: '100%',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: '#94a3b8',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>📷</span>
                  <span style={{ fontSize: '0.85rem' }}>No photo available</span>
                </div>
              )}
            </div>

            {/* Right: Place Details & Action Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#e0f2fe',
                      color: '#0284c7',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {primaryPlace.primaryType?.replace(/_/g, ' ') || 'Tourist Attraction'}
                  </span>
                  {primaryPlace.country && (
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                      }}
                    >
                      🏳️ {primaryPlace.country}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem' }}>
                  {primaryPlace.name}
                </h3>

                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: '1.4' }}>
                  📍 {primaryPlace.formattedAddress || `${primaryPlace.city}, ${primaryPlace.country}`}
                </p>

                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', margin: '0 0 1rem' }}>
                  {primaryPlace.description}
                </p>

                {/* Location & GPS Info Tag */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '0.65rem 0.9rem',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    fontSize: '0.8rem',
                    color: '#475569',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <strong>Exact GPS:</strong> {primaryPlace.latitude?.toFixed(4)}° N, {primaryPlace.longitude?.toFixed(4)}° E
                  </div>
                  {userDistKm !== null && (
                    <div style={{ color: '#0284c7', fontWeight: '700' }}>
                      🚀 {userDistKm.toLocaleString()} km from your location
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Explore, View on Map, Plan Trip */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleViewMap(primaryPlace)}
                  className="btn btn-outline"
                  style={{
                    flex: '1',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontWeight: '700',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                  }}
                >
                  🗺️ View on Map
                </button>

                <button
                  type="button"
                  onClick={() => handlePlanTripClick(primaryPlace)}
                  className="btn btn-primary"
                  style={{
                    flex: '1.2',
                    minWidth: '140px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontWeight: '800',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  🚀 Plan Trip
                </button>

                {primaryPlace.googleMapsUri && (
                  <a
                    href={primaryPlace.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                    }}
                    title="Open in Google Maps"
                  >
                    Google Maps ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
