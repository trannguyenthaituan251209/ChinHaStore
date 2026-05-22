import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Settings,
  PieChart,
  LogOut,
  Bell,
  Search,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  BookOpen,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import BookingManager from '../components/admin/BookingManager';
import DatabaseModifier from '../components/admin/DatabaseModifier';
import ReportCenter from '../components/admin/ReportCenter';
import BlogManager from '../components/admin/BlogManager';
import { adminService } from '../services/adminService';
import { supabase } from '../utils/supabase';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, LabelList } from 'recharts';
import './AdminDashboard.css';
import './AdminDashboard_notifs.css';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'manager', 'modify', 'report'
  const [showRevenue, setShowRevenue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Security Passkey Modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  React.useEffect(() => {
    const handleOpenSecurity = () => setShowSecurityModal(true);
    window.addEventListener('open-security-settings', handleOpenSecurity);
    return () => window.removeEventListener('open-security-settings', handleOpenSecurity);
  }, []);

  const handleRegisterPasskey = async () => {
    try {
      if (!window.PublicKeyCredential) {
        showStatus('Trình duyệt hoặc thiết bị của bạn không hỗ trợ Sinh trắc học (Passkeys).', 'error');
        return;
      }

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: 'ChinHaStore Admin' },
          user: {
            id: userId,
            name: 'admin@chinhastore.vn',
            displayName: 'Mẫn Hi Chin'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      if (credential) {
        const idArray = new Uint8Array(credential.rawId);
        let base64Id = '';
        for (let i = 0; i < idArray.byteLength; i++) {
          base64Id += String.fromCharCode(idArray[i]);
        }
        localStorage.setItem('admin_passkey_id', window.btoa(base64Id));
        showStatus('Đăng ký Sinh trắc học thành công! Ứng dụng sẽ khóa sau 5 phút không hoạt động.', 'success');
        setShowSecurityModal(false);
        // Refresh component to clear the top banner
        window.location.reload();
      }
    } catch (err) {
      console.error('Lỗi khi đăng ký Passkey:', err);
      showStatus('Đăng ký thất bại hoặc bạn đã hủy yêu cầu.', 'error');
    }
  };

  const removePasskey = () => {
    localStorage.removeItem('admin_passkey_id');
    showStatus('Đã tắt khóa Sinh trắc học.', 'success');
    setShowSecurityModal(false);
  };

  // Global Status Modal Handle
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const showStatus = (message, type = 'success') => {
    setStatusModal({ isOpen: true, type, message });
  };

  // Close Global Status Modal on Esc/Enter
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (statusModal.isOpen && (e.key === 'Escape' || e.key === 'Enter')) {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
      }
    };
    if (statusModal.isOpen) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [statusModal.isOpen]);

  const fetchStats = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
      setError('Không thể tải dữ liệu từ hệ thống.');
    }
  };

  React.useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };

    if (activeTab === 'dashboard') {
      initFetch();
    }
  }, [activeTab]);

  // Real-time Listening
  React.useEffect(() => {
    console.log('Admin: Attaching Real-time Listener...');

    const channel = supabase
      .channel('realtime_bookings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('⚡ ANY Booking Event Received:', payload);
        const newBooking = payload.new;

        // Only trigger notification on INSERT
        if (payload.eventType === 'INSERT') {
          const notification = {
            id: Date.now(),
            title: 'Đơn hàng mới!',
            message: `Mã đơn #${newBooking.booking_id} vừa được tạo.`,
            time: new Date().toLocaleTimeString('vi-VN'),
            bookingId: newBooking.id
          };

          setNotifications(prev => [notification, ...prev].slice(0, 5));
          setUnreadCount(prev => prev + 1);
        }

        // Refresh stats for ANY change (Insert/Update/Delete) to keep Dashboard fresh
        if (activeTab === 'dashboard') {
          fetchStats();
        }
      })
      .subscribe((status) => {
        console.log('📡 Real-time Subscription Status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error(' Supabase Real-time Error: Check if Replication is enabled for table "bookings"');
        }
      });

    return () => {
      console.log('Admin: Detaching Real-time Listener...');
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'manager', label: 'Đặt Lịch', icon: CalendarCheck },
    { id: 'blog', label: 'Cẩm Nang', icon: BookOpen },
    { id: 'modify', label: 'Cài Đặt', icon: Settings },
    { id: 'report', label: 'Báo Cáo', icon: PieChart },
  ];

  const renderDashboard = () => (
    <div className="admin-overview animate-in">
      <div className="admin-welcome-banner">
        <div className="welcome-text">
          <h1>Xin chào, Mẫn Hi Chin</h1>
          <p>Dưới đây là tóm tắt hoạt động của cửa hàng ngày {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {loading && <div className="admin-loading-spinner-box"><div className="spinner"></div><span>Đang đồng bộ...</span></div>}
      {error && <div className="admin-error-msg">{error}</div>}

      {!loading && !error && stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card primary">
            <div className="stat-header">
              <h4>Máy đang thuê</h4>
              <LayoutDashboard size={20} opacity={0.6} />
            </div>
            <div className="admin-stat-number">{stats.rentingToday}</div>
            <button className="admin-stat-link" onClick={() => setActiveTab('manager')}>Chi tiết ➔</button>
          </div>

          <div className="admin-stat-card">
            <div className="stat-header">
              <h4>Thống kê khách (7 ngày qua)</h4>
              <PieChart size={20} opacity={0.6} />
            </div>
            <div className="admin-stat-delta">
              <span className="delta-num">{stats.weeklyCustomers}</span>
              <span className="delta-perc positive">▲ {stats.weeklyDelta}</span>
            </div>
            <div className="mini-chart-placeholder" style={{ height: '110px', width: '100%', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyChartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dy={5}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', padding: '5px 10px' }}
                  />
                  <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 4, 4]}>
                    <LabelList dataKey="customers" position="top" style={{ fontSize: 10, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-stat-card revenue-card">
            <div className="stat-header">
              <h4>Doanh thu hôm nay</h4>
              <button className="eye-btn icon-btn" onClick={() => setShowRevenue(!showRevenue)}>
                {showRevenue ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="admin-stat-number">{showRevenue ? stats.todayRevenue : '*****.***'} <small>VND</small></div>
          </div>

          <div className="admin-stat-card highlight">
            <div className="stat-header">
              <h4>Sắp tới (7 ngày)</h4>
              <CalendarCheck size={20} opacity={0.6} />
            </div>
            <div className="admin-stat-number">{stats.upcomingEvents}</div>
            <button className="admin-stat-link" onClick={() => setActiveTab('manager')}>Xem danh sách ➔</button>
          </div>

          <div className="admin-stat-card">
            <div className="stat-header">
              <h4>Lượt truy cập</h4>
            </div>
            <div className="admin-stat-number">{stats.todayVisits}</div>
            <div className="admin-stat-delta">
              <span className="delta-perc negative">▼ {stats.visitsDelta}</span>
            </div>
          </div>

          <div className="admin-stat-card booking-summary">
            <div className="stat-header"><h4>Booking Hôm Nay</h4></div>
            <div className="booking-summary-grid">
              <div className="booking-sub-stat"><span>Mới</span><strong className="accent">{stats.bookingNew}</strong></div>
              <div className="booking-sub-stat"><span>Đã trả</span><strong>{stats.bookingReturned}</strong></div>
              <div className="booking-sub-stat"><span>Xác nhận</span><strong>{stats.bookingConfirmed}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar Desktop */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          ChinHa<span>Store</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item security-btn" onClick={() => setShowSecurityModal(true)} style={{ color: '#10b981' }}>
            <ShieldCheck size={20} />
            <span>Bảo mật</span>
          </button>
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {!localStorage.getItem('admin_passkey_id') && (
          <div className="passkey-banner">
            <ShieldCheck size={18} />
            <span>Để tăng cường bảo mật, hãy bật tính năng <strong>Khóa Sinh trắc học (FaceID/TouchID)</strong>.</span>
            <button onClick={() => setShowSecurityModal(true)}>
              Cài đặt ngay
            </button>
          </div>
        )}
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              name="admin-search-field"
            />
          </div>
          <div className="header-actions">
            {/* Diagnostic Ping for testing Real-time */}
            <button
              className="icon-btn debug-ping"
              title="Test Real-time Signal"
              onClick={async () => {
                console.log('Admin: Sending Test Ping...');
                try {
                  await supabase.from('bookings').insert({
                    customer_name: 'TEST REALTIME',
                    phone: '000000000',
                    product_id: 'any',
                    status: 'Pending',
                    total_price: 0,
                    source: 'DEBUG_PING'
                  });
                } catch (e) { console.error('Ping error:', e); }
              }}
            >
              <LogOut size={16} transform="rotate(180)" />
            </button>

            <div className="notification-wrapper">
              <button
                className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setUnreadCount(0);
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown animate-in">
                  <div className="notif-header">
                    <h4>Thông báo mới</h4>
                    <button onClick={() => setNotifications([])}>Xóa hết</button>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="no-notif">Chưa có thông báo mới.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="notif-item" onClick={() => { setActiveTab('manager'); setShowNotifications(false); }}>
                          <div className="notif-content">
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                            <small>{n.time}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-profile" style={{ position: 'relative' }}>
              <div className="admin-avatar" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: 'pointer' }}>
                <User size={20} />
              </div>

              {showProfileMenu && (
                <div className="profile-dropdown animate-in" style={{
                  position: 'absolute',
                  top: '120%',
                  right: '0',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  width: '200px',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div className="profile-header" style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px' }}>Mẫn Hi Chin</strong>
                    <small style={{ color: '#64748b', fontSize: '12px' }}>Quản trị viên</small>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowSecurityModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '14px', fontWeight: '500' }}
                  >
                    <ShieldCheck size={16} /> Bảo mật
                  </button>
                  <button
                    onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ef4444', fontSize: '14px', fontWeight: '500' }}
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showSecurityModal && (
          <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
            <div className="modal-container security-modal-container" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Cài Đặt Bảo Mật Sinh Trắc Học</h3>
                <button className="close-btn" onClick={() => setShowSecurityModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ padding: '20px', textAlign: 'center' }}>
                <Fingerprint size={48} style={{ color: '#10b981', margin: '0 auto 20px' }} />
                <p style={{ marginBottom: '20px', lineHeight: '1.6', color: '#475569' }}>
                  Thiết lập đăng nhập bằng <strong>FaceID, TouchID hoặc Windows Hello</strong>.
                  Sau khi kích hoạt, hệ thống sẽ tự động khóa màn hình nếu bạn không hoạt động trong 5 phút để chống kẻ gian xâm nhập.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {localStorage.getItem('admin_passkey_id') ? (
                    <button onClick={removePasskey} className="action-btn delete-btn" style={{ background: '#ef4444' }}>
                      Tắt Sinh Trắc Học
                    </button>
                  ) : (
                    <button onClick={handleRegisterPasskey} className="action-btn confirm-btn" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Bật Sinh Trắc Học Ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="admin-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'manager' && <BookingManager showStatus={showStatus} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          {activeTab === 'blog' && <BlogManager showStatus={showStatus} />}
          {activeTab === 'modify' && <DatabaseModifier showStatus={showStatus} />}
          {activeTab === 'report' && <ReportCenter showStatus={showStatus} />}
        </main>
      </div>

      {/* Global Status Modal */}
      {statusModal.isOpen && (
        <div className="status-modal-overlay">
          <div className={`status-modal-box animate-in ${statusModal.type}`}>
            <div className="status-modal-icon">
              {statusModal.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
            <div className="status-modal-content">
              <h4>{statusModal.type === 'success' ? 'Thành công' : 'Thông báo lỗi'}</h4>
              <p>{statusModal.message}</p>
            </div>
            <button className="status-modal-close" onClick={() => setStatusModal({ ...statusModal, isOpen: false })}>
              <X size={20} />
            </button>
            <button className="status-modal-btn" onClick={() => setStatusModal({ ...statusModal, isOpen: false })}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Mobile */}
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminDashboard;
