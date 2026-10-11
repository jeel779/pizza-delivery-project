import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });

      if (res.success) {
        setSuccess('Password reset link has been dispatched to your email address.');
      } else {
        setError(res.message || 'No user found with that email.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-box">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset link</p>
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

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '45px', width: '100%' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="glass-card" style={{ marginTop: '10px', padding: '16px', border: '1px dashed rgba(255, 179, 0, 0.3)', backgroundColor: 'rgba(255, 179, 0, 0.03)', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '6px' }}>
              <Info size={14} /> Developer Tip
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              If you did not configure SMTP credentials in the `.env` file, check the <strong>backend terminal console</strong> or look in the file <strong>`backend/logs/sent-emails.log`</strong> to fetch your generated password reset link!
            </p>
          </div>
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

export default ForgotPassword;
