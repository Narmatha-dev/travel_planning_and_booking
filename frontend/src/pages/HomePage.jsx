import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { quickStats } from '../services/travelData';
import DestinationCard from '../components/DestinationCard';
import PackageCard from '../components/PackageCard';
import GlobalPlaceSearch from '../components/GlobalPlaceSearch';
import destinationService from '../services/destinationService';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, language, t } = useAppContext();
  const [welcomeBanner, setWelcomeBanner] = useState(location.state?.welcomeMessage || null);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    if (location.state?.welcomeMessage) {
      setWelcomeBanner(location.state.welcomeMessage);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadData() {
      try {
        const [destData, pkgData] = await Promise.allSettled([
          destinationService.getPopularDestinations(),
          packageService.getFeaturedPackages(3),
        ]);
        if (destData.status === 'fulfilled' && destData.value) {
          setPopularDestinations(destData.value.slice(0, 6));
        }
        if (pkgData.status === 'fulfilled' && pkgData.value) {
          setFeaturedPackages(pkgData.value.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load home page data:', err.message);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadBookings() {
      if (isAuthenticated) {
        try {
          const data = await bookingService.getUserBookings(user?.id || 3);
          setUserBookings(data || []);
        } catch {
          // ignore error on home page
        }
      }
    }
    loadBookings();
  }, [isAuthenticated, user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTrips = userBookings.filter((b) => b.status !== 'cancelled' && (!b.travel_date || b.travel_date >= todayStr));
  const nextUpcomingTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  const calculateDaysRemaining = (travelDateStr) => {
    if (!travelDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(travelDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = nextUpcomingTrip ? calculateDaysRemaining(nextUpcomingTrip.travel_date) : null;

  return (
    <>
      {welcomeBanner && (
        <div className="container" style={{ paddingTop: '1.25rem', marginBottom: '-0.25rem' }}>
          <div
            style={{
              background: '#f0fdf4',
              color: '#166534',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎉</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>Welcome to Travelora!</strong>
                <span style={{ fontSize: '0.85rem', color: '#15803d' }}>{welcomeBanner}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeBanner(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                color: '#166534',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          {/* Left Column: Hero Copy, Actions & Quick Stats */}
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              <span>{language === 'ta' ? '✨ ஸ்மார்ட் AI பயண வழிகாட்டி' : '✨ Next-Gen AI Travel Companion'}</span>
            </div>

            <h1 className="hero-title">
              {language === 'ta' ? (
                t('hero.title', 'உங்கள் ஸ்மார்ட் பயணம் இங்கே தொடங்குகிறது.')
              ) : (
                <>
                  Find your next <span className="hero-gradient-text">unforgettable getaway.</span>
                </>
              )}
            </h1>

            <p className="hero-subtitle">
              {t(
                'hero.subtitle',
                'Discover handpicked destinations, tailor-made packages, and smooth booking experiences for every kind of traveler.'
              )}
            </p>

            <div className="hero-actions">
              <Link to="/destinations" className="btn btn-hero-primary">
                <span>🌍 Explore Trips</span>
                <span style={{ fontSize: '1.1rem' }}>➔</span>
              </Link>
              <Link to="/trip-planner" className="btn btn-hero-outline">
                <span>🗺️ Plan AI Trip</span>
              </Link>
            </div>

            <div className="stat-row">
              {quickStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <strong className="stat-value">{stat.value}</strong>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="hero-visual">
            <div className="hero-visual-glow"></div>

            <div className="hero-floating-badge-top">
              <span style={{ fontSize: '1.35rem' }}>⭐</span>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', lineHeight: 1.15 }}>
                  4.98 Rating
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>
                  25k+ Happy Travelers
                </span>
              </div>
            </div>

            <div className="hero-card-main">
              <img
                src="https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=85"
                alt="Swiss Alpine Glacier & Emerald Lake"
              />
              <div className="hero-card-overlay-tag">
                <span>📍</span>
                <span>Oeschinensee, Swiss Alps</span>
              </div>
            </div>

            <div className="hero-card-small">
              <span className="hero-small-pill">🔥 Top Rated</span>
              <h3>Swiss Alps Grand Tour</h3>
              <div className="hero-card-small-meta">
                <span className="hero-card-small-price">From $1,299</span>
                <span className="hero-card-small-rating">7D • ⭐ 4.98</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Traveler Upcoming Trip Banner (Only for logged in users with active bookings) */}
      {isAuthenticated && nextUpcomingTrip && (
        <div className="container" style={{ paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1.5px solid #F3D2E5',
              padding: '1rem 1.5rem',
              boxShadow: '0 8px 20px -4px rgba(190, 89, 133, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                  YOUR NEXT TRIP • {daysRemaining === 1 ? 'Starts Tomorrow!' : daysRemaining === 0 ? 'Starts Today!' : `Starts in ${daysRemaining} days`}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2D1520' }}>
                  📍 {nextUpcomingTrip.destination_name} • 👥 {nextUpcomingTrip.num_travelers || 2} Travelers
                </div>
              </div>
            </div>
            <Link to="/my-trips?tab=upcoming" className="btn btn-primary btn-sm" style={{ fontWeight: '800' }}>
              View My Trip ➔
            </Link>
          </div>
        </div>
      )}

      {/* Popular Destinations Section */}
      <section className="section" style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="eyebrow">Popular Destinations</span>
              <h2>Top picks for your next escape</h2>
            </div>
            <Link to="/destinations" style={{ color: '#BE5985', fontWeight: '800', textDecoration: 'none' }}>
              View All Destinations ➜
            </Link>
          </div>

          <div className="card-grid" style={{ marginTop: '1.5rem' }}>
            {popularDestinations.length > 0 ? (
              popularDestinations.map((place) => (
                <DestinationCard key={place.id} destination={place} />
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
                <Link to="/destinations" className="btn btn-primary">Browse All Destinations</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Packages Section */}
      <section className="section alt-section" style={{ padding: '3rem 0', background: 'transparent' }}>
        <div className="container">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="eyebrow">Featured Packages</span>
              <h2>Handpicked trips for every mood</h2>
            </div>
            <Link to="/packages" style={{ color: '#BE5985', fontWeight: '800', textDecoration: 'none' }}>
              View All Packages ➜
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.5rem',
            }}
          >
            {featuredPackages.length > 0 ? (
              featuredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
                <Link to="/packages" className="btn btn-primary">Browse All Packages</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section why-us-section" style={{ padding: '3rem 0 4rem' }}>
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">Why choose us</span>
            <h2>Travel planning made effortless</h2>
          </div>

          <div className="feature-grid">
            <div className="feature-box">
              <h3>Expert local insights</h3>
              <p>Get curated recommendations from locals who know the hidden gems of each destination.</p>
            </div>
            <div className="feature-box">
              <h3>Flexible booking</h3>
              <p>Adjust your itinerary with transparent pricing and traveler-friendly cancellation options.</p>
            </div>
            <div className="feature-box">
              <h3>Always-on support</h3>
              <p>Travel confidently with verified guides and assistance before, during, and after your trip.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
