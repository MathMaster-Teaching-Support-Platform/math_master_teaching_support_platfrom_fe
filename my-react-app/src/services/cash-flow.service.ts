import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import { translateApiError } from '../utils/errorCodes';
import type {
  CashFlowCategory,
  CashFlowChartPoint,
  CashFlowEntry,
  CashFlowPage,
  CashFlowSummary,
  CashFlowType,
  GroupBy,
} from '../types/cash-flow.types';

// ─── Auth helper ─────────────────────────────────────────────────────────────

const authHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface ApiWrapper<T> {
  code: number;
  message?: string;
  result: T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiWrapper<T> | null;
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
  if (body == null) throw new Error(translateApiError('Empty response'));
  return body.result;
}

function blobResponse(res: Response): Promise<Blob> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

// ─── Query string builder ─────────────────────────────────────────────────────

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const cashFlowService = {
  /** GET /cash-flow/summary */
  getSummary: (from?: string, to?: string): Promise<CashFlowSummary> =>
    fetch(`${API_BASE_URL}/cash-flow/summary?${qs({ from, to })}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<CashFlowSummary>(r)),

  /** GET /cash-flow/transactions */
  getTransactions: (params: {
    type?: CashFlowType | '';
    categoryId?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<CashFlowPage<CashFlowEntry>> =>
    fetch(`${API_BASE_URL}/cash-flow/transactions?${qs(params as Record<string, string>)}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<CashFlowPage<CashFlowEntry>>(r)),

  /** GET /cash-flow/chart */
  getChartData: (groupBy: GroupBy, from: string, to: string): Promise<CashFlowChartPoint[]> =>
    fetch(`${API_BASE_URL}/cash-flow/chart?${qs({ groupBy, from, to })}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<CashFlowChartPoint[]>(r)),

  /** GET /cash-flow/categories */
  getCategories: (): Promise<CashFlowCategory[]> =>
    fetch(`${API_BASE_URL}/cash-flow/categories`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<CashFlowCategory[]>(r)),

  /** GET /cash-flow/export */
  exportExcel: (from: string, to: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/cash-flow/export?${qs({ from, to })}`, {
      headers: authHeaders(),
    }).then(blobResponse),
};

// ─── Currency / date formatters ───────────────────────────────────────────────

export const formatVND = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(dateStr)
  );

export const formatTrend = (trend: number | null): string => {
  if (trend === null) return '—';
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}%`;
};

export const trendColor = (trend: number | null, invertPositive = false): string => {
  if (trend === null) return 'neutral';
  if (trend > 0) return invertPositive ? 'negative' : 'positive';
  if (trend < 0) return invertPositive ? 'positive' : 'negative';
  return 'neutral';
};
