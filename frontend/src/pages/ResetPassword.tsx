import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link: Missing verification token.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('No token provided.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, password });

      if (res.success) {
        setSuccess('Password updated successfully. Redirecting you to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Verification token expired or invalid.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-box">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Create a secure new password for your account</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {token && !success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '45px', width: '100%' }}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '45px', width: '100%' }}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '16px' }}
              disabled={loading}
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Back to{' '}
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
