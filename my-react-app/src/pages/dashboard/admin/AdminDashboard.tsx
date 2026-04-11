import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import {
  AdminDashboardService,
  type AdminTransaction,
  type AdminUserInfo,
  type DashboardStats,
  type MonthlyRevenue,
  type QuickStats,
  type RecentUser,
  type SystemService,
} from '../../../services/api/admin-dashboard.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import './AdminDashboard.css';

function applyApiResult<T>(
  settled: PromiseSettledResult<{ code: number; result: T }>,
  setter: (val: T) => void
): void {
  if (settled.status === 'fulfilled' && settled.value.code === 1000) {
    setter(settled.value.result);
  }
}

const AdminDashboard: React.FC = () => {
  const [adminUser, setAdminUser] = React.useState<AdminUserInfo | null>(null);
  const [notificationCount, setNotificationCount] = React.useState<number>(0);
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = React.useState<RecentUser[]>([]);
  const [pendingProfiles, setPendingProfiles] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<AdminTransaction[]>([]);
  const [revenueMonthly, setRevenueMonthly] = React.useState<MonthlyRevenue[]>([]);
  const [quickStats, setQuickStats] = React.useState<QuickStats | null>(null);
  const [systemServices, setSystemServices] = React.useState<SystemService[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setFetchError(null);
      const [myInfo, unread, stats, users, pending, txns, revenue, quick, sysStatus] =
        await Promise.allSettled([
          AdminDashboardService.getMyInfo(),
          AdminDashboardService.getUnreadNotificationCount(),
          AdminDashboardService.getDashboardStats(),
          AdminDashboardService.getRecentUsers(0, 10),
          TeacherProfileService.countPendingProfiles(),
          AdminDashboardService.getRecentTransactions(0, 5),
          AdminDashboardService.getRevenueByMonth(),
          AdminDashboardService.getQuickStats(),
          AdminDashboardService.getSystemStatus(),
        ]);

      applyApiResult(myInfo, setAdminUser);
      if (unread.status === 'fulfilled') setNotificationCount(unread.value);
      applyApiResult(stats, setDashboardStats);
      if (stats.status === 'rejected') setFetchError('Không thể tải thống kê tổng quan.');
      applyApiResult(users, (page) => setRecentUsers(page.content ?? []));
      applyApiResult(pending, setPendingProfiles);
      applyApiResult(txns, (page) => setTransactions(page.content ?? []));
      applyApiResult(revenue, (data) => setRevenueMonthly(data.monthly));
      applyApiResult(quick, setQuickStats);
      applyApiResult(sysStatus, (data) => setSystemServices(data.services));

      setLoading(false);
    };

    fetchAll();
  }, []);

  const formatRevenue = (amount: number): string => {
    if (amount >= 1_000_000) return `₫${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₫${(amount / 1_000).toFixed(0)}K`;
    return `₫${amount.toLocaleString('vi-VN')}`;
  };

  const formatGrowth = (pct: number): string => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

  const statsCards = dashboardStats
    ? [
        {
          icon: '👥',
          label: 'Tổng người dùng',
          value: dashboardStats.totalUsers.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.totalUsersGrowthPercent),
          color: '#667eea',
        },
        {
          icon: '💰',
          label: 'Doanh thu tháng',
          value: formatRevenue(dashboardStats.monthlyRevenue),
          trend: formatGrowth(dashboardStats.monthlyRevenueGrowthPercent),
          color: '#43e97b',
        },
        {
          icon: '📚',
          label: 'Enrollment hoạt động',
          value: dashboardStats.activeEnrollments.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.activeEnrollmentsGrowthPercent),
          color: '#f093fb',
        },
        {
          icon: '📊',
          label: 'Giao dịch',
          value: dashboardStats.totalTransactions.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.totalTransactionsGrowthPercent),
          color: '#fbbf24',
        },
      ]
    : [];

  const revenueMax =
    revenueMonthly.length > 0 ? Math.max(...revenueMonthly.map((m) => m.revenue), 1) : 1;

  const getUserStatusLabel = (status: RecentUser['status']): string => {
    if (status === 'ACTIVE') return 'Hoạt động';
    if (status === 'INACTIVE') return 'Không hoạt động';
    if (status === 'BANNED') return 'Bị cấm';
    return 'Đã xóa';
  };

  const getTransactionStatusLabel = (status: AdminTransaction['status']): string => {
    if (status === 'completed') return 'Thành công';
    if (status === 'pending') return 'Đang xử lý';
    return 'Thất bại';
  };

  const renderUsersTable = () => {
    if (loading) return <p style={{ padding: '1rem', color: '#718096' }}>Đang tải...</p>;
    if (recentUsers.length === 0)
      return <p style={{ padding: '1rem', color: '#718096' }}>Chưa có người dùng nào.</p>;
    return (
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Vai trò</th>
            <th>Ngày tham gia</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {recentUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="user-avatar">{(user.fullName ?? user.email).charAt(0)}</div>
                  <div>
                    <div className="user-name">{user.fullName ?? '—'}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`role-badge ${(user.roles[0] ?? '').toLowerCase()}`}>
                  {(user.roles[0] ?? '').toUpperCase() === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                </span>
              </td>
              <td>{new Date(user.createdDate).toLocaleDateString('vi-VN')}</td>
              <td>
                <span className={`status-badge ${user.status.toLowerCase()}`}>
                  {getUserStatusLabel(user.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTransactionsTable = () => {
    if (loading) return <p style={{ padding: '1rem', color: '#718096' }}>Đang tải...</p>;
    if (!transactions || transactions.length === 0)
      return <p style={{ padding: '1rem', color: '#718096' }}>Chưa có giao dịch nào.</p>;
    return (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Người dùng</th>
            <th>Mô tả</th>
            <th>Số tiền</th>
            <th>Phương thức</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="transaction-id">{transaction.id.slice(0, 8)}…</td>
              <td>{transaction.userName}</td>
              <td>{transaction.planName}</td>
              <td className="transaction-amount">{transaction.amount.toLocaleString('vi-VN')}đ</td>
              <td>
                <span className="payment-method">
                  {transaction.paymentMethod === 'payos' ? '💳 PayOS' : transaction.paymentMethod}
                </span>
              </td>
              <td>
                <span className={`status-badge ${transaction.status}`}>
                  {getTransactionStatusLabel(transaction.status)}
                </span>
              </td>
              <td>{new Date(transaction.createdAt).toLocaleString('vi-VN')}</td>
              <td>
                <button className="btn-icon" title="Chi tiết">
                  👁️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderSystemStatus = () => {
    if (loading) return <p style={{ padding: '1rem', color: '#718096' }}>Đang tải...</p>;
    if (systemServices.length === 0)
      return <p style={{ padding: '1rem', color: '#718096' }}>Không có dữ liệu trạng thái.</p>;
    return (
      <div className="system-status">
        {systemServices.map((service) => (
          <div key={service.name} className="status-item">
            <div className={`status-indicator ${service.status}`}></div>
            <div className="status-info">
              <div className="status-name">{service.name}</div>
              <div className="status-value">{service.description}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout
      role="admin"
      user={{
        name: adminUser?.fullName ?? adminUser?.email ?? 'Admin',
        avatar: adminUser?.avatar ?? '',
        role: 'admin',
      }}
      notificationCount={notificationCount}
    >
      <div className="admin-dashboard">
        {fetchError && (
          <div className="error-banner" style={{ color: '#e53e3e', marginBottom: 12 }}>
            ⚠️ {fetchError}
          </div>
        )}

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard 🛠️</h1>
            <p className="dashboard-subtitle">Tổng quan quản trị hệ thống MathMaster</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <span>📊</span> Xuất báo cáo
            </button>
            <button className="btn btn-primary">
              <span>⚙️</span> Cài đặt hệ thống
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {loading || statsCards.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="stat-card" style={{ borderTopColor: '#e2e8f0' }}>
                  <div className="stat-icon" style={{ background: '#f7fafc', color: '#a0aec0' }}>
                    —
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Đang tải...</div>
                    <div className="stat-value">—</div>
                  </div>
                </div>
              ))
            : statsCards.map((stat) => (
                <div key={stat.label} className="stat-card" style={{ borderTopColor: stat.color }}>
                  <div
                    className="stat-icon"
                    style={{ background: `${stat.color}20`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-trend positive">{stat.trend} so với tháng trước</div>
                  </div>
                </div>
              ))}
        </div>

        <div className="dashboard-grid">
          {/* Recent Users */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Người dùng mới</h2>
              <a href="/admin/users" className="card-link">
                Xem tất cả →
              </a>
            </div>
            <div className="users-table">{renderUsersTable()}</div>
          </div>
        </div>

        <div className="dashboard-grid full-width">
          {/* Teacher Profile Review - Highlighted */}
          <div className="dashboard-card highlight-card">
            <div className="card-header">
              <h2 className="card-title">Duyệt Profile Giáo Viên 🍎</h2>
              <div className="pending-badge">{pendingProfiles} Chờ duyệt</div>
            </div>
            <div className="card-content">
              <p>Có {pendingProfiles} giáo viên đang chờ xác minh danh tính và bằng cấp.</p>
              <div className="card-footer">
                <a href="/admin/review-profiles" className="btn btn-primary">
                  Duyệt ngay →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Giao dịch gần đây</h2>
            <a href="/admin/transactions" className="card-link">
              Xem tất cả →
            </a>
          </div>
          <div className="transactions-table">{renderTransactionsTable()}</div>
        </div>

        {/* Revenue Chart */}
        <div className="dashboard-grid-2">
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Doanh thu theo tháng</h2>
            </div>
            <div className="revenue-chart">
              {loading ? (
                <p style={{ padding: '1rem', color: '#718096' }}>Đang tải...</p>
              ) : (
                <div className="chart-bars">
                  {(revenueMonthly.length === 12
                    ? revenueMonthly
                    : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0 }))
                  ).map((item) => (
                    <div key={item.month} className="chart-bar">
                      <div
                        className="bar-fill"
                        style={{ height: `${(item.revenue / revenueMax) * 100}%` }}
                      ></div>
                      <div className="bar-label">T{item.month}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Thống kê nhanh</h2>
            </div>
            {loading || !quickStats ? (
              <p style={{ padding: '1rem', color: '#718096' }}>Đang tải...</p>
            ) : (
              <div className="quick-stats">
                <div className="quick-stat-item">
                  <div className="quick-stat-label">Tỷ lệ chuyển đổi</div>
                  <div className="quick-stat-value">{quickStats.conversionRate.toFixed(1)}%</div>
                  <div className="quick-stat-bar">
                    <div
                      className="quick-stat-fill"
                      style={{
                        width: `${Math.min(quickStats.conversionRate, 100)}%`,
                        background: '#667eea',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-label">Người dùng hoạt động</div>
                  <div className="quick-stat-value">
                    {quickStats.activeUsers.toLocaleString('vi-VN')}
                  </div>
                  <div className="quick-stat-bar">
                    <div
                      className="quick-stat-fill"
                      style={{
                        width: `${Math.min((quickStats.activeUsers / (dashboardStats?.totalUsers || 1)) * 100, 100)}%`,
                        background: '#43e97b',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-label">Tài liệu được tạo</div>
                  <div className="quick-stat-value">
                    {quickStats.documentsCreated.toLocaleString('vi-VN')}
                  </div>
                  <div className="quick-stat-bar">
                    <div
                      className="quick-stat-fill"
                      style={{ width: '100%', background: '#f093fb' }}
                    ></div>
                  </div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-label">Tỷ lệ hài lòng</div>
                  {quickStats.satisfactionRate === -1 ? (
                    <div
                      className="quick-stat-value"
                      style={{ color: '#a0aec0', fontSize: '0.875rem' }}
                    >
                      Chưa có dữ liệu
                    </div>
                  ) : (
                    <>
                      <div className="quick-stat-value">
                        {quickStats.satisfactionRate.toFixed(1)}%
                      </div>
                      <div className="quick-stat-bar">
                        <div
                          className="quick-stat-fill"
                          style={{
                            width: `${Math.min(quickStats.satisfactionRate, 100)}%`,
                            background: '#fbbf24',
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Trạng thái hệ thống</h2>
          </div>
          {renderSystemStatus()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
