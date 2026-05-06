import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { SubscriptionPlanCard } from '../../components/SubscriptionPlanCard';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import {
  SubscriptionPlanService,
  formatPrice,
  planSlugToBadgeClass,
  type BillingCycle,
  type CreatePlanPayload,
  type PlanStatus,
  type RevenueStats,
  type SubscriptionPlan,
  type UpdatePlanPayload,
  type UserSubscription,
} from '../../services/api/subscription-plan.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-finance-studio.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './SubscriptionManagement.css';

const BILLING_CYCLE_OPTIONS: { label: string; value: BillingCycle }[] = [
  { label: '1 tháng', value: 'MONTH' },
  { label: '3 tháng', value: 'THREE_MONTHS' },
  { label: '6 tháng', value: 'SIX_MONTHS' },
  { label: '1 năm', value: 'YEAR' },
  { label: 'Mãi mãi (Miễn phí)', value: 'FOREVER' },
  { label: 'Tuỳ chỉnh (Doanh nghiệp)', value: 'CUSTOM' },
];

const INITIAL_CREATE_FORM: CreatePlanPayload = {
  name: '',
  description: '',
  price: 0,
  billingCycle: 'MONTH',
  tokenQuota: 0,
  features: [],
  featured: false,
  isPublic: true,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const SubscriptionManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ── Plans state ─────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // ── Revenue stats state ──────────────────────────────────────────────────────
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Subscriptions table state ────────────────────────────────────────────────
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subsPage, setSubsPage] = useState(0); // 0-indexed per BE
  const [subsTotalPages, setSubsTotalPages] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Create form state ────────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState<CreatePlanPayload>(INITIAL_CREATE_FORM);
  const [featuresText, setFeaturesText] = useState('');
  const [priceIsContact, setPriceIsContact] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Edit form state ─────────────────────────────────────────────────────────
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editForm, setEditForm] = useState<UpdatePlanPayload>({});
  const [editFeaturesText, setEditFeaturesText] = useState('');
  const [editPriceIsContact, setEditPriceIsContact] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Delete state ─────────────────────────────────────────────────────────────
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await SubscriptionPlanService.getPlans();
      setPlans(res.result);
    } catch (err: unknown) {
      setPlansError(err instanceof Error ? err.message : 'Không thể tải danh sách gói.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await SubscriptionPlanService.getStats();
      setRevenueStats(res.result);
    } catch {
      // Stats failure is non-blocking; keep null
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async (page: number) => {
    setSubsLoading(true);
    setSubsError(null);
    try {
      const res = await SubscriptionPlanService.getSubscriptions({ page, size: 10 });
      setSubscriptions(res.result.content);
      setSubsTotalPages(res.result.totalPages);
    } catch (err: unknown) {
      setSubsError(err instanceof Error ? err.message : 'Không thể tải danh sách đăng ký.');
    } finally {
      setSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, [fetchPlans, fetchStats]);

  useEffect(() => {
    fetchSubscriptions(subsPage);
  }, [subsPage, fetchSubscriptions]);

  // ── Create plan handler ──────────────────────────────────────────────────────
  const handleCreateSubmit = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Tên gói không được để trống.');
      return;
    }
    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    if (features.length === 0) {
      setCreateError('Vui lòng nhập ít nhất 1 tính năng.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await SubscriptionPlanService.createPlan({
        ...createForm,
        price: priceIsContact ? null : createForm.price,
        features,
      });
      setShowCreateModal(false);
      setCreateForm(INITIAL_CREATE_FORM);
      setFeaturesText('');
      setPriceIsContact(false);
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      fetchPlans();
    } catch (err: unknown) {
      const e = err as Error & { code?: number };
      if (e.code === 1155) {
        setCreateError('Tên gói đã tồn tại, vui lòng chọn tên khác.');
      } else {
        setCreateError(e.message || 'Tạo gói thất bại. Vui lòng thử lại.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Open edit modal (pre-fill form from plan) ─────────────────────────────────
  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditPriceIsContact(plan.price === null);
    setEditFeaturesText(plan.features.join('\n'));
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      tokenQuota: plan.tokenQuota,
      featured: plan.featured,
      isPublic: plan.isPublic,
      status: plan.status,
    });
    setEditError(null);
  };

  // ── Edit plan handler ─────────────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!editingPlan) return;
    if (!editForm.name?.trim()) {
      setEditError('Tên gói không được để trống.');
      return;
    }
    const features = editFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
    if (features.length === 0) {
      setEditError('Vui lòng nhập ít nhất 1 tính năng.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await SubscriptionPlanService.updatePlan(editingPlan.id, {
        ...editForm,
        price: editPriceIsContact ? null : editForm.price,
        features,
      });
      setEditingPlan(null);
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      fetchPlans();
    } catch (err: unknown) {
      const e = err as Error & { code?: number };
      if (e.code === 1155) {
        setEditError('Tên gói đã tồn tại, vui lòng chọn tên khác.');
      } else {
        setEditError(e.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete plan handler ──────────────────────────────────────────────────────
  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Xóa gói "${plan.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingPlanId(plan.id);
    try {
      await SubscriptionPlanService.deletePlan(plan.id);
      setSelectedPlan(null);
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      fetchPlans();
    } catch (err: unknown) {
      const e = err as Error & { code?: number };
      if (e.code === 1156) {
        showToast({
          type: 'error',
          message:
            'Không thể xóa gói này vì vẫn còn người dùng đang sử dụng.\nHãy vô hiệu hóa gói trước (Chỉnh sửa → Status: INACTIVE), sau khi toàn bộ đăng ký hết hạn mới có thể xóa.',
        });
      } else {
        showToast({ type: 'error', message: e.message || 'Xóa thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setDeletingPlanId(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar!, role: 'admin' }}
      notificationCount={8}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="subscription-management-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <h2 className="page-title" style={{ margin: 0 }}>
                Gói đăng ký
              </h2>
              <p className="page-subtitle header-sub">Quản lý các gói đăng ký và doanh thu</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} aria-hidden />
              Tạo gói mới
            </button>
          </header>

          {/* Revenue Stats */}
          <div className="revenue-stats">
            <div className="stat-card highlight">
              <div className="stat-icon">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {statsLoading
                    ? '...'
                    : revenueStats
                      ? formatCurrency(revenueStats.totalRevenue)
                      : '—'}
                </div>
                <div className="stat-label">Tổng doanh thu</div>
                {revenueStats && (
                  <div
                    className={`stat-trend ${revenueStats.totalRevenueTrend >= 0 ? 'positive' : 'negative'}`}
                  >
                    {revenueStats.totalRevenueTrend >= 0 ? '+' : ''}
                    {revenueStats.totalRevenueTrend.toFixed(1)}% so với tháng trước
                  </div>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {statsLoading ? '...' : revenueStats ? revenueStats.totalPaidUsers : '—'}
                </div>
                <div className="stat-label">Người dùng trả phí</div>
                {revenueStats && (
                  <div
                    className={`stat-trend ${revenueStats.totalPaidUsersTrend >= 0 ? 'positive' : 'negative'}`}
                  >
                    {revenueStats.totalPaidUsersTrend >= 0 ? '+' : ''}
                    {revenueStats.totalPaidUsersTrend.toFixed(1)}% so với tháng trước
                  </div>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <BarChart2 size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {statsLoading
                    ? '...'
                    : revenueStats
                      ? formatCurrency(revenueStats.avgRevenuePerUser)
                      : '—'}
                </div>
                <div className="stat-label">Doanh thu TB/người</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {statsLoading
                    ? '...'
                    : revenueStats
                      ? `${revenueStats.conversionRate.toFixed(1)}%`
                      : '—'}
                </div>
                <div className="stat-label">Tỷ lệ chuyển đổi</div>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="plans-section">
            <h2 className="section-title">Các gói đăng ký</h2>

            {plansError && (
              <div className="error-banner">
                <AlertTriangle size={14} />
                {plansError}
                <button onClick={fetchPlans}>Thử lại</button>
              </div>
            )}

            {plansLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-72 animate-pulse"
                  />
                ))}
              </div>
            ) : plans.length === 0 && !plansError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                  Chưa có gói đăng ký nào. Hãy tạo gói đầu tiên!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4 items-start">
                {plans.map((plan, idx) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    featured={plan.featured}
                    index={idx}
                    meta={
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-medium ${
                            plan.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-[#F5F4ED] text-[#87867F]'
                          }`}
                        >
                          {plan.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        {!plan.isPublic && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F]">
                            Ẩn
                          </span>
                        )}
                      </div>
                    }
                    actions={
                      <div className="flex items-center gap-2">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye size={13} />
                          Chi tiết
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                          onClick={() => openEditModal(plan)}
                        >
                          <Pencil size={13} />
                          Sửa
                        </button>
                        <button
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDeletePlan(plan)}
                          disabled={deletingPlanId === plan.id}
                        >
                          {deletingPlanId === plan.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Subscriptions */}
          <div className="recent-subscriptions">
            <h2 className="section-title">Đăng ký gần đây</h2>

            {subsError && (
              <div className="error-banner">
                <AlertTriangle size={14} />
                {subsError}
                <button onClick={() => fetchSubscriptions(subsPage)}>Thử lại</button>
              </div>
            )}

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
                  {subsLoading ? (
                    <tr>
                      <td colSpan={7} className="table-loading">
                        Đang tải...
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        Không có đăng ký nào.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td className="user-cell">
                          <div className="user-avatar">{sub.user.name.charAt(0).toUpperCase()}</div>
                          <div className="user-info">
                            <div className="user-name">{sub.user.name}</div>
                            <div className="user-email">{sub.user.email}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`plan-badge ${planSlugToBadgeClass(sub.plan.slug)}`}>
                            {sub.plan.name}
                          </span>
                        </td>
                        <td>{new Date(sub.startDate).toLocaleDateString('vi-VN')}</td>
                        <td>
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="amount-cell">{formatPrice(sub.amount)}</td>
                        <td>
                          <span className={`status-badge ${sub.status.toLowerCase()}`}>
                            {statusLabel(sub.status)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn"
                              title="Tính năng đang phát triển"
                              disabled
                            >
                              <RefreshCw size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {subsTotalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={subsPage === 0}
                  onClick={() => setSubsPage((p) => p - 1)}
                >
                  <ChevronLeft size={15} />
                  Trước
                </button>
                <span className="page-info">
                  Trang {subsPage + 1} / {subsTotalPages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={subsPage >= subsTotalPages - 1}
                  onClick={() => setSubsPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="modal-overlay" onClick={() => setEditingPlan(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Chỉnh sửa gói: {editingPlan.name}</h2>
                  <button className="modal-close" onClick={() => setEditingPlan(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="modal-body">
                  {editError && (
                    <div className="form-error">
                      <AlertTriangle size={14} />
                      {editError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Tên gói *</label>
                    <input
                      type="text"
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      rows={3}
                      value={editForm.description ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Giá (VNĐ)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          disabled={editPriceIsContact}
                          value={editPriceIsContact ? '' : (editForm.price ?? 0)}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
                          }
                        />
                        <label style={{ whiteSpace: 'nowrap', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            checked={editPriceIsContact}
                            onChange={(e) => setEditPriceIsContact(e.target.checked)}
                            style={{ marginRight: '4px' }}
                          />
                          Liên hệ
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Thời hạn</label>
                      <select
                        value={editForm.billingCycle ?? 'MONTH'}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            billingCycle: e.target.value as BillingCycle,
                          }))
                        }
                      >
                        {BILLING_CYCLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Token quota</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.tokenQuota ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            tokenQuota: Math.max(0, Number(e.target.value || 0)),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      value={editForm.status ?? 'ACTIVE'}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, status: e.target.value as PlanStatus }))
                      }
                    >
                      <option value="ACTIVE">ACTIVE — Đang hoạt động</option>
                      <option value="INACTIVE">INACTIVE — Vô hiệu hóa</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tính năng (mỗi tính năng 1 dòng) *</label>
                    <textarea
                      rows={6}
                      value={editFeaturesText}
                      onChange={(e) => setEditFeaturesText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.featured ?? false}
                        onChange={(e) => setEditForm((f) => ({ ...f, featured: e.target.checked }))}
                      />
                      <span>Đặt làm gói nổi bật</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.isPublic ?? true}
                        onChange={(e) => setEditForm((f) => ({ ...f, isPublic: e.target.checked }))}
                      />
                      <span>Hiển thị trên trang chính</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-outline"
                    onClick={() => setEditingPlan(null)}
                    disabled={editLoading}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleEditSubmit}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Plan Modal */}
          {showCreateModal && (
            <div
              className="modal-overlay"
              onClick={() => {
                setShowCreateModal(false);
                setCreateError(null);
              }}
            >
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Tạo gói đăng ký mới</h2>
                  <button
                    className="modal-close"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="modal-body">
                  {createError && (
                    <div className="form-error">
                      <AlertTriangle size={14} />
                      {createError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Tên gói *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Premium"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả ngắn về gói đăng ký"
                      value={createForm.description ?? ''}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Giá (VNĐ) *</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          placeholder="0"
                          disabled={priceIsContact}
                          value={priceIsContact ? '' : (createForm.price ?? 0)}
                          onChange={(e) =>
                            setCreateForm((f) => ({ ...f, price: Number(e.target.value) }))
                          }
                        />
                        <label style={{ whiteSpace: 'nowrap', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            checked={priceIsContact}
                            onChange={(e) => setPriceIsContact(e.target.checked)}
                            style={{ marginRight: '4px' }}
                          />
                          Liên hệ
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Thời hạn *</label>
                      <select
                        value={createForm.billingCycle}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            billingCycle: e.target.value as BillingCycle,
                          }))
                        }
                      >
                        {BILLING_CYCLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Token quota *</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={createForm.tokenQuota}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            tokenQuota: Math.max(0, Number(e.target.value || 0)),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tính năng (mỗi tính năng 1 dòng) *</label>
                    <textarea
                      rows={6}
                      placeholder="Nhập các tính năng, mỗi dòng 1 tính năng&#10;Ví dụ:&#10;Tạo không giới hạn Giáo Trình&#10;AI trợ giảng 24/7&#10;Thống kê chi tiết"
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={createForm.featured ?? false}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, featured: e.target.checked }))
                        }
                      />
                      <span>Đặt làm gói nổi bật</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={createForm.isPublic ?? true}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, isPublic: e.target.checked }))
                        }
                      />
                      <span>Hiển thị trên trang chính</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                    }}
                    disabled={createLoading}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateSubmit}
                    disabled={createLoading}
                  >
                    {createLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Tạo gói
                      </>
                    )}
                  </button>
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
                    <X size={16} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="plan-detail-header">
                    <div className="detail-price">
                      <span className="price-amount">{formatPrice(selectedPlan.price)}</span>
                      {selectedPlan.price !== null && (
                        <span className="price-period">
                          /{selectedPlan.billingCycle === 'YEAR' ? 'năm' : 'tháng'}
                        </span>
                      )}
                    </div>
                    <p>{selectedPlan.description}</p>
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '0.85rem',
                        color: '#87867f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        Slug: <code>{selectedPlan.slug}</code>
                      </span>
                      <span>|</span>
                      <span>
                        Trạng thái: <strong>{selectedPlan.status}</strong>
                      </span>
                      <span>|</span>
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {selectedPlan.featured ? (
                          <>
                            <Star size={12} style={{ color: '#c96442' }} /> Gói nổi bật
                          </>
                        ) : (
                          'Gói thường'
                        )}
                      </span>
                      <span>|</span>
                      <span>
                        Token quota: <strong>{selectedPlan.tokenQuota}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="plan-features-full">
                    <h4>Danh sách tính năng đầy đủ:</h4>
                    <ul>
                      {selectedPlan.features.map((feature, i) => (
                        <li key={i}>
                          <CheckCircle2 size={14} className="feature-icon" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="plan-actions-section">
                    <h4>Hành động quản lý</h4>
                    <div className="action-buttons-grid">
                      <button
                        className="btn btn-outline btn-danger"
                        onClick={() => handleDeletePlan(selectedPlan)}
                        disabled={deletingPlanId === selectedPlan.id}
                      >
                        {deletingPlanId === selectedPlan.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Đang xóa...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} /> Xóa gói
                          </>
                        )}
                      </button>
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
      </AdminFinanceStudioShell>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
