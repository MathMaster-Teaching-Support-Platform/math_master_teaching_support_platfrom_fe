import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BookOpen,
  ChevronRight,
  Circle,
  DollarSign,
  Download,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import {
  AdminDashboardService,
  type AdminUserInfo,
  type DashboardStats,
  type RecentUser,
  type SystemService,
} from '../../../services/api/admin-dashboard.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';

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
      const [myInfo, unread, stats, users, pending, sysStatus] = await Promise.allSettled([
        AdminDashboardService.getMyInfo(),
        AdminDashboardService.getUnreadNotificationCount(),
        AdminDashboardService.getDashboardStats(),
        AdminDashboardService.getRecentUsers(0, 10),
        TeacherProfileService.countPendingProfiles(),
        AdminDashboardService.getSystemStatus(),
      ]);

      const data: {
        adminUser: AdminUserInfo | null;
        notificationCount: number;
        dashboardStats: DashboardStats | null;
        recentUsers: RecentUser[];
        pendingProfiles: number;
        systemServices: SystemService[];
        fetchError: string | null;
      } = {
        adminUser: null,
        notificationCount: 0,
        dashboardStats: null,
        recentUsers: [],
        pendingProfiles: 0,
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
          bg: 'bg-[#EEF2FF]',
          color: 'text-[#4F7EF7]',
        },
        {
          Icon: DollarSign,
          label: 'Doanh thu tháng',
          value: formatRevenue(dashboardStats.monthlyRevenue),
          trend: formatGrowth(dashboardStats.monthlyRevenueGrowthPercent),
          trendPositive: dashboardStats.monthlyRevenueGrowthPercent >= 0,
          bg: 'bg-[#ECFDF5]',
          color: 'text-[#2EAD7A]',
        },
        {
          Icon: BookOpen,
          label: 'Enrollment hoạt động',
          value: dashboardStats.activeEnrollments.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.activeEnrollmentsGrowthPercent),
          trendPositive: dashboardStats.activeEnrollmentsGrowthPercent >= 0,
          bg: 'bg-[#FFF7ED]',
          color: 'text-[#E07B39]',
        },
        {
          Icon: BarChart2,
          label: 'Giao dịch',
          value: dashboardStats.totalTransactions.toLocaleString('vi-VN'),
          trend: formatGrowth(dashboardStats.totalTransactionsGrowthPercent),
          trendPositive: dashboardStats.totalTransactionsGrowthPercent >= 0,
          bg: 'bg-[#F5F3FF]',
          color: 'text-[#9B6FE0]',
        },
      ]
    : [];

  const getUserStatusLabel = (status: RecentUser['status']): string => {
    if (status === 'ACTIVE') return 'Hoạt động';
    if (status === 'INACTIVE') return 'Không hoạt động';
    if (status === 'BANNED') return 'Bị cấm';
    return 'Đã xóa';
  };

  const getUserStatusClass = (status: RecentUser['status']) => {
    if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
    if (status === 'BANNED') return 'bg-red-50 text-red-700';
    return 'bg-[#F5F4ED] text-[#87867F]';
  };

  const getServiceClass = (status: SystemService['status']) => {
    if (status === 'active') return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
    if (status === 'warning') return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' };
    return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' };
  };

  const getServiceLabel = (status: SystemService['status']) => {
    if (status === 'active') return 'Hoạt động';
    if (status === 'warning') return 'Chậm';
    return 'Lỗi';
  };

  const renderUsersTable = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
          Đang tải...
        </div>
      );
    if (recentUsers.length === 0)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
          Chưa có người dùng nào.
        </div>
      );
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Tên
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Vai trò
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Ngày tham gia
              </th>
              <th className="text-left px-5 py-3 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide text-[#87867F]">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#F0EEE6] hover:bg-[#FAF9F5]/80 transition-colors duration-150"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFF7ED] text-[#C96442] flex items-center justify-center font-[Playfair_Display] font-semibold text-[14px] shrink-0">
                      {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                        {user.fullName ?? '—'}
                      </div>
                      <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${
                      (user.roles[0] ?? '').toUpperCase() === 'TEACHER'
                        ? 'bg-[#FFF7ED] text-[#C96442]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    {(user.roles[0] ?? '').toUpperCase() === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                  {new Date(user.createdDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${getUserStatusClass(user.status)}`}
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

  const renderSystemStatus = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
          Đang tải...
        </div>
      );
    if (systemServices.length === 0)
      return (
        <div className="flex items-center justify-center py-12 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
          Không có dữ liệu trạng thái.
        </div>
      );
    return (
      <div className="divide-y divide-[#F0EEE6]">
        {systemServices.map((service) => (
          <div key={service.name} className="flex items-center gap-4 px-5 py-3.5">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getServiceClass(service.status).dot}`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413]">
                {service.name}
              </div>
              <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                {service.description}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-semibold ${getServiceClass(service.status).badge}`}
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
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {fetchError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 font-[Be_Vietnam_Pro] text-[13px] font-medium text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              {fetchError}
            </div>
          )}

          {/* Header — aligned with /teacher/mindmaps */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Admin Dashboard
                  </h1>
                  {!loading && dashboardStats && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {dashboardStats.totalUsers.toLocaleString('vi-VN')} người dùng
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  Tổng quan quản trị hệ thống MathMaster
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất báo cáo
            </button>
          </div>

          {/* Stats — same card rhythm as TeacherMindmaps */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loading || statsCards.length === 0
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#E8E6DC]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-16 bg-[#E8E6DC] rounded" />
                      <div className="h-3 w-24 bg-[#F0EEE6] rounded" />
                    </div>
                  </div>
                ))
              : statsCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3 hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-shadow duration-200"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
                    >
                      <stat.Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none tabular-nums truncate">
                        {stat.value}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 truncate">
                        {stat.label}
                      </p>
                      <p
                        className={`font-[Be_Vietnam_Pro] text-[11px] font-medium mt-1 flex items-center gap-1 ${stat.trendPositive ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        {stat.trend} vs tháng trước
                      </p>
                    </div>
                  </div>
                ))}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] overflow-hidden shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                Người dùng mới
              </h2>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#C96442] hover:text-[#A95536] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96442] rounded"
              >
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {renderUsersTable()}
          </div>

          {/* Teacher profile review */}
          <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#C96442] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                  Duyệt Profile Giáo Viên
                </h2>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  Có{' '}
                  <span className="font-semibold text-[#141413]">{pendingProfiles}</span> giáo viên
                  đang chờ xác minh danh tính và bằng cấp.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {pendingProfiles > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-[Be_Vietnam_Pro] text-[11px] font-semibold">
                  <Circle className="w-1.5 h-1.5 fill-current" />
                  {pendingProfiles} chờ duyệt
                </span>
              )}
              <Link
                to="/admin/review-profiles"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96442] focus-visible:ring-offset-2"
              >
                Duyệt ngay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] overflow-hidden shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <h2 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                Trạng thái hệ thống
              </h2>
            </div>
            {renderSystemStatus()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
