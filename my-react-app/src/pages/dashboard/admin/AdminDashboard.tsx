import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
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
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', 'overview'],
    queryFn: async () => {
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

      const data: {
        adminUser: AdminUserInfo | null;
        notificationCount: number;
        dashboardStats: DashboardStats | null;
        recentUsers: RecentUser[];
        pendingProfiles: number;
        transactions: AdminTransaction[];
        revenueMonthly: MonthlyRevenue[];
        quickStats: QuickStats | null;
        systemServices: SystemService[];
        fetchError: string | null;
      } = {
        adminUser: null,
        notificationCount: 0,
        dashboardStats: null,
        recentUsers: [],
        pendingProfiles: 0,
        transactions: [],
        revenueMonthly: [],
        quickStats: null,
        systemServices: [],
        fetchError: null,
      };

      applyApiResult(myInfo, (val) => {
        data.adminUser = val;
      });
      if (unread.status === 'fulfilled') data.notificationCount = unread.value;
      applyApiResult(stats, (val) => {
        data.dashboardStats = val;
      });
      if (stats.status === 'rejected') data.fetchError = 'Không thể tải thống kê tổng quan.';
      applyApiResult(users, (page) => {
        data.recentUsers = page.content ?? [];
      });
      applyApiResult(pending, (val) => {
        data.pendingProfiles = val;
      });
      applyApiResult(txns, (page) => {
        data.transactions = page.content ?? [];
      });
      applyApiResult(revenue, (val) => {
        data.revenueMonthly = val.monthly;
      });
      applyApiResult(quick, (val) => {
        data.quickStats = val;
      });
      applyApiResult(sysStatus, (val) => {
        data.systemServices = val.services;
      });

      return data;
    },
    staleTime: 30_000,
  });
  const loading = dashboardQuery.isLoading;
  const fetchError = dashboardQuery.data?.fetchError ?? null;
  const adminUser = dashboardQuery.data?.adminUser ?? null;
  const notificationCount = dashboardQuery.data?.notificationCount ?? 0;
  const dashboardStats = dashboardQuery.data?.dashboardStats ?? null;
  const recentUsers = dashboardQuery.data?.recentUsers ?? [];
  const pendingProfiles = dashboardQuery.data?.pendingProfiles ?? 0;
  const transactions = dashboardQuery.data?.transactions ?? [];
  const revenueMonthly = dashboardQuery.data?.revenueMonthly ?? [];
  const quickStats = dashboardQuery.data?.quickStats ?? null;
  const systemServices = dashboardQuery.data?.systemServices ?? [];

  const formatRevenue = (amount: number): string => {
    if (amount >= 1_000_000) return `₫${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₫${(amount / 1_000).toFixed(0)}K`;
    return `₫${amount.toLocaleString('vi-VN')}`;
  };

  const formatGrowth = (pct: number): string => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

  const statsCards = dashboardStats
    ? [
        {
          Icon: Users,
          label: 'Tổng người dùng',
          value: dashboardStats.totalUsers.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.totalUsersGrowthPercent),
          trendPositive: dashboardStats.totalUsersGrowthPercent >= 0,
          iconBg: 'bg-[#FDF1EC]',
          iconColor: 'text-[#A95536]',
        },
        {
          Icon: DollarSign,
          label: 'Doanh thu tháng',
          value: formatRevenue(dashboardStats.monthlyRevenue),
          trend: formatGrowth(dashboardStats.monthlyRevenueGrowthPercent),
          trendPositive: dashboardStats.monthlyRevenueGrowthPercent >= 0,
          iconBg: 'bg-[#F0FDF4]',
          iconColor: 'text-[#16A34A]',
        },
        {
          Icon: BookOpen,
          label: 'Enrollment hoạt động',
          value: dashboardStats.activeEnrollments.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.activeEnrollmentsGrowthPercent),
          trendPositive: dashboardStats.activeEnrollmentsGrowthPercent >= 0,
          iconBg: 'bg-[#FEF3E8]',
          iconColor: 'text-[#A16207]',
        },
        {
          Icon: BarChart2,
          label: 'Giao dịch',
          value: dashboardStats.totalTransactions.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.totalTransactionsGrowthPercent),
          trendPositive: dashboardStats.totalTransactionsGrowthPercent >= 0,
          iconBg: 'bg-[#FFFBEB]',
          iconColor: 'text-[#D97706]',
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

  const getUserStatusClass = (status: RecentUser['status']) => {
    if (status === 'ACTIVE') return 'bg-[#F0FDF4] text-[#166534]';
    if (status === 'BANNED') return 'bg-[#FEF2F2] text-[#991B1B]';
    return 'bg-[#F5F4ED] text-[#6B7280]';
  };

  const getTransactionStatusClass = (status: AdminTransaction['status']) => {
    if (status === 'completed') return 'bg-[#F0FDF4] text-[#166534]';
    if (status === 'pending') return 'bg-[#FFFBEB] text-[#92400E]';
    return 'bg-[#FEF2F2] text-[#991B1B]';
  };

  const getTransactionStatusIcon = (status: AdminTransaction['status']) => {
    if (status === 'completed') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'pending') return <Clock className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getServiceClass = (status: SystemService['status']) => {
    if (status === 'active') return { dot: 'bg-[#16A34A]', badge: 'bg-[#F0FDF4] text-[#166534]' };
    if (status === 'warning') return { dot: 'bg-[#D97706]', badge: 'bg-[#FFFBEB] text-[#92400E]' };
    return { dot: 'bg-[#DC2626]', badge: 'bg-[#FEF2F2] text-[#991B1B]' };
  };

  const getServiceLabel = (status: SystemService['status']) => {
    if (status === 'active') return 'Hoạt động';
    if (status === 'warning') return 'Chậm';
    return 'Lỗi';
  };

  const renderUsersTable = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Đang tải...
        </div>
      );
    if (recentUsers.length === 0)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Chưa có người dùng nào.
        </div>
      );
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E8E6DC]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
                Tên
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
                Vai trò
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
                Ngày tham gia
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#F1EFE7] hover:bg-[#FAF9F5] transition-colors duration-150"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FDF1EC] text-[#A95536] flex items-center justify-center font-bold text-[14px] shrink-0">
                      {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0D0F1A]">
                        {user.fullName ?? '—'}
                      </div>
                      <div className="text-[12px] text-[#6B7280]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      (user.roles[0] ?? '').toUpperCase() === 'TEACHER'
                        ? 'bg-[#FDF1EC] text-[#A95536]'
                        : 'bg-[#F0FDF4] text-[#166534]'
                    }`}
                  >
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {(user.roles[0] ?? '').toUpperCase() === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[14px] text-[#6B7280]">
                  {new Date(user.createdDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getUserStatusClass(user.status)}`}
                  >
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {getUserStatusLabel(user.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTransactionsTable = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Đang tải...
        </div>
      );
    if (!transactions || transactions.length === 0)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Chưa có giao dịch nào.
        </div>
      );
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E8E6DC]">
              {[
                'ID',
                'Người dùng',
                'Mô tả',
                'Số tiền',
                'Phương thức',
                'Trạng thái',
                'Thời gian',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-[#F1EFE7] hover:bg-[#FAF9F5] transition-colors duration-150"
              >
                <td className="px-4 py-3 text-[13px] font-mono text-[#6B7280]">
                  {transaction.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-[14px] text-[#0D0F1A] font-medium">
                  {transaction.userName}
                </td>
                <td className="px-4 py-3 text-[14px] text-[#6B7280]">{transaction.planName}</td>
                <td className="px-4 py-3 text-[14px] font-semibold text-[#0D0F1A]">
                  {transaction.amount.toLocaleString('vi-VN')}đ
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F4ED] text-[#0D0F1A] text-[11px] font-semibold">
                    <CreditCard className="w-3 h-3" />
                    {transaction.paymentMethod === 'payos' ? 'PayOS' : transaction.paymentMethod}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getTransactionStatusClass(transaction.status)}`}
                  >
                    {getTransactionStatusIcon(transaction.status)}
                    {getTransactionStatusLabel(transaction.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#6B7280]">
                  {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#FDF1EC] hover:text-[#C96442] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2"
                    title="Chi tiết"
                    aria-label="Xem chi tiết giao dịch"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSystemStatus = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Đang tải...
        </div>
      );
    if (systemServices.length === 0)
      return (
        <div className="flex items-center justify-center py-10 text-[#6B7280] text-[14px]">
          Không có dữ liệu trạng thái.
        </div>
      );
    return (
      <div className="divide-y divide-[#F1F3F8]">
        {systemServices.map((service) => (
          <div key={service.name} className="flex items-center gap-4 px-5 py-3.5">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getServiceClass(service.status).dot}`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#0D0F1A]">{service.name}</div>
              <div className="text-[12px] text-[#6B7280]">{service.description}</div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getServiceClass(service.status).badge}`}
            >
              {getServiceLabel(service.status)}
            </span>
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
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-dashboard-page space-y-6">
        {/* Error Banner */}
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[14px] font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {fetchError}
          </div>
        )}

        {/* Header */}
        <div className="courses-header-row admin-dashboard-header">
          <div className="header-stack min-w-0">
            <span className="header-kicker">ADMIN</span>
            <h1 className="flex items-center gap-2 text-[28px] font-bold tracking-tight text-[#0D0F1A]">
              <LayoutDashboard className="h-6 w-6 text-[#C96442]" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="header-sub text-[14px] text-[#6B7280] mt-1 max-w-[72ch]">
              Tổng quan quản trị hệ thống MathMaster
            </p>
          </div>
          <button className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-[#0D0F1A] text-white text-[13px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-[#1a1d2e] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2">
            <Download className="w-3.5 h-3.5" />
            Xuất báo cáo
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading || statsCards.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 flex items-start gap-4 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F5F4ED]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-24 bg-[#F5F4ED] rounded" />
                    <div className="h-6 w-16 bg-[#F5F4ED] rounded" />
                  </div>
                </div>
              ))
            : statsCards.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 flex items-start gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200 animate-[fadeInUp_0.4s_ease_both]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0`}
                  >
                    <stat.Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">
                      {stat.label}
                    </div>
                    <div className="text-[28px] font-bold tabular-nums text-[#0D0F1A] leading-tight mt-0.5">
                      {stat.value}
                    </div>
                    <div
                      className={`text-[12px] font-medium mt-1 flex items-center gap-1 ${stat.trendPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend} so với tháng trước
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6DC]">
            <h2 className="text-[16px] font-semibold text-[#0D0F1A]">Người dùng mới</h2>
            <a
              href="/admin/users"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#C96442] hover:text-[#A95536] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2 rounded"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          {renderUsersTable()}
        </div>

        {/* Teacher Profile Review */}
        <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FDF1EC] text-[#A95536] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#0D0F1A]">Duyệt Profile Giáo Viên</h2>
              <p className="text-[14px] text-[#6B7280] mt-0.5">
                Có <span className="font-semibold text-[#0D0F1A]">{pendingProfiles}</span> giáo viên
                đang chờ xác minh danh tính và bằng cấp.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {pendingProfiles > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#92400E] text-[11px] font-semibold">
                <Circle className="w-1.5 h-1.5 fill-current" />
                {pendingProfiles} chờ duyệt
              </span>
            )}
            <a
              href="/admin/review-profiles"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D0F1A] text-white text-[13px] font-semibold hover:bg-[#1a1d2e] active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2"
            >
              Duyệt ngay <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6DC]">
            <h2 className="text-[16px] font-semibold text-[#0D0F1A]">Giao dịch gần đây</h2>
            <a
              href="/admin/transactions"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#C96442] hover:text-[#A95536] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2 rounded"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          {renderTransactionsTable()}
        </div>

        {/* Revenue + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <h2 className="text-[16px] font-semibold text-[#0D0F1A] mb-4">Doanh thu theo tháng</h2>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[#6B7280] text-[14px]">
                Đang tải...
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {(revenueMonthly.length === 12
                  ? revenueMonthly
                  : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0 }))
                ).map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-[#C96442] transition-all duration-500 hover:bg-[#A95536] min-h-[4px]"
                      style={{ height: `${Math.max((item.revenue / revenueMax) * 100, 4)}%` }}
                      title={`T${item.month}: ${formatRevenue(item.revenue)}`}
                    />
                    <span className="text-[10px] text-[#87867F] font-medium">T{item.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <h2 className="text-[16px] font-semibold text-[#0D0F1A] mb-4">Thống kê nhanh</h2>
            {loading || !quickStats ? (
              <div className="flex items-center justify-center h-40 text-[#6B7280] text-[14px]">
                Đang tải...
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    label: 'Tỷ lệ chuyển đổi',
                    value: `${quickStats.conversionRate.toFixed(1)}%`,
                    pct: Math.min(quickStats.conversionRate, 100),
                    color: '#C96442',
                  },
                  {
                    label: 'Người dùng hoạt động',
                    value: quickStats.activeUsers.toLocaleString('vi-VN'),
                    pct: Math.min(
                      (quickStats.activeUsers / (dashboardStats?.totalUsers || 1)) * 100,
                      100
                    ),
                    color: '#16A34A',
                  },
                  {
                    label: 'Tài liệu được tạo',
                    value: quickStats.documentsCreated.toLocaleString('vi-VN'),
                    pct: 100,
                    color: '#8B5E3C',
                  },
                  ...(quickStats.satisfactionRate === -1
                    ? [
                        {
                          label: 'Tỷ lệ hài lòng',
                          value: 'Chưa có dữ liệu',
                          pct: 0,
                          color: '#D97706',
                        },
                      ]
                    : [
                        {
                          label: 'Tỷ lệ hài lòng',
                          value: `${quickStats.satisfactionRate.toFixed(1)}%`,
                          pct: Math.min(quickStats.satisfactionRate, 100),
                          color: '#D97706',
                        },
                      ]),
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] text-[#6B7280]">{item.label}</span>
                      <span className="text-[13px] font-semibold text-[#0D0F1A]">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F4ED] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E6DC]">
            <h2 className="text-[16px] font-semibold text-[#0D0F1A]">Trạng thái hệ thống</h2>
          </div>
          {renderSystemStatus()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
