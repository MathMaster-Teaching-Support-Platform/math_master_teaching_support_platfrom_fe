/**
 * Refund Service
 * 
 * Handles all refund-related API calls for the new billing flow.
 */

import api from './api';
import { RefundRequest, RefundRequestInput } from '../types/order.types';
import { Page } from '../types/common.types';

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

class RefundService {
  /**
   * Create a refund request for an order
   */
  async createRefundRequest(
    orderId: string,
    request: RefundRequestInput
  ): Promise<RefundRequest> {
    const response = await api.post<ApiResponse<RefundRequest>>(
      `/api/refunds/orders/${orderId}`,
      request
    );
    return response.data.result;
  }

  /**
   * Get refund request by ID
   */
  async getRefundRequest(refundRequestId: string): Promise<RefundRequest> {
    const response = await api.get<ApiResponse<RefundRequest>>(
      `/api/refunds/${refundRequestId}`
    );
    return response.data.result;
  }

  /**
   * Get all refund requests for the current student
   */
  async getMyRefundRequests(
    page: number = 0,
    size: number = 10
  ): Promise<Page<RefundRequest>> {
    const response = await api.get<ApiResponse<Page<RefundRequest>>>(
      '/api/refunds/my-requests',
      { params: { page, size } }
    );
    return response.data.result;
  }

  /**
   * Get all pending refund requests (admin only)
   */
  async getPendingRefundRequests(
    page: number = 0,
    size: number = 10
  ): Promise<Page<RefundRequest>> {
    const response = await api.get<ApiResponse<Page<RefundRequest>>>(
      '/api/refunds/pending',
      { params: { page, size } }
    );
    return response.data.result;
  }

  /**
   * Approve a refund request (admin only)
   */
  async approveRefundRequest(
    refundRequestId: string,
    adminNotes?: string
  ): Promise<RefundRequest> {
    const response = await api.post<ApiResponse<RefundRequest>>(
      `/api/refunds/${refundRequestId}/approve`,
      null,
      { params: { adminNotes } }
    );
    return response.data.result;
  }

  /**
   * Reject a refund request (admin only)
   */
  async rejectRefundRequest(
    refundRequestId: string,
    adminNotes: string
  ): Promise<RefundRequest> {
    const response = await api.post<ApiResponse<RefundRequest>>(
      `/api/refunds/${refundRequestId}/reject`,
      null,
      { params: { adminNotes } }
    );
    return response.data.result;
  }

  /**
   * Cancel a refund request (student only)
   */
  async cancelRefundRequest(refundRequestId: string): Promise<RefundRequest> {
    const response = await api.post<ApiResponse<RefundRequest>>(
      `/api/refunds/${refundRequestId}/cancel`
    );
    return response.data.result;
  }
}

export default new RefundService();
