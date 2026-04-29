import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './shared/components/layout/Navbar';
import { Home } from './pages/Home';
const Discover = React.lazy(() => import('./pages/Discover'));
const MediaDetail = React.lazy(() => import('./pages/MangaDetail'));
const AccountSettings = React.lazy(() => import('./pages/AccountSettings'));
const SearchResults = React.lazy(() => import('./pages/SearchResults'));
const Library = React.lazy(() => import('./pages/Library'));
const Analytics = React.lazy(() => import('./pages/MyJourney'));
const Diary = React.lazy(() => import('./pages/Diary'));
const PublicProfile = React.lazy(() => import('./pages/PublicProfile'));
const Collections = React.lazy(() => import('./pages/Collections'));
const CharacterDetail = React.lazy(() => import('./pages/CharacterDetail'));
const OAuthCallback = React.lazy(() => import('./pages/OAuthCallback'));
const AdminLayout = React.lazy(() => import('./features/admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = React.lazy(() => import('./features/admin/pages/AdminOverview'));
const UserManagement = React.lazy(() => import('./features/admin/pages/UserManagement'));
const SyncMonitor = React.lazy(() => import('./features/admin/pages/SyncMonitor'));
const TitleManagement = React.lazy(() => import('./features/admin/pages/TitleManagement'));
const AuditLogs = React.lazy(() => import('./features/admin/pages/AuditLogs'));
const AdminSettings = React.lazy(() => import('./features/admin/pages/AdminSettings'));

import Footer from './shared/components/layout/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ToastProvider } from './app/providers/ToastContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/context/auth-context';
import { normalizeUsername } from './features/profile/utils/profileUsername';
import { GenericPageSkeleton } from './shared/ui/PageSkeletons';

function ProfileRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <GenericPageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  const username = normalizeUsername(user.username || '', user.email);
  return <Navigate to={`/u/${username}`} replace />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/onboarding'].includes(location.pathname);

  // Initialize theme and tactile styles
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const tactileClasses = React.useMemo(() => {
    if (!user?.preferences) return '';
    const { fontStyle, paperTexture, atmosphere } = user.preferences;
    return [
      fontStyle ? `font-style-${fontStyle}` : '',
      paperTexture && paperTexture !== 'none' ? `texture-${paperTexture}` : '',
      atmosphere && atmosphere !== 'none' ? `atmosphere-${atmosphere}` : ''
    ].join(' ').trim();
  }, [user?.preferences]);

  if (!loading && user && user.hasOnboarded === false && location.pathname !== '/onboarding' && !isAuthPage) {
    return <Navigate to="/onboarding" replace />;
  }


  return (
    <div className={`min-h-screen bg-background flex flex-col font-sans text-foreground ${tactileClasses} relative`}>
      {/* Soft Texture Overlay - Global */}
      <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
      />
      
      <Navbar />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.main
          className="flex-1 w-full"
          key={location.pathname}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          <React.Suspense fallback={<GenericPageSkeleton />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/manga/:id" element={<MediaDetail />} />
              <Route path="/anime/:id" element={<MediaDetail />} />
              <Route path="/media/:id" element={<MediaDetail />} />
              <Route path="/character/:id" element={<CharacterDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/u/:username" element={<PublicProfile />} />

              <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
              <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />

              <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileRedirect /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="sync" element={<SyncMonitor />} />
                <Route path="titles" element={<TitleManagement />} />
                <Route path="logs" element={<AuditLogs />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* OAuth popup callback — must be public, no Navbar */}
              <Route path="/oauth/callback" element={<OAuthCallback />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </motion.main>
      </AnimatePresence>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
