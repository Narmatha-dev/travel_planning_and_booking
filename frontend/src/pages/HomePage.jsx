import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { quickStats } from '../services/travelData';
import DestinationCard from '../components/DestinationCard';
import PackageCard from '../components/PackageCard';
import LocationSection from '../components/LocationSection';
import NearbyPlacesSection from '../components/NearbyPlacesSection';
import PersonalizedRecommendationsSection from '../components/PersonalizedRecommendationsSection';
import GlobalPlaceSearch from '../components/GlobalPlaceSearch';
import InteractiveMapSection from '../components/InteractiveMapSection';
import TransportOptionsSection from '../components/TransportOptionsSection';
import destinationService from '../services/destinationService';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, currentLocation } = useAppContext();
  const [welcomeBanner, setWelcomeBanner] = useState(location.state?.welcomeMessage || null);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

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
  const completedTrips = userBookings.filter((b) => b.status !== 'cancelled' && b.travel_date && b.travel_date < todayStr);
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
      {/* Current GPS Location Section (Phase 1) */}
      <LocationSection />

      {/* Feature 6 & 12: Dashboard Summary Strip & Upcoming Trip Countdown */}
      {isAuthenticated && (
        <div className="container" style={{ paddingTop: '1.25rem', marginBottom: '-0.25rem' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '1.25rem 1.75rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🚀 TRAVELER DASHBOARD SUMMARY
              </span>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.92rem', color: '#334155' }}>
                <span>Upcoming Trips: <strong style={{ color: '#0284c7' }}>{upcomingTrips.length}</strong></span>
                <span>Completed: <strong style={{ color: '#16a34a' }}>{completedTrips.length}</strong></span>
                <span>Total Bookings: <strong>{userBookings.length}</strong></span>
              </div>
            </div>

            {/* Feature 6: Dynamic Upcoming Trip Card */}
            {nextUpcomingTrip && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📅</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>
                    YOUR NEXT TRIP • {daysRemaining === 1 ? 'Starts Tomorrow!' : daysRemaining === 0 ? 'Starts Today!' : `Starts in ${daysRemaining} days`}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                    📍 {nextUpcomingTrip.destination_name} • 👥 {nextUpcomingTrip.num_travelers || 2} Travelers
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/notifications" className="btn btn-outline btn-sm" style={{ fontWeight: '700', padding: '0.5rem 0.85rem' }}>
                🔔 Notifications
              </Link>
              <Link to="/my-trips?tab=upcoming" className="btn btn-primary btn-sm" style={{ fontWeight: '800', padding: '0.5rem 1rem' }}>
                {nextUpcomingTrip ? 'View My Trip ➔' : 'My Trips Hub ➔'}
              </Link>
            </div>
          </div>
        </div>
      )}

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

      {/* Universal Worldwide Place Search (Requirement 1 & 15) */}
      <section className="search-section" style={{ padding: '2rem 0 1rem' }}>
        <div className="container">
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1.5px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🔍 DYNAMIC WORLDWIDE DESTINATION SEARCH
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0.25rem 0 0' }}>
                Search Any Tourist Destination in the World
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                Enter any monument, city, beach, or landmark to view real photos, exact coordinates, interactive route, and transport options.
              </p>
            </div>

            <GlobalPlaceSearch
              onPlaceSelect={(place) => setSelectedPlace(place)}
              onViewOnMap={(place) => {
                setSelectedPlace(place);
                const mapElem = document.getElementById('interactive-map-section');
                if (mapElem) mapElem.scrollIntoView({ behavior: 'smooth' });
              }}
              onPlanTrip={(place) => {
                navigate(`/trip-planner?destination=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* Dynamic Map & Route for Selected or Default Destination (Feature 5, 9 & 10) */}
      <section className="section" id="interactive-map-section" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <div className="container">
          <InteractiveMapSection
            origin={currentLocation || { city: 'Chennai', latitude: 13.0827, longitude: 80.2707 }}
            destination={
              selectedPlace || {
                name: 'Eiffel Tower',
                city: 'Paris',
                country: 'France',
                latitude: 48.8584,
                longitude: 2.2945,
              }
            }
            title={selectedPlace ? `🗺️ Route to ${selectedPlace.name}` : '🗺️ Route & Distance Calculator'}
          />

          {/* Transport Options Section (Requirement 10 & 11) */}
          <div style={{ marginTop: '1.5rem' }}>
            <TransportOptionsSection
              origin={currentLocation || { city: 'Chennai', latitude: 13.0827, longitude: 80.2707 }}
              destination={
                selectedPlace || {
                  name: 'Eiffel Tower',
                  city: 'Paris',
                  country: 'France',
                  latitude: 48.8584,
                  longitude: 2.2945,
                }
              }
              onContinueToTripPlanning={() => {
                const target = selectedPlace || { name: 'Eiffel Tower', latitude: 48.8584, longitude: 2.2945 };
                navigate(`/trip-planner?destination=${encodeURIComponent(target.name)}&lat=${target.latitude}&lng=${target.longitude}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* Phase 2: Real Nearby Tourist Attractions & Places */}
      <NearbyPlacesSection />

      {/* Phase 19: Smart Personalized Recommendations Engine */}
      <PersonalizedRecommendationsSection />

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
