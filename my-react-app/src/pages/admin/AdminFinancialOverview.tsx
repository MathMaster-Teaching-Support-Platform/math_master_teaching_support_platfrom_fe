import React, { useEffect, useState } from 'react';
import {
  adminFinancialService,
  AdminFinancialOverview as OverviewData,
  formatCurrency,
  formatTrend,
  getTrendColor,
} from '../../services/admin-financial.service';
import './AdminFinancialOverview.css';

const AdminFinancialOverview: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    fetchOverview();
  }, [selectedMonth]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminFinancialService.getFinancialOverview(
        selectedMonth || undefined
      );
      setOverview(data);
    } catch (err: any) {
      console.error('Error fetching financial overview:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu tổng quan tài chính');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  if (loading) {
    return (
      <div className="admin-financial-overview">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-financial-overview">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={fetchOverview} className="retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="admin-financial-overview">
        <div className="empty-container">
          <p>Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-financial-overview">
      {/* Header */}
      <div className="overview-header">
        <div className="header-content">
          <h1>Tổng Quan Tài Chính</h1>
          <p className="subtitle">Theo dõi hiệu suất tài chính và các chỉ số quan trọng</p>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <label htmlFor="month-input">Tháng:</label>
            <input
              id="month-input"
              type="month"
              value={selectedMonth || overview.period}
              onChange={handleMonthChange}
              className="month-input"
            />
          </div>
          <button onClick={fetchOverview} className="refresh-button">
            🔄 Làm mới
          </button>
        </div>
      </div>

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

          <a href="/admin/subscription-management" className="action-card">
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
    </div>
  );
};

export default AdminFinancialOverview;
