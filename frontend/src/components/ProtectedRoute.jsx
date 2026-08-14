import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAppContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--primary-color, #2563eb)' }}>
          Authenticating session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
