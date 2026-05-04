import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Hourglass,
  ListChecks,
  RefreshCw,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useMyAssessments } from '../../hooks/useStudentAssessment';
import '../../styles/module-refactor.css';
import type { StudentAssessmentResponse } from '../../types/studentAssessment.types';
import './StudentAssessmentList.css';
import { UI_TEXT } from '../../constants/uiText';

const statusFilters = ['ALL', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED'] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusLabel: Record<string, string> = {
  ALL: 'Tất cả',
  UPCOMING: 'Sắp tới',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã hoàn thành',
};

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm',
  TEST: 'Kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập',
};

const statusBadgeClass: Record<string, string> = {
  UPCOMING: 'badge upcoming',
  IN_PROGRESS: 'badge in-progress',
  COMPLETED: 'badge completed',
};

const typeIconMap: Record<string, LucideIcon> = {
  QUIZ: ListChecks,
  TEST: ClipboardList,
  EXAM: GraduationCap,
  HOMEWORK: BookMarked,
};

export default function StudentAssessmentList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useMyAssessments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size: 20,
  });

  const totalPages = data?.result?.totalPages ?? 0;

  const filtered = useMemo(() => {
    const assessments = data?.result?.content ?? [];

    if (!search.trim()) return assessments;
    const q = search.toLowerCase();
    return assessments.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.result?.content, search]);

  const summary = useMemo(
    () => ({
      UPCOMING: filtered.filter((item) => item.studentStatus === 'UPCOMING').length,
      IN_PROGRESS: filtered.filter((item) => item.studentStatus === 'IN_PROGRESS').length,
      COMPLETED: filtered.filter((item) => item.studentStatus === 'COMPLETED').length,
    }),
    [filtered]
  );

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h1 className="ana-page-title">Bài kiểm tra</h1>
                {!isLoading && !isError && <span className="count-chip">{filtered.length}</span>}
              </div>
              <p className="sal-header-sub">Theo dõi tiến độ và kết quả các {UI_TEXT.QUIZ.toLowerCase()} của bạn</p>
            </div>
          </header>

          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder={`Tìm kiếm ${UI_TEXT.QUIZ.toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn ${statusFilter === item ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(item);
                    setPage(0);
                  }}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <button
              className="btn secondary"
              style={{ marginLeft: 'auto' }}
              onClick={() => void refetch()}
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="assessment-summary-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Tổng</span>
                <strong className="summary-value">{filtered.length}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--upcoming" />
                <span className="summary-label">Sắp tới</span>
                <strong className="summary-value">{summary.UPCOMING}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--progress" />
                <span className="summary-label">Đang làm</span>
                <strong className="summary-value">{summary.IN_PROGRESS}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-dot summary-dot--completed" />
                <span className="summary-label">Hoàn thành</span>
                <strong className="summary-value">{summary.COMPLETED}</strong>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="empty">
              <Hourglass size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>Đang tải danh sách {UI_TEXT.QUIZ.toLowerCase()}...</p>
            </div>
          )}

          {isError && (
            <div className="empty">
              <AlertCircle
                size={28}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger)' }}
              />
              <p>
                {error instanceof Error ? error.message : `Không thể tải danh sách ${UI_TEXT.QUIZ.toLowerCase()}`}
              </p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Chưa có {UI_TEXT.QUIZ.toLowerCase()} nào{search ? ` khớp với "${search}"` : ''}.</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onViewDetail={() => navigate(`/student/assessments/${assessment.id}`)}
                  onStart={() => navigate(`/student/assessments/${assessment.id}/take`)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function AssessmentCard({
  assessment,
  onViewDetail,
  onStart,
}: {
  readonly assessment: StudentAssessmentResponse;
  readonly onViewDetail: () => void;
  readonly onStart: () => void;
}) {
  const [navigating, setNavigating] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleViewDetail = () => {
    if (navigating) return;
    setNavigating(true);
    globalThis.setTimeout(() => onViewDetail(), 2400);
  };

  const handleStart = () => {
    if (starting) return;
    setStarting(true);
    globalThis.setTimeout(() => onStart(), 2400);
  };

  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const TypeIcon = typeIconMap[assessment.assessmentType] ?? FileText;
  const coverMod = assessment.studentStatus.toLowerCase().replace('_', '-');

  return (
    <article className="data-card sal-card">
      {/* ── Cover ── */}
      <div className={`sal-cover sal-cover--${coverMod}`}>
        <div className="sal-cover__overlay" />
        <span className="sal-cover__type-badge">
          {assessmentTypeLabel[assessment.assessmentType] ?? assessment.assessmentType}
        </span>
        <div className="sal-cover__icon">
          <TypeIcon size={42} strokeWidth={1.3} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="sal-card-body">
        <div className="sal-card-head">
          <span className={statusBadgeClass[assessment.studentStatus] ?? 'badge'}>
            {statusLabel[assessment.studentStatus] ?? assessment.studentStatus}
          </span>
        </div>

        <h3 className="sal-card__title">{assessment.title}</h3>
        {assessment.description && <p className="sal-card__desc">{assessment.description}</p>}

        <div className="sal-card-metrics">
          <span className="metric">
            <FileText size={11} />
            {assessment.totalQuestions} câu
          </span>
          {assessment.timeLimitMinutes && (
            <span className="metric">
              <Clock size={11} />
              {assessment.timeLimitMinutes} phút
            </span>
          )}
          {assessment.passingScore != null && (
            <span className="metric">
              <Trophy size={11} />
              Đạt: {assessment.passingScore}đ
            </span>
          )}
          {assessment.allowMultipleAttempts && (
            <span className="metric">
              <RefreshCw size={11} />
              {assessment.attemptNumber || 0}
              {assessment.maxAttempts ? `/${assessment.maxAttempts}` : ''} lần
            </span>
          )}
        </div>

        {dueDate && (
          <div className={`sal-due-date${isOverdue ? ' sal-due-date--overdue' : ''}`}>
            <CalendarClock size={12} />
            {isOverdue ? 'Quá hạn: ' : 'Hạn nộp: '}
            {dueDate.toLocaleString('vi-VN')}
          </div>
        )}

        <div className="sal-card-actions">
          <button
            className={`btn secondary${navigating ? ' btn--navigating' : ''}`}
            onClick={handleViewDetail}
            disabled={navigating}
          >
            {navigating ? (
              <span className="circle-loader">
                <svg width="18" height="18" viewBox="0 0 20 20">
                  <circle className="cl-track" cx="10" cy="10" r="9" />
                  <circle className="cl-fill" cx="10" cy="10" r="9" />
                </svg>
                Đang mở...
              </span>
            ) : (
              <>
                <BookOpen size={14} />
                Chi tiết
              </>
            )}
          </button>

          {assessment.canStart && (
            <StartButton
              starting={starting}
              isRetry={(assessment.attemptNumber || 0) > 0}
              onClick={handleStart}
            />
          )}

          {!assessment.canStart && assessment.cannotStartReason && (
            <span className="reason-note">{assessment.cannotStartReason}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function StartButton({
  starting,
  isRetry,
  onClick,
}: {
  readonly starting: boolean;
  readonly isRetry: boolean;
  readonly onClick: () => void;
}) {
  if (starting) {
    return (
      <button className="btn btn--navigating" disabled>
        <span className="circle-loader">
          <svg width="18" height="18" viewBox="0 0 20 20">
            <circle className="cl-track" cx="10" cy="10" r="9" />
            <circle className="cl-fill" cx="10" cy="10" r="9" />
          </svg>
          Đang mở...
        </span>
      </button>
    );
  }
  if (isRetry) {
    return (
      <button className="btn" onClick={onClick}>
        <RefreshCw size={14} /> Làm lại
      </button>
    );
  }
  return (
    <button className="btn" onClick={onClick}>
      Bắt đầu
    </button>
  );
}
