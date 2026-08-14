import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { packages, quickStats } from '../services/travelData';
import DestinationCard from '../components/DestinationCard';
import destinationService from '../services/destinationService';

function HomePage() {
  const navigate = useNavigate();
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [searchWhere, setSearchWhere] = useState('');

  useEffect(() => {
    async function loadPopular() {
      try {
        const data = await destinationService.getPopularDestinations();
        setPopularDestinations(data || []);
      } catch (err) {
        console.warn('Failed to load popular destinations on home:', err.message);
      }
    }
    loadPopular();
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
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Explore the world with ease</span>
            <h1>Find your next unforgettable getaway.</h1>
            <p>
              Discover handpicked destinations, tailor-made packages, and smooth
              booking experiences for every kind of traveler.
            </p>

            <div className="hero-actions">
              <Link to="/destinations" className="btn btn-primary">
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
          <div className="section-heading">
            <span className="eyebrow">Featured packages</span>
            <h2>Handpicked trips for every mood</h2>
          </div>

          <div className="card-grid package-grid">
            {packages.map((pkg) => (
              <article key={pkg.id} className="package-card">
                <img src={pkg.image} alt={pkg.title} />
                <div className="card-body">
                  <span className="tag">{pkg.category}</span>
                  <h3>{pkg.title}</h3>
                  <div className="card-meta">
                    <span>{pkg.duration}</span>
                    <strong>{pkg.price}</strong>
                  </div>
                </div>
              </article>
            ))}
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
