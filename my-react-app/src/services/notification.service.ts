import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type { PaginatedNotifications } from '../types/notification';

const getAuthHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = (errorBody as { message?: string }).message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // No Content responses
  if (res.status === 204) return {} as T;
  return res.json();
}

export const notificationService = {
  getNotifications: (page: number = 0, size: number = 20) => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'createdAt,desc',
    });
    return fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS}?${query}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<PaginatedNotifications>);
  },

  getUnreadCount: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<{ unreadCount?: number; count?: number }>),

  markAsRead: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_MARK_READ(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),

  markAllAsRead: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_READ_ALL}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),

  registerPushToken: (token: string, deviceInfo?: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PUSH_TOKEN_REGISTER}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, deviceInfo }),
    }).then(handleResponse<void>),

  unregisterPushToken: (token: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PUSH_TOKEN_UNREGISTER}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    }).then(handleResponse<void>),
};
