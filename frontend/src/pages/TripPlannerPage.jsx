import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import destinationService from '../services/destinationService';
import tripService from '../services/tripService';
import AiItineraryView from '../components/AiItineraryView';
import WeatherCard from '../components/WeatherCard';

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
  const { isAuthenticated, selectedTransport, selectedHotel, currentLocation, t } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    destinationId: searchParams.get('destinationId') || '1',
    destinationName: searchParams.get('destinationName') || searchParams.get('destination') || 'Taj Mahal & Royal Agra',
    numberOfDays: searchParams.get('duration') ? Number(searchParams.get('duration')) : 3,
    travelers: searchParams.get('travelers') ? Number(searchParams.get('travelers')) : 2,
    currency: 'INR',
    budget: searchParams.get('budget') ? Number(searchParams.get('budget')) : 12000,
    travelPreference: searchParams.get('preference') || 'nature',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    interests: ['nature', 'sightseeing', 'dining'],
    weatherAware: true,
    preferOutdoor: false,
    preferIndoor: false,
  });

  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load destinations from API
  useEffect(() => {
    async function loadDestinations() {
      setLoadingDestinations(true);
      try {
        const list = await destinationService.getDestinations();
        if (list && list.length > 0) {
          setDestinations(list);
          const paramDestId = searchParams.get('destinationId');
          const paramDestName = searchParams.get('destinationName') || searchParams.get('destination');

          if (paramDestId) {
            const matched = list.find((d) => String(d.id) === String(paramDestId));
            if (matched) {
              setFormData((prev) => ({
                ...prev,
                destinationId: String(matched.id),
                destinationName: matched.name,
              }));
              triggerPlanGeneration(matched.id, matched.name, formData.numberOfDays, formData.travelPreference, formData.budget, formData.currency);
              return;
            }
          } else if (paramDestName) {
            const matched = list.find((d) => d.name.toLowerCase().includes(paramDestName.toLowerCase()));
            if (matched) {
              setFormData((prev) => ({
                ...prev,
                destinationId: String(matched.id),
                destinationName: matched.name,
              }));
              triggerPlanGeneration(matched.id, matched.name, formData.numberOfDays, formData.travelPreference, formData.budget, formData.currency);
              return;
            }
          }

          // Default to first destination
          const first = list[0];
          setFormData((prev) => ({
            ...prev,
            destinationId: String(first.id),
            destinationName: first.name,
          }));
          triggerPlanGeneration(first.id, first.name, formData.numberOfDays, formData.travelPreference, formData.budget, formData.currency);
        } else {
          // Fallback trigger with current form data
          triggerPlanGeneration(formData.destinationId, formData.destinationName, formData.numberOfDays, formData.travelPreference, formData.budget, formData.currency);
        }
      } catch (err) {
        console.warn('Failed to load destinations:', err.message);
        triggerPlanGeneration(formData.destinationId, formData.destinationName, formData.numberOfDays, formData.travelPreference, formData.budget, formData.currency);
      } finally {
        setLoadingDestinations(false);
      }
    }
    loadDestinations();
  }, [searchParams]);

  const triggerPlanGeneration = async (destId, destName, days, pref, budgetVal, currVal) => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await tripService.generateAiItinerary({
        destination: destName || 'Taj Mahal & Royal Agra',
        destinationId: destId || 1,
        destinationName: destName || 'Taj Mahal & Royal Agra',
        numberOfDays: days || 3,
        travelers: formData.travelers || 2,
        budget: budgetVal || 12000,
        currency: currVal || 'INR',
        travelPreference: pref || 'nature',
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        currentLocation: currentLocation || null,
        startDate: formData.startDate,
        weatherAware: formData.weatherAware,
        preferOutdoor: formData.preferOutdoor,
        preferIndoor: formData.preferIndoor,
      });
      setGeneratedItinerary(result);
    } catch (err) {
      console.warn('AI Itinerary generation warning:', err.message);
      setError(err.response?.data?.message || err.message || 'Failed to generate smart itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const [isManualDestMode, setIsManualDestMode] = useState(false);

  const POPULAR_DEST_CHIPS = [
    'Ooty', 'Goa', 'Kodaikanal', 'Kerala', 'Manali', 'Paris', 'Swiss Alps', 'Bali', 'Dubai', 'London', 'Tokyo', 'Taj Mahal & Agra'
  ];

  const handleDestinationChange = (e) => {
    const destId = e.target.value;
    const destObj = destinations.find((d) => String(d.id) === String(destId));
    setFormData((prev) => ({
      ...prev,
      destinationId: destId,
      destinationName: destObj ? destObj.name : 'Custom Destination',
    }));
  };

  const handleManualDestinationChange = (e) => {
    const customName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      destinationId: 'custom',
      destinationName: customName,
    }));
  };

  const handleSelectChip = (name) => {
    const matched = destinations.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
    setFormData((prev) => ({
      ...prev,
      destinationId: matched ? String(matched.id) : 'custom',
      destinationName: name,
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
        weatherAware: formData.weatherAware,
        preferOutdoor: formData.preferOutdoor,
        preferIndoor: formData.preferIndoor,
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
        destinationId: parseInt(formData.destinationId, 10) || 1,
        title: `${formData.destinationName} (${formData.numberOfDays} Days AI Plan)`,
        tripType: formData.travelPreference,
        startDate: formData.startDate,
        endDate: end.toISOString().split('T')[0],
        totalBudget: formData.budget,
        travelers: formData.travelers,
        notes: `AI-generated ${formData.travelPreference} itinerary for ${formData.travelers} traveler(s). Selected Transport: ${selectedTransport?.title || 'Standard transit'}. Selected Stay: ${selectedHotel?.name || 'Standard accommodation'}.`,
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

  const handleProceedToBooking = () => {
    if (generatedItinerary) {
      localStorage.setItem('travel_active_booking_trip', JSON.stringify({
        destinationId: formData.destinationId || 1,
        destinationName: formData.destinationName,
        numberOfDays: formData.numberOfDays,
        travelers: formData.travelers,
        budget: formData.budget,
        currency: formData.currency,
        travelPreference: formData.travelPreference,
        startDate: formData.startDate,
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        itinerary: generatedItinerary,
      }));
    }
    navigate(`/booking?customTrip=true&destinationId=${formData.destinationId || 1}&travelers=${formData.travelers}&date=${formData.startDate}`);
  };

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Header Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 50%, #FFB8E0 100%)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            color: '#ffffff',
            marginBottom: '2.5rem',
            boxShadow: '0 12px 30px rgba(190, 89, 133, 0.25)',
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <span style={{ background: '#ffffff', color: '#BE5985', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              ✨ AI-Powered Trip Planner
            </span>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#ffffff', margin: '0.85rem 0 0.5rem 0', lineHeight: 1.2 }}>
              Smart Travel Planner & Custom Itineraries
            </h1>
            <p style={{ color: '#FFEDFA', fontSize: '1.05rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              Generate an intelligent day-wise itinerary with time-slotted visits, authentic culinary suggestions, geographic route clustering, and budget optimization.
            </p>
          </div>
        </div>

        {/* Selected Transport Reminder Tag */}
        {selectedTransport && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #F3D2E5',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              boxShadow: '0 4px 14px rgba(190, 89, 133, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{selectedTransport.icon || '🚆'}</span>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#BE5985' }}>
                  Confirmed Transport
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#BE5985' }}>
                  {selectedTransport.title} • {selectedTransport.cost_text || `₹${selectedTransport.estimated_cost}`}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#7A5366' }}>
                  Estimated Travel Time: {selectedTransport.duration_text} ({selectedTransport.distance_text})
                </p>
              </div>
            </div>
            <Link to="/destinations" className="btn btn-outline btn-sm" style={{ background: 'white' }}>
              Change Transport
            </Link>
          </div>
        )}

        {/* Selected Hotel Reminder Tag */}
        {selectedHotel && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #F3D2E5',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              boxShadow: '0 4px 14px rgba(190, 89, 133, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🏨</span>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#BE5985' }}>
                  Confirmed Stay
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#BE5985' }}>
                  {selectedHotel.name} • {selectedHotel.price_display || `₹${selectedHotel.approx_price_per_night}/night`}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#7A5366' }}>
                  📍 {selectedHotel.distance_label || 'Near destination'} • {selectedHotel.type_label || 'Hotel'}
                </p>
              </div>
            </div>
            <Link
              to={`/destinations/${formData.destinationId || 1}`}
              className="btn btn-outline btn-sm"
              style={{ background: 'white', color: '#BE5985', borderColor: '#F3D2E5' }}
            >
              Change Stay
            </Link>
          </div>
        )}

        {/* Live Weather Forecast Strip */}
        <WeatherCard
          destination={formData.destinationName}
          allowCurrentLocation={true}
          showForecastToggle={true}
        />

        {/* Interactive Configuration Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #F3D2E5',
            padding: '2.5rem',
            boxShadow: '0 12px 30px -5px rgba(190, 89, 133, 0.1)',
            marginBottom: '2.5rem',
          }}
        >
          <form onSubmit={handleGenerateItinerary}>
            {/* Row 1: Destination & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#BE5985', margin: 0 }}>
                    1. Target Destination
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualDestMode(!isManualDestMode)}
                    style={{
                      background: isManualDestMode ? '#FFB8E0' : '#FFEDFA',
                      color: '#BE5985',
                      border: '1px solid #FFB8E0',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isManualDestMode ? '📋 Select from List' : '✍️ Type / Edit Manually'}
                  </button>
                </div>

                {isManualDestMode ? (
                  <div>
                    <input
                      type="text"
                      value={formData.destinationName}
                      onChange={handleManualDestinationChange}
                      placeholder="Type any custom destination (e.g. Kodaikanal, Dubai, London)..."
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px solid #EC7FA9',
                        fontSize: '1rem',
                        fontWeight: '600',
                        background: '#ffffff',
                        outline: 'none',
                        boxShadow: '0 0 0 3px rgba(236, 127, 169, 0.2)',
                      }}
                    />
                    {/* Quick City Presets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
                      {POPULAR_DEST_CHIPS.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSelectChip(chip)}
                          style={{
                            background: formData.destinationName.toLowerCase().includes(chip.toLowerCase()) ? '#EC7FA9' : '#FFEDFA',
                            color: formData.destinationName.toLowerCase().includes(chip.toLowerCase()) ? '#ffffff' : '#BE5985',
                            border: '1px solid ' + (formData.destinationName.toLowerCase().includes(chip.toLowerCase()) ? '#BE5985' : '#FFB8E0'),
                            borderRadius: '9999px',
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.destinationId}
                    onChange={handleDestinationChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #F3D2E5',
                      fontSize: '1rem',
                      fontWeight: '600',
                      background: '#ffffff',
                      color: '#2D1520',
                      outline: 'none',
                    }}
                  >
                    {destinations && destinations.length > 0 ? (
                      destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.country ? `(${d.country})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">Taj Mahal & Royal Agra (India)</option>
                        <option value="2">Ooty Nilgiri Hill Station (India)</option>
                        <option value="3">Swiss Alpine Wonders (Switzerland)</option>
                        <option value="4">Parisian Elegance & Romance (France)</option>
                        <option value="5">Bali Paradise Island (Indonesia)</option>
                        <option value="6">Tokyo & Kyoto Highlights (Japan)</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#BE5985' }}>
                    2. Trip Duration
                  </label>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#BE5985' }}>
                    {formData.numberOfDays} {formData.numberOfDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numberOfDays: Number(e.target.value) }))}
                  style={{ width: '100%', height: '8px', accentColor: '#EC7FA9', cursor: 'pointer', marginTop: '0.75rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#7A5366', marginTop: '0.4rem', fontWeight: '600' }}>
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
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#BE5985' }}>
                    3. Target Budget
                  </label>
                  {/* Currency Switcher */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('INR')}
                      style={{
                        padding: '3px 9px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        borderRadius: '9999px',
                        border: '1px solid ' + (formData.currency === 'INR' ? '#BE5985' : '#F3D2E5'),
                        background: formData.currency === 'INR' ? '#EC7FA9' : '#FFF5FB',
                        color: formData.currency === 'INR' ? '#ffffff' : '#BE5985',
                        cursor: 'pointer',
                      }}
                    >
                      INR (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencySwitch('USD')}
                      style={{
                        padding: '3px 9px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        borderRadius: '9999px',
                        border: '1px solid ' + (formData.currency === 'USD' ? '#BE5985' : '#F3D2E5'),
                        background: formData.currency === 'USD' ? '#EC7FA9' : '#FFF5FB',
                        color: formData.currency === 'USD' ? '#ffffff' : '#BE5985',
                        cursor: 'pointer',
                      }}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={formData.budget}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F3D2E5',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#2D1520',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.5rem' }}>
                  4. Number of Travelers
                </label>
                <select
                  value={formData.travelers}
                  onChange={(e) => setFormData((prev) => ({ ...prev, travelers: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F3D2E5',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#2D1520',
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
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.5rem' }}>
                  5. Departure Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F3D2E5',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#2D1520',
                  }}
                />
              </div>
            </div>

            {/* Row 3: Travel Preferences */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.75rem' }}>
                6. Travel Style & Vibe
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'nature', label: '🌿 Nature' },
                  { id: 'historical', label: '🏛️ Heritage' },
                  { id: 'adventure', label: '🧗 Adventure' },
                  { id: 'beach', label: '🏖️ Beach' },
                  { id: 'family', label: '👨‍👩‍👧 Family' },
                  { id: 'relaxed', label: '🧘 Relaxed' },
                ].map((pref) => {
                  const isSelected = formData.travelPreference === pref.id;
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, travelPreference: pref.id }))}
                      style={{
                        border: isSelected ? '2px solid #EC7FA9' : '1px solid #F3D2E5',
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        background: isSelected ? '#FFEDFA' : '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        color: isSelected ? '#BE5985' : '#2D1520',
                        boxShadow: isSelected ? '0 4px 12px rgba(236, 127, 169, 0.25)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F3D2E5', paddingTop: '1.5rem' }}>
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

        {/* AI Itinerary View Component */}
        <AiItineraryView
          itinerary={generatedItinerary}
          isGenerating={isGenerating}
          isSaving={isSaving}
          onRegenerate={handleGenerateItinerary}
          onSave={handleSaveTrip}
          onProceedToBooking={handleProceedToBooking}
          error={error}
        />
      </div>
    </section>
  );
}
