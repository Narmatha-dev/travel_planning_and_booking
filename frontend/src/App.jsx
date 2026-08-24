import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DestinationsPage from './pages/DestinationsPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import PackagesPage from './pages/PackagesPage';
import PackageDetailPage from './pages/PackageDetailPage';
import TripPlannerPage from './pages/TripPlannerPage';
import RecommendationsPage from './pages/RecommendationsPage';
import BookingPage from './pages/BookingPage';
import MyTripsPage from './pages/MyTripsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:id" element={<DestinationDetailPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:id" element={<PackageDetailPage />} />
              <Route path="/trip-planner" element={<TripPlannerPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />

              {/* Protected Routes */}
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
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
          <ChatbotWidget />
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
