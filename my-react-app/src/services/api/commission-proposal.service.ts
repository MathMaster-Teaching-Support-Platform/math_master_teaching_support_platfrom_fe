import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';

// ── Types ────────────────────────────────────────────────────────────────────

export type CommissionProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommissionProposalResponse {
  id: string;
  teacherId: string;
  teacherName: string | null;
  teacherEmail: string | null;
  /** 0.0–1.0 decimal — e.g. 0.8 means 80 % */
  teacherShare: number;
  /** 0.0–1.0 decimal — e.g. 0.2 means 20 % */
  platformShare: number;
  status: CommissionProposalStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CommissionProposalPage {
  content: CommissionProposalResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(json = false): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  const h: Record<string, string> = { Authorization: `Bearer ${token}`, accept: '*/*' };
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

// ── Service ───────────────────────────────────────────────────────────────────

export const CommissionProposalService = {
  // ── Teacher ────────────────────────────────────────────────────────────────

  async submitProposal(
    teacherShare: number
  ): Promise<ApiResponse<CommissionProposalResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_COMMISSION_PROPOSALS}`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ teacherShare }),
    });
    return parseResponse<CommissionProposalResponse>(res);
  },

  async getMyProposals(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<CommissionProposalPage>> {
    const q = new URLSearchParams();
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_COMMISSION_PROPOSALS}?${q.toString()}`,
      { method: 'GET', headers: authHeaders() }
    );
    return parseResponse<CommissionProposalPage>(res);
  },

  async getMyActiveRate(): Promise<ApiResponse<CommissionProposalResponse | null>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_COMMISSION_ACTIVE}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<CommissionProposalResponse | null>(res);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminGetAll(params?: {
    status?: CommissionProposalStatus;
    page?: number;
    size?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<CommissionProposalPage>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    q.set('sortBy', params?.sortBy ?? 'createdAt');
    q.set('order', params?.order ?? 'DESC');
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_COMMISSION_PROPOSALS}?${q.toString()}`,
      { method: 'GET', headers: authHeaders() }
    );
    return parseResponse<CommissionProposalPage>(res);
  },

  async adminReview(
    id: string,
    action: 'APPROVED' | 'REJECTED',
    adminNote?: string
  ): Promise<ApiResponse<CommissionProposalResponse>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_COMMISSION_PROPOSAL_REVIEW(id)}`,
      {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ action, adminNote: adminNote ?? null }),
      }
    );
    return parseResponse<CommissionProposalResponse>(res);
  },
};
