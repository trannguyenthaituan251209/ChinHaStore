import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Fingerprint, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import './AppLock.css';
import { adminService } from '../../services/adminService';

// Thời gian không hoạt động trước khi tự động khóa (5 phút)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; 

const AppLock = ({ children }) => {
  const [isLocked, setIsLocked] = useState(() => {
    const credentialId = localStorage.getItem('admin_passkey_id');
    const lastActive = localStorage.getItem('admin_last_active');
    if (lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
      return !!credentialId;
    }
    return false;
  });
  const [fallbackPassword, setFallbackPassword] = useState('');
  const [error, setError] = useState('');

  // Kiểm tra trạng thái khóa khi load
  useEffect(() => {
    const credentialId = localStorage.getItem('admin_passkey_id');
    const lastActive = localStorage.getItem('admin_last_active');
    if (lastActive && Date.now() - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
      if (!credentialId) {
        // Nếu không có passkey mà quá hạn, ép đăng xuất luôn cho an toàn
        adminService.signOut().then(() => window.location.reload());
      }
    } else {
      localStorage.setItem('admin_last_active', Date.now().toString());
    }
  }, []);

  // Theo dõi hoạt động của người dùng
  const updateActivity = useCallback(() => {
    if (isLocked) return;
    localStorage.setItem('admin_last_active', Date.now().toString());
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    
    // Check định kỳ xem có quá hạn không (ví dụ treo tab)
    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem('admin_last_active') || '0');
      if (Date.now() - lastActive > INACTIVITY_TIMEOUT) {
        if (localStorage.getItem('admin_passkey_id')) {
          setIsLocked(true);
        } else {
          adminService.signOut().then(() => window.location.reload());
        }
      }
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [isLocked, updateActivity]);

  // Hàm gọi FaceID / TouchID để mở khóa
  const handleBiometricUnlock = async () => {
    try {
      setError('');
      const credentialIdBase64 = localStorage.getItem('admin_passkey_id');
      if (!credentialIdBase64) return;

      // Chuyển base64 về Uint8Array
      const binaryString = window.atob(credentialIdBase64);
      const credentialId = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        credentialId[i] = binaryString.charCodeAt(i);
      }

      // Tạo chuỗi ngẫu nhiên làm challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Gọi API Sinh trắc học của thiết bị
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            type: 'public-key',
            id: credentialId,
          }],
          userVerification: 'required',
        }
      });

      if (credential) {
        // Mở khóa thành công!
        setIsLocked(false);
        localStorage.setItem('admin_last_active', Date.now().toString());
      }
    } catch (err) {
      console.error('Biometric unlock failed:', err);
      setError('Xác thực sinh trắc học thất bại hoặc bị hủy.');
    }
  };

  // Nếu sinh trắc học lỗi, cho phép mở bằng mật khẩu admin
  const handlePasswordUnlock = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const { data: { user } } = await adminService.getSession();
      if (!user) {
        window.location.reload();
        return;
      }
      // Gọi thử sign in để check mật khẩu (sẽ refresh session luôn)
      await adminService.signIn(user.email, fallbackPassword);
      setIsLocked(false);
      setFallbackPassword('');
      localStorage.setItem('admin_last_active', Date.now().toString());
    } catch (err) {
      console.warn('Mật khẩu mở khóa sai hoặc lỗi:', err.message);
      setError('Mật khẩu không chính xác.');
    }
  };



  if (isLocked) {
    return (
      <div className="app-lock-screen">
        <div className="app-lock-container">
          {!localStorage.getItem('admin_passkey_id') && (
            <div className="passkey-banner">
              <ShieldCheck size={18} />
              <span>Để tăng cường bảo mật, hãy bật tính năng <strong>Khóa Sinh trắc học (FaceID/TouchID)</strong>.</span>
            </div>
          )}
          <div className="lock-icon-wrapper">
            <Lock size={48} className="lock-icon" />
          </div>
          <h2>Phiên làm việc đã bị khóa</h2>
          <p>Hệ thống tự động khóa sau 5 phút không hoạt động để bảo vệ dữ liệu.</p>
          
          <button className="biometric-btn" onClick={handleBiometricUnlock}>
            <Fingerprint size={24} />
            <span>Mở khóa bằng FaceID / TouchID</span>
          </button>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <form onSubmit={handlePasswordUnlock} className="fallback-form">
            <div className="input-with-icon">
              <Key size={18} />
              <input 
                type="password" 
                placeholder="Nhập mật khẩu Admin..." 
                value={fallbackPassword}
                onChange={(e) => setFallbackPassword(e.target.value)}
              />
            </div>
            {error && <div className="lock-error"><AlertCircle size={14}/> {error}</div>}
            <button type="submit" className="pwd-btn" disabled={!fallbackPassword}>
              Mở khóa bằng Mật khẩu
            </button>
          </form>

          <button className="logout-btn" onClick={() => adminService.signOut().then(() => window.location.reload())}>
            Đăng xuất an toàn
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppLock;
