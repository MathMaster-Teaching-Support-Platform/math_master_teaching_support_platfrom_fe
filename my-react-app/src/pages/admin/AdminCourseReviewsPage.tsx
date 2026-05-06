import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  History,
  XCircle,
} from 'lucide-react';
import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import {
  useApproveCourseReview,
  useCourseReviewHistory,
  usePendingReviewCourses,
  useRejectCourseReview,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import type { CourseResponse } from '../../types';
import '../courses/TeacherCourses.css';
import './AdminCourseReviewsPage.css';

const PAGE_SIZE = 10;

const PROVIDER_LABELS: Record<string, string> = {
  MINISTRY: 'Bộ GD&ĐT',
  CUSTOM: 'Tùy chỉnh',
};

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  DRAFT: 'Bản nháp',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: 'course-badge badge-review',
  PUBLISHED: 'course-badge badge-live',
  REJECTED: 'course-badge badge-rejected',
  DRAFT: 'course-badge badge-draft',
};

function pickTotalElements(data: { result?: { totalElements?: number } } | undefined): number {
  return data?.result?.totalElements ?? 0;
}

// ─── Pending Tab ──────────────────────────────────────────────────────────────
function PendingTab({
  page,
  onPageChange,
  isLoading,
  isError,
  refetch,
  courses,
  totalPages,
}: Readonly<{
  page: number;
  onPageChange: (p: number) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  courses: CourseResponse[];
  totalPages: number;
}>) {
  const { showToast } = useToast();
  const [rejectCourseId, setRejectCourseId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  const approveMutation = useApproveCourseReview();
  const rejectMutation = useRejectCourseReview();

  const approvingId =
    approveMutation.isPending && typeof approveMutation.variables === 'string'
      ? approveMutation.variables
      : null;
  const rejectingId =
    rejectMutation.isPending && rejectMutation.variables ? rejectMutation.variables.courseId : null;

  const onApprove = (courseId: string) => {
    approveMutation.mutate(courseId, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã duyệt và công khai khóa học.' });
        refetch();
      },
      onError: (err: unknown) => {
        showToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể duyệt khóa học.',
        });
      },
    });
  };

  const onReject = () => {
    if (!rejectCourseId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showToast({ type: 'error', message: 'Vui lòng nhập lý do từ chối.' });
      return;
    }
    rejectMutation.mutate(
      { courseId: rejectCourseId, data: { reason } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã từ chối khóa học.' });
          setRejectCourseId(null);
          setRejectReason('');
          refetch();
        },
        onError: (err: unknown) => {
          showToast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Không thể từ chối khóa học.',
          });
        },
      }
    );
  };

  if (isError) {
    return (
      <div className="empty">
        <AlertCircle size={28} style={{ opacity: 0.55, color: 'var(--mod-danger)' }} />
        <p>Không thể tải danh sách chờ duyệt. Vui lòng thử lại.</p>
        <button type="button" className="btn secondary" onClick={() => refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="course-review-skeleton" aria-busy="true" aria-label="Đang tải">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="course-review-skeleton__row">
            <div className="course-review-skeleton__cell course-review-skeleton__cell--lg" />
            <div className="course-review-skeleton__cell" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--sm" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--sm" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--actions" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="empty">
        <Clock3 size={32} style={{ opacity: 0.35 }} />
        <p>Không có khóa học nào đang chờ duyệt.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tên khóa học</th>
              <th>Giảng viên</th>
              <th>Loại</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                actions={
                  <div className="course-review-actions">
                    <a
                      className="btn secondary course-review-actions__btn"
                      href={`/admin/courses/${course.id}/review`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye size={15} strokeWidth={2} />
                      Xem nội dung
                    </a>
                    <button
                      type="button"
                      className="btn btn--feat-emerald course-review-actions__btn"
                      onClick={() => onApprove(course.id)}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <CheckCircle2 size={15} strokeWidth={2} />
                      {approvingId === course.id ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                    <button
                      type="button"
                      className="btn danger course-review-actions__btn"
                      onClick={() => {
                        setRejectCourseId(course.id);
                        setRejectReason('');
                      }}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <XCircle size={15} strokeWidth={2} />
                      Từ chối
                    </button>
                  </div>
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />

      <AnimatePresence>
        {rejectCourseId && (
          <motion.div
            className="course-review-modal-root"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              className="course-review-modal-backdrop"
              aria-label="Đóng"
              onClick={() => setRejectCourseId(null)}
            />
            <div
              className="course-review-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="course-review-reject-title"
            >
              <h2 id="course-review-reject-title">Từ chối khóa học</h2>
              <p>Nhập lý do để giáo viên chỉnh sửa và gửi lại.</p>
              <textarea
                className="textarea course-review-modal__textarea"
                rows={5}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Nội dung khóa học chưa đủ rõ ràng ở phần mục tiêu học tập..."
              />
              <div className="course-review-modal__actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setRejectCourseId(null);
                    setRejectReason('');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={onReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HistoryTabBody({
  isLoading,
  courses,
  page,
  totalPages,
  onPageChange,
}: Readonly<{
  isLoading: boolean;
  courses: CourseResponse[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}>) {
  if (isLoading) {
    return (
      <div className="course-review-skeleton" aria-busy="true" aria-label="Đang tải">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="course-review-skeleton__row">
            <div className="course-review-skeleton__cell course-review-skeleton__cell--lg" />
            <div className="course-review-skeleton__cell" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--sm" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--sm" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--sm" />
            <div className="course-review-skeleton__cell course-review-skeleton__cell--actions" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="empty">
        <History size={32} style={{ opacity: 0.35 }} />
        <p>Không có khóa học nào khớp bộ lọc.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tên khóa học</th>
              <th>Giảng viên</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                showStatus
                actions={
                  <a
                    className="btn secondary course-review-actions__btn"
                    href={`/admin/courses/${course.id}/review`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye size={15} strokeWidth={2} />
                    Xem nội dung
                  </a>
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({
  page,
  onPageChange,
  status,
  onStatusChange,
  isLoading,
  isError,
  refetch,
  courses,
  totalPages,
}: Readonly<{
  page: number;
  onPageChange: (p: number) => void;
  status: string;
  onStatusChange: (s: string) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  courses: CourseResponse[];
  totalPages: number;
}>) {
  if (isError) {
    return (
      <div className="empty">
        <AlertCircle size={28} style={{ opacity: 0.55, color: 'var(--mod-danger)' }} />
        <p>Không thể tải lịch sử duyệt. Vui lòng thử lại.</p>
        <button type="button" className="btn secondary" onClick={() => refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="toolbar course-review-history-toolbar">
        <span className="course-review-filter-label">Trạng thái</span>
        <div className="pill-group" role="tablist" aria-label="Lọc theo trạng thái">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              className={`pill-btn${status === key ? ' active' : ''}`}
              onClick={() => onStatusChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <HistoryTabBody
        isLoading={isLoading}
        courses={courses}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function CourseRow({
  course,
  actions,
  showStatus = false,
}: Readonly<{
  course: CourseResponse;
  actions: React.ReactNode;
  showStatus?: boolean;
}>) {
  return (
    <tr>
      <td>
        <div className="course-review-title-cell">
          <strong className="course-review-title">{course.title}</strong>
          {course.rejectionReason && (
            <span className="course-review-rejection" title={course.rejectionReason}>
              Lý do: {course.rejectionReason}
            </span>
          )}
        </div>
      </td>
      <td>{course.teacherName ?? '—'}</td>
      <td>{PROVIDER_LABELS[course.provider] ?? course.provider}</td>
      {showStatus && (
        <td>
          <span className={STATUS_BADGE[course.status ?? ''] ?? 'course-badge badge-draft'}>
            {STATUS_LABELS[course.status ?? ''] ?? course.status}
          </span>
        </td>
      )}
      <td className="course-review-meta-date">
        {new Date(course.updatedAt ?? course.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td>{actions}</td>
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: Readonly<{
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}>) {
  const safeTotal = Math.max(totalPages, 1);
  return (
    <div className="courses-pagination">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Trước
      </button>
      <span className="pagination-info">
        Trang <strong>{page + 1}</strong> / {safeTotal}
      </span>
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.min(safeTotal - 1, page + 1))}
        disabled={page + 1 >= safeTotal}
      >
        Sau
        <ArrowRight size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const AdminCourseReviewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'history'>('pending');
  const [pendingPage, setPendingPage] = React.useState(0);
  const [historyPage, setHistoryPage] = React.useState(0);
  const [historyStatus, setHistoryStatus] = React.useState('ALL');

  const pendingQuery = usePendingReviewCourses(pendingPage, PAGE_SIZE);
  const historyQuery = useCourseReviewHistory(historyStatus, historyPage, PAGE_SIZE);

  const statAll = useCourseReviewHistory('ALL', 0, 1);
  const statPublished = useCourseReviewHistory('PUBLISHED', 0, 1);
  const statDraft = useCourseReviewHistory('DRAFT', 0, 1);

  const pendingPageData = pendingQuery.data?.result;
  const coursesPending = pendingPageData?.content ?? [];
  const totalPagesPending = pendingPageData?.totalPages ?? 1;
  const pendingTotal = pickTotalElements(pendingQuery.data);

  const historyPageData = historyQuery.data?.result;
  const coursesHistory = historyPageData?.content ?? [];
  const totalPagesHistory = historyPageData?.totalPages ?? 1;
  const historyListTotal = pickTotalElements(historyQuery.data);

  const handleStatusChange = (s: string) => {
    setHistoryStatus(s);
    setHistoryPage(0);
  };

  const handleTab = (tab: 'pending' | 'history') => {
    setActiveTab(tab);
  };

  const chipCount = activeTab === 'pending' ? pendingTotal : historyListTotal;

  return (
    <DashboardLayout
      role="admin"
      user={{ name: 'Admin', avatar: '', role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page admin-course-reviews-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Duyệt khóa học</h2>
                {!pendingQuery.isPending && !historyQuery.isPending && (
                  <span className="count-chip">{chipCount}</span>
                )}
              </div>
              <p className="header-sub">
                {pendingTotal} chờ xử lý • {pickTotalElements(statAll.data)} trong lịch sử
              </p>
            </div>
          </header>

          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap" aria-hidden="true">
                <Clock3 size={20} />
              </div>
              <div>
                <h3>{pendingQuery.isPending && !pendingQuery.data ? '…' : pendingTotal}</h3>
                <p>Chờ duyệt</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap" aria-hidden="true">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>
                  {statPublished.isPending && !statPublished.data
                    ? '…'
                    : pickTotalElements(statPublished.data)}
                </h3>
                <p>Đã công khai</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap" aria-hidden="true">
                <FileText size={20} />
              </div>
              <div>
                <h3>
                  {statDraft.isPending && !statDraft.data ? '…' : pickTotalElements(statDraft.data)}
                </h3>
                <p>Bản nháp (lịch sử)</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap" aria-hidden="true">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3>
                  {statAll.isPending && !statAll.data ? '…' : pickTotalElements(statAll.data)}
                </h3>
                <p>Tổng lịch sử</p>
              </div>
            </div>
          </div>

          <div className="toolbar">
            <div className="pill-group" role="tablist" aria-label="Chế độ xem">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pending'}
                className={`pill-btn${activeTab === 'pending' ? ' active' : ''}`}
                onClick={() => handleTab('pending')}
              >
                <Clock3 size={15} strokeWidth={2} />
                Chờ duyệt
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                className={`pill-btn${activeTab === 'history' ? ' active' : ''}`}
                onClick={() => handleTab('history')}
              >
                <History size={15} strokeWidth={2} />
                Lịch sử duyệt
              </button>
            </div>
            <div className="row course-review-toolbar-hint" style={{ marginLeft: 'auto' }}>
              <span className="meta-item">
                <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
                Xem nội dung mở tab mới để đối chiếu trước khi phê duyệt.
              </span>
            </div>
          </div>

          {!pendingQuery.isPending && !historyQuery.isPending && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Hiển thị</span>
                <strong className="summary-value">
                  {activeTab === 'pending' ? coursesPending.length : coursesHistory.length} /{' '}
                  {activeTab === 'pending' ? pendingTotal : historyListTotal}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Chờ duyệt</span>
                <strong className="summary-value">{pendingTotal}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Bản nháp (lịch sử)</span>
                <strong className="summary-value">{pickTotalElements(statDraft.data)}</strong>
              </div>
            </div>
          )}

          <div className="course-review-tab-shell">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                role="tabpanel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="course-review-tab-panel"
              >
                {activeTab === 'pending' ? (
                  <PendingTab
                    page={pendingPage}
                    onPageChange={setPendingPage}
                    isLoading={pendingQuery.isPending}
                    isError={pendingQuery.isError}
                    refetch={() => {
                      pendingQuery.refetch().catch(() => {});
                    }}
                    courses={coursesPending}
                    totalPages={totalPagesPending}
                  />
                ) : (
                  <HistoryTab
                    page={historyPage}
                    onPageChange={setHistoryPage}
                    status={historyStatus}
                    onStatusChange={handleStatusChange}
                    isLoading={historyQuery.isPending}
                    isError={historyQuery.isError}
                    refetch={() => {
                      historyQuery.refetch().catch(() => {});
                    }}
                    courses={coursesHistory}
                    totalPages={totalPagesHistory}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseReviewsPage;
