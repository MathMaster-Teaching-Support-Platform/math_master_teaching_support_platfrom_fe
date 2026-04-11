import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Globe,
  MapPin,
  Scan,
  Search,
  UserCheck,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { mockAdmin } from '../../data/mockData';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import type { ProfileStatus, TeacherProfile, OcrComparisonResult } from '../../types';
import './ReviewProfiles.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getInitials(name: string | null | undefined) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
function getSubmitLabel(submitting: boolean, action: 'APPROVED' | 'REJECTED' | null) {
  if (submitting) return 'Đang xử lý...';
  if (action === 'APPROVED') return 'Xác nhận phê duyệt';
  return 'Xác nhận từ chối';
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: ProfileStatus }> = ({ status }) => {
  const map: Record<ProfileStatus, { label: string; cls: string }> = {
    PENDING: { label: 'Đang chờ', cls: 'badge--pending' },
    APPROVED: { label: 'Đã duyệt', cls: 'badge--approved' },
    REJECTED: { label: 'Từ chối', cls: 'badge--rejected' },
  };
  const { label, cls } = map[status];
  return <span className={`rp-badge ${cls}`}>{label}</span>;
};

// ── RowSkeleton ───────────────────────────────────────────────────────────────
const SKELETON_KEYS = Array.from({ length: 10 }, (_, i) => `skel-${i}`);
const RowSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <>
    {SKELETON_KEYS.slice(0, count).map((key) => (
      <div key={key} className="rp-row rp-row--skeleton">
        <div className="rp-skel rp-skel--avatar" />
        <div className="rp-row-main">
          <div className="rp-skel rp-skel--line" style={{ width: '40%' }} />
          <div className="rp-skel rp-skel--line" style={{ width: '62%', marginTop: 6 }} />
        </div>
        <div className="rp-skel rp-skel--badge" />
      </div>
    ))}
  </>
);

