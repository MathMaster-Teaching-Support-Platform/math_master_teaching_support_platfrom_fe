import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockUsers } from '../../data/mockData';
import './UserManagement.css';

// Fixed timestamp for consistent data generation
const FIXED_TIMESTAMP = 1738713600000; // Feb 5, 2026

const UserManagement: React.FC = () => {
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const allUsers = useMemo(() => {
    return [...mockUsers, mockAdmin].map((user, index) => {
      const seed = index * 11 + 31;
      const userName = 'name' in user ? user.name : 'Admin System';
      const userAvatar = 'avatar' in user ? user.avatar : userName.charAt(0);
      return {
        ...user,
        name: userName,
        avatar: userAvatar,
        status: seed % 5 !== 0 ? 'active' : 'inactive',
        joinDate: new Date(FIXED_TIMESTAMP - (seed % 365) * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date(FIXED_TIMESTAMP - (seed % 7) * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  }, []);

  const [selectedUser, setSelectedUser] = useState<(typeof allUsers)[0] | null>(null);

  const filteredUsers = allUsers.filter((user) => {
    const matchRole = filterRole === 'all' || user.role === filterRole;
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const stats = {
    total: allUsers.length,
    teachers: allUsers.filter((u) => u.role === 'teacher').length,
    students: allUsers.filter((u) => u.role === 'student').length,
    active: allUsers.filter((u) => u.status === 'active').length,
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar!, role: 'admin' }}
      notificationCount={8}
    >
      <div className="user-management-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 Quản Lý Người Dùng</h1>
            <p className="page-subtitle">Quản lý tài khoản và phân quyền người dùng</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>➕</span> Thêm người dùng
          </button>
        </div>

        {/* Stats */}
        <div className="user-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              👥
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng người dùng</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              👨‍🏫
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.teachers}</div>
              <div className="stat-label">Giáo viên</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              👨‍🎓
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.students}</div>
              <div className="stat-label">Học sinh</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              ✅
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRole('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button
              className={`filter-tab ${filterRole === 'teacher' ? 'active' : ''}`}
              onClick={() => setFilterRole('teacher')}
            >
              Giáo viên ({stats.teachers})
            </button>
            <button
              className={`filter-tab ${filterRole === 'student' ? 'active' : ''}`}
              onClick={() => setFilterRole('student')}
            >
              Học sinh ({stats.students})
            </button>
          </div>

          <div className="toolbar-actions">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm người dùng..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline">📥 Xuất Excel</button>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Email</th>
                <th>Ngày tham gia</th>
                <th>Đăng nhập gần đây</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={index}>
                  <td className="user-cell">
                    <div className="user-avatar">{user.avatar || user.name.charAt(0)}</div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'teacher'
                        ? '👨‍🏫 Giáo viên'
                        : user.role === 'student'
                          ? '👨‍🎓 Học sinh'
                          : '👨‍💼 Admin'}
                    </span>
                  </td>
                  <td className="email-cell">{user.email}</td>
                  <td>{new Date(user.joinDate).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {new Date(user.lastLogin).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? '✅ Hoạt động' : '⏸️ Tạm ngưng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="Xem chi tiết"
                        onClick={() => setSelectedUser(user)}
                      >
                        👁️
                      </button>
                      <button className="action-btn edit" title="Chỉnh sửa">
                        ✏️
                      </button>
                      <button className="action-btn delete" title="Xóa">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="pagination-btn">← Trước</button>
          <div className="pagination-pages">
            <button className="pagination-page active">1</button>
            <button className="pagination-page">2</button>
            <button className="pagination-page">3</button>
            <span>...</span>
            <button className="pagination-page">10</button>
          </div>
          <button className="pagination-btn">Sau →</button>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Thêm người dùng mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input type="text" placeholder="Nhập họ và tên" />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" placeholder="example@email.com" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Vai trò *</label>
                    <select>
                      <option>Giáo viên</option>
                      <option>Học sinh</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Trạng thái *</label>
                    <select>
                      <option>Hoạt động</option>
                      <option>Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mật khẩu tạm thời *</label>
                  <input type="password" placeholder="Nhập mật khẩu" />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Gửi email chào mừng</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Yêu cầu đổi mật khẩu lần đầu đăng nhập</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Tạo người dùng</button>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Chi tiết người dùng</h2>
                <button className="modal-close" onClick={() => setSelectedUser(null)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="user-detail-header">
                  <div className="detail-avatar">
                    {selectedUser.avatar || selectedUser.name.charAt(0)}
                  </div>
                  <div className="detail-info">
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.email}</p>
                    <span className={`role-badge ${selectedUser.role}`}>
                      {selectedUser.role === 'teacher' ? '👨‍🏫 Giáo viên' : '👨‍🎓 Học sinh'}
                    </span>
                  </div>
                </div>

                <div className="user-detail-stats">
                  <div className="detail-stat">
                    <div className="stat-label">Ngày tham gia</div>
                    <div className="stat-value">
                      {new Date(selectedUser.joinDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Đăng nhập gần đây</div>
                    <div className="stat-value">
                      {new Date(selectedUser.lastLogin).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Trạng thái</div>
                    <div className="stat-value">
                      <span className={`status-badge ${selectedUser.status}`}>
                        {selectedUser.status === 'active' ? '✅ Hoạt động' : '⏸️ Tạm ngưng'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-actions-section">
                  <h4>Hành động quản lý</h4>
                  <div className="action-buttons-grid">
                    <button className="btn btn-outline">🔄 Đặt lại mật khẩu</button>
                    <button className="btn btn-outline">📧 Gửi email</button>
                    <button className="btn btn-outline">
                      {selectedUser.status === 'active' ? '⏸️ Tạm ngưng' : '▶️ Kích hoạt'}
                    </button>
                    <button className="btn btn-outline">🗑️ Xóa tài khoản</button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedUser(null)}>
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

export default UserManagement;
