import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import '../../pages/auth/Auth.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const { openSignup, closeAuth } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      closeAuth();
      if (user.role === 'delivery') {
        navigate('/delivery/dashboard', { replace: true });
      } else if (user.role === 'seller') {
        navigate('/seller/products', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, closeAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      const role = result.data.user.role;

      closeAuth();

      if (role === 'delivery') {
        navigate('/delivery/dashboard', { replace: true });
      } else if (role === 'seller') {
        navigate('/seller/products', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Login</h2>

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

        <span className="forgot-link" onClick={closeAuth} style={{ cursor: 'pointer' }}>
          <a href="/forgot-password">Forgot password?</a>
        </span>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="auth-switch">
        New to the website?{' '}
        <span onClick={openSignup} style={{ color: '#ff6b00', fontWeight: 600, cursor: 'pointer' }}>
          Signup
        </span>
      </p>
    </>
  );
};

export default LoginForm;
