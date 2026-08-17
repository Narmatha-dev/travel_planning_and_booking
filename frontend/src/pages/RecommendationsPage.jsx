import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import recommendationService from '../services/recommendationService';

const INTEREST_OPTIONS = [
  { id: 'beach', label: 'Beach & Islands', icon: '🏖️' },
  { id: 'mountain', label: 'Mountains & Snow', icon: '🏔️' },
  { id: 'cultural', label: 'Culture & Heritage', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '🧗' },
  { id: 'wildlife', label: 'Wildlife & Safari', icon: '🦁' },
  { id: 'romance', label: 'Romance & Honeymoon', icon: '💖' },
  { id: 'wellness', label: 'Wellness & Yoga', icon: '🧘' },
  { id: 'city_break', label: 'City Break & Shopping', icon: '🏙️' },
];

const TRAVEL_TYPES = [
  { id: 'family', label: 'Family Vacation', icon: '👨‍👩‍👧‍👦', sub: 'Kid-friendly, safe & relaxed' },
  { id: 'couple', label: 'Romantic Couple', icon: '💑', sub: 'Scenic views & candlelit dinners' },
  { id: 'solo', label: 'Solo Explorer', icon: '🎒', sub: 'Walkable, social & authentic' },
  { id: 'friends', label: 'Friends Group', icon: '👥', sub: 'Nightlife, group sports & fun' },
  { id: 'luxury', label: 'Luxury Elite', icon: '👑', sub: '5-star villas & VIP transfers' },
];

export default function RecommendationsPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  // Recommendation Form State
  const [selectedInterests, setSelectedInterests] = useState(['beach']);
  const [currency, setCurrency] = useState('INR');
  const [budget, setBudget] = useState(20000);
  const [durationDays, setDurationDays] = useState(4);
  const [travelType, setTravelType] = useState('family');
  const [includeHistory, setIncludeHistory] = useState(true);

  // Results State
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial recommendation run on mount
  useEffect(() => {
    handleGenerateRecommendations();
  }, []);

  const handleToggleInterest = (id) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCurrencySwitch = (newCurr) => {
    if (newCurr === currency) return;
    if (newCurr === 'USD' && currency === 'INR') {
      setCurrency('USD');
      setBudget(Math.round(budget / 85));
    } else if (newCurr === 'INR' && currency === 'USD') {
      setCurrency('INR');
      setBudget(Math.round(budget * 85));
    }
  };

  const handleGenerateRecommendations = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await recommendationService.getRecommendations({
        budget,
        currency,
        durationDays,
        interests: selectedInterests,
        travelType,
        userId: user?.id || 3,
        includeHistory,
        limit: 6,
      });
      setResults(response);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            color: '#ffffff',
            marginBottom: '3rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ AI Travel Intelligence
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.75rem 0 0.5rem 0', lineHeight: 1.2 }}>
              Personalized Travel Recommendations
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
              Our explainable multi-factor algorithm analyzes your budget, duration, interests, travel style, and past history to find your ideal vacation match.
            </p>
          </div>
        </div>

        {/* AI Recommendation Form & Settings */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: '3rem',
          }}
        >
          <form onSubmit={handleGenerateRecommendations}>
            {/* 1. Travel Interests Chips */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                1. Select Travel Interests (Choose 1 or more)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {INTEREST_OPTIONS.map((item) => {
                  const isSelected = selectedInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleInterest(item.id)}
                      style={{
                        padding: '0.6rem 1.15rem',
                        borderRadius: '9999px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: isSelected ? '#e0f2fe' : '#ffffff',
                        color: isSelected ? '#0369a1' : '#475569',
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Budget & Duration Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              {/* Budget Controller */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    2. Total Vacation Budget
                  </label>
                  {/* Currency Switcher */}
                  <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('INR')}
                      style={{
                        border: 'none',
                        background: currency === 'INR' ? '#ffffff' : 'transparent',
                        color: currency === 'INR' ? '#0f172a' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: currency === 'INR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      INR (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('USD')}
                      style={{
                        border: 'none',
                        background: currency === 'USD' ? '#ffffff' : 'transparent',
                        color: currency === 'USD' ? '#0f172a' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: currency === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Math.max(100, Number(e.target.value)))}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                    }}
                  />
                </div>

                {/* Quick Budget Presets */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(currency === 'INR' ? [15000, 20000, 35000, 60000, 100000] : [300, 600, 1200, 2500, 4000]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudget(val)}
                      style={{
                        border: '1px solid #e2e8f0',
                        background: budget === val ? '#0284c7' : '#f8fafc',
                        color: budget === val ? '#ffffff' : '#475569',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {currency === 'INR' ? `₹${val.toLocaleString()}` : `$${val.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Controller */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    3. Travel Duration
                  </label>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
                    {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="14"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  style={{ width: '100%', height: '8px', accentColor: '#0284c7', cursor: 'pointer', marginTop: '0.75rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  <span>Weekend (2-3 Days)</span>
                  <span>1 Week (7 Days)</span>
                  <span>Grand Tour (14 Days)</span>
                </div>
              </div>
            </div>

            {/* 3. Travel Type Selector */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                4. Travel Style & Companions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                {TRAVEL_TYPES.map((type) => {
                  const isSelected = travelType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setTravelType(type.id)}
                      style={{
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{type.icon}</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{type.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{type.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Travel History Personalization Toggle & CTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={(e) => setIncludeHistory(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                />
                <span>Include my previous bookings & travel style preferences</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>{loading ? '⚡ Analyzing...' : '✨ Generate AI Recommendations'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Results Section */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'pulse 1s infinite' }}>🤖</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Computing Top Vacation Matches...
            </h3>
            <p style={{ color: '#64748b' }}>
              Evaluating destination costs, activity alignment, and travel style compatibility.
            </p>
          </div>
        )}

        {!loading && results && results.recommendations && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Recommended Destinations ({results.recommendations.length} Matches Found)
              </h2>
              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Sorted by AI Affinity & Value Score
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {results.recommendations.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: index === 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: index === 0 ? '0 8px 30px rgba(2, 132, 199, 0.12)' : '0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Match Score Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: '#15803d',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      zIndex: 2,
                    }}
                  >
                    ⭐ {item.matchPercentage} Match
                  </div>

                  {/* Rank Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      zIndex: 2,
                    }}
                  >
                    #{index + 1} Best Match
                  </div>

                  {/* Image */}
                  <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Content Container */}
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                        {item.estimatedDailyCost}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                      📍 {item.city}, {item.country} • ⛅ {item.climate}
                    </p>

                    {/* Explainability Card: Why AI Recommends This */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>🧠</span> Why AI Recommends This:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#334155', lineHeight: '1.5' }}>
                        {item.matchReasons.map((reason, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Curated Matched Package preview */}
                    {item.matchedPackage && (
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                          Featured Package
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                            {item.matchedPackage.title}
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0284c7' }}>
                            {item.matchedPackage.price}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total Estimated Cost & Actions */}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                          Est. Total ({durationDays} Days)
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
                          {item.estimatedTotalCost}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link
                          to={`/trip-planner?destinationId=${item.id}&duration=${durationDays}`}
                          className="btn btn-outline"
                          style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                        >
                          Plan Trip
                        </Link>
                        <Link
                          to={`/booking?destinationId=${item.id}&travelers=2`}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: '700' }}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
