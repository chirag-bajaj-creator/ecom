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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminCharges from './pages/admin/AdminCharges';
import CategoryPage from './pages/customer/CategoryPage';
import ProductDetail from './pages/customer/ProductDetail';
import RewardProgram from './pages/customer/RewardProgram';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<Login isAdmin />} />
      <Route path="/login/delivery" element={<Login isDelivery />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/rewards" element={<RewardProgram />} />
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

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/delivery"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDelivery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/charges"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminCharges />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
