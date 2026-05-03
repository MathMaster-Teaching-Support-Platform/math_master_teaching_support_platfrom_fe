import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3, 
  CreditCard,
  Package,
  Info,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  adminFinancialService,
  formatCurrency,
  formatTrend,
  getTrendColor,
} from '../../services/admin-financial.service';
import type { AdminFinancialOverview as OverviewData } from '../../services/admin-financial.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './admin-finance-studio.css';
import './AdminFinancialOverview.css';

const AdminFinancialOverview: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const overviewQuery = useQuery({
    queryKey: ['admin-financial', 'overview', selectedMonth],
    queryFn: () => adminFinancialService.getFinancialOverview(selectedMonth || undefined),
    staleTime: 30_000,
  });

  const overview: OverviewData | null = overviewQuery.data ?? null;
  const loading = overviewQuery.isLoading || overviewQuery.isFetching;
  const error = overviewQuery.error ? (overviewQuery.error as any).message || 'Đã xảy ra lỗi không xác định' : null;

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const shell = (body: React.ReactNode) => (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="admin-financial-overview">{body}</div>
      </AdminFinanceStudioShell>
    </DashboardLayout>
  );

  if (loading && !overview) {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="skeleton-box" style={{ height: '140px', borderRadius: '24px' }} />
        <div className="dashboard-main-grid">
          <div className="featured-metric skeleton-box" style={{ height: '400px' }} />
          <div className="sidebar-metrics">
            <div className="metric-card skeleton-box" style={{ height: '180px' }} />
            <div className="metric-card skeleton-box" style={{ height: '180px' }} />
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
        <button type="button" onClick={() => void overviewQuery.refetch()} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  if (!overview) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  } as const;

  return shell(
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <header className="overview-header">
        <div className="header-stack">
          <div className="header-kicker">MathMaster Executive</div>
          <h2>Tổng quan tài chính</h2>
          <p className="header-sub">Hệ thống báo cáo hiệu suất và phân tích tăng trưởng nền tảng</p>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <Calendar size={18} />
            <input
              type="month"
              value={selectedMonth || overview?.period}
              onChange={handleMonthChange}
              className="month-input"
            />
          </div>
          <button 
            type="button" 
            onClick={() => void overviewQuery.refetch()} 
            className="refresh-button"
            disabled={overviewQuery.isFetching}
          >
            <RefreshCw size={18} className={overviewQuery.isFetching ? 'admin-finance-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="dashboard-main-grid">
        {/* Featured Card */}
        <motion.div className="featured-metric" variants={itemVariants}>
          <div className="metric-label">Tổng doanh thu nền tảng (Gross)</div>
          <p className="metric-value">{formatCurrency(overview!.totalRevenue)}</p>
          <div className={`metric-trend ${getTrendColor(overview!.totalRevenueTrend)}`}>
            {overview!.totalRevenueTrend >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span>{formatTrend(overview!.totalRevenueTrend)} so với chu kỳ trước</span>
          </div>
        </motion.div>

        {/* Sidebar Cards */}
        <div className="sidebar-metrics">
          <motion.div className="metric-card" variants={itemVariants}>
            <div className="metric-icon"><BarChart3 size={24} /></div>
            <h3 className="metric-label">Hoa hồng hệ thống</h3>
            <p className="metric-value">{formatCurrency(overview!.platformCommission)}</p>
            <div className={`metric-trend ${getTrendColor(overview!.platformCommissionTrend)}`}>
              {formatTrend(overview!.platformCommissionTrend)}
            </div>
          </motion.div>

          <motion.div className="metric-card" variants={itemVariants}>
            <div className="metric-icon"><Users size={24} /></div>
            <h3 className="metric-label">Thuê bao trả phí</h3>
            <p className="metric-value">{overview!.activeSubscriptions.toLocaleString()}</p>
            <div className={`metric-trend ${getTrendColor(overview!.activeSubscriptionsTrend)}`}>
              {formatTrend(overview!.activeSubscriptionsTrend)}
            </div>
          </motion.div>
        </div>

        {/* Secondary Strip */}
        <motion.div className="secondary-stats-strip" variants={containerVariants}>
          <motion.div className="stat-pill" variants={itemVariants}>
            <span className="stat-pill-label">Giá trị đơn TB</span>
            <span className="stat-pill-value">{formatCurrency(overview!.avgOrderValue)}</span>
          </motion.div>
          <motion.div className="stat-pill" variants={itemVariants}>
            <span className="stat-pill-label">Active Users</span>
            <span className="stat-pill-value">{overview!.activeUsers.toLocaleString()}</span>
          </motion.div>
          <motion.div className="stat-pill" variants={itemVariants}>
            <span className="stat-pill-label">Tỷ lệ chuyển đổi</span>
            <span className="stat-pill-value">{overview!.conversionRate.toFixed(1)}%</span>
          </motion.div>
          <motion.div className="stat-pill" variants={itemVariants}>
            <span className="stat-pill-label">Tỷ lệ rời bỏ</span>
            <span className="stat-pill-value">{overview!.churnRate.toFixed(1)}%</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <motion.h2 className="section-title" variants={itemVariants}>Phân tích & Quản lý chuyên sâu</motion.h2>
        <motion.div className="actions-bento" variants={containerVariants}>
          <motion.a href="/admin/marketplace-analytics" className="action-tile" variants={itemVariants}>
            <div className="action-tile-icon"><BarChart3 size={28} /></div>
            <div className="action-tile-content">
              <h3>Thị trường</h3>
              <p>Phân tích hiệu suất khóa học và giảng viên hàng đầu.</p>
            </div>
          </motion.a>

          <motion.a href="/admin/transactions" className="action-tile" variants={itemVariants}>
            <div className="action-tile-icon"><CreditCard size={28} /></div>
            <div className="action-tile-content">
              <h3>Giao dịch</h3>
              <p>Quản lý dòng tiền, nạp ví và lịch sử thanh toán.</p>
            </div>
          </motion.a>

          <motion.a href="/admin/subscriptions" className="action-tile" variants={itemVariants}>
            <div className="action-tile-icon"><Package size={28} /></div>
            <div className="action-tile-content">
              <h3>Thuê bao</h3>
              <p>Quản lý các gói đăng ký và kế hoạch kinh doanh.</p>
            </div>
          </motion.a>

          <motion.a href="/admin/users" className="action-tile" variants={itemVariants}>
            <div className="action-tile-icon"><Users size={28} /></div>
            <div className="action-tile-content">
              <h3>Thành viên</h3>
              <p>Quản trị hồ sơ và phân quyền người dùng hệ thống.</p>
            </div>
          </motion.a>
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div className="info-footer" variants={itemVariants}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Info size={24} color="#c96442" />
          <h4>Định nghĩa các chỉ số báo cáo</h4>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <strong>Tổng doanh thu</strong>
            <p>Doanh thu gộp từ việc bán các gói đăng ký và hoa hồng khóa học thực tế.</p>
          </div>
          <div className="info-item">
            <strong>Hoa hồng hệ thống</strong>
            <p>Lợi nhuận gộp của nền tảng, tính bằng 10% giá trị mỗi khóa học được bán.</p>
          </div>
          <div className="info-item">
            <strong>Conversion Rate</strong>
            <p>Tỷ lệ người dùng thực hiện giao dịch trả phí trên tổng số người dùng hoạt động.</p>
          </div>
          <div className="info-item">
            <strong>Churn Rate</strong>
            <p>Tỷ lệ thuê bao không gia hạn hoặc hủy bỏ dịch vụ trong chu kỳ báo cáo.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminFinancialOverview;
