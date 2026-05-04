import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  BarChart2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { mockAdmin } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-finance-studio.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './AdminTransactions.css';

interface AdminTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId?: string | null;
  planName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  orderCode: string | number;
  createdAt: string;
}

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

interface TransactionsPageResult {
  items: AdminTransaction[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface TransactionStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalRevenue: number;
}

const DEFAULT_STATS: TransactionStats = {
  total: 0,
  completed: 0,
  pending: 0,
  failed: 0,
  totalRevenue: 0,
};

const extractErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json().catch(() => null);
    if (json?.message) return String(json.message);
  }
  return fallback;
};

const parseApiResponse = async <T,>(res: Response): Promise<T> => {
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok) {
    throw new Error(payload?.message || `HTTP ${res.status}`);
  }
  if (payload?.code !== 1000) {
    throw new Error(payload?.message || `Lỗi hệ thống (code: ${payload?.code ?? 'unknown'})`);
  }
  return payload.result;
};

const authHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  return {
    Authorization: `Bearer ${token}`,
    accept: '*/*',
  };
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusLabel = (s: AdminTransaction['status']): string => {
  if (s === 'completed') return 'Thành công';
  if (s === 'pending') return 'Đang xử lý';
  return 'Thất bại';
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminTransactions: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState<AdminTransaction | null>(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [search]);

  const transactionsQuery = useQuery({
    queryKey: ['admin-transactions', page, statusFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sortBy: 'createdAt',
        order: 'DESC',
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const requestUrl = `${API_BASE_URL}${API_ENDPOINTS.ADMIN_TRANSACTIONS}?${params.toString()}`;
      const res = await fetch(requestUrl, { method: 'GET', headers: authHeaders() });
      return parseApiResponse<TransactionsPageResult>(res);
    },
    staleTime: 30_000,
  });
  const statsQuery = useQuery({
    queryKey: ['admin-transactions', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_TRANSACTIONS_STATS}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      return parseApiResponse<TransactionStats>(res);
    },
    staleTime: 30_000,
  });

  const transactions = transactionsQuery.data?.items ?? [];
  const totalPages = transactionsQuery.data?.totalPages ?? 0;
  const totalItems = transactionsQuery.data?.totalItems ?? 0;
  const stats = statsQuery.data ?? DEFAULT_STATS;
  const listLoading = transactionsQuery.isLoading || transactionsQuery.isFetching;
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching;
  const listError =
    transactionsQuery.error instanceof Error ? transactionsQuery.error.message : null;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(0);
    }
  }, [page, totalPages]);

  const pageStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return page * PAGE_SIZE + 1;
  }, [page, totalItems]);

  const pageEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min((page + 1) * PAGE_SIZE, totalItems);
  }, [page, totalItems]);

  const tableRows = useMemo(() => {
    if (listLoading) {
      return (
        <tr>
          <td colSpan={8} className="txn-empty">
            Đang tải giao dịch...
          </td>
        </tr>
      );
    }

    if (listError) {
      return (
        <tr>
          <td colSpan={8} className="txn-empty">
            {listError}
          </td>
        </tr>
      );
    }

    if (transactions.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="txn-empty">
            Không tìm thấy giao dịch nào phù hợp.
          </td>
        </tr>
      );
    }

    return transactions.map((txn) => (
      <tr key={txn.id}>
        <td className="txn-order-code">{String(txn.orderCode)}</td>
        <td>
          <div className="txn-user-cell">
            <div className="txn-user-avatar">{txn.userName.charAt(0)}</div>
            <div>
              <div className="txn-user-name">{txn.userName}</div>
              <div className="txn-user-email">{txn.userEmail}</div>
            </div>
          </div>
        </td>
        <td className="txn-plan-name">{txn.planName}</td>
        <td className="txn-amount">{formatCurrency(txn.amount)}</td>
        <td>
          <span className="txn-payment-badge">
            <CreditCard size={12} /> {txn.paymentMethod}
          </span>
        </td>
        <td>
          <span className={`txn-status-badge txn-status-badge--${txn.status}`}>
            {statusLabel(txn.status)}
          </span>
        </td>
        <td className="txn-date">{formatDate(txn.createdAt)}</td>
        <td>
          <button
            className="txn-btn-detail"
            title="Xem chi tiết"
            disabled={detailLoadingId === txn.id}
            onClick={() => handleOpenDetail(txn.id)}
          >
            {detailLoadingId === txn.id ? (
              <>
                <Loader2 size={13} className="admin-finance-spin" /> Đang tải...
              </>
            ) : (
              <>
                <Eye size={13} /> Chi tiết
              </>
            )}
          </button>
        </td>
      </tr>
    ));
  }, [detailLoadingId, listError, listLoading, transactions]);

  const handleFilterChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const displayStat = (value: number): string => {
    if (statsLoading) return '...';
    return value.toLocaleString('vi-VN');
  };

  const displayRevenue = (): string => {
    if (statsLoading) return '...';
    return formatCurrency(stats.totalRevenue);
  };

  const handleRefresh = async () => {
    await Promise.all([transactionsQuery.refetch(), statsQuery.refetch()]);
  };

  const handleExportCsv = async () => {
    setExportLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_TRANSACTIONS_EXPORT}${query}`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const message = await extractErrorMessage(res, `Export thất bại (HTTP ${res.status})`);
        throw new Error(message);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const fileNameMatch = /filename="?([^"]+)"?/i.exec(disposition);
      const fileName = fileNameMatch?.[1] ?? 'transactions.csv';

      const url = globalThis.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExportLoading(false);
    }
  };

  const handleOpenDetail = async (transactionId: string) => {
    setDetailLoadingId(transactionId);

    try {
      const res = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.ADMIN_TRANSACTION_DETAIL(transactionId)}`,
        {
          method: 'GET',
          headers: authHeaders(),
        }
      );

      const result = await parseApiResponse<AdminTransaction>(res);
      setSelectedTxn(result);
    } catch {
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <>
      {selectedTxn && (
        <div
          role="presentation"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#141413]/40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setSelectedTxn(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedTxn(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[#faf9f5] rounded-2xl w-full max-w-[520px] mx-4 overflow-hidden"
            style={{ boxShadow: '0 0 0 1px #d1cfc5, rgba(0,0,0,0.15) 0px 20px 60px' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0eee6] bg-[#f5f4ed]">
              <h2 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] m-0 leading-[1.3]">
                Chi tiết giao dịch
              </h2>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e6dc] bg-[#f0eee6] text-[#5e5d59] hover:bg-[#e8e6dc] hover:text-[#141413] transition-all cursor-pointer"
                onClick={() => setSelectedTxn(null)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col">
              {(
                [
                  [
                    'Mã giao dịch',
                    <span key="id" className="font-mono text-[13px]">
                      {selectedTxn.id}
                    </span>,
                  ],
                  [
                    'Mã đơn hàng',
                    <span key="orderCode" className="font-mono text-[13px]">
                      {String(selectedTxn.orderCode)}
                    </span>,
                  ],
                  ['Người dùng', selectedTxn.userName],
                  ['Email', selectedTxn.userEmail],
                  ['Gói đăng ký', selectedTxn.planName],
                  [
                    'Số tiền',
                    <span key="amount" className="text-[#c96442] font-semibold">
                      {formatCurrency(selectedTxn.amount)}
                    </span>,
                  ],
                  [
                    'Phương thức',
                    <span key="method" className="inline-flex items-center gap-1.5">
                      <CreditCard size={13} />
                      {selectedTxn.paymentMethod}
                    </span>,
                  ],
                  [
                    'Trạng thái',
                    <span
                      key="status"
                      className={`txn-status-badge txn-status-badge--${selectedTxn.status}`}
                    >
                      {statusLabel(selectedTxn.status)}
                    </span>,
                  ],
                  ['Thời gian', formatDate(selectedTxn.createdAt)],
                ] as [string, React.ReactNode][]
              ).map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 py-2.5 border-b border-[#f0eee6] last:border-0"
                >
                  <span className="text-[13px] font-medium text-[#87867f] shrink-0">{label}</span>
                  <span className="text-[14px] font-semibold text-[#141413] text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
        notificationCount={3}
        contentClassName="dashboard-content--flush-bleed"
      >
        <AdminFinanceStudioShell>
          <div className="admin-transactions-page">
            <header className="page-header courses-header-row">
              <div className="header-stack">
                <h2 className="page-title" style={{ margin: 0 }}>
                  Giao dịch
                </h2>
                <p className="page-subtitle header-sub">
                  Theo dõi toàn bộ lịch sử thanh toán trên hệ thống
                </p>
              </div>
              <div
                className="header-actions row"
                style={{ flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleExportCsv}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <>
                      <Loader2 size={16} className="admin-finance-spin" aria-hidden />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <Download size={16} aria-hidden />
                      Xuất CSV
                    </>
                  )}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleRefresh}>
                  <RefreshCw size={16} aria-hidden />
                  Làm mới
                </button>
              </div>
            </header>

            {/* Stats Cards */}
            <div className="txn-stats-grid">
              <div className="txn-stat-card">
                <div className="txn-stat-icon">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="txn-stat-info">
                  <div className="txn-stat-label">Tổng giao dịch</div>
                  <div className="txn-stat-value">{displayStat(stats.total)}</div>
                </div>
              </div>
              <div className="txn-stat-card">
                <div className="txn-stat-icon">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="txn-stat-info">
                  <div className="txn-stat-label">Thành công</div>
                  <div className="txn-stat-value">{displayStat(stats.completed)}</div>
                </div>
              </div>
              <div className="txn-stat-card">
                <div className="txn-stat-icon">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="txn-stat-info">
                  <div className="txn-stat-label">Đang xử lý</div>
                  <div className="txn-stat-value">{displayStat(stats.pending)}</div>
                </div>
              </div>
              <div className="txn-stat-card">
                <div className="txn-stat-icon">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="txn-stat-info">
                  <div className="txn-stat-label">Thất bại</div>
                  <div className="txn-stat-value">{displayStat(stats.failed)}</div>
                </div>
              </div>
              <div className="txn-stat-card txn-stat-card--revenue">
                <div className="txn-stat-icon">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="txn-stat-info">
                  <div className="txn-stat-label">Tổng doanh thu (đã thu)</div>
                  <div className="txn-stat-value txn-stat-value--lg">{displayRevenue()}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="txn-filters">
              <div className="txn-search-wrap">
                <span className="txn-search-icon">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  className="txn-search-input"
                  placeholder="Tìm theo tên, email, mã đơn, gói..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="txn-status-tabs">
                {(['all', 'completed', 'pending', 'failed'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    className={`txn-tab${statusFilter === s ? ' txn-tab--active' : ''}`}
                    onClick={() => handleFilterChange(s)}
                  >
                    {s === 'all' ? 'Tất cả' : statusLabel(s)}
                    <span className="txn-tab-count">{s === 'all' ? stats.total : stats[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="txn-table-card">
              <div className="txn-table-wrap">
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Người dùng</th>
                      <th>Gói đăng ký</th>
                      <th>Số tiền</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>{tableRows}</tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="txn-pagination">
                  <span className="txn-pagination-info">
                    Hiển thị {pageStart}–{pageEnd} / {totalItems} giao dịch
                  </span>
                  <div className="txn-pagination-btns">
                    <button
                      className="txn-page-btn"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ‹ Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`txn-page-btn${page === i ? ' txn-page-btn--active' : ''}`}
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="txn-page-btn"
                      disabled={page === totalPages - 1}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                    >
                      Sau ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AdminFinanceStudioShell>
      </DashboardLayout>
    </>
  );
};

export default AdminTransactions;
