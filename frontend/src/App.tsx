import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import CustomBuilder from './pages/CustomBuilder';
import OrderSummary from './pages/OrderSummary';
import AdminDashboard from './pages/AdminDashboard';
import { Pizza, Wrench, Shield } from 'lucide-react';

// Route Guard for logged in users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Route Guard for admin tasks
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying admin status...</p>
      </div>
    );
  }
  
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// Landing Home View
const Home: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div style={{ maxWidth: '1000px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255, 94, 58, 0.2), rgba(255, 179, 0, 0.2))', padding: '24px', borderRadius: '50%', color: 'var(--accent-primary)', boxShadow: '0 0 40px var(--accent-primary-glow)' }}>
          <Pizza size={64} />
        </div>
      </div>
      
      <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px', background: 'linear-gradient(135deg, #fff, var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        PizzaCraft
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
        Experience the next generation of pizza delivery. Build your custom pizza step-by-step with real-time stock verification, premium ingredients, and live kitchen tracking.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {isAuthenticated ? (
          isAdmin ? (
            <Link to="/admin/dashboard" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px', gap: '8px' }}>
              <Shield size={18} /> Admin Dashboard
            </Link>
          ) : (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px', gap: '8px' }}>
              Go to Dashboard
            </Link>
          )
        ) : (
          <>
            <Link to="/login" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Get Started (Login)
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Register Account
            </Link>
          </>
        )}
      </div>

      <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--accent-primary)' }}>100% Customized</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pick your favorite base, sauce, cheese type, and multiple fresh toppings from our live stock.</p>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--accent-secondary)' }}>Secure Checkout</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Integrated with Razorpay test checkout simulation so you can safely place test orders.</p>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--success)' }}>Real-Time Tracking</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Watch your pizza progress through preparation stages, synced via WebSockets.</p>
        </div>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* User routes (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/custom-builder"
          element={
            <ProtectedRoute>
              <CustomBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-summary"
          element={
            <ProtectedRoute>
              <OrderSummary />
            </ProtectedRoute>
          }
        />

        {/* Admin routes (Protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Catch-all redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
