/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBSfzu3-sZqY8wMn_Y3dWG4NRdyO7PE7uw',
  authDomain: 'math-master-bcdbe.firebaseapp.com',
  projectId: 'math-master-bcdbe',
  storageBucket: 'math-master-bcdbe.firebasestorage.app',
  messagingSenderId: '541926029867',
  appId: '1:541926029867:web:0aaeecf5cac899539dc86e',
  measurementId: 'G-YEZRHLKWH2',
});

const messaging = firebase.messaging();

const mapPayload = (payload) => {
  const data = payload?.data || {};
  const metadata = {};

  Object.keys(data).forEach((key) => {
    if (key.startsWith('metadata.')) {
      metadata[key.replace('metadata.', '')] = data[key];
    }
  });

  return {
    id: data.id,
    type: data.type,
    title: payload?.notification?.title || data.title,
    content: payload?.notification?.body || data.content,
    timestamp: data.timestamp,
    createdAt: data.timestamp,
    actionUrl: data.actionUrl,
    metadata,
  };
};

messaging.onBackgroundMessage((payload) => {
  const mapped = mapPayload(payload);

  self.registration.showNotification(mapped.title || 'Notification', {
    body: mapped.content || 'You have a new notification',
    data: mapped,
  });

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'notification-received',
        payload: mapped,
      });
    });
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if available
      for (const client of clients) {
        if ('focus' in client) {
          // Navigate to the action URL if it's different from current
          if (client.url !== new URL(actionUrl, self.location.origin).href) {
            client.postMessage({
              type: 'navigate',
              url: actionUrl,
            });
          }
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
    })
  );
});
