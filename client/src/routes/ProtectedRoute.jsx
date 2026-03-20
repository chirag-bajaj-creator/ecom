import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Not authenticated → redirect to appropriate login page
  if (!isAuthenticated) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/login/admin" replace />;
    }
    if (location.pathname.startsWith('/delivery')) {
      return <Navigate to="/login/delivery" replace />;
    }
    if (location.pathname.startsWith('/seller')) {
      return <Navigate to="/login/seller" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their own login page
  if (roles && !roles.includes(user.role)) {
    if (roles.includes('admin')) {
      return <Navigate to="/login/admin" replace />;
    }
    if (roles.includes('delivery')) {
      return <Navigate to="/login/delivery" replace />;
    }
    if (roles.includes('seller')) {
      return <Navigate to="/login/seller" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
