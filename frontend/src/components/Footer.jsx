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
            <li><Link to="/trip-planner">Trip Planner</Link></li>
            <li><Link to="/booking">Bookings</Link></li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul>
            <li>hello@travelora.com</li>
            <li>+1 (800) 555-0199</li>
            <li>24/7 Support</li>
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
