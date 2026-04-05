import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import './AdminDashboard.css';

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
      setError('Thông tin đăng nhập không chính xác hoặc không có quyền truy cập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page animate-in">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            ChinHa<span>Store</span>
          </div>
          <h1>Quản Trị Viên</h1>
          <p>Hệ thống quản lý authoritative dành riêng cho Mẫn Hi Chin.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group-vip">
            <label><Mail size={16} /> Email</label>
            <input 
              type="email" 
              placeholder="admin@chinhastore.vn" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-vip">
            <label><Lock size={16} /> Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spinner" />
                <span>Đang xác minh...</span>
              </>
            ) : (
              <>
                <span>Xác nhận danh tính</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 ChinHaStore. Bảo mật bởi Supabase Identity.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
