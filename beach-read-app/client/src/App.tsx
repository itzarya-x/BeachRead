import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { Home } from './pages/Home';
import Discover from './pages/Discover';
import MediaDetail from './pages/MangaDetail';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AccountSettings from './pages/AccountSettings';
import SearchResults from './pages/SearchResults';
import Library from './pages/Library';
import Analytics from './pages/Analytics';
import PublicProfile from './pages/PublicProfile';
import Notifications from './pages/Notifications';
import Collections from './pages/Collections';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/auth-context';
import { normalizeUsername } from './lib/profileUsername';
import { PageLoader } from './components/ui/PageLoader';

function ProfileRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  const username = normalizeUsername(user.username || '', user.email);
  return <Navigate to={`/u/${username}`} replace />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/onboarding'].includes(location.pathname);

  // Initialize theme
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'dark'; // Default to dark
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (!savedTheme) {
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  if (!loading && user && user.hasOnboarded === false && location.pathname !== '/onboarding' && !isAuthPage) {
    return <Navigate to="/onboarding" replace />;
  }


  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground transition-colors duration-300 ease-in-out">
      {!isAuthPage && <Navbar />}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/discover" element={<Discover />} />          <Route path="/manga/:id" element={<MediaDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          
          {/* Protected Routes */}
          <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileRedirect /></ProtectedRoute>} />
          <Route path="/stats" element={<Navigate to="/analytics" replace />} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
