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
import './admin-finance-studio.css';

// ─── DetailModal ──────────────────────────────────────────────────────────
const DetailModal = ({ entry, onClose }: { entry: CashFlowEntry; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/50 backdrop-blur-sm p-4"
    role="presentation"
    onClick={onClose}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cashflow-detail-title"
      className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-sm p-6"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-5">
        <h4
          id="cashflow-detail-title"
          className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
        >
          Chi tiết giao dịch
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-[#87867F] hover:text-[#141413] transition-colors rounded-lg p-1"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
      </div>
      <dl className="space-y-3 font-[Be_Vietnam_Pro] text-[13px]">
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
            className={`font-semibold ${entry.direction === 'INFLOW' ? 'text-[#2EAD7A]' : 'text-red-600'}`}
          >
            {entry.direction === 'INFLOW' ? 'Nạp vào' : 'Rút ra'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#87867F] font-medium shrink-0">Số tiền</dt>
          <dd
            className={`font-bold tabular-nums ${entry.direction === 'INFLOW' ? 'text-[#2EAD7A]' : 'text-red-600'}`}
          >
            {entry.direction === 'INFLOW' ? '+' : '-'}
            {formatVND(entry.amount)}
          </dd>
        </div>
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
          <div className="pt-2 border-t border-[#F0EEE6]">
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
    const base = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0)
    );
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
    const current = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
    );
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

// ─── SummaryCard (aligned with TeacherMindmaps stat tiles) ─────────────────
const SummaryCard = ({
  title,
  amount,
  trend,
  icon: Icon,
  invertTrend = false,
  iconBg,
  iconColor,
}: {
  title: string;
  amount: number;
  trend: number | null;
  icon: React.ElementType;
  invertTrend?: boolean;
  iconBg: string;
  iconColor: string;
}) => {
  const cColor = trendColor(trend, invertTrend);
  const trendTextCls =
    cColor === 'positive'
      ? 'text-[#2EAD7A]'
      : cColor === 'negative'
        ? 'text-red-600'
        : 'text-[#87867F]';

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6DC] p-4 sm:p-5 flex flex-col gap-3 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.06)_0px_8px_28px] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">{title}</p>
          <p className="font-[Be_Vietnam_Pro] text-[clamp(1.125rem,2.5vw,1.5rem)] font-bold tabular-nums text-[#141413] leading-tight mt-1 break-words">
            {formatVND(amount)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-[#F0EEE6]">
        <span className={`font-[Be_Vietnam_Pro] text-[12px] font-semibold ${trendTextCls}`}>
          {formatTrend(trend)}
        </span>
        <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5]">so với kỳ trước</span>
      </div>
    </div>
  );
};

