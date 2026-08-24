import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rewardService from '../services/rewardService';

export default function RewardsPage() {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRewards() {
      setLoading(true);
      setError('');
      try {
        const data = await rewardService.getUserRewards();
        setRewards(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load rewards data.');
      } finally {
        setLoading(false);
      }
    }
    loadRewards();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 1.5s infinite' }}>🏆</div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          Loading your travel rewards...
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Fetching point transactions, loyalty tier, and perks</p>
      </div>
    );
  }

  if (error || !rewards) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px dashed #cbd5e1',
            padding: '3rem 2rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            Unable to Load Rewards
          </h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ borderRadius: '12px', fontWeight: '800' }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  const transactions = rewards.transactions || [];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span
          style={{
            background: '#fef3c7',
            color: '#b45309',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '0.5rem',
          }}
        >
          Phase 16 • Travel Rewards Program
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
          🏆 My Travel Rewards & Loyalty Hub
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Earn points through genuine travel activities, unlock elite tiers, and enjoy travel perks.
        </p>
      </div>

      {/* Hero Tier & Points Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
          borderRadius: '28px',
          padding: '2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: '0 16px 36px rgba(15, 23, 42, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{rewards.badge}</span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {rewards.tier} Tier
              </span>
            </div>

            <h2 style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.35rem 0', lineHeight: 1.1 }}>
              {rewards.totalPoints.toLocaleString()}
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#38bdf8', marginLeft: '0.5rem' }}>
                Travel Points
              </span>
            </h2>

            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem' }}>
              🎖️ <strong>Tier Perks:</strong> {rewards.perks}
            </p>
          </div>

          {/* Progress to Next Level (Feature 9) */}
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#93c5fd' }}>
                Level Progress
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                {rewards.progressPercentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '12px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: `${rewards.progressPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #22c55e)',
                  borderRadius: '9999px',
                  transition: 'width 0.6s ease',
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <span>{rewards.currentLevel}</span>
              <span>
                {rewards.nextLevel ? (
                  <span>
                    <strong>{rewards.pointsToNextLevel} pts</strong> to {rewards.nextLevel}
                  </span>
                ) : (
                  <span style={{ color: '#4ade80', fontWeight: '800' }}>👑 Max Tier Unlocked!</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How to Earn Points Section (Feature 10) */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
          💡 How to Earn Travel Points
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>🧳</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '9999px', fontWeight: '800', fontSize: '0.85rem' }}>
                  +100 Points
                </span>
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                Complete a Trip
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.4 }}>
                Points are credited automatically when your booked vacation status is completed.
              </p>
            </div>
            <Link to="/my-trips" className="btn btn-outline btn-sm" style={{ marginTop: '1.25rem', borderRadius: '10px', fontWeight: '700' }}>
              View Bookings
            </Link>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>⭐</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '9999px', fontWeight: '800', fontSize: '0.85rem' }}>
                  +25 Points
                </span>
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                Submit a Verified Review
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.4 }}>
                Share your authentic travel feedback and ratings on completed trips to help others.
              </p>
            </div>
            <Link to="/my-trips?tab=completed" className="btn btn-outline btn-sm" style={{ marginTop: '1.25rem', borderRadius: '10px', fontWeight: '700' }}>
              Rate Completed Trips
            </Link>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '9999px', fontWeight: '800', fontSize: '0.85rem' }}>
                  +10 Points
                </span>
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                Save a Trip Plan
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.4 }}>
                Build and save a custom day-by-day itinerary blueprint using the Smart AI Trip Planner.
              </p>
            </div>
            <Link to="/trip-planner" className="btn btn-primary btn-sm" style={{ marginTop: '1.25rem', borderRadius: '10px', fontWeight: '800' }}>
              🚀 Plan New Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Rewards History Ledger (Feature 3 & 4) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            📜 Points Activity History
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
            {transactions.length} Transactions Recorded
          </span>
        </div>

        {transactions.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px dashed #cbd5e1',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌱</div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
              No rewards activity yet
            </h4>
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
              Save a trip itinerary or complete a booking to earn your first travel points!
            </p>
            <Link to="/trip-planner" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: '800' }}>
              🚀 Start Planning
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            {transactions.map((tx, idx) => {
              const isTrip = tx.activity_type === 'trip_completed';
              const isReview = tx.activity_type === 'review_submitted';
              const icon = isTrip ? '🏆' : isReview ? '⭐' : '🧳';
              const formattedDate = tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

              return (
                <div
                  key={tx.id || idx}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx < transactions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isTrip ? '#dcfce7' : isReview ? '#fef3c7' : '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.35rem',
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                        {tx.description || tx.activity_type}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        📅 {formattedDate} • Ref: {tx.reference_id}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: '900',
                        color: '#16a34a',
                      }}
                    >
                      +{tx.points} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
