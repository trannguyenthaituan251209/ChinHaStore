import { supabase } from '../utils/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BOMdHZWawV8n1ZHEjCjZ9Ux1m1v4qnXcMPsgFe-ci94efc6NTlfP2YakF6M6yDBcD88TdxQinlJdhj-pMSWfRq8';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationService {
  constructor() {
    this.audioContext = null;
    this.swRegistration = null;
    this.isAudioUnlocked = false;

    // Auto-init SW in browser environment and sync push subscription
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.initServiceWorker().then(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          this.subscribePushManager();
        }
      });
    }
  }

  /**
   * Check if the current browser environment supports Notifications
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check if running in a secure context (HTTPS or localhost)
   */
  isSecureContext() {
    return typeof window !== 'undefined' && window.isSecureContext === true;
  }

  /**
   * Detect if current platform is iOS (iPhone/iPad)
   */
  isIOS() {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
    const isMacTouch = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
    return isIOSDevice || isMacTouch;
  }

  /**
   * Check if web app is running in Standalone PWA mode (Added to Home Screen)
   */
  isStandalone() {
    if (typeof window === 'undefined') return false;
    const isStandaloneNav = window.navigator.standalone === true;
    const isDisplayStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return isStandaloneNav || isDisplayStandalone;
  }

  /**
   * Get current notification permission state
   */
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', 'default'
  }

  /**
   * Check if user has enabled order notification sound
   */
  isSoundEnabled() {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem('chin_notify_sound');
    return val !== 'false'; // default to true
  }

  /**
   * Set sound toggle preference
   */
  setSoundEnabled(enabled) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('chin_notify_sound', enabled ? 'true' : 'false');
  }

  /**
   * Register service worker
   */
  async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log(' ChinHaStore: Service Worker đã kích hoạt:', this.swRegistration.scope);
      return this.swRegistration;
    } catch (err) {
      console.warn(' ChinHaStore: Lỗi khi đăng ký Service Worker:', err);
      return null;
    }
  }

  /**
   * Ensure AudioContext is initialized and unlocked via user interaction
   */
  unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.isAudioUnlocked = true;
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }

  /**
   * Play crystal notification chime using Web Audio API
   * Supports 'pending' (gentle boutique chord) and 'confirmed' (triumphant celebratory chime for paid orders)
   */
  playChime(type = 'pending') {
    if (!this.isSoundEnabled()) return;

    try {
      this.unlockAudio();
      if (!this.audioContext) return;

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (type === 'confirmed') {
        // Triumphant, sparkling 4-tone ascending crescendo for paid orders ("Ka-ching" boutique chime)
        const notes = [
          { freq: 783.99, time: 0.0, duration: 0.35, gain: 0.25 },   // G5
          { freq: 1046.50, time: 0.09, duration: 0.35, gain: 0.3 },  // C6
          { freq: 1318.51, time: 0.18, duration: 0.45, gain: 0.35 }, // E6
          { freq: 1760.00, time: 0.28, duration: 1.0, gain: 0.45 }   // A6 (bright sparkling bell)
        ];

        notes.forEach(({ freq, time, duration, gain }) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle'; // triangle gives a warmer, metallic bell shimmer
          osc.frequency.setValueAtTime(freq, now + time);

          gainNode.gain.setValueAtTime(0.001, now + time);
          gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.015);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + duration + 0.05);
        });
      } else {
        // Chord frequencies: E5, G#5, B5, E6 (Harmonious E Major Chord for Pending orders)
        const notes = [
          { freq: 659.25, time: 0.0, duration: 0.45, gain: 0.25 },
          { freq: 830.61, time: 0.08, duration: 0.45, gain: 0.3 },
          { freq: 987.77, time: 0.16, duration: 0.55, gain: 0.35 },
          { freq: 1318.51, time: 0.25, duration: 0.85, gain: 0.4 }
        ];

        notes.forEach(({ freq, time, duration, gain }) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          // Exponential decay envelope
          gainNode.gain.setValueAtTime(0.001, now + time);
          gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + duration + 0.05);
        });
      }
    } catch (err) {
      console.warn('Không thể phát âm thanh thông báo:', err);
    }
  }

  /**
   * Vibrate device if supported
   */
  vibrate(type = 'pending') {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'confirmed') {
          // Double buzz celebratory pattern for paid orders
          navigator.vibrate([150, 80, 150, 80, 450]);
        } else {
          // Standard alert pattern
          navigator.vibrate([200, 100, 200, 100, 350]);
        }
      }
    } catch {
      // Ignore vibration errors
    }
  }

  /**
   * Request Notification permission (MUST be called from user gesture e.g. click/tap)
   */
  async requestPermission() {
    // Unlock audio context on this click gesture
    this.unlockAudio();

    if (!this.isSupported()) {
      if (typeof window !== 'undefined' && !this.isSecureContext()) {
        throw new Error(
          'Apple iOS yêu cầu kết nối bảo mật HTTPS để kích hoạt thông báo đẩy màn hình khóa (do đang dùng http:// thay vì https://). Hãy chạy server với HTTPS (ví dụ: https://192.168.x.x:5173).'
        );
      }
      throw new Error('Trình duyệt hoặc thiết bị này không hỗ trợ tính năng thông báo web.');
    }

    // iOS check: If on iPhone but not added to home screen, inform user
    if (this.isIOS() && !this.isStandalone()) {
      return {
        permission: this.getPermission(),
        isIOSBrowser: true,
        message: 'Trên iPhone, bạn cần Thêm ứng dụng vào Màn hình chính (Add to Home Screen) trước khi bật thông báo.'
      };
    }

    // Ensure SW is ready
    await this.initServiceWorker();

    let perm = Notification.permission;
    if (perm !== 'granted') {
      perm = await Notification.requestPermission();
    }

    if (perm === 'granted') {
      localStorage.setItem('chin_notify_enabled', 'true');
      this.playChime();
      this.vibrate();

      // Register device with Apple APNs / Web Push Manager!
      try {
        await this.subscribePushManager();
      } catch (pushErr) {
        console.warn('Lỗi khi đăng ký PushManager:', pushErr);
      }

      // Send a welcome notification
      await this.showNotification('Thông Báo ChinHaStore Đã Sẵn Sàng!', {
        body: 'iPhone đã kích hoạt Apple Web Push. Bạn sẽ nhận được chuông & thông báo ngay cả khi đã thoát app!',
        tag: 'welcome-notification'
      });
    }

    return {
      permission: perm,
      isIOSBrowser: false
    };
  }

  /**
   * Subscribe device with Apple APNs / Web Push using VAPID
   */
  async subscribePushManager() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) {
        console.warn('PushManager không khả dụng trên trình duyệt này');
        return null;
      }

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
        console.log('Đã đăng ký PushSubscription với Apple/Browser:', sub.endpoint);
      }

      if (sub) {
        await this.saveSubscriptionToDatabase(sub);
      }

      return sub;
    } catch (err) {
      console.warn('Lỗi khi đăng ký PushManager:', err);
      return null;
    }
  }

  /**
   * Save or sync push subscription to Supabase `push_subscriptions`
   */
  async saveSubscriptionToDatabase(sub) {
    try {
      const subJson = sub.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;

      if (!sub.endpoint || !p256dh || !auth) {
        console.warn('Subscription thiếu endpoint hoặc keys');
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: sub.endpoint,
          p256dh: p256dh,
          auth: auth,
          user_agent: navigator.userAgent || 'iPhone PWA',
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });

      if (error) {
        console.warn('Lưu push_subscriptions:', error.message);
      } else {
        console.log('Đã đồng bộ Apple Push Token lên Supabase thành công!');
      }
    } catch (err) {
      console.warn('saveSubscriptionToDatabase error:', err);
    }
  }

  /**
   * Send remote push from Cloud via Supabase Edge Function
   * Used to test push when app is CLOSED or screen is locked
   */
  async sendRemotePushTest(type = 'pending') {
    try {
      const isConfirmed = type === 'confirmed';
      const response = await supabase.functions.invoke('send-push-notification', {
        body: {
          type: type,
          isConfirmed: isConfirmed,
          title: isConfirmed ? '⚡ CHỐT TỰ ĐỘNG (ĐÃ THANH TOÁN): #TEST-APNS' : '⏳ CHỜ XÁC NHẬN: #TEST-APNS',
          body: isConfirmed
            ? 'Khách đã chuyển khoản SePay thành công! (Remote Push từ Apple APNs khi app đóng)'
            : 'Khách đặt đơn mới chờ xác nhận! (Remote Push từ Apple APNs khi app đóng)',
          tag: `remote-test-${Date.now()}`
        }
      });

      console.log('sendRemotePushTest response:', response);
      if (response.error) throw response.error;
      return response.data;
    } catch (err) {
      console.error('sendRemotePushTest error:', err);
      throw err;
    }
  }

  /**
   * Core display notification method via ServiceWorker or window.Notification
   */
  async showNotification(title, options = {}) {
    const defaultOptions = {
      icon: '/assets/image/logo.png',
      badge: '/assets/image/logo.png',
      renotify: true,
      vibrate: [300, 150, 300, 150, 400],
      requireInteraction: true,
      data: {
        url: window.location.origin + '/quanly-chinha-trungtam?tab=manager',
        timestamp: Date.now()
      },
      ...options
    };

    // 1. Try ServiceWorker Registration (Required on iOS Safari Standalone Web App)
    if ('serviceWorker' in navigator) {
      try {
        let reg = this.swRegistration;
        if (!reg) {
          reg = await navigator.serviceWorker.ready;
        }

        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions);
          return true;
        }
      } catch (e) {
        console.warn('ServiceWorker showNotification failed, trying fallback:', e);
      }
    }

    // 2. Fallback to standard window.Notification (Desktop Chrome/Firefox/Safari)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, defaultOptions);
        notif.onclick = () => {
          window.focus();
          if (defaultOptions.data?.url) {
            window.location.href = defaultOptions.data.url;
          }
          notif.close();
        };
        return true;
      } catch (e) {
        console.warn('window.Notification fallback failed:', e);
      }
    }

    return false;
  }

  /**
   * Trigger rich notification for a new booking
   * Supports 2 distinct templates:
   * 1. Confirmed / Auto-confirmed (SePay paid)
   * 2. Pending / Awaiting manual confirmation (Unpaid)
   */
  async notifyNewBooking(booking, options = {}) {
    if (!booking) return;

    // Check permission
    const perm = this.getPermission();
    const isPermitted = perm === 'granted';

    // Determine booking status: Confirmed (Paid) vs Pending (Unpaid)
    const isConfirmed = booking.status === 'Confirmed' || options?.isConfirmed === true;
    const notificationType = isConfirmed ? 'confirmed' : 'pending';

    // Format currency
    const formatPrice = (val) => {
      const num = Number(val) || 0;
      return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
    };

    const bookingCode = booking.booking_id || (booking.id ? String(booking.id).slice(0, 8).toUpperCase() : 'MỚI');

    // 1. Play sound & vibrate with status-specific chime & pulse
    if (this.isSoundEnabled()) {
      this.playChime(notificationType);
      this.vibrate(notificationType);
    }

    // 2. Resolve Customer Name & Product Name
    let customerName = booking.customerName || booking.customer_name;
    let customerPhone = booking.phone || booking.customer_phone;
    let productName = booking.productName || booking.product_name;

    // If customer name or product name is not attached to payload, fetch asynchronously
    try {
      const fetchPromises = [];

      if (!customerName && booking.customer_id) {
        fetchPromises.push(
          supabase
            .from('customers')
            .select('full_name, phone')
            .eq('id', booking.customer_id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                customerName = data.full_name;
                customerPhone = data.phone;
              }
            })
        );
      }

      if (!productName && booking.product_id) {
        fetchPromises.push(
          supabase
            .from('products')
            .select('name')
            .eq('id', booking.product_id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                productName = data.name;
              }
            })
        );
      }

      if (fetchPromises.length > 0) {
        await Promise.race([
          Promise.all(fetchPromises),
          new Promise((resolve) => setTimeout(resolve, 800))
        ]);
      }
    } catch (e) {
      console.warn('Lỗi khi lấy thông tin bổ sung đơn hàng:', e);
    }

    // 3. Build Distinct Notification Content based on 2 templates
    let title = '';
    let body = '';
    const customerText = customerName ? `${customerName}${customerPhone ? ` (${customerPhone})` : ''}` : 'Khách hàng';
    const productText = productName ? ` • ${productName}` : '';
    const priceText = booking.total_price ? ` • ${formatPrice(booking.total_price)}` : '';

    if (isConfirmed) {
      // TEMPLATE 1: CHỐT ĐƠN TỰ ĐỘNG (ĐÃ THANH TOÁN QUA SEPAY)
      title = `CHỐT TỰ ĐỘNG: #${bookingCode}`;
      body = `ĐÃ THANH TOÁN (SePay) • ${customerText}${productText}${priceText}\nĐơn đã chốt tự động. Chạm để xem và chuẩn bị máy giao khách!`;
    } else {
      // TEMPLATE 2: CHỜ XÁC NHẬN (CHƯA THANH TOÁN)
      title = `CHỜ XÁC NHẬN: #${bookingCode}`;
      body = `CHƯA THANH TOÁN • ${customerText}${productText}${priceText}\nChạm để mở và liên hệ khách xác nhận đơn thuê!`;
    }

    if (isPermitted) {
      await this.showNotification(title, {
        body: body,
        tag: `booking-${notificationType}-${booking.id || Date.now()}`,
        data: {
          url: `${window.location.origin}/quanly-chinha-trungtam?tab=manager&booking_id=${booking.id || ''}`,
          bookingId: booking.id,
          status: booking.status
        }
      });
    }

    return {
      title,
      body,
      bookingCode,
      customerName,
      productName,
      isConfirmed
    };
  }

  /**
   * Send test notification for testing on iPhone and desktop
   * Supports testing 'pending' or 'confirmed'
   */
  async testNotification(type = 'pending') {
    this.unlockAudio();
    this.playChime(type);
    this.vibrate(type);

    const perm = this.getPermission();
    if (perm !== 'granted') {
      if (this.isSupported()) {
        const result = await this.requestPermission();
        if (result.permission !== 'granted') {
          throw new Error('Quyền thông báo chưa được cấp.');
        }
      } else if (!this.isSecureContext()) {
        throw new Error('Đã phát chuông thành công! (Lưu ý: Thông báo đẩy màn hình khóa trên iPhone yêu cầu chạy dev server qua HTTPS, ví dụ: https://192.168.x.x:5173)');
      }
    }

    if (type === 'confirmed') {
      return await this.showNotification('⚡ CHỐT TỰ ĐỘNG: #TEST-888', {
        body: 'ĐÃ THANH TOÁN (SePay) • Mẫn Hi Chin (0842204207) • Canon EOS R50 • 450.000 đ\nKhách đã chuyển khoản SePay thành công. Đơn hàng tự động chốt!',
        tag: 'test-confirmed-' + Date.now(),
        data: {
          url: window.location.origin + '/quanly-chinha-trungtam?tab=manager'
        }
      });
    } else {
      return await this.showNotification('⏳ CHỜ XÁC NHẬN: #TEST-889', {
        body: 'CHƯA THANH TOÁN • Mẫn Hi Chin (0842204207) • Sony A7 IV • 650.000 đ\nKhách chọn thanh toán sau. Chờ nhân viên liên hệ xác nhận!',
        tag: 'test-pending-' + Date.now(),
        data: {
          url: window.location.origin + '/quanly-chinha-trungtam?tab=manager'
        }
      });
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