const selectSurfaceCls =
  'border border-[#E8E6DC] rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] outline-none bg-white focus:border-[#A3B6D4] focus:ring-1 focus:ring-[rgba(163,182,212,0.42)] transition-colors';

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
          <div className="px-6 py-8 lg:px-8 space-y-6">
            {/* ─── Page header (TeacherMindmaps pattern) ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                  <Wallet className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                      Dòng tiền
                    </h1>
                    {summary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                        {summary.period}
                      </span>
                    )}
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                    Theo dõi nạp — rút và cơ cấu danh mục trên nền tảng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3B6D4] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#96AAC8] active:scale-[0.98] transition-all duration-150 shadow-[rgba(110,130,165,0.22)_0px_8px_22px]"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                Xuất báo cáo
              </button>
            </div>

            {/* ─── Date range & quick presets ─── */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-white border border-[#E8E6DC] rounded-xl px-3 py-2 shadow-[rgba(0,0,0,0.03)_0px_2px_12px]">
                  <Calendar className="w-4 h-4 text-[#87867F] shrink-0" strokeWidth={2} />
                  <input
                    type="date"
                    className="border-0 bg-transparent font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange((p) => ({ ...p, from: e.target.value }));
                      setQuickRange(null);
                      setPage(0);
                    }}
                  />
                  <span className="text-[#B0AEA5] text-xs font-[Be_Vietnam_Pro]">→</span>
                  <input
                    type="date"
                    className="border-0 bg-transparent font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange((p) => ({ ...p, to: e.target.value }));
                      setQuickRange(null);
                      setPage(0);
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-wrap">
                  {(
                    [
                      { id: '1d', label: '1 ngày' },
                      { id: '1w', label: '1 tuần' },
                      { id: '1m', label: '1 tháng' },
                      { id: '1y', label: '1 năm' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQuickDateRange(item.id)}
                      className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        quickRange === item.id
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Summary Cards ─── */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <SummaryCard
                  title="Tổng nạp (Inflow)"
                  amount={summary.totalInflow}
                  trend={summary.inflowTrend}
                  icon={TrendingUp}
                  iconBg="bg-[#ECFDF5]"
                  iconColor="text-[#047857]"
                />
                <SummaryCard
                  title="Tổng rút (Outflow)"
                  amount={summary.totalOutflow}
                  trend={summary.outflowTrend}
                  icon={TrendingDown}
                  invertTrend={true}
                  iconBg="bg-[#FEF2F2]"
                  iconColor="text-[#B91C1C]"
                />
                <SummaryCard
                  title="Dòng tiền thuần (Net)"
                  amount={summary.netCashFlow}
                  trend={summary.netTrend}
                  icon={Wallet}
                  iconBg="bg-[#EEF2FF]"
                  iconColor="text-[#4F7EF7]"
                />
              </div>
            )}

            {/* ─── Charts ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Trend Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
                  <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                    Biến động dòng tiền
                  </h3>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                    Nạp vào và rút ra theo khoảng thời gian đã chọn
                  </p>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartSeries}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
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
                            borderRadius: 12,
                            border: '1px solid #F0EEE6',
                            boxShadow: '0 10px 25px -10px rgba(0,0,0,0.15)',
                          }}
                        />
                        <Bar
                          dataKey="inflow"
                          name="Nạp vào"
                          fill="#047857"
                          radius={[6, 6, 0, 0]}
                          barSize={22}
                        />
                        <Bar
                          dataKey="outflow"
                          name="Rút ra"
                          fill="#92A7C4"
                          radius={[6, 6, 0, 0]}
                          barSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5] shrink-0">
                  <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                    Cơ cấu danh mục
                  </h3>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                    Phân bổ theo danh mục giao dịch
                  </p>
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {summary?.categoryBreakdown.length ? (
                    <div className="flex flex-col flex-1">
                      <div className="h-64 min-h-[14rem]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={summary.categoryBreakdown}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={true}
                              vertical={false}
                              stroke="#f3f4f6"
                            />
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
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #F0EEE6',
                                boxShadow: '0 10px 25px -10px rgba(0,0,0,0.15)',
                              }}
                            />
                            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={26}>
                              {summary.categoryBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 space-y-1">
                        {summary.categoryBreakdown.map((cat, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center gap-3 py-2 px-2 rounded-xl hover:bg-[#FAF9F5] transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span
                                className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] truncate"
                                title={cat.categoryName}
                              >
                                {cat.categoryName}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] tabular-nums">
                                {formatVND(cat.total)}
                              </div>
                              <div className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] tabular-nums">
                                {cat.percentage}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[16rem] flex items-center justify-center font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Transactions Table ─── */}
            <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                    Chi tiết giao dịch
                  </h3>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                    Lọc theo thời gian, loại và danh mục
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full lg:max-w-3xl">
                  <label className="flex w-full items-center gap-3 bg-white border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#A3B6D4] focus-within:ring-1 focus-within:ring-[rgba(163,182,212,0.38)] transition-all duration-150">
                    <Search className="text-[#87867F] w-4 h-4 shrink-0" strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Tìm giao dịch, người dùng..."
                      className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => setSearch('')}
                        className="text-[#87867F] hover:text-[#141413] transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-[#E8E6DC] rounded-xl px-3 py-2">
                      <Calendar className="w-3.5 h-3.5 text-[#87867F] shrink-0" strokeWidth={2} />
                      <input
                        type="date"
                        className="border-0 font-[Be_Vietnam_Pro] text-[12px] text-[#141413] outline-none bg-transparent"
                        value={dateRange.from}
                        onChange={(e) => {
                          setDateRange((p) => ({ ...p, from: e.target.value }));
                          setQuickRange(null);
                          setPage(0);
                        }}
                      />
                      <span className="text-[#B0AEA5] text-[11px]">→</span>
                      <input
                        type="date"
                        className="border-0 font-[Be_Vietnam_Pro] text-[12px] text-[#141413] outline-none bg-transparent"
                        value={dateRange.to}
                        onChange={(e) => {
                          setDateRange((p) => ({ ...p, to: e.target.value }));
                          setQuickRange(null);
                          setPage(0);
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-[#E8E6DC] bg-white px-2 py-1.5">
                      <Filter className="w-4 h-4 text-[#87867F] shrink-0" strokeWidth={2} />
                      <select
                        className="border-0 bg-transparent font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] py-1 outline-none cursor-pointer min-w-[8rem]"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as CashFlowType | '')}
                      >
                        <option value="">Tất cả dòng tiền</option>
                        <option value="INFLOW">Nạp vào</option>
                        <option value="OUTFLOW">Rút ra</option>
                      </select>
                    </div>

                    <select
                      className={`${selectSurfaceCls} min-w-[10rem] flex-1 sm:flex-none`}
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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-[#F0EEE6]">
                      <th className="px-4 py-3.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wider text-[#87867F]">
                        Thời gian
                      </th>
                      <th className="px-4 py-3.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wider text-[#87867F]">
                        Danh mục
                      </th>
                      <th className="px-4 py-3.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wider text-[#87867F] text-right">
                        Số tiền
                      </th>
                      <th className="px-4 py-3.5 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wider text-[#87867F]">
                        Người dùng
                      </th>
                      <th className="px-4 py-3.5 w-36 text-right">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE6] font-[Be_Vietnam_Pro] text-[13px]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-14 text-center">
                          <span className="inline-flex flex-col items-center gap-3 text-[#87867F]">
                            <span
                              className="w-8 h-8 rounded-full border-2 border-[#E8E6DC] border-t-[#A3B6D4] animate-spin"
                              aria-hidden
                            />
                            <span>Đang tải dữ liệu...</span>
                          </span>
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-14 text-center font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]"
                        >
                          Không tìm thấy giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-[#FAF9F5]/80 transition-colors group">
                          <td className="px-4 py-3.5 text-[#5E5D59] whitespace-nowrap tabular-nums">
                            {formatDate(t.transactionDate)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border font-[Be_Vietnam_Pro]"
                              style={{
                                backgroundColor: `${t.category?.color}12`,
                                color: t.category?.color ?? '#5E5D59',
                                borderColor: `${t.category?.color}35`,
                              }}
                            >
                              {t.category?.name ?? 'Khác'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">
                            <span
                              className={`font-semibold ${t.direction === 'INFLOW' ? 'text-[#047857]' : 'text-[#B91C1C]'}`}
                              title={t.direction === 'INFLOW' ? 'Nạp vào' : 'Rút ra'}
                            >
                              {t.direction === 'INFLOW' ? '+' : '-'}
                              {formatVND(t.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[#141413]">
                            {t.userName ? (
                              <div className="truncate max-w-[160px]" title={t.userEmail ?? ''}>
                                {t.userName}
                              </div>
                            ) : (
                              <span className="text-[#B0AEA5]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEntry(t)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#141413] text-[#FAF9F5] text-[12px] font-semibold hover:bg-[#30302E] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 sm:opacity-100"
                            >
                              Chi tiết
                              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
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
                <div className="p-4 border-t border-[#F0EEE6] flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#FAF9F5]/80">
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
          </div>
        </AdminFinanceStudioShell>
      </DashboardLayout>
    </>
  );
};

export default CashFlowDashboard;
