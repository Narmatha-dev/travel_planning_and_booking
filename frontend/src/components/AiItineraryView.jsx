import { useState } from 'react';

export default function AiItineraryView({
  itinerary,
  isGenerating,
  isSaving,
  onRegenerate,
  onSave,
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
                  <span className="day-places-tag">
                    📍 {Array.isArray(dayItem.places) ? dayItem.places.join(' • ') : ''}
                  </span>
                </div>
                <div className="day-cost-tag">
                  <span className="tag-sub">Day Total</span>
                  <strong>{sym}{dayItem.estimatedDailyCost?.toLocaleString() || dayItem.dailyCostBreakdown?.totalDayCost?.toLocaleString()}</strong>
                </div>
              </div>

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

      {/* 7. Action Bar: Regenerate & Save */}
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
          className="btn btn-primary btn-save-ai-plan"
          onClick={onSave}
          disabled={isGenerating || isSaving}
        >
          {isSaving ? 'Saving Itinerary...' : '💾 Save AI Trip Plan'}
        </button>
      </div>
    </div>
  );
}
