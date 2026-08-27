import { useState } from 'react';
import { exportItineraryToPdf } from '../utils/pdfExport';

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
    days = [],
    summary = '',
  } = itinerary;

  const sym = currencySymbol || '₹';
  const activeDay = days.find((d) => d.day === activeDayTab) || days[0] || {};

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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ background: '#FFEDFA', color: '#BE5985', border: '1px solid #FFB8E0', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                ✨ {travelPreference.toUpperCase()} TRIP
              </span>
              <span style={{ background: '#FFF5FB', color: '#7A5366', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                👥 {travelers} Traveler{travelers > 1 ? 's' : ''}
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.35rem 0' }}>
              {destination} — {numberOfDays} Days
            </h2>
            {summary && (
              <p style={{ color: '#7A5366', fontSize: '0.92rem', margin: 0, lineHeight: '1.5', maxWidth: '680px' }}>
                {summary}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div
            style={{
              background: '#FFF5FB',
              border: '1.5px solid #F3D2E5',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              textAlign: 'right',
              minWidth: '170px',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '800', textTransform: 'uppercase' }}>
              Estimated Trip Total
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#BE5985', marginTop: '0.1rem' }}>
              {sym}{totalEstimatedCost.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '600' }}>
              Target: {sym}{budget.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Day Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {days.map((d) => (
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
            Day {d.day}: {d.dayTheme || d.title || `Day ${d.day}`}
          </button>
        ))}
      </div>

      {/* 3. Selected Day Schedule Card */}
      {activeDay && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #F3D2E5',
            padding: '1.75rem',
            boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #FFF5FB', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#BE5985', margin: 0 }}>
              🗓️ Day {activeDay.day} Schedule: {activeDay.title || activeDay.dayTheme || 'Sightseeing & Leisure'}
            </h3>
            {activeDay.dailyCostBreakdown && (
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', background: '#FFEDFA', padding: '3px 10px', borderRadius: '999px' }}>
                Est: {sym}{activeDay.dailyCostBreakdown.totalDayCost?.toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Morning */}
            {activeDay.morning && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#FFF5FB', padding: '1rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                <span style={{ fontSize: '1.5rem' }}>🌅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.95rem' }}>
                    Morning: {activeDay.morning.spot || activeDay.morning.title || 'Sightseeing Exploration'}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#2D1520', fontSize: '0.88rem' }}>
                    {activeDay.morning.activity || activeDay.morning.description || 'Visit popular local spots and viewpoints.'}
                  </p>
                </div>
              </div>
            )}

            {/* Afternoon */}
            {activeDay.afternoon && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#FFF5FB', padding: '1rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                <span style={{ fontSize: '1.5rem' }}>☀️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.95rem' }}>
                    Afternoon: {activeDay.afternoon.spot || activeDay.afternoon.title || 'Heritage & Nature Discovery'}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#2D1520', fontSize: '0.88rem' }}>
                    {activeDay.afternoon.activity || activeDay.afternoon.description || 'Enjoy scenic attractions and shopping.'}
                  </p>
                </div>
              </div>
            )}

            {/* Evening */}
            {activeDay.evening && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#FFF5FB', padding: '1rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                <span style={{ fontSize: '1.5rem' }}>🌆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.95rem' }}>
                    Evening: {activeDay.evening.spot || activeDay.evening.title || 'Sunset & Local Walk'}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#2D1520', fontSize: '0.88rem' }}>
                    {activeDay.evening.activity || activeDay.evening.description || 'Relax with sunset views and night markets.'}
                  </p>
                </div>
              </div>
            )}

            {/* Food Recommendations */}
            {activeDay.foodSuggestions && (
              <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '16px', padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#701a75' }}>
                <span style={{ fontSize: '1.3rem' }}>🍽️</span>
                <div>
                  <strong>Recommended Food: </strong>
                  {activeDay.foodSuggestions.lunch ? `${activeDay.foodSuggestions.lunch.dish} @ ${activeDay.foodSuggestions.lunch.spot}` : ''}
                  {activeDay.foodSuggestions.lunch && activeDay.foodSuggestions.dinner ? ' • ' : ''}
                  {activeDay.foodSuggestions.dinner ? `${activeDay.foodSuggestions.dinner.dish} @ ${activeDay.foodSuggestions.dinner.spot}` : ''}
                </div>
              </div>
            )}

            {/* Pro Tip */}
            {activeDay.aiTravelTip && (
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '14px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💡</span>
                <span><strong>Pro-Tip:</strong> {activeDay.aiTravelTip}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Action Bar (Save PDF, Save Draft, Book) */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: '20px',
          border: '1.5px solid #F3D2E5',
          boxShadow: '0 4px 20px rgba(190, 89, 133, 0.06)',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRegenerate}
          disabled={isGenerating || isSaving}
          style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
        >
          🔄 Regenerate
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => exportItineraryToPdf(itinerary)}
          disabled={isGenerating}
          style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
        >
          📄 Save as PDF
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onSave}
          disabled={isGenerating || isSaving}
          style={{ fontWeight: '800', padding: '0.65rem 1.25rem' }}
        >
          {isSaving ? 'Saving...' : '💾 Save as Draft'}
        </button>

        {onProceedToBooking && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onProceedToBooking}
            disabled={isGenerating || isSaving}
            style={{ fontWeight: '900', padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
          >
            🚀 Review & Book Trip ➔
          </button>
        )}
      </div>
    </div>
  );
}
