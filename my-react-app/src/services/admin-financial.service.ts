import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

// ==================== TYPE DEFINITIONS ====================

export interface AdminFinancialOverview {
  totalRevenue: number;
  totalRevenueTrend: number;
  platformCommission: number;
  platformCommissionTrend: number;
  activeSubscriptions: number;
  activeSubscriptionsTrend: number;
  totalInstructors: number;
  totalInstructorsTrend: number;
  avgOrderValue: number;
  avgOrderValueTrend: number;
  activeUsers: number;
  activeUsersTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
  churnRate: number;
  churnRateTrend: number;
  period: string;
}

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

export interface MarketplaceTopCourse {
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string;
  instructorId: string;
  instructorName: string;
  salesCount: number;
  totalRevenue: number;
  platformCommission: number;
  instructorEarnings: number;
  avgRating: number;
}

export interface MarketplaceTopInstructor {
  instructorId: string;
  instructorName: string;
  avatarUrl: string;
  courseCount: number;
  totalSales: number;
  totalRevenue: number;
  totalEarnings: number;
  avgRating: number;
  totalStudents: number;
}

export interface SystemHealthMetrics {
  totalTransactions24h: number;
  successRate: number;
  avgProcessingTimeMs: number;
  failedTransactions24h: number;
  pendingTransactions: number;
}

export interface SystemHealthAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export interface GatewayStatus {
  payosStatus: string;
  lastWebhook: string;
  webhookSuccessRate: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  alerts: SystemHealthAlert[];
  metrics: SystemHealthMetrics;
  gatewayStatus: GatewayStatus;
}

// ==================== API CLIENT ====================

export const adminFinancialService = {
  /**
   * Get financial overview for admin dashboard
   */
  getFinancialOverview: async (month?: string): Promise<AdminFinancialOverview> => {
    const params = month ? { month } : {};
    const response = await api.get(API_ENDPOINTS.ADMIN.FINANCIAL_OVERVIEW, { params });
    return response.data.result;
  },

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown: async (period: string = '30d'): Promise<RevenueBreakdown> => {
    const response = await api.get(API_ENDPOINTS.ADMIN.REVENUE_BREAKDOWN, {
      params: { period },
    });
    return response.data.result;
  },

  /**
   * Get top selling courses
   */
  getTopCourses: async (limit: number = 10): Promise<MarketplaceTopCourse[]> => {
    const response = await api.get(API_ENDPOINTS.ADMIN.TOP_COURSES, {
      params: { limit },
    });
    return response.data.result;
  },

  /**
   * Get top earning instructors
   */
  getTopInstructors: async (limit: number = 10): Promise<MarketplaceTopInstructor[]> => {
    const response = await api.get(API_ENDPOINTS.ADMIN.TOP_INSTRUCTORS, {
      params: { limit },
    });
    return response.data.result;
  },

  /**
   * Get financial system health
   */
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH);
    return response.data.result;
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency in VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format trend percentage
 */
export const formatTrend = (trend: number): string => {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}%`;
};

/**
 * Get trend color class
 */
export const getTrendColor = (trend: number): string => {
  if (trend > 0) return 'positive';
  if (trend < 0) return 'negative';
  return 'neutral';
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
    case 'operational':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
};

/**
 * Get severity color class
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format time ago
 */
export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs} giây trước`;
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
};

/**
 * Calculate total revenue from daily data
 */
export const calculateTotalRevenue = (data: DailyRevenue[]): number => {
  return data.reduce((sum, day) => sum + day.total, 0);
};

/**
 * Get chart data for revenue breakdown
 */
export const getRevenueChartData = (data: DailyRevenue[]) => {
  return {
    labels: data.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Nạp tiền',
        data: data.map((d) => d.deposits),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
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

/**
 * Export data to CSV
 */
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
