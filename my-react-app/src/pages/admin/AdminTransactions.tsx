import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import './AdminTransactions.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface MockTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  orderCode: string;
  createdAt: string;
}

const MOCK_TRANSACTIONS: MockTransaction[] = [
  {
    id: 'txn-001a2b3c',
    userId: 'u-101',
    userName: 'Nguyễn Văn An',
    userEmail: 'an.nguyen@gmail.com',
    planName: 'Gói Pro - 1 tháng',
    amount: 99000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0001',
    createdAt: '2026-04-11T08:23:11Z',
  },
  {
    id: 'txn-002c4d5e',
    userId: 'u-102',
    userName: 'Trần Thị Bình',
    userEmail: 'binh.tran@yahoo.com',
    planName: 'Gói Pro - 3 tháng',
    amount: 279000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0002',
    createdAt: '2026-04-11T09:05:44Z',
  },
  {
    id: 'txn-003f6g7h',
    userId: 'u-103',
    userName: 'Lê Minh Cường',
    userEmail: 'cuong.le@outlook.com',
    planName: 'Gói Premium - 1 năm',
    amount: 990000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0003',
    createdAt: '2026-04-10T14:41:00Z',
  },
  {
    id: 'txn-004i8j9k',
    userId: 'u-104',
    userName: 'Phạm Thị Duyên',
    userEmail: 'duyen.pham@gmail.com',
    planName: 'Gói Pro - 1 tháng',
    amount: 99000,
    status: 'pending',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0004',
    createdAt: '2026-04-10T16:22:33Z',
  },
  {
    id: 'txn-005l0m1n',
    userId: 'u-105',
    userName: 'Hoàng Đức Hiếu',
    userEmail: 'hieu.hoang@student.edu.vn',
    planName: 'Gói Pro - 6 tháng',
    amount: 549000,
    status: 'failed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0005',
    createdAt: '2026-04-10T10:09:55Z',
  },
  {
    id: 'txn-006p2q3r',
    userId: 'u-106',
    userName: 'Vũ Thanh Liêm',
    userEmail: 'liem.vu@gmail.com',
    planName: 'Gói Premium - 6 tháng',
    amount: 1350000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0006',
    createdAt: '2026-04-09T11:30:00Z',
  },
  {
    id: 'txn-007s4t5u',
    userId: 'u-107',
    userName: 'Đặng Thị Mai',
    userEmail: 'mai.dang@teacher.edu.vn',
    planName: 'Gói Pro - 1 tháng',
    amount: 99000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0007',
    createdAt: '2026-04-09T08:15:22Z',
  },
  {
    id: 'txn-008v6w7x',
    userId: 'u-108',
    userName: 'Bùi Quốc Nam',
    userEmail: 'nam.bui@gmail.com',
    planName: 'Gói Pro - 3 tháng',
    amount: 279000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0008',
    createdAt: '2026-04-08T19:45:01Z',
  },
  {
    id: 'txn-009y8z9a',
    userId: 'u-109',
    userName: 'Ngô Nhật Quang',
    userEmail: 'quang.ngo@gmail.com',
    planName: 'Gói Premium - 1 năm',
    amount: 990000,
    status: 'pending',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0009',
    createdAt: '2026-04-08T13:12:50Z',
  },
  {
    id: 'txn-010b1c2d',
    userId: 'u-110',
    userName: 'Trịnh Khánh Linh',
    userEmail: 'linh.trinh@yahoo.com',
    planName: 'Gói Pro - 1 tháng',
    amount: 99000,
    status: 'failed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0010',
    createdAt: '2026-04-08T07:58:39Z',
  },
  {
    id: 'txn-011e3f4g',
    userId: 'u-111',
    userName: 'Lý Thành Đức',
    userEmail: 'duc.ly@gmail.com',
    planName: 'Gói Pro - 6 tháng',
    amount: 549000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0011',
    createdAt: '2026-04-07T15:27:10Z',
  },
  {
    id: 'txn-012h5i6j',
    userId: 'u-112',
    userName: 'Phan Thị Hồng',
    userEmail: 'hong.phan@student.edu.vn',
    planName: 'Gói Pro - 1 tháng',
    amount: 99000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0012',
    createdAt: '2026-04-07T10:03:21Z',
  },
  {
    id: 'txn-013k7l8m',
    userId: 'u-113',
    userName: 'Cao Minh Tuấn',
    userEmail: 'tuan.cao@teacher.edu.vn',
    planName: 'Gói Premium - 6 tháng',
    amount: 1350000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0013',
    createdAt: '2026-04-06T09:44:00Z',
  },
  {
    id: 'txn-014n9o0p',
    userId: 'u-114',
    userName: 'Đinh Thị Lan',
    userEmail: 'lan.dinh@gmail.com',
    planName: 'Gói Pro - 3 tháng',
    amount: 279000,
    status: 'failed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0014',
    createdAt: '2026-04-06T17:11:44Z',
  },
  {
    id: 'txn-015q1r2s',
    userId: 'u-115',
    userName: 'Hồ Văn Phúc',
    userEmail: 'phuc.ho@gmail.com',
    planName: 'Gói Premium - 1 năm',
    amount: 990000,
    status: 'completed',
    paymentMethod: 'payos',
    orderCode: 'ORD-2026-0015',
    createdAt: '2026-04-05T12:00:00Z',
  },
];

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

// ─── Component ────────────────────────────────────────────────────────────────

