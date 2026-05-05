import { useQuery } from '@tanstack/react-query';
import JSZip from 'jszip';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Image,
  Loader2,
  MapPin,
  Scan,
  Search,
  UserCheck,
  UserX,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { mockAdmin } from '../../data/mockData';
import { TeacherProfileService } from '../../services/api/teacher-profile.service';
import '../../styles/module-refactor.css';
import type { OcrComparisonResult, ProfileStatus, TeacherProfile } from '../../types';
import '../courses/TeacherCourses.css';
import './admin-mgmt-shell.css';
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

function toFriendlyVerificationText(text: string) {
  return text.replace(/\bOCR\b/gi, 'hệ thống').replace(/xác minh hệ thống/gi, 'xác minh tự động');
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
  const [searchParams] = useSearchParams();
  const focusProfileId = searchParams.get('profileId');

  const [currentStatus, setCurrentStatus] = useState<ProfileStatus>('PENDING');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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

  const [verificationImages, setVerificationImages] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const verificationUrlsRef = useRef<string[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const profilesQuery = useQuery({
    queryKey: ['teacher-profiles', currentStatus, page],
    queryFn: () => TeacherProfileService.getProfilesByStatus(currentStatus, page, 10),
    staleTime: 30_000,
  });
  const pendingCountQuery = useQuery({
    queryKey: ['teacher-profiles', 'pending-count'],
    queryFn: () => TeacherProfileService.countPendingProfiles(),
    staleTime: 30_000,
  });

  const profiles = profilesQuery.data?.result.content ?? [];
  const totalPages = profilesQuery.data?.result.totalPages ?? 0;
  const totalElements = profilesQuery.data?.result.totalElements ?? 0;
  const loading = profilesQuery.isLoading || profilesQuery.isFetching;
  const error = profilesQuery.error instanceof Error ? profilesQuery.error.message : null;
  const pendingCount = pendingCountQuery.data?.result ?? 0;

  // Auto-select profile when arriving from a notification link (?profileId=...)
  useEffect(() => {
    if (!focusProfileId || loading || profiles.length === 0) return;
    const match = profiles.find((p) => p.id === focusProfileId);
    if (match) {
      setSelectedProfile(match);
      setHighlightedId(focusProfileId);
      const timer = globalThis.setTimeout(() => setHighlightedId(null), 2500);
      return () => globalThis.clearTimeout(timer);
    }
  }, [focusProfileId, loading, profiles]);

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
    setPreviewIndex(null);
    setPreviewZoom(1);
  };

  const handleReviewSubmit = async () => {
    if (!selectedProfile || !reviewAction) return;
    setSubmitting(true);
    try {
      await TeacherProfileService.reviewProfile(selectedProfile.id, {
        status: reviewAction,
        adminComment: adminComment.trim() || undefined,
      });
      await Promise.all([profilesQuery.refetch(), pendingCountQuery.refetch()]);
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

  const cleanupVerificationImages = useCallback(() => {
    verificationUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    verificationUrlsRef.current = [];
  }, []);

  const extractImagesFromZip = useCallback(async (zipBlob: Blob) => {
    const zip = await JSZip.loadAsync(zipBlob);
    const imageFileNames = Object.keys(zip.files).filter((fileName) => {
      const entry = zip.files[fileName];
      if (entry.dir) return false;
      return /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName);
    });

    const extracted = await Promise.all(
      imageFileNames.map(async (fileName) => {
        const blob = await zip.files[fileName].async('blob');
        return {
          name: fileName.split('/').pop() || fileName,
          url: URL.createObjectURL(blob),
        };
      })
    );

    return extracted;
  }, []);

  const loadVerificationImages = useCallback(
    async (profile: TeacherProfile) => {
      cleanupVerificationImages();
      setVerificationImages([]);
      setVerificationError(null);
      setVerificationLoading(true);

      try {
        if (!profile.verificationDocumentKey) {
          throw new Error('Hồ sơ này chưa có ảnh xác minh');
        }

        const fileBlob = await TeacherProfileService.getVerificationDocumentBlob(profile.id);
        const contentType = fileBlob.type || '';
        const isZip =
          contentType.includes('zip') || fileBlob.type.includes('zip') || fileBlob.type === '';

        if (isZip) {
          const extracted = await extractImagesFromZip(fileBlob);
          if (extracted.length === 0) {
            throw new Error('ZIP không chứa ảnh hợp lệ');
          }
          verificationUrlsRef.current = extracted.map((image) => image.url);
          setVerificationImages(extracted);
        } else if (contentType.startsWith('image/') || fileBlob.type.startsWith('image/')) {
          const directUrl = URL.createObjectURL(fileBlob);
          verificationUrlsRef.current = [directUrl];
          setVerificationImages([
            {
              name: 'verification-image',
              url: directUrl,
            },
          ]);
        } else {
          throw new Error('Định dạng tài liệu xác minh không hỗ trợ xem trực tiếp');
        }
      } catch (err: unknown) {
        setVerificationError(
          err instanceof Error ? err.message : 'Không thể hiển thị ảnh xác minh'
        );
      } finally {
        setVerificationLoading(false);
      }
    },
    [cleanupVerificationImages, extractImagesFromZip]
  );

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewZoom(1);
  };

  const handleClosePreview = () => {
    setPreviewIndex(null);
    setPreviewZoom(1);
  };

  const handleNextPreview = () => {
    if (previewIndex === null || verificationImages.length === 0) return;
    setPreviewIndex((previewIndex + 1) % verificationImages.length);
    setPreviewZoom(1);
  };

  const handlePrevPreview = () => {
    if (previewIndex === null || verificationImages.length === 0) return;
    setPreviewIndex((previewIndex - 1 + verificationImages.length) % verificationImages.length);
    setPreviewZoom(1);
  };

  const handleZoomIn = () => {
    setPreviewZoom((z) => Math.min(z + 0.25, 3));
  };

  const handleZoomOut = () => {
    setPreviewZoom((z) => Math.max(z - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setPreviewZoom(1);
  };

  useEffect(() => {
    if (!selectedProfile) {
      cleanupVerificationImages();
      setVerificationImages([]);
      setVerificationError(null);
      setVerificationLoading(false);
      return;
    }

    loadVerificationImages(selectedProfile);

    return () => {
      cleanupVerificationImages();
    };
  }, [cleanupVerificationImages, loadVerificationImages, selectedProfile]);

  useEffect(() => {
    if (previewIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClosePreview();
      if (event.key === 'ArrowRight') handleNextPreview();
      if (event.key === 'ArrowLeft') handlePrevPreview();
      if (event.key === '+') handleZoomIn();
      if (event.key === '-') handleZoomOut();
      if (event.key === '0') handleZoomReset();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleClosePreview,
    handleNextPreview,
    handlePrevPreview,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    previewIndex,
  ]);

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
      showToast('Xác minh hồ sơ tự động hoàn tất!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Xác minh hồ sơ tự động thất bại';
      const friendlyError = toFriendlyVerificationText(errorMsg);
      setOcrError(friendlyError);
      showToast(friendlyError, 'error');
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
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-mgmt-shell admin-review-profiles-page">
        <div className="admin-mgmt-shell__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page admin-mgmt-shell__content admin-review-profiles-page__inner">
          <div className="rp">
            {/* ── Header ── */}
            <header className="page-header courses-header-row rp-page-header">
              <div className="header-stack">
                <h2 style={{ margin: 0 }}>Duyệt hồ sơ giáo viên</h2>
                <p className="header-sub">
                  {pendingCount > 0
                    ? `${pendingCount} hồ sơ đang chờ xem xét`
                    : 'Không có hồ sơ nào đang chờ'}
                </p>
              </div>
            </header>

            {/* ── Filter Tabs ── */}
            <nav
              className="toolbar admin-mgmt-toolbar rp-toolbar"
              aria-label="Lọc theo trạng thái hồ sơ"
            >
              <div className="pill-group" role="tablist">
                {tabs.map(({ status, label, icon }) => (
                  <button
                    type="button"
                    key={status}
                    role="tab"
                    aria-selected={currentStatus === status}
                    className={`pill-btn${currentStatus === status ? ' active' : ''}`}
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
            </nav>

            {error && <div className="rp-error">{error}</div>}

            {/* ── Split Layout ── */}
            <div className="rp-body">
              {/* Left: List */}
              <section className="rp-list">
                {/* Search */}
                <div className="rp-search-wrap rp-search-wrap--module">
                  <label className="search-box">
                    <span className="search-box__icon" aria-hidden="true">
                      <Search size={15} />
                    </span>
                    <input
                      type="search"
                      placeholder="Tìm theo tên, username, trường..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Tìm hồ sơ"
                    />
                    {search ? (
                      <button
                        type="button"
                        className="search-box__clear"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => setSearch('')}
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </label>
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
                        type="button"
                        key={profile.id}
                        className={`rp-row${selectedProfile?.id === profile.id ? ' rp-row--active' : ''}${highlightedId === profile.id ? ' rp-row--highlight' : ''}`}
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
                      type="button"
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
                      type="button"
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
                      <button
                        type="button"
                        className="rpd-close"
                        onClick={() => setSelectedProfile(null)}
                      >
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
                                <span className="rpd-row-value">
                                  {selectedProfile.reviewedByName}
                                </span>
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

                      {/* Verification images */}
                      <section className="rpd-section">
                        <h3 className="rpd-section-title">
                          <Image size={12} /> Ảnh thẻ xác minh
                        </h3>

                        {verificationLoading && (
                          <div className="rpd-verification-loading">
                            <Loader2 size={16} className="rpd-spin" />
                            Đang tải ảnh xác minh...
                          </div>
                        )}

                        {verificationError && !verificationLoading && (
                          <div className="rpd-verification-error">
                            <XCircle size={14} />
                            {verificationError}
                          </div>
                        )}

                        {!verificationLoading &&
                          !verificationError &&
                          verificationImages.length > 0 && (
                            <>
                              <div className="rpd-verification-hint">
                                Click ảnh để mở preview. Dùng mũi tên để xem nhanh nhiều ảnh.
                              </div>
                              <div className="rpd-image-grid">
                                {verificationImages.map((img, index) => (
                                  <button
                                    key={`${img.name}-${index}`}
                                    type="button"
                                    className="rpd-image-card"
                                    onClick={() => handleOpenPreview(index)}
                                  >
                                    <img src={img.url} alt={`Ảnh xác minh ${index + 1}`} />
                                    <span>Ảnh {index + 1}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                      </section>

                      {/* OCR Verification */}
                      {selectedProfile.status === 'PENDING' && (
                        <section className="rpd-section">
                          <h3 className="rpd-section-title">
                            <Scan size={12} /> Xác minh hồ sơ tự động
                          </h3>

                          <button
                            type="button"
                            className="rpd-ocr-btn"
                            onClick={handleOcrVerify}
                            disabled={ocrVerifying}
                          >
                            <Scan size={14} />
                            {ocrVerifying
                              ? `Đang xác minh... ${ocrProgress}%`
                              : 'Chạy xác minh tự động'}
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
                              <div
                                className={`rpd-ocr-match ${ocrResult.isMatch ? 'rpd-ocr-match--yes' : 'rpd-ocr-match--no'}`}
                              >
                                {ocrResult.isMatch ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <XCircle size={14} />
                                )}
                                <span>
                                  {ocrResult.isMatch ? 'Đạt yêu cầu' : 'Không đạt'} (
                                  {ocrResult.matchScore.toFixed(0)}%)
                                </span>
                              </div>

                              <p className="rpd-ocr-summary">
                                {toFriendlyVerificationText(ocrResult.summary)}
                              </p>

                              <div className="rpd-ocr-fields">
                                <h4>🔴 3 Trường bắt buộc phải có:</h4>
                                {ocrResult.fieldComparisons.map((field, idx) => (
                                  <div
                                    key={idx}
                                    className={`rpd-ocr-field ${field.matches ? '' : 'rpd-ocr-field--critical'}`}
                                  >
                                    <div className="rpd-ocr-field-header">
                                      <span className="rpd-ocr-field-name">
                                        {idx === 0 && '1️⃣ Họ và tên'}
                                        {idx === 1 && '2️⃣ Chức danh + Chuyên môn Toán'}
                                        {idx === 2 && '3️⃣ Tên trường/Cơ sở giáo dục'}
                                      </span>
                                      <span
                                        className={`rpd-ocr-field-status ${field.matches ? 'rpd-ocr-field-status--match' : 'rpd-ocr-field-status--mismatch'}`}
                                      >
                                        {field.matches ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'}
                                      </span>
                                    </div>
                                    <div className="rpd-ocr-field-values">
                                      <div>
                                        <span className="rpd-ocr-field-label">Yêu cầu:</span>
                                        <span>{field.profileValue || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="rpd-ocr-field-label">
                                          Hệ thống đọc được:
                                        </span>
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
                              type="button"
                              className={`rpd-approve${reviewAction === 'APPROVED' ? ' rpd-approve--active' : ''}`}
                              onClick={() =>
                                setReviewAction(reviewAction === 'APPROVED' ? null : 'APPROVED')
                              }
                            >
                              <UserCheck size={14} /> Phê duyệt
                            </button>
                            <button
                              type="button"
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
                                type="button"
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

            {previewIndex !== null && verificationImages[previewIndex] && (
              <div className="rp-lightbox" onClick={handleClosePreview}>
                <div className="rp-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={handleZoomOut} disabled={previewZoom <= 0.5}>
                    <ZoomOut size={14} />
                  </button>
                  <span>{Math.round(previewZoom * 100)}%</span>
                  <button type="button" onClick={handleZoomIn} disabled={previewZoom >= 3}>
                    <ZoomIn size={14} />
                  </button>
                  <button type="button" onClick={handleZoomReset}>
                    100%
                  </button>
                  <button type="button" onClick={handleClosePreview}>
                    <X size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  className="rp-lightbox-nav rp-lightbox-nav--prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPreview();
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="rp-lightbox-stage" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={verificationImages[previewIndex].url}
                    alt={verificationImages[previewIndex].name}
                    className="rp-lightbox-image"
                    style={{ transform: `scale(${previewZoom})` }}
                  />
                </div>

                <button
                  type="button"
                  className="rp-lightbox-nav rp-lightbox-nav--next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPreview();
                  }}
                >
                  <ChevronRight size={18} />
                </button>

                <div className="rp-lightbox-counter" onClick={(e) => e.stopPropagation()}>
                  {previewIndex + 1} / {verificationImages.length}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ReviewProfiles;
