import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import packageService from '../services/packageService';

const packageTypeColors = {
  standard: { bg: '#e0f2fe', color: '#0369a1', label: 'Standard Package' },
  premium: { bg: '#fef3c7', color: '#b45309', label: 'Premium Package' },
  luxury: { bg: '#fae8ff', color: '#86198f', label: 'Luxury Elite' },
  custom: { bg: '#dcfce7', color: '#15803d', label: 'Custom Itinerary' },
};

const defaultItineraryItems = [
  { day: 1, title: 'Arrival, Airport Meet & Check-In', desc: 'Personal airport greeting, VIP transfer, hotel check-in, and welcome evening briefing.' },
  { day: 2, title: 'Guided City & Cultural Heritage Tour', desc: 'Full-day exploration of iconic landmarks, architectural gems, and local delicacies.' },
  { day: 3, title: 'Scenic Excursions & Signature Activity', desc: 'Immersive guided outdoor experience with photo opportunities and local tastings.' },
  { day: 4, title: 'Leisure Day & Optional Experiences', desc: 'Free time for shopping, relaxation, spa treatments, or tailored excursions.' },
  { day: 5, title: 'Farewell Gala Dinner & Departure', desc: 'Celebratory multi-course dinner followed by private transfer to the airport.' },
];

export default function PackageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Widget State
  const [travelDate, setTravelDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [numTravelers, setNumTravelers] = useState(2);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    async function loadPackage() {
      setLoading(true);
      setError('');
      try {
        const data = await packageService.getPackageDetails(id);
        setPkg(data);
        setActiveImage(data.featured_image_url || '');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load package details');
      } finally {
        setLoading(false);
      }
    }

    loadPackage();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#0284c7', fontWeight: '600' }}>
          ✈️ Loading package details...
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Travel Package Not Found</h2>
        <p style={{ color: '#64748b', margin: '1rem 0' }}>{error || 'The requested package could not be located.'}</p>
        <Link to="/packages" className="btn btn-primary">
          Browse All Packages
        </Link>
      </div>
    );
  }

  const isAvailable = Boolean(pkg.is_available);
  const effectivePrice = Number(pkg.discount_price || pkg.base_price);
  const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.base_price);
  const perPersonSavings = hasDiscount ? (Number(pkg.base_price) - Number(pkg.discount_price)) : 0;
  const subtotal = effectivePrice * numTravelers;
  const totalSavings = perPersonSavings * numTravelers;
  const taxesAndFees = Math.round(subtotal * 0.08);
  const finalTotal = subtotal + taxesAndFees;

  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const exclusions = Array.isArray(pkg.exclusions) ? pkg.exclusions : [];
  const gallery = pkg.destination_gallery && pkg.destination_gallery.length > 0
    ? pkg.destination_gallery
    : [pkg.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'];

  const typeStyle = packageTypeColors[pkg.package_type?.toLowerCase()] || packageTypeColors.standard;

  const handleContinueToBooking = () => {
    navigate(
      `/booking?packageId=${pkg.id}&destinationId=${pkg.destination_id}&travelers=${numTravelers}&date=${travelDate}`
    );
  };

  return (
    <section className="section page-section" style={{ paddingTop: '1.5rem' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#0284c7', textDecoration: 'none' }}>Home</Link>
          {' / '}
          <Link to="/packages" style={{ color: '#0284c7', textDecoration: 'none' }}>Packages</Link>
          {' / '}
          <span style={{ color: '#0f172a', fontWeight: '600' }}>{pkg.title}</span>
        </div>

        {/* Header Title Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: typeStyle.bg,
                  color: typeStyle.color,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                {typeStyle.label}
              </span>
              <span
                style={{
                  background: isAvailable ? '#dcfce7' : '#fee2e2',
                  color: isAvailable ? '#15803d' : '#b91c1c',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                }}
              >
                {isAvailable ? '🟢 Available for Booking' : '🔴 Currently Sold Out'}
              </span>
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0' }}>
              {pkg.title}
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>
              📍{' '}
              <Link
                to={`/destinations/${pkg.destination_id}`}
                style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}
              >
                {pkg.destination_name} ({pkg.destination_city}, {pkg.destination_country})
              </Link>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              to={`/destinations/${pkg.destination_id}`}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
            >
              🏛️ Destination Details
            </Link>
            <button
              onClick={handleContinueToBooking}
              disabled={!isAvailable}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
            >
              {isAvailable ? 'Book Package Now' : 'Sold Out'}
            </button>
          </div>
        </div>

        {/* Gallery / Image Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ height: '420px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <img
              src={activeImage}
              alt={pkg.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gallery.slice(0, 3).map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                style={{
                  flex: 1,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeImage === imgUrl ? '3px solid #0284c7' : '2px solid transparent',
                  opacity: activeImage === imgUrl ? 1 : 0.75,
                  transition: 'opacity 0.2s',
                }}
              >
                <img
                  src={imgUrl}
                  alt={`${pkg.title} preview ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            background: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              ⏱️ Duration
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              {pkg.duration_days} Days / {pkg.duration_nights || Math.max(1, pkg.duration_days - 1)} Nights
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              👥 Max Group Size
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              Up to {pkg.max_group_size || 12} Travelers
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              ⚡ Difficulty
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem', textTransform: 'capitalize' }}>
              {pkg.difficulty_level || 'Easy'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              ⭐ Rating
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
              {pkg.rating || 4.9} / 5.0
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              💵 Base Price
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0284c7', marginTop: '0.2rem' }}>
              ${Number(effectivePrice).toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>/ person</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Details & Booking Widget */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Description, Inclusions, Exclusions, Itinerary */}
          <div>
            {/* Description */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
                Package Overview
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.7', margin: 0 }}>
                {pkg.description}
              </p>
            </div>

            {/* Included & Excluded Services Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {/* Included Services */}
              <div
                style={{
                  background: '#f0fdf4',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #bbf7d0',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#166534', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✅</span> Included Services
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inclusions.length > 0 ? (
                    inclusions.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: '#14532d', lineHeight: '1.4' }}>
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: '0.9rem', color: '#166534' }}>All standard accommodation & transfers included.</li>
                  )}
                </ul>
              </div>

              {/* Excluded Services */}
              <div
                style={{
                  background: '#fff1f2',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #fecdd3',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#9f1239', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>❌</span> Excluded Services
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {exclusions.length > 0 ? (
                    exclusions.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: '#881337', lineHeight: '1.4' }}>
                        <span style={{ color: '#e11d48', fontWeight: 'bold' }}>✕</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: '0.9rem', color: '#9f1239' }}>International flights and personal shopping not included.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Suggested Schedule / Highlights */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.25rem' }}>
                Trip Itinerary & Highlights ({pkg.duration_days} Days)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {defaultItineraryItems.slice(0, Math.min(pkg.duration_days, 5)).map((item) => (
                  <div
                    key={item.day}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1.25rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        minWidth: '65px',
                        textAlign: 'center',
                      }}
                    >
                      Day {item.day}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Booking Calculator Widget */}
          <aside style={{ position: 'sticky', top: '90px' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Per Traveler
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0284c7' }}>
                      ${effectivePrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ${Number(pkg.base_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {hasDiscount && (
                  <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: '700', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '9999px' }}>
                    Save ${perPersonSavings.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    📅 Departure Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    👥 Number of Guests
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setNumTravelers(Math.max(1, numTravelers - 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                      {numTravelers} {numTravelers === 1 ? 'Traveler' : 'Travelers'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumTravelers(Math.min(pkg.max_group_size || 14, numTravelers + 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#475569' }}>
                  <span>${effectivePrice.toLocaleString()} × {numTravelers} traveler{numTravelers === 1 ? '' : 's'}</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {hasDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a', fontWeight: '600' }}>
                    <span>Special Package Discount</span>
                    <span>−${totalSavings.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#475569' }}>
                  <span>Taxes & Service Fees (8%)</span>
                  <span>${taxesAndFees.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: '#0f172a',
                  }}
                >
                  <span>Total Due</span>
                  <span style={{ color: '#0284c7' }}>${finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Booking CTA Button */}
              <button
                onClick={handleContinueToBooking}
                disabled={!isAvailable}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                }}
              >
                {isAvailable ? 'Continue to Booking ➜' : 'Currently Unavailable'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                🔒 Secure SSL Checkout • Instant Confirmation
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
