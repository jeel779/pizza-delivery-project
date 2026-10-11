import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pizza, LogOut, LayoutDashboard, Wrench, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <Pizza size={28} />
        <span>PizzaCraft</span>
      </Link>

      <div className="nav-links">
        {isAuthenticated ? (
          <>
            {user?.role === 'admin' ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Shield size={18} /> Admin Panel
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link
                  to="/custom-builder"
                  className={`nav-link ${isActive('/custom-builder') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Wrench size={18} /> Pizza Builder
                </Link>
              </>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Hi, <strong>{user?.name}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', gap: '6px' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
              Login
            </Link>
            <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>
              Register
            </Link>
            <Link
              to="/admin/login"
              className={`nav-link ${isActive('/admin/login') ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '20px' }}
            >
              <Shield size={14} /> Admin Portal
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
