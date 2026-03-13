import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/customer/Home';
import SearchResults from './pages/customer/SearchResults';
import Cart from './pages/customer/Cart';
import Wishlist from './pages/customer/Wishlist';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<Login isAdmin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/add-to-cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />

      {/* Redirect based on role after login */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'delivery' ? (
              <Navigate to="/delivery/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Delivery routes (placeholder for Phase 4) */}
      <Route
        path="/delivery/dashboard"
        element={
          <ProtectedRoute roles={['delivery']}>
            <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Delivery Dashboard</h2>
              <p>Coming in Phase 4</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Admin routes (placeholder for Phase 5) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Admin Dashboard</h2>
              <p>Coming in Phase 5</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
