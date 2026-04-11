import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
export type UserRole = 'TEACHER' | 'STUDENT' | 'ADMIN';

export interface AdminUserItem {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  avatar: string | null;
  status: UserStatus;
  lastLogin: string | null;
  roles: UserRole[];
  createdDate: string;
  phoneNumber: string | null;
  gender: string | null;
  dob: string | null;
  code: string | null;
  banReason: string | null;
  banDate: string | null;
  updatedDate: string;
}

export interface UserStats {
  total: number;
  admins: number;
  teachers: number;
  students: number;
  active: number;
}

export interface UserPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUsersResult {
  users: AdminUserItem[];
  stats: UserStats;
  pagination: UserPagination;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  /** STUDENT_ONLY = has STUDENT role but does NOT have TEACHER role */
  role?: 'TEACHER' | 'STUDENT' | 'STUDENT_ONLY' | 'ADMIN' | 'all';
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'all';
}

export interface CreateUserRequest {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  status?: UserStatus;
  roles?: UserRole[];
  avatar?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dob?: string | null;
  code?: string | null;
}

export interface SendEmailRequest {
  subject: string;
  body: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { message?: string }).message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const body = json as { code?: number; result?: T; message?: string };
  if (body.result !== undefined) return body.result;
  return json as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const userManagementService = {
  async listUsers(params: ListUsersParams = {}): Promise<AdminUsersResult> {
    const { page = 0, pageSize = 10, role, search, status } = params;
    const query = buildQuery({ page, pageSize, role, search, status });
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS}${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminUsersResult>(res);
  },

  async getUserById(userId: string): Promise<AdminUserItem> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_BY_ID(userId)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminUserItem>(res);
  },

  async createUser(data: CreateUserRequest): Promise<AdminUserItem> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS_CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AdminUserItem>(res);
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<AdminUserItem> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS_UPDATE(userId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AdminUserItem>(res);
  },

  async updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<AdminUserItem> {
    const query = `?status=${encodeURIComponent(status)}`;
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_STATUS(userId)}${query}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminUserItem>(res);
  },

  async deleteUser(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS_DELETE(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<unknown>(res);
  },

  async resetPassword(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_RESET_PASSWORD(userId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    await handleResponse<unknown>(res);
  },

  async sendEmail(userId: string, data: SendEmailRequest): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_SEND_EMAIL(userId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    await handleResponse<unknown>(res);
  },

  async exportExcel(
    params: { role?: string; search?: string; status?: string } = {}
  ): Promise<Blob> {
    const query = buildQuery(params as Record<string, string | undefined>);
    const token = AuthService.getToken();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_EXPORT}${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const msg = (json as { message?: string }).message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return res.blob();
  },
};
