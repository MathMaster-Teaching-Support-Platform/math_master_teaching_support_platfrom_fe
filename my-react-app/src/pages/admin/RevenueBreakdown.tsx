import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import RevenueBreakdownChart from '../../components/charts/RevenueBreakdownChart';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import type { RevenueBreakdown as RevenueBreakdownData } from '../../services/admin-financial.service';
import {
  adminFinancialService,
  exportToCSV,
  formatCurrency,
} from '../../services/admin-financial.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-finance-studio.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './RevenueBreakdown.css';

type RevenueGroupBy = 'hour' | 'day' | 'month';
type RevenueQuickRange = '1d' | '1w' | '1m' | '1y' | null;

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

const computeAutoGroupBy = (fromStr: string, toStr: string): RevenueGroupBy => {
  const from = parseUtcDate(fromStr);
  const to = parseUtcDate(toStr);
  const days = inclusiveDayDiff(from, to);

  if (days <= 1) return 'hour';
  if (days <= 31) return 'day';
  return 'month';
};

const buildTimeBuckets = (fromStr: string, toStr: string, groupBy: RevenueGroupBy) => {
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

const formatLedgerLabel = (key: string, groupBy: RevenueGroupBy): string => {
  if (groupBy === 'month') return `${key.split('-')[1]}/${key.split('-')[0]}`;
  if (groupBy === 'hour') {
    const [datePart, timePart] = key.split(' ');
    const [year, month, day] = datePart.split('-');
    return `${timePart} ${day}/${month}/${year}`;
  }
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

const RevenueBreakdown: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const now = new Date();
    const to = toDateOnly(now);
    const from = toDateOnly(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    return { from, to };
  });
  const [quickRange, setQuickRange] = useState<RevenueQuickRange>('1m');
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const breakdownQuery = useQuery({
    queryKey: [
      'admin-financial',
      'revenue-breakdown',
      dateRange.from,
      dateRange.to,
      groupBy,
      page,
      pageSize,
    ],
    queryFn: () =>
      adminFinancialService.getRevenueBreakdown({
        from: dateRange.from,
        to: dateRange.to,
        groupBy,
        page,
        pageSize,
      }),
    staleTime: 30_000,
  });

  const breakdown: RevenueBreakdownData | null = breakdownQuery.data ?? null;
  const loading = breakdownQuery.isLoading || breakdownQuery.isFetching;
  const error = breakdownQuery.error
    ? (breakdownQuery.error as any).message || 'Đã xảy ra lỗi không xác định'
    : null;

  const buckets = buildTimeBuckets(dateRange.from, dateRange.to, groupBy);
  const breakdownMap = useMemo(
    () => new Map((breakdown?.data ?? []).map((item) => [item.date, item])),
    [breakdown]
  );
  const normalizedSeries = useMemo(
    () =>
      buckets.map((bucket) => {
        const item = breakdownMap.get(bucket.key);
        const subscriptions = Number(item?.subscriptions ?? 0);
        const courseSales = Number(item?.courseSales ?? 0);
        const deposits = Number(item?.deposits ?? 0);
        return {
          key: bucket.key,
          label: bucket.label,
          subscriptions,
          courseSales,
          deposits,
          total: subscriptions + courseSales,
        };
      }),
    [buckets, breakdownMap]
  );
  const filteredData = useMemo(() => {
    if (searchTerm.trim() === '') return normalizedSeries;
    const term = searchTerm.toLowerCase();
    return normalizedSeries.filter((item) => {
      const display = formatLedgerLabel(item.key, groupBy).toLowerCase();
      return item.key.includes(searchTerm) || display.includes(term);
    });
  }, [normalizedSeries, searchTerm, groupBy]);

  const stats = useMemo(() => {
    const total = normalizedSeries.reduce((sum, item) => sum + item.total, 0);
    const subscriptions = normalizedSeries.reduce((sum, item) => sum + item.subscriptions, 0);
    const courses = normalizedSeries.reduce((sum, item) => sum + item.courseSales, 0);
    return { total, subscriptions, courses };
  }, [normalizedSeries]);

  const handleExport = () => {
    if (normalizedSeries.length === 0) return;
    const exportData = normalizedSeries.map((item) => ({
      'Thời gian': formatLedgerLabel(item.key, groupBy),
      'Đăng ký (VND)': item.subscriptions,
      'Khóa học (VND)': item.courseSales,
      'Tổng (VND)': item.total,
    }));
    exportToCSV(exportData, `revenue_breakdown_${dateRange.from}_${dateRange.to}`);
  };

  const setQuickDateRange = (range: Exclude<RevenueQuickRange, null>) => {
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
  };

  useEffect(() => {
    if (quickRange != null) return;
    const autoGroupBy = computeAutoGroupBy(dateRange.from, dateRange.to);
    if (groupBy !== autoGroupBy) setGroupBy(autoGroupBy);
  }, [dateRange, quickRange, groupBy]);

  useEffect(() => {
    setPage(0);
  }, [dateRange.from, dateRange.to, groupBy, searchTerm]);

  const totalRecords = filteredData.length;
  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / pageSize);
  const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1);
  const pagedData = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const shell = (body: React.ReactNode) => (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="revenue-breakdown-page">{body}</div>
      </AdminFinanceStudioShell>
    </DashboardLayout>
  );

  if (loading && !breakdown) {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="skeleton-box" style={{ height: '140px', borderRadius: '24px' }} />
        <div className="revenue-bento-grid">
          <div className="featured-revenue-card skeleton-box" style={{ height: '400px' }} />
          <div className="sources-sidebar">
            {[1, 2].map((i) => (
              <div key={i} className="source-mini-card skeleton-box" style={{ height: '110px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return shell(
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Lỗi tải dữ liệu</h3>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void breakdownQuery.refetch()}
          className="retry-button"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!breakdown) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  } as const;

  return shell(
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <header className="breakdown-header">
        <div className="header-stack">
          <h2>Phân tích doanh thu</h2>
          <p className="header-sub">Báo cáo chi tiết nguồn thu nhập và xu hướng tăng trưởng</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <Calendar size={18} color="#87867f" />
            <div className="period-select" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => {
                  setDateRange((prev) => ({ ...prev, from: e.target.value }));
                  setQuickRange(null);
                }}
                className="period-select"
              />
              <span style={{ color: '#87867f' }}>-</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => {
                  setDateRange((prev) => ({ ...prev, to: e.target.value }));
                  setQuickRange(null);
                }}
                className="period-select"
              />
            </div>
          </div>
          <div className="period-selector">
            {([
              { id: '1d', label: '1 ngày' },
              { id: '1w', label: '1 tuần' },
              { id: '1m', label: '1 tháng' },
              { id: '1y', label: '1 năm' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuickDateRange(item.id)}
                className="period-select"
                style={{
                  border: '1px solid #e8e6dc',
                  background: quickRange === item.id ? '#f3f2eb' : '#ffffff',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#4b4942',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleExport} className="export-button">
            <Download size={18} /> Báo cáo CSV
          </button>
          <button
            type="button"
            onClick={() => void breakdownQuery.refetch()}
            className="refresh-button"
            disabled={breakdownQuery.isFetching}
          >
            <RefreshCw
              size={18}
              className={breakdownQuery.isFetching ? 'admin-finance-spin' : ''}
            />
          </button>
        </div>
      </header>

      {/* Top Bento Grid */}
      <div className="revenue-bento-grid">
        {/* Featured Card */}
        <motion.div className="featured-revenue-card" variants={itemVariants}>
          <div className="card-label-large">Tổng doanh thu chu kỳ</div>
          <p className="card-value-large">{formatCurrency(stats.total)}</p>
          <div className="card-trend-large">
            <TrendingUp size={24} />
            <span>+8.4% so với giai đoạn trước</span>
          </div>
        </motion.div>

        {/* Sources Sidebar */}
        <div className="sources-sidebar">

          <motion.div className="source-mini-card" variants={itemVariants}>
            <div className="source-icon">
              <Package size={22} />
            </div>
            <div className="source-info">
              <h3>Gói đăng ký</h3>
              <p>{formatCurrency(stats.subscriptions)}</p>
              <div className="source-percentage">
                {((stats.subscriptions / stats.total) * 100 || 0).toFixed(1)}% tỷ trọng
              </div>
            </div>
          </motion.div>

          <motion.div className="source-mini-card" variants={itemVariants}>
            <div className="source-icon">
              <BookOpen size={22} />
            </div>
            <div className="source-info">
              <h3>Hoa hồng khóa học</h3>
              <p>{formatCurrency(stats.courses)}</p>
              <div className="source-percentage">
                {((stats.courses / stats.total) * 100 || 0).toFixed(1)}% tỷ trọng
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chart Section */}
      <motion.div className="main-chart-card" variants={itemVariants}>
        <h2>Xu hướng biến động doanh thu</h2>
        <p>Phân tích sự đóng góp của các nguồn thu theo thời gian</p>
        <div className="chart-container">
          <RevenueBreakdownChart data={normalizedSeries} groupBy={groupBy} />
        </div>
      </motion.div>

      {/* Ledger Section */}
      <div className="ledger-section">
        <motion.div className="ledger-header-row" variants={itemVariants}>
          <div className="header-stack">
            <h2>Bảng kê doanh thu</h2>
            <p className="header-sub">Chi tiết số liệu tổng hợp theo từng ngày</p>
          </div>
          <div className="ledger-search">
            <Search size={18} className="ledger-search-icon" />
            <input
              type="text"
              placeholder="Tìm theo ngày hoặc giá trị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div className="table-wrapper" variants={itemVariants}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày ghi nhận</th>
                <th className="currency-cell">Gói đăng ký</th>
                <th className="currency-cell">Hoa hồng khóa học</th>
                <th className="currency-cell">Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {pagedData.map((item) => (
                  <motion.tr
                    key={item.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <td>
                      <span className="date-cell">
                        {formatLedgerLabel(item.key, groupBy)}
                      </span>
                    </td>
                    <td className="currency-cell" style={{ color: '#7c3aed' }}>
                      {formatCurrency(item.subscriptions)}
                    </td>
                    <td className="currency-cell" style={{ color: '#059669' }}>
                      {formatCurrency(item.courseSales)}
                    </td>
                    <td className="currency-cell currency-total">{formatCurrency(item.total)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            <tfoot>
              <tr className="table-footer-row">
                <td>Tổng kết giai đoạn</td>
                <td className="currency-cell">{formatCurrency(stats.subscriptions)}</td>
                <td className="currency-cell">{formatCurrency(stats.courses)}</td>
                <td className="currency-cell currency-total">{formatCurrency(stats.total)}</td>
              </tr>
            </tfoot>
          </table>
        </motion.div>

        <motion.div className="ledger-footer" variants={itemVariants}>
          <div
            className="ledger-footer-left"
            style={{ fontSize: '0.85rem', color: '#7a786f' }}
          >
            Showing {totalRecords === 0 ? 0 : currentPage * pageSize + 1}-
            {Math.min((currentPage + 1) * pageSize, totalRecords)} of {totalRecords} records
          </div>
          <div
            className="ledger-footer-right"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}
          >
            <div
              tabIndex={0}
              onBlur={() => setPageSizeOpen(false)}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => setPageSizeOpen((prev) => !prev)}
                className="period-select"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #e8e6dc',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  color: '#4b4942',
                }}
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
                    borderRadius: '14px',
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

            <span style={{ fontSize: '0.85rem', color: '#7a786f' }}>
              Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setPage(0)}
                disabled={currentPage === 0 || totalPages <= 1}
                className="period-select"
                style={{
                  padding: '0.4rem',
                  borderRadius: '10px',
                  border: '1px solid #e8e6dc',
                  background: '#ffffff',
                }}
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0 || totalPages <= 1}
                className="period-select"
                style={{
                  padding: '0.4rem',
                  borderRadius: '10px',
                  border: '1px solid #e8e6dc',
                  background: '#ffffff',
                }}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={totalPages === 0 || currentPage + 1 >= totalPages}
                className="period-select"
                style={{
                  padding: '0.4rem',
                  borderRadius: '10px',
                  border: '1px solid #e8e6dc',
                  background: '#ffffff',
                }}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.max(0, totalPages - 1))}
                disabled={totalPages === 0 || currentPage + 1 >= totalPages}
                className="period-select"
                style={{
                  padding: '0.4rem',
                  borderRadius: '10px',
                  border: '1px solid #e8e6dc',
                  background: '#ffffff',
                }}
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insight Footer */}
      <motion.div className="insight-footer" variants={itemVariants}>
        <div className="insight-grid">
          <div className="insight-item">
            <h4>Kinh doanh gói</h4>
            <p>Doanh thu định kỳ từ các gói Membership của cả học viên và giảng viên.</p>
          </div>
          <div className="insight-item">
            <h4>Cơ chế hoa hồng</h4>
            <p>
              Phần lợi nhuận trực tiếp của MathMaster (10%) từ các giao dịch mua khóa học thành
              công.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevenueBreakdown;
