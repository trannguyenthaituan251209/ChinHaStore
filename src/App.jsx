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

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
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

  // MODE A: ADMIN-ONLY DEPLOYMENT (DEDICATED DOMAIN)
  if (DEPLOY_TARGET === 'ADMIN') {
    if (!adminUser) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <div className="app admin-mode">
        <Routes>
          <Route path="/" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="/admin/*" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  // MODE B: PUBLIC STOREFRONT (MAIN DOMAIN)
  return (
    <div className="app storefront-mode">
      {!isAdminPath && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dat-lich" element={<BookingPage />} />
        <Route path="/all-camera" element={<AllCameraPage />} />
        
        {/* Protected /admin route even on public domain */}
        <Route 
          path="/admin/*" 
          element={
            adminUser ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
      </Routes>
      {!isAdminPath && <Footer />}
    </div>
  );
}

export default App;
