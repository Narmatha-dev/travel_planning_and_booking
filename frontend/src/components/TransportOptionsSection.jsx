import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import transportService from '../services/transportService';

const DEMO_PROMOS = [
  {
    id: 'promo_flight_air',
    title: 'Flight Deal — Domestic Skies',
    discountLabel: '₹1,200 OFF',
    discountAmount: 1200,
    applicableType: 'flight',
    transportLabel: '✈️ Flights',
    validity: 'Valid till 31 Oct 2026',
    code: 'FLYINDIA1200',
    description: 'Instant discount on domestic airfare across all metro & regional routes.',
  },
  {
    id: 'promo_train_express',
    title: 'Special Train Fare — Vande Bharat',
    discountLabel: '15% OFF',
    discountPercent: 15,
    applicableType: 'train',
    transportLabel: '🚆 Trains',
    validity: 'Valid till 15 Nov 2026',
    code: 'RAILEXPRESS15',
    description: 'Special concession on Superfast & Vande Bharat express train tickets.',
  },
  {
    id: 'promo_bus_luxury',
    title: 'Bus Travel Discount — Multi-Axle Volvo',
    discountLabel: '₹300 OFF',
    discountAmount: 300,
    applicableType: 'bus',
    transportLabel: '🚌 Buses',
    validity: 'Valid till 30 Nov 2026',
    code: 'BUSCOMFORT300',
    description: 'Comfortable sleeper & AC Volvo bus discount for intercity travel.',
  },
  {
    id: 'promo_cab_outstation',
    title: 'Weekend Cab Offer — Chauffeur Driven',
    discountLabel: '20% OFF',
    discountPercent: 20,
    applicableType: 'cab',
    transportLabel: '🚗 Cabs & Cars',
    validity: 'Valid on Weekends',
    code: 'ROADTRIP20',
    description: 'Flat discount on outstation AC sedan & SUV private chauffeur rentals.',
  },
];

