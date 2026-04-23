import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import { firebaseConfig, firebaseVapidKey } from '../config/firebase.config';
import { notificationService } from './notification.service';

const FCM_TOKEN_KEY = 'fcmDeviceToken';

const resolveNotificationPayload = (
  payload: MessagePayload
): Record<string, unknown> => {
  const data = payload.data || {};

  const metadata = Object.keys(data)
    .filter((key) => key.startsWith('metadata.'))
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key.replace('metadata.', '')] = data[key];
      return acc;
    }, {});

  return {
    id: data.id,
    type: data.type,
    title: payload.notification?.title || data.title,
    content: payload.notification?.body || data.content,
    timestamp: data.timestamp,
    createdAt: data.timestamp,
    actionUrl: data.actionUrl,
    metadata,
  };
};

class PushNotificationService {
  private getFirebaseApp() {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp(firebaseConfig);
  }

  private async getMessagingInstance() {
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      return null;
    }

    const app = this.getFirebaseApp();
    return getMessaging(app);
  }

  async initAndRegisterToken() {
    const messaging = await this.getMessagingInstance();
    if (!messaging) {
      return;
    }

    if (!('Notification' in window)) {
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return;
    }

    const previousToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (previousToken === token) {
      // Token unchanged — no need to re-register with the backend.
      return;
    }

    await notificationService.registerPushToken(token, navigator.userAgent);
    localStorage.setItem(FCM_TOKEN_KEY, token);
  }

  async unregisterToken() {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      await notificationService.unregisterPushToken(token);
    } finally {
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
  }

  async subscribeForeground(handler: (payload: Record<string, unknown>) => void) {
    const messaging = await this.getMessagingInstance();
    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, (payload) => {
      handler(resolveNotificationPayload(payload));
    });
  }

  subscribeServiceWorker(handler: (payload: Record<string, unknown>) => void) {
    const listener = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'notification-received') {
        return;
      }

      if (data.payload) {
        handler(data.payload as Record<string, unknown>);
      }
    };

    navigator.serviceWorker.addEventListener('message', listener);
    return () => navigator.serviceWorker.removeEventListener('message', listener);
  }
}

export const pushNotificationService = new PushNotificationService();
