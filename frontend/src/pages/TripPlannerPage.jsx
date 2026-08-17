import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import tripService from '../services/tripService';
import ItineraryTimeline from '../components/ItineraryTimeline';

const TRAVEL_TYPES = [
  { id: 'family', label: 'Family Vacation', icon: '👨‍👩‍👧‍👦', sub: 'Kid-friendly, safe & relaxed' },
  { id: 'couple', label: 'Romantic Couple', icon: '💑', sub: 'Scenic views & candlelit dining' },
  { id: 'solo', label: 'Solo Explorer', icon: '🎒', sub: 'Walkable, social & authentic' },
  { id: 'friends', label: 'Friends Group', icon: '👥', sub: 'Group activities, sports & fun' },
  { id: 'luxury', label: 'Luxury Elite', icon: '👑', sub: '5-star resorts & VIP transfers' },
];

const INTEREST_OPTIONS = [
  { id: 'beach', label: '🏖️ Beach & Coastal', key: 'beach' },
  { id: 'sightseeing', label: '🏛️ Historic Sightseeing', key: 'sightseeing' },
  { id: 'culture', label: '🎭 Culture & Heritage', key: 'culture' },
  { id: 'adventure', label: '🧗 Adventure & Trekking', key: 'adventure' },
  { id: 'wildlife', label: '🦁 Wildlife Safari', key: 'wildlife' },
  { id: 'dining', label: '🍽️ Food & Gastronomy', key: 'dining' },
  { id: 'wellness', label: '🧘 Wellness & Spa', key: 'wellness' },
  { id: 'nature', label: '🌿 Nature & Scenic Lakes', key: 'nature' },
];

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    destinationId: searchParams.get('destinationId') || '101',
    destinationName: 'Goa Coastal Haven',
    numberOfDays: searchParams.get('duration') ? Number(searchParams.get('duration')) : 4,
    currency: 'INR',
    budget: 20000,
    travelType: 'family',
    interests: ['beach', 'dining', 'sightseeing'],
    startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load active destinations
  useEffect(() => {
    async function loadDestinations() {
      try {
        const list = await destinationService.getDestinations();
        setDestinations(list || []);
        
        const paramDestId = searchParams.get('destinationId');
        if (paramDestId && list) {
          const matched = list.find((d) => String(d.id) === String(paramDestId));
          if (matched) {
            setFormData((prev) => ({
              ...prev,
              destinationId: matched.id,
              destinationName: matched.name,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to load destinations:', err.message);
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadDestinations();
  }, [searchParams]);

  // Generate initial itinerary on load
  useEffect(() => {
    handleGenerateItinerary();
  }, []);

  const handleCurrencySwitch = (newCurr) => {
    if (newCurr === formData.currency) return;
    if (newCurr === 'USD' && formData.currency === 'INR') {
      setFormData((prev) => ({
        ...prev,
        currency: 'USD',
        budget: Math.round(prev.budget / 85),
      }));
    } else if (newCurr === 'INR' && formData.currency === 'USD') {
      setFormData((prev) => ({
        ...prev,
        currency: 'INR',
        budget: Math.round(prev.budget * 85),
      }));
    }
  };

  const handleInterestToggle = (interestId) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interestId);
      const updated = exists
        ? prev.interests.filter((i) => i !== interestId)
        : [...prev.interests, interestId];
      return { ...prev, interests: updated.length > 0 ? updated : ['beach'] };
    });
  };

  const handleDestinationChange = (e) => {
    const destId = e.target.value;
    const destObj = destinations.find((d) => String(d.id) === String(destId));
    setFormData((prev) => ({
      ...prev,
      destinationId: destId,
      destinationName: destObj ? destObj.name : 'Custom Destination',
    }));
  };

  const handleGenerateItinerary = async (e) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setError('');
    setSaveSuccess(false);

    try {
      const result = await tripService.generateAiItinerary({
        destination: formData.destinationName,
        destinationId: formData.destinationId,
        destinationName: formData.destinationName,
        numberOfDays: formData.numberOfDays,
        budget: formData.budget,
        currency: formData.currency,
        travelType: formData.travelType,
        interests: formData.interests,
        startDate: formData.startDate,
      });

      setGeneratedItinerary(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate smart itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/trip-planner');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (formData.numberOfDays - 1));

      await tripService.createTrip({
        destinationId: formData.destinationId || 1,
        title: `${formData.destinationName} (${formData.numberOfDays} Days)`,
        tripType: formData.travelType,
        startDate: formData.startDate,
        endDate: end.toISOString().split('T')[0],
        totalBudget: formData.budget,
        travelers: 2,
        notes: `Personalized AI itinerary for ${formData.travelType} travel with interests: ${formData.interests.join(', ')}`,
        itineraryItems: generatedItinerary?.itineraryItems || [],
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/my-trips');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save itinerary');
    } finally {
      setIsSaving(false);
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
          }}
        >
          <div style={{ maxWidth: '750px' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ AI Smart Itinerary Generator
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.75rem 0 0.5rem 0', lineHeight: 1.2 }}>
              Day-by-Day Intelligent Travel Itinerary
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
              Specify your destination, duration, budget, and travel style. Our AI synthesizes visitable places, time-slotted activities, and authentic culinary suggestions (Breakfast, Lunch, Dinner).
            </p>
          </div>
        </div>

        {/* Interactive Configuration Card */}
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
          <form onSubmit={handleGenerateItinerary}>
            {/* 1. Destination & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                  1. Target Destination
                </label>
                <select
                  value={formData.destinationId}
                  onChange={handleDestinationChange}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                  }}
                >
                  <option value="101">Goa Coastal Haven (India)</option>
                  <option value="102">Kerala Backwaters & Beaches (India)</option>
                  <option value="103">Andaman Marine & Coral Islands (India)</option>
                  <option value="1">Bali Paradise Island (Indonesia)</option>
                  <option value="4">Parisian Elegance & Romance (France)</option>
                  <option value="3">Swiss Alpine Wonders (Switzerland)</option>
                  <option value="2">Kyoto & Tokyo Highlights (Japan)</option>
                  <option value="5">Santorini Sunsets (Greece)</option>
                  <option value="6">Serengeti Wildlife Safari (Tanzania)</option>
                  <option value="104">Manali & Solang Alpine Retreat (India)</option>
                  <option value="105">Jaipur Royal Heritage (India)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    2. Trip Duration
                  </label>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
                    {formData.numberOfDays} {formData.numberOfDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numberOfDays: Number(e.target.value) }))}
                  style={{ width: '100%', height: '8px', accentColor: '#0284c7', cursor: 'pointer', marginTop: '0.75rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  <span>Quick Getaway (1-3)</span>
                  <span>1 Week (7)</span>
                  <span>Grand Tour (14)</span>
                </div>
              </div>
            </div>

            {/* 2. Budget & Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    3. Total Budget Allowance
                  </label>
                  {/* Currency Switcher */}
                  <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('INR')}
                      style={{
                        border: 'none',
                        background: formData.currency === 'INR' ? '#ffffff' : 'transparent',
                        color: formData.currency === 'INR' ? '#0f172a' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: formData.currency === 'INR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      INR (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('USD')}
                      style={{
                        border: 'none',
                        background: formData.currency === 'USD' ? '#ffffff' : 'transparent',
                        color: formData.currency === 'USD' ? '#0f172a' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: formData.currency === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>
                    {formData.currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget: Math.max(100, Number(e.target.value)) }))}
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

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(formData.currency === 'INR' ? [15000, 20000, 35000, 60000] : [300, 600, 1500, 3000]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, budget: val }))}
                      style={{
                        border: '1px solid #e2e8f0',
                        background: formData.budget === val ? '#0284c7' : '#f8fafc',
                        color: formData.budget === val ? '#ffffff' : '#475569',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {formData.currency === 'INR' ? `₹${val.toLocaleString()}` : `$${val.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                  4. Departure Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* 3. Interests & Travel Types */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                5. Travel Interests (Select all that apply)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {INTEREST_OPTIONS.map((item) => {
                  const isSelected = formData.interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInterestToggle(item.id)}
                      style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: '9999px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: isSelected ? '#e0f2fe' : '#ffffff',
                        color: isSelected ? '#0369a1' : '#475569',
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Travel Style Cards */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                6. Travel Style & Companions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                {TRAVEL_TYPES.map((type) => {
                  const isSelected = formData.travelType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setFormData((prev) => ({ ...prev, travelType: type.id }))}
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

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>{isGenerating ? '⚡ Generating Schedule...' : '✨ Generate AI Smart Itinerary'}</span>
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

        {/* Save Success Alert */}
        {saveSuccess && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✅</span>
            <span><strong>Trip Saved Successfully!</strong> Redirecting to your trips dashboard...</span>
          </div>
        )}

        {/* Results Section */}
        {generatedItinerary && (
          <div>
            {/* AI Workflow Explainer Box */}
            {generatedItinerary.aiWorkflow && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧠</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0369a1', margin: 0 }}>
                    AI Generation Workflow & Logic
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#334155' }}>
                  <div>
                    <strong>1. Vibe Profiling:</strong> {generatedItinerary.aiWorkflow.step1_profiling}
                  </div>
                  <div>
                    <strong>2. Budget Pacing:</strong> {generatedItinerary.aiWorkflow.step2_budgetPacing}
                  </div>
                  <div>
                    <strong>3. Geographic Clustering:</strong> {generatedItinerary.aiWorkflow.step3_geographicClustering}
                  </div>
                  <div>
                    <strong>4. Culinary Matchmaking:</strong> {generatedItinerary.aiWorkflow.step4_culinaryCuration}
                  </div>
                </div>
              </div>
            )}

            {/* Generated Header & Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
                background: '#ffffff',
                padding: '1.25rem 1.75rem',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  {generatedItinerary.destination} — {generatedItinerary.totalDays} Days Schedule
                </h2>
                <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                  Total Budget: {formData.currency === 'INR' ? `₹${formData.budget.toLocaleString()}` : `$${formData.budget.toLocaleString()}`} • {formData.travelType.toUpperCase()} Style
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: '700' }}
                >
                  🖨️ Print Schedule
                </button>
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>💾</span>
                  <span>{isSaving ? 'Saving...' : 'Save Itinerary to My Trips'}</span>
                </button>
              </div>
            </div>

            {/* Day-by-Day Timeline Render */}
            <ItineraryTimeline days={generatedItinerary.days} />
          </div>
        )}
      </div>
    </section>
  );
}