export default function TransportOptionsSection({
  origin,
  destination,
  distanceKm,
  duration,
  onContinueToTripPlanning,
}) {
  const { selectedTransport, setSelectedTransport } = useAppContext();
  const navigate = useNavigate();

  const [transportData, setTransportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('cab');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const oLat = origin?.latitude;
  const oLng = origin?.longitude;
  const dLat = destination?.latitude;
  const dLng = destination?.longitude;

  // Calculate transport costs dynamically based on real road distance
  useEffect(() => {
    let isMounted = true;

    async function computeTransport() {
      let dist = parseFloat(distanceKm);
      if (isNaN(dist) && oLat && oLng && dLat && dLng) {
        try {
          const route = await locationService.getRouteDirections({
            originLat: oLat,
            originLng: oLng,
            destLat: dLat,
            destLng: dLng,
          });
          dist = parseFloat(route?.distance_km || 320);
        } catch {
          dist = 320;
        }
      } else if (isNaN(dist)) {
        dist = 320;
      }

      if (!isMounted) return;

      // Dynamic multi-modal options calculation based on actual distance
      const calculated = {
        train: {
          type: 'train',
          title: 'Superfast Express Rail (Vande Bharat / Rajdhani)',
          duration: `${Math.floor(dist / 65)} hrs ${Math.round((dist % 65) * 0.8)} min`,
          price: Math.max(450, Math.round(dist * 1.8)),
          price_display: `₹${Math.max(450, Math.round(dist * 1.8)).toLocaleString('en-IN')}`,
          available_routes: '2-4 Daily Scheduled Express Trains',
          distance_km: dist,
          distance_label: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
          icon: '🚆',
        },
        bus: {
          type: 'bus',
          title: 'AC Multi-Axle Volvo Sleeper Coach',
          duration: `${Math.floor(dist / 50)} hrs ${Math.round((dist % 50) * 1.2)} min`,
          price: Math.max(350, Math.round(dist * 2.2)),
          price_display: `₹${Math.max(350, Math.round(dist * 2.2)).toLocaleString('en-IN')}`,
          available_routes: '6+ Daily Departures (Evening & Night)',
          distance_km: dist,
          distance_label: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
          icon: '🚌',
        },
        flight: {
          type: 'flight',
          title: 'Domestic Non-Stop Airline (Air India / IndiGo)',
          duration: `${((dist / 750) + 1.2).toFixed(1)} hrs`,
          price: Math.max(2800, Math.round(dist * 6.5)),
          price_display: `₹${Math.max(2800, Math.round(dist * 6.5)).toLocaleString('en-IN')}`,
          available_routes: 'Daily Direct Flights Available',
          distance_km: dist,
          distance_label: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
          icon: '✈️',
        },
        cab: {
          type: 'cab',
          title: 'Private AC Chauffeur Driven Sedan / SUV',
          duration: `${Math.floor(dist / 60)} hrs ${Math.round((dist % 60) * 0.9)} min`,
          price: Math.max(1200, Math.round(dist * 13.5)),
          price_display: `₹${Math.max(1200, Math.round(dist * 13.5)).toLocaleString('en-IN')}`,
          available_routes: 'Instant Door-to-Door Private Pickup',
          distance_km: dist,
          distance_label: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`,
          icon: '🚗',
        },
      };

      setTransportData(calculated);
      setLoading(false);
    }

    computeTransport();

    return () => {
      isMounted = false;
    };
  }, [distanceKm, oLat, oLng, dLat, dLng]);

  const handleSelectOption = (typeKey) => {
    setSelectedType(typeKey);
    const chosen = transportData?.[typeKey];
    if (chosen) {
      setSelectedTransport({
        ...chosen,
        originCity: origin?.city || 'Current Location',
        destinationName: destination?.name || 'Destination',
        selectedAt: new Date().toISOString(),
      });
    }
  };

  const handleApplyPromo = (promo) => {
    if (appliedPromo?.id === promo.id) {
      setAppliedPromo(null); // toggle off
    } else {
      setAppliedPromo(promo);
      setSelectedType(promo.applicableType);
      handleSelectOption(promo.applicableType);
    }
  };

  const currentOption = transportData?.[selectedType] || transportData?.cab;
  const baseCost = currentOption?.price || 2500;

  // Calculate discount
  let discountValue = 0;
  if (appliedPromo) {
    if (appliedPromo.discountAmount) {
      discountValue = appliedPromo.discountAmount;
    } else if (appliedPromo.discountPercent) {
      discountValue = Math.round((baseCost * appliedPromo.discountPercent) / 100);
    }
  }

  const finalTotal = Math.max(0, baseCost - discountValue);

  const handleContinuePlanning = () => {
    if (onContinueToTripPlanning) {
      onContinueToTripPlanning({
        ...currentOption,
        finalTotal,
        appliedPromo,
      });
    } else {
      navigate(
        `/trip-planner?destination=${encodeURIComponent(destination?.city || destination?.name || 'Ooty')}&origin=${encodeURIComponent(origin?.city || 'Chennai')}&transport=${selectedType}`
      );
    }
  };

  return (
    <div className="transport-section-container" style={{ padding: '0.5rem 0' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="eyebrow">Travel Transport Options</span>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0' }}>
          Choose Your Transport
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Compare travel time, live schedules, and estimated fare from <strong>{origin?.city || 'Your Location'}</strong> to <strong>{destination?.name || 'Destination'}</strong>.
        </p>
      </div>

      {/* 4 Multi-Modal Transport Cards */}
      {transportData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {['train', 'bus', 'flight', 'cab'].map((typeKey) => {
            const opt = transportData[typeKey];
            const isSelected = selectedType === typeKey;

            return (
              <div
                key={typeKey}
                onClick={() => handleSelectOption(typeKey)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)' : '#ffffff',
                  border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                    }}
                  >
                    ✓ Selected
                  </span>
                )}

                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{opt.icon}</div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    {typeKey.toUpperCase()}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {opt.title}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <div>⏱️ <strong>Est. Time:</strong> {opt.duration}</div>
                    <div style={{ marginTop: '0.2rem', color: '#0284c7' }}>🛣️ {opt.available_routes}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Estimated Fare</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.75rem' }}>
                    {opt.price_display}
                  </div>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: isSelected ? '#0284c7' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Selected' : 'View Options'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature 6: 🔥 Travel Promos / Demo Offers Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1.5px solid #fde68a',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🔥</span>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#92400e' }}>
                Travel Promos & Discounts
              </h4>
              <span style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #facc15', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>
                Demo Offer
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', color: '#b45309', fontSize: '0.85rem' }}>
              Apply verified promotional concessions on your selected transport.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {DEMO_PROMOS.map((promo) => {
            const isApplied = appliedPromo?.id === promo.id;

            return (
              <div
                key={promo.id}
                style={{
                  background: '#ffffff',
                  border: isApplied ? '2px solid #ca8a04' : '1px solid #fcd34d',
                  borderRadius: '14px',
                  padding: '1rem',
                  boxShadow: '0 2px 8px rgba(202, 138, 4, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>
                        {promo.title}
                      </span>
                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Demo Offer
                      </span>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '900', whiteSpace: 'nowrap' }}>
                      {promo.discountLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {promo.description}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: '700', marginBottom: '0.75rem' }}>
                    🎯 {promo.transportLabel} • {promo.validity}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPromo(promo)}
                  style={{
                    background: isApplied ? '#16a34a' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {isApplied ? '✓ Promo Applied' : `Apply Deal (${promo.code})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 7: Trip Summary Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '2px solid #0284c7',
          padding: '1.75rem',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ✨ TRIP SUMMARY OVERVIEW
            </span>
            <h4 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
              {destination?.name || 'Selected Destination'} Journey
            </h4>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Estimated Total (Transport)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0284c7' }}>
              ₹{finalTotal.toLocaleString()}
            </div>
            {discountValue > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '800' }}>
                🎉 You save ₹{discountValue.toLocaleString()} with {appliedPromo?.code}
              </span>
            )}
          </div>
        </div>

        {/* Summary Grid Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>📍 Starting From:</span>
            <div style={{ fontWeight: '800', color: '#0f172a' }}>{origin?.city || 'Current Location'}</div>
          </div>

          <div>
            <span style={{ color: '#64748b' }}>🗺️ Destination:</span>
            <div style={{ fontWeight: '800', color: '#0f172a' }}>{destination?.name || 'Destination'}</div>
          </div>

          <div>
            <span style={{ color: '#64748b' }}>📏 Distance:</span>
            <div style={{ fontWeight: '800', color: '#0284c7' }}>{distanceKm ? `${distanceKm} km` : 'Calculated Live'}</div>
          </div>

          <div>
            <span style={{ color: '#64748b' }}>⏱️ Travel Time:</span>
            <div style={{ fontWeight: '800', color: '#16a34a' }}>{currentOption?.duration || duration || '2-4 hrs'}</div>
          </div>

          <div>
            <span style={{ color: '#64748b' }}>🚗 Transport Mode:</span>
            <div style={{ fontWeight: '800', color: '#0f172a' }}>{currentOption?.icon} {selectedType.toUpperCase()}</div>
          </div>

          <div>
            <span style={{ color: '#64748b' }}>🎁 Promo Code:</span>
            <div style={{ fontWeight: '800', color: appliedPromo ? '#16a34a' : '#94a3b8' }}>
              {appliedPromo ? appliedPromo.code : 'None applied'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinuePlanning}
          className="btn btn-primary full-width"
          style={{
            padding: '0.9rem',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '1rem',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
            cursor: 'pointer',
          }}
        >
          Continue Planning This Journey →
        </button>
      </div>
    </div>
  );
}
