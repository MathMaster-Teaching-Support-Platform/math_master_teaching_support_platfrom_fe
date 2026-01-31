import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockSubscriptionPlans } from '../../data/mockData';
import './SubscriptionManagement.css';

// Fixed timestamp for consistent data generation
const FIXED_TIMESTAMP = 1738713600000; // Feb 5, 2026

const SubscriptionManagement: React.FC = () => {
  const subscriptionData = useMemo(() => {
    return mockSubscriptionPlans.map((plan, index) => {
      const seed = index * 17 + 53;
      return {
        ...plan,
        description: `Gói ${plan.name} - Tốt nhất cho ${plan.name === 'Basic' ? 'cá nhân' : plan.name === 'Pro' ? 'giáo viên' : 'tổ chức'}`,
        activeUsers: 50 + (seed % 500),
        revenue: 10000000 + (seed % 50000000),
        growth: ((seed % 25) - 5).toFixed(1),
      };
    });
  }, []);

  const [selectedPlan, setSelectedPlan] = useState<(typeof subscriptionData)[0] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = {
    totalRevenue: subscriptionData.reduce((sum, plan) => sum + plan.revenue, 0),
    totalUsers: subscriptionData.reduce((sum, plan) => sum + plan.activeUsers, 0),
    avgRevenue: Math.floor(
      subscriptionData.reduce((sum, plan) => sum + plan.revenue, 0) /
        subscriptionData.reduce((sum, plan) => sum + plan.activeUsers, 0)
    ),
    conversionRate: 23.5,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar!, role: 'admin' }}
      notificationCount={8}
    >
      <div className="subscription-management-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💎 Quản Lý Gói Dịch Vụ</h1>
            <p className="page-subtitle">Quản lý các gói đăng ký và doanh thu</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>➕</span> Tạo gói mới
          </button>
        </div>

        {/* Revenue Stats */}
        <div className="revenue-stats">
          <div className="stat-card highlight">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              💰
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
              <div className="stat-label">Tổng doanh thu</div>
              <div className="stat-trend positive">+12.5% so với tháng trước</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              👥
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Người dùng trả phí</div>
              <div className="stat-trend positive">+8.3%</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              📊
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.avgRevenue)}</div>
              <div className="stat-label">Doanh thu TB/người</div>
              <div className="stat-trend positive">+4.2%</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              📈
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.conversionRate}%</div>
              <div className="stat-label">Tỷ lệ chuyển đổi</div>
              <div className="stat-trend positive">+2.1%</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="plans-section">
          <h2 className="section-title">Các gói đăng ký</h2>
          <div className="plans-grid">
            {subscriptionData.map((plan, index) => (
              <div key={index} className={`plan-card ${plan.name === 'Pro' ? 'featured' : ''}`}>
                {plan.name === 'Pro' && <div className="featured-badge">⭐ Phổ biến nhất</div>}

                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price-amount">{formatCurrency(plan.price)}</span>
                    <span className="price-period">/tháng</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-metrics">
                  <div className="metric">
                    <div className="metric-label">Người dùng</div>
                    <div className="metric-value">{plan.activeUsers}</div>
                    <div
                      className={`metric-change ${parseFloat(plan.growth) > 0 ? 'positive' : 'negative'}`}
                    >
                      {parseFloat(plan.growth) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(plan.growth))}%
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Doanh thu</div>
                    <div className="metric-value">{formatCurrency(plan.revenue)}</div>
                  </div>
                </div>

                <div className="plan-features">
                  <h4 className="features-title">Tính năng:</h4>
                  <ul className="features-list">
                    {plan.features.slice(0, 5).map((feature: string, i: number) => (
                      <li key={i}>✅ {feature}</li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="more-features">+{plan.features.length - 5} tính năng khác</li>
                    )}
                  </ul>
                </div>

                <div className="plan-actions">
                  <button className="btn btn-outline" onClick={() => setSelectedPlan(plan)}>
                    👁️ Chi tiết
                  </button>
                  <button className="btn btn-outline">✏️ Chỉnh sửa</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="recent-subscriptions">
          <h2 className="section-title">Đăng ký gần đây</h2>
          <div className="subscriptions-table-container">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Gói</th>
                  <th>Ngày đăng ký</th>
                  <th>Ngày hết hạn</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => {
                  const plan = mockSubscriptionPlans[i % 3];
                  const seed = i * 19 + 41;
                  const startDate = new Date(FIXED_TIMESTAMP - (seed % 30) * 24 * 60 * 60 * 1000);
                  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const status = seed % 10 !== 0 ? 'active' : 'expired';

                  return (
                    <tr key={i}>
                      <td className="user-cell">
                        <div className="user-avatar">{String.fromCharCode(65 + (i % 26))}</div>
                        <div className="user-info">
                          <div className="user-name">Người dùng {i + 1}</div>
                          <div className="user-email">user{i + 1}@example.com</div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${plan.name.toLowerCase()}`}>{plan.name}</span>
                      </td>
                      <td>{startDate.toLocaleDateString('vi-VN')}</td>
                      <td>{endDate.toLocaleDateString('vi-VN')}</td>
                      <td className="amount-cell">{formatCurrency(plan.price)}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'active' ? '✅ Hoạt động' : '⏸️ Hết hạn'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn" title="Gia hạn">
                            🔄
                          </button>
                          <button className="action-btn" title="Chi tiết">
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Tạo gói đăng ký mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Tên gói *</label>
                  <input type="text" placeholder="Ví dụ: Premium" />
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea rows={3} placeholder="Mô tả ngắn về gói đăng ký"></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giá (VNĐ) *</label>
                    <input type="number" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Thời hạn *</label>
                    <select>
                      <option>1 tháng</option>
                      <option>3 tháng</option>
                      <option>6 tháng</option>
                      <option>1 năm</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tính năng (mỗi tính năng 1 dòng) *</label>
                  <textarea
                    rows={6}
                    placeholder="Nhập các tính năng, mỗi dòng 1 tính năng&#10;Ví dụ:&#10;Tạo không giới hạn khóa học&#10;AI trợ giảng 24/7&#10;Thống kê chi tiết"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Đặt làm gói nổi bật</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Hiển thị trên trang chính</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Tạo gói</button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Detail Modal */}
        {selectedPlan && (
          <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Chi tiết gói: {selectedPlan.name}</h2>
                <button className="modal-close" onClick={() => setSelectedPlan(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="plan-detail-header">
                  <div className="detail-price">
                    <span className="price-amount">{formatCurrency(selectedPlan.price)}</span>
                    <span className="price-period">/tháng</span>
                  </div>
                  <p>{selectedPlan.description}</p>
                </div>

                <div className="plan-detail-stats">
                  <div className="detail-stat">
                    <div className="stat-label">Người dùng đang dùng</div>
                    <div className="stat-value">{selectedPlan.activeUsers}</div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Doanh thu tháng này</div>
                    <div className="stat-value">{formatCurrency(selectedPlan.revenue)}</div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Tăng trưởng</div>
                    <div
                      className={`stat-value ${parseFloat(selectedPlan.growth) > 0 ? 'positive' : 'negative'}`}
                    >
                      {parseFloat(selectedPlan.growth) > 0 ? '↑' : '↓'}{' '}
                      {Math.abs(parseFloat(selectedPlan.growth))}%
                    </div>
                  </div>
                </div>

                <div className="plan-features-full">
                  <h4>Danh sách tính năng đầy đủ:</h4>
                  <ul>
                    {selectedPlan.features.map((feature: string, i: number) => (
                      <li key={i}>✅ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="plan-actions-section">
                  <h4>Hành động quản lý</h4>
                  <div className="action-buttons-grid">
                    <button className="btn btn-outline">✏️ Chỉnh sửa gói</button>
                    <button className="btn btn-outline">💰 Thay đổi giá</button>
                    <button className="btn btn-outline">📊 Xem báo cáo</button>
                    <button className="btn btn-outline">🗑️ Xóa gói</button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedPlan(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
