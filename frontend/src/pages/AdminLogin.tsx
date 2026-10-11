import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Lock, Mail, Shield, AlertTriangle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/admin/login', { email, password });

      if (res.success) {
        login(res.token, res.user);
        navigate('/admin/dashboard');
      } else {
        setError(res.message || 'Unauthorized. Incorrect admin email or password.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-box" style={{ borderColor: 'rgba(255, 179, 0, 0.25)' }}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(255, 179, 0, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-secondary)' }}>
              <Shield size={32} />
            </div>
          </div>
          <h1 style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Portal
          </h1>
          <p>Login to access inventory & order systems</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '45px', width: '100%' }}
                placeholder="admin@pizza.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '45px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '16px', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Not an admin?{' '}
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
            User Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
