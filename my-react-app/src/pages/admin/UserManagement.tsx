import {
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import {
  userManagementService,
  type AdminUserItem,
  type ListUsersParams,
  type UserRole,
} from '../../services/userManagement.service';
import './UserManagement.css';

const ROLE_FILTER_MAP: Record<'all' | 'admin' | 'teacher' | 'student', ListUsersParams['role']> = {
  all: 'all',
  admin: 'ADMIN',
  teacher: 'TEACHER',
  student: 'STUDENT_ONLY',
};

const ROLE_PRIORITY: Record<UserRole, number> = { ADMIN: 3, TEACHER: 2, STUDENT: 1 };

const getHighestRole = (roles: UserRole[]): UserRole =>
  roles.reduce(
    (highest, r) => (ROLE_PRIORITY[r] > ROLE_PRIORITY[highest] ? r : highest),
    'STUDENT' as UserRole
  );

const UserManagement: React.FC = () => {
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // List state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState({ total: 0, admins: 0, teachers: 0, students: 0, active: 0 });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
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
        setError(err instanceof Error ? err.message : 'Lỗi tải danh sách người dùng');
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
      setCreateError('Vui lòng điền đầy đủ các trường bắt buộc');
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
      setCreateError(err instanceof Error ? err.message : 'Tạo người dùng thất bại');
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
      alert(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await userManagementService.resetPassword(userId);
      alert('Mật khẩu mới đã được gửi đến email của người dùng');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!globalThis.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) return;
    try {
      await userManagementService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa tài khoản thất bại');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailForm.subject || !emailForm.body) return;
    setEmailLoading(true);
    try {
      await userManagementService.sendEmail(selectedUser.id, emailForm);
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
      alert('Email đã được gửi thành công');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gửi email thất bại');
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
      alert(err instanceof Error ? err.message : 'Xuất Excel thất bại');
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Tạm ngưng';
      case 'BANNED':
        return 'Bị cấm';
      default:
        return status;
    }
  };

  const getRoleLabel = (roles: UserRole[]) => {
    const role = getHighestRole(roles);
    switch (role) {
      case 'TEACHER':
        return 'Giáo viên';
      case 'STUDENT':
        return 'Học sinh';
      case 'ADMIN':
        return 'Admin';
      default:
        return role ?? '\u2014';
    }
  };

  const getRoleBadgeClass = (roles: UserRole[]) => {
    const role = getHighestRole(roles);
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
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-mgmt-shell admin-user-mgmt-page">
        <div className="admin-mgmt-shell__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page admin-mgmt-shell__content admin-user-mgmt-page__inner">
          <div className="user-management-page">
            <header className="page-header courses-header-row">
              <div className="header-stack">
                <div className="header-kicker">Admin</div>
                <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
                <p className="header-sub">Tài khoản, vai trò và trạng thái hoạt động</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} aria-hidden />
                Thêm người dùng
              </button>
            </header>

            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <div className="stat-icon-wrap">
                  <Users size={20} aria-hidden />
                </div>
                <div>
                  <h3>{loading ? '…' : stats.total}</h3>
                  <p>Tổng người dùng</p>
                </div>
              </div>
              <div className="stat-card stat-violet">
                <div className="stat-icon-wrap">
                  <Settings size={20} aria-hidden />
                </div>
                <div>
                  <h3>{loading ? '…' : stats.admins}</h3>
                  <p>Admin</p>
                </div>
              </div>
              <div className="stat-card stat-emerald">
                <div className="stat-icon-wrap">
                  <BookOpen size={20} aria-hidden />
                </div>
                <div>
                  <h3>{loading ? '…' : stats.teachers}</h3>
                  <p>Giáo viên</p>
                </div>
              </div>
              <div className="stat-card stat-amber">
                <div className="stat-icon-wrap">
                  <GraduationCap size={20} aria-hidden />
                </div>
                <div>
                  <h3>{loading ? '…' : stats.students}</h3>
                  <p>Học sinh</p>
                </div>
              </div>
              <div className="stat-card stat-emerald">
                <div className="stat-icon-wrap">
                  <CheckCircle2 size={20} aria-hidden />
                </div>
                <div>
                  <h3>{loading ? '…' : stats.active}</h3>
                  <p>Đang hoạt động</p>
                </div>
              </div>
            </div>

            <div className="toolbar admin-mgmt-toolbar">
              <div className="pill-group">
                {(
                  [
                    { id: 'all' as const, label: `Tất cả (${stats.total})` },
                    { id: 'admin' as const, label: `Admin (${stats.admins})` },
                    { id: 'teacher' as const, label: `Giáo viên (${stats.teachers})` },
                    { id: 'student' as const, label: `Học sinh (${stats.students})` },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`pill-btn${filterRole === id ? ' active' : ''}`}
                    onClick={() => setFilterRole(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search-box">
                <span className="search-box__icon" aria-hidden="true">
                  <Search size={15} />
                </span>
                <input
                  type="search"
                  placeholder="Tìm theo tên, email, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Tìm người dùng"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    className="search-box__clear"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </button>
                ) : null}
                {loading ? (
                  <span className="admin-user-mgmt-search-pending" aria-hidden="true">
                    <Loader2 size={16} className="admin-user-mgmt-spin" />
                  </span>
                ) : null}
              </label>
              <button type="button" className="btn secondary" onClick={handleExportExcel}>
                Xuất Excel
              </button>
            </div>

            {/* Users Table */}
            <div className="users-table-container admin-mgmt-table-shell">
              {loading && (
                <div className="table-loading table-loading--studio">
                  <Loader2 className="admin-user-mgmt-spin" size={22} aria-hidden />
                  <span>Đang tải…</span>
                </div>
              )}
          {error && <div className="table-error">{error}</div>}
          {!loading && !error && (
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
                          (user.fullName ?? '?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.fullName}</div>
                        <div className="user-handle">@{user.userName}</div>
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
                          title="Xem chi tiết"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Xóa"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-users-row">
                      Không có người dùng nào
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
              Trước
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
          <div className="modal-overlay modal-overlay--anchored">
            <button
              className="modal-backdrop"
              onClick={() => setShowCreateModal(false)}
              aria-label="Đóng hộp thoại"
            />
            <dialog className="modal modal--create-user" open>
              <div className="modal-header">
                <h2 className="modal-title">Thêm người dùng mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="modal-body">
                {createError && (
                  <div className="modal-inline-error" role="alert">
                    {createError}
                  </div>
                )}

                <div className="modal-form-grid">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="create-fullname">Họ và tên *</label>
                      <input
                        id="create-fullname"
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-username">Tên đăng nhập *</label>
                      <input
                        id="create-username"
                        type="text"
                        placeholder="Không dấu, không khoảng trắng"
                        value={createForm.userName}
                        onChange={(e) => setCreateForm((f) => ({ ...f, userName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
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
                    <div className="form-group">
                      <label htmlFor="create-password">Mật khẩu tạm thời *</label>
                      <input
                        id="create-password"
                        type="password"
                        placeholder="≥8 ký tự, chữ hoa + số + ký tự đặc biệt"
                        value={createForm.password}
                        onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="create-role">Vai trò *</label>
                      <select
                        id="create-role"
                        value={createForm.role}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))
                        }
                      >
                        <option value="TEACHER">Giáo viên</option>
                        <option value="STUDENT">Học sinh</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-status">Trạng thái *</label>
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
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="INACTIVE">Tạm ngưng</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateSubmit}
                  disabled={createLoading}
                >
                  {createLoading ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailModal && selectedUser && (
          <div className="modal-overlay">
            <button
              className="modal-backdrop"
              onClick={() => setShowEmailModal(false)}
              aria-label="Đóng hộp thoại"
            />
            <dialog className="modal" open>
              <div className="modal-header">
                <h2 className="modal-title">Gửi email đến {selectedUser.fullName}</h2>
                <button className="modal-close" onClick={() => setShowEmailModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="email-subject">Tiêu đề *</label>
                  <input
                    id="email-subject"
                    type="text"
                    placeholder="Nhập tiêu đề email"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email-body">Nội dung *</label>
                  <textarea
                    id="email-body"
                    rows={6}
                    placeholder="Nhập nội dung email..."
                    value={emailForm.body}
                    onChange={(e) => setEmailForm((f) => ({ ...f, body: e.target.value }))}
                    className="email-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowEmailModal(false)}
                  disabled={emailLoading}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Đang gửi...' : 'Gửi email'}
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && !showEmailModal && (
          <div className="modal-overlay">
            <button
              className="modal-backdrop"
              onClick={() => setSelectedUser(null)}
              aria-label="Đóng hộp thoại"
            />
            <dialog className="modal large" open>
              <div className="modal-header">
                <h2 className="modal-title">Chi tiết người dùng</h2>
                <button className="modal-close" onClick={() => setSelectedUser(null)}>
                  <X className="w-4 h-4" />
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
                      (selectedUser.fullName ?? '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="detail-info">
                    <h3>{selectedUser.fullName}</h3>
                    <div className="detail-handle">@{selectedUser.userName}</div>
                    <p>{selectedUser.email}</p>
                    <span className={`role-badge ${getRoleBadgeClass(selectedUser.roles)}`}>
                      {getRoleLabel(selectedUser.roles)}
                    </span>
                  </div>
                </div>

                <div className="user-detail-stats">
                  <div className="detail-stat">
                    <div className="stat-label">Ngày tham gia</div>
                    <div className="stat-value">
                      {new Date(selectedUser.createdDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Đăng nhập gần đây</div>
                    <div className="stat-value">
                      {selectedUser.lastLogin
                        ? new Date(selectedUser.lastLogin).toLocaleString('vi-VN')
                        : '\u2014'}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-label">Trạng thái</div>
                    <div className="stat-value">
                      <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-actions-section">
                  <h4>Hành động quản lý</h4>
                  <div className="action-buttons-grid">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleResetPassword(selectedUser.id)}
                    >
                      Đặt lại mật khẩu
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowEmailModal(true)}>
                      Gửi email
                    </button>
                    {(selectedUser.status === 'ACTIVE' || selectedUser.status === 'INACTIVE') && (
                      <button
                        className="btn btn-outline"
                        onClick={() => handleToggleStatus(selectedUser)}
                      >
                        {selectedUser.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={() => handleDeleteUser(selectedUser.id)}
                    >
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedUser(null)}>
                  Đóng
                </button>
              </div>
            </dialog>
          </div>
        )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
