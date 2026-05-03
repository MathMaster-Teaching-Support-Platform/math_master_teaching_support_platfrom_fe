import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  CreditCard, 
  Package, 
  BookOpen, 
  Search,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RevenueBreakdownChart from '../../components/charts/RevenueBreakdownChart';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  adminFinancialService,
  calculateTotalRevenue,
  exportToCSV,
  formatCurrency,
} from '../../services/admin-financial.service';
import type { RevenueBreakdown as RevenueBreakdownData } from '../../services/admin-financial.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './admin-finance-studio.css';
import './RevenueBreakdown.css';

const RevenueBreakdown: React.FC = () => {
  const [period, setPeriod] = useState<string>('30d');
  const [searchTerm, setSearchTerm] = useState('');

  const breakdownQuery = useQuery({
    queryKey: ['admin-financial', 'revenue-breakdown', period],
    queryFn: () => adminFinancialService.getRevenueBreakdown(period),
    staleTime: 30_000,
  });

  const breakdown: RevenueBreakdownData | null = breakdownQuery.data ?? null;
  const loading = breakdownQuery.isLoading || breakdownQuery.isFetching;
  const error = breakdownQuery.error ? (breakdownQuery.error as any).message || 'Đã xảy ra lỗi không xác định' : null;

  const filteredData = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.data.filter(item => 
      item.date.includes(searchTerm) || 
      new Date(item.date).toLocaleDateString('vi-VN').includes(searchTerm)
    );
  }, [breakdown, searchTerm]);

  const stats = useMemo(() => {
    if (!breakdown) return { total: 0, deposits: 0, subscriptions: 0, courses: 0 };
    const total = calculateTotalRevenue(breakdown.data);
    const deposits = breakdown.data.reduce((sum, day) => sum + day.deposits, 0);
    const subscriptions = breakdown.data.reduce((sum, day) => sum + day.subscriptions, 0);
    const courses = breakdown.data.reduce((sum, day) => sum + day.courseSales, 0);
    return { total, deposits, subscriptions, courses };
  }, [breakdown]);

  const handleExport = () => {
    if (!breakdown || breakdown.data.length === 0) return;
    const exportData = breakdown.data.map((item) => ({
      'Ngày': item.date,
      'Nạp tiền (VND)': item.deposits,
      'Đăng ký (VND)': item.subscriptions,
      'Khóa học (VND)': item.courseSales,
      'Tổng (VND)': item.total,
    }));
    exportToCSV(exportData, `revenue_breakdown_${period}`);
  };

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
            {[1, 2, 3].map(i => <div key={i} className="source-mini-card skeleton-box" style={{ height: '110px' }} />)}
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
        <button type="button" onClick={() => void breakdownQuery.refetch()} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  if (!breakdown) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  } as const;

  return shell(
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <header className="breakdown-header">
        <div className="header-stack">
          <div className="header-kicker">Quản lý dòng tiền</div>
          <h2>Phân tích doanh thu</h2>
          <p className="header-sub">Báo cáo chi tiết nguồn thu nhập và xu hướng tăng trưởng</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <Calendar size={18} color="#87867f" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="period-select"
            >
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="90d">90 ngày qua</option>
              <option value="1y">1 năm qua</option>
            </select>
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
            <RefreshCw size={18} className={breakdownQuery.isFetching ? 'admin-finance-spin' : ''} />
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
            <div className="source-icon"><CreditCard size={22} /></div>
            <div className="source-info">
              <h3>Nạp tiền ví</h3>
              <p>{formatCurrency(stats.deposits)}</p>
              <div className="source-percentage">{((stats.deposits / stats.total) * 100 || 0).toFixed(1)}% tỷ trọng</div>
            </div>
          </motion.div>

          <motion.div className="source-mini-card" variants={itemVariants}>
            <div className="source-icon"><Package size={22} /></div>
            <div className="source-info">
              <h3>Gói đăng ký</h3>
              <p>{formatCurrency(stats.subscriptions)}</p>
              <div className="source-percentage">{((stats.subscriptions / stats.total) * 100 || 0).toFixed(1)}% tỷ trọng</div>
            </div>
          </motion.div>

          <motion.div className="source-mini-card" variants={itemVariants}>
            <div className="source-icon"><BookOpen size={22} /></div>
            <div className="source-info">
              <h3>Hoa hồng khóa học</h3>
              <p>{formatCurrency(stats.courses)}</p>
              <div className="source-percentage">{((stats.courses / stats.total) * 100 || 0).toFixed(1)}% tỷ trọng</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chart Section */}
      <motion.div className="main-chart-card" variants={itemVariants}>
        <h2>Xu hướng biến động doanh thu</h2>
        <p>Phân tích sự đóng góp của các nguồn thu theo thời gian</p>
        <div className="chart-container">
          <RevenueBreakdownChart data={breakdown?.data || []} period={period} />
        </div>
      </motion.div>

      {/* Ledger Section */}
      <div className="ledger-section">
        <motion.div className="ledger-header-row" variants={itemVariants}>
          <div className="header-stack">
            <h2>Sổ cái chi tiết</h2>
            <p className="header-sub">Danh sách giao dịch tổng hợp theo ngày</p>
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
                <th className="currency-cell">Nạp tiền</th>
                <th className="currency-cell">Gói đăng ký</th>
                <th className="currency-cell">Hoa hồng khóa học</th>
                <th className="currency-cell">Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredData.map((item) => (
                  <motion.tr 
                    key={item.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <td>
                      <span className="date-cell">
                        {new Date(item.date).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="currency-cell" style={{ color: '#2563eb' }}>{formatCurrency(item.deposits)}</td>
                    <td className="currency-cell" style={{ color: '#7c3aed' }}>{formatCurrency(item.subscriptions)}</td>
                    <td className="currency-cell" style={{ color: '#059669' }}>{formatCurrency(item.courseSales)}</td>
                    <td className="currency-cell currency-total">{formatCurrency(item.total)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            <tfoot>
              <tr className="table-footer-row">
                <td>Tổng kết giai đoạn</td>
                <td className="currency-cell">{formatCurrency(stats.deposits)}</td>
                <td className="currency-cell">{formatCurrency(stats.subscriptions)}</td>
                <td className="currency-cell">{formatCurrency(stats.courses)}</td>
                <td className="currency-cell currency-total">{formatCurrency(stats.total)}</td>
              </tr>
            </tfoot>
          </table>
        </motion.div>
      </div>

      {/* Insight Footer */}
      <motion.div className="insight-footer" variants={itemVariants}>
        <div className="insight-grid">
          <div className="insight-item">
            <h4>Nạp tiền ví</h4>
            <p>Dòng tiền thực nạp vào hệ thống để mua khóa học. Đây là chỉ số thanh khoản quan trọng nhất.</p>
          </div>
          <div className="insight-item">
            <h4>Kinh doanh gói</h4>
            <p>Doanh thu định kỳ từ các gói Membership của cả học viên và giảng viên.</p>
          </div>
          <div className="insight-item">
            <h4>Cơ chế hoa hồng</h4>
            <p>Phần lợi nhuận trực tiếp của MathMaster (10%) từ các giao dịch mua khóa học thành công.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevenueBreakdown;
