import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import {
  mockAdmin,
  mockUsers,
  mockTransactions,
} from '../../../data/mockData';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [pendingProfiles, setPendingProfiles] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await TeacherProfileService.countPendingProfiles();
        setPendingProfiles(response.result);
      } catch (error) {
        console.error('Failed to fetch pending profile count:', error);
      }
    };
    fetchPendingCount();
  }, []);

  const stats = [
    { icon: '👥', label: 'Tổng người dùng', value: '1,930', trend: '+12%', color: '#667eea' },
    { icon: '💰', label: 'Doanh thu tháng', value: '₫45.2M', trend: '+8%', color: '#43e97b' },
    { icon: '💳', label: 'Gói đăng ký', value: '680', trend: '+15%', color: '#f093fb' },
    { icon: '📊', label: 'Giao dịch', value: '1,245', trend: '+5%', color: '#fbbf24' },
  ];

  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar!, role: 'admin' }}
      notificationCount={8}
    >
      <div className="admin-dashboard">
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
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ borderTopColor: stat.color }}>
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
            <div className="users-table">
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
                  {mockUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{user.name.charAt(0)}</div>
                          <div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td>{new Date(user.joinedDate).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Gói</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="transaction-id">{transaction.id}</td>
                    <td>{transaction.userName}</td>
                    <td>{transaction.planName}</td>
                    <td className="transaction-amount">
                      {transaction.amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td>
                      <span className="payment-method">
                        {transaction.paymentMethod === 'wallet'
                          ? '💰 Ví'
                          : transaction.paymentMethod === 'momo'
                            ? '📱 MoMo'
                            : '🏦 Bank'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status === 'completed'
                          ? 'Thành công'
                          : transaction.status === 'pending'
                            ? 'Đang xử lý'
                            : 'Thất bại'}
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
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="dashboard-grid-2">
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Doanh thu theo tháng</h2>
            </div>
            <div className="revenue-chart">
              <div className="chart-bars">
                {[32, 45, 38, 52, 48, 65, 58, 72, 68, 85, 78, 92].map((value, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar-fill" style={{ height: `${value}%` }}></div>
                    <div className="bar-label">T{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Thống kê nhanh</h2>
            </div>
            <div className="quick-stats">
              <div className="quick-stat-item">
                <div className="quick-stat-label">Tỷ lệ chuyển đổi</div>
                <div className="quick-stat-value">68%</div>
                <div className="quick-stat-bar">
                  <div
                    className="quick-stat-fill"
                    style={{ width: '68%', background: '#667eea' }}
                  ></div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-label">Người dùng hoạt động</div>
                <div className="quick-stat-value">1,456</div>
                <div className="quick-stat-bar">
                  <div
                    className="quick-stat-fill"
                    style={{ width: '85%', background: '#43e97b' }}
                  ></div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-label">Tài liệu được tạo</div>
                <div className="quick-stat-value">8,234</div>
                <div className="quick-stat-bar">
                  <div
                    className="quick-stat-fill"
                    style={{ width: '92%', background: '#f093fb' }}
                  ></div>
                </div>
              </div>
              <div className="quick-stat-item">
                <div className="quick-stat-label">Tỷ lệ hài lòng</div>
                <div className="quick-stat-value">96%</div>
                <div className="quick-stat-bar">
                  <div
                    className="quick-stat-fill"
                    style={{ width: '96%', background: '#fbbf24' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Trạng thái hệ thống</h2>
          </div>
          <div className="system-status">
            <div className="status-item">
              <div className="status-indicator active"></div>
              <div className="status-info">
                <div className="status-name">Web Server</div>
                <div className="status-value">Hoạt động bình thường</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator active"></div>
              <div className="status-info">
                <div className="status-name">Database</div>
                <div className="status-value">Hoạt động bình thường</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator active"></div>
              <div className="status-info">
                <div className="status-name">AI Service</div>
                <div className="status-value">Hoạt động bình thường</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator warning"></div>
              <div className="status-info">
                <div className="status-name">Storage</div>
                <div className="status-value">85% đã sử dụng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
