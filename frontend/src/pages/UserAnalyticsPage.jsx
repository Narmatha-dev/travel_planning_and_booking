import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import analyticsService from '../services/analyticsService';

export default function UserAnalyticsPage() {
  const { user, t, language } = useAppContext();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserAnalytics();
  }, []);

  const loadUserAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await analyticsService.getUserAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.warn('Could not load user analytics:', err.message);
      setError(err.message || 'Failed to load your personal travel analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await analyticsService.getUserAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.warn('Failed to refresh analytics:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', animation: 'bounce 1s infinite', marginBottom: '1rem' }}>📊</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
          {language === 'ta' ? 'உங்கள் பயணப் பகுப்பாய்வு ஏற்றப்படுகிறது...' : 'Loading your travel analytics...'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
          {language === 'ta' ? 'உண்மையான பயணத் தரவுகள் கணக்கிடப்படுகின்றன...' : 'Aggregating verified bookings, trips, and spending...'}
        </p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '16px', padding: '2.5rem', maxWidth: '540px', margin: '0 auto' }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#be123c', margin: '0.75rem 0' }}>
            {language === 'ta' ? 'பகுப்பாய்வை ஏற்றுவதில் சிக்கல்' : 'Analytics Unavailable'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadUserAnalytics} className="btn btn-primary btn-sm">
            {language === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const {
    tripSummary,
    spending,
    destinations,
    preferences,
    transport,
    accommodation,
    favorites,
    reviews,
    rewards,
    timeline = [],
  } = analytics || {};

  // Maximum spending amount for bar scaling in chart
  const maxMonthlySpending = Math.max(1, ...(spending?.monthlySpending || []).map((m) => m.amountINR));

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '2.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.6rem',
            }}
          >
            📊 {language === 'ta' ? 'தனிநபர் பயணப் பகுப்பாய்வு' : 'Personal Travel Intelligence'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 0.5rem 0', color: '#ffffff' }}>
            {language === 'ta' ? `${user?.full_name || 'பயணி'} அவர்களின் பயணப் பகுப்பாய்வு` : `${user?.full_name || 'Traveler'}'s Travel Analytics`}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', maxWidth: '600px' }}>
            {language === 'ta'
              ? 'உங்கள் உண்மையான பயணங்கள், வெற்றிகரமான கட்டணங்கள் மற்றும் விருப்பங்களின் நேரலை மேலோட்டம்.'
              : 'Real-time overview of your verified trips, successful bookings, spending, and travel style.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline"
            style={{
              background: '#ffffff',
              color: '#0284c7',
              border: 'none',
              fontWeight: '800',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {refreshing
              ? (language === 'ta' ? 'புதுப்பிக்கப்படுகிறது...' : 'Refreshing...')
              : (language === 'ta' ? '🔄 புதுப்பிக்கவும்' : '🔄 Refresh Data')}
          </button>
        </div>
      </div>

      {/* Top 7 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Trips */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'மொத்தப் பயணங்கள்' : 'Total Trips'}</span>
            <span style={{ fontSize: '1.25rem' }}>🧳</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', marginTop: '0.35rem' }}>
            {tripSummary?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700', marginTop: '0.25rem' }}>
            {tripSummary?.completed || 0} {language === 'ta' ? 'முடிந்தவை' : 'Completed'}
          </div>
        </div>

        {/* Total Bookings */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'முன்பதிவுகள்' : 'Bookings'}</span>
            <span style={{ fontSize: '1.25rem' }}>🎫</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0284c7', marginTop: '0.35rem' }}>
            {tripSummary?.completed + tripSummary?.upcoming || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', marginTop: '0.25rem' }}>
            {tripSummary?.upcoming || 0} {language === 'ta' ? 'வரவிருப்பவை' : 'Upcoming'}
          </div>
        </div>

        {/* Places Visited */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'சென்ற இடங்கள்' : 'Places Visited'}</span>
            <span style={{ fontSize: '1.25rem' }}>📍</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', marginTop: '0.35rem' }}>
            {destinations?.totalVisitedCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {destinations?.mostVisited ? destinations.mostVisited.name : (language === 'ta' ? 'இடங்கள் இல்லை' : 'None yet')}
          </div>
        </div>

        {/* Total Travel Spending */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'செலவுத் தொகை' : 'Total Spending'}</span>
            <span style={{ fontSize: '1.25rem' }}>💰</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{(spending?.totalSpendingINR || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            ${(spending?.totalSpendingUSD || 0).toLocaleString()} USD
          </div>
        </div>

        {/* Reviews Given */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'மதிப்புரைகள்' : 'Reviews Given'}</span>
            <span style={{ fontSize: '1.25rem' }}>⭐</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#f59e0b', marginTop: '0.35rem' }}>
            {reviews?.totalReviewsGiven || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            ⭐ {reviews?.averageRatingGiven ? `${reviews.averageRatingGiven}/5 Avg` : 'No reviews'}
          </div>
        </div>

        {/* Saved Places */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'சேமிக்கப்பட்டவை' : 'Saved Places'}</span>
            <span style={{ fontSize: '1.25rem' }}>❤️</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#e11d48', marginTop: '0.35rem' }}>
            {favorites?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {favorites?.savedPlaces || 0} {language === 'ta' ? 'இடங்கள்' : 'Places'} • {favorites?.savedHotels || 0} {language === 'ta' ? 'விடுதிகள்' : 'Hotels'}
          </div>
        </div>

        {/* Rewards */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>{language === 'ta' ? 'வெகுமதி புள்ளிகள்' : 'Travel Points'}</span>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#7c3aed', marginTop: '0.35rem' }}>
            {rewards?.points || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '700', marginTop: '0.25rem' }}>
            {rewards?.tier || 'Silver'} Tier
          </div>
        </div>
      </div>

      {/* Main 2-Column Analytics Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
        {/* LEFT COLUMN: Spending & Trip Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Trip Status Summary Card (Feature 1) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧳</span>
              <span>{language === 'ta' ? 'பயண நிலை சுருக்கம்' : 'Trip Status Breakdown'}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#16a34a' }}>✓ {language === 'ta' ? 'முடிந்த பயணங்கள்' : 'Completed Trips'}</span>
                  <span>{tripSummary?.completed || 0}</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tripSummary?.total > 0 ? (tripSummary.completed / tripSummary.total) * 100 : 0}%`, background: '#16a34a', borderRadius: '9999px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#0284c7' }}>⏳ {language === 'ta' ? 'வரவிருக்கும் பயணங்கள்' : 'Upcoming Trips'}</span>
                  <span>{tripSummary?.upcoming || 0}</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tripSummary?.total > 0 ? (tripSummary.upcoming / tripSummary.total) * 100 : 0}%`, background: '#0284c7', borderRadius: '9999px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#dc2626' }}>✕ {language === 'ta' ? 'ரத்து செய்யப்பட்டவை' : 'Cancelled Trips'}</span>
                  <span>{tripSummary?.cancelled || 0}</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tripSummary?.total > 0 ? (tripSummary.cancelled / tripSummary.total) * 100 : 0}%`, background: '#dc2626', borderRadius: '9999px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Spending Visual Chart (Feature 3) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📈</span>
              <span>{language === 'ta' ? 'மாதாந்திர பயணச் செலவுகள்' : 'Monthly Travel Spending'}</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {language === 'ta' ? 'உண்மையான வெற்றிகரமான கட்டணங்களின் அடிப்படையில் கணக்கிடப்பட்டது.' : 'Calculated strictly from verified completed payments.'}
            </p>

            {spending?.hasPayments ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '160px', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                {(spending?.monthlySpending || []).map((m) => {
                  const barHeightPct = maxMonthlySpending > 0 ? Math.max(8, Math.round((m.amountINR / maxMonthlySpending) * 100)) : 8;
                  const isSpent = m.amountINR > 0;
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        title={`${m.month}: ₹${m.amountINR.toLocaleString()}`}
                        style={{
                          width: '100%',
                          maxWidth: '28px',
                          height: isSpent ? `${barHeightPct}%` : '4px',
                          background: isSpent ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' : '#e2e8f0',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.3s ease',
                          cursor: isSpent ? 'pointer' : 'default',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem', fontWeight: isSpent ? '700' : '500' }}>
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '1.75rem' }}>💳</span>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                  {language === 'ta' ? 'இன்னும் கட்டணத் தரவு எதுவும் இல்லை.' : 'No payment data yet.'}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  {language === 'ta' ? 'உங்கள் முதல் பயணத்தை முன்பதிவு செய்து செலவுப் பகுப்பாய்வைக் காண்க.' : 'Complete your first booking to see your spending analytics.'}
                </p>
              </div>
            )}
          </div>

          {/* Spending by Service Category (Feature 2) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏷️</span>
              <span>{language === 'ta' ? 'சேவை வாரியாக செலவு' : 'Spending by Service Category'}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {(spending?.categories || []).map((cat) => (
                <div key={cat.label} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>{cat.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0' }}>
                    ₹{cat.amountINR.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '800' }}>
                    {cat.pct}% {language === 'ta' ? 'பங்கு' : 'share'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preferences, Destinations & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Destination & Preferences Analytics (Feature 4 & 5) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏔️</span>
              <span>{language === 'ta' ? 'பயண விருப்பங்கள் & இடங்கள்' : 'Travel Preferences & Destinations'}</span>
            </h3>

            {/* Most Visited Destination */}
            {destinations?.mostVisited ? (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>
                    👑 {language === 'ta' ? 'அதிகம் சென்ற இடம்' : 'Most Visited Destination'}
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: '900', color: '#14532d' }}>
                    {destinations.mostVisited.name}
                  </h4>
                </div>
                <div style={{ background: '#15803d', color: '#ffffff', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '800' }}>
                  {destinations.mostVisited.count} {language === 'ta' ? 'பயணங்கள்' : 'Trips'}
                </div>
              </div>
            ) : null}

            {/* Travel Preferences Distribution */}
            {preferences?.hasData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {preferences.preferences.map((pref) => (
                  <div key={pref.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#334155' }}>{pref.category}</span>
                      <span style={{ color: '#0284c7' }}>{pref.percentage}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pref.percentage}%`, background: '#0284c7', borderRadius: '9999px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: '600' }}>
                  {language === 'ta'
                    ? 'உங்கள் பயண விருப்பங்களைக் காண மேலும் சில பயணங்களை முடிக்கவும்.'
                    : 'Complete a few more trips to see your travel preferences.'}
                </p>
              </div>
            )}
          </div>

          {/* Transport & Accommodation Stats (Feature 6 & 7) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚆</span>
              <span>{language === 'ta' ? 'போக்குவரத்து & விடுதிப் பகுப்பாய்வு' : 'Transport & Accommodation Usage'}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.25rem' }}>🚆</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', marginTop: '0.2rem' }}>{transport?.train || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Train</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.25rem' }}>🚌</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', marginTop: '0.2rem' }}>{transport?.bus || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Bus</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.25rem' }}>🚗</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', marginTop: '0.2rem' }}>{transport?.car || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Car</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.25rem' }}>✈️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', marginTop: '0.2rem' }}>{transport?.flight || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Flight</div>
              </div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: '#0369a1', fontWeight: '700' }}>🏨 {language === 'ta' ? 'சராசரி விடுதி தங்கும் காலம்:' : 'Average Hotel Stay:'}</span>
              <strong style={{ color: '#0c4a6e' }}>{accommodation?.averageStayNights || 0} {language === 'ta' ? 'இரவுகள்' : 'nights'}</strong>
            </div>
          </div>

          {/* Travel Activity Timeline (Feature 11) */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🕒</span>
              <span>{language === 'ta' ? 'பயணச் செயல்பாடு காலவரிசை' : 'Recent Travel Activity Timeline'}</span>
            </h3>

            {timeline.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      {act.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{act.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>{act.subtitle}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{new Date(act.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  {language === 'ta' ? 'செயல்பாடுகள் எதுவும் இல்லை.' : 'No recent activity yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
