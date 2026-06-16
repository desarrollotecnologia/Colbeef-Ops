import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageViewTracker from '@/components/PageViewTracker';
import LoginPage from '@/pages/LoginPage';
import OperatorDashboard from '@/pages/operator/OperatorDashboard';
import OperatorSubmissions from '@/pages/operator/OperatorSubmissions';
import FillFormPage from '@/pages/operator/FillFormPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminPending from '@/pages/admin/AdminPending';
import AdminReviewPage from '@/pages/admin/AdminReviewPage';
import AdminSearchPage from '@/pages/admin/AdminSearchPage';
import UsabilityDashboard from '@/pages/panel/UsabilityDashboard';

function homePath(role?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'PANEL') return '/panel';
  return '/';
}

function ProtectedRoute({
  children,
  adminOnly = false,
  panelOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  panelOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (panelOnly && user.role !== 'PANEL') return <Navigate to={homePath(user.role)} replace />;
  if (user.role === 'PANEL' && !panelOnly) return <Navigate to="/panel" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to={homePath(user.role)} replace />;

  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <PageViewTracker />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={homePath(user.role)} replace /> : <LoginPage />}
        />

        {/* Panel oculto de usabilidad */}
        <Route
          path="/panel"
          element={
            <ProtectedRoute panelOnly>
              <UsabilityDashboard />
            </ProtectedRoute>
          }
        />

        {/* Operario */}
        <Route path="/" element={<ProtectedRoute><OperatorDashboard /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><OperatorSubmissions /></ProtectedRoute>} />
        <Route path="/formats/:formatId/new" element={<ProtectedRoute><FillFormPage /></ProtectedRoute>} />
        <Route path="/submissions/:id" element={<ProtectedRoute><FillFormPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/pending" element={<ProtectedRoute adminOnly><AdminPending /></ProtectedRoute>} />
        <Route path="/admin/review/:id" element={<ProtectedRoute adminOnly><AdminReviewPage /></ProtectedRoute>} />
        <Route path="/admin/search" element={<ProtectedRoute adminOnly><AdminSearchPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={homePath(user?.role)} replace />} />
      </Routes>
    </>
  );
}
