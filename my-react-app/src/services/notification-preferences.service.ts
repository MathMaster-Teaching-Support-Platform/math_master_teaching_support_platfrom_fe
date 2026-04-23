import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';

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

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferenceRequest {
  notificationType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

export const notificationPreferencesService = {
  getMyPreferences: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PREFERENCES}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<NotificationPreference[]>),

  updatePreference: (request: NotificationPreferenceRequest) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PREFERENCES}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }).then(handleResponse<NotificationPreference>),

  resetToDefaults: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PREFERENCES_RESET}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),
};