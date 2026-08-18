import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

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
  const [localError, setLocalError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

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

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to access your itinerary, saved trips, and bookings.</p>

        {(localError || authError) && (
          <div className="alert alert-error" style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            border: '1px solid #f87171'
          }}>
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
                  color: '#6b7280'
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
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick-Fill Section */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px dashed #cbd5e1',
          fontSize: '0.85rem'
        }}>
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
