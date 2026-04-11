import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  userManagementService,
  type AdminUserItem,
  type ListUsersParams,
  type UserRole,
} from '../../services/userManagement.service';
import './UserManagement.css';

const ROLE_FILTER_MAP: Record<'all' | 'teacher' | 'student', ListUsersParams['role']> = {
  all: 'all',
  teacher: 'TEACHER',
  student: 'STUDENT',
};

const UserManagement: React.FC = () => {
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // List state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState({ total: 0, teachers: 0, students: 0, active: 0 });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    userName: '',
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT' as UserRole,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Send email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  const fetchUsers = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userManagementService.listUsers({
          page,
          pageSize: pagination.pageSize,
          role: ROLE_FILTER_MAP[filterRole],
          search: searchTerm || undefined,
          status: 'all',
        });
        setUsers(result.users);
        setStats(result.stats);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Loi tai danh sach nguoi dung');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterRole, searchTerm]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(0), searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, searchTerm]);

  const handleCreateSubmit = async () => {
    if (!createForm.userName || !createForm.fullName || !createForm.email || !createForm.password) {
      setCreateError('Vui long dien day du cac truong bat buoc');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await userManagementService.createUser({
        userName: createForm.userName,
        fullName: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        roles: [createForm.role],
        status: createForm.status,
      });
      setShowCreateModal(false);
      setCreateForm({
        userName: '',
        fullName: '',
        email: '',
        password: '',
        role: 'STUDENT',
        status: 'ACTIVE',
      });
      fetchUsers(0);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Tao nguoi dung that bai');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await userManagementService.updateStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      if (selectedUser?.id === user.id) setSelectedUser(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cap nhat trang thai that bai');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await userManagementService.resetPassword(userId);
      alert('Mat khau moi da duoc gui den email cua nguoi dung');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Dat lai mat khau that bai');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!globalThis.confirm('Ban co chac chan muon xoa tai khoan nay khong?')) return;
    try {
      await userManagementService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xoa tai khoan that bai');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailForm.subject || !emailForm.body) return;
    setEmailLoading(true);
    try {
      await userManagementService.sendEmail(selectedUser.id, emailForm);
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
      alert('Email da duoc gui thanh cong');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gui email that bai');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await userManagementService.exportExcel({
        role: ROLE_FILTER_MAP[filterRole],
        search: searchTerm || undefined,
        status: 'all',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xuat Excel that bai');
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '\u2705 Hoat dong';
      case 'INACTIVE':
        return '\u23F8\uFE0F Tam ngung';
      case 'BANNED':
        return '\uD83D\uDEAB Bi cam';
      default:
        return status;
    }
  };

  const getRoleLabel = (roles: UserRole[]) => {
    const role = roles[0];
    switch (role) {
      case 'TEACHER':
        return '\uD83D\uDC68\u200D\uD83C\uDFEB Giao vien';
      case 'STUDENT':
        return '\uD83D\uDC68\u200D\uD83C\uDF93 Hoc sinh';
      case 'ADMIN':
        return '\uD83D\uDC68\u200D\uD83D\uDCBC Admin';
      default:
        return role ?? '\u2014';
    }
  };

  const getRoleBadgeClass = (roles: UserRole[]) => {
    const role = roles[0];
    switch (role) {
      case 'TEACHER':
        return 'teacher';
      case 'STUDENT':
        return 'student';
      case 'ADMIN':
        return 'admin';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar as string, role: 'admin' }}
      notificationCount={8}
    >
      <div className="user-management-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">&#128101; Quan Ly Nguoi Dung</h1>
            <p className="page-subtitle">Quan ly tai khoan va phan quyen nguoi dung</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>&#10133;</span> Them nguoi dung
          </button>
        </div>

        {/* Stats */}
        <div className="user-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              &#128101;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tong nguoi dung</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              &#128104;&#8205;&#127979;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.teachers}</div>
              <div className="stat-label">Giao vien</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              &#128104;&#8205;&#127891;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.students}</div>
              <div className="stat-label">Hoc sinh</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              &#9989;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Dang hoat dong</div>
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
              Tat ca ({stats.total})
            </button>
            <button
              className={`filter-tab ${filterRole === 'teacher' ? 'active' : ''}`}
              onClick={() => setFilterRole('teacher')}
            >
              Giao vien ({stats.teachers})
            </button>
            <button
              className={`filter-tab ${filterRole === 'student' ? 'active' : ''}`}
              onClick={() => setFilterRole('student')}
            >
              Hoc sinh ({stats.students})
            </button>
          </div>

          <div className="toolbar-actions">
            <input
              type="text"
              placeholder="Tim kiem nguoi dung..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline" onClick={handleExportExcel}>
              Xuat Excel
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {loading && <div className="table-loading">Dang tai...</div>}
          {error && <div className="table-error">{error}</div>}
          {!loading && !error && (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nguoi dung</th>
                  <th>Vai tro</th>
                  <th>Email</th>
                  <th>Ngay tham gia</th>
                  <th>Dang nhap gan day</th>
                  <th>Trang thai</th>
                  <th>Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="user-cell">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>@{user.userName}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.roles)}`}>
                        {getRoleLabel(user.roles)}
                      </span>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>{new Date(user.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '\u2014'}
                    </td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view"
                          title="Xem chi tiet"
                          onClick={() => setSelectedUser(user)}
                        >
                          &#128065;&#65039;
                        </button>
                        <button
                          className="action-btn delete"
                          title="Xoa"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          &#128465;&#65039;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                      Khong co nguoi dung nao
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={pagination.page === 0}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Truoc
            </button>
            <div className="pagination-pages">
              {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
                <button
                  key={i}
                  className={`pagination-page ${pagination.page === i ? 'active' : ''}`}
                  onClick={() => handlePageChange(i)}
                >
                  {i + 1}
                </button>
              ))}
              {pagination.totalPages > 10 && <span>...</span>}
            </div>
            <button
              className="pagination-btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Sau
            </button>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            role="presentation"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Them nguoi dung moi</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  X
                </button>
              </div>

              <div className="modal-body">
                {createError && (
                  <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {createError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="create-fullname">Ho va ten *</label>
                  <input
                    id="create-fullname"
                    type="text"
                    placeholder="Nhap ho va ten"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-username">Ten dang nhap *</label>
                  <input
                    id="create-username"
                    type="text"
                    placeholder="Nhap ten dang nhap (khong dau, khong khoang trang)"
                    value={createForm.userName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, userName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-email">Email *</label>
                  <input
                    id="create-email"
                    type="email"
                    placeholder="example@email.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="create-role">Vai tro *</label>
                    <select
                      id="create-role"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))
                      }
                    >
                      <option value="TEACHER">Giao vien</option>
                      <option value="STUDENT">Hoc sinh</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="create-status">Trang thai *</label>
                    <select
                      id="create-status"
                      value={createForm.status}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          status: e.target.value as 'ACTIVE' | 'INACTIVE',
                        }))
                      }
                    >
                      <option value="ACTIVE">Hoat dong</option>
                      <option value="INACTIVE">Tam ngung</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="create-password">Mat khau tam thoi *</label>
                  <input
                    id="create-password"
                    type="password"
                    placeholder="Toi thieu 8 ky tu, co chu hoa + so + ky tu dac biet"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Huy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateSubmit}
                  disabled={createLoading}
                >
                  {createLoading ? 'Dang tao...' : 'Tao nguoi dung'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailModal && selectedUser && (
          <div
            className="modal-overlay"
            role="presentation"
            onClick={() => setShowEmailModal(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Gui email den {selectedUser.fullName}</h2>
                <button className="modal-close" onClick={() => setShowEmailModal(false)}>
                  X
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="email-subject">Tieu de *</label>
                  <input
                    id="email-subject"
                    type="text"
                    placeholder="Nhap tieu de email"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email-body">Noi dung *</label>
                  <textarea
                    id="email-body"
                    rows={6}
                    placeholder="Nhap noi dung email..."
                    value={emailForm.body}
                    onChange={(e) => setEmailForm((f) => ({ ...f, body: e.target.value }))}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowEmailModal(false)}
                  disabled={emailLoading}
                >
                  Huy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Dang gui...' : 'Gui email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && !showEmailModal && (
          <div className="modal-overlay" role="presentation" onClick={() => setSelectedUser(null)}>
            <div
              className="modal large"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Chi tiet nguoi dung</h2>
                <button className="modal-close" onClick={() => setSelectedUser(null)}>
                  X
                </button>
              </div>

              <div className="modal-body">
                <div className="user-detail-header">
                  <div className="detail-avatar">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      selectedUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="detail-info">
                    <h3>{selectedUser.fullName}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#888' }}>
                      @{selectedUser.userName}
                    </div>
                    <p>{selectedUser.email}</p>
                    <span className={`role-badge ${getRoleBadgeClass(selectedUser.roles)}`}>
                      {getRoleLabel(selectedUser.roles)}
                    </span>
                  </div>
                </div>

                <div className="user-detail-stats">
                  <div className="detail-stat">
                    <div className="stat-label">Ngay tham gia</div>
                    <div className="stat-value">
                      {new Date(selectedUser.createdDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Dang nhap gan day</div>
                    <div className="stat-value">
                      {selectedUser.lastLogin
                        ? new Date(selectedUser.lastLogin).toLocaleString('vi-VN')
                        : '\u2014'}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Trang thai</div>
                    <div className="stat-value">
                      <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-actions-section">
                  <h4>Hanh dong quan ly</h4>
                  <div className="action-buttons-grid">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleResetPassword(selectedUser.id)}
                    >
                      Dat lai mat khau
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowEmailModal(true)}>
                      Gui email
                    </button>
                    {(selectedUser.status === 'ACTIVE' || selectedUser.status === 'INACTIVE') && (
                      <button
                        className="btn btn-outline"
                        onClick={() => handleToggleStatus(selectedUser)}
                      >
                        {selectedUser.status === 'ACTIVE' ? 'Tam ngung' : 'Kich hoat'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={() => handleDeleteUser(selectedUser.id)}
                    >
                      Xoa tai khoan
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedUser(null)}>
                  Dong
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
