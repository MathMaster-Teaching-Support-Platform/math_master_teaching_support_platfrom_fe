import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Percent,
  Send,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import {
  CommissionProposalService,
  type CommissionProposalResponse,
  type CommissionProposalStatus,
} from '../../services/api/commission-proposal.service';
import './TeacherCommissionPage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (v: number) => `${Math.round(v * 100)}%`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

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

// ── Component ─────────────────────────────────────────────────────────────────

const TeacherCommissionPage: React.FC = () => {
  const currentUser = mockTeacher;

  // Active rate state
  const [activeRate, setActiveRate]         = useState<CommissionProposalResponse | null>(null);
  const [activeLoading, setActiveLoading]   = useState(true);

  // Proposal history state
  const [proposals, setProposals]           = useState<CommissionProposalResponse[]>([]);
  const [totalPages, setTotalPages]         = useState(0);
  const [totalElements, setTotalElements]   = useState(0);
  const [historyPage, setHistoryPage]       = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Submission state
  const [sliderValue, setSliderValue]   = useState(80); // percent integer
  const [hasPending, setHasPending]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadActive = async () => {
    setActiveLoading(true);
    try {
      const res = await CommissionProposalService.getMyActiveRate();
      setActiveRate(res.result ?? null);
    } catch (_) {
      setActiveRate(null);
    } finally {
      setActiveLoading(false);
    }
  };

  const loadHistory = async (p = 0) => {
    setHistoryLoading(true);
    try {
      const res = await CommissionProposalService.getMyProposals({ page: p, size: 8 });
      setProposals(res.result.content);
      setTotalPages(res.result.totalPages);
      setTotalElements(res.result.totalElements);
      // Check if a PENDING proposal exists (disable submit button)
      setHasPending(res.result.content.some(pr => pr.status === 'PENDING'));
    } catch (_) {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadActive();
    loadHistory(0);
  }, []);

  useEffect(() => { loadHistory(historyPage); }, [historyPage]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    if (sliderValue < 50 || sliderValue > 97) {
      setSubmitError('Tỷ lệ phải từ 50% đến 97%.');
      return;
    }
    setSubmitting(true);
    try {
      await CommissionProposalService.submitProposal(sliderValue / 100);
      setSubmitSuccess(`Đã gửi đề xuất ${sliderValue}% / ${100 - sliderValue}% thành công. Vui lòng chờ admin xét duyệt.`);
      setHasPending(true);
      loadHistory(0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  const platformPct = 100 - sliderValue;

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: currentUser.name, avatar: currentUser.avatar!, role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="tcp-page">
          {/* Page header — aligned with /teacher/mindmaps */}
          <header className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
              <Percent className="w-5 h-5" aria-hidden />
            </div>
            <div>
              <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0">
                Hoa hồng & Doanh thu
              </h1>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 mb-0">
                Đề xuất tỷ lệ chia doanh thu từ khóa học của bạn
              </p>
            </div>
          </header>

        <div className="tcp-grid">
          {/* ── Left column ── */}
          <div className="tcp-left">

            {/* Active Rate Card */}
            <div className="tcp-card tcp-card--active">
              <div className="tcp-card__label">Tỷ lệ hiện tại</div>
              {activeLoading ? (
                <div className="tcp-spinner"><Loader2 size={22} className="tcp-spin" /></div>
              ) : activeRate ? (
                <>
                  <div className="tcp-rate-display">
                    <div className="tcp-rate-ring tcp-rate-ring--teacher">
                      <span className="tcp-rate-ring__value">{pct(activeRate.teacherShare)}</span>
                      <span className="tcp-rate-ring__label">của bạn</span>
                    </div>
                    <div className="tcp-rate-divider">+</div>
                    <div className="tcp-rate-ring tcp-rate-ring--platform">
                      <span className="tcp-rate-ring__value">{pct(activeRate.platformShare)}</span>
                      <span className="tcp-rate-ring__label">nền tảng</span>
                    </div>
                  </div>
                  <p className="tcp-rate-note">
                    <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                    Đã duyệt vào {activeRate.reviewedAt ? formatDate(activeRate.reviewedAt) : '—'}
                  </p>
                </>
              ) : (
                <>
                  <div className="tcp-rate-display">
                    <div className="tcp-rate-ring tcp-rate-ring--teacher">
                      <span className="tcp-rate-ring__value">90%</span>
                      <span className="tcp-rate-ring__label">của bạn</span>
                    </div>
                    <div className="tcp-rate-divider">+</div>
                    <div className="tcp-rate-ring tcp-rate-ring--platform">
                      <span className="tcp-rate-ring__value">10%</span>
                      <span className="tcp-rate-ring__label">nền tảng</span>
                    </div>
                  </div>
                  <p className="tcp-rate-note">
                    Đang áp dụng tỷ lệ mặc định của nền tảng
                  </p>
                </>
              )}
            </div>

            {/* Submit Proposal Card */}
            <div className="tcp-card">
              <div className="tcp-card__label">Gửi đề xuất mới</div>

              {hasPending && (
                <div className="tcp-info-banner">
                  <Clock size={14} />
                  Bạn đang có một đề xuất đang chờ xét duyệt. Vui lòng đợi admin phản hồi trước khi gửi đề xuất mới.
                </div>
              )}

              <div className="tcp-slider-wrap">
                <div className="tcp-slider-labels">
                  <span>Phần của bạn: <strong>{sliderValue}%</strong></span>
                  <span>Nền tảng: <strong>{platformPct}%</strong></span>
                </div>
                <input
                  type="range"
                  min={50} max={97} step={1}
                  value={sliderValue}
                  disabled={hasPending}
                  onChange={e => setSliderValue(Number(e.target.value))}
                  className="tcp-slider"
                />
                <div className="tcp-slider-ticks">
                  <span>50%</span>
                  <span>65%</span>
                  <span>80%</span>
                  <span>97%</span>
                </div>
              </div>

              <div className="tcp-preview-pill">
                <span className="tcp-preview-pill__teacher">{sliderValue}%</span>
                <span className="tcp-preview-pill__divider">GV / Nền tảng</span>
                <span className="tcp-preview-pill__platform">{platformPct}%</span>
              </div>

              {submitError && (
                <div className="tcp-error"><AlertTriangle size={13} /><span>{submitError}</span></div>
              )}
              {submitSuccess && (
                <div className="tcp-success"><CheckCircle2 size={13} /><span>{submitSuccess}</span></div>
              )}

              <button
                className="tcp-btn-submit"
                onClick={handleSubmit}
                disabled={hasPending || submitting}
              >
                {submitting
                  ? <><Loader2 size={15} className="tcp-spin" /> Đang gửi...</>
                  : <><Send size={15} /> Gửi đề xuất</>
                }
              </button>

              <p className="tcp-disclaimer">
                Đề xuất sẽ được admin xem xét và phê duyệt. Tỷ lệ mới chỉ có hiệu lực với các đơn hàng
                sau khi được duyệt. Nền tảng luôn giữ tối thiểu 3%.
              </p>
            </div>
          </div>

          {/* ── Right column: History ── */}
          <div className="tcp-right">
            <div className="tcp-card tcp-card--full">
              <div className="tcp-card__label">Lịch sử đề xuất ({totalElements})</div>

              {historyLoading ? (
                <div className="tcp-spinner"><Loader2 size={22} className="tcp-spin" /></div>
              ) : proposals.length === 0 ? (
                <div className="tcp-empty">
                  <Percent size={32} style={{ color: '#C2C0B6' }} />
                  <p>Chưa có đề xuất nào.</p>
                </div>
              ) : (
                <>
                  <div className="tcp-history-list">
                    {proposals.map(p => (
                      <div key={p.id} className="tcp-history-item">
                        <div className="tcp-history-item__left">
                          <span className="tcp-history-split">
                            GV {pct(p.teacherShare)} / NĐ {pct(p.platformShare)}
                          </span>
                          <span className="tcp-history-date">{formatDate(p.createdAt)}</span>
                        </div>
                        <div className="tcp-history-item__right">
                          <span
                            className="tcp-status-badge"
                            style={{ '--badge-color': STATUS_COLORS[p.status] } as React.CSSProperties}
                          >
                            {p.status === 'PENDING'  && <Clock size={11} />}
                            {p.status === 'APPROVED' && <CheckCircle2 size={11} />}
                            {p.status === 'REJECTED' && <XCircle size={11} />}
                            {STATUS_LABELS[p.status]}
                          </span>
                          {p.adminNote && (
                            <span className="tcp-admin-note" title={p.adminNote}>
                              "{p.adminNote.length > 40 ? p.adminNote.slice(0, 40) + '…' : p.adminNote}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="tcp-pagination">
                      <button
                        className="tcp-page-btn"
                        disabled={historyPage === 0}
                        onClick={() => setHistoryPage(p => p - 1)}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <span>{historyPage + 1} / {totalPages}</span>
                      <button
                        className="tcp-page-btn"
                        disabled={historyPage >= totalPages - 1}
                        onClick={() => setHistoryPage(p => p + 1)}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCommissionPage;
