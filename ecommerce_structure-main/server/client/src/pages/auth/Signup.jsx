import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    const checks = [];
    if (password.length < 8) checks.push('Min 8 characters');
    if (!/[A-Z]/.test(password)) checks.push('1 uppercase letter');
    if (!/[a-z]/.test(password)) checks.push('1 lowercase letter');
    if (!/\d/.test(password)) checks.push('1 number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) checks.push('1 special character');
    return checks;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const weaknesses = getPasswordStrength();
    if (weaknesses.length > 0) {
      setError('Password needs: ' + weaknesses.join(', '));
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        inviteCode: formData.role === 'admin' ? formData.inviteCode : undefined,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordHints = getPasswordStrength();

  return (
    <div className="auth-overlay">
      <div className="auth-popup">
        <h2>Create Account</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10 digit phone number"
              maxLength={10}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
            {formData.password && passwordHints.length > 0 && (
              <div className="password-hints">
                {passwordHints.map((hint, i) => (
                  <span key={i} className="hint">{hint}</span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="form-group">
            <label>Register as</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">Customer</option>
              <option value="delivery">Delivery Partner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'admin' && (
            <div className="form-group">
              <label>Admin Invite Code</label>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder="Enter invite code"
                required
              />
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="auth-close">✕</Link>
      </div>
    </div>
  );
};

export default Signup;
