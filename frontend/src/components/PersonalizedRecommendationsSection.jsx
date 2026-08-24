import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import recommendationService from '../services/recommendationService';
import favoriteService from '../services/favoriteService';

const AVAILABLE_INTERESTS = [
  { id: 'nature', label: 'Nature & Hills', icon: '🏔️' },
  { id: 'beach', label: 'Beaches & Coastal', icon: '🏖️' },
  { id: 'cultural', label: 'Culture & Heritage', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '🧗' },
  { id: 'wildlife', label: 'Wildlife & Safari', icon: '🦁' },
  { id: 'romance', label: 'Romance & Couples', icon: '💖' },
  { id: 'wellness', label: 'Wellness & Ayurveda', icon: '🧘' },
  { id: 'city_break', label: 'City & Shopping', icon: '🏙️' },
  { id: 'photography', label: 'Scenic Photography', icon: '📸' },
];

export default function PersonalizedRecommendationsSection() {
  const { user, currentLocation, isAuthenticated, isFavorite, addFavorite, removeFavorite, t, language } = useAppContext();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(['nature', 'beach']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [refreshSeed, setRefreshSeed] = useState(0);

  // Load preferences & personalized recommendations
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let activeInterests = selectedInterests;

      if (isAuthenticated) {
        try {
          const prefs = await recommendationService.getUserPreferences();
          if (prefs && Array.isArray(prefs.interests) && prefs.interests.length > 0) {
            activeInterests = prefs.interests;
            setSelectedInterests(prefs.interests);
          }
        } catch {}
      } else {
        const guestPrefs = localStorage.getItem('travelora_user_preferences');
        if (guestPrefs) {
          try {
            const parsed = JSON.parse(guestPrefs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              activeInterests = parsed;
              setSelectedInterests(parsed);
            }
          } catch {}
        }
      }

      const params = {
        userId: user?.id || 3,
        interests: activeInterests,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        offset: (refreshSeed * 3) % 6,
        limit: 6,
      };

      const data = await recommendationService.getPersonalizedFeed(params);
      if (data && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.warn('Personalized recommendations fetch warning:', err.message);
      // Fallback
      try {
        const fallbackData = await recommendationService.getRecommendations({
          interests: ['nature', 'beach'],
          limit: 4,
        });
        setRecommendations(fallbackData.recommendations || []);
      } catch {
        setError('Unable to load recommendations at this moment.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentLocation, refreshSeed]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleToggleInterest = async (interestId) => {
    let updated;
    if (selectedInterests.includes(interestId)) {
      if (selectedInterests.length === 1) return; // Keep at least one
      updated = selectedInterests.filter((i) => i !== interestId);
    } else {
      updated = [...selectedInterests, interestId];
    }
    setSelectedInterests(updated);

    if (isAuthenticated) {
      try {
        await recommendationService.saveUserPreferences({ interests: updated });
      } catch {}
    } else {
      localStorage.setItem('travelora_user_preferences', JSON.stringify(updated));
    }

    setRefreshSeed((prev) => prev + 1);
  };

  const handleFeedback = async (itemId, type) => {
    setFeedbackGiven((prev) => ({ ...prev, [itemId]: type }));
    try {
      await recommendationService.submitFeedback({
        itemId,
        itemType: 'destination',
        feedbackType: type,
      });
      if (type === 'not_interested') {
        setRecommendations((prev) => prev.filter((r) => r.id !== itemId));
      }
    } catch (err) {
      console.warn('Feedback submit error:', err.message);
    }
  };

  const handleRefresh = () => {
    setRefreshSeed((prev) => prev + 1);
  };

  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', padding: '3.5rem 0' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#0284c7' }}>
              ✨ {language === 'ta' ? 'உங்களுக்காக பிரத்தியேகமாக' : 'Tailored For You'}
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.25rem 0 0.4rem' }}>
              {language === 'ta' ? 'தனிப்பயனாக்கப்பட்ட பயணப் பரிந்துரைகள்' : 'Personalized Travel Recommendations'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
              {language === 'ta'
                ? 'உங்கள் விருப்பங்கள், இருப்பிடம், மற்றும் முந்தைய பயணங்கள் அடிப்படையில் உருவாக்கப்பட்டவை.'
                : 'Curated intelligently based on your saved favorites, location, budget, and travel interests.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.84rem',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              🔄 {language === 'ta' ? 'புதுப்பிக்கவும்' : 'Refresh'}
            </button>
            <Link
              to="/recommendations"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.84rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ✨ {language === 'ta' ? 'முழு AI திட்டம்' : 'Advanced AI Planner'}
            </Link>
          </div>
        </div>

        {/* Quick Interest Filter Chips (Feature 6 & 7) */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.6rem' }}>
            🏷️ {language === 'ta' ? 'உங்கள் ஆர்வங்கள் (தேர்ந்தெடுக்க தட்டவும்):' : 'Your Travel Interests (Tap to customize):'}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {AVAILABLE_INTERESTS.map((item) => {
              const isSelected = selectedInterests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleInterest(item.id)}
                  style={{
                    background: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: '1px solid ' + (isSelected ? '#0284c7' : '#cbd5e1'),
                    borderRadius: '9999px',
                    padding: '5px 12px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {isSelected && <span style={{ fontSize: '0.75rem', marginLeft: '2px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'bounce 1s infinite' }}>🤖</div>
            <p style={{ color: '#64748b', fontSize: '0.92rem', fontWeight: '600' }}>
              {language === 'ta' ? 'உங்களுக்கான பரிந்துரைகள் கணக்கிடப்படுகின்றன...' : 'Finding personalized recommendations for you...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff1f2', borderRadius: '16px', color: '#be123c' }}>
            <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* Recommendations Grid (Feature 10) */}
        {!loading && !error && recommendations.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {recommendations.map((item) => {
              const fav = isFavorite ? isFavorite(item.id, 'destination') : false;
              const feedback = feedbackGiven[item.id];

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Image Banner */}
                  <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.category}
                    </div>

                    {/* Match Score Badge (Feature 8) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      ✨ {item.matchPercentage || `${item.matchScore}%`} Match
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: '800', color: '#0f172a' }}>{item.name}</h3>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {item.city}, {item.country}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '800' }}>⭐ {item.rating || 4.7}</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>

                    {/* Proximity & Estimated Cost Badges (Feature 2 & 5) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                      {item.distanceKm && (
                        <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                          🚗 {item.distanceKm} km away
                        </span>
                      )}
                      <span style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                        💵 {item.estimatedDailyCost || item.estimatedTotalCost}
                      </span>
                    </div>

                    {/* Explainability Reasons List (Feature 9) */}
                    {item.matchReasons && item.matchReasons.length > 0 && (
                      <div style={{ background: '#f8fafc', borderLeft: '3px solid #0284c7', padding: '0.4rem 0.6rem', borderRadius: '0 6px 6px 0', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          ✨ {language === 'ta' ? 'பரிந்துரைக்கான காரணம்:' : 'Recommended because:'}
                        </span>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.74rem', color: '#475569' }}>
                          {item.matchReasons.slice(0, 2).map((reason, rIdx) => (
                            <li key={rIdx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback & Actions */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link
                          to={`/trip-planner?destination=${encodeURIComponent(item.name)}`}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#0284c7',
                            color: '#ffffff',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            textDecoration: 'none',
                          }}
                        >
                          🗺️ {language === 'ta' ? 'பயணம் திட்டமிடு' : 'Plan Trip'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => (fav ? removeFavorite(item.id, 'destination') : addFavorite({ id: item.id, item_id: item.id, item_type: 'destination', title: item.name, location: `${item.city}, ${item.country}`, category: item.category, image_url: item.image, price: item.costNumeric }))}
                          style={{
                            background: fav ? '#fff1f2' : '#f8fafc',
                            border: '1px solid ' + (fav ? '#fecdd3' : '#cbd5e1'),
                            color: fav ? '#e11d48' : '#64748b',
                            borderRadius: '8px',
                            padding: '0 10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                          title={fav ? 'Saved in Wishlist' : 'Save to Wishlist'}
                        >
                          {fav ? '❤️' : '🤍'}
                        </button>
                      </div>

                      {/* Lightweight Feedback Bar (Feature 15 & 16) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                        <span>{language === 'ta' ? 'பரிந்துரை பயனுள்ளதா?' : 'Is this useful?'}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, 'useful')}
                            style={{
                              background: feedback === 'useful' ? '#dcfce7' : 'none',
                              color: feedback === 'useful' ? '#166534' : '#64748b',
                              border: '1px solid ' + (feedback === 'useful' ? '#86efac' : 'transparent'),
                              borderRadius: '4px',
                              padding: '2px 5px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                            }}
                            title="Helpful recommendation"
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, 'not_relevant')}
                            style={{
                              background: feedback === 'not_relevant' ? '#fee2e2' : 'none',
                              color: feedback === 'not_relevant' ? '#991b1b' : '#64748b',
                              border: '1px solid ' + (feedback === 'not_relevant' ? '#fca5a5' : 'transparent'),
                              borderRadius: '4px',
                              padding: '2px 5px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                            }}
                            title="Not relevant to me"
                          >
                            👎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(item.id, 'not_interested')}
                            style={{
                              background: 'none',
                              color: '#94a3b8',
                              border: 'none',
                              padding: '2px 5px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                            }}
                            title="Don't show this again"
                          >
                            ✕ {language === 'ta' ? 'மறை' : 'Hide'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
