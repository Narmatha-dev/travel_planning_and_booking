import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import authService from '../services/authService';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthSuccess } = useAppContext();
  const [errorMessage, setErrorMessage] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const redirectParam = searchParams.get('redirect');
    const errorParam = searchParams.get('error');
    const isNewUser = searchParams.get('isNewUser') === 'true';

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
      return;
    }

    if (!token) {
      setErrorMessage('No authentication token received from Google authentication.');
      return;
    }

    async function completeAuth() {
      try {
        let user = null;
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam));
          } catch {
            user = null;
          }
        }

        // Save session locally
        authService.saveAuthSession(token, user);

        // Fetch fresh profile from backend to ensure consistent state
        try {
          const freshUser = await authService.getProfile();
          if (freshUser) {
            user = freshUser;
          }
        } catch (e) {
          console.warn('Could not fetch fresh profile in callback:', e.message);
        }

        // Update context state
        handleOAuthSuccess(token, user);

        // Determine destination
        const defaultDestination = user?.role === 'admin' ? '/admin' : '/';
        const target = redirectParam && redirectParam.startsWith('/') ? redirectParam : defaultDestination;

        const welcomeText = isNewUser
          ? `Welcome to Travel Planner, ${user?.full_name || 'Traveler'}! Your Google account is ready.`
          : `Welcome back, ${user?.full_name || 'Traveler'}! Signed in with Google.`;

        navigate(target, {
          replace: true,
          state: {
            welcomeMessage: welcomeText,
          },
        });
      } catch (err) {
        console.error('Error during OAuth callback processing:', err);
        setErrorMessage(err.message || 'Failed to complete Google authentication.');
      }
    }

    completeAuth();
  }, [searchParams, navigate, handleOAuthSuccess]);

  if (errorMessage) {
    return (
      <section className="auth-section">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Authentication Failed</h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{errorMessage}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-primary full-width">
              Back to Login
            </Link>
            <Link to="/" className="btn btn-outline full-width">
              Return Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0284c7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem',
          }}
        />
        <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Signing In with Google</h3>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Completing your authentication and preparing your travel dashboard...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </section>
  );
}

export default AuthCallbackPage;
