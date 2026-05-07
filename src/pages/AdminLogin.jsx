import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Lock, Key, Mail, AlertCircle, Loader2 } from 'lucide-react';
import '../components/admin/AppLock.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminService.signIn(email, password);
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError('Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-lock-screen animate-in">
      <div className="app-lock-container">
        <div className="lock-icon-wrapper">
          <Lock size={48} className="lock-icon" />
        </div>
        <h2>Xác Thực Quản Trị</h2>
        <p>Vui lòng nhập thông tin để thiết lập phiên làm việc mới với máy chủ.</p>
        
        <form onSubmit={handleSubmit} className="fallback-form">
          <div className="input-with-icon">
            <Mail size={18} />
            <input 
              type="email" 
              placeholder="Nhập Email Admin..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-with-icon">
            <Key size={18} />
            <input 
              type="password" 
              placeholder="Nhập Mật khẩu..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="lock-error">
              <AlertCircle size={14}/> {error}
            </div>
          )}
          
          <button type="submit" className="pwd-btn" disabled={loading || !password || !email}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spinner" />
                Đang kết nối...
              </span>
            ) : 'Đăng nhập Hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
