/**
 * Order and Refund Type Definitions
 * 
 * These types match the backend DTOs for the new billing flow.
 */

// ─── Order Types ─────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Order {
  id: string;
  orderNumber: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseTitle?: string;
  courseThumbnailUrl?: string;
  enrollmentId?: string;
  status: OrderStatus;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  instructorEarnings: number;
  platformCommission: number;
  expiresAt?: string; // ISO 8601 timestamp
  confirmedAt?: string; // ISO 8601 timestamp
  cancelledAt?: string; // ISO 8601 timestamp
  cancellationReason?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

// ─── Refund Types ────────────────────────────────────────────────────────

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export interface RefundRequest {
  id: string;
  orderId: string;
  orderNumber?: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  courseId?: string;
  courseTitle?: string;
  status: RefundStatus;
  reason?: string;
  refundAmount: number;
  instructorDeduction?: number;
  platformDeduction?: number;
  requestedAt: string; // ISO 8601 timestamp
  processedAt?: string; // ISO 8601 timestamp
  processedBy?: string;
  processorName?: string;
  adminNotes?: string;
  isAutoApproved: boolean;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface RefundRequestInput {
  reason: string;
}

// ─── Helper Types ────────────────────────────────────────────────────────

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export interface RefundStatusBadgeProps {
  status: RefundStatus;
}

// ─── Utility Functions ───────────────────────────────────────────────────

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Chờ xác nhận',
    [OrderStatus.PROCESSING]: 'Đang xử lý',
    [OrderStatus.COMPLETED]: 'Hoàn thành',
    [OrderStatus.FAILED]: 'Thất bại',
    [OrderStatus.CANCELLED]: 'Đã hủy',
    [OrderStatus.REFUNDED]: 'Đã hoàn tiền',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'warning',
    [OrderStatus.PROCESSING]: 'info',
    [OrderStatus.COMPLETED]: 'success',
    [OrderStatus.FAILED]: 'error',
    [OrderStatus.CANCELLED]: 'default',
    [OrderStatus.REFUNDED]: 'secondary',
  };
  return colors[status] || 'default';
};

export const getRefundStatusLabel = (status: RefundStatus): string => {
  const labels: Record<RefundStatus, string> = {
    [RefundStatus.PENDING]: 'Chờ duyệt',
    [RefundStatus.APPROVED]: 'Đã duyệt',
    [RefundStatus.PROCESSING]: 'Đang xử lý',
    [RefundStatus.COMPLETED]: 'Hoàn thành',
    [RefundStatus.REJECTED]: 'Đã từ chối',
  };
  return labels[status] || status;
};

export const getRefundStatusColor = (status: RefundStatus): string => {
  const colors: Record<RefundStatus, string> = {
    [RefundStatus.PENDING]: 'warning',
    [RefundStatus.APPROVED]: 'info',
    [RefundStatus.PROCESSING]: 'info',
    [RefundStatus.COMPLETED]: 'success',
    [RefundStatus.REJECTED]: 'error',
  };
  return colors[status] || 'default';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const calculateTimeRemaining = (expiresAt: string): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
} => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true };
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { minutes, seconds, isExpired: false };
};

export const isOrderExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < new Date().getTime();
};

export const canRequestRefund = (order: Order): boolean => {
  return order.status === OrderStatus.COMPLETED && order.enrollmentId != null;
};

export const canCancelOrder = (order: Order): boolean => {
  return order.status === OrderStatus.PENDING && !isOrderExpired(order.expiresAt);
};

export const canCancelRefundRequest = (refund: RefundRequest): boolean => {
  return refund.status === RefundStatus.PENDING;
};
