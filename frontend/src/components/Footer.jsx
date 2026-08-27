import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">T</span>
            <span>Travelora</span>
          </div>
          <p className="footer-text">
            Plan smarter, travel better, and make every journey memorable.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/destinations">Destinations</Link></li>
            <li><Link to="/packages">Travel Packages</Link></li>
            <li><Link to="/trip-planner">AI Trip Planner</Link></li>
            <li><Link to="/my-trips">My Bookings</Link></li>
          </ul>
        </div>

        <div>
          <h4>Support & Safety</h4>
          <ul>
            <li><Link to="/safety">Safety & SOS Hub</Link></li>
            <li><Link to="/profile">Profile Settings</Link></li>
            <li><Link to="/login">Account Access</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact & Help</h4>
          <ul>
            <li>hello@travelora.com</li>
            <li>+91 (800) 555-0199</li>
            <li>24/7 Live AI Travel Support</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 Travelora. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