// ── Main Component ────────────────────────────────────────────────────────────
const ReviewProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ProfileStatus>('PENDING');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [search, setSearch] = useState('');

  const [selectedProfile, setSelectedProfile] = useState<TeacherProfile | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // OCR verification states
  const [ocrVerifying, setOcrVerifying] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OcrComparisonResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await TeacherProfileService.getProfilesByStatus(currentStatus, page, 10);
      setProfiles(res.result.content);
      setTotalPages(res.result.totalPages);
      setTotalElements(res.result.totalElements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [currentStatus, page]);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await TeacherProfileService.countPendingProfiles();
      setPendingCount(res.result);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    loadPendingCount();
  }, [loadProfiles, loadPendingCount]);

  const handleStatusChange = (status: ProfileStatus) => {
    if (currentStatus === status) return;
    setCurrentStatus(status);
    setPage(0);
    setSelectedProfile(null);
    setSearch('');
  };

  const handleSelectProfile = (profile: TeacherProfile) => {
    setSelectedProfile(profile);
    setReviewAction(null);
    setAdminComment('');
    setOcrResult(null);
    setOcrError(null);
    setOcrProgress(0);
  };

  const handleReviewSubmit = async () => {
    if (!selectedProfile || !reviewAction) return;
    setSubmitting(true);
    try {
      await TeacherProfileService.reviewProfile(selectedProfile.id, {
        status: reviewAction,
        adminComment: adminComment.trim() || undefined,
      });
      await loadProfiles();
      await loadPendingCount();
      setSelectedProfile(null);
      showToast(
        `Hồ sơ đã được ${reviewAction === 'APPROVED' ? 'phê duyệt' : 'từ chối'} thành công!`,
        'success'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (profileId: string) => {
    try {
      const res = await TeacherProfileService.getDownloadUrl(profileId);
      if (res.result) window.open(res.result as string, '_blank');
    } catch {
      showToast('Không thể lấy link tải hồ sơ', 'error');
    }
  };

  const handleOcrVerify = async () => {
    if (!selectedProfile) return;
    
    setOcrVerifying(true);
    setOcrError(null);
    setOcrResult(null);
    setOcrProgress(0);

    try {
      // Start OCR job
      const jobResponse = await TeacherProfileService.verifyProfileWithOcr(selectedProfile.id);
      const jobId = jobResponse.result.jobId;

      // Poll until complete
      const result = await TeacherProfileService.pollOcrJobUntilComplete(
        jobId,
        (progress, status) => {
          setOcrProgress(progress);
          console.log(`OCR Progress: ${progress}% - Status: ${status}`);
        }
      );

      setOcrResult(result);
      setOcrProgress(100);
      showToast('Xác minh OCR hoàn tất!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Xác minh OCR thất bại';
      setOcrError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setOcrVerifying(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.fullName?.toLowerCase() || '').includes(q) ||
      (p.userName?.toLowerCase() || '').includes(q) ||
      (p.schoolName?.toLowerCase() || '').includes(q)
    );
  });

  const tabs: { status: ProfileStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'PENDING', label: 'Đang chờ', icon: <Clock size={13} /> },
    { status: 'APPROVED', label: 'Đã duyệt', icon: <CheckCircle2 size={13} /> },
    { status: 'REJECTED', label: 'Từ chối', icon: <XCircle size={13} /> },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={pendingCount}
    >
      <div className="rp">
        {/* ── Header ── */}
        <header className="rp-header">
          <div>
            <h1 className="rp-title">Duyệt hồ sơ giáo viên</h1>
            <p className="rp-subtitle">
              {pendingCount > 0
                ? `${pendingCount} hồ sơ đang chờ xem xét`
                : 'Không có hồ sơ nào đang chờ'}
            </p>
          </div>
        </header>

        {/* ── Filter Tabs ── */}
        <div className="rp-tabs">
          {tabs.map(({ status, label, icon }) => (
            <button
              key={status}
              className={`rp-tab${currentStatus === status ? ' rp-tab--active' : ''}`}
              onClick={() => handleStatusChange(status)}
            >
              {icon}
              {label}
              {status === 'PENDING' && pendingCount > 0 && (
                <span className="rp-tab-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {error && <div className="rp-error">{error}</div>}

        {/* ── Split Layout ── */}
        <div className="rp-body">
          {/* Left: List */}
          <section className="rp-list">
            {/* Search */}
            <div className="rp-search-wrap">
              <Search size={14} className="rp-search-icon" />
              <input
                className="rp-search-input"
                placeholder="Tìm theo tên, username, trường..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {!loading && (
              <p className="rp-list-count">
                {filteredProfiles.length} / {totalElements} hồ sơ
              </p>
            )}

            <div className="rp-items">
              {loading && <RowSkeleton count={7} />}
              {!loading && filteredProfiles.length === 0 && (
                <div className="rp-empty">
                  <p>Không tìm thấy hồ sơ nào.</p>
                </div>
              )}
              {!loading &&
                filteredProfiles.length > 0 &&
                filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    className={`rp-row${selectedProfile?.id === profile.id ? ' rp-row--active' : ''}`}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <div className="rp-row-avatar">{getInitials(profile.fullName)}</div>
                    <div className="rp-row-main">
                      <span className="rp-row-name">{profile.fullName}</span>
                      <span className="rp-row-sub">
                        {profile.schoolName} · {profile.position}
                      </span>
                      <span className="rp-row-date">{formatDate(profile.createdAt)}</span>
                    </div>
                    <StatusBadge status={profile.status} />
                  </button>
                ))}
            </div>

            {totalPages > 1 && !loading && (
              <footer className="rp-pagination">
                <button
                  className="rp-page-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="rp-pagination-info">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="rp-page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </footer>
            )}
          </section>

          {/* Right: Detail Panel */}
          <aside className="rp-detail">
            {selectedProfile ? (
              <>
                {/* Profile header */}
                <div className="rpd-header">
                  <div className="rpd-avatar">{getInitials(selectedProfile.fullName)}</div>
                  <div className="rpd-header-info">
                    <h2 className="rpd-name">{selectedProfile.fullName}</h2>
                    <p className="rpd-username">@{selectedProfile.userName}</p>
                    <StatusBadge status={selectedProfile.status} />
                  </div>
                  <button className="rpd-close" onClick={() => setSelectedProfile(null)}>
                    <X size={15} />
                  </button>
                </div>

                <div className="rpd-body">
                  {/* Professional info */}
                  <section className="rpd-section">
                    <h3 className="rpd-section-title">
                      <Building2 size={12} /> Thông tin chuyên môn
                    </h3>
                    <div className="rpd-rows">
                      <div className="rpd-row">
                        <span className="rpd-row-label">Trường</span>
                        <span className="rpd-row-value">{selectedProfile.schoolName}</span>
                      </div>
                      <div className="rpd-row">
                        <span className="rpd-row-label">Chức vụ</span>
                        <span className="rpd-row-value">{selectedProfile.position}</span>
                      </div>
                      {selectedProfile.schoolAddress && (
                        <div className="rpd-row">
                          <span className="rpd-row-label">
                            <MapPin size={11} /> Địa chỉ
                          </span>
                          <span className="rpd-row-value">{selectedProfile.schoolAddress}</span>
                        </div>
                      )}
                      {selectedProfile.schoolWebsite && (
                        <div className="rpd-row">
                          <span className="rpd-row-label">
                            <Globe size={11} /> Website
                          </span>
                          <a
                            href={selectedProfile.schoolWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rpd-link"
                          >
                            {selectedProfile.schoolWebsite}
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Description */}
                  {selectedProfile.description && (
                    <section className="rpd-section">
                      <h3 className="rpd-section-title">
                        <FileText size={12} /> Giới thiệu
                      </h3>
                      <p className="rpd-description">{selectedProfile.description}</p>
                    </section>
                  )}

                  {/* Timestamps */}
                  <section className="rpd-section">
                    <h3 className="rpd-section-title">Mốc thời gian</h3>
                    <div className="rpd-rows">
                      <div className="rpd-row">
                        <span className="rpd-row-label">Ngày nộp</span>
                        <span className="rpd-row-value">
                          {formatDateTime(selectedProfile.createdAt)}
                        </span>
                      </div>
                      {selectedProfile.reviewedAt && (
                        <>
                          <div className="rpd-row">
                            <span className="rpd-row-label">Ngày duyệt</span>
                            <span className="rpd-row-value">
                              {formatDateTime(selectedProfile.reviewedAt)}
                            </span>
                          </div>
                          <div className="rpd-row">
                            <span className="rpd-row-label">Người duyệt</span>
                            <span className="rpd-row-value">{selectedProfile.reviewedByName}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Admin comment (existing) */}
                  {selectedProfile.adminComment && (
                    <section className="rpd-section">
                      <h3 className="rpd-section-title">Ghi chú quản trị</h3>
                      <p className="rpd-admin-note">{selectedProfile.adminComment}</p>
                    </section>
                  )}

                  {/* Documents */}
                  <button
                    className="rpd-download-btn"
                    onClick={() => handleDownload(selectedProfile.id)}
                  >
                    <Download size={14} />
                    Tải hồ sơ xác minh
                  </button>

                  {/* OCR Verification */}
                  {selectedProfile.status === 'PENDING' && (
                    <section className="rpd-section">
                      <h3 className="rpd-section-title">
                        <Scan size={12} /> Xác minh OCR
                      </h3>
                      
                      <button
                        className="rpd-ocr-btn"
                        onClick={handleOcrVerify}
                        disabled={ocrVerifying}
                      >
                        <Scan size={14} />
                        {ocrVerifying ? `Đang xác minh... ${ocrProgress}%` : 'Xác minh với OCR'}
                      </button>

                      {ocrVerifying && (
                        <div className="rpd-ocr-progress">
                          <div className="rpd-ocr-progress-bar">
                            <div 
                              className="rpd-ocr-progress-fill" 
                              style={{ width: `${ocrProgress}%` }}
                            />
                          </div>
                          <p className="rpd-ocr-progress-text">{ocrProgress}%</p>
                        </div>
                      )}

                      {ocrError && (
                        <div className="rpd-ocr-error">
                          <XCircle size={14} />
                          {ocrError}
                        </div>
                      )}

                      {ocrResult && (
                        <div className="rpd-ocr-result">
                          <div className={`rpd-ocr-match ${ocrResult.isMatch ? 'rpd-ocr-match--yes' : 'rpd-ocr-match--no'}`}>
                            {ocrResult.isMatch ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            <span>
                              {ocrResult.isMatch ? 'Đạt yêu cầu' : 'Không đạt'} ({ocrResult.matchScore.toFixed(0)}%)
                            </span>
                          </div>
                          
                          <p className="rpd-ocr-summary">{ocrResult.summary}</p>
                          
                          <div className="rpd-ocr-fields">
                            <h4>🔴 3 Trường bắt buộc phải có:</h4>
                            {ocrResult.fieldComparisons.map((field, idx) => (
                              <div key={idx} className={`rpd-ocr-field ${field.matches ? '' : 'rpd-ocr-field--critical'}`}>
                                <div className="rpd-ocr-field-header">
                                  <span className="rpd-ocr-field-name">
                                    {idx === 0 && '1️⃣ Họ và tên'}
                                    {idx === 1 && '2️⃣ Chức danh + Chuyên môn Toán'}
                                    {idx === 2 && '3️⃣ Tên trường/Cơ sở giáo dục'}
                                  </span>
                                  <span className={`rpd-ocr-field-status ${field.matches ? 'rpd-ocr-field-status--match' : 'rpd-ocr-field-status--mismatch'}`}>
                                    {field.matches ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'}
                                  </span>
                                </div>
                                <div className="rpd-ocr-field-values">
                                  <div>
                                    <span className="rpd-ocr-field-label">Yêu cầu:</span>
                                    <span>{field.profileValue || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="rpd-ocr-field-label">OCR đọc được:</span>
                                    <span className={field.ocrValue ? '' : 'rpd-ocr-missing'}>
                                      {field.ocrValue || '⚠️ Không đọc được'}
                                    </span>
                                  </div>
                                  {field.notes && (
                                    <div className="rpd-ocr-field-notes">
                                      <span className="rpd-ocr-field-label">Ghi chú:</span>
                                      <span>{field.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Review actions — only for PENDING */}
                  {selectedProfile.status === 'PENDING' && (
                    <section className="rpd-actions">
                      <div className="rpd-action-btns">
                        <button
                          className={`rpd-approve${reviewAction === 'APPROVED' ? ' rpd-approve--active' : ''}`}
                          onClick={() =>
                            setReviewAction(reviewAction === 'APPROVED' ? null : 'APPROVED')
                          }
                        >
                          <UserCheck size={14} /> Phê duyệt
                        </button>
                        <button
                          className={`rpd-reject${reviewAction === 'REJECTED' ? ' rpd-reject--active' : ''}`}
                          onClick={() =>
                            setReviewAction(reviewAction === 'REJECTED' ? null : 'REJECTED')
                          }
                        >
                          <UserX size={14} /> Từ chối
                        </button>
                      </div>

                      {reviewAction && (
                        <div className="rpd-comment-wrap">
                          <textarea
                            className="rpd-textarea"
                            placeholder={`Ghi chú ${reviewAction === 'APPROVED' ? 'phê duyệt' : 'từ chối'} (tuỳ chọn)...`}
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            rows={3}
                            maxLength={1000}
                          />
                          <button
                            className={`rpd-submit ${reviewAction === 'APPROVED' ? 'rpd-submit--approve' : 'rpd-submit--reject'}`}
                            onClick={handleReviewSubmit}
                            disabled={submitting}
                          >
                            {getSubmitLabel(submitting, reviewAction)}
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </>
            ) : (
              <div className="rp-detail-empty">
                <div className="rp-detail-empty-icon">
                  <FileText size={26} />
                </div>
                <p>Chọn một hồ sơ để xem chi tiết</p>
              </div>
            )}
          </aside>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div className={`rp-toast rp-toast--${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {toast.message}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewProfiles;
