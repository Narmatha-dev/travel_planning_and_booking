import { Link } from 'react-router-dom';

const packageTypeColors = {
  standard: { bg: '#e0f2fe', color: '#0369a1', label: 'Standard' },
  premium: { bg: '#fef3c7', color: '#b45309', label: 'Premium' },
  luxury: { bg: '#fae8ff', color: '#86198f', label: 'Luxury' },
  custom: { bg: '#dcfce7', color: '#15803d', label: 'Custom' },
};

const difficultyIcons = {
  easy: '🌿 Easy',
  moderate: '⛰️ Moderate',
  challenging: '🧗 Challenging',
  strenuous: '🏔️ Strenuous',
};

export default function PackageCard({ pkg }) {
  const typeStyle = packageTypeColors[pkg.package_type?.toLowerCase()] || packageTypeColors.standard;
  const isAvailable = Boolean(pkg.is_available);
  const effectivePrice = pkg.discount_price || pkg.base_price;
  const hasDiscount = pkg.discount_price && pkg.discount_price < pkg.base_price;
  const savings = hasDiscount ? (pkg.base_price - pkg.discount_price).toFixed(0) : 0;
  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];

  return (
    <article
      className="package-card-modern"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
      }}
    >
      {/* Image & Overlay Badges */}
      <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#f1f5f9' }}>
        <img
          src={pkg.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
          alt={pkg.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          className="package-card-img"
        />

        {/* Package Type Tag */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: typeStyle.bg,
            color: typeStyle.color,
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          {typeStyle.label}
        </span>

        {/* Availability Badge */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isAvailable ? 'rgba(22, 101, 52, 0.9)' : 'rgba(220, 38, 38, 0.9)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '9999px',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {isAvailable ? '● Available' : '○ Sold Out'}
        </span>

        {/* Duration Overlay Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>⏱️</span>
          <span>{pkg.duration_days} Days / {pkg.duration_nights || Math.max(1, pkg.duration_days - 1)} Nights</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Destination & Difficulty Subtitle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: '600' }}>
            📍 {pkg.destination_name || `${pkg.destination_city || ''}, ${pkg.destination_country || ''}`}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
            {difficultyIcons[pkg.difficulty_level?.toLowerCase()] || '🌿 Easy'}
          </span>
        </div>

        {/* Package Title */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: '700',
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <Link
            to={`/packages/${pkg.slug || pkg.id}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {pkg.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p
          style={{
            fontSize: '0.85rem',
            color: '#64748b',
            margin: '0 0 1rem 0',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {pkg.description}
        </p>

        {/* Inclusions Highlights Chips */}
        {inclusions.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {inclusions.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <span style={{ color: '#16a34a' }}>✓</span> {item}
              </span>
            ))}
            {inclusions.length > 3 && (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '2px 4px' }}>
                +{inclusions.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Pricing & Call to Action Footer */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '0.85rem',
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
              Starting From
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.1rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0284c7' }}>
                ${Number(effectivePrice).toLocaleString()}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  ${Number(pkg.base_price).toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700' }}>
                Save ${Number(savings).toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Link
              to={`/packages/${pkg.slug || pkg.id}`}
              className="btn btn-outline"
              style={{
                padding: '0.45rem 0.8rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                color: '#334155',
              }}
            >
              Details
            </Link>
            <Link
              to={`/booking?packageId=${pkg.id}&destinationId=${pkg.destination_id}`}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                opacity: isAvailable ? 1 : 0.6,
                pointerEvents: isAvailable ? 'auto' : 'none',
              }}
            >
              {isAvailable ? 'Book' : 'Sold Out'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
