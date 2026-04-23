/**
 * Order Service
 *
 * Handles all order-related API calls for the new billing flow.
 */

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type { Order } from '../types/order.types';
import type { Page } from '../types/common.types';

const getAuthHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = (errorBody as { message?: string }).message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const body = (await res.json()) as ApiResponse<T>;
  return body.result;
}

const BASE = `${API_BASE_URL}/api/orders`;

export const orderService = {
  /** Create a new order for a course */
  createOrder: (courseId: string): Promise<Order> =>
    fetch(`${BASE}/courses/${courseId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<Order>),

  /** Get order by ID */
  getOrder: (orderId: string): Promise<Order> =>
    fetch(`${BASE}/${orderId}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<Order>),

  /** Get order by order number */
  getOrderByNumber: (orderNumber: string): Promise<Order> =>
    fetch(`${BASE}/number/${orderNumber}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<Order>),

  /** Confirm and process payment for an order */
  confirmOrder: (orderId: string): Promise<Order> =>
    fetch(`${BASE}/${orderId}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<Order>),

  /** Cancel a pending order */
  cancelOrder: (orderId: string, reason?: string): Promise<Order> => {
    const url = new URL(`${BASE}/${orderId}/cancel`);
    if (reason) url.searchParams.set('reason', reason);
    return fetch(url.toString(), {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<Order>);
  },

  /** Get all orders for the current student */
  getMyOrders: (page = 0, size = 10): Promise<Page<Order>> => {
    const url = new URL(`${BASE}/my-orders`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
    return fetch(url.toString(), {
      headers: getAuthHeaders(),
    }).then(handleResponse<Page<Order>>);
  },

  /** Check if student has a pending order for a course */
  hasPendingOrder: (courseId: string): Promise<boolean> =>
    fetch(`${BASE}/courses/${courseId}/pending`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<boolean>),
};

export default orderService;
