import {
  Calendar,
  ChevronRight,
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

  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [chartData, setChartData] = useState<CashFlowChartPoint[]>([]);
  const [categories, setCategories] = useState<CashFlowCategory[]>([]);

  // Transactions table state
  const [transactions, setTransactions] = useState<CashFlowEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState<CashFlowType | ''>('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<CashFlowEntry | null>(null);

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
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const res = await cashFlowService.getTransactions({
          from: dateRange.from,
          to: dateRange.to,
          page,
          size: 10,
          search: debouncedSearch,
          type: filterType,
          categoryId: filterCat,
        });
        setTransactions(res.content);
        setTotalElements(res.totalElements);
      } catch (err) {
        console.error('Failed to load txs', err);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [dateRange, page, debouncedSearch, filterType, filterCat]);

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
                  onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  className="border-0 focus:ring-0 text-sm py-2 px-3 outline-none"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                />
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      groupBy === g
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
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
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  />
                  <span className="text-gray-300 text-xs">→</span>
                  <input
                    type="date"
                    className="border-0 text-sm outline-none text-gray-600 bg-transparent"
                    value={dateRange.to}
                    onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
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
            {totalElements > 0 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="text-sm text-gray-500">
                  Hiển thị {page * 10 + 1}-{Math.min((page + 1) * 10, totalElements)} trên tổng{' '}
                  {totalElements}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Trang trước
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * 10 >= totalElements}
                    className="px-3 py-1 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Trang sau
                  </button>
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
