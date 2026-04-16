import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types/auth.types';
import { AuthService } from './auth.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingCycle = 'FOREVER' | 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR' | 'CUSTOM';

export type PlanStatus = 'ACTIVE' | 'INACTIVE';

export interface PlanStats {
  activeUsers: number;
  revenueThisMonth: number;
  growthPercent: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  currency: string;
  billingCycle: BillingCycle;
  description: string;
  featured: boolean;
  isPublic: boolean;
  status: PlanStatus;
  tokenQuota: number;
  features: string[];
  stats: PlanStats;
  createdAt: string;
  updatedAt: string;
}

export interface MySubscriptionResponse {
  subscriptionId: string;
  planId: string;
  planName: string;
  planSlug: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  tokenQuota: number;
  tokenRemaining: number;
  paymentMethod: string;
}

export interface RevenueStats {
  totalRevenue: number;
  totalRevenueTrend: number;
  totalPaidUsers: number;
  totalPaidUsersTrend: number;
  avgRevenuePerUser: number;
  avgRevenuePerUserTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
  period: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionUser {
  id: string;
  name: string;
  email: string;
  avatarInitial: string;
}

export interface SubscriptionPlanRef {
  id: string;
  name: string;
  slug: string;
}

export interface UserSubscription {
  id: string;
  user: SubscriptionUser;
  plan: SubscriptionPlanRef;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  paymentMethod: string;
  createdAt: string;
}

export interface SubscriptionsPageResult {
  content: UserSubscription[];
  pageable: { pageNumber: number; pageSize: number };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CreatePlanPayload {
  name: string;
  description?: string;
  price: number | null;
  billingCycle: BillingCycle;
  tokenQuota: number;
  features: string[];
  featured?: boolean;
  isPublic?: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  price?: number | null;
  billingCycle?: BillingCycle;
  tokenQuota?: number;
  features?: string[];
  featured?: boolean;
  isPublic?: boolean;
  status?: PlanStatus;
}

export const SUBSCRIPTION_UPDATED_EVENT = 'subscriptionUpdated';

export function notifySubscriptionUpdated(): void {
  window.dispatchEvent(new Event(SUBSCRIPTION_UPDATED_EVENT));
}

export interface GetSubscriptionsParams {
  page?: number;
  size?: number;
  status?: SubscriptionStatus | 'all';
  planId?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Authentication required');
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

export const SubscriptionPlanService = {
  async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<SubscriptionPlan[]>(res);
  },

  async getUserPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS_PLANS}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<SubscriptionPlan[]>(res);
  },

  async getMySubscription(): Promise<ApiResponse<MySubscriptionResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS_ME}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<MySubscriptionResponse>(res);
  },

  async purchasePlan(planId: string): Promise<ApiResponse<MySubscriptionResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTIONS_PURCHASE(planId)}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const parsed = await parseResponse<MySubscriptionResponse>(res);
    notifySubscriptionUpdated();
    return parsed;
  },

  async createPlan(payload: CreatePlanPayload): Promise<ApiResponse<SubscriptionPlan>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return parseResponse<SubscriptionPlan>(res);
  },

  async updatePlan(
    planId: string,
    payload: UpdatePlanPayload
  ): Promise<ApiResponse<SubscriptionPlan>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLAN_DETAIL(planId)}`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return parseResponse<SubscriptionPlan>(res);
  },

  async deletePlan(planId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLAN_DETAIL(planId)}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const err = new Error(json.message || `HTTP ${res.status}`) as Error & { code?: number };
      err.code = json.code;
      throw err;
    }
  },

  async getStats(month?: string): Promise<ApiResponse<RevenueStats>> {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS_STATS}${query}`,
      {
        method: 'GET',
        headers: authHeaders(),
      }
    );
    return parseResponse<RevenueStats>(res);
  },

  async getSubscriptions(
    params: GetSubscriptionsParams = {}
  ): Promise<ApiResponse<SubscriptionsPageResult>> {
    const qp = new URLSearchParams();
    if (params.page !== undefined) qp.set('page', String(params.page));
    if (params.size !== undefined) qp.set('size', String(params.size));
    if (params.status && params.status !== 'all') qp.set('status', params.status);
    if (params.planId) qp.set('planId', params.planId);
    if (params.sortBy) qp.set('sortBy', params.sortBy);
    if (params.order) qp.set('order', params.order);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS_SUBSCRIPTIONS}${query}`,
      {
        method: 'GET',
        headers: authHeaders(),
      }
    );
    return parseResponse<SubscriptionsPageResult>(res);
  },
};

// ─── Utils ────────────────────────────────────────────────────────────────────

/** Map plan slug to CSS badge class used in the subscriptions table */
export function planSlugToBadgeClass(slug: string): string {
  if (slug === 'mien-phi') return 'free';
  if (slug === 'giao-vien') return 'pro';
  if (slug === 'truong-hoc') return 'enterprise';
  return 'free';
}

/** Format price: null → "Liên hệ", 0 → "0đ", else formatCurrency */
export function formatPrice(price: number | null): string {
  if (price === null) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
