import { useState } from 'react';

export default function AiItineraryView({
  itinerary,
  isGenerating,
  isSaving,
  onRegenerate,
  onSave,
  onProceedToBooking,
  error,
}) {
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [showAllDays, setShowAllDays] = useState(true);

  if (isGenerating) {
    return (
      <div className="ai-itinerary-loading-container">
        <div className="ai-loading-pulse-ring">
          <span style={{ fontSize: '2.5rem' }}>🤖</span>
        </div>
        <h3 className="ai-loading-title">AI is planning your trip...</h3>
        <p className="ai-loading-desc">
          Synthesizing real attractions, optimizing geographical routes, and calculating daily budget pacing...
        </p>
        <div className="ai-loading-steps-row">
          <span className="step-pill active">1. Profiling</span>
          <span className="step-pill active">2. Route Clustering</span>
          <span className="step-pill active">3. Culinary Curation</span>
          <span className="step-pill active">4. Budget Balancing</span>
        </div>
      </div>
    );
  }

  if (error && !itinerary) {
    return (
      <div className="ai-itinerary-error-box">
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <h4>AI Trip Planning Temporarily Unavailable</h4>
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRegenerate}>
          Retry AI Plan
        </button>
      </div>
    );
  }

  if (!itinerary || !itinerary.days) {
    return null;
  }

  const {
    destination,
    numberOfDays,
    travelers,
    travelPreference,
    budget,
    totalEstimatedCost,
    budgetStatus,
    budgetDifference,
    overBudgetAlert,
    budgetAlternatives,
    selectedTransport,
    currencySymbol = '₹',
    days,
    recommendations,
    budgetAdvice,
  } = itinerary;

  const isOverBudget = budgetStatus === 'over_budget';
  const sym = currencySymbol || '₹';

  return (
    <div className="ai-itinerary-view-container">
      {/* 1. Master AI Trip Plan Header */}
      <div className="ai-plan-header-card">
        <div className="ai-plan-badge-row">
          <span className="ai-badge">🤖 AI TRIP PLAN</span>
          <span className="pref-badge">✨ {travelPreference?.toUpperCase() || 'BALANCED'}</span>
        </div>

        <div className="ai-plan-main-title-box">
          <h2 className="ai-plan-title">
            {destination} — {numberOfDays} Days
          </h2>
          <p className="ai-plan-summary">{itinerary.summary}</p>
        </div>

        {/* Quick Parameter Grid */}
        <div className="ai-plan-meta-strip">
          <div className="meta-strip-item">
            <span className="m-label">💰 User Budget</span>
            <strong className="m-val">{sym}{budget?.toLocaleString()}</strong>
          </div>
          <div className="meta-strip-item">
            <span className="m-label">💵 Estimated Cost</span>
            <strong className={`m-val ${isOverBudget ? 'text-danger' : 'text-success'}`}>
              {sym}{totalEstimatedCost?.toLocaleString()}
            </strong>
          </div>
          <div className="meta-strip-item">
            <span className="m-label">👥 Travelers</span>
            <strong className="m-val">{travelers || 2}</strong>
          </div>
          <div className="meta-strip-item">
            <span className="m-label">🚆 Transport</span>
            <strong className="m-val">{selectedTransport?.title || selectedTransport?.type?.toUpperCase() || 'Train / Cab'}</strong>
          </div>
        </div>
      </div>

      {/* Estimated Travel Cost Breakdown Card (Requirement 2) */}
      {(() => {
        const cb = itinerary.costBreakdown || {
          distanceText: itinerary.distanceText || (itinerary.distanceKm ? `${itinerary.distanceKm} km` : 'Local Destination'),
          transport: Math.round(totalEstimatedCost * 0.18),
          accommodation: Math.round(totalEstimatedCost * 0.42),
          food: Math.round(totalEstimatedCost * 0.25),
          activities: Math.round(totalEstimatedCost * 0.10),
          other: Math.round(totalEstimatedCost * 0.05),
          total: totalEstimatedCost,
          currencySymbol: sym,
          isEstimated: true,
        };

        return (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #cbd5e1',
              padding: '1.5rem',
              margin: '1.5rem 0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span> Estimated Travel Cost Breakdown
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Calculated based on actual road distance, transport mode, {travelers || 2} traveler{travelers > 1 ? 's' : ''}, and {numberOfDays} day{numberOfDays > 1 ? 's' : ''} duration.
                </p>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800' }}>
                Estimated Calculation
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>📏 Distance</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {cb.distanceText || (cb.distanceKm ? `${cb.distanceKm} km` : 'Local Destination')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>🚗 Transport</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {sym}{Number(cb.transport).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>🏨 Accommodation</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {sym}{Number(cb.accommodation).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>🍽️ Food & Meals</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {sym}{Number(cb.food).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>🎟️ Activities</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {sym}{Number(cb.activities).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>🎒 Other / Transit</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                  {sym}{Number(cb.other).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Total Summary Row */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                  Estimated Total Travel Cost
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8' }}>
                  {sym}{Number(cb.total || totalEstimatedCost).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Per Person Cost</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
                  ~{sym}{Math.round((cb.total || totalEstimatedCost) / (travelers || 2)).toLocaleString('en-IN')} / traveler
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Budget Alert & Actionable Optimization Advice */}
      {isOverBudget ? (
        <div className="ai-overbudget-banner">
          <div className="overbudget-header">
            <span className="alert-icon">⚠️</span>
            <div>
              <h4 className="overbudget-title">Budget Notice: Plan Exceeds Specified Budget</h4>
              <p className="overbudget-msg">{overBudgetAlert}</p>
            </div>
          </div>

          {budgetAlternatives && budgetAlternatives.length > 0 && (
            <div className="overbudget-alternatives">
              <span className="alt-title">💡 Smart AI Cost-Reduction Recommendations:</span>
              <ul>
                {budgetAlternatives.map((alt, idx) => (
                  <li key={idx}>
                    <span className="check-bullet">➔</span> {alt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="ai-withinbudget-banner">
          <span className="check-icon">✓</span>
          <div>
            <strong>Great news! This trip is within your {sym}{budget?.toLocaleString()} budget.</strong>
            <p>Estimated remaining buffer: {sym}{Math.abs(budgetDifference)?.toLocaleString()} for spontaneous shopping & extras.</p>
          </div>
        </div>
      )}

      {/* 3. Day-by-Day Toggle Tabs */}
      <div className="ai-days-nav-row">
        <button
          type="button"
          className={`ai-day-tab-btn ${showAllDays ? 'active' : ''}`}
          onClick={() => setShowAllDays(true)}
        >
          📅 All Days View ({days.length})
        </button>
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={`ai-day-tab-btn ${!showAllDays && activeDayTab === d.day ? 'active' : ''}`}
            onClick={() => {
              setShowAllDays(false);
              setActiveDayTab(d.day);
            }}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      {/* 4. Day-Wise Itinerary Cards */}
      <div className="ai-days-container">
        {days
          .filter((d) => showAllDays || d.day === activeDayTab)
          .map((dayItem) => (
            <div key={dayItem.day} className="ai-day-card">
              {/* Day Header */}
              <div className="ai-day-card-header">
                <div className="day-number-badge">DAY {dayItem.day}</div>
                <div className="day-theme-box">
                  <h3 className="day-theme-title">{dayItem.theme || dayItem.title}</h3>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span className="day-places-tag">
                      📍 {Array.isArray(dayItem.places) ? dayItem.places.join(' • ') : ''}
                    </span>
                    {dayItem.date && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                        📅 {dayItem.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Weather Badge (Phase 26) */}
                {dayItem.weather?.weather_available && (
                  <div
                    style={{
                      background: dayItem.weather.is_rainy ? '#eff6ff' : '#f0fdf4',
                      border: `1.5px solid ${dayItem.weather.is_rainy ? '#bfdbfe' : '#bbf7d0'}`,
                      borderRadius: '12px',
                      padding: '0.4rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                    title={`Rain chance: ${dayItem.weather.rain_probability}%, Suitability: ${dayItem.weather.outdoor_suitability}`}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{dayItem.weather.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                        {dayItem.weather.temperature_max}°C <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>/ {dayItem.weather.temperature_min}°C</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: dayItem.weather.rain_probability > 50 ? '#0284c7' : '#16a34a' }}>
                        🌧️ {dayItem.weather.rain_probability}% • {dayItem.weather.outdoor_suitability}
                      </div>
                    </div>
                  </div>
                )}

                <div className="day-cost-tag">
                  <span className="tag-sub">Day Total</span>
                  <strong>{sym}{dayItem.estimatedDailyCost?.toLocaleString() || dayItem.dailyCostBreakdown?.totalDayCost?.toLocaleString()}</strong>
                </div>
              </div>

              {/* Weather Advice Banner for this Day */}
              {dayItem.weatherAdvice && (
                <div
                  style={{
                    background: dayItem.weather?.is_rainy ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${dayItem.weather?.is_rainy ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '0.65rem 1rem',
                    margin: '0.75rem 1.25rem 0 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                    color: dayItem.weather?.is_rainy ? '#1e40af' : '#334155',
                  }}
                >
                  <span>{dayItem.weather?.is_rainy ? '🌧️' : '💡'}</span>
                  <span>{dayItem.weatherAdvice}</span>
                </div>
              )}

              {/* Wet Weather Indoor Alternatives (if available) */}
              {dayItem.indoorAlternatives && dayItem.indoorAlternatives.length > 0 && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px dashed #93c5fd',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    margin: '0.75rem 1.25rem 0 1.25rem',
                  }}
                >
                  <strong style={{ fontSize: '0.8rem', color: '#0369a1', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    🏛️ Weather-Aware Indoor Alternatives for this Day:
                  </strong>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {dayItem.indoorAlternatives.map((alt, altIdx) => (
                      <span
                        key={altIdx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          color: '#334155',
                        }}
                        title={alt.reason}
                      >
                        🏛️ {alt.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Time-Slotted Activities (Morning, Afternoon, Evening) */}
              <div className="ai-activities-timeline">
                {dayItem.activities && dayItem.activities.map((act, actIdx) => {
                  const slotIcon =
                    act.slot === 'morning' || act.time < '12:00' ? '🌅' :
                    act.slot === 'afternoon' || (act.time >= '12:00' && act.time < '17:00') ? '🍛' : '🌆';

                  return (
                    <div key={actIdx} className="ai-activity-slot">
                      <div className="slot-time-col">
                        <span className="slot-icon">{slotIcon}</span>
                        <span className="slot-time">{act.time || '10:00 AM'}</span>
                      </div>
                      <div className="slot-content-col">
                        <div className="slot-title-row">
                          <h4 className="slot-place-name">{act.placeName}</h4>
                          {act.estimatedCost !== undefined && (
                            <span className="slot-cost-badge">
                              {act.estimatedCost === 0 ? 'Free Entry' : `${sym}${act.estimatedCost}`}
                            </span>
                          )}
                        </div>
                        <p className="slot-reason">{act.reason}</p>
                        <div className="slot-meta-row">
                          {act.duration && <span className="meta-pill">⏱️ {act.duration}</span>}
                          {act.category && <span className="meta-pill">🏷️ {act.category}</span>}
                          {act.openingHours && <span className="meta-pill">🕒 {act.openingHours}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Culinary & Food Recommendations */}
              {dayItem.foodSuggestions && (
                <div className="ai-day-culinary-strip">
                  <span className="culinary-strip-title">🍽️ Recommended Local Dining for Day {dayItem.day}</span>
                  <div className="culinary-slots-grid">
                    {dayItem.foodSuggestions.breakfast && (
                      <div className="culinary-box">
                        <span className="c-label">🌅 Breakfast</span>
                        <strong className="c-spot">{dayItem.foodSuggestions.breakfast.spot}</strong>
                        <p className="c-dish">{dayItem.foodSuggestions.breakfast.dish}</p>
                      </div>
                    )}
                    {dayItem.foodSuggestions.lunch && (
                      <div className="culinary-box">
                        <span className="c-label">🍛 Lunch</span>
                        <strong className="c-spot">{dayItem.foodSuggestions.lunch.spot}</strong>
                        <p className="c-dish">{dayItem.foodSuggestions.lunch.dish}</p>
                      </div>
                    )}
                    {dayItem.foodSuggestions.dinner && (
                      <div className="culinary-box">
                        <span className="c-label">🌆 Dinner</span>
                        <strong className="c-spot">{dayItem.foodSuggestions.dinner.spot}</strong>
                        <p className="c-dish">{dayItem.foodSuggestions.dinner.dish}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Daily Budget Breakdown */}
              {dayItem.dailyCostBreakdown && (
                <div className="ai-day-budget-bar">
                  <span className="bb-label">Day {dayItem.day} Spending:</span>
                  <span className="bb-item">🚗 Transport: {sym}{dayItem.dailyCostBreakdown.transport}</span>
                  <span className="bb-item">🍽️ Food: {sym}{dayItem.dailyCostBreakdown.food}</span>
                  <span className="bb-item">🎟️ Activities: {sym}{dayItem.dailyCostBreakdown.activities}</span>
                  <span className="bb-item">🏨 Stay: {sym}{dayItem.dailyCostBreakdown.stay}</span>
                  <strong className="bb-total">Total: {sym}{dayItem.dailyCostBreakdown.totalDayCost?.toLocaleString()}</strong>
                </div>
              )}

              {/* Pro-Tip */}
              {dayItem.aiTravelTip && (
                <div className="ai-day-tip-box">
                  <span>💡</span>
                  <p>{dayItem.aiTravelTip}</p>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 5. Smart Recommendations ("Recommended For You") */}
      {recommendations && recommendations.length > 0 && (
        <div className="ai-recommendations-section">
          <div className="section-title-row">
            <span className="sec-icon">⭐</span>
            <div>
              <h3 className="sec-title">Recommended For You</h3>
              <p className="sec-subtitle">
                Intelligent additions matching your <strong>{travelPreference}</strong> style & destination.
              </p>
            </div>
          </div>

          <div className="rec-cards-grid">
            {recommendations.map((rec, rIdx) => (
              <div key={rIdx} className="rec-item-card">
                <div className="rec-card-top">
                  <h4 className="rec-title">{rec.title}</h4>
                  {rec.costEstimate && <span className="rec-cost">{rec.costEstimate}</span>}
                </div>
                <p className="rec-reason">{rec.reason}</p>
                <span className="rec-category-tag">🏷️ {rec.category || 'Highlight'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Budget Advice & Travel Tips */}
      {budgetAdvice && budgetAdvice.length > 0 && (
        <div className="ai-budget-advice-box">
          <h4>💡 Local Budget & Travel Advisory</h4>
          <ul>
            {budgetAdvice.map((tip, tIdx) => (
              <li key={tIdx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Action Bar: Regenerate, Save & Book */}
      <div className="ai-plan-action-bar">
        <button
          type="button"
          className="btn btn-outline btn-regenerate"
          onClick={onRegenerate}
          disabled={isGenerating || isSaving}
        >
          🔄 Regenerate Plan
        </button>

        <button
          type="button"
          className="btn btn-outline btn-save-ai-plan"
          style={{ background: '#ffffff', color: '#0284c7', borderColor: '#0284c7' }}
          onClick={onSave}
          disabled={isGenerating || isSaving}
        >
          {isSaving ? 'Saving Itinerary...' : '💾 Save as Draft'}
        </button>

        {onProceedToBooking && (
          <button
            type="button"
            className="btn btn-primary btn-book-trip"
            style={{ background: '#0284c7', color: '#ffffff', fontWeight: '800' }}
            onClick={onProceedToBooking}
            disabled={isGenerating || isSaving}
          >
            🚀 Review & Book Trip ➔
          </button>
        )}
      </div>
    </div>
  );
}
