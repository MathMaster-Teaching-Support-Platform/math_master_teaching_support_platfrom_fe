import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  XCircle,
  Eye,
  Percent,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  CommissionProposalService,
  type CommissionProposalResponse,
  type CommissionProposalStatus,
} from '../../services/api/commission-proposal.service';
import '../../styles/module-refactor.css';
import '../courses/TeacherCourses.css';
import './admin-finance-studio.css';
import './admin-mgmt-shell.css';
import AdminFinanceStudioShell from './AdminFinanceStudioShell';
import './AdminCommissionProposals.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (v: number) => `${Math.round(v * 100)}%`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

type FilterStatus = 'ALL' | CommissionProposalStatus;

const STATUS_LABELS: Record<CommissionProposalStatus, string> = {
  PENDING:  'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};
const STATUS_COLORS: Record<CommissionProposalStatus, string> = {
  PENDING:  '#D97757',
  APPROVED: '#2D8A6A',
  REJECTED: '#B53333',
};

// ── Review Modal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
  proposal: CommissionProposalResponse;
  onClose: () => void;
  onDone: (msg: string) => void;
}

function ReviewModal({ proposal, onClose, onDone }: ReviewModalProps) {
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    setError(null);
    setLoading(true);
    try {
      await CommissionProposalService.adminReview(
        proposal.id, action, adminNote.trim() || undefined
      );
      onDone(action === 'APPROVED'
        ? `Đã phê duyệt tỷ lệ ${pct(proposal.teacherShare)} cho giáo viên ${proposal.teacherName ?? ''}`
        : `Đã từ chối đề xuất của ${proposal.teacherName ?? ''}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="acp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acp-modal">
        <div className="acp-modal__header">
          <div className="acp-modal__title">
            <Percent size={17} />
            Xét duyệt đề xuất hoa hồng
          </div>
          <button className="acp-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="acp-modal__body">
          <div className="acp-info-box">
            <div className="acp-info-row">
              <span>Giáo viên</span>
              <strong>{proposal.teacherName ?? '—'}</strong>
            </div>
            <div className="acp-info-row">
              <span>Email</span>
              <span>{proposal.teacherEmail ?? '—'}</span>
            </div>
            <div className="acp-info-row">
              <span>Đề xuất chia doanh thu</span>
              <span className="acp-info-split">
                GV {pct(proposal.teacherShare)} / Nền tảng {pct(proposal.platformShare)}
              </span>
            </div>
            <div className="acp-info-row">
              <span>Ngày gửi</span>
              <span>{formatDate(proposal.createdAt)}</span>
            </div>
          </div>

          <div className="acp-field">
            <label className="acp-label">Ghi chú (tùy chọn)</label>
            <textarea
              className="acp-textarea"
              rows={3}
              placeholder="Ví dụ: Tỷ lệ hợp lý, đã xem xét lịch sử doanh thu..."
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="acp-error">
              <AlertTriangle size={14} /><span>{error}</span>
            </div>
          )}

          <div className="acp-modal__actions">
            <button className="acp-btn-ghost" onClick={onClose} disabled={loading}>Hủy</button>
            <button
              className="acp-btn-reject"
              onClick={() => handleAction('REJECTED')}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="acp-spin" /> : <XCircle size={14} />}
              Từ chối
            </button>
            <button
              className="acp-btn-approve"
              onClick={() => handleAction('APPROVED')}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="acp-spin" /> : <CheckCircle2 size={14} />}
              Phê duyệt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  proposal: CommissionProposalResponse;
  onClose: () => void;
  onReview: () => void;
}

function DetailDrawer({ proposal, onClose, onReview }: DetailDrawerProps) {
  return (
    <div className="acp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acp-modal">
        <div className="acp-modal__header">
          <div className="acp-modal__title"><Eye size={17} />Chi tiết đề xuất</div>
          <button className="acp-modal__close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="acp-modal__body">
          <div className="acp-info-box">
            <div className="acp-info-row"><span>Giáo viên</span><strong>{proposal.teacherName ?? '—'}</strong></div>
            <div className="acp-info-row"><span>Email</span><span>{proposal.teacherEmail ?? '—'}</span></div>
            <div className="acp-info-row">
              <span>Chia doanh thu đề xuất</span>
              <span className="acp-info-split">GV {pct(proposal.teacherShare)} / Nền tảng {pct(proposal.platformShare)}</span>
            </div>
            <div className="acp-info-row">
              <span>Trạng thái</span>
              <span
                className="acp-status-badge"
                style={{ '--badge-color': STATUS_COLORS[proposal.status] } as React.CSSProperties}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>
            <div className="acp-info-row"><span>Ngày gửi</span><span>{formatDate(proposal.createdAt)}</span></div>
            {proposal.reviewedAt && (
              <div className="acp-info-row"><span>Ngày xét duyệt</span><span>{formatDate(proposal.reviewedAt)}</span></div>
            )}
            {proposal.adminNote && (
              <div className="acp-info-row"><span>Ghi chú admin</span><span>{proposal.adminNote}</span></div>
            )}
          </div>

          {proposal.status === 'PENDING' && (
            <div className="acp-modal__actions">
              <button className="acp-btn-ghost" onClick={onClose}>Đóng</button>
              <button className="acp-btn-approve" onClick={onReview}>
                <Percent size={14} /> Xét duyệt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'PENDING',  label: 'Chờ duyệt' },
  { value: 'ALL',      label: 'Tất cả' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const AdminCommissionProposals: React.FC = () => {
  const currentUser = mockAdmin;

  const [filter, setFilter]       = useState<FilterStatus>('PENDING');
  const [page, setPage]           = useState(0);
  const [proposals, setProposals] = useState<CommissionProposalResponse[]>([]);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [detailItem, setDetailItem]   = useState<CommissionProposalResponse | null>(null);
  const [reviewItem, setReviewItem]   = useState<CommissionProposalResponse | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CommissionProposalService.adminGetAll({
        status: filter === 'ALL' ? undefined : filter,
        page,
        size: 10,
      });
      setProposals(res.result.content);
      setTotalPages(res.result.totalPages);
      setTotalElements(res.result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <DashboardLayout
      role="admin"
      user={{ name: currentUser.name, avatar: currentUser.avatar!, role: 'admin' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <AdminFinanceStudioShell>
        <div className="acp-page">
          {/* Header — aligned with teacher mindmaps / commission */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
                <Percent className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0">
                  Quản lý Hoa hồng
                </h1>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 mb-0">
                  Xét duyệt đề xuất tỷ lệ chia doanh thu của giáo viên
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
              onClick={load}
              disabled={isLoading}
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
              Làm mới
            </button>
          </header>

          {/* Toast */}
          {successMsg && (
            <div className="acp-toast">
              <CheckCircle2 size={15} />{successMsg}
            </div>
          )}

          {/* Filters — segmented control like /teacher/mindmaps */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-wrap">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    filter === opt.value
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                  onClick={() => {
                    setFilter(opt.value);
                    setPage(0);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="acp-table-wrap">
            {isLoading ? (
              <div className="acp-loading">
                <Loader2 size={24} className="acp-spin" />
                <span>Đang tải...</span>
              </div>
            ) : error ? (
              <div className="acp-empty-state">
                <AlertTriangle size={32} style={{ color: '#B53333' }} />
                <p>{error}</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors mt-1"
                  onClick={load}
                >
                  Thử lại
                </button>
              </div>
            ) : proposals.length === 0 ? (
              <div className="acp-empty-state">
                <Percent size={32} style={{ color: '#C2C0B6' }} />
                <p>Không có đề xuất nào.</p>
              </div>
            ) : (
              <table className="acp-table">
                <thead>
                  <tr>
                    <th>Giáo viên</th>
                    <th>Tỷ lệ đề xuất</th>
                    <th>Trạng thái</th>
                    <th>Ngày gửi</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="acp-user-cell">
                          <span className="acp-user-name">{p.teacherName ?? p.teacherId.slice(0, 8)}</span>
                          {p.teacherEmail && <span className="acp-user-email">{p.teacherEmail}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="acp-split-pill">
                          GV {pct(p.teacherShare)} <span>/</span> Nền tảng {pct(p.platformShare)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="acp-status-badge"
                          style={{ '--badge-color': STATUS_COLORS[p.status] } as React.CSSProperties}
                        >
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.createdAt)}</td>
                      <td>
                        <div className="acp-actions-cell">
                          <button
                            className="acp-action-btn"
                            title="Xem chi tiết"
                            onClick={() => setDetailItem(p)}
                          >
                            <Eye size={14} />
                          </button>
                          {p.status === 'PENDING' && (
                            <button
                              className="acp-action-btn acp-action-btn--approve"
                              title="Xét duyệt"
                              onClick={() => setReviewItem(p)}
                            >
                              <CheckCircle2 size={14} />
                            </button>
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
            <div className="acp-pagination">
              <span className="acp-pagination__info">{totalElements} đề xuất</span>
              <div className="acp-pagination__nav">
                <button type="button" className="acp-page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span className="acp-pagination__pages">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="acp-page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminFinanceStudioShell>

      {/* Detail Drawer */}
      {detailItem && (
        <DetailDrawer
          proposal={detailItem}
          onClose={() => setDetailItem(null)}
          onReview={() => { setReviewItem(detailItem); setDetailItem(null); }}
        />
      )}

      {/* Review Modal */}
      {reviewItem && (
        <ReviewModal
          proposal={reviewItem}
          onClose={() => setReviewItem(null)}
          onDone={msg => {
            setReviewItem(null);
            showSuccess(msg);
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminCommissionProposals;
