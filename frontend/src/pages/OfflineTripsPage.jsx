import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import offlineStorageService from '../services/offlineStorageService';
import OfflineTripViewer from '../components/OfflineTripViewer';

export default function OfflineTripsPage() {
  const { t, isOnline, user } = useAppContext();
  const [offlineTrips, setOfflineTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({ tripCount: 0, totalSizeKb: 0 });

  const loadOfflineTrips = async () => {
    setLoading(true);
    try {
      const uId = user?.id || 3;
      const trips = await offlineStorageService.getOfflineTrips(uId);
      setOfflineTrips(trips);
      const stats = await offlineStorageService.getStorageStats(uId);
      setStorageStats(stats);
      if (trips.length > 0 && !selectedTrip) {
        setSelectedTrip(trips[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineTrips();
  }, [user]);

  const handleRemoveTrip = async (e, tripId) => {
    e.stopPropagation();
    if (window.confirm('Remove this trip from offline storage? (This does not delete your server booking)')) {
      await offlineStorageService.removeOfflineTrip(tripId, user?.id || 3);
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
      await loadOfflineTrips();
    }
  };

  return (
    <div style={{ minHeight: '85vh', padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '2rem' }}>📱</span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em' }}>
              {t('offline.title', 'Offline Trips')}
            </h1>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '0.3rem 0.8rem',
                borderRadius: '9999px',
                background: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isOnline ? '#22c55e' : '#ef4444',
                border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {isOnline ? '🟢 Online' : '📴 Offline Mode'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem' }}>
            {t('offline.subtitle', 'Access your saved itineraries, stay vouchers, packing lists, and safety contacts without internet.')}
          </p>
        </div>

        {storageStats.tripCount > 0 && (
          <div
            style={{
              background: 'rgba(241, 245, 249, 0.8)',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#334155',
              fontWeight: '600',
            }}
          >
            💾 {t('offline.storageUsage', 'Storage Used')}: <strong>{storageStats.totalSizeKb} KB</strong> ({storageStats.tripCount} {storageStats.tripCount === 1 ? 'trip' : 'trips'})
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading offline data...
        </div>
      ) : offlineTrips.length === 0 ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))',
            border: '2px dashed #cbd5e1',
            borderRadius: '24px',
            padding: '4rem 2rem',
            textAlign: 'center',
            maxWidth: '650px',
            margin: '2rem auto',
          }}
        >
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>📴</span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            {t('offline.noOfflineTrips', 'No trips saved for offline access yet.')}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {t('offline.savePrompt', "Save an upcoming trip from 'My Trips' to view it offline anywhere without an internet connection.")}
          </p>
          <a
            href="/my-trips"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 10px 20px rgba(2, 132, 199, 0.25)',
            }}
          >
            📋 Go to My Trips
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>
          {/* Trip Selection Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', margin: '0 0 0.25rem 0' }}>
              Saved Offline Trips ({offlineTrips.length})
            </h3>
            {offlineTrips.map((tr) => (
              <div
                key={tr.id}
                onClick={() => setSelectedTrip(tr)}
                style={{
                  background: selectedTrip?.id === tr.id ? 'linear-gradient(135deg, #0f172a, #1e293b)' : '#ffffff',
                  color: selectedTrip?.id === tr.id ? '#ffffff' : '#0f172a',
                  border: selectedTrip?.id === tr.id ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: selectedTrip?.id === tr.id ? '0 10px 25px rgba(15, 23, 42, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.05rem' }}>{tr.destination}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: tr.syncStatus === 'pending_sync' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                      color: tr.syncStatus === 'pending_sync' ? '#ca8a04' : '#16a34a',
                    }}
                  >
                    {tr.syncStatus === 'pending_sync' ? '🟡 Pending' : '🟢 Synced'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: selectedTrip?.id === tr.id ? '#94a3b8' : '#64748b', marginBottom: '0.6rem' }}>
                  📅 {tr.dates?.start || 'Upcoming'} • {tr.dates?.durationDays || 3} Days
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: selectedTrip?.id === tr.id ? '#cbd5e1' : '#94a3b8' }}>
                  <span>💾 ~{tr.estimatedSizeKb || 15} KB</span>
                  <button
                    onClick={(e) => handleRemoveTrip(e, tr.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    🗑️ {t('offline.removeOffline', 'Remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Offline Trip Details Viewer */}
          <div>
            {selectedTrip && (
              <OfflineTripViewer
                trip={selectedTrip}
                onUpdate={(updated) => {
                  setSelectedTrip(updated);
                  loadOfflineTrips();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
