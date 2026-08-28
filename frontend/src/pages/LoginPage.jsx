import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import authService from '../services/authService';

function LoginPage({ isGateway = false }) {
  const { user, isAuthenticated, loading, login, authError, setAuthError, language, setLanguage, t } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [cardTransform, setCardTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  // Display error if redirected from OAuth callback with error query param
  useEffect(() => {
    if (errorParam) {
      setLocalError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  // Interactive 3D Card tilt on mouse movement
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setCardTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
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
      const defaultRedirect = result.user?.role === 'admin' ? '/admin' : '/home';
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

    const targetDestination = location.state?.from?.pathname || redirectParam || '/home';
    const googleAuthUrl = authService.getGoogleAuthUrl(targetDestination);
    window.location.href = googleAuthUrl;
  };

  // If already authenticated, redirect to Home or saved target
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const defaultRedirect = user?.role === 'admin' ? '/admin' : '/home';
      const targetDestination = location.state?.from?.pathname || redirectParam || defaultRedirect;
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate, location, redirectParam]);

  return (
    <div className="auth-3d-scene">
      {/* 3D Immersive Background Vista */}
      <div className="auth-3d-bg-image" />
      <div className="auth-3d-overlay" />

      {/* 3D Floating Travel Assets */}
      <div className="auth-3d-floating-asset asset-globe" title="Explore Worldwide">🌍</div>
      <div className="auth-3d-floating-asset asset-plane" title="AI Trip Routing">✈️</div>
      <div className="auth-3d-floating-asset asset-compass" title="Smart Navigation">🧭</div>
      <div className="auth-3d-floating-asset asset-balloon" title="Curated Packages">🎈</div>

      {/* Top Floating Controls (Language) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div className="lang-switch" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* 3D App Name & Branding Header */}
      <div className="auth-3d-header">
        <div className="auth-3d-brand-emblem">
          <span>T</span>
        </div>
        <h1 className="auth-3d-brand-title">Travelora</h1>
        <div className="auth-3d-brand-subtitle">
          {language === 'ta'
            ? '✨ அடுத்த தலைமுறை AI பயண தளம்'
            : '✨ Next-Generation AI Travel Platform'}
        </div>
      </div>

      {/* 3D Glassmorphic Login Card */}
      <div className="auth-3d-card-wrapper">
        <div
          ref={cardRef}
          className="auth-3d-card"
          style={{ transform: cardTransform }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Portal Selector Toggle: Choose Traveler vs Admin */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              style={{
                padding: '0.65rem 0.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#ffffff',
                color: '#BE5985',
                fontWeight: '800',
                fontSize: '0.92rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
              onClick={() => navigate('/admin/login')}
              style={{
                padding: '0.65rem 0.5rem',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span>🛡️</span>
              <span>Admin Portal</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem' }}>
              {language === 'ta' ? 'பயணி உள்நுழைவு' : 'Traveler Sign In'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              {language === 'ta'
                ? 'உங்கள் AI பயணத் திட்டங்கள் மற்றும் முன்பதிவுகளை அணுக உள்நுழைக'
                : 'Sign in to access AI itineraries, live routes & bookings.'}
            </p>
          </div>

          {/* If already authenticated, show friendly session card with option to switch or continue */}
          {isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👋</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem' }}>
                You are currently signed in
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
                Signed in as <strong>{user?.email || 'Traveler'}</strong> ({user?.role === 'admin' ? 'Administrator' : 'Traveler'})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}
                  className="btn btn-primary full-width"
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    background: '#EC7FA9',
                    border: '1px solid #BE5985',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(236, 127, 169, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  ➔ Continue to {user?.role === 'admin' ? 'Admin Dashboard' : 'Home'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    authService.logout();
                    window.location.reload();
                  }}
                  className="btn full-width"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    color: '#BE5985',
                    border: '1.5px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  🚪 Sign in with a different account
                </button>
              </div>
            </div>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
              {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={language === 'ta' ? 'உங்கள் மின்னஞ்சலை உள்ளிடவும்' : 'Enter your email address'}
                autoComplete="off"
                required
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </label>

            <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
              {language === 'ta' ? 'கடவுச்சொல்' : 'Password'}
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'}
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: '#64748b',
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
              style={{
                marginTop: '0.4rem',
                padding: '0.8rem 1.4rem',
                borderRadius: '12px',
                fontSize: '0.96rem',
                fontWeight: '800',
                background: '#EC7FA9',
                border: '1px solid #BE5985',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(236, 127, 169, 0.35)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? language === 'ta'
                  ? 'உள்நுழைகிறது...'
                  : 'Signing In...'
                : language === 'ta'
                ? 'உள்நுழைக ➔'
                : 'Sign In ➔'}
            </button>
          </form>

          {/* OR Divider */}
          <div className="auth-divider" style={{ margin: '1.1rem 0' }}>
            <span>{language === 'ta' ? 'அல்லது' : 'or'}</span>
          </div>

          {/* Google 1-Click Sign-In */}
          <button
            type="button"
            className="btn btn-google full-width"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleLoading}
            style={{
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: '1.5px solid #cbd5e1',
            }}
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
                <span>{language === 'ta' ? 'கூகிள் மூலம் தொடர்க' : 'Continue with Google'}</span>
              </>
            )}
          </button>

          <p className="auth-switch" style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
            {language === 'ta' ? 'கணக்கு இல்லையா?' : "Don't have an account?"}{' '}
            <Link to="/register" style={{ color: '#BE5985', fontWeight: '800' }}>
              {language === 'ta' ? 'புதிய கணக்கை உருவாக்கவும்' : 'Create an account'}
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
