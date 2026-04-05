import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AllCameraPage from './pages/AllCameraPage';
import { adminService } from './services/adminService';

import './index.css';

/**
 * ARCHITECTURAL DECOUPLING: 
 * We use VITE_DEPLOY_TARGET to toggle between PUBLIC and ADMIN modes.
 */
const DEPLOY_TARGET = import.meta.env.VITE_DEPLOY_TARGET || 'PUBLIC';
const SECRET_ADMIN_PATH = '/quanly-chinha-trungtam';

function App() {
  const location = useLocation();
  
  // High-Precision Host & Path Detection
  const isAdminHost = window.location.hostname.startsWith('admin.');
  const isSecretPath = location.pathname.startsWith(SECRET_ADMIN_PATH);
  const isLegacyAdminPath = location.pathname.startsWith('/admin');
  
  // Authoritative Admin Mode Flag
  const isAdminMode = isAdminHost || isSecretPath;

  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // SESSION HARDENING: Check for existing authoritative session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await adminService.getUser();
        setAdminUser(user);
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = async () => {
    const user = await adminService.getUser();
    setAdminUser(user);
  };

  const handleLogout = async () => {
    await adminService.signOut();
    setAdminUser(null);
  };

  // Skip rendering until session is verified
  if (authLoading) {
    return (
      <div className="admin-loading-page">
        <div className="spinner"></div>
        <span>Đang xác minh danh tính...</span>
      </div>
    );
  }

  // Specialized Restricted Access Deterrence
  if (isLegacyAdminPath && !isAdminHost) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff',
        fontFamily: 'monospace', textAlign: 'center', padding: '2rem'
      }}>
        <h1 style={{ color: '#ff0000', fontSize: '3rem', marginBottom: '1rem' }}>ACCESS RESTRICTED</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px' }}>
          This area is monitored and reserved for authorized ChinHaStore personnel only. 
          Unauthorized access attempts are logged and reported.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ 
            marginTop: '2rem', padding: '0.8rem 2rem', backgroundColor: '#fff', color: '#000',
            border: 'none', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          RETURN TO SAFETY
        </button>
      </div>
    );
  }

  // MODE A: ADMIN-ONLY DEPLOYMENT (DEDICATED SUBDOMAIN OR DOMAIN)
  if (DEPLOY_TARGET === 'ADMIN' || isAdminHost) {
    if (!adminUser) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <div className="app admin-mode">
        <Routes>
          <Route path="/" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path={`${SECRET_ADMIN_PATH}/*`} element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  // MODE B: PUBLIC STOREFRONT (MAIN DOMAIN)
  return (
    <div className="app storefront-mode">
      {!isAdminMode && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dat-lich" element={<BookingPage />} />
        <Route path="/all-camera" element={<AllCameraPage />} />
        
        {/* Protected Secret Route on public domain */}
        <Route 
          path={`${SECRET_ADMIN_PATH}/*`} 
          element={
            adminUser ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Default fallback for main storefront */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAdminMode && <Footer />}
    </div>
  );
}

export default App;