const AdminTransactions: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState<MockTransaction | null>(null);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = MOCK_TRANSACTIONS;
    const completed = all.filter((t) => t.status === 'completed');
    const pending = all.filter((t) => t.status === 'pending');
    const failed = all.filter((t) => t.status === 'failed');
    const totalRevenue = completed.reduce((s, t) => s + t.amount, 0);
    return {
      total: all.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalRevenue,
    };
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      const matchSearch =
        !search ||
        t.userName.toLowerCase().includes(search.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        t.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        t.planName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusLabel = (s: MockTransaction['status']): string => {
    if (s === 'completed') return 'Thành công';
    if (s === 'pending') return 'Đang xử lý';
    return 'Thất bại';
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={3}
    >
      <div className="admin-transactions-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">💳 Quản lý Giao dịch</h1>
            <p className="page-subtitle">Theo dõi toàn bộ lịch sử thanh toán trên hệ thống</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">📥 Xuất CSV</button>
            <button className="btn btn-primary">🔄 Làm mới</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="txn-stats-grid">
          <div className="txn-stat-card" style={{ borderTopColor: '#667eea' }}>
            <div
              className="txn-stat-icon"
              style={{ background: 'rgba(102,126,234,0.1)', color: '#667eea' }}
            >
              📊
            </div>
            <div className="txn-stat-info">
              <div className="txn-stat-label">Tổng giao dịch</div>
              <div className="txn-stat-value">{stats.total.toLocaleString('vi-VN')}</div>
            </div>
          </div>
          <div className="txn-stat-card" style={{ borderTopColor: '#43e97b' }}>
            <div
              className="txn-stat-icon"
              style={{ background: 'rgba(67,233,123,0.1)', color: '#43e97b' }}
            >
              ✅
            </div>
            <div className="txn-stat-info">
              <div className="txn-stat-label">Thành công</div>
              <div className="txn-stat-value">{stats.completed.toLocaleString('vi-VN')}</div>
            </div>
          </div>
          <div className="txn-stat-card" style={{ borderTopColor: '#fbbf24' }}>
            <div
              className="txn-stat-icon"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}
            >
              ⏳
            </div>
            <div className="txn-stat-info">
              <div className="txn-stat-label">Đang xử lý</div>
              <div className="txn-stat-value">{stats.pending.toLocaleString('vi-VN')}</div>
            </div>
          </div>
          <div className="txn-stat-card" style={{ borderTopColor: '#f56565' }}>
            <div
              className="txn-stat-icon"
              style={{ background: 'rgba(245,101,101,0.1)', color: '#f56565' }}
            >
              ❌
            </div>
            <div className="txn-stat-info">
              <div className="txn-stat-label">Thất bại</div>
              <div className="txn-stat-value">{stats.failed.toLocaleString('vi-VN')}</div>
            </div>
          </div>
          <div
            className="txn-stat-card txn-stat-card--revenue"
            style={{ borderTopColor: '#38f9d7' }}
          >
            <div
              className="txn-stat-icon"
              style={{ background: 'rgba(56,249,215,0.1)', color: '#38f9d7' }}
            >
              💰
            </div>
            <div className="txn-stat-info">
              <div className="txn-stat-label">Tổng doanh thu (đã thu)</div>
              <div className="txn-stat-value txn-stat-value--lg">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="txn-filters">
          <div className="txn-search-wrap">
            <span className="txn-search-icon">🔍</span>
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
                <span className="txn-tab-count">
                  {s === 'all'
                    ? MOCK_TRANSACTIONS.length
                    : MOCK_TRANSACTIONS.filter((t) => t.status === s).length}
                </span>
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
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="txn-empty">
                      Không tìm thấy giao dịch nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginated.map((txn) => (
                    <tr key={txn.id}>
                      <td className="txn-order-code">{txn.orderCode}</td>
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
                        <span className="txn-payment-badge">💳 PayOS</span>
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
                          onClick={() => setSelectedTxn(txn)}
                        >
                          👁️ Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="txn-pagination">
              <span className="txn-pagination-info">
                Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}{' '}
                / {filtered.length} giao dịch
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
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedTxn && (
          <div
            className="txn-modal-overlay"
            onClick={() => setSelectedTxn(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSelectedTxn(null);
            }}
          >
            <dialog open className="txn-modal" onClick={(e) => e.stopPropagation()}>
              <div className="txn-modal-header">
                <h2 className="txn-modal-title">Chi tiết giao dịch</h2>
                <button className="txn-modal-close" onClick={() => setSelectedTxn(null)}>
                  ✕
                </button>
              </div>
              <div className="txn-modal-body">
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Mã giao dịch</span>
                  <span className="txn-detail-value monospace">{selectedTxn.id}</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Mã đơn hàng</span>
                  <span className="txn-detail-value monospace">{selectedTxn.orderCode}</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Người dùng</span>
                  <span className="txn-detail-value">{selectedTxn.userName}</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Email</span>
                  <span className="txn-detail-value">{selectedTxn.userEmail}</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Gói đăng ký</span>
                  <span className="txn-detail-value">{selectedTxn.planName}</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Số tiền</span>
                  <span className="txn-detail-value txn-amount">
                    {formatCurrency(selectedTxn.amount)}
                  </span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Phương thức</span>
                  <span className="txn-detail-value">💳 PayOS</span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Trạng thái</span>
                  <span className={`txn-status-badge txn-status-badge--${selectedTxn.status}`}>
                    {statusLabel(selectedTxn.status)}
                  </span>
                </div>
                <div className="txn-detail-row">
                  <span className="txn-detail-label">Thời gian</span>
                  <span className="txn-detail-value">{formatDate(selectedTxn.createdAt)}</span>
                </div>
              </div>
            </dialog>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTransactions;
