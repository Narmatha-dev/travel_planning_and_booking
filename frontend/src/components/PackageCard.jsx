import { Link } from 'react-router-dom';

const packageTypeColors = {
  standard: { bg: '#FFEDFA', color: '#BE5985', label: 'Standard' },
  premium: { bg: '#FFB8E0', color: '#BE5985', label: 'Premium' },
  luxury: { bg: '#FFF5FB', color: '#BE5985', label: 'Luxury' },
  custom: { bg: '#FFEDFA', color: '#EC7FA9', label: 'Custom' },
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
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1.5px solid #F3D2E5',
        boxShadow: '0 8px 20px -4px rgba(190, 89, 133, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
      }}
    >
      {/* Image & Overlay Badges */}
      <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#3D1C2A' }}>
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
            fontWeight: '800',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '1px solid #FFB8E0',
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
            background: isAvailable ? 'rgba(190, 89, 133, 0.92)' : 'rgba(220, 38, 38, 0.9)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: '800',
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
            background: 'rgba(45, 21, 32, 0.85)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: '700',
            padding: '4px 12px',
            borderRadius: '9999px',
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
          <span style={{ fontSize: '0.82rem', color: '#BE5985', fontWeight: '700' }}>
            📍 {pkg.destination_name || `${pkg.destination_city || ''}, ${pkg.destination_country || ''}`}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#7A5366', fontWeight: '600' }}>
            {difficultyIcons[pkg.difficulty_level?.toLowerCase()] || '🌿 Easy'}
          </span>
        </div>

        {/* Package Title */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: '900',
            color: '#BE5985',
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
            color: '#7A5366',
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
                  background: '#FFF5FB',
                  color: '#BE5985',
                  border: '1px solid #F3D2E5',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontWeight: '600',
                }}
              >
                <span style={{ color: '#EC7FA9' }}>✓</span> {item}
              </span>
            ))}
            {inclusions.length > 3 && (
              <span style={{ fontSize: '0.72rem', color: '#7A5366', padding: '2px 4px' }}>
                +{inclusions.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Pricing & Call to Action Footer */}
        <div
          style={{
            borderTop: '1px solid #F3D2E5',
            paddingTop: '0.85rem',
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '700' }}>
              Starting From
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.1rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#BE5985' }}>
                ${Number(effectivePrice).toLocaleString()}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '0.85rem', color: '#7A5366', textDecoration: 'line-through' }}>
                  ${Number(pkg.base_price).toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span style={{ fontSize: '0.72rem', color: '#BE5985', fontWeight: '800' }}>
                Save ${Number(savings).toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Link
              to={`/packages/${pkg.slug || pkg.id}`}
              className="btn btn-outline"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '9999px',
                borderColor: '#F3D2E5',
                color: '#BE5985',
                background: '#FFF5FB',
              }}
            >
              Details
            </Link>
            <Link
              to={`/booking?packageId=${pkg.id}&destinationId=${pkg.destination_id}`}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '9999px',
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
