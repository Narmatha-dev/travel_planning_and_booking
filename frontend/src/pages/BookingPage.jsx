import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppContext();

  const packageId = searchParams.get('packageId');
  const initialTravelers = parseInt(searchParams.get('travelers') || '2', 10);
  const initialDate = searchParams.get('date') || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [pkg, setPkg] = useState(null);
  const [loadingPkg, setLoadingPkg] = useState(Boolean(packageId));
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.full_name || user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '+1-555-0199',
    travelDate: initialDate,
    numTravelers: initialTravelers,
    specialRequests: '',
  });

  // Load package if packageId provided
  useEffect(() => {
    async function loadPackage() {
      if (!packageId) return;
      setLoadingPkg(true);
      try {
        const data = await packageService.getPackageDetails(packageId);
        setPkg(data);
      } catch (err) {
        console.warn('Failed to load package for booking:', err.message);
      } finally {
        setLoadingPkg(false);
      }
    }
    loadPackage();
  }, [packageId]);

  // Update user profile fields if user object loaded late
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.full_name || user.name || '',
        email: prev.email || user.email || '',
        phoneNumber: prev.phoneNumber || user.phone_number || '+1-555-0199',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTravelersChange = (delta) => {
    setFormData((prev) => {
      const nextCount = Math.max(1, Math.min(pkg?.max_group_size || 14, prev.numTravelers + delta));
      return { ...prev, numTravelers: nextCount };
    });
  };

  // Price calculations
  const effectivePrice = pkg ? Number(pkg.discount_price || pkg.base_price) : 1899;
  const basePrice = pkg ? Number(pkg.base_price) : 2199;
  const hasDiscount = pkg && pkg.discount_price && Number(pkg.discount_price) < Number(pkg.base_price);
  const perPersonSavings = hasDiscount ? (basePrice - effectivePrice) : 0;
  const subtotal = effectivePrice * formData.numTravelers;
  const totalSavings = perPersonSavings * formData.numTravelers;
  const taxesAndFees = Math.round(subtotal * 0.08);
  const finalTotal = subtotal + taxesAndFees;

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please provide your full name and contact email');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const bookingPayload = {
        userId: user?.id || 3,
        packageId: pkg?.id || (packageId ? parseInt(packageId, 10) : null),
        destinationId: pkg?.destination_id || 1,
        bookingType: 'package',
        travelDate: formData.travelDate,
        numTravelers: formData.numTravelers,
        totalAmount: basePrice * formData.numTravelers,
        discountAmount: totalSavings,
        finalAmount: finalTotal,
        specialRequests: formData.specialRequests,
      };

      const result = await bookingService.createBooking(bookingPayload);
      setBookingSuccess(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete booking reservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPkg) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.3rem', color: '#0284c7', fontWeight: '600' }}>
          ✈️ Preparing your booking details...
        </div>
      </div>
    );
  }

  // Booking Confirmation Success Screen
  if (bookingSuccess) {
    return (
      <section className="section page-section" style={{ paddingTop: '3rem', minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              Booking Confirmed
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0.75rem 0 0.5rem 0' }}>
              Your Trip is Reserved!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>
              We've sent the confirmation receipt and itinerary package to <strong>{formData.email}</strong>.
            </p>

            {/* Booking Details Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '1.5rem',
                textAlign: 'left',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Reference:</span>
                <strong style={{ color: '#0284c7' }}>{bookingSuccess.bookingReference || 'BK-2026-CONFIRMED'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Package:</span>
                <strong style={{ color: '#0f172a' }}>{pkg?.title || 'Selected Travel Package'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Travel Date:</span>
                <strong style={{ color: '#0f172a' }}>{formData.travelDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Guests:</span>
                <strong style={{ color: '#0f172a' }}>{formData.numTravelers} Traveler{formData.numTravelers === 1 ? '' : 's'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', fontSize: '1.1rem' }}>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>Amount Paid:</span>
                <strong style={{ color: '#16a34a' }}>${finalTotal.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-trips" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                View in My Trips
              </Link>
              <Link to="/packages" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                Browse More Packages
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container booking-layout">
        {/* Main Booking Form Column */}
        <div className="booking-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '2.25rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
          <span className="eyebrow">Complete Your Reservation</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
            {pkg ? pkg.title : 'Selected Travel Package'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
            📍 {pkg ? `${pkg.destination_name} (${pkg.destination_city}, ${pkg.destination_country})` : 'All-Inclusive Escape'}
          </p>

          {/* Quick Package Features Pill Row */}
          {pkg && (
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.75rem',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
              }}
            >
              <div><strong>⏱️ Duration:</strong> {pkg.duration_days} Days / {pkg.duration_nights || Math.max(1, pkg.duration_days - 1)} Nights</div>
              <div><strong>⚡ Tier:</strong> <span style={{ textTransform: 'capitalize' }}>{pkg.package_type}</span></div>
              <div><strong>👥 Max Group:</strong> Up to {pkg.max_group_size || 14}</div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form className="booking-form" onSubmit={handleSubmitBooking}>
            {/* Travel Date & Guests */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  📅 Departure Date
                </label>
                <input
                  type="date"
                  name="travelDate"
                  value={formData.travelDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  👥 Guests
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleTravelersChange(-1)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span style={{ flex: 1, textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>
                    {formData.numTravelers} {formData.numTravelers === 1 ? 'Traveler' : 'Travelers'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTravelersChange(1)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Lead Traveler Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Alex Reed"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. alex.reed@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            {/* Special Requests */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                Special Requests or Dietary Preferences
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="3"
                placeholder="E.g. Vegetarian meal preference, high-floor room with scenic view, anniversary celebration..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary full-width"
              style={{
                padding: '0.9rem',
                fontSize: '1rem',
                fontWeight: '700',
                borderRadius: '10px',
              }}
            >
              {submitting ? 'Processing Reservation...' : `Confirm & Book (${finalTotal.toLocaleString()})`}
            </button>
          </form>
        </div>

        {/* Aside: Price Summary & Inclusions */}
        <aside className="price-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            Price Summary
          </h3>

          <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.92rem', color: '#475569' }}>
            <span>${effectivePrice.toLocaleString()} × {formData.numTravelers} guest{formData.numTravelers === 1 ? '' : 's'}</span>
            <strong style={{ color: '#0f172a' }}>${subtotal.toLocaleString()}</strong>
          </div>

          {hasDiscount && (
            <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.92rem', color: '#16a34a', fontWeight: '600' }}>
              <span>Special Package Discount</span>
              <strong>−${totalSavings.toLocaleString()}</strong>
            </div>
          )}

          <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.92rem', color: '#475569' }}>
            <span>Taxes & Tourism Fees (8%)</span>
            <strong style={{ color: '#0f172a' }}>${taxesAndFees.toLocaleString()}</strong>
          </div>

          <div
            className="price-row total"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid #f1f5f9',
              paddingTop: '1rem',
              marginTop: '1rem',
              fontSize: '1.25rem',
              fontWeight: '800',
              color: '#0f172a',
            }}
          >
            <span>Total</span>
            <strong style={{ color: '#0284c7' }}>${finalTotal.toLocaleString()}</strong>
          </div>

          {/* Included Services Bullet List */}
          {pkg?.inclusions && (
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ✅ Included in this booking:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#334155' }}>
                {(Array.isArray(pkg.inclusions) ? pkg.inclusions : []).slice(0, 4).map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#16a34a' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            Free cancellation up to 48 hours prior to departure date.
          </div>
        </aside>
      </div>
    </section>
  );
}
