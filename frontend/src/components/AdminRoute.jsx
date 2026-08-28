import { Navigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAppContext();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s infinite' }}>🔄</div>
        <p style={{ color: '#7A5366', marginTop: '1rem', fontWeight: '700' }}>Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login?redirect=/admin" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <section className="section page-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1.5px solid #F3D2E5',
              padding: '3rem 2.25rem',
              boxShadow: '0 16px 40px rgba(190, 89, 133, 0.12)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⛔</div>
            <span
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              Access Denied
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#2D1520', margin: '0 0 0.75rem 0' }}>
              Administrator Privileges Required
            </h2>
            <p style={{ color: '#7A5366', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              The requested administrative workspace is restricted strictly to authorized platform administrators.
              You are currently signed in as <strong>{user?.email || 'Traveler'}</strong> (Role: <span style={{ textTransform: 'capitalize', fontWeight: '800', color: '#EC7FA9' }}>{user?.role || 'user'}</span>).
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link
                to="/admin/login"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                  color: '#ffffff',
                  padding: '0.8rem 1.5rem',
                  fontWeight: '800',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(190, 89, 133, 0.3)',
                }}
              >
                🔑 Sign In as Admin
              </Link>
              <Link
                to="/"
                className="btn btn-outline"
                style={{
                  border: '1.5px solid #F3D2E5',
                  color: '#BE5985',
                  padding: '0.8rem 1.5rem',
                  fontWeight: '800',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                🏠 Return to User Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return children;
}
