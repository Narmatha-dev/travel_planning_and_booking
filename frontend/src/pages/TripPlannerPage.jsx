import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import tripService from '../services/tripService';
import AiItineraryView from '../components/AiItineraryView';
import ItineraryTimeline from '../components/ItineraryTimeline';

const PREFERENCE_OPTIONS = [
  { id: 'nature', label: '🌿 Nature', sub: 'Parks, viewpoints & waterfalls' },
  { id: 'historical', label: '🏛️ Historical', sub: 'UNESCO heritage & temples' },
  { id: 'adventure', label: '🧗 Adventure', sub: 'Treks, safaris & watersports' },
  { id: 'beach', label: '🏖️ Beach', sub: 'Coastline, shacks & sunset strolls' },
  { id: 'family', label: '👨‍👩‍👧‍👦 Family', sub: 'Kid-friendly, safe & relaxed' },
  { id: 'comfort', label: '👑 Comfort', sub: 'Resorts & convenient travel' },
  { id: 'budget', label: '💰 Budget', sub: 'Economical stays & free sights' },
  { id: 'relaxed', label: '🧘 Relaxed', sub: 'Scenic strolls & cozy cafes' },
];

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, selectedTransport, selectedHotel, currentLocation } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    destinationId: searchParams.get('destinationId') || '101',
    destinationName: searchParams.get('destinationName') || searchParams.get('destination') || 'Mahabalipuram',
    numberOfDays: searchParams.get('duration') ? Number(searchParams.get('duration')) : 3,
    travelers: searchParams.get('travelers') ? Number(searchParams.get('travelers')) : 2,
    currency: 'INR',
    budget: searchParams.get('budget') ? Number(searchParams.get('budget')) : 10000,
    travelPreference: searchParams.get('preference') || 'nature',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
        travelers: formData.travelers,
        budget: formData.budget,
        currency: formData.currency,
        travelPreference: formData.travelPreference,
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        currentLocation: currentLocation || null,
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
        title: `${formData.destinationName} (${formData.numberOfDays} Days AI Plan)`,
        tripType: formData.travelPreference,
        startDate: formData.startDate,
        endDate: end.toISOString().split('T')[0],
        totalBudget: formData.budget,
        travelers: formData.travelers,
        notes: `AI-generated ${formData.travelPreference} itinerary for ${formData.travelers} traveler(s). Selected Transport: ${selectedTransport?.title || 'Standard transit'}. Selected Stay: ${selectedHotel?.name || 'Standard accommodation'} (${selectedHotel?.price_display || 'Standard tariff'}).`,
        itineraryItems: generatedItinerary?.itineraryItems || [],
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/my-trips');
      }, 1200);
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
            marginBottom: '2.5rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ Phase 6 • AI-Powered Travel Intelligence
            </span>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', margin: '0.75rem 0 0.5rem 0', lineHeight: 1.2 }}>
              AI Trip Planner & Smart Recommendations
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
              Generate an intelligent day-wise itinerary with time-slotted visits, authentic culinary suggestions, geographic route clustering, and budget optimization.
            </p>
          </div>
        </div>

        {/* Selected Transport Reminder Tag from Phase 4 */}
        {selectedTransport && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{selectedTransport.icon || '🚆'}</span>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#16a34a' }}>
                  Confirmed Transport (Phase 4)
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#14532d' }}>
                  {selectedTransport.title} • {selectedTransport.cost_text || `₹${selectedTransport.estimated_cost}`}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>
                  Estimated Travel Time: {selectedTransport.duration_text} ({selectedTransport.distance_text})
                </p>
              </div>
            </div>
            <Link to="/destinations" className="btn btn-outline btn-sm" style={{ background: 'white' }}>
              Change Transport
            </Link>
          </div>
        )}

        {/* Selected Hotel Reminder Tag from Phase 7 */}
        {selectedHotel && (
          <div
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #7dd3fc',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🏨</span>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#0284c7' }}>
                  Confirmed Stay (Phase 7)
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0369a1' }}>
                  {selectedHotel.name} • {selectedHotel.price_display || `₹${selectedHotel.approx_price_per_night}/night`}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#075985' }}>
                  📍 {selectedHotel.distance_label || 'Near destination'} • {selectedHotel.type_label || 'Hotel'}
                </p>
              </div>
            </div>
            <Link
              to={`/destinations/${formData.destinationId || 1}`}
              className="btn btn-outline btn-sm"
              style={{ background: 'white', color: '#0284c7', borderColor: '#7dd3fc' }}
            >
              Change Stay
            </Link>
          </div>
        )}

        {/* Interactive Configuration Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: '2.5rem',
          }}
        >
          <form onSubmit={handleGenerateItinerary}>
            {/* Row 1: Destination & Duration */}
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
                  <option value="101">Mahabalipuram Shore Temples (Tamil Nadu)</option>
                  <option value="102">Ooty Nilgiri Hill Station (Tamil Nadu)</option>
                  <option value="103">Chennai Coastal & Heritage (Tamil Nadu)</option>
                  <option value="104">Kanyakumari Cape Comorin (Tamil Nadu)</option>
                  <option value="105">Goa Coastal Haven (India)</option>
                  <option value="106">Kerala Backwaters & Munnar (India)</option>
                  <option value="4">Parisian Elegance & Romance (France)</option>
                  <option value="3">Swiss Alpine Wonders (Switzerland)</option>
                  <option value="1">Bali Paradise Island (Indonesia)</option>
                  <option value="2">Tokyo & Kyoto Highlights (Japan)</option>
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

            {/* Row 2: Budget, Currency & Travelers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    3. Total Budget
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
                      }}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                  {(formData.currency === 'INR' ? [8000, 15000, 25000, 50000] : [200, 500, 1200, 2500]).map((val) => (
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
                  4. Number of Travelers
                </label>
                <select
                  value={formData.travelers}
                  onChange={(e) => setFormData((prev) => ({ ...prev, travelers: Number(e.target.value) }))}
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
                  <option value="1">1 Solo Traveler</option>
                  <option value="2">2 Travelers (Couple / Friends)</option>
                  <option value="3">3 Travelers (Small Group)</option>
                  <option value="4">4 Travelers (Family Group)</option>
                  <option value="5">5+ Travelers</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                  5. Departure Start Date
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

            {/* Row 3: Travel Preferences */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                6. Travel Style & Preference
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                {PREFERENCE_OPTIONS.map((pref) => {
                  const isSelected = formData.travelPreference === pref.id;
                  return (
                    <div
                      key={pref.id}
                      onClick={() => setFormData((prev) => ({ ...prev, travelPreference: pref.id }))}
                      style={{
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>{pref.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{pref.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>🤖 {isGenerating ? 'AI is Planning Your Trip...' : 'Generate AI Trip Plan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Save Success Alert */}
        {saveSuccess && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '1.25rem', borderRadius: '14px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>AI Trip Saved Successfully!</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>Redirecting to your My Trips dashboard...</p>
            </div>
          </div>
        )}

        {/* AI Itinerary View Component (Phase 6) */}
        <AiItineraryView
          itinerary={generatedItinerary}
          isGenerating={isGenerating}
          isSaving={isSaving}
          onRegenerate={handleGenerateItinerary}
          onSave={handleSaveTrip}
          error={error}
        />
      </div>
    </section>
  );
}
