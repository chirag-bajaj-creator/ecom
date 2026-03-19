import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = ({ isAdmin = false, isDelivery = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated admin/delivery users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'delivery') {
        navigate('/delivery/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      const role = result.data.user.role;

      // RBAC: restrict role-specific login pages
      if (isAdmin && role !== 'admin') {
        setError('This login is for admin users only.');
        setLoading(false);
        return;
      }
      if (isDelivery && role !== 'delivery') {
        setError('This login is for delivery partners only.');
        setLoading(false);
        return;
      }

      // Redirect based on role (replace: true removes login from browser history)
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'delivery') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-popup">
        <h2>{isAdmin ? 'Admin Login' : isDelivery ? 'Delivery Login' : 'Login'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Link to="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!isAdmin && !isDelivery && (
          <p className="auth-switch">
            New to the website?{' '}
            <Link to="/signup">Signup</Link>
          </p>
        )}

        {!isAdmin && !isDelivery && (
          <Link to="/" className="auth-close">✕</Link>
        )}
      </div>
    </div>
  );
};

export default Login;
