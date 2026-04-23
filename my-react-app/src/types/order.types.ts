/**
 * Order Type Definitions
 *
 * These types match the backend DTOs for the course billing flow.
 */

// ─── Order Types ─────────────────────────────────────────────────────────

// Use const object instead of enum (required by erasableSyntaxOnly)
export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

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
  expiresAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Helper Types ────────────────────────────────────────────────────────

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

// ─── Utility Functions ───────────────────────────────────────────────────

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    PENDING: 'Chờ xác nhận',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    FAILED: 'Thất bại',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] ?? status;
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    PENDING: 'warning',
    PROCESSING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELLED: 'default',
  };
  return colors[status] ?? 'default';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const calculateTimeRemaining = (
  expiresAt: string,
): { minutes: number; seconds: number; isExpired: boolean } => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { minutes: 0, seconds: 0, isExpired: true };
  return {
    minutes: Math.floor(diff / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isExpired: false,
  };
};

export const isOrderExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
};

export const canCancelOrder = (order: Order): boolean => {
  return order.status === OrderStatus.PENDING && !isOrderExpired(order.expiresAt);
};
