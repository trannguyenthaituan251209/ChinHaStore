self.addEventListener('install', () => {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become available to all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle incoming Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: '[ĐƠN THUÊ MỚI] Vui lòng kiểm tra',
    body: 'Đơn thuê máy ảnh mới vừa được tạo',
    tag: 'booking-alert-' + Date.now(),
    data: { url: '/quanly-chinha-trungtam?tab=manager' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/assets/image/logo.png',
    badge: data.badge || '/assets/image/logo.png',
    tag: data.tag || 'booking-new',
    renotify: true,
    vibrate: [300, 150, 300, 150, 400],
    requireInteraction: true,
    data: data.data || { url: '/quanly-chinha-trungtam?tab=manager' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle Notification Clicks (focus or open admin window)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/quanly-chinha-trungtam?tab=manager';
  const bookingId = event.notification.data?.bookingId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find open admin tab
      for (const client of clientList) {
        if (
          client.url.includes('quanly-chinha-trungtam') ||
          client.url.includes('admin') ||
          client.url.includes('tab=manager')
        ) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE_BOOKING',
            bookingId: bookingId,
            url: targetUrl
          });
          return;
        }
      }

      // If no admin tab is found, try opening the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle Client Messages to show notification via Service Worker
// (Required on iOS Safari PWA where new Notification() in page context is restricted)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: '/assets/image/logo.png',
      badge: '/assets/image/logo.png',
      vibrate: [300, 150, 300, 150, 400],
      requireInteraction: true,
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});
