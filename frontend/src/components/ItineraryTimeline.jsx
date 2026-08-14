const activityTypeMeta = {
  hotel: { icon: '🏨', label: 'Accommodation', color: '#0284c7', bg: '#e0f2fe' },
  sightseeing: { icon: '🏛️', label: 'Sightseeing', color: '#7c3aed', bg: '#ede9fe' },
  dining: { icon: '🍽️', label: 'Dining', color: '#ea580c', bg: '#ffedd5' },
  adventure: { icon: '🦁', label: 'Adventure', color: '#16a34a', bg: '#dcfce7' },
  leisure: { icon: '🌿', label: 'Leisure & Wellness', color: '#059669', bg: '#d1fae5' },
  transport: { icon: '🚗', label: 'Transport', color: '#475569', bg: '#f1f5f9' },
  flight: { icon: '✈️', label: 'Flight', color: '#2563eb', bg: '#dbeafe' },
};

export default function ItineraryTimeline({ days = [] }) {
  if (!days || days.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        No itinerary activities available.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {days.map((dayGroup) => (
        <div
          key={dayGroup.day_number}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Day Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#ffffff',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                marginRight: '0.75rem',
              }}>
                Day {dayGroup.day_number}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>
                {dayGroup.theme || (dayGroup.date ? new Date(dayGroup.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : `Day ${dayGroup.day_number}`)}
              </span>
            </div>

            {dayGroup.date && (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                📅 {dayGroup.date}
              </span>
            )}
          </div>

          {/* Activities List */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(dayGroup.activities || []).map((act, index) => {
              const meta = activityTypeMeta[act.activity_type] || activityTypeMeta.sightseeing;
              const formattedTime = act.activity_time ? act.activity_time.substring(0, 5) : '09:00';

              return (
                <div
                  key={act.id || index}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    position: 'relative',
                  }}
                >
                  {/* Time & Icon Pill */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}>
                      {meta.icon}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '0.35rem' }}>
                      {formattedTime}
                    </span>
                  </div>

                  {/* Activity Details Card */}
                  <div style={{
                    flexGrow: 1,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{
                          fontSize: '0.7rem',
                          background: meta.bg,
                          color: meta.color,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}>
                          {meta.label}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0.35rem 0 0.25rem 0' }}>
                          {act.title}
                        </h4>
                      </div>

                      {act.cost > 0 && (
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: '#0284c7',
                        }}>
                          ~${parseFloat(act.cost).toFixed(0)}
                        </div>
                      )}
                    </div>

                    {act.description && (
                      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5', margin: '0.5rem 0' }}>
                        {act.description}
                      </p>
                    )}

                    {act.location_name && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem' }}>
                        <span>📍</span>
                        <span>{act.location_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
