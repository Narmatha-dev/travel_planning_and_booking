import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import authService from '../services/authService';

function LoginPage() {
  const { login, authError, setAuthError } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  // Display error if redirected from OAuth callback with error query param
  useEffect(() => {
    if (errorParam) {
      setLocalError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
    if (authError) setAuthError(null);
  };

  const handleDemoFill = (email, password) => {
    setFormData({ email, password });
    setLocalError('');
    if (authError) setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');

    const result = await login(formData.email.trim(), formData.password);
    setIsSubmitting(false);

    if (result.success) {
      const defaultRedirect = result.user?.role === 'admin' ? '/admin' : '/';
      const targetDestination = location.state?.from?.pathname || redirectParam || defaultRedirect;
      navigate(targetDestination, {
        replace: true,
        state: {
          welcomeMessage: `Welcome back, ${result.user?.full_name || 'Traveler'}! You have successfully signed in.`,
        },
      });
    } else {
      setLocalError(result.message || 'Login failed');
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setLocalError('');
    if (authError) setAuthError(null);

    const targetDestination = location.state?.from?.pathname || redirectParam || '/';
    const googleAuthUrl = authService.getGoogleAuthUrl(targetDestination);

    // Redirect to backend OAuth initiation endpoint
    window.location.href = googleAuthUrl;
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to access your itinerary, saved trips, and bookings.</p>

        {(localError || authError) && (
          <div
            className="alert alert-error"
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              border: '1px solid #f87171',
            }}
          >
            ⚠️ {localError || authError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{ width: '100%', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#6b7280',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={isSubmitting || isGoogleLoading}
            style={{ marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* OR Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="btn btn-google full-width"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
          aria-label="Continue with Google"
        >
          {isGoogleLoading ? (
            <span>Connecting to Google...</span>
          ) : (
            <>
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Demo Quick-Fill Section */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
            ⚡ Quick Demo Accounts:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              onClick={() => handleDemoFill('alex.reed@example.com', 'TravelPass123!')}
            >
              👤 Traveler (Alex)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              onClick={() => handleDemoFill('admin@travelplanner.com', 'TravelPass123!')}
            >
              🛡️ Admin (System)
            </button>
          </div>
        </div>

        <p className="auth-switch" style={{ marginTop: '1.25rem' }}>
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
