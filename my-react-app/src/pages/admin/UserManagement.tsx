import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  Search,
  Settings,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import {
  userManagementService,
  type AdminUserItem,
  type ListUsersParams,
  type UserRole,
} from '../../services/userManagement.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const EMPTY_STATS = { total: 0, admins: 0, teachers: 0, students: 0, active: 0 };

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const usersQuery = useQuery({
    queryKey: ['admin-users', filterRole, debouncedSearch, page],
    queryFn: () =>
      userManagementService.listUsers({
        page,
        pageSize: 10,
        role: ROLE_FILTER_MAP[filterRole],
        search: debouncedSearch || undefined,
        status: 'all',
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const users = usersQuery.data?.users ?? [];
  const stats = usersQuery.data?.stats ?? EMPTY_STATS;
  const pagination = usersQuery.data?.pagination ?? {
    page,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  };
  const isFetching = usersQuery.isFetching;
  const error = usersQuery.error instanceof Error ? usersQuery.error.message : null;
  /** Chỉ khi chưa có cache (lần đầu hoặc sau invalidate), tránh nhấp nháy khi đổi trang nhờ keepPreviousData */
  const showSkeleton = usersQuery.isLoading && usersQuery.data === undefined;

  useEffect(() => {
    setPage(0);
  }, [filterRole, debouncedSearch]);

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
      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await usersQuery.refetch();
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
      if (selectedUser?.id === user.id) setSelectedUser(updated);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await usersQuery.refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại',
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await userManagementService.resetPassword(userId);
      showToast({ type: 'success', message: 'Mật khẩu mới đã được gửi đến email của người dùng' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!globalThis.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) return;
    try {
      await userManagementService.deleteUser(userId);
      if (selectedUser?.id === userId) setSelectedUser(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await usersQuery.refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Xóa tài khoản thất bại',
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailForm.subject || !emailForm.body) return;
    setEmailLoading(true);
    try {
      await userManagementService.sendEmail(selectedUser.id, emailForm);
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
      showToast({ type: 'success', message: 'Email đã được gửi thành công' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gửi email thất bại',
      });
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
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Xuất Excel thất bại',
      });
    }
  };

  const handlePageChange = (page: number) => {
    setPage(page);
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
            <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
              {/* Header — TeacherMindmaps pattern */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
                    <Users className="w-5 h-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0 leading-tight">
                        Quản lý người dùng
                      </h1>
                      {!showSkeleton && !error && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                          {pagination.totalItems}
                        </span>
                      )}
                    </div>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 m-0">
                      {stats.active} đang hoạt động • {stats.teachers} giáo viên • {stats.students} học
                      sinh
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 shrink-0"
                >
                  Thêm người dùng <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>

              {/* Stats — same tile grid as /teacher/mindmaps */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {(
                  [
                    {
                      label: 'Tổng người dùng',
                      value: showSkeleton ? '…' : stats.total,
                      Icon: Users,
                      bg: 'bg-[#EEF2FF]',
                      color: 'text-[#4F7EF7]',
                    },
                    {
                      label: 'Admin',
                      value: showSkeleton ? '…' : stats.admins,
                      Icon: Settings,
                      bg: 'bg-[#F5F3FF]',
                      color: 'text-[#9B6FE0]',
                    },
                    {
                      label: 'Giáo viên',
                      value: showSkeleton ? '…' : stats.teachers,
                      Icon: BookOpen,
                      bg: 'bg-[#ECFDF5]',
                      color: 'text-[#2EAD7A]',
                    },
                    {
                      label: 'Học sinh',
                      value: showSkeleton ? '…' : stats.students,
                      Icon: GraduationCap,
                      bg: 'bg-[#FFF7ED]',
                      color: 'text-[#E07B39]',
                    },
                    {
                      label: 'Đang hoạt động',
                      value: showSkeleton ? '…' : stats.active,
                      Icon: CheckCircle2,
                      bg: 'bg-[#F5F4ED]',
                      color: 'text-[#8B7355]',
                    },
                  ] as const
                ).map(({ label, value, Icon, bg, color }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.06)_0px_8px_28px] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                        {value}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 leading-snug">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toolbar — segmented control + search (TeacherMindmaps) */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2 order-2 xl:order-1">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl">
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
                        className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                          filterRole === id
                            ? 'bg-white text-[#141413] shadow-sm'
                            : 'text-[#87867F] hover:text-[#5E5D59]'
                        }`}
                        onClick={() => setFilterRole(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] hover:bg-[#FAF9F5] transition-colors shadow-[rgba(0,0,0,0.03)_0px_2px_8px]"
                  >
                    <Download className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                    Xuất Excel
                  </button>
                </div>

                <label className="relative flex w-full xl:max-w-md items-center gap-3 bg-white border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150 shadow-[rgba(0,0,0,0.03)_0px_2px_12px] order-1 xl:order-2">
                  <Search
                    className="text-[#87867F] w-4 h-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    type="search"
                    className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                    placeholder="Tìm theo tên, email, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Tìm người dùng"
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearchTerm('')}
                      className="text-[#87867F] hover:text-[#141413] transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  ) : null}
                  {isFetching ? (
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 text-[#87867F] pointer-events-none flex items-center ${searchTerm ? 'right-10' : 'right-3'}`}
                      aria-hidden
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </span>
                  ) : null}
                </label>
              </div>

              {/* Summary bar */}
              {!showSkeleton && !error && users.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                  <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                    Hiển thị
                  </span>
                  <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                    {users.length} / {pagination.totalItems}
                  </strong>
                  <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" aria-hidden />
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F7EF7] inline-block" aria-hidden />
                    Trang{' '}
                    <strong className="text-[#141413] font-semibold">
                      {pagination.page + 1} / {Math.max(1, pagination.totalPages)}
                    </strong>
                  </span>
                </div>
              )}

              {showSkeleton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-14 px-4 rounded-2xl border border-[#F0EEE6] bg-[#FAF9F5]">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 mb-3">
                    <AlertCircle className="w-6 h-6" strokeWidth={2} aria-hidden />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center m-0">
                    {error}
                  </p>
                </div>
              )}

              {!showSkeleton && !error && (
                <div className="rounded-2xl border border-[#E8E6DC] bg-white shadow-[rgba(0,0,0,0.04)_0px_4px_24px] overflow-hidden admin-mgmt-table-shell">
                  <div className="overflow-x-auto">
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
                  </div>
                </div>
              )}

              {/* Pagination */}
              {!showSkeleton && !error && pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className="min-h-9 px-3 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    disabled={pagination.page === 0}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`min-w-9 min-h-9 rounded-xl border font-[Be_Vietnam_Pro] text-[13px] font-semibold transition-colors ${
                          pagination.page === i
                            ? 'bg-[#141413] border-[#141413] text-[#FAF9F5]'
                            : 'border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#FAF9F5]'
                        }`}
                        onClick={() => handlePageChange(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {pagination.totalPages > 10 && (
                      <span className="px-1 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                        …
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="min-h-9 px-3 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    disabled={pagination.page >= pagination.totalPages - 1}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>

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
                            onChange={(e) =>
                              setCreateForm((f) => ({ ...f, fullName: e.target.value }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="create-username">Tên đăng nhập *</label>
                          <input
                            id="create-username"
                            type="text"
                            placeholder="Không dấu, không khoảng trắng"
                            value={createForm.userName}
                            onChange={(e) =>
                              setCreateForm((f) => ({ ...f, userName: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setCreateForm((f) => ({ ...f, email: e.target.value }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="create-password">Mật khẩu tạm thời *</label>
                          <input
                            id="create-password"
                            type="password"
                            placeholder="≥8 ký tự, chữ hoa + số + ký tự đặc biệt"
                            value={createForm.password}
                            onChange={(e) =>
                              setCreateForm((f) => ({ ...f, password: e.target.value }))
                            }
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
                <dialog className="modal modal--user-detail" open>
                  {/* Close button — floating top-right */}
                  <button
                    className="modal-close modal-close--floating"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* ── Hero Banner ── */}
                  <div className="ud-hero">
                    <div className="ud-hero__banner" aria-hidden="true" />
                    <div className="ud-hero__avatar">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="ud-hero__initial">
                          {(selectedUser.fullName ?? '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Identity ── */}
                  <div className="ud-identity">
                    <div className="ud-identity__badges">
                      <span className={`role-badge ${getRoleBadgeClass(selectedUser.roles)}`}>
                        {getRoleLabel(selectedUser.roles)}
                      </span>
                      <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                    <h3 className="ud-identity__name">{selectedUser.fullName}</h3>
                    <div className="ud-identity__handle">@{selectedUser.userName}</div>
                    <div className="ud-identity__email">
                      <Mail size={13} aria-hidden />
                      {selectedUser.email}
                    </div>
                  </div>

                  {/* ── Stats Strip ── */}
                  <div className="ud-stats">
                    <div className="ud-stat">
                      <div className="ud-stat__icon">
                        <Calendar size={15} aria-hidden />
                      </div>
                      <div className="ud-stat__label">Ngày tham gia</div>
                      <div className="ud-stat__value">
                        {new Date(selectedUser.createdDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className="ud-stat-divider" aria-hidden="true" />
                    <div className="ud-stat">
                      <div className="ud-stat__icon">
                        <Clock size={15} aria-hidden />
                      </div>
                      <div className="ud-stat__label">Đăng nhập gần đây</div>
                      <div className="ud-stat__value">
                        {selectedUser.lastLogin
                          ? new Date(selectedUser.lastLogin).toLocaleDateString('vi-VN')
                          : '\u2014'}
                      </div>
                    </div>
                    <div className="ud-stat-divider" aria-hidden="true" />
                    <div className="ud-stat">
                      <div className="ud-stat__icon">
                        <CheckCircle2 size={15} aria-hidden />
                      </div>
                      <div className="ud-stat__label">Trạng thái</div>
                      <div className="ud-stat__value">
                        <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                          {getStatusLabel(selectedUser.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="ud-actions">
                    <div className="ud-actions__label">Hành động quản lý</div>
                    <div className="ud-actions__grid">
                      <button
                        className="ud-action-btn ud-action-btn--default"
                        onClick={() => handleResetPassword(selectedUser.id)}
                      >
                        <KeyRound size={15} aria-hidden />
                        Đặt lại mật khẩu
                      </button>
                      <button
                        className="ud-action-btn ud-action-btn--default"
                        onClick={() => setShowEmailModal(true)}
                      >
                        <Mail size={15} aria-hidden />
                        Gửi email
                      </button>
                      {(selectedUser.status === 'ACTIVE' || selectedUser.status === 'INACTIVE') && (
                        <button
                          className={`ud-action-btn ${selectedUser.status === 'ACTIVE' ? 'ud-action-btn--warn' : 'ud-action-btn--success'}`}
                          onClick={() => handleToggleStatus(selectedUser)}
                        >
                          {selectedUser.status === 'ACTIVE' ? (
                            <ShieldOff size={15} aria-hidden />
                          ) : (
                            <ShieldCheck size={15} aria-hidden />
                          )}
                          {selectedUser.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                        </button>
                      )}
                      <button
                        className="ud-action-btn ud-action-btn--danger"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                      >
                        <Trash2 size={15} aria-hidden />
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>

                  {/* ── Footer ── */}
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
