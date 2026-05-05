import { API_BASE_URL } from '../config/api.config';
import type { ApiResponse } from '../types/auth.types';
import { AuthService } from './api/auth.service';

// ==================== TYPE DEFINITIONS ====================

export interface DailyRevenue {
  date: string;
  deposits: number;
  subscriptions: number;
  courseSales: number;
  total: number;
}

export interface RevenueBreakdown {
  period: string;
  data: DailyRevenue[];
}

// ==================== API CLIENT ====================

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = AuthService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw error;
  }

  return response.json();
};

const qs = (params: Record<string, string | number | undefined | null>): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
};

export const adminFinancialService = {
  getRevenueBreakdown: async (params?: {
    period?: string;
    groupBy?: 'hour' | 'day' | 'month';
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<RevenueBreakdown> => {
    const query = qs({
      period: params?.period,
      groupBy: params?.groupBy,
      from: params?.from,
      to: params?.to,
      page: params?.page,
      pageSize: params?.pageSize,
    });
    const response: ApiResponse<RevenueBreakdown> = await fetchWithAuth(
      `/admin/dashboard/revenue-breakdown${query ? `?${query}` : ''}`
    );
    return response.result;
  },
};

// ==================== UTILITY FUNCTIONS ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const calculateTotalRevenue = (data: DailyRevenue[]): number => {
  return data.reduce((sum, day) => sum + day.total, 0);
};

export const getRevenueChartData = (data: DailyRevenue[]) => {
  return {
    labels: data.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Đăng ký',
        data: data.map((d) => d.subscriptions),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
      },
      {
        label: 'Khóa học',
        data: data.map((d) => d.courseSales),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
    ],
  };
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || '')).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

