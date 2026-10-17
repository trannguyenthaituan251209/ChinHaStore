import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  Fingerprint,
  Volume2,
  VolumeX,
  Smartphone,
  Share,
  PlusCircle,
  Clock,
  Zap,
  Send
} from 'lucide-react';
import BookingManager from '../components/admin/BookingManager';
import DatabaseModifier from '../components/admin/DatabaseModifier';
import ReportCenter from '../components/admin/ReportCenter';
import BlogManager from '../components/admin/BlogManager';
import { adminService } from '../services/adminService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../utils/supabase';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, LabelList } from 'recharts';
import './AdminDashboard.css';
import './AdminDashboard_notifs.css';

const AdminDashboard = ({ onLogout }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Extract initial tab & initial booking slug from URL params or path
  const urlTab = searchParams.get('tab');
  const urlBooking = searchParams.get('booking') || searchParams.get('booking_id');

  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab) return urlTab;
    if (urlBooking) return 'manager';
    return 'dashboard';
  });
  const [initialBookingSlug, setInitialBookingSlug] = useState(() => urlBooking || null);
  const [showRevenue, setShowRevenue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Push Notification & Sound Preferences
  const [pushPermission, setPushPermission] = useState(() => notificationService.getPermission());
  const [soundEnabled, setSoundEnabled] = useState(() => notificationService.isSoundEnabled());
  const [isIOS] = useState(() => notificationService.isIOS());
  const [isStandalone] = useState(() => notificationService.isStandalone());
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);
  const [dismissTopBanner, setDismissTopBanner] = useState(() => {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('chin_dismiss_notif_banner') === 'true';
  });

  const handleEnableNotifications = async () => {
    try {
      const res = await notificationService.requestPermission();
      setPushPermission(res.permission);
      if (res.isIOSBrowser) {
        setShowIosGuideModal(true);
      } else if (res.permission === 'granted') {
        showStatus('Đã kích hoạt thông báo trên thiết bị! Bạn sẽ nhận được chuông và thông báo tức thì khi có đơn mới.', 'success');
      } else if (res.permission === 'denied') {
        showStatus('Bạn đã từ chối quyền thông báo. Hãy bật lại trong cài đặt trình duyệt của thiết bị.', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi bật thông báo:', err);
      showStatus(err.message || 'Không thể kích hoạt thông báo.', 'error');
    }
  };

  const handleTestNotification = async (type = 'pending') => {
    try {
      notificationService.unlockAudio();
      await notificationService.testNotification(type);
      setPushPermission(notificationService.getPermission());
      const label = type === 'confirmed' ? '⚡ Chốt đơn tự động (Đã thanh toán)' : '⏳ Chờ xác nhận (Chưa thanh toán)';
      showStatus(`Đã phát chuông và gửi mẫu thông báo [${label}]!`, 'success');
    } catch (err) {
      console.warn('Test notification warning:', err);
      showStatus(err.message || 'Chưa bật quyền thông báo.', 'error');
    }
  };

  const handleCreateDatabaseTestBooking = async (targetStatus = 'Pending') => {
    try {
      notificationService.unlockAudio();
      const label = targetStatus === 'Confirmed' ? '⚡ Chốt tự động (Đã TT SePay)' : '⏳ Chờ xác nhận (Chưa TT)';
      showStatus(`Đang tạo đơn test [${label}] vào Database Supabase...`, 'info');
      const result = await adminService.createTestBooking(targetStatus);
      showStatus(`Đã tạo đơn test #${result.booking?.booking_id || 'TEST'} [${label}] vào Database thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khi tạo đơn test:', err);
      showStatus('Lỗi khi tạo đơn test: ' + (err.message || 'Kiểm tra kết nối DB'), 'error');
    }
  };

  const handleSendRemotePushTest = async (type = 'pending') => {
    try {
      const label = type === 'confirmed' ? '⚡ Chốt tự động' : '⏳ Chờ duyệt';
      showStatus(`Đang gửi Remote Push [${label}] qua Apple APNs... Bạn hãy vuốt thoát app hoặc khóa màn hình iPhone để xem!`, 'info');
      const res = await notificationService.sendRemotePushTest(type);
      if (res && res.sentCount > 0) {
        showStatus(`Đã gửi Remote Push thành công tới ${res.sentCount} thiết bị iPhone/Web! Hãy kiểm tra màn hình khóa.`, 'success');
      } else {
        showStatus(res?.message || 'Chưa có thiết bị nào trong push_subscriptions. Hãy bật lại thông báo trên iPhone PWA để lưu token.', 'info');
      }
    } catch (err) {
      console.error('Remote push test error:', err);
      showStatus('Lỗi khi gửi Remote Push: ' + (err.message || 'Kiểm tra Edge Function'), 'error');
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    notificationService.setSoundEnabled(nextVal);
    if (nextVal) {
      notificationService.unlockAudio();
      notificationService.playChime();
    }
  };

  // Service Worker Message Listener (Handles click on push notification to navigate)
  useEffect(() => {
    const handleSwMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_NAVIGATE_BOOKING') {
        setActiveTab('manager');
        const targetBookingId = event.data.bookingId || (event.data.url ? new URL(event.data.url, window.location.origin).searchParams.get('booking_id') : null);
        if (targetBookingId) {
          setInitialBookingSlug(targetBookingId);
          setSearchQuery(targetBookingId);
        }
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    return () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

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

  // Map to track known booking IDs and their statuses to prevent double alerts
  // and to detect transitions from 'Pending' -> 'Confirmed' (when SePay payment arrives)
  const knownBookingsMapRef = React.useRef(new Map());
  const isPollerInitializedRef = React.useRef(false);

  // Core handler when a new or updated booking is detected from any source (Polling, Broadcast, CDC)
  const handleDetectedBooking = React.useCallback(async (booking, extraMeta = {}) => {
    if (!booking || !booking.id) return;
    const bId = String(booking.id);
    const currentStatus = booking.status || 'Pending';
    const isConfirmed = currentStatus === 'Confirmed' || extraMeta?.isConfirmed === true;

    const previousStatus = knownBookingsMapRef.current.get(bId);

    // Case 1: Already processed with this exact status -> Skip
    if (previousStatus === currentStatus) {
      return;
    }

    // Case 2: Transition from Pending -> Confirmed (Customer paid via SePay!)
    // Case 3: Brand new booking (not in map yet)
    const isStatusTransitionToConfirmed = previousStatus === 'Pending' && isConfirmed;
    const isNewBooking = !previousStatus;

    if (!isNewBooking && !isStatusTransitionToConfirmed) {
      // Just record updated status (e.g. from Confirmed -> Renting) without re-alerting
      knownBookingsMapRef.current.set(bId, currentStatus);
      return;
    }

    // Record latest status in map
    knownBookingsMapRef.current.set(bId, currentStatus);

    console.log(`🛎️ Admin: Phát hiện ${isConfirmed ? 'CHỐT ĐƠN TỰ ĐỘNG (ĐÃ TT)' : 'ĐƠN CHỜ XÁC NHẬN'}!`, booking);

    try {
      const merged = { ...booking, ...extraMeta, status: currentStatus };
      const info = await notificationService.notifyNewBooking(merged, { isConfirmed });

      const customerDesc = info?.customerName ? `Khách: ${info.customerName}` : '';
      const productDesc = info?.productName ? ` • ${info.productName}` : '';
      const notification = {
        id: Date.now() + Math.random(),
        type: isConfirmed ? 'confirmed' : 'pending',
        isConfirmed: isConfirmed,
        title: isConfirmed ? '⚡ CHỐT TỰ ĐỘNG (ĐÃ THANH TOÁN)' : '⏳ CHỜ XÁC NHẬN',
        message: `Mã đơn #${booking.booking_id || bId.slice(0, 8)}${customerDesc ? ': ' + customerDesc : ''}${productDesc}`,
        time: new Date().toLocaleTimeString('vi-VN'),
        bookingId: booking.id
      };

      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    } catch (err) {
      console.warn('Notification trigger warning:', err);
      const notification = {
        id: Date.now() + Math.random(),
        type: isConfirmed ? 'confirmed' : 'pending',
        isConfirmed: isConfirmed,
        title: isConfirmed ? '⚡ CHỐT TỰ ĐỘNG (ĐÃ THANH TOÁN)' : '⏳ CHỜ XÁC NHẬN',
        message: `Mã đơn #${booking.booking_id || bId.slice(0, 8)} vừa được cập nhật.`,
        time: new Date().toLocaleTimeString('vi-VN'),
        bookingId: booking.id
      };
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    }

    // Refresh stats if in dashboard tab
    fetchStats();
  }, []);

  // Real-time Listening & Smart Polling (Dual-channel Redundancy)
  React.useEffect(() => {
    console.log('Admin: Khởi tạo hệ thống Real-time & Smart Poller...');

    // 1. Initial seed: Load existing latest bookings so we don't alert for past bookings
    const seedExistingBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          data.forEach(b => {
            if (b.id) knownBookingsMapRef.current.set(String(b.id), b.status || 'Pending');
          });
        }
      } catch (e) {
        console.warn('Seed existing bookings warning:', e);
      } finally {
        isPollerInitializedRef.current = true;
      }
    };

    seedExistingBookings();

    // 2. Real-time Subscription: Broadcast Channel + Postgres CDC
    const channel = supabase
      .channel('chin_realtime_orders')
      // A. Broadcast Channel (Instant, works without database replication)
      .on('broadcast', { event: 'new_booking' }, (payload) => {
        console.log('⚡ Broadcast new_booking received:', payload);
        const b = payload.payload?.booking || payload.payload;
        if (b) {
          handleDetectedBooking(b, payload.payload);
        }
      })
      .on('broadcast', { event: 'order_confirmed' }, (payload) => {
        console.log('⚡ Broadcast order_confirmed received:', payload);
        const b = payload.payload?.booking || payload.payload;
        if (b) {
          handleDetectedBooking({ ...b, status: 'Confirmed' }, { ...payload.payload, isConfirmed: true });
        }
      })
      // B. Postgres CDC Changes (If replication is enabled in Supabase)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('⚡ Postgres CDC INSERT received:', payload);
        if (payload.new) {
          handleDetectedBooking(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('⚡ Postgres CDC UPDATE received:', payload);
        if (payload.new) {
          handleDetectedBooking(payload.new);
        }
      })
      .subscribe((status) => {
        console.log('📡 Orders channel subscription status:', status);
      });

    // 3. Smart Polling Fallback (Polls every 8s)
    // Ensures notifications fire even if Realtime replication is disabled, or orders come from old storefront
    const pollForNewBookings = async () => {
      if (!isPollerInitializedRef.current) return;

      try {
        const { data: latestBookings, error } = await supabase
          .from('bookings')
          .select('id, booking_id, customer_id, product_id, total_price, status, created_at, source, is_seen')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error || !latestBookings) return;

        // Check for any unseen booking OR pending -> confirmed transition
        for (const b of latestBookings) {
          const bId = String(b.id);
          const prevStatus = knownBookingsMapRef.current.get(bId);
          if (!prevStatus || (prevStatus === 'Pending' && b.status === 'Confirmed')) {
            console.log('🔍 Smart Poller phát hiện sự kiện đơn hàng:', b.booking_id, b.status);
            await handleDetectedBooking(b);
          }
        }
      } catch (pollErr) {
        console.warn('Smart Poller error:', pollErr);
      }
    };

    const pollInterval = setInterval(pollForNewBookings, 8000);

    // 4. iOS Safari / Tab Wakeup Handler
    // When iPhone screen is turned back on or user returns to PWA, immediately poll!
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pollForNewBookings();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    return () => {
      console.log('Admin: Dọn dẹp Real-time & Poller...');
      clearInterval(pollInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
      supabase.removeChannel(channel);
    };
  }, [handleDetectedBooking]);

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
        {pushPermission !== 'granted' && !dismissTopBanner && (
          <div className="notif-top-banner animate-in">
            <div className="notif-top-banner-content">
              <Bell size={18} style={{ color: '#34d399', flexShrink: 0 }} />
              <div>
                <span>
                  <strong>Thông báo đơn mới:</strong> {isIOS && !isStandalone ? 'Cài đặt Web App trên iPhone để nhận chuông và banner tức thì thay vì check email!' : 'Bật thông báo trên thiết bị để nhận chuông khi có khách thuê máy.'}
                </span>
              </div>
            </div>
            <div className="notif-top-banner-actions">
              {isIOS && !isStandalone ? (
                <button className="btn-banner-enable" onClick={() => setShowIosGuideModal(true)}>
                  Cách cài đặt
                </button>
              ) : (
                <button className="btn-banner-enable" onClick={handleEnableNotifications}>
                  Bật ngay
                </button>
              )}
              <button
                className="btn-banner-dismiss"
                onClick={() => {
                  setDismissTopBanner(true);
                  sessionStorage.setItem('chin_dismiss_notif_banner', 'true');
                }}
                title="Đóng banner"
              >
                <X size={16} />
              </button>
            </div>
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
            {/* Quick Test Order Button (Inserts real pending order into Supabase DB) */}
            <button
              className="icon-btn"
              title="Tạo đơn hàng test thực tế vào Database"
              onClick={handleCreateDatabaseTestBooking}
              style={{ color: '#10b981' }}
            >
              <PlusCircle size={18} />
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

                  {/* Push Notification Device Status & Controls Card */}
                  <div className={`notif-perm-card ${pushPermission === 'granted' ? 'granted' : ''}`}>
                    <div className="notif-perm-status">
                      <span>Thông báo thiết bị</span>
                      <span className={`notif-perm-badge ${pushPermission === 'granted' ? 'active' : pushPermission === 'unsupported' ? 'unsupported' : 'inactive'}`}>
                        {pushPermission === 'granted' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {pushPermission === 'granted' ? 'Đang bật' : pushPermission === 'denied' ? 'Đã tắt' : 'Chưa bật'}
                      </span>
                    </div>

                    {pushPermission !== 'granted' && (
                      <p className="notif-perm-desc">
                        {isIOS && !isStandalone
                          ? 'Cài đặt app trên iPhone để nhận chuông và banner khi có đơn mới thay vì check email.'
                          : 'Bật thông báo để nhận chuông và banner tức thì khi có khách đặt thuê máy.'}
                      </p>
                    )}

                    <div className="notif-perm-actions">
                      {pushPermission === 'granted' ? (
                        <>
                          <div className="notif-test-section-title">Thử nghiệm 2 mẫu thông báo:</div>
                          <div className="notif-btn-row">
                            <button
                              className="btn-notif-action secondary btn-type-pending"
                              onClick={() => handleTestNotification('pending')}
                              title="Thử mẫu thông báo Đơn chờ xác nhận (Chưa thanh toán)"
                            >
                              <Clock size={12} /> ⏳ Thử: Chờ duyệt
                            </button>
                            <button
                              className="btn-notif-action secondary btn-type-confirmed"
                              onClick={() => handleTestNotification('confirmed')}
                              title="Thử mẫu thông báo Chốt đơn tự động (Đã thanh toán SePay)"
                            >
                              <Zap size={12} /> ⚡ Thử: Chốt tự động
                            </button>
                          </div>

                          <div className="notif-test-section-title" style={{ marginTop: '8px' }}>Chèn đơn test vào Database:</div>
                          <div className="notif-btn-row">
                            <button
                              className="btn-notif-action secondary btn-type-pending"
                              onClick={() => handleCreateDatabaseTestBooking('Pending')}
                              title="Tạo đơn thật trạng thái Pending vào Database"
                            >
                              <PlusCircle size={12} /> DB: Chờ duyệt
                            </button>
                            <button
                              className="btn-notif-action secondary btn-type-confirmed"
                              onClick={() => handleCreateDatabaseTestBooking('Confirmed')}
                              title="Tạo đơn thật trạng thái Confirmed vào Database"
                            >
                              <PlusCircle size={12} /> DB: Đã thanh toán
                            </button>
                          </div>

                          <div className="notif-test-section-title" style={{ marginTop: '8px' }}>☁️ Remote Push khi thoát app / khóa màn hình:</div>
                          <div className="notif-btn-row">
                            <button
                              className="btn-notif-action secondary btn-type-pending"
                              onClick={() => handleSendRemotePushTest('pending')}
                              title="Bắn Remote Push Apple APNs: Đơn chờ duyệt (Hãy khóa màn hình để kiểm tra)"
                            >
                              <Send size={12} /> ☁️ Push: Chờ duyệt
                            </button>
                            <button
                              className="btn-notif-action secondary btn-type-confirmed"
                              onClick={() => handleSendRemotePushTest('confirmed')}
                              title="Bắn Remote Push Apple APNs: Chốt tự động (Hãy khóa màn hình để kiểm tra)"
                            >
                              <Send size={12} /> ☁️ Push: Đã TT
                            </button>
                          </div>

                          <button
                            className={`sound-toggle-btn ${soundEnabled ? 'on' : ''}`}
                            onClick={handleToggleSound}
                            title="Bật/Tắt âm thanh chuông"
                            style={{ marginTop: '8px', width: '100%' }}
                          >
                            {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                            {soundEnabled ? 'Chuông thông báo: Bật' : 'Chuông thông báo: Tắt'}
                          </button>
                        </>
                      ) : (
                        <>
                          {isIOS && !isStandalone ? (
                            <button
                              className="btn-notif-action primary"
                              onClick={() => { setShowNotifications(false); setShowIosGuideModal(true); }}
                            >
                              <Smartphone size={12} /> Hướng dẫn iPhone
                            </button>
                          ) : (
                            <button
                              className="btn-notif-action primary"
                              onClick={handleEnableNotifications}
                            >
                              <Bell size={12} /> Bật thông báo ngay
                            </button>
                          )}
                          <button
                            className="btn-notif-action secondary"
                            onClick={() => handleTestNotification('pending')}
                            title="Phát thử âm thanh chuông"
                          >
                            <Volume2 size={12} /> Thử chuông
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="no-notif">Chưa có thông báo mới.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.isConfirmed ? 'is-confirmed' : 'is-pending'}`}
                          onClick={() => { setActiveTab('manager'); setShowNotifications(false); }}
                        >
                          <div className="notif-content">
                            <div className="notif-title-row">
                              <strong>{n.title}</strong>
                              <span className={`notif-badge-tag ${n.isConfirmed ? 'badge-confirmed' : 'badge-pending'}`}>
                                {n.isConfirmed ? 'ĐÃ THANH TOÁN' : 'CHỜ DUYỆT'}
                              </span>
                            </div>
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

        {/* iOS PWA Installation Guide Modal */}
        {showIosGuideModal && (
          <div className="modal-overlay" onClick={() => setShowIosGuideModal(false)}>
            <div className="ios-guide-modal animate-in" onClick={e => e.stopPropagation()}>
              <div className="ios-guide-header">
                <h3><Smartphone size={22} /> Cài Đặt Thông Báo Trên iPhone</h3>
                <button className="close-btn" onClick={() => setShowIosGuideModal(false)}><X size={20} /></button>
              </div>
              <div className="ios-guide-body">
                <div className="ios-guide-step">
                  <div className="step-number">1</div>
                  <div className="step-text">
                    <h4>Mở Safari & Nhấn nút Chia sẻ</h4>
                    <p>Ở thanh công cụ dưới cùng của trình duyệt Safari trên iPhone, chạm vào biểu tượng <span className="step-badge">Chia sẻ ⎋</span> (hình ô vuông có mũi tên hướng lên).</p>
                  </div>
                </div>
                <div className="ios-guide-step">
                  <div className="step-number">2</div>
                  <div className="step-text">
                    <h4>Thêm vào Màn hình chính</h4>
                    <p>Cuộn xuống trong danh sách hành động và chọn dòng <span className="step-badge">Thêm vào MH chính</span> (Add to Home Screen), sau đó nhấn <strong>Thêm</strong> ở góc trên bên phải.</p>
                  </div>
                </div>
                <div className="ios-guide-step">
                  <div className="step-number">3</div>
                  <div className="step-text">
                    <h4>Mở Web App & Bật Thông Báo</h4>
                    <p>Mở biểu tượng <strong>Quản Lý ChinHa</strong> vừa tạo trên màn hình chính iPhone. Hệ thống sẽ phát chuông và gửi thông báo màn hình khóa ngay khi có đơn mới mà không cần check email!</p>
                  </div>
                </div>
                <div className="ios-guide-tip">
                  💡 <strong>Tiêu chuẩn Apple:</strong> Từ iOS 16.4+, Apple chỉ cho phép website gửi thông báo đẩy khi đã được Thêm vào Màn hình chính dưới dạng Web App độc lập (PWA).
                </div>
              </div>
              <div className="ios-guide-footer">
                <button className="btn-ios-guide-close" onClick={() => setShowIosGuideModal(false)}>
                  Tôi đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="admin-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'manager' && (
            <BookingManager 
              showStatus={showStatus} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              initialBookingSlug={initialBookingSlug}
              onClearInitialBookingSlug={() => setInitialBookingSlug(null)}
            />
          )}
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
