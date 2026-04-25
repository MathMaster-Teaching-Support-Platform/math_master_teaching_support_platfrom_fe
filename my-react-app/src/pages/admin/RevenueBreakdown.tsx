import { Download, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
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
  const breakdownQuery = useQuery({
    queryKey: ['admin-financial', 'revenue-breakdown', period],
    queryFn: () => adminFinancialService.getRevenueBreakdown(period),
    staleTime: 30_000,
  });
  const breakdown: RevenueBreakdownData | null = breakdownQuery.data ?? null;
  const loading = breakdownQuery.isLoading || breakdownQuery.isFetching;
  const error = breakdownQuery.error instanceof Error
    ? breakdownQuery.error.message
    : null;

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
        <button type="button" onClick={() => void breakdownQuery.refetch()} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  if (!breakdown) {
    return shell(
      <div className="empty-container">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  const totalRevenue = calculateTotalRevenue(breakdown.data);
  const totalDeposits = breakdown.data.reduce((sum, day) => sum + day.deposits, 0);
  const totalSubscriptions = breakdown.data.reduce((sum, day) => sum + day.subscriptions, 0);
  const totalCourses = breakdown.data.reduce((sum, day) => sum + day.courseSales, 0);

  return shell(
    <>
      <header className="page-header courses-header-row breakdown-header">
        <div className="header-stack">
          <div className="header-kicker">Tài chính</div>
          <h2 style={{ margin: 0 }}>Phân tích doanh thu</h2>
          <p className="header-sub">Theo dõi doanh thu theo nguồn và thời gian</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <div className="period-selector">
            <label htmlFor="period-select">Khoảng thời gian</label>
            <select
              id="period-select"
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
            <Download size={16} aria-hidden />
            Xuất CSV
          </button>
          <button type="button" onClick={() => void breakdownQuery.refetch()} className="refresh-button">
            <RefreshCw size={16} aria-hidden />
            Làm mới
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Tổng Doanh Thu</h3>
            <p className="card-value">{formatCurrency(totalRevenue)}</p>
            <p className="card-label">Tất cả nguồn</p>
          </div>
        </div>

        <div className="summary-card deposits">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h3>Nạp Tiền</h3>
            <p className="card-value">{formatCurrency(totalDeposits)}</p>
            <p className="card-label">
              {((totalDeposits / totalRevenue) * 100).toFixed(1)}% tổng doanh thu
            </p>
          </div>
        </div>

        <div className="summary-card subscriptions">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Đăng Ký</h3>
            <p className="card-value">{formatCurrency(totalSubscriptions)}</p>
            <p className="card-label">
              {((totalSubscriptions / totalRevenue) * 100).toFixed(1)}% tổng doanh thu
            </p>
          </div>
        </div>

        <div className="summary-card courses">
          <div className="card-icon">📚</div>
          <div className="card-content">
            <h3>Khóa Học</h3>
            <p className="card-value">{formatCurrency(totalCourses)}</p>
            <p className="card-label">
              {((totalCourses / totalRevenue) * 100).toFixed(1)}% tổng doanh thu
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="section-header">
          <h2>Biểu Đồ Doanh Thu Theo Thời Gian</h2>
          <p className="section-subtitle">Doanh thu tích lũy theo nguồn</p>
        </div>
        <div className="chart-container">
          <RevenueBreakdownChart data={breakdown.data} period={period} />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-section">
        <div className="section-header">
          <h2>Chi Tiết Doanh Thu Hàng Ngày</h2>
          <p className="section-subtitle">
            Hiển thị {breakdown.data.length} ngày gần nhất
          </p>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Nạp Tiền</th>
                <th>Đăng Ký</th>
                <th>Khóa Học</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.data.map((item) => (
                <tr key={item.date}>
                  <td className="date-cell">
                    {new Date(item.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="currency-cell deposits">{formatCurrency(item.deposits)}</td>
                  <td className="currency-cell subscriptions">
                    {formatCurrency(item.subscriptions)}
                  </td>
                  <td className="currency-cell courses">{formatCurrency(item.courseSales)}</td>
                  <td className="currency-cell total">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>
                  <strong>Tổng cộng</strong>
                </td>
                <td className="currency-cell deposits">
                  <strong>{formatCurrency(totalDeposits)}</strong>
                </td>
                <td className="currency-cell subscriptions">
                  <strong>{formatCurrency(totalSubscriptions)}</strong>
                </td>
                <td className="currency-cell courses">
                  <strong>{formatCurrency(totalCourses)}</strong>
                </td>
                <td className="currency-cell total">
                  <strong>{formatCurrency(totalRevenue)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>Về Nguồn Doanh Thu</h4>
          <ul>
            <li>
              <strong>Nạp tiền:</strong> Người dùng nạp tiền vào ví
            </li>
            <li>
              <strong>Đăng ký:</strong> Mua gói đăng ký (subscription plans)
            </li>
            <li>
              <strong>Khóa học:</strong> Hoa hồng 10% từ bán khóa học (90% cho giảng viên)
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default RevenueBreakdown;
