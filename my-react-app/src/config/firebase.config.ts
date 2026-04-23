import type { FirebaseOptions } from 'firebase/app';

export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBSfzu3-sZqY8wMn_Y3dWG4NRdyO7PE7uw',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'math-master-bcdbe.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'math-master-bcdbe',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'math-master-bcdbe.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '541926029867',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || '1:541926029867:web:0aaeecf5cac899539dc86e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YEZRHLKWH2',
};

export const firebaseVapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY ||
  'BHZaNgGhgCgfZ5jy4_oZfMTVJb0bgmsoqMqi5sS8Ij6kPRKeKKp3SC9GdkGGsVReOJNeNbGvZBsM3ESAdw9NnL4';
