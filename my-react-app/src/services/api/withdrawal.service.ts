import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  ApiResponse,
  CreateWithdrawalRequest,
  VerifyWithdrawalOtpRequest,
  WithdrawalPage,
  WithdrawalRequestResponse,
  WithdrawalStatus,
} from '../../types/wallet.types';
import { AuthService } from './auth.service';

function authHeaders(json = false): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Authentication required');
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    accept: '*/*',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || (payload && payload.code !== 1000)) {
    throw new Error(payload?.message || `HTTP ${res.status}`);
  }
  return payload!;
}

export const WithdrawalService = {
  // ── User ────────────────────────────────────────────────────────────────────

  async createRequest(
    data: CreateWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalRequestResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WITHDRAWAL_REQUEST}`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(data),
    });
    return parseResponse<WithdrawalRequestResponse>(res);
  },

  async verifyOtp(
    data: VerifyWithdrawalOtpRequest
  ): Promise<ApiResponse<WithdrawalRequestResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WITHDRAWAL_VERIFY_OTP}`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(data),
    });
    return parseResponse<WithdrawalRequestResponse>(res);
  },

  async getMyRequests(params?: {
    status?: WithdrawalStatus;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<WithdrawalPage>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.WITHDRAWAL_MY_REQUESTS}?${q.toString()}`,
      { method: 'GET', headers: authHeaders() }
    );
    return parseResponse<WithdrawalPage>(res);
  },

  async cancelRequest(id: string): Promise<ApiResponse<WithdrawalRequestResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WITHDRAWAL_CANCEL(id)}`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return parseResponse<WithdrawalRequestResponse>(res);
  },

  // ── Admin ───────────────────────────────────────────────────────────────────

  async adminGetRequests(params?: {
    status?: WithdrawalStatus;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<WithdrawalPage>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    q.set('sortBy', params?.sortBy ?? 'createdAt');
    q.set('order', params?.order ?? 'DESC');
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_WITHDRAWAL_REQUESTS}?${q.toString()}`,
      { method: 'GET', headers: authHeaders() }
    );
    return parseResponse<WithdrawalPage>(res);
  },

  async adminProcess(
    id: string,
    proofImage: File,
    adminNote?: string
  ): Promise<ApiResponse<WithdrawalRequestResponse>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    const formData = new FormData();
    formData.append('proofImage', proofImage);
    if (adminNote) formData.append('adminNote', adminNote);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_WITHDRAWAL_PROCESS(id)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      body: formData,
    });
    return parseResponse<WithdrawalRequestResponse>(res);
  },

  async adminReject(id: string, reason: string): Promise<ApiResponse<WithdrawalRequestResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_WITHDRAWAL_REJECT(id)}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ reason }),
    });
    return parseResponse<WithdrawalRequestResponse>(res);
  },
};
