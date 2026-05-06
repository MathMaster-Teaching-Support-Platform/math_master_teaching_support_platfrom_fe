import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types/auth.types';
import { AuthService } from './auth.service';
import { translateApiError } from '../../utils/errorCodes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserInfo {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  roles: string[];
  avatar: string | null;
  status: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalUsersGrowthPercent: number;
  monthlyRevenue: number;
  monthlyRevenueGrowthPercent: number;
  activeEnrollments: number;
  activeEnrollmentsGrowthPercent: number;
  totalTransactions: number;
  totalTransactionsGrowthPercent: number;
  month: string;
}

export interface RecentUser {
  id: string;
  fullName: string | null;
  email: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  createdDate: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AdminTransaction {
  id: string;
  userId: string;
  userName: string;
  planId: string | null;
  planName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  createdAt: string;
}

export interface MonthlyRevenue {
  month: number;
  revenue: number;
}

export interface RevenueByMonth {
  year: number;
  monthly: MonthlyRevenue[];
}

export interface QuickStats {
  conversionRate: number;
  activeUsers: number;
  documentsCreated: number;
  satisfactionRate: number;
}

export interface SystemService {
  name: string;
  status: 'active' | 'warning' | 'error';
  description: string;
  usagePercent: number | null;
}

export interface SystemStatus {
  services: SystemService[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  return {
    Authorization: `Bearer ${token}`,
    accept: '*/*',
  };
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(translateApiError(err.message, err.code));
  }
  return res.json();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const AdminDashboardService = {
  async getMyInfo(): Promise<ApiResponse<AdminUserInfo>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS_MY_INFO}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<AdminUserInfo>(res);
  },

  async getUnreadNotificationCount(): Promise<number> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Lỗi máy chủ (${res.status}). Vui lòng thử lại sau.`);
    // This endpoint returns plain { unreadCount: number } — NOT wrapped in ApiResponse
    const data: { unreadCount: number } = await res.json();
    return data.unreadCount;
  },

  async getDashboardStats(month?: string): Promise<ApiResponse<DashboardStats>> {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_DASHBOARD_STATS}${query}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<DashboardStats>(res);
  },

  async getRecentUsers(page = 0, size = 10): Promise<ApiResponse<SpringPage<RecentUser>>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_USERS_RECENT}?${params.toString()}`,
      {
        method: 'GET',
        headers: authHeaders(),
      }
    );
    return parseResponse<SpringPage<RecentUser>>(res);
  },

  async getRecentTransactions(
    page = 0,
    size = 5
  ): Promise<ApiResponse<SpringPage<AdminTransaction>>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortBy: 'createdAt',
      order: 'DESC',
    });
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_TRANSACTIONS}?${params.toString()}`,
      {
        method: 'GET',
        headers: authHeaders(),
      }
    );
    return parseResponse<SpringPage<AdminTransaction>>(res);
  },

  async getRevenueByMonth(year?: number): Promise<ApiResponse<RevenueByMonth>> {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_DASHBOARD_REVENUE_BY_MONTH}${query}`,
      {
        method: 'GET',
        headers: authHeaders(),
      }
    );
    return parseResponse<RevenueByMonth>(res);
  },

  async getQuickStats(): Promise<ApiResponse<QuickStats>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_DASHBOARD_QUICK_STATS}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<QuickStats>(res);
  },

  async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SYSTEM_STATUS}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<SystemStatus>(res);
  },
};
