import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage';
import OperatorDashboard from '@/pages/operator/OperatorDashboard';
import OperatorSubmissions from '@/pages/operator/OperatorSubmissions';
import FillFormPage from '@/pages/operator/FillFormPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminPending from '@/pages/admin/AdminPending';
import AdminReviewPage from '@/pages/admin/AdminReviewPage';
import AdminSearchPage from '@/pages/admin/AdminSearchPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? '/admin' : '/'} replace /> : <LoginPage />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
