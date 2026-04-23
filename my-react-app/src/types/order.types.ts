/**
 * Order Type Definitions
 *
 * These types match the backend DTOs for the course billing flow.
 */

// ─── Order Types ─────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
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

// ─── Helper Types ────────────────────────────────────────────────────────

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

// ─── Utility Functions ───────────────────────────────────────────────────

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Chờ xác nhận',
    [OrderStatus.PROCESSING]: 'Đang xử lý',
    [OrderStatus.COMPLETED]: 'Hoàn thành',
    [OrderStatus.FAILED]: 'Thất bại',
    [OrderStatus.CANCELLED]: 'Đã hủy',
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

export const canCancelOrder = (order: Order): boolean => {
  return order.status === OrderStatus.PENDING && !isOrderExpired(order.expiresAt);
};
