import { RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
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
  const error = overviewQuery.error instanceof Error ? overviewQuery.error.message : null;

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

  if (loading) {
    return shell(
      <div className="loading-container">
        <div className="spinner" />
        <p>Đang tải dữ liệu...</p>
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

  if (!overview) {
    return shell(
      <div className="empty-container">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  return shell(
    <>
      <header className="page-header courses-header-row overview-header">
        <div className="header-stack">
          <div className="header-kicker">Tài chính</div>
          <h2 style={{ margin: 0 }}>Tổng quan tài chính</h2>
          <p className="header-sub">Theo dõi hiệu suất tài chính và các chỉ số quan trọng</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <div className="month-selector">
            <label htmlFor="month-input">Tháng</label>
            <input
              id="month-input"
              type="month"
              value={selectedMonth || overview.period}
              onChange={handleMonthChange}
              className="month-input"
            />
          </div>
          <button type="button" onClick={() => void overviewQuery.refetch()} className="refresh-button">
            <RefreshCw size={16} aria-hidden />
            Làm mới
          </button>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="metrics-grid primary-metrics">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3 className="metric-label">Tổng Doanh Thu</h3>
            <p className="metric-value">{formatCurrency(overview.totalRevenue)}</p>
            <div className={`metric-trend ${getTrendColor(overview.totalRevenueTrend)}`}>
              <span className="trend-icon">
                {overview.totalRevenueTrend >= 0 ? '↗' : '↘'}
              </span>
              <span className="trend-value">{formatTrend(overview.totalRevenueTrend)}</span>
              <span className="trend-label">so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="metric-card commission">
          <div className="metric-icon">🏦</div>
          <div className="metric-content">
            <h3 className="metric-label">Hoa Hồng Nền Tảng</h3>
            <p className="metric-value">{formatCurrency(overview.platformCommission)}</p>
            <div className={`metric-trend ${getTrendColor(overview.platformCommissionTrend)}`}>
              <span className="trend-icon">
                {overview.platformCommissionTrend >= 0 ? '↗' : '↘'}
              </span>
              <span className="trend-value">
                {formatTrend(overview.platformCommissionTrend)}
              </span>
              <span className="trend-label">so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="metric-card subscriptions">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3 className="metric-label">Đăng Ký Hoạt Động</h3>
            <p className="metric-value">{overview.activeSubscriptions.toLocaleString()}</p>
            <div className={`metric-trend ${getTrendColor(overview.activeSubscriptionsTrend)}`}>
              <span className="trend-icon">
                {overview.activeSubscriptionsTrend >= 0 ? '↗' : '↘'}
              </span>
              <span className="trend-value">
                {formatTrend(overview.activeSubscriptionsTrend)}
              </span>
              <span className="trend-label">so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="metric-card instructors">
          <div className="metric-icon">🎓</div>
          <div className="metric-content">
            <h3 className="metric-label">Tổng Giảng Viên</h3>
            <p className="metric-value">{overview.totalInstructors.toLocaleString()}</p>
            <div className={`metric-trend ${getTrendColor(overview.totalInstructorsTrend)}`}>
              <span className="trend-icon">
                {overview.totalInstructorsTrend >= 0 ? '↗' : '↘'}
              </span>
              <span className="trend-value">
                {formatTrend(overview.totalInstructorsTrend)}
              </span>
              <span className="trend-label">so với tháng trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="metrics-grid secondary-metrics">
        <div className="metric-card small">
          <div className="metric-header">
            <span className="metric-icon-small">📊</span>
            <h4>Giá Trị Đơn Hàng TB</h4>
          </div>
          <p className="metric-value-small">{formatCurrency(overview.avgOrderValue)}</p>
          <div className={`metric-trend-small ${getTrendColor(overview.avgOrderValueTrend)}`}>
            {formatTrend(overview.avgOrderValueTrend)}
          </div>
        </div>

        <div className="metric-card small">
          <div className="metric-header">
            <span className="metric-icon-small">👤</span>
            <h4>Người Dùng Hoạt Động</h4>
          </div>
          <p className="metric-value-small">{overview.activeUsers.toLocaleString()}</p>
          <div className={`metric-trend-small ${getTrendColor(overview.activeUsersTrend)}`}>
            {formatTrend(overview.activeUsersTrend)}
          </div>
        </div>

        <div className="metric-card small">
          <div className="metric-header">
            <span className="metric-icon-small">🎯</span>
            <h4>Tỷ Lệ Chuyển Đổi</h4>
          </div>
          <p className="metric-value-small">{overview.conversionRate.toFixed(1)}%</p>
          <div className={`metric-trend-small ${getTrendColor(overview.conversionRateTrend)}`}>
            {overview.conversionRateTrend >= 0 ? '+' : ''}
            {overview.conversionRateTrend.toFixed(1)}%
          </div>
        </div>

        <div className="metric-card small">
          <div className="metric-header">
            <span className="metric-icon-small">📉</span>
            <h4>Tỷ Lệ Rời Bỏ</h4>
          </div>
          <p className="metric-value-small">{overview.churnRate.toFixed(1)}%</p>
          <div
            className={`metric-trend-small ${getTrendColor(-overview.churnRateTrend)}`}
          >
            {overview.churnRateTrend >= 0 ? '+' : ''}
            {overview.churnRateTrend.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Hành Động Nhanh</h2>
        <div className="actions-grid">
          <a href="/admin/marketplace-analytics" className="action-card">
            <div className="action-icon">📈</div>
            <div className="action-content">
              <h3>Phân Tích Thị Trường</h3>
              <p>Xem khóa học và giảng viên hàng đầu</p>
            </div>
          </a>

          <a href="/admin/transactions" className="action-card">
            <div className="action-icon">💳</div>
            <div className="action-content">
              <h3>Quản Lý Giao Dịch</h3>
              <p>Xem và quản lý tất cả giao dịch</p>
            </div>
          </a>

          <a href="/admin/subscriptions" className="action-card">
            <div className="action-icon">📦</div>
            <div className="action-content">
              <h3>Quản Lý Đăng Ký</h3>
              <p>Quản lý gói và người đăng ký</p>
            </div>
          </a>

          <a href="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h3>Quản Lý Người Dùng</h3>
              <p>Xem và quản lý người dùng</p>
            </div>
          </a>
        </div>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>Về Các Chỉ Số</h4>
          <ul>
            <li>
              <strong>Tổng Doanh Thu:</strong> Tổng tất cả giao dịch thành công (nạp tiền, đăng
              ký, khóa học)
            </li>
            <li>
              <strong>Hoa Hồng Nền Tảng:</strong> 10% từ doanh số bán khóa học
            </li>
            <li>
              <strong>Tỷ Lệ Chuyển Đổi:</strong> Phần trăm người dùng có đăng ký trả phí
            </li>
            <li>
              <strong>Tỷ Lệ Rời Bỏ:</strong> Phần trăm đăng ký bị hủy hoặc hết hạn
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default AdminFinancialOverview;
