import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AppProvider, useAppContext } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DestinationsPage from './pages/DestinationsPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import PackagesPage from './pages/PackagesPage';
import PackageDetailPage from './pages/PackageDetailPage';
import TripPlannerPage from './pages/TripPlannerPage';
import SafetyPage from './pages/SafetyPage';
import BookingPage from './pages/BookingPage';
import MyTripsPage from './pages/MyTripsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';
import SharedTripPage from './pages/SharedTripPage';
import RewardsPage from './pages/RewardsPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AiAgentPage from './pages/AiAgentPage';
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAppContext();
  const location = useLocation();

  // Hide standard public navbar & footer on Login, Register, Auth Callback, and Dedicated Admin Portal
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const isAuthGateway =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth/callback' ||
    (!isAuthenticated && (location.pathname === '/' || location.pathname === '/home')) ||
    isAdminWorkspace;

  return (
    <div className="app-shell">
      {!isAuthGateway && <Navbar />}
      <main className={isAuthGateway ? 'auth-main-full' : ''}>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Home Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Core User Feature Routes */}
          <Route
            path="/destinations"
            element={
              <ProtectedRoute>
                <DestinationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/destinations/:id"
            element={
              <ProtectedRoute>
                <DestinationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <PackagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages/:id"
            element={
              <ProtectedRoute>
                <PackageDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-planner"
            element={
              <ProtectedRoute>
                <TripPlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-agent"
            element={
              <ProtectedRoute>
                <AiAgentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safety"
            element={
              <ProtectedRoute>
                <SafetyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared-trip/:token"
            element={
              <ProtectedRoute>
                <SharedTripPage />
              </ProtectedRoute>
            }
          />

          {/* Canonical clean redirects for redundant legacy routes */}
          <Route path="/recommendations" element={<Navigate to="/destinations" replace />} />
          <Route path="/copilot" element={<Navigate to="/trip-planner" replace />} />
          <Route path="/offline-trips" element={<Navigate to="/my-trips" replace />} />

          {/* Protected Account & Booking Routes */}
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <UserAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
      {!isAuthGateway && <ChatbotWidget />}
      {!isAuthGateway && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
