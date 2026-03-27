import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useAuthModal } from './contexts/AuthModalContext';
import AuthModal from './components/common/AuthModal';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ProtectedRoute from './routes/ProtectedRoute';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LogoutPage from './pages/auth/LogoutPage';
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
import SellerProducts from './pages/seller/SellerProducts';
import SellerDeliveryStatus from './pages/seller/SellerDeliveryStatus';
import CategoryPage from './pages/customer/CategoryPage';
import ProductDetail from './pages/customer/ProductDetail';
import RewardProgram from './pages/customer/RewardProgram';
import AdminLogin from './pages/auth/AdminLogin';

// Redirect admin/delivery away from customer pages to their dashboard
const CustomerOnly = ({ children, user }) => {
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;
  if (user?.role === 'seller') return <Navigate to="/seller/products" replace />;
  return children;
};

function AuthModalRenderer() {
  const { modalType, closeAuth } = useAuthModal();

  return (
    <AuthModal isOpen={modalType !== null} onClose={closeAuth}>
      {modalType === 'login' && <LoginForm />}
      {modalType === 'signup' && <SignupForm />}
    </AuthModal>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <>
    <AuthModalRenderer />
    <Routes>
      {/* Public routes — admin/delivery get bounced to their dashboard */}
      <Route path="/" element={
        <CustomerOnly user={user}><Home /></CustomerOnly>
      } />
      <Route path="/goodbye" element={<LogoutPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/search" element={<CustomerOnly user={user}><SearchResults /></CustomerOnly>} />
      <Route path="/category/:slug" element={<CustomerOnly user={user}><CategoryPage /></CustomerOnly>} />
      <Route path="/product/:id" element={<CustomerOnly user={user}><ProductDetail /></CustomerOnly>} />
      <Route path="/rewards" element={<CustomerOnly user={user}><RewardProgram /></CustomerOnly>} />
      <Route path="/add-to-cart" element={<CustomerOnly user={user}><Cart /></CustomerOnly>} />
      <Route path="/wishlist" element={<CustomerOnly user={user}><Wishlist /></CustomerOnly>} />
      <Route path="/checkout" element={<CustomerOnly user={user}><Checkout /></CustomerOnly>} />
      <Route path="/my-orders" element={<CustomerOnly user={user}><MyOrders /></CustomerOnly>} />
      <Route path="/my-profile" element={<CustomerOnly user={user}><MyProfile /></CustomerOnly>} />
      <Route path="/orders/:orderId/tracking" element={<CustomerOnly user={user}><OrderTracking /></CustomerOnly>} />

      {/* Redirect based on role after login */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'delivery' ? (
              <Navigate to="/delivery/dashboard" replace />
            ) : user?.role === 'seller' ? (
              <Navigate to="/seller/products" replace />
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

      {/* Seller routes */}
      <Route
        path="/seller/products"
        element={
          <ProtectedRoute roles={['seller']}>
            <SellerProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/delivery-status"
        element={
          <ProtectedRoute roles={['seller']}>
            <SellerDeliveryStatus />
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

      {/* Catch all — admin/delivery go to their dashboard, others go home */}
      <Route path="*" element={
        user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
        user?.role === 'delivery' ? <Navigate to="/delivery/dashboard" replace /> :
        user?.role === 'seller' ? <Navigate to="/seller/products" replace /> :
        <Navigate to="/" replace />
      } />
    </Routes>
    </>
  );
}

export default App;
