import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import offlineStorageService from '../services/offlineStorageService';

export default function OfflineTripViewer({ trip, onUpdate, onClose }) {
  const { t, isOnline } = useAppContext();
  const [activeTab, setActiveTab] = useState('itinerary');
  const [currentTrip, setCurrentTrip] = useState(trip);
  const [syncing, setSyncing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!currentTrip) return null;

  const handleTogglePacking = async (item) => {
    try {
      const newStatus = !item.is_packed;
      const updated = await offlineStorageService.updateOfflinePackingItem(
        currentTrip.id,
        item.id,
        newStatus,
        currentTrip.userId || 3
      );
      setCurrentTrip(updated);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.warn('Failed to update packing offline:', err);
    }
  };

  const handleToggleChecklist = async (item) => {
    try {
      const newStatus = !item.is_completed;
      const updated = await offlineStorageService.updateOfflineChecklistItem(
        currentTrip.id,
        item.id,
        newStatus,
        currentTrip.userId || 3
      );
      setCurrentTrip(updated);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.warn('Failed to update checklist offline:', err);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      await offlineStorageService.syncPendingChanges(currentTrip.userId || 3);
      const reloaded = await offlineStorageService.getOfflineTripById(currentTrip.id, currentTrip.userId || 3);
      if (reloaded) {
        setCurrentTrip(reloaded);
        if (onUpdate) onUpdate(reloaded);
      }
    } finally {
      setSyncing(false);
    }
  };

  const copyAddress = (address, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Dynamic progress stats
  const packingItems = currentTrip.packingChecklist || [];
  const packedCount = packingItems.filter((i) => i.is_packed).length;
  const packingPct = packingItems.length > 0 ? Math.round((packedCount / packingItems.length) * 100) : 0;

  const checklistItems = currentTrip.travelChecklist || [];
  const completedChkCount = checklistItems.filter((i) => i.is_completed).length;
  const checklistPct = checklistItems.length > 0 ? Math.round((completedChkCount / checklistItems.length) * 100) : 0;

  return (
    <div
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '24px',
        padding: '1.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.6rem' }}>📴</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              {currentTrip.destination}
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: currentTrip.syncStatus === 'pending_sync' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: currentTrip.syncStatus === 'pending_sync' ? '#fde047' : '#4ade80',
                border: `1px solid ${currentTrip.syncStatus === 'pending_sync' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
              }}
            >
              {currentTrip.syncStatus === 'pending_sync' ? `🟡 ${t('offline.pendingSync', 'Pending Sync')}` : `🟢 ${t('offline.synced', 'Synced')}`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            📅 {currentTrip.dates?.start || 'Upcoming'} – {currentTrip.dates?.end || ''} • {currentTrip.dates?.durationDays || 3} Days • Ref: {currentTrip.bookingReference}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isOnline && currentTrip.syncStatus === 'pending_sync' && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {syncing ? t('offline.syncing', 'Syncing...') : `🔄 ${t('offline.synced', 'Sync Now')}`}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Offline Disclaimer Banner */}
      <div
        style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '14px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.84rem',
          color: '#fef08a',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <span>💡</span>
        <span>
          {t('offline.offlineBanner', 'Offline Mode Active — Saved itineraries, stay details, and offline checklist tracking are available.')}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'itinerary', label: '🗺️ Itinerary', icon: '🗺️' },
          { id: 'stay', label: '🏨 Stay & Transport', icon: '🏨' },
          { id: 'packing', label: `🎒 Packing (${packedCount}/${packingItems.length})`, icon: '🎒' },
          { id: 'checklist', label: `📋 Checklist (${completedChkCount}/${checklistItems.length})`, icon: '📋' },
          { id: 'safety', label: '🛡️ Emergency Info', icon: '🛡️' },
          { id: 'weather', label: '🌦️ Cached Weather', icon: '🌦️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '12px',
              border: activeTab === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Itinerary & Saved Locations */}
      {activeTab === 'itinerary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {currentTrip.itinerary?.map((day, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
                    DAY {day.dayNumber || idx + 1}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '1rem', fontWeight: '700', color: '#f1f5f9' }}>
                  {day.title}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {day.activities?.map((act, actIdx) => (
                    <li key={actIdx}>{act}</li>
                  ))}
                </ul>
                {day.notes && (
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    📌 {day.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Saved Addresses Box */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8' }}>
              📍 Saved Offline Addresses & Locations
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {currentTrip.savedLocations?.map((loc, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f8fafc', marginBottom: '0.2rem' }}>
                    {loc.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    {loc.address}
                  </div>
                  <button
                    onClick={() => copyAddress(loc.address, idx)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      border: 'none',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedIndex === idx ? '✓ Copied' : '📋 Copy Address'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stay & Transport Details */}
      {activeTab === 'stay' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🏨 Hotel & Stay Voucher
            </h4>
            <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.7' }}>
              <div><strong>Name:</strong> {currentTrip.hotel?.name || 'Hotel Stay'}</div>
              <div><strong>Address:</strong> {currentTrip.hotel?.address}</div>
              <div><strong>Phone:</strong> {currentTrip.hotel?.phone}</div>
              <div><strong>Check-In:</strong> {currentTrip.hotel?.checkIn}</div>
              <div><strong>Check-Out:</strong> {currentTrip.hotel?.checkOut}</div>
              <div><strong>Confirmation:</strong> {currentTrip.hotel?.bookingRef}</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🚆 Transport Booking Details
            </h4>
            <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.7' }}>
              <div><strong>Type:</strong> {currentTrip.transport?.title || currentTrip.transport?.type?.toUpperCase()}</div>
              <div><strong>Pickup:</strong> {currentTrip.transport?.pickupLocation}</div>
              <div><strong>Drop:</strong> {currentTrip.transport?.dropLocation}</div>
              <div><strong>Departure:</strong> {currentTrip.transport?.departureTime}</div>
              <div><strong>Duration:</strong> {currentTrip.transport?.durationText}</div>
              <div><strong>Status:</strong> <span style={{ color: '#4ade80', fontWeight: '700' }}>Confirmed</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Offline Packing Checklist */}
      {activeTab === 'packing' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Packed: <strong>{packedCount}</strong> of <strong>{packingItems.length}</strong> items ({packingPct}%)
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ height: '100%', width: `${packingPct}%`, background: 'linear-gradient(90deg, #38bdf8, #3b82f6)', transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
            {packingItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleTogglePacking(item)}
                style={{
                  background: item.is_packed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${item.is_packed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.is_packed)}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: item.is_packed ? '#86efac' : '#f8fafc', textDecoration: item.is_packed ? 'line-through' : 'none' }}>
                    {item.item_name || item.itemName} {item.quantity > 1 && `(x${item.quantity})`}
                  </div>
                  {item.reason && (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {item.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Interactive Offline Travel Checklist */}
      {activeTab === 'checklist' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Readiness: <strong>{completedChkCount}</strong> of <strong>{checklistItems.length}</strong> tasks ({checklistPct}%)
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ height: '100%', width: `${checklistPct}%`, background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
            {checklistItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleToggleChecklist(item)}
                style={{
                  background: item.is_completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${item.is_completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.is_completed)}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: item.is_completed ? '#6ee7b7' : '#f8fafc', textDecoration: item.is_completed ? 'line-through' : 'none' }}>
                    {item.item_name || item.itemName}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Safety & Emergency Contacts */}
      {activeTab === 'safety' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#f87171' }}>
              🚨 Universal Emergency Helplines
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Universal Helpline</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171' }}>112</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Police</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171' }}>100</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ambulance</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171' }}>108</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.6rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tourist Helpline</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171' }}>1363</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: '#38bdf8' }}>
              🛡️ Saved Trusted Contacts
            </h4>
            {currentTrip.safety?.emergencyContacts?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentTrip.safety.emergencyContacts.map((c, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f1f5f9' }}>
                      {c.name} ({c.relationship}) {c.isPrimary && '⭐'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#38bdf8' }}>{c.phone}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
                Hotel front-desk contact: {currentTrip.hotel?.phone || '+91 98400 12345'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Cached Weather & Cost */}
      {activeTab === 'weather' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '1rem', color: '#38bdf8' }}>
              🌦️ Cached Weather Snapshot
            </h4>
            {currentTrip.cachedWeather?.available ? (
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.4rem' }}>
                  {currentTrip.cachedWeather.temperature}°C • {currentTrip.cachedWeather.condition}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.6' }}>
                  <div>Rain Chance: <strong>{currentTrip.cachedWeather.rainProbability}%</strong></div>
                  <div>Wind Speed: <strong>{currentTrip.cachedWeather.windSpeed} km/h</strong></div>
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {currentTrip.cachedWeather.disclaimer}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                {t('offline.weatherDisclaimer', 'Weather unavailable offline. Reconnect to check live forecast.')}
              </p>
            )}
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '1rem', color: '#38bdf8' }}>
              💵 Estimated Trip Cost
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ade80', marginBottom: '0.4rem' }}>
              ₹{currentTrip.estimatedCost?.total?.toLocaleString() || '4,500'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.6' }}>
              <div>Transport: ₹{currentTrip.estimatedCost?.transport || 1200}</div>
              <div>Stay: ₹{currentTrip.estimatedCost?.stay || 2200}</div>
              <div>Food & Misc: ₹{currentTrip.estimatedCost?.food || 800}</div>
              <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                {t('offline.costDisclaimer', 'Previously calculated estimate. Live prices paused offline.')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
