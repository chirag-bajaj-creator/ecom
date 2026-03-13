import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        resetToken: token,
        newPassword,
      });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-overlay">
        <div className="auth-popup">
          <h2>Invalid Link</h2>
          <div className="auth-error">No reset token found. Please request a new password reset.</div>
          <p className="auth-switch">
            <Link to="/forgot-password">Try again</Link>
          </p>
          <Link to="/" className="auth-close">✕</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-popup">
        <h2>Reset Password</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </p>

        <Link to="/" className="auth-close">✕</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
