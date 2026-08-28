import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function RegisterPage() {
  const { register, authError, setAuthError } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'traveler',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
    if (authError) setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setLocalError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');

    const result = await register({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phoneNumber: formData.phoneNumber.trim(),
      role: formData.role,
    });

    setIsSubmitting(false);

    if (result.success) {
      const targetDestination = result.user?.role === 'admin' ? '/admin' : '/';
      navigate(targetDestination, {
        replace: true,
        state: {
          welcomeMessage: `Welcome to Travelora, ${result.user?.full_name || 'Traveler'}! Your account has been created and you are now signed in.`,
        },
      });
    } else {
      setLocalError(result.message || 'Registration failed');
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <h2>Create an Account</h2>
        <p>Join thousands of travelers planning their dream journeys.</p>

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
            Full Name *
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Alicia Carter"
              required
            />
          </label>

          <label>
            Email Address *
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Phone Number (Optional)
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1-555-0199"
            />
          </label>

          <label>
            Password (min 6 characters) *
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
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

          <label>
            Confirm Password *
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch" style={{ marginTop: '1.25rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;
