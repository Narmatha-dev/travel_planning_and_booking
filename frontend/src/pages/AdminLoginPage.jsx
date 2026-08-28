import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import authService from '../services/authService';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, adminLogin } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in as admin, redirect directly to /admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/admin';
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both administrative email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await adminLogin(email.trim(), password);
      if (result.success) {
        const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/admin';
        navigate(redirectUrl, { replace: true });
      } else {
        setError(result.message || 'Invalid administrator credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e111a 0%, #2e1526 50%, #441733 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '2.5rem 2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(236, 127, 169, 0.25)',
        }}
      >
        {/* Portal Selector Toggle: Choose Traveler vs Admin */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#FFF5FB',
            padding: '4px',
            borderRadius: '16px',
            marginBottom: '1.75rem',
            border: '1.5px solid #F3D2E5',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#7A5366',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>✈️</span>
            <span>Traveler Portal</span>
          </button>
          <button
            type="button"
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.92rem',
              boxShadow: '0 2px 10px rgba(190, 89, 133, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🛡️</span>
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: '#ffffff',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 20px rgba(190, 89, 133, 0.35)',
            }}
          >
            🛡️
          </div>
          <span
            style={{
              background: '#FFEDFA',
              color: '#BE5985',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Secured Admin Portal
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: '0.75rem 0 0.35rem 0' }}>
            Travelora Admin Workspace
          </h1>
          <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: 0 }}>
            Sign in with authorized administrator credentials to manage packages, bookings, destinations, and system operations.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Admin Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
              Administrator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter administrator email address"
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1.5px solid #F3D2E5',
                fontSize: '0.95rem',
                color: '#2D1520',
                background: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', margin: 0 }}>
                Security Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#7A5366', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter administrator password"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1.5px solid #F3D2E5',
                fontSize: '0.95rem',
                color: '#2D1520',
                background: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.95rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
              color: '#ffffff',
              fontSize: '1.02rem',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(190, 89, 133, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <span>Authenticating Admin... 🔄</span>
            ) : (
              <span>Sign In to Admin Workspace ➔</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #F3D2E5', paddingTop: '1.25rem' }}>
          <Link
            to="/home"
            style={{
              color: '#7A5366',
              fontSize: '0.85rem',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Return to Public Traveler Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
