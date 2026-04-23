import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import {
  TeacherEarningsService,
  type TeacherEarningsStats,
  type TeacherMonthlyRevenue,
  type TeacherTopCourse,
  type TeacherTransaction,
  formatCurrency,
  formatNumber,
  formatGrowth,
} from '../../../services/api/teacher-earnings.service';
import { WalletService } from '../../../services/api/wallet.service';
import type { WalletSummary } from '../../../types/wallet.types';
import './TeacherEarningsDashboard.css';

const TeacherEarningsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<TeacherEarningsStats | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<TeacherMonthlyRevenue | null>(null);
  const [topCourses, setTopCourses] = useState<TeacherTopCourse[]>([]);
  const [transactions, setTransactions] = useState<TeacherTransaction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, walletRes, revenueRes, coursesRes, transactionsRes] = await Promise.all([
        TeacherEarningsService.getEarningsStats(),
        WalletService.getMyWallet(),
        TeacherEarningsService.getMonthlyRevenue(),
        TeacherEarningsService.getTopCourses(5),
        TeacherEarningsService.getTransactions({ page: 0, size: 10 }),
      ]);

      setStats(statsRes.result);
      setWallet(walletRes.result);
      setMonthlyRevenue(revenueRes.result);
      setTopCourses(coursesRes.result);
      setTransactions(transactionsRes.result.content);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}>
        <div className="teacher-earnings-dashboard">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}>
        <div className="teacher-earnings-dashboard">
          <div className="error-state">
            <p className="error-message">❌ {error}</p>
            <button onClick={loadDashboardData} className="retry-button">
              Thử lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }}>
      <div className="teacher-earnings-dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Thu nhập & Doanh thu 💰</h1>
            <p className="dashboard-subtitle">
              Theo dõi thu nhập từ khóa học và quản lý ví của bạn
            </p>
          </div>
          <button className="view-wallet-btn" onClick={() => navigate('/teacher/wallet')}>
            💳 Xem ví
          </button>
        </header>

        {/* Stats Cards */}
        <section className="stats-grid">
          <article className="stat-card primary">
            <div className="stat-head">
              <span className="stat-title">Tổng thu nhập</span>
              <span className="stat-icon">💵</span>
            </div>
            <div className="stat-value">{formatCurrency(stats?.totalEarnings || 0)}</div>
            <div className="stat-meta">Tất cả thời gian</div>
          </article>

          <article className="stat-card">
            <div className="stat-head">
              <span className="stat-title">Thu nhập tháng này</span>
              <span className="stat-icon">📈</span>
            </div>
            <div className="stat-value">{formatCurrency(stats?.thisMonthEarnings || 0)}</div>
            <div className={`stat-delta ${(stats?.growthPercent || 0) >= 0 ? 'up' : 'down'}`}>
              {formatGrowth(stats?.growthPercent || 0)} so với tháng trước
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-head">
              <span className="stat-title">Số dư ví</span>
              <span className="stat-icon">💳</span>
            </div>
            <div className="stat-value">{formatCurrency(wallet?.balance || 0)}</div>
            <div className="stat-meta">
              Chờ xử lý: {formatCurrency(stats?.pendingEarnings || 0)}
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-head">
              <span className="stat-title">Tổng học sinh</span>
              <span className="stat-icon">👥</span>
            </div>
            <div className="stat-value">{formatNumber(stats?.totalStudents || 0)}</div>
            <div className="stat-meta">{stats?.activeCourses || 0} khóa học đang hoạt động</div>
          </article>
        </section>

        {/* Revenue Chart */}
        <section className="dashboard-card revenue-chart-card">
          <div className="card-header">
            <h2 className="card-title">Doanh thu theo tháng</h2>
            <span className="card-subtitle">Năm {monthlyRevenue?.year}</span>
          </div>
          <div className="revenue-chart">
            {monthlyRevenue?.months.map((month) => {
              const maxRevenue = Math.max(
                ...monthlyRevenue.months.map((m) => m.revenue),
                1
              );
              const heightPercent = (month.revenue / maxRevenue) * 100;

              return (
                <div key={month.month} className="chart-bar-wrapper">
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar"
                      style={{ height: `${heightPercent}%` }}
                      title={formatCurrency(month.revenue)}
                    >
                      <span className="bar-value">
                        {month.revenue > 0 ? formatCurrency(month.revenue) : ''}
                      </span>
                    </div>
                  </div>
                  <span className="chart-label">{month.monthName}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top Courses & Recent Transactions */}
        <section className="dashboard-grid">
          {/* Top Courses */}
          <article className="dashboard-card top-courses-card">
            <div className="card-header">
              <h2 className="card-title">Khóa học hàng đầu</h2>
              <button
                className="view-all-link"
                onClick={() => navigate('/teacher/courses')}
              >
                Xem tất cả →
              </button>
            </div>
            <div className="top-courses-list">
              {topCourses.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có khóa học nào</p>
                </div>
              ) : (
                topCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="course-item"
                    onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                  >
                    <div className="course-thumbnail">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.courseTitle} />
                      ) : (
                        <div className="thumbnail-placeholder">📚</div>
                      )}
                    </div>
                    <div className="course-info">
                      <h3 className="course-title">{course.courseTitle}</h3>
                      <div className="course-meta">
                        <span>👥 {formatNumber(course.studentCount)} học sinh</span>
                        <span>⭐ {course.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="course-revenue">
                      {formatCurrency(course.totalRevenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {/* Recent Transactions */}
          <article className="dashboard-card transactions-card">
            <div className="card-header">
              <h2 className="card-title">Giao dịch gần đây</h2>
              <button
                className="view-all-link"
                onClick={() => navigate('/teacher/wallet')}
              >
                Xem tất cả →
              </button>
            </div>
            <div className="transactions-list">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.transactionId} className="transaction-item">
                    <div className="transaction-icon">
                      {tx.status === 'SUCCESS' ? '✅' : tx.status === 'PENDING' ? '⏳' : '❌'}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-desc">
                        {tx.description || 'Thu nhập từ khóa học'}
                      </div>
                      <div className="transaction-date">
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className={`transaction-amount ${tx.status.toLowerCase()}`}>
                      +{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-panel">
          <h3 className="panel-title">Hành động nhanh</h3>
          <div className="quick-actions-grid">
            <button
              className="action-btn"
              onClick={() => navigate('/teacher/courses/create')}
            >
              <span className="action-icon">➕</span>
              <span className="action-label">Tạo khóa học mới</span>
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/teacher/wallet')}
            >
              <span className="action-icon">💳</span>
              <span className="action-label">Quản lý ví</span>
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/teacher/students')}
            >
              <span className="action-icon">👥</span>
              <span className="action-label">Xem học sinh</span>
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/teacher/analytics')}
            >
              <span className="action-icon">📊</span>
              <span className="action-label">Phân tích chi tiết</span>
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherEarningsDashboard;
