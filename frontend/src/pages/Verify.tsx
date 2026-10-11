import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KeyRound, AlertTriangle, Info } from 'lucide-react';

export const Verify: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state && (location.state as any).email) {
      setEmail((location.state as any).email);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/verify', { email, otp });

      if (res.success) {
        setSuccess('Verification successful! Logging you in...');
        setTimeout(() => {
          login(res.token, res.user);
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-box">
        <div className="auth-header">
          <h1>Verify Email</h1>
          <p>Please enter the 6-digit OTP code sent to your email</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!(location.state && (location.state as any).email)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="otp">6-Digit Verification Code</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="form-control"
                style={{ paddingLeft: '45px', width: '100%', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '16px' }}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="glass-card" style={{ marginTop: '30px', padding: '16px', border: '1px dashed rgba(255, 179, 0, 0.3)', backgroundColor: 'rgba(255, 179, 0, 0.03)', borderRadius: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '6px' }}>
            <Info size={14} /> Developer Tip
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            If you did not configure SMTP credentials in the `.env` file, check the <strong>backend terminal console</strong> or look in the file <strong>`backend/logs/sent-emails.log`</strong> to fetch your generated 6-digit OTP code!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verify;
