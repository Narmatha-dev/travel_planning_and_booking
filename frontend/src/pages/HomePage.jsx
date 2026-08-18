import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { quickStats } from '../services/travelData';
import DestinationCard from '../components/DestinationCard';
import PackageCard from '../components/PackageCard';
import destinationService from '../services/destinationService';
import packageService from '../services/packageService';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [welcomeBanner, setWelcomeBanner] = useState(location.state?.welcomeMessage || null);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [searchWhere, setSearchWhere] = useState('');

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
          setPopularDestinations(destData.value);
        }
        if (pkgData.status === 'fulfilled' && pkgData.value) {
          setFeaturedPackages(pkgData.value);
        }
      } catch (err) {
        console.warn('Failed to load home page data:', err.message);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchWhere.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchWhere.trim())}`);
    } else {
      navigate('/destinations');
    }
  };

  return (
    <>
      {welcomeBanner && (
        <div className="container" style={{ paddingTop: '1.5rem', marginBottom: '-0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            color: '#166534',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #86efac',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Welcome to Travelora!</strong>
                <span style={{ fontSize: '0.875rem', color: '#15803d' }}>{welcomeBanner}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeBanner(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: '#166534',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                lineHeight: 1,
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Explore the world with ease</span>
            <h1>Find your next unforgettable getaway.</h1>
            <p>
              Discover handpicked destinations, tailor-made packages, and smooth
              booking experiences for every kind of traveler.
            </p>

            <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/recommendations" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                ✨ AI Suggestions
              </Link>
              <Link to="/destinations" className="btn btn-outline">
                Explore Trips
              </Link>
              <Link to="/trip-planner" className="btn btn-secondary">
                Plan a Trip
              </Link>
            </div>

            <div className="stat-row">
              {quickStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
                alt="Beach holiday"
              />
            </div>
            <div className="hero-card hero-card-small">
              <p>Best Seller</p>
              <h3>Bali Retreat</h3>
              <span>From $1099</span>
            </div>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="container">
          <form className="search-panel" onSubmit={handleSearchSubmit}>
            <div className="search-field">
              <label>Destination</label>
              <input
                type="text"
                value={searchWhere}
                onChange={(e) => setSearchWhere(e.target.value)}
                placeholder="Where to? (e.g. Bali, Paris, Tokyo)"
              />
            </div>
            <div className="search-field">
              <label>Departure</label>
              <input type="date" />
            </div>
            <div className="search-field">
              <label>Travelers</label>
              <select>
                <option>1 Traveler</option>
                <option>2 Travelers</option>
                <option>3 Travelers</option>
                <option>4+ Travelers</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="section">
        <div className="container">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="eyebrow">Popular destinations</span>
              <h2>Top picks for your next escape</h2>
            </div>
            <Link to="/destinations" style={{ color: '#0284c7', fontWeight: '600', textDecoration: 'none' }}>
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

      <section className="section alt-section">
        <div className="container">
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="eyebrow">Featured packages</span>
              <h2>Handpicked trips for every mood</h2>
            </div>
            <Link to="/packages" style={{ color: '#0284c7', fontWeight: '600', textDecoration: 'none' }}>
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

      <section className="section why-us-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">Why choose us</span>
            <h2>Travel planning made effortless</h2>
          </div>

          <div className="feature-grid">
            <div className="feature-box">
              <h3>Expert local insights</h3>
              <p>Get recommendations from people who know the hidden gems of each destination.</p>
            </div>
            <div className="feature-box">
              <h3>Flexible booking</h3>
              <p>Adjust your itinerary with ease through transparent and traveler-friendly options.</p>
            </div>
            <div className="feature-box">
              <h3>Always-on support</h3>
              <p>Travel confidently with support available before, during, and after your trip.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
