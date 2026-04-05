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
  EyeOff
} from 'lucide-react';
import BookingManager from '../components/admin/BookingManager';
import DatabaseModifier from '../components/admin/DatabaseModifier';
import ReportCenter from '../components/admin/ReportCenter';
import { adminService } from '../services/adminService';
import { supabase } from '../utils/supabase';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'manager', 'modify', 'report'
  const [showRevenue, setShowRevenue] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real-time Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
            message: `${newBooking.customer_name} vừa đặt lịch.`,
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
              <h4>Thống kê khách (Tuần)</h4>
              <PieChart size={20} opacity={0.6} />
            </div>
            <div className="admin-stat-delta">
              <span className="delta-num">{stats.weeklyCustomers}</span>
              <span className="delta-perc positive">▲ {stats.weeklyDelta}</span>
            </div>
            <div className="mini-chart-placeholder">
              {[40, 70, 30, 90, 50, 80, 60].map((h, i) => (
                <div key={i} className="mini-bar" style={{height: `${h}%`}}></div>
              ))}
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
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="Tìm kiếm nhanh..." />
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
                } catch(e) { console.error('Ping error:', e); }
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

            <div className="admin-profile">
              <div className="avatar"><User size={20} /></div>
              <span className="user-name">Mẫn Hi Chin</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'manager' && <BookingManager />}
          {activeTab === 'modify' && <DatabaseModifier />}
          {activeTab === 'report' && <ReportCenter />}
        </main>
      </div>

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
