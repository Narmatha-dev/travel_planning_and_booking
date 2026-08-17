import { Navigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAppContext();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s infinite' }}>🔄</div>
        <p style={{ color: '#64748b', marginTop: '1rem' }}>Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <section className="section page-section" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #fee2e2',
              padding: '3rem 2rem',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.08)',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚫</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#991b1b', margin: '0 0 0.5rem 0' }}>
              403 Access Denied
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              You are signed in as <strong>{user?.email || 'Traveler'}</strong> (Role: <span style={{ textTransform: 'capitalize', fontWeight: '700', color: '#0369a1' }}>{user?.role || 'traveler'}</span>). Administrator privileges are required to view the management console.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/" className="btn btn-primary">
                Return Home
              </Link>
              <Link to="/profile" className="btn btn-outline">
                View My Profile
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return children;
}
