import { useState, useEffect } from 'react';
import { exportItineraryToPdf } from '../utils/pdfExport';

export default function AiItineraryView({
  itinerary,
  isGenerating,
  isSaving,
  onRegenerate,
  onSave,
  onProceedToBooking,
  onUpdateItinerary,
  error,
}) {
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableDays, setEditableDays] = useState([]);
  const [isModified, setIsModified] = useState(false);

  // Sync incoming itinerary days with local editable state
  useEffect(() => {
    if (itinerary?.days) {
      setEditableDays(JSON.parse(JSON.stringify(itinerary.days)));
    }
  }, [itinerary]);

  if (isGenerating) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #F3D2E5',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(190, 89, 133, 0.06)',
          margin: '2rem 0',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 1.5s infinite' }}>🤖</div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.5rem' }}>
          Crafting Your Ideal Itinerary...
        </h3>
        <p style={{ color: '#7A5366', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
          Selecting the best sightseeing spots, optimizing daily travel pace, and estimating travel costs.
        </p>
      </div>
    );
  }

  if (error && !itinerary) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #F3D2E5',
          padding: '2rem',
          textAlign: 'center',
          margin: '2rem 0',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#BE5985', margin: '0.5rem 0' }}>
          Unable to generate itinerary
        </h4>
        <p style={{ color: '#7A5366', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRegenerate}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  if (!itinerary || !itinerary.days) {
    return null;
  }

  const {
    destination = 'Selected Destination',
    numberOfDays = 3,
    travelers = 2,
    travelPreference = 'Balanced',
    budget = 0,
    totalEstimatedCost = 0,
    currencySymbol = '₹',
    summary = '',
  } = itinerary;

  const sym = currencySymbol || '₹';
  const displayDays = editableDays.length > 0 ? editableDays : (itinerary.days || []);
  const activeDay = displayDays.find((d) => d.day === activeDayTab) || displayDays[0] || {};

  // Handlers for manual editing
  const handleUpdateDayField = (dayNum, field, value) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        return { ...d, [field]: value };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleUpdateSlot = (dayNum, slotName, key, value) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        const slotObj = d[slotName] || {};
        return {
          ...d,
          [slotName]: {
            ...slotObj,
            [key]: value,
          },
        };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleUpdateFood = (dayNum, mealType, key, value) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        const currentFoods = d.foodSuggestions || {};
        const mealObj = currentFoods[mealType] || {};
        return {
          ...d,
          foodSuggestions: {
            ...currentFoods,
            [mealType]: {
              ...mealObj,
              [key]: value,
            },
          },
        };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleAddCustomActivity = (dayNum) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        const currentActs = d.customActivities || [];
        return {
          ...d,
          customActivities: [
            ...currentActs,
            {
              id: Date.now(),
              time: '04:00 PM',
              title: 'New Custom Activity',
              description: 'Custom activity or attraction details.',
              cost: 0,
            },
          ],
        };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleDeleteCustomActivity = (dayNum, actId) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        const filtered = (d.customActivities || []).filter((a) => a.id !== actId);
        return { ...d, customActivities: filtered };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleUpdateCustomActivity = (dayNum, actId, field, value) => {
    const updated = displayDays.map((d) => {
      if (d.day === dayNum) {
        const acts = (d.customActivities || []).map((a) => {
          if (a.id === actId) {
            return { ...a, [field]: value };
          }
          return a;
        });
        return { ...d, customActivities: acts };
      }
      return d;
    });
    setEditableDays(updated);
    setIsModified(true);
  };

  const handleAddNewDay = () => {
    const newDayNum = displayDays.length + 1;
    const prevDay = displayDays[displayDays.length - 1];
    let nextDate = '';
    if (prevDay && prevDay.date) {
      const d = new Date(prevDay.date);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().split('T')[0];
    }

    const newDayObj = {
      day: newDayNum,
      date: nextDate,
      title: `Day ${newDayNum}: Custom Exploration & Sightseeing`,
      dayTheme: `Exploration & Activities`,
      morning: {
        spot: 'Morning Landmark / Park',
        activity: 'Visit scenic local spots and explore landmarks.',
        time: '09:30 AM',
      },
      afternoon: {
        spot: 'Afternoon Heritage & Shopping',
        activity: 'Explore shopping markets, museums, or botanical gardens.',
        time: '02:00 PM',
      },
      evening: {
        spot: 'Evening Sunset Walk & Dining',
        activity: 'Enjoy sunset promenade stroll and local dinner.',
        time: '06:30 PM',
      },
      customActivities: [],
      foodSuggestions: {
        lunch: { spot: 'Local Eatery', dish: 'Regional Specialty' },
        dinner: { spot: 'Sunset Dine', dish: 'Chef Signature Dish' },
      },
      aiTravelTip: 'Carry water and camera for panoramic photos.',
      dailyCostBreakdown: {
        totalDayCost: Math.round(budget / newDayNum),
      },
    };

    const updated = [...displayDays, newDayObj];
    setEditableDays(updated);
    setActiveDayTab(newDayNum);
    setIsModified(true);
  };

  const handleDeleteDay = (dayNum) => {
    if (displayDays.length <= 1) {
      alert('Trip must have at least 1 day.');
      return;
    }
    const filtered = displayDays
      .filter((d) => d.day !== dayNum)
      .map((d, idx) => ({
        ...d,
        day: idx + 1,
        title: d.title.replace(/Day \d+/, `Day ${idx + 1}`),
      }));
    setEditableDays(filtered);
    setActiveDayTab(1);
    setIsModified(true);
  };

  const handleSaveEdits = () => {
    const updatedItinerary = {
      ...itinerary,
      numberOfDays: editableDays.length,
      days: editableDays,
      isCustomEdited: true,
    };
    if (onUpdateItinerary) {
      onUpdateItinerary(updatedItinerary);
    }
    setIsEditMode(false);
    setIsModified(false);
  };

  const handleResetToAi = () => {
    if (itinerary?.days) {
      setEditableDays(JSON.parse(JSON.stringify(itinerary.days)));
      setIsModified(false);
      setIsEditMode(false);
    }
  };

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* 1. Trip Summary Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #F3D2E5',
          padding: '2rem',
          boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#FFEDFA', color: '#BE5985', border: '1px solid #FFB8E0', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                ✨ {travelPreference.toUpperCase()} TRIP
              </span>
              <span style={{ background: '#FFF5FB', color: '#7A5366', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                👥 {travelers} Traveler{travelers > 1 ? 's' : ''}
              </span>
              {isModified && (
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                  ✍️ Custom Edits Unsaved
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.35rem 0' }}>
              {destination} — {displayDays.length} Days Plan
            </h2>
            {summary && (
              <p style={{ color: '#7A5366', fontSize: '0.92rem', margin: 0, lineHeight: '1.5', maxWidth: '680px' }}>
                {summary}
              </p>
            )}
          </div>

          {/* Mode Switch & Pricing Box */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                background: isEditMode ? '#EC7FA9' : '#FFF5FB',
                color: isEditMode ? '#ffffff' : '#BE5985',
                border: '1.5px solid ' + (isEditMode ? '#BE5985' : '#F3D2E5'),
                padding: '0.6rem 1.15rem',
                borderRadius: '14px',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isEditMode ? '0 4px 12px rgba(236, 127, 169, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isEditMode ? '👁️ Preview Mode' : '✍️ Edit & Customize Schedule'}</span>
            </button>

            <div
              style={{
                background: '#FFF5FB',
                border: '1.5px solid #F3D2E5',
                padding: '0.85rem 1.25rem',
                borderRadius: '16px',
                textAlign: 'right',
                minWidth: '160px',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '800', textTransform: 'uppercase' }}>
                Estimated Total
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#BE5985', marginTop: '0.1rem' }}>
                {sym}{totalEstimatedCost.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '600' }}>
                Budget: {sym}{budget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <div
            style={{
              background: '#FFEDFA',
              border: '1.5px dashed #EC7FA9',
              borderRadius: '14px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#BE5985', fontWeight: '700' }}>
              <span>✍️</span>
              <span><strong>Manual Editing Mode:</strong> Modify any activity, time, restaurant, or add/delete days below.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '800', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                💾 Save Changes
              </button>
              <button
                type="button"
                onClick={handleResetToAi}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: '700', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Day Navigation Tabs with Add Day Button */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {displayDays.map((d) => (
          <button
            key={d.day}
            type="button"
            onClick={() => setActiveDayTab(d.day)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              border: activeDayTab === d.day ? '1.5px solid #EC7FA9' : '1px solid #F3D2E5',
              background: activeDayTab === d.day ? '#EC7FA9' : '#ffffff',
              color: activeDayTab === d.day ? '#ffffff' : '#BE5985',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeDayTab === d.day ? '0 4px 12px rgba(236, 127, 169, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Day {d.day}
          </button>
        ))}

        {isEditMode && (
          <button
            type="button"
            onClick={handleAddNewDay}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              border: '1.5px dashed #BE5985',
              background: '#FFF5FB',
              color: '#BE5985',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ➕ Add Day {displayDays.length + 1}
          </button>
        )}
      </div>

      {/* 3. Selected Day Schedule Card (Interactive Edit & View) */}
      {activeDay && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #F3D2E5',
            padding: '2rem',
            boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)',
            marginBottom: '1.5rem',
          }}
        >
          {/* Header of the Day */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1.5px solid #FFF5FB', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              {isEditMode ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Day {activeDay.day} Title / Theme:
                  </label>
                  <input
                    type="text"
                    value={activeDay.title || activeDay.dayTheme || ''}
                    onChange={(e) => handleUpdateDayField(activeDay.day, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #EC7FA9',
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      color: '#BE5985',
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                    Day {activeDay.day} • {activeDay.date || 'Scheduled'}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#BE5985', margin: '0.15rem 0 0 0' }}>
                    🗓️ {activeDay.title || activeDay.dayTheme || 'Sightseeing & Leisure'}
                  </h3>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {activeDay.dailyCostBreakdown && (
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', background: '#FFEDFA', padding: '4px 12px', borderRadius: '999px' }}>
                  Est: {sym}{activeDay.dailyCostBreakdown.totalDayCost?.toLocaleString()}
                </span>
              )}
              {isEditMode && displayDays.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteDay(activeDay.day)}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                  title="Delete this entire day"
                >
                  🗑️ Delete Day
                </button>
              )}
            </div>
          </div>

          {/* Timeline Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Morning Slot */}
            <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '18px', border: '1.5px solid #F3D2E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🌅</span>
                <strong style={{ color: '#BE5985', fontSize: '0.95rem' }}>Morning Activity</strong>
                {isEditMode && (
                  <input
                    type="text"
                    value={activeDay.morning?.time || '09:30 AM'}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'morning', 'time', e.target.value)}
                    placeholder="Time"
                    style={{
                      width: '95px',
                      padding: '2px 8px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: '1px solid #EC7FA9',
                      fontWeight: '700',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </div>

              {isEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={activeDay.morning?.spot || activeDay.morning?.title || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'morning', 'spot', e.target.value)}
                    placeholder="Morning spot name / landmark"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #EC7FA9',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                    }}
                  />
                  <textarea
                    rows={2}
                    value={activeDay.morning?.activity || activeDay.morning?.description || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'morning', 'activity', e.target.value)}
                    placeholder="Activity description or instructions"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #F3D2E5',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: '800', color: '#2D1520', fontSize: '0.95rem' }}>
                    {activeDay.morning?.spot || activeDay.morning?.title || 'Morning Sightseeing'}
                    {activeDay.morning?.time && <span style={{ color: '#7A5366', fontSize: '0.8rem', fontWeight: '600', marginLeft: '6px' }}>({activeDay.morning.time})</span>}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: '#7A5366', fontSize: '0.88rem', lineHeight: '1.4' }}>
                    {activeDay.morning?.activity || activeDay.morning?.description || 'Explore local morning spots.'}
                  </p>
                </div>
              )}
            </div>

            {/* Afternoon Slot */}
            <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '18px', border: '1.5px solid #F3D2E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>☀️</span>
                <strong style={{ color: '#BE5985', fontSize: '0.95rem' }}>Afternoon Activity</strong>
                {isEditMode && (
                  <input
                    type="text"
                    value={activeDay.afternoon?.time || '02:00 PM'}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'afternoon', 'time', e.target.value)}
                    placeholder="Time"
                    style={{
                      width: '95px',
                      padding: '2px 8px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: '1px solid #EC7FA9',
                      fontWeight: '700',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </div>

              {isEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={activeDay.afternoon?.spot || activeDay.afternoon?.title || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'afternoon', 'spot', e.target.value)}
                    placeholder="Afternoon spot name / landmark"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #EC7FA9',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                    }}
                  />
                  <textarea
                    rows={2}
                    value={activeDay.afternoon?.activity || activeDay.afternoon?.description || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'afternoon', 'activity', e.target.value)}
                    placeholder="Activity description or instructions"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #F3D2E5',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: '800', color: '#2D1520', fontSize: '0.95rem' }}>
                    {activeDay.afternoon?.spot || activeDay.afternoon?.title || 'Afternoon Discovery'}
                    {activeDay.afternoon?.time && <span style={{ color: '#7A5366', fontSize: '0.8rem', fontWeight: '600', marginLeft: '6px' }}>({activeDay.afternoon.time})</span>}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: '#7A5366', fontSize: '0.88rem', lineHeight: '1.4' }}>
                    {activeDay.afternoon?.activity || activeDay.afternoon?.description || 'Explore local cultural sites and activities.'}
                  </p>
                </div>
              )}
            </div>

            {/* Evening Slot */}
            <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '18px', border: '1.5px solid #F3D2E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🌆</span>
                <strong style={{ color: '#BE5985', fontSize: '0.95rem' }}>Evening Activity</strong>
                {isEditMode && (
                  <input
                    type="text"
                    value={activeDay.evening?.time || '06:30 PM'}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'evening', 'time', e.target.value)}
                    placeholder="Time"
                    style={{
                      width: '95px',
                      padding: '2px 8px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: '1px solid #EC7FA9',
                      fontWeight: '700',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </div>

              {isEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={activeDay.evening?.spot || activeDay.evening?.title || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'evening', 'spot', e.target.value)}
                    placeholder="Evening spot name / promenade"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #EC7FA9',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                    }}
                  />
                  <textarea
                    rows={2}
                    value={activeDay.evening?.activity || activeDay.evening?.description || ''}
                    onChange={(e) => handleUpdateSlot(activeDay.day, 'evening', 'activity', e.target.value)}
                    placeholder="Activity description or instructions"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #F3D2E5',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: '800', color: '#2D1520', fontSize: '0.95rem' }}>
                    {activeDay.evening?.spot || activeDay.evening?.title || 'Evening Leisure & Sunset'}
                    {activeDay.evening?.time && <span style={{ color: '#7A5366', fontSize: '0.8rem', fontWeight: '600', marginLeft: '6px' }}>({activeDay.evening.time})</span>}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: '#7A5366', fontSize: '0.88rem', lineHeight: '1.4' }}>
                    {activeDay.evening?.activity || activeDay.evening?.description || 'Relax with sunset views, dining, or shopping.'}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Activities added by user */}
            {activeDay.customActivities && activeDay.customActivities.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeDay.customActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      background: '#FFEDFA',
                      border: '1.5px solid #FFB8E0',
                      borderRadius: '16px',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#BE5985' }}>
                        ⭐ Custom Activity: {act.time}
                      </span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomActivity(activeDay.day, act.id)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✕ Delete
                        </button>
                      )}
                    </div>

                    {isEditMode ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <input
                          type="text"
                          value={act.title}
                          onChange={(e) => handleUpdateCustomActivity(activeDay.day, act.id, 'title', e.target.value)}
                          placeholder="Activity Title"
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #EC7FA9', fontSize: '0.85rem', fontWeight: '700' }}
                        />
                        <input
                          type="text"
                          value={act.time}
                          onChange={(e) => handleUpdateCustomActivity(activeDay.day, act.id, 'time', e.target.value)}
                          placeholder="Time"
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #EC7FA9', fontSize: '0.85rem' }}
                        />
                        <input
                          type="text"
                          value={act.description}
                          onChange={(e) => handleUpdateCustomActivity(activeDay.day, act.id, 'description', e.target.value)}
                          placeholder="Activity details..."
                          style={{ gridColumn: '1 / -1', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #F3D2E5', fontSize: '0.85rem' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '800', color: '#2D1520', fontSize: '0.92rem' }}>{act.title}</div>
                        <div style={{ color: '#7A5366', fontSize: '0.85rem', marginTop: '2px' }}>{act.description}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Activity Button */}
            {isEditMode && (
              <button
                type="button"
                onClick={() => handleAddCustomActivity(activeDay.day)}
                style={{
                  background: '#FFF5FB',
                  border: '1.5px dashed #EC7FA9',
                  borderRadius: '14px',
                  padding: '0.75rem',
                  color: '#BE5985',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>➕ Add Custom Activity to Day {activeDay.day}</span>
              </button>
            )}

            {/* Food Recommendations (Editable) */}
            <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', color: '#701a75', fontSize: '0.9rem' }}>
                <span>🍽️</span> Recommended Dining & Food Spots:
              </div>

              {isEditMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#701a75', textTransform: 'uppercase' }}>Lunch Spot & Dish:</label>
                    <input
                      type="text"
                      value={activeDay.foodSuggestions?.lunch?.spot || ''}
                      onChange={(e) => handleUpdateFood(activeDay.day, 'lunch', 'spot', e.target.value)}
                      placeholder="Restaurant name"
                      style={{ width: '100%', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #f5d0fe', fontSize: '0.82rem', marginBottom: '0.3rem' }}
                    />
                    <input
                      type="text"
                      value={activeDay.foodSuggestions?.lunch?.dish || ''}
                      onChange={(e) => handleUpdateFood(activeDay.day, 'lunch', 'dish', e.target.value)}
                      placeholder="Signature dish"
                      style={{ width: '100%', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #f5d0fe', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#701a75', textTransform: 'uppercase' }}>Dinner Spot & Dish:</label>
                    <input
                      type="text"
                      value={activeDay.foodSuggestions?.dinner?.spot || ''}
                      onChange={(e) => handleUpdateFood(activeDay.day, 'dinner', 'spot', e.target.value)}
                      placeholder="Restaurant name"
                      style={{ width: '100%', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #f5d0fe', fontSize: '0.82rem', marginBottom: '0.3rem' }}
                    />
                    <input
                      type="text"
                      value={activeDay.foodSuggestions?.dinner?.dish || ''}
                      onChange={(e) => handleUpdateFood(activeDay.day, 'dinner', 'dish', e.target.value)}
                      placeholder="Signature dish"
                      style={{ width: '100%', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #f5d0fe', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#701a75' }}>
                  {activeDay.foodSuggestions?.lunch ? (
                    <div><strong>Lunch:</strong> {activeDay.foodSuggestions.lunch.dish} @ {activeDay.foodSuggestions.lunch.spot}</div>
                  ) : null}
                  {activeDay.foodSuggestions?.dinner ? (
                    <div style={{ marginTop: '3px' }}><strong>Dinner:</strong> {activeDay.foodSuggestions.dinner.dish} @ {activeDay.foodSuggestions.dinner.spot}</div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Travel Tip / Notes (Editable) */}
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '14px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#854d0e' }}>
              {isEditMode ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#854d0e', marginBottom: '0.3rem' }}>
                    💡 Pro-Tip & Custom Notes for Day {activeDay.day}:
                  </label>
                  <input
                    type="text"
                    value={activeDay.aiTravelTip || ''}
                    onChange={(e) => handleUpdateDayField(activeDay.day, 'aiTravelTip', e.target.value)}
                    placeholder="Custom tips, packing notes, camera gear..."
                    style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #fde047', fontSize: '0.85rem' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💡</span>
                  <span><strong>Pro-Tip:</strong> {activeDay.aiTravelTip || 'Enjoy your customized itinerary.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Action Bar (Save PDF, Save Draft, Book) */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '20px',
          border: '1.5px solid #F3D2E5',
          boxShadow: '0 4px 20px rgba(190, 89, 133, 0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
          >
            {isEditMode ? '👁️ Preview Mode' : '✍️ Edit Itinerary'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRegenerate}
            disabled={isGenerating || isSaving}
            style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
          >
            🔄 AI Regenerate
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportItineraryToPdf({ ...itinerary, days: displayDays })}
            disabled={isGenerating}
            style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
          >
            📄 Save as PDF
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (onUpdateItinerary && isModified) {
                onUpdateItinerary({ ...itinerary, days: displayDays });
              }
              onSave();
            }}
            disabled={isGenerating || isSaving}
            style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
          >
            {isSaving ? 'Saving...' : '💾 Save as Draft'}
          </button>

          {onProceedToBooking && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (onUpdateItinerary && isModified) {
                  onUpdateItinerary({ ...itinerary, days: displayDays });
                }
                onProceedToBooking();
              }}
              disabled={isGenerating || isSaving}
              style={{ fontWeight: '900', padding: '0.65rem 1.75rem', fontSize: '0.95rem' }}
            >
              🚀 Review & Book Trip ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
