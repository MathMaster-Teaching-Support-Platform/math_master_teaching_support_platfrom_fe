import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  cashFlowService,
  formatDate,
  formatTrend,
  formatVND,
  trendColor,
} from '../../services/cash-flow.service';
import type {
  CashFlowCategory,
  CashFlowChartPoint,
  CashFlowEntry,
  CashFlowSummary,
  CashFlowType,
  GroupBy,
} from '../../types/cash-flow.types';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';

// ─── DetailModal ──────────────────────────────────────────────────────────
const DetailModal = ({ entry, onClose }: { entry: CashFlowEntry; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/30"
    role="presentation"
    onClick={onClose}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      role="dialog"
      aria-modal="true"
      className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-5">
        <h4 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
          Chi tiết giao dịch
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>
      <dl className="space-y-3 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[#87867F] font-medium shrink-0">Thời gian</dt>
          <dd className="text-[#141413] text-right">{formatDate(entry.transactionDate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#87867F] font-medium shrink-0">Danh mục</dt>
          <dd>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${entry.category?.color}15`,
                color: entry.category?.color,
                borderColor: `${entry.category?.color}30`,
              }}
            >
              {entry.category?.name ?? 'Khác'}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#87867F] font-medium shrink-0">Loại</dt>
          <dd
            className={`font-semibold ${entry.direction === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}
          >
            {entry.direction === 'INFLOW' ? 'Nạp vào' : 'Rút ra'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#87867F] font-medium shrink-0">Số tiền</dt>
          <dd
            className={`font-bold tabular-nums ${entry.direction === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}
          >
            {entry.direction === 'INFLOW' ? '+' : '-'}
            {formatVND(entry.amount)}
          </dd>
        </div>
        {entry.balance != null && (
          <div className="flex justify-between gap-4">
            <dt className="text-[#87867F] font-medium shrink-0">Số dư sau</dt>
            <dd className="font-bold tabular-nums text-[#141413]">{formatVND(entry.balance)}</dd>
          </div>
        )}
        {entry.orderCode && (
          <div className="flex justify-between gap-4">
            <dt className="text-[#87867F] font-medium shrink-0">Mã đơn hàng</dt>
            <dd className="text-[#141413] font-mono">#{entry.orderCode}</dd>
          </div>
        )}
        {entry.userName && (
          <div className="flex justify-between gap-4">
            <dt className="text-[#87867F] font-medium shrink-0">Người dùng</dt>
            <dd className="text-[#141413] text-right">{entry.userName}</dd>
          </div>
        )}
        {entry.userEmail && (
          <div className="flex justify-between gap-4">
            <dt className="text-[#87867F] font-medium shrink-0">Email</dt>
            <dd className="text-[#141413] text-right break-all">{entry.userEmail}</dd>
          </div>
        )}
        {entry.description && (
          <div className="pt-2 border-t border-gray-100">
            <dt className="text-[#87867F] font-medium mb-1">Mô tả</dt>
            <dd className="text-[#141413] leading-relaxed">{entry.description}</dd>
          </div>
        )}
      </dl>
    </div>
  </div>
);

// Simple debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

const toDateOnly = (date: Date): string => date.toISOString().split('T')[0];

const parseUtcDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00Z`);

const inclusiveDayDiff = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;

const formatUtcDayKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

const formatUtcMonthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;

const formatUtcHourKey = (date: Date): string =>
  `${formatUtcDayKey(date)} ${pad2(date.getUTCHours())}:00`;

const formatUtcDayLabel = (date: Date): string =>
  `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}`;

const formatUtcMonthLabel = (date: Date): string =>
  `${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;

const computeAutoGroupBy = (fromStr: string, toStr: string): GroupBy => {
  const from = parseUtcDate(fromStr);
  const to = parseUtcDate(toStr);
  const days = inclusiveDayDiff(from, to);

  if (days <= 1) return 'hour';
  if (days <= 31) return 'day';
  return 'month';
};

const buildTimeBuckets = (fromStr: string, toStr: string, groupBy: GroupBy) => {
  const from = parseUtcDate(fromStr);
  const to = parseUtcDate(toStr);

  if (groupBy === 'hour') {
    const base = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0));
    return Array.from({ length: 24 }, (_, idx) => {
      const current = new Date(base);
      current.setUTCHours(base.getUTCHours() + idx);
      return {
        key: formatUtcHourKey(current),
        label: `${pad2(current.getUTCHours())}:00`,
      };
    });
  }

  if (groupBy === 'month') {
    const buckets = [] as { key: string; label: string }[];
    const current = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

    while (current.getTime() <= end.getTime()) {
      buckets.push({
        key: formatUtcMonthKey(current),
        label: formatUtcMonthLabel(current),
      });
      current.setUTCMonth(current.getUTCMonth() + 1);
    }

    return buckets;
  }

  if (groupBy === 'week') {
    const buckets = [] as { key: string; label: string }[];
    const current = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const day = current.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    current.setUTCDate(current.getUTCDate() - diffToMonday);

    while (current.getTime() <= to.getTime()) {
      buckets.push({
        key: formatUtcDayKey(current),
        label: formatUtcDayLabel(current),
      });
      current.setUTCDate(current.getUTCDate() + 7);
    }

    return buckets;
  }

  const buckets = [] as { key: string; label: string }[];
  const current = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));

  while (current.getTime() <= to.getTime()) {
    buckets.push({
      key: formatUtcDayKey(current),
      label: formatUtcDayLabel(current),
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return buckets;
};

// ─── SummaryCard ───────────────────────────────────────────────────────────
const SummaryCard = ({
  title,
  amount,
  trend,
  icon: Icon,
  invertTrend = false,
}: {
  title: string;
  amount: number;
  trend: number | null;
  icon: React.ElementType;
  invertTrend?: boolean;
}) => {
  const cColor = trendColor(trend, invertTrend);
  const colorClass =
    cColor === 'positive'
      ? 'text-green-600 bg-green-100'
      : cColor === 'negative'
        ? 'text-red-600 bg-red-100'
        : 'text-gray-500 bg-gray-100';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-[Be_Vietnam_Pro] text-[12px] font-medium uppercase tracking-[0.05em] text-[#87867F] mb-1">
            {title}
          </p>
          <h3 className="font-[Be_Vietnam_Pro] text-[32px] font-bold tabular-nums text-[#141413] leading-[1.1]">
            {formatVND(amount)}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-sm font-medium ${colorClass.split(' ')[0]}`}>
          {formatTrend(trend)}
        </span>
        <span className="text-xs text-gray-400">so với kỳ trước</span>
      </div>
    </div>
  );
};

const CashFlowDashboard: React.FC = () => {
  // ─── State ─────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of month
    to: new Date().toISOString().split('T')[0],
  });

  const [quickRange, setQuickRange] = useState<'1d' | '1w' | '1m' | '1y' | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [chartData, setChartData] = useState<CashFlowChartPoint[]>([]);
  const [categories, setCategories] = useState<CashFlowCategory[]>([]);

  // Transactions table state
  const [transactions, setTransactions] = useState<CashFlowEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState<CashFlowType | ''>('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<CashFlowEntry | null>(null);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const buckets = buildTimeBuckets(dateRange.from, dateRange.to, groupBy);
  const chartMap = new Map(chartData.map((point) => [point.label, point]));
  const normalizedSeries = buckets.map((bucket) => {
    const point = chartMap.get(bucket.key);
    const inflow = point?.inflow ?? 0;
    const outflow = point?.outflow ?? 0;
    return {
      label: bucket.label,
      inflow,
      outflow,
      net: inflow - outflow,
    };
  });

  const chartSeries = normalizedSeries.map((point) => ({
    ...point,
    outflow: -Math.abs(point.outflow),
  }));

  const setQuickDateRange = (range: '1d' | '1w' | '1m' | '1y') => {
    const now = new Date();
    const toUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const fromUtc = new Date(toUtc);

    if (range === '1w') fromUtc.setUTCDate(fromUtc.getUTCDate() - 6);
    if (range === '1m') fromUtc.setUTCDate(fromUtc.getUTCDate() - 29);
    if (range === '1y') {
      fromUtc.setUTCMonth(fromUtc.getUTCMonth() - 11);
      fromUtc.setUTCDate(1);
    }

    const toStr = toDateOnly(toUtc);
    const fromStr = toDateOnly(fromUtc);

    setDateRange({ from: fromStr, to: toStr });
    setQuickRange(range);
    setGroupBy(range === '1d' ? 'hour' : range === '1y' ? 'month' : 'day');
    setPage(0);
  };

  // ─── Fetch data ────────────────────────────────────────────────────────
  useEffect(() => {
    cashFlowService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [sum, chart] = await Promise.all([
          cashFlowService.getSummary(dateRange.from, dateRange.to),
          cashFlowService.getChartData(groupBy, dateRange.from, dateRange.to),
        ]);
        setSummary(sum);
        setChartData(chart);
      } catch (err) {
        console.error('Failed to load summary', err);
      }
    };
    loadOverview();
  }, [dateRange, groupBy]);

  useEffect(() => {
    if (quickRange != null) return;
    const autoGroupBy = computeAutoGroupBy(dateRange.from, dateRange.to);
    if (groupBy !== autoGroupBy) setGroupBy(autoGroupBy);
  }, [dateRange, quickRange, groupBy]);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const res = await cashFlowService.getTransactions({
          from: dateRange.from,
          to: dateRange.to,
          page,
          size: pageSize,
          search: debouncedSearch,
          type: filterType,
          categoryId: filterCat,
        });
        setTransactions(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Failed to load txs', err);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [dateRange, page, pageSize, debouncedSearch, filterType, filterCat]);

  useEffect(() => {
    setPage(0);
  }, [dateRange.from, dateRange.to, debouncedSearch, filterType, filterCat]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const blob = await cashFlowService.exportExcel(dateRange.from, dateRange.to);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CashFlow_${dateRange.from}_${dateRange.to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <>
      {selectedEntry && (
        <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <AdminFinanceStudioShell>
          {/* ─── Page Title ─── */}
          <div className="mb-8">
            <h1 className="font-[Be_Vietnam_Pro] text-[36px] font-bold tracking-[-0.01em] leading-[1.2] text-[#141413]">
              Quản lý dòng tiền
            </h1>
            <p className="font-[Be_Vietnam_Pro] text-[15px] font-normal text-[#87867F] mt-1">
              Theo dõi nạp rút và biến động dòng tiền nền tảng
            </p>
          </div>

          {/* ─── Header & Filters ─── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                <span className="pl-3 text-gray-400">
                  <Calendar size={18} />
                </span>
                <input
                  type="date"
                  className="border-0 focus:ring-0 text-sm py-2 px-3 outline-none"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange((p) => ({ ...p, from: e.target.value }));
                    setQuickRange(null);
                    setPage(0);
                  }}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  className="border-0 focus:ring-0 text-sm py-2 px-3 outline-none"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange((p) => ({ ...p, to: e.target.value }));
                    setQuickRange(null);
                    setPage(0);
                  }}
                />
              </div>

              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                {([
                  { id: '1d', label: '1 ngày' },
                  { id: '1w', label: '1 tuần' },
                  { id: '1m', label: '1 tháng' },
                  { id: '1y', label: '1 năm' },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setQuickDateRange(item.id)}
                    className={`px-3 py-2 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                      quickRange === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm"
            >
              <Download size={18} /> Xuất báo cáo
            </button>
          </div>

          {/* ─── Summary Cards ─── */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SummaryCard
                title="Tổng nạp (Inflow)"
                amount={summary.totalInflow}
                trend={summary.inflowTrend}
                icon={TrendingUp}
              />
              <SummaryCard
                title="Tổng rút (Outflow)"
                amount={summary.totalOutflow}
                trend={summary.outflowTrend}
                icon={TrendingDown}
                invertTrend={true}
              />
              <SummaryCard
                title="Dòng tiền thuần (Net)"
                amount={summary.netCashFlow}
                trend={summary.netTrend}
                icon={Wallet}
              />
            </div>
          )}

          {/* ─── Charts ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Trend Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] mb-6">
                Biến động dòng tiền
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    />
                    <RechartsTooltip
                      formatter={(val) => formatVND(Number(val ?? 0))}
                      labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: 4 }}
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="inflow"
                      name="Nạp vào"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="outflow"
                      name="Rút ra"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] mb-6">
                Cơ cấu danh mục
              </h3>
              {summary?.categoryBreakdown.length ? (
                <div className="flex flex-col">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summary.categoryBreakdown}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="categoryName"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          width={80}
                        />
                        <RechartsTooltip
                          formatter={(val) => formatVND(Number(val ?? 0))}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                          {summary.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {summary.categoryBreakdown.map((cat, i) => (
                      <div key={i} className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span
                            className="text-sm text-gray-600 truncate w-24"
                            title={cat.categoryName}
                          >
                            {cat.categoryName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatVND(cat.total)}</div>
                          <div className="text-xs text-gray-400">{cat.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Không có dữ liệu
                </div>
              )}
            </div>
          </div>

          {/* ─── Transactions Table ─── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
                Chi tiết giao dịch
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="date"
                    className="border-0 text-sm outline-none text-gray-600 bg-transparent"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange((p) => ({ ...p, from: e.target.value }));
                      setQuickRange(null);
                      setPage(0);
                    }}
                  />
                  <span className="text-gray-300 text-xs">→</span>
                  <input
                    type="date"
                    className="border-0 text-sm outline-none text-gray-600 bg-transparent"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange((p) => ({ ...p, to: e.target.value }));
                      setQuickRange(null);
                      setPage(0);
                    }}
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm giao dịch, người dùng..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    className="border-0 focus:ring-0 text-sm py-1 outline-none text-gray-600 bg-transparent"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as CashFlowType | '')}
                  >
                    <option value="">Tất cả dòng tiền</option>
                    <option value="INFLOW">Nạp vào</option>
                    <option value="OUTFLOW">Rút ra</option>
                  </select>
                </div>

                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600"
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 tracking-wider">
                    <th className="px-4 py-3 font-medium w-1/6">Thời gian</th>
                    <th className="px-4 py-3 font-medium w-1/6">Danh mục</th>
                    <th className="px-4 py-3 font-medium text-right w-1/6">Số tiền</th>
                    <th className="px-4 py-3 font-medium text-right w-1/6">Số dư</th>
                    <th className="px-4 py-3 font-medium w-1/6">Người dùng</th>
                    <th className="px-4 py-3 font-medium w-1/6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Không tìm thấy giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-[13px]">
                          {formatDate(t.transactionDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${t.category?.color}15`,
                              color: t.category?.color,
                              borderColor: `${t.category?.color}30`,
                            }}
                          >
                            {t.category?.name ?? 'Khác'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`font-semibold text-[13px] ${t.direction === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}
                            title={t.direction === 'INFLOW' ? 'Nạp vào' : 'Rút ra'}
                          >
                            {t.direction === 'INFLOW' ? '+' : '-'}
                            {formatVND(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-[13px] text-[#141413]">
                            {t.balance == null ? '—' : formatVND(t.balance)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.userName ? (
                            <div
                              className="text-[13px] text-gray-700 truncate max-w-[120px]"
                              title={t.userEmail ?? ''}
                            >
                              {t.userName}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedEntry(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5F4ED] text-[#5E5D59] text-[12px] font-medium hover:bg-[#E8E6DC] hover:text-[#141413] transition-colors duration-150"
                          >
                            Xem chi tiết
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(totalElements > 0 || totalPages > 0) && (
              <div className="p-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Showing {totalElements === 0 ? 0 : page * pageSize + 1}-
                  {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} records
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <div
                    tabIndex={0}
                    onBlur={() => setPageSizeOpen(false)}
                    style={{ position: 'relative' }}
                  >
                    <button
                      type="button"
                      onClick={() => setPageSizeOpen((prev) => !prev)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 inline-flex items-center gap-2"
                    >
                      {pageSize} / page
                      <ChevronDown size={14} />
                    </button>
                    {pageSizeOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#ffffff',
                          border: '1px solid #e8e6dc',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -10px rgba(0,0,0,0.2)',
                          overflow: 'hidden',
                          zIndex: 20,
                          minWidth: '140px',
                        }}
                      >
                        {[10, 25, 50, 100].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setPageSize(size);
                              setPage(0);
                              setPageSizeOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              width: '100%',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.55rem 0.85rem',
                              background: size === pageSize ? '#f5f4ed' : '#ffffff',
                              color: '#4b4942',
                              fontSize: '0.85rem',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {size} / page
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-sm text-gray-500">
                    Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(0)}
                      disabled={page === 0 || totalPages <= 1}
                      className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50"
                      aria-label="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || totalPages <= 1}
                      className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={totalPages === 0 || page + 1 >= totalPages}
                      className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(0, totalPages - 1))}
                      disabled={totalPages === 0 || page + 1 >= totalPages}
                      className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50"
                      aria-label="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminFinanceStudioShell>
      </DashboardLayout>
    </>
  );
};

export default CashFlowDashboard;
