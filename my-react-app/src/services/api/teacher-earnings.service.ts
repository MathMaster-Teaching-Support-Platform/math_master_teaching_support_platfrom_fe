import { API_BASE_URL } from '../../config/api.config';
import type { ApiResponse } from '../../types/auth.types';
import { AuthService } from './auth.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherEarningsStats {
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingEarnings: number;
  totalStudents: number;
  activeCourses: number;
  avgRevenuePerCourse: number;
  growthPercent: number;
}

export interface MonthRevenue {
  month: number;
  monthName: string;
  revenue: number;
}

export interface TeacherMonthlyRevenue {
  year: number;
  months: MonthRevenue[];
}

export interface TeacherTopCourse {
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  studentCount: number;
  totalRevenue: number;
  avgRating: number;
}

export interface TeacherTransaction {
  transactionId: string;
  walletId: string;
  orderCode: number | null;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  transactionDate: string | null;
  createdAt: string;
}

export interface TeacherTransactionsPage {
  content: TeacherTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    accept: '*/*',
  };
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const json = await res.json().catch(() => ({ code: res.status, result: null }));
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`) as Error & { code?: number };
    err.code = json.code;
    throw err;
  }
  return json as ApiResponse<T>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const TeacherEarningsService = {
  async getEarningsStats(): Promise<ApiResponse<TeacherEarningsStats>> {
    const res = await fetch(`${API_BASE_URL}/teacher/earnings/stats`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<TeacherEarningsStats>(res);
  },

  async getMonthlyRevenue(year?: number): Promise<ApiResponse<TeacherMonthlyRevenue>> {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    const query = params.toString() ? `?${params.toString()}` : '';
    
    const res = await fetch(`${API_BASE_URL}/teacher/earnings/monthly-revenue${query}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<TeacherMonthlyRevenue>(res);
  },

  async getTopCourses(limit: number = 5): Promise<ApiResponse<TeacherTopCourse[]>> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    
    const res = await fetch(`${API_BASE_URL}/teacher/earnings/top-courses?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<TeacherTopCourse[]>(res);
  },

  async getTransactions(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<ApiResponse<TeacherTransactionsPage>> {
    const qp = new URLSearchParams();
    if (params.page !== undefined) qp.set('page', String(params.page));
    if (params.size !== undefined) qp.set('size', String(params.size));
    if (params.sortBy) qp.set('sortBy', params.sortBy);
    if (params.order) qp.set('order', params.order);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    
    const res = await fetch(`${API_BASE_URL}/teacher/earnings/transactions${query}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<TeacherTransactionsPage>(res);
  },
};

// ─── Utils ────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatGrowth(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}
