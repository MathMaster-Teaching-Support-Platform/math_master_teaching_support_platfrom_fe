import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types/auth.types';
import type {
  CreateFeedbackPayload,
  FeedbackItem,
  RespondFeedbackPayload,
  SpringPage,
} from '../../types/feedback';
import { AuthService } from './auth.service';

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  return {
    Authorization: `Bearer ${token}`,
    accept: '*/*',
  };
}

function authJsonHeaders(): Record<string, string> {
  return {
    ...authHeaders(),
    'Content-Type': 'application/json',
  };
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const FeedbackService = {
  async create(payload: CreateFeedbackPayload, files: File[] = []): Promise<ApiResponse<FeedbackItem>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    const formData = new FormData();
    formData.append(
      'request',
      new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      })
    );
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACKS}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
      body: formData,
    });
    return parseResponse<FeedbackItem>(res);
  },

  async getMy(page = 0, size = 10): Promise<ApiResponse<SpringPage<FeedbackItem>>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'createdAt,desc',
    });
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACKS_MY}?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<SpringPage<FeedbackItem>>(res);
  },

  async adminGetAll(page = 0, size = 10): Promise<ApiResponse<SpringPage<FeedbackItem>>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'createdAt,desc',
    });
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_FEEDBACKS}?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<SpringPage<FeedbackItem>>(res);
  },

  async respond(feedbackId: string, payload: RespondFeedbackPayload): Promise<ApiResponse<FeedbackItem>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_FEEDBACKS_RESPOND(feedbackId)}`, {
      method: 'PATCH',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return parseResponse<FeedbackItem>(res);
  },

  async markAsRead(feedbackId: string): Promise<ApiResponse<FeedbackItem>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACKS_MARK_READ(feedbackId)}`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return parseResponse<FeedbackItem>(res);
  },
};
