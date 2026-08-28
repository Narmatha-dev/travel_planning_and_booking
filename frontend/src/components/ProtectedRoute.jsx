import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAppContext();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s infinite' }}>✈️</div>
        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#BE5985' }}>
          Verifying authenticated session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} state={{ from: location }} replace />;
  }

  return children;
}
