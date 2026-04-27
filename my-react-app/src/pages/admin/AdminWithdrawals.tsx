import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import {
  useAdminProcessWithdrawal,
  useAdminRejectWithdrawal,
  useAdminWithdrawals,
} from '../../hooks/useWithdrawals';
import type { WithdrawalRequestResponse, WithdrawalStatus } from '../../types/wallet.types';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './admin-finance-studio.css';
import './AdminWithdrawals.css';

const PAGE_SIZE = 10;

type FilterStatus = 'ALL' | WithdrawalStatus;

const STATUS_LABELS: Record<WithdrawalStatus, string> = {
  PENDING_VERIFY: 'Chờ OTP',
  PENDING_ADMIN: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<WithdrawalStatus, string> = {
  PENDING_VERIFY: '#f59e0b',
  PENDING_ADMIN: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SUCCESS: '#10b981',
  REJECTED: '#ef4444',
  CANCELLED: '#6b7280',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ── Approve Modal ─────────────────────────────────────────────────────────────

interface ApproveModalProps {
  request: WithdrawalRequestResponse;
  onClose: () => void;
  onDone: () => void;
}

function ApproveModal({ request, onClose, onDone }: ApproveModalProps) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const processMutation = useAdminProcessWithdrawal();

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh JPG/PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File ảnh tối đa 10MB.');
      return;
    }
    setError(null);
    setProofFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      setError('Vui lòng upload ảnh chứng minh chuyển khoản.');
      return;
    }
    setError(null);
    try {
      await processMutation.mutateAsync({
        id: request.withdrawalRequestId,
        proofImage: proofFile,
        adminNote: adminNote.trim() || undefined,
      });
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      if (msg.includes('1208') || msg.toLowerCase().includes('status')) {
        setError('Yêu cầu này đã được xử lý hoặc không còn ở trạng thái hợp lệ.');
      } else if (msg.includes('1029') || msg.toLowerCase().includes('balance')) {
        setError('Số dư ví người dùng không đủ (race condition). Vui lòng kiểm tra lại.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="wad-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal">
        <div className="wad-modal__header">
          <div className="wad-modal__title">
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            Xác nhận chuyển khoản
          </div>
          <button className="wad-modal__close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="wad-modal__body">
          {/* Transfer info */}
          <div className="wad-info-box">
            <div className="wad-info-row">
              <span>Số tiền cần chuyển</span>
              <strong className="wad-info-amount">{formatCurrency(request.amount)}</strong>
            </div>
            <div className="wad-info-row">
              <span>Ngân hàng</span>
              <span>{request.bankName}</span>
            </div>
            <div className="wad-info-row">
              <span>Số tài khoản</span>
              <div className="wad-copy-row">
                <span className="wad-mono">{request.bankAccountNumber}</span>
                <button
                  className="wad-copy-btn"
                  onClick={() => copyToClipboard(request.bankAccountNumber)}
                  title="Sao chép"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="wad-info-row">
              <span>Tên chủ TK</span>
              <div className="wad-copy-row">
                <strong>{request.bankAccountName}</strong>
                <button
                  className="wad-copy-btn"
                  onClick={() => copyToClipboard(request.bankAccountName)}
                  title="Sao chép"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          <p className="wad-step-hint">
            Sau khi chuyển khoản xong, upload ảnh chứng minh bên dưới rồi bấm "Xác nhận hoàn tất".
          </p>

          {/* Proof upload */}
          <div
            className={`wad-dropzone ${proofFile ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !proofFile && fileRef.current?.click()}
          >
            {preview ? (
              <div className="wad-preview-wrap">
                <img src={preview} alt="Proof preview" className="wad-preview-img" />
                <button
                  className="wad-preview-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProofFile(null);
                    setPreview(null);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} className="wad-dropzone__icon" />
                <p className="wad-dropzone__text">
                  Kéo thả ảnh vào đây hoặc <span>click để chọn</span>
                </p>
                <p className="wad-dropzone__sub">JPG, PNG — tối đa 10MB</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {/* Admin note */}
          <div className="wad-field">
            <label className="wad-label">Ghi chú (tùy chọn)</label>
            <textarea
              className="wad-textarea"
              rows={2}
              placeholder="Ví dụ: Đã chuyển khoản thành công lúc 14:00"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="wad-error">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="wad-btn-confirm"
            onClick={handleSubmit}
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? (
              <>
                <Loader2 size={15} className="wad-spin" /> Đang xử lý...
              </>
            ) : (
              'Xác nhận hoàn tất'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

interface RejectModalProps {
  request: WithdrawalRequestResponse;
  onClose: () => void;
  onDone: () => void;
}

function RejectModal({ request, onClose, onDone }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rejectMutation = useAdminRejectWithdrawal();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setError(null);
    try {
      await rejectMutation.mutateAsync({ id: request.withdrawalRequestId, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
    }
  };

  return (
    <div className="wad-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal wad-modal--sm">
        <div className="wad-modal__header">
          <div className="wad-modal__title" style={{ color: '#ef4444' }}>
            <XCircle size={18} />
            Từ chối yêu cầu
          </div>
          <button className="wad-modal__close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="wad-modal__body">
          <p className="wad-step-hint">
            Từ chối yêu cầu của <strong>{request.userName ?? request.userId}</strong> —{' '}
            {formatCurrency(request.amount)}. Số dư sẽ được hoàn lại tự động.
          </p>
          <div className="wad-field">
            <label className="wad-label">
              Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="wad-textarea"
              rows={3}
              placeholder="Ví dụ: Thông tin tài khoản ngân hàng không hợp lệ..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <div className="wad-error">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}
          <div className="wad-modal__actions">
            <button className="wad-btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              className="wad-btn-reject"
              onClick={handleSubmit}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  request: WithdrawalRequestResponse;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function DetailDrawer({ request, onClose, onApprove, onReject }: DetailDrawerProps) {
  const canProcess = request.status === 'PENDING_ADMIN';

  return (
    <div className="wad-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wad-modal">
        <div className="wad-modal__header">
          <div className="wad-modal__title">
            <Eye size={18} />
            Chi tiết yêu cầu
          </div>
          <button className="wad-modal__close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="wad-modal__body">
          <div className="wad-info-box">
            <div className="wad-info-row">
              <span>Người dùng</span>
              <span>{request.userName ?? '—'}</span>
            </div>
            <div className="wad-info-row">
              <span>Email</span>
              <span>{request.userEmail ?? '—'}</span>
            </div>
            <div className="wad-info-row">
              <span>Số tiền</span>
              <strong className="wad-info-amount">{formatCurrency(request.amount)}</strong>
            </div>
            <div className="wad-info-row">
              <span>Ngân hàng</span>
              <span>{request.bankName}</span>
            </div>
            <div className="wad-info-row">
              <span>Số TK</span>
              <span className="wad-mono">{request.bankAccountNumber}</span>
            </div>
            <div className="wad-info-row">
              <span>Tên chủ TK</span>
              <strong>{request.bankAccountName}</strong>
            </div>
            <div className="wad-info-row">
              <span>Trạng thái</span>
              <span
                className="wad-status-badge"
                style={{ '--badge-color': STATUS_COLORS[request.status] } as React.CSSProperties}
              >
                {STATUS_LABELS[request.status]}
              </span>
            </div>
            <div className="wad-info-row">
              <span>Ngày tạo</span>
              <span>{formatDate(request.createdAt)}</span>
            </div>
            {request.processedAt && (
              <div className="wad-info-row">
                <span>Ngày xử lý</span>
                <span>{formatDate(request.processedAt)}</span>
              </div>
            )}
            {request.adminNote && (
              <div className="wad-info-row">
                <span>Ghi chú admin</span>
                <span>{request.adminNote}</span>
              </div>
            )}
          </div>

          {request.proofImageUrl && (
            <div className="wad-proof-section">
              <div className="wad-label" style={{ marginBottom: '0.5rem' }}>
                Ảnh chứng minh
              </div>
              <a href={request.proofImageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={request.proofImageUrl}
                  alt="Proof"
                  style={{ width: '100%', borderRadius: 10, border: '1px solid #e5e7eb' }}
                />
              </a>
            </div>
          )}

          {canProcess && (
            <div className="wad-modal__actions">
              <button className="wad-btn-reject" onClick={onReject}>
                Từ chối
              </button>
              <button className="wad-btn-confirm" onClick={onApprove}>
                Xử lý & Chuyển khoản
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const AdminWithdrawals: React.FC = () => {
  const currentUser = mockAdmin;

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('PENDING_ADMIN');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  const [detailItem, setDetailItem] = useState<WithdrawalRequestResponse | null>(null);
  const [approveItem, setApproveItem] = useState<WithdrawalRequestResponse | null>(null);
  const [rejectItem, setRejectItem] = useState<WithdrawalRequestResponse | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    page,
  };

  const { data, isLoading, isFetching, error, refetch } = useAdminWithdrawals(queryParams);

  const requests = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'PENDING_ADMIN', label: 'Chờ xử lý' },
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={{ name: currentUser.name, avatar: currentUser.avatar!, role: 'admin' }}
      notificationCount={0}
    >
      <AdminFinanceStudioShell>
        <div className="wad-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <h1 className="page-title">Quản lý Rút tiền</h1>
              <p className="page-subtitle">Xét duyệt và xử lý các yêu cầu rút tiền thủ công</p>
            </div>
            <div className="header-actions">
              <button
                className="btn-action btn-action--ghost"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Làm mới"
              >
                <RefreshCw size={15} className={isFetching ? 'spin-icon' : ''} />
                Làm mới
              </button>
            </div>
          </header>

          {/* Success toast */}
          {successMsg && (
            <div className="wad-success-toast">
              <CheckCircle2 size={15} />
              {successMsg}
            </div>
          )}

          {/* Filters */}
          <div className="wad-toolbar">
            <div className="wad-search-wrap">
              <Search size={15} className="wad-search-icon" />
              <input
                className="wad-search"
                type="text"
                placeholder="Tìm theo tên, email, số tài khoản..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="wad-filters">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`wad-filter-tab ${statusFilter === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(0);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="wad-table-wrap">
            {isLoading ? (
              <div className="wad-loading">
                <Loader2 size={24} className="wad-spin" />
                <span>Đang tải...</span>
              </div>
            ) : error ? (
              <div className="wad-empty-state">
                <AlertTriangle size={32} style={{ color: '#ef4444' }} />
                <p>{error instanceof Error ? error.message : 'Không thể tải dữ liệu.'}</p>
                <button className="btn-action btn-action--ghost" onClick={() => refetch()}>
                  Thử lại
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="wad-empty-state">
                <Download size={32} style={{ color: '#d1d5db' }} />
                <p>Không có yêu cầu nào.</p>
              </div>
            ) : (
              <table className="wad-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Số tiền</th>
                    <th>Ngân hàng</th>
                    <th>Số tài khoản</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.withdrawalRequestId}>
                      <td>
                        <div className="wad-user-cell">
                          <span className="wad-user-name">
                            {req.userName ?? req.userId?.slice(0, 8)}
                          </span>
                          {req.userEmail && <span className="wad-user-email">{req.userEmail}</span>}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#4f46e5' }}>{formatCurrency(req.amount)}</strong>
                      </td>
                      <td>{req.bankName}</td>
                      <td>
                        <span className="wad-mono">{req.bankAccountNumber}</span>
                      </td>
                      <td>
                        <span
                          className="wad-status-badge"
                          style={
                            { '--badge-color': STATUS_COLORS[req.status] } as React.CSSProperties
                          }
                        >
                          {STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(req.createdAt)}</td>
                      <td>
                        <div className="wad-actions-cell">
                          <button
                            className="wad-action-btn"
                            title="Xem chi tiết"
                            onClick={() => setDetailItem(req)}
                          >
                            <Eye size={14} />
                          </button>
                          {req.status === 'PENDING_ADMIN' && (
                            <>
                              <button
                                className="wad-action-btn wad-action-btn--approve"
                                title="Xử lý & Chuyển khoản"
                                onClick={() => setApproveItem(req)}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <button
                                className="wad-action-btn wad-action-btn--reject"
                                title="Từ chối"
                                onClick={() => setRejectItem(req)}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="wad-pagination">
              <span className="wad-pagination__info">{totalElements} yêu cầu</span>
              <button
                className="wad-page-btn"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="wad-pagination__pages">
                {page + 1} / {totalPages}
              </span>
              <button
                className="wad-page-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </AdminFinanceStudioShell>

      {/* Modals */}
      {detailItem && (
        <DetailDrawer
          request={detailItem}
          onClose={() => setDetailItem(null)}
          onApprove={() => {
            setApproveItem(detailItem);
            setDetailItem(null);
          }}
          onReject={() => {
            setRejectItem(detailItem);
            setDetailItem(null);
          }}
        />
      )}

      {approveItem && (
        <ApproveModal
          request={approveItem}
          onClose={() => setApproveItem(null)}
          onDone={() => {
            setApproveItem(null);
            showSuccess('Đã xác nhận chuyển khoản thành công!');
            refetch();
          }}
        />
      )}

      {rejectItem && (
        <RejectModal
          request={rejectItem}
          onClose={() => setRejectItem(null)}
          onDone={() => {
            setRejectItem(null);
            showSuccess('Đã từ chối yêu cầu rút tiền.');
            refetch();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminWithdrawals;
