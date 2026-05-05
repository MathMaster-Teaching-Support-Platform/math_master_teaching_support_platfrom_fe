export type CashFlowType = 'INFLOW' | 'OUTFLOW';

export interface CashFlowCategory {
  id: string;
  name: string;
  type: CashFlowType;
  color: string;
  icon: string;
}

export interface CashFlowCategoryBreakdown {
  categoryName: string;
  color: string;
  type: string;
  total: number;
  percentage: number;
}

export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  inflowTrend: number | null;
  outflowTrend: number | null;
  netTrend: number | null;
  fromDate: string;
  toDate: string;
  period: string;
  categoryBreakdown: CashFlowCategoryBreakdown[];
}

export interface CashFlowEntry {
  id: string;
  direction: CashFlowType;
  type: string;
  category: CashFlowCategory;
  amount: number;
  balance?: number;
  currency: string;
  description: string | null;
  userName: string | null;
  userEmail: string | null;
  orderCode: number | null;
  transactionDate: string;
  createdAt: string;
}

export interface CashFlowChartPoint {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashFlowPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type GroupBy = 'hour' | 'day' | 'week' | 'month';
