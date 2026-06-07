import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'partner' ? '/partner/dashboard' : '/'} replace />;
  }

  return children;
}
