import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/packages', label: 'Packages' },
  { to: '/trip-planner', label: 'Trip Planner' },
  { to: '/recommendations', label: 'AI Suggestions ✨' },
];

function Navbar() {
  const { user, isAuthenticated, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand" aria-label="Travel home page">
          <span className="brand-mark">T</span>
          <span>Travelora</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <>
              <NavLink
                to="/booking"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Booking
              </NavLink>
              <NavLink
                to="/my-trips"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                My Trips
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Profile
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                  style={{ color: '#0284c7', fontWeight: '800' }}
                >
                  Admin 🛡️
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                  {user.full_name || user.name}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                  color: user.role === 'admin' ? '#92400e' : '#3730a3',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {user.role || 'Traveler'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
