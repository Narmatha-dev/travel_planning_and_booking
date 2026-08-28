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

  // Extract all query params passed from Home page or Destination cards (if any)
  const paramDestName = searchParams.get('destinationName') || searchParams.get('destination') || searchParams.get('place') || '';
  const paramDestId = searchParams.get('destinationId') || '';
  const paramDays = Number(searchParams.get('days') || searchParams.get('duration') || searchParams.get('numberOfDays') || 0);
  const paramTravelers = Number(searchParams.get('travelers') || searchParams.get('members') || 0);
  const paramDate = searchParams.get('startDate') || searchParams.get('date') || '';
  const paramBudget = Number(searchParams.get('budget') || 0);
  const paramPref = searchParams.get('preference') || '';

  // Form State initialized strictly with user's provided values (blank by default)
  const [formData, setFormData] = useState({
    destinationId: paramDestId || '',
    destinationName: paramDestName || '',
    numberOfDays: paramDays > 0 ? paramDays : '',
    travelers: paramTravelers > 0 ? paramTravelers : '',
    currency: 'INR',
    budget: paramBudget > 0 ? paramBudget : '',
    travelPreference: paramPref || 'nature',
    startDate: paramDate || '',
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

  // Load destinations list without auto-generating any itinerary
  useEffect(() => {
    async function loadDestinations() {
      setLoadingDestinations(true);
      try {
        const list = await destinationService.getDestinations();
        if (list && list.length > 0) {
          setDestinations(list);

          let targetDestName = paramDestName || '';
          let targetDestId = paramDestId || '';

          if (paramDestId) {
            const matched = list.find((d) => String(d.id) === String(paramDestId));
            if (matched) {
              targetDestName = matched.name;
              targetDestId = String(matched.id);
            }
          } else if (paramDestName) {
            const matched = list.find((d) => d.name.toLowerCase().includes(paramDestName.toLowerCase()));
            if (matched) {
              targetDestName = matched.name;
              targetDestId = String(matched.id);
            }
          }

          // If params exist in URL, populate form inputs only (NEVER auto-generate itinerary)
          if (targetDestName || targetDestId) {
            setFormData((prev) => ({
              ...prev,
              destinationId: targetDestId,
              destinationName: targetDestName,
              numberOfDays: paramDays > 0 ? paramDays : prev.numberOfDays,
              travelers: paramTravelers > 0 ? paramTravelers : prev.travelers,
              budget: paramBudget > 0 ? paramBudget : prev.budget,
              startDate: paramDate || prev.startDate,
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

  const triggerPlanGeneration = async (destId, destName, days, travelerCount, sDate, pref, budgetVal, currVal) => {
    if (!destName && !destId) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await tripService.generateAiItinerary({
        destination: destName || formData.destinationName,
        destinationId: destId || formData.destinationId,
        destinationName: destName || formData.destinationName,
        numberOfDays: Number(days) || Number(formData.numberOfDays) || 3,
        travelers: Number(travelerCount) || Number(formData.travelers) || 2,
        budget: Number(budgetVal) || Number(formData.budget) || 15000,
        currency: currVal || formData.currency || 'INR',
        travelPreference: pref || formData.travelPreference || 'nature',
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        currentLocation: currentLocation || null,
        startDate: sDate || formData.startDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
  const [plannerMode, setPlannerMode] = useState('ai'); // 'ai' | 'manual'

  const POPULAR_DEST_CHIPS = [
    'Ooty', 'Goa', 'Kodaikanal', 'Kerala', 'Manali', 'Paris', 'Swiss Alps', 'Bali', 'Dubai', 'London', 'Tokyo', 'Taj Mahal & Agra'
  ];

  const handleDestinationChange = (e) => {
    const destId = e.target.value;
    if (!destId) {
      setFormData((prev) => ({
        ...prev,
        destinationId: '',
        destinationName: '',
      }));
      return;
    }
    const destObj = destinations.find((d) => String(d.id) === String(destId));
    setFormData((prev) => ({
      ...prev,
      destinationId: destId,
      destinationName: destObj ? destObj.name : '',
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

  // Build a complete editable custom itinerary directly from user's manual details
  const handleCreateManualItinerary = (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!formData.destinationName.trim()) {
      setError('Please select or enter your destination before building an itinerary.');
      return;
    }

    const daysCount = Number(formData.numberOfDays) || 3;
    const start = new Date(formData.startDate || Date.now());
    const days = [];

    for (let i = 1; i <= daysCount; i++) {
      const curDate = new Date(start);
      curDate.setDate(start.getDate() + (i - 1));
      days.push({
        day: i,
        date: curDate.toISOString().split('T')[0],
        title: `Day ${i}: Custom Schedule for ${formData.destinationName}`,
        dayTheme: `Exploration & Activities`,
        morning: {
          spot: `${formData.destinationName} Highlights & Landmark`,
          activity: `Morning exploration of key attractions and scenic spots in ${formData.destinationName}.`,
          time: '09:30 AM',
        },
        afternoon: {
          spot: `${formData.destinationName} Heritage & Local Shopping`,
          activity: `Explore cultural markets, botanical gardens, and local attractions.`,
          time: '02:00 PM',
        },
        evening: {
          spot: `${formData.destinationName} Sunset Promenade & Dining`,
          activity: `Enjoy relaxing evening walk, sunset views, and local dining experience.`,
          time: '06:30 PM',
        },
        customActivities: [],
        foodSuggestions: {
          lunch: { spot: 'Local Specialty Restaurant', dish: 'Regional Thali / Delicacy' },
          dinner: { spot: 'Sunset Dine & Grill', dish: 'Signature Chef Dish' },
        },
        aiTravelTip: 'Carry comfortable walking shoes and keep a camera ready.',
        dailyCostBreakdown: {
          totalDayCost: Math.round((Number(formData.budget) || 15000) / daysCount),
        },
      });
    }

    const manualPlan = {
      destination: formData.destinationName,
      destinationName: formData.destinationName,
      destinationId: formData.destinationId,
      numberOfDays: daysCount,
      travelers: Number(formData.travelers) || 2,
      budget: Number(formData.budget) || 15000,
      currency: formData.currency,
      currencySymbol: formData.currency === 'USD' ? '$' : '₹',
      travelPreference: formData.travelPreference,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      summary: `Custom ${daysCount}-Day itinerary for ${formData.destinationName} customized manually for ${formData.travelers || 2} traveler(s).`,
      totalEstimatedCost: Number(formData.budget) || 15000,
      days: days,
      itineraryItems: [],
      isCustomEdited: true,
    };

    setGeneratedItinerary(manualPlan);
    window.scrollTo({ top: 750, behavior: 'smooth' });
  };

  const handleGenerateItinerary = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSaveSuccess(false);

    if (!formData.destinationName.trim() && !formData.destinationId) {
      setError('Please select or enter your destination.');
      return;
    }
    if (!formData.numberOfDays || Number(formData.numberOfDays) <= 0) {
      setError('Please enter the number of days for your trip.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await tripService.generateAiItinerary({
        destination: formData.destinationName,
        destinationId: formData.destinationId,
        destinationName: formData.destinationName,
        numberOfDays: Number(formData.numberOfDays),
        travelers: Number(formData.travelers) || 2,
        budget: Number(formData.budget) || 15000,
        currency: formData.currency || 'INR',
        travelPreference: formData.travelPreference || 'nature',
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        currentLocation: currentLocation || null,
        startDate: formData.startDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
        title: `${formData.destinationName} (${formData.numberOfDays} Days Custom Plan)`,
        tripType: formData.travelPreference,
        startDate: formData.startDate,
        endDate: end.toISOString().split('T')[0],
        totalBudget: formData.budget,
        travelers: formData.travelers,
        notes: `Personalized ${formData.travelPreference} itinerary for ${formData.travelers} traveler(s). Selected Transport: ${selectedTransport?.title || 'Standard transit'}. Selected Stay: ${selectedHotel?.name || 'Standard accommodation'}.`,
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
          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1.5px solid #FFF5FB', paddingBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPlannerMode('ai')}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '12px',
                border: plannerMode === 'ai' ? '1.5px solid #EC7FA9' : '1px solid #F3D2E5',
                background: plannerMode === 'ai' ? '#EC7FA9' : '#FFF5FB',
                color: plannerMode === 'ai' ? '#ffffff' : '#BE5985',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: plannerMode === 'ai' ? '0 4px 14px rgba(236, 127, 169, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🤖 AI Smart Planner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlannerMode('manual');
                setIsManualDestMode(true);
              }}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '12px',
                border: plannerMode === 'manual' ? '1.5px solid #EC7FA9' : '1px solid #F3D2E5',
                background: plannerMode === 'manual' ? '#EC7FA9' : '#FFF5FB',
                color: plannerMode === 'manual' ? '#ffffff' : '#BE5985',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: plannerMode === 'manual' ? '0 4px 14px rgba(236, 127, 169, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>✍️ Manual Details & Custom Builder</span>
            </button>
          </div>

          <form onSubmit={handleGenerateItinerary}>
            {/* Row 1: Destination & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#BE5985', margin: 0 }}>
                    1. Target Destination {isManualDestMode ? '(Manual Input)' : '(Selected)'}
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
                      placeholder="Type custom destination (e.g. Kodaikanal, Dubai, London, Bali)..."
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
                      color: formData.destinationId ? '#2D1520' : '#7A5366',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Choose a Destination --</option>
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
                    2. Trip Duration (Days)
                  </label>
                  <span style={{ fontSize: '1rem', fontWeight: '900', color: '#BE5985' }}>
                    {formData.numberOfDays ? `${formData.numberOfDays} ${formData.numberOfDays === 1 ? 'Day' : 'Days'}` : 'Select or type'}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  placeholder="e.g. 3"
                  value={formData.numberOfDays || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numberOfDays: e.target.value ? Number(e.target.value) : '' }))}
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
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, numberOfDays: d }))}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: '1px solid ' + (formData.numberOfDays === d ? '#BE5985' : '#F3D2E5'),
                        background: formData.numberOfDays === d ? '#EC7FA9' : '#FFF5FB',
                        color: formData.numberOfDays === d ? '#ffffff' : '#BE5985',
                        cursor: 'pointer',
                      }}
                    >
                      {d} {d === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
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
                  min="0"
                  step="500"
                  placeholder="e.g. 15000"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value ? Number(e.target.value) : '' }))}
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
                  value={formData.travelers || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, travelers: e.target.value ? Number(e.target.value) : '' }))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F3D2E5',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: formData.travelers ? '#2D1520' : '#7A5366',
                  }}
                >
                  <option value="">-- Select Travelers --</option>
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
                  value={formData.startDate || ''}
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

            {/* Submit Action Buttons: Both AI Planning & Manual Building */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #F3D2E5', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCreateManualItinerary}
                className="btn btn-secondary"
                style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>✍️ Build Itinerary Manually</span>
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.25rem', fontSize: '0.98rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>🤖 {isGenerating ? 'AI is Planning...' : 'Generate AI Trip Plan'}</span>
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
              <strong style={{ fontSize: '1.05rem' }}>Trip Saved Successfully!</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>Redirecting to your My Trips dashboard...</p>
            </div>
          </div>
        )}

        {/* Helper guide when no itinerary is generated yet */}
        {!generatedItinerary && !isGenerating && !error && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1.5px dashed #F3D2E5',
              padding: '3rem 2rem',
              textAlign: 'center',
              margin: '2rem 0',
              boxShadow: '0 4px 16px rgba(190, 89, 133, 0.04)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.85rem' }}>✨</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#BE5985', margin: '0 0 0.5rem 0' }}>
              Your Custom Itinerary Will Appear Here
            </h3>
            <p style={{ color: '#7A5366', maxWidth: '520px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Fill in your target destination, duration, budget, and travel vibe above, then click <strong>"🤖 Generate AI Trip Plan"</strong> to create your day-by-day smart schedule!
            </p>
          </div>
        )}

        {/* AI & Manual Itinerary View Component */}
        <AiItineraryView
          itinerary={generatedItinerary}
          isGenerating={isGenerating}
          isSaving={isSaving}
          onRegenerate={handleGenerateItinerary}
          onSave={handleSaveTrip}
          onProceedToBooking={handleProceedToBooking}
          onUpdateItinerary={(updated) => setGeneratedItinerary(updated)}
          error={error}
        />
      </div>
    </section>
  );
}
