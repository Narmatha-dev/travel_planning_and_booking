import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import tripService from '../services/tripService';
import ItineraryTimeline from '../components/ItineraryTimeline';

const TRIP_TYPES = [
  { id: 'solo', label: 'Solo Traveler', icon: '🎒' },
  { id: 'couple', label: 'Romantic Couple', icon: '💑' },
  { id: 'family', label: 'Family Vacation', icon: '👨‍👩‍👧‍👦' },
  { id: 'friends', label: 'Friends Group', icon: '🎉' },
  { id: 'business', label: 'Business & Bleisure', icon: '💼' },
];

const INTEREST_OPTIONS = [
  { id: 'sightseeing', label: '🏛️ Sightseeing & Landmarks' },
  { id: 'beaches', label: '🏝️ Beaches & Islands' },
  { id: 'culture', label: '🎭 Culture & History' },
  { id: 'adventure', label: '🦁 Adventure & Safari' },
  { id: 'dining', label: '🍽️ Food & Nightlife' },
  { id: 'leisure', label: '🌿 Wellness & Relaxation' },
];

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    destinationId: searchParams.get('destinationId') || '',
    title: '',
    startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    travelers: 2,
    budget: 2000,
    tripType: 'couple',
    interests: ['sightseeing', 'dining', 'culture'],
    notes: '',
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
        if (!formData.destinationId && list && list.length > 0) {
          setFormData((prev) => ({ ...prev, destinationId: list[0].id }));
        }
      } catch (err) {
        console.warn('Failed to load destinations:', err.message);
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadDestinations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleInterestToggle = (interestId) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interestId);
      const updated = exists
        ? prev.interests.filter((i) => i !== interestId)
        : [...prev.interests, interestId];
      return { ...prev, interests: updated.length > 0 ? updated : ['sightseeing'] };
    });
  };

  const handleGeneratePreview = async (e) => {
    if (e) e.preventDefault();
    if (!formData.destinationId) {
      setError('Please select a destination');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSaveSuccess(false);

    try {
      const preview = await tripService.generatePreview({
        destinationId: parseInt(formData.destinationId, 10),
        startDate: formData.startDate,
        endDate: formData.endDate,
        travelers: parseInt(formData.travelers, 10),
        budget: parseFloat(formData.budget),
        tripType: formData.tripType,
        interests: formData.interests,
      });

      setGeneratedItinerary(preview);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/trip-planner' } } });
      return;
    }

    if (!generatedItinerary) return;

    setIsSaving(true);
    setError('');

    try {
      const selectedDest = destinations.find((d) => d.id === parseInt(formData.destinationId, 10));
      const tripTitle = formData.title.trim() || `${selectedDest?.name || 'Vacation'} Escape`;

      await tripService.createTrip({
        destinationId: parseInt(formData.destinationId, 10),
        title: tripTitle,
        tripType: formData.tripType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: parseFloat(formData.budget),
        estimatedCost: generatedItinerary.estimated_cost,
        status: 'planned',
        notes: formData.notes,
        itineraryItems: generatedItinerary.itinerary_items,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/my-trips');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save trip');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Heading */}
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="eyebrow">Smart Travel Architect</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0' }}>
            Plan Your Custom Day-by-Day Itinerary
          </h1>
          <p style={{ color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
            Select your destination, dates, budget, and travel preferences to automatically generate a personalized day-wise schedule.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            border: '1px solid #f87171',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {saveSuccess && (
          <div style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ✔ Trip & Itinerary saved successfully! Redirecting to My Trips...
          </div>
        )}

        {/* Wizard Layout: Left Preferences Form, Right Itinerary Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* Trip Configuration Box */}
          <div style={{
            background: '#ffffff',
            padding: '1.75rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              ⚙️ Trip Preferences
            </h3>

            <form onSubmit={handleGeneratePreview} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Destination Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Destination *
                </label>
                <select
                  name="destinationId"
                  value={formData.destinationId}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem' }}
                >
                  {loadingDestinations ? (
                    <option>Loading destinations...</option>
                  ) : (
                    destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.city}, {d.country})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Trip Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Trip Name (Optional)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Bali Summer Adventure"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {/* Travel Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Travelers & Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Travelers
                  </label>
                  <select
                    name="travelers"
                    value={formData.travelers}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="1">1 Traveler</option>
                    <option value="2">2 Travelers</option>
                    <option value="3">3 Travelers</option>
                    <option value="4">4 Travelers</option>
                    <option value="5">5+ Travelers</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="200"
                    step="100"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Travel Type Cards */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Travel Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {TRIP_TYPES.map((type) => {
                    const isSelected = formData.tripType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, tripType: type.id })}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          color: isSelected ? '#0284c7' : '#475569',
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel Interests */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Travel Interests & Activities
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {INTEREST_OPTIONS.map((interest) => {
                    const isSelected = formData.interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => handleInterestToggle(interest.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#0284c7' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? '600' : '400',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                className="btn btn-primary full-width"
                disabled={isGenerating}
                style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {isGenerating ? '✨ Generating Itinerary...' : '✨ Generate Day-Wise Itinerary'}
              </button>
            </form>
          </div>

          {/* Generated Day-Wise Itinerary Display */}
          <div>
            {generatedItinerary ? (
              <div>
                {/* Summary Header */}
                <div style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                      {generatedItinerary.total_days} Days Customized Schedule
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
                      {generatedItinerary.destination_name} Itinerary
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                      📅 {generatedItinerary.start_date} to {generatedItinerary.end_date} • 👥 {generatedItinerary.travelers} Traveler(s)
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Est. Total Cost</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7' }}>
                        ${generatedItinerary.estimated_cost}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveTrip}
                      disabled={isSaving}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                    >
                      {isSaving ? '💾 Saving Trip...' : '💾 Save Trip to My Trips'}
                    </button>
                  </div>
                </div>

                {/* Itinerary Timeline */}
                <ItineraryTimeline days={generatedItinerary.days} />
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '2px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '5rem 2rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🗺️</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                  No Itinerary Generated Yet
                </h3>
                <p style={{ color: '#64748b', maxWidth: '450px', margin: '0.5rem auto 1.5rem auto', lineHeight: '1.5' }}>
                  Choose your destination, dates, budget, and travel interests on the left, then click <strong>Generate Day-Wise Itinerary</strong> to create a smart timeline!
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="btn btn-primary"
                >
                  ✨ Generate Sample Itinerary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
