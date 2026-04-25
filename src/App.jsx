import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AllCameraPage from './pages/AllCameraPage';
import BlogPage from './pages/BlogPage';
import BlogPostDetail from './pages/BlogPostDetail';
import ProductDetail from './pages/ProductDetail';
import { adminService } from './services/adminService';
import { analyticsService } from './services/analyticsService';

import './index.css';

/**
 * ARCHITECTURAL DECOUPLING: 
 * We use VITE_DEPLOY_TARGET to toggle between PUBLIC and ADMIN modes.
 */
const DEPLOY_TARGET = import.meta.env.VITE_DEPLOY_TARGET || 'PUBLIC';
const SECRET_ADMIN_PATH = '/quanly-chinha-trungtam';

const RestrictedAccessWarning = () => {
  const [ip, setIp] = useState('Đang lấy IP...');
  const [locationStr, setLocationStr] = useState('Đang xác định...');
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    // Fetch IP and Location with Fallback
    fetch('https://ipinfo.io/json')
      .then(r => r.json())
      .then(data => {
        setIp(data.ip || 'Unknown');
        if (data.city && data.country) {
          setLocationStr(`${data.city}, ${data.region || ''}, ${data.country}`);
        } else {
          setLocationStr('Không xác định');
        }
      })
      .catch(() => {
        // Fallback to just IP if location provider is blocked (e.g. by AdBlocker)
        fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(data => {
            setIp(data.ip);
            setLocationStr('Không thể lấy vị trí');
          })
          .catch(() => {
            setIp('Không tin cậy (Ẩn danh)');
            setLocationStr('Đã bị ẩn/Proxy');
          });
      });

    // Get Device/Browser Info
    const ua = navigator.userAgent;
    let browser = 'Không xác định';
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

    let os = 'Không xác định';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';

    setDeviceInfo(`${os} - ${browser}`);
  }, []);

  return (
    <div style={{ 
      height: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffffff', color: '#0f0',
      fontFamily: 'monospace', textAlign: 'center', padding: '2rem'
    }}>
      <img src="https://i.ibb.co/6RQ6McRD/restricted.png" alt="restricted" style={{ height: '120px', margin: '0 0 15px 0' }}></img>
      <h1 style={{ color: '#000000ff', fontSize: '3rem', margin: '0 0 1rem 0',fontFamily:"ShopeeDisplayB" }}>TRUY CẬP BỊ TỪ CHỐI</h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.6, color: '#000000ff',fontFamily:"ShopeeDisplayR" }}>
        Khu vực chỉ dành cho quản trị viên của ChinHaStore và đội ngũ kỹ thuật. Xin vui lòng đừng cố gắng xâm nhập trái phép. Chúng tôi đã ghi lại lưu lượng truy cập này và theo dõi
      </p>
      
      <div style={{
          marginTop: '2rem', padding: '1.5rem', backgroundColor: '#000000ff', 
          border: '1px solid #333', textAlign: 'left', minWidth: '350px',
          color: '#e82323ff',fontFamily:"ShopeeDisplayR"
      }}>

        <p style={{ margin: '0.6rem 0' }}><strong>IP Address:</strong> <span style={{color: '#fff'}}>{ip}</span></p>
        <p style={{ margin: '0.6rem 0' }}><strong>Vị trí:</strong> <span style={{color: '#fff'}}>{locationStr}</span></p>
        <p style={{ margin: '0.6rem 0' }}><strong>Thiết bị:</strong> <span style={{color: '#fff'}}>{deviceInfo}</span></p>
        <p style={{ margin: '0.6rem 0' }}><strong>Thời gian:</strong> <span style={{color: '#fff'}}>{new Date().toLocaleTimeString('vi-VN')}</span></p>
      </div>

      <button 
        onClick={() => window.location.href = '/'}
        style={{ 
          marginTop: '3rem', padding: '1rem 2.5rem', backgroundColor: '#d49d24ff', color: '#fff',
          border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem',
          letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s'
        }}
      >
        Trở Về Trang Chủ
      </button>
    </div>
  );
};

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

  // SESSION HARDENING: Check for session & record analytics visit
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await adminService.getUser();
        setAdminUser(user);
        
        // Record visit ONLY for non-admins (storefront visitors)
        if (!isAdminHost && !isSecretPath) {
          analyticsService.recordVisit();
        }
      } catch (err) {
        console.error('App init failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();
  }, [isAdminHost, isSecretPath]);

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
        <span>Đang xác minh thiết bị...</span>
      </div>
    );
  }

  // Specialized Restricted Access Deterrence
  if (isLegacyAdminPath && !isAdminHost) {
    return <RestrictedAccessWarning />;
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
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
        <Route path="/camera/:slug" element={<ProductDetail />} />
        
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
