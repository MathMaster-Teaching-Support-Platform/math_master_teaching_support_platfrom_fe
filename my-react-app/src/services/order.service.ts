/**
 * Order Service
 * 
 * Handles all order-related API calls for the new billing flow.
 */

import api from './api';
import { Order } from '../types/order.types';
import { Page } from '../types/common.types';

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

class OrderService {
  /**
   * Create a new order for a course
   */
  async createOrder(courseId: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(
      `/api/orders/courses/${courseId}`
    );
    return response.data.result;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(
      `/api/orders/${orderId}`
    );
    return response.data.result;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(
      `/api/orders/number/${orderNumber}`
    );
    return response.data.result;
  }

  /**
   * Confirm and process payment for an order
   */
  async confirmOrder(orderId: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(
      `/api/orders/${orderId}/confirm`
    );
    return response.data.result;
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(
      `/api/orders/${orderId}/cancel`,
      null,
      { params: { reason } }
    );
    return response.data.result;
  }

  /**
   * Get all orders for the current student
   */
  async getMyOrders(page: number = 0, size: number = 10): Promise<Page<Order>> {
    const response = await api.get<ApiResponse<Page<Order>>>(
      '/api/orders/my-orders',
      { params: { page, size } }
    );
    return response.data.result;
  }

  /**
   * Check if student has a pending order for a course
   */
  async hasPendingOrder(courseId: string): Promise<boolean> {
    const response = await api.get<ApiResponse<boolean>>(
      `/api/orders/courses/${courseId}/pending`
    );
    return response.data.result;
  }
}

export default new OrderService();
