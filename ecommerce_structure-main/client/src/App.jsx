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
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import MyProfile from './pages/customer/MyProfile';
import OrderTracking from './pages/customer/OrderTracking';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryHistory from './pages/delivery/DeliveryHistory';

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
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/my-profile" element={<MyProfile />} />
      <Route path="/orders/:orderId/tracking" element={<OrderTracking />} />

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

      {/* Delivery routes */}
      <Route
        path="/delivery/dashboard"
        element={
          <ProtectedRoute roles={['delivery']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery/history"
        element={
          <ProtectedRoute roles={['delivery']}>
            <DeliveryHistory />
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
