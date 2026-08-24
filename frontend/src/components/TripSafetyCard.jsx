import React, { useState, useEffect } from 'react';
import safetyService from '../services/safetyService';
import { useAppContext } from '../context/AppContext';

export default function TripSafetyCard({ trip, onOpenRouteModal }) {
  const { t } = useAppContext();
  const [safetyInfo, setSafetyInfo] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract destination coordinates or name
  const destName = trip?.destination_name || trip?.destination?.name || trip?.title || 'Trip Destination';
  const destCountry = trip?.destination_country || trip?.destination?.country || 'India';
  const destLat = trip?.destination?.latitude || trip?.latitude || 13.0604;
  const destLng = trip?.destination?.longitude || trip?.longitude || 80.2518;

  useEffect(() => {
    let isMounted = true;

    async function loadTripSafetyData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch country emergency numbers
        const emergencyData = await safetyService.getEmergencyNumbers({
          country: destCountry,
          latitude: destLat,
          longitude: destLng,
        });

        // 2. Fetch nearest emergency facilities for the destination
        const placesData = await safetyService.getNearbySafetyPlaces({
          latitude: destLat,
          longitude: destLng,
          radiusKm: 25,
          limit: 6,
        });

        if (isMounted) {
          setSafetyInfo(emergencyData?.emergency_numbers || null);
          setNearbyPlaces(placesData?.places || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load trip safety information.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTripSafetyData();

    return () => {
      isMounted = false;
    };
  }, [destName, destCountry, destLat, destLng]);

  const nearestHospital = nearbyPlaces.find((p) => p.category === 'hospital');
  const nearestPolice = nearbyPlaces.find((p) => p.category === 'police');

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1.5px solid #bbf7d0',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(22, 101, 52, 0.08)',
        marginTop: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid #dcfce7',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🛡️
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#166534', fontWeight: '800' }}>
              {t('safety.tripSafetyTitle', 'Trip Safety & Emergency Contacts')}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#475569' }}>
              {t('safety.tripSafetySubtitle', 'Verified emergency services for')} <strong>{destName}</strong> ({destCountry})
            </p>
          </div>
        </div>

        <span
          style={{
            background: '#22c55e',
            color: '#ffffff',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: '800',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          ✓ {t('safety.verifiedProtection', 'Verified Safety Active')}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#166534', fontWeight: '600' }}>
          ⏳ {t('safety.loadingTripSafety', 'Loading trip emergency services...')}
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '12px', color: '#b91c1c', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Emergency Numbers Quick Grid */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚨</span> {t('safety.emergencyNumbers', 'Official Emergency Hotlines')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <a
                href={`tel:${safetyInfo?.universal || '112'}`}
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span>🚨 Universal</span>
                <span style={{ fontSize: '1.05rem' }}>{safetyInfo?.universal || '112'}</span>
              </a>

              <a
                href={`tel:${safetyInfo?.police || '100'}`}
                style={{
                  background: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span>🚓 Police</span>
                <span style={{ fontSize: '1.05rem' }}>{safetyInfo?.police || '100'}</span>
              </a>

              <a
                href={`tel:${safetyInfo?.ambulance || '108'}`}
                style={{
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span>🏥 Ambulance</span>
                <span style={{ fontSize: '1.05rem' }}>{safetyInfo?.ambulance || '108'}</span>
              </a>

              <a
                href={`tel:${safetyInfo?.fire || '101'}`}
                style={{
                  background: '#ffedd5',
                  border: '1px solid #fed7aa',
                  color: '#c2410c',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span>🚒 Fire</span>
                <span style={{ fontSize: '1.05rem' }}>{safetyInfo?.fire || '101'}</span>
              </a>
            </div>

            {safetyInfo?.notes && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                ℹ️ {safetyInfo.notes}
              </p>
            )}
          </div>

          {/* Nearest Hospital & Police */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏥</span> {t('safety.nearestHospital', 'Nearest Hospital & Trauma Care')}
              </div>

              {nearestHospital ? (
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#1e293b' }}>
                    {nearestHospital.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    📍 {nearestHospital.address}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                    <span style={{ background: '#f1f5f9', color: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      📍 {nearestHospital.distance_label}
                    </span>
                    {nearestHospital.is_open_24_7 && (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        🕒 24/7 ER
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {t('safety.noHospitalFound', 'Verified emergency services available via 112.')}
                </div>
              )}
            </div>

            {nearestHospital && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {nearestHospital.phone && (
                  <a
                    href={`tel:${nearestHospital.phone}`}
                    style={{
                      flex: 1,
                      background: '#f1f5f9',
                      color: '#0f172a',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      textDecoration: 'none',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    📞 Call Hospital
                  </a>
                )}
                {onOpenRouteModal && (
                  <button
                    onClick={() => onOpenRouteModal(nearestHospital)}
                    style={{
                      flex: 1.2,
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🗺️ Fastest Route
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
