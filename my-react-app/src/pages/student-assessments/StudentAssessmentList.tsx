import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
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

  const serverTotal = data?.result?.totalElements;
  const headerCount =
    typeof serverTotal === 'number' && statusFilter === 'ALL' && !search.trim()
      ? serverTotal
      : filtered.length;
  const statsTotalDisplay =
    isLoading
      ? '…'
      : search.trim()
        ? filtered.length
        : typeof serverTotal === 'number'
          ? serverTotal
          : filtered.length;

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6 module-layout-container student-assessments-module">
          {/* ── Page header (aligned with /teacher/mindmaps) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <FileCheck2 className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Bài kiểm tra
                  </h1>
                  {!isLoading && !isError && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {headerCount}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  Theo dõi tiến độ và kết quả các {UI_TEXT.QUIZ.toLowerCase()} của bạn
                </p>
              </div>
            </div>
          </div>

          {/* ── Stats tiles ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                {
                  label: `Tổng ${UI_TEXT.QUIZ.toLowerCase()}`,
                  value: statsTotalDisplay,
                  Icon: ClipboardList,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Sắp tới',
                  value: isLoading ? '…' : summary.UPCOMING,
                  Icon: Hourglass,
                  bg: 'bg-[#EFF6FF]',
                  color: 'text-[#2563EB]',
                },
                {
                  label: 'Đang làm',
                  value: isLoading ? '…' : summary.IN_PROGRESS,
                  Icon: ListChecks,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
                },
                {
                  label: 'Hoàn thành',
                  value: isLoading ? '…' : summary.COMPLETED,
                  Icon: CheckCircle2,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
              ] as const
            ).map(({ label, value, Icon, bg, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3 min-h-[88px]"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none tabular-nums">
                    {value}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 truncate">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" aria-hidden />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                placeholder={`Tìm kiếm ${UI_TEXT.QUIZ.toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Xóa nội dung tìm kiếm"
                  className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                  onClick={() => setSearch('')}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </label>

            <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0 flex-wrap justify-center sm:justify-start">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    statusFilter === item
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors flex-shrink-0 sm:ml-auto"
              onClick={() => void refetch()}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Làm mới
            </button>
          </div>

          {/* ── Summary strip (compact, same vocabulary as mindmaps “Hiển thị”) ── */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] tabular-nums">
                {search.trim()
                  ? `${filtered.length} / ${(data?.result?.content ?? []).length}`
                  : filtered.length}
              </strong>
              <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" aria-hidden />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" aria-hidden />
                Sắp tới{' '}
                <strong className="text-[#141413] font-semibold tabular-nums">{summary.UPCOMING}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" aria-hidden />
                Đang làm{' '}
                <strong className="text-[#141413] font-semibold tabular-nums">
                  {summary.IN_PROGRESS}
                </strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" aria-hidden />
                Hoàn thành{' '}
                <strong className="text-[#141413] font-semibold tabular-nums">
                  {summary.COMPLETED}
                </strong>
              </span>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" aria-hidden />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md">
                {error instanceof Error ? error.message : `Không thể tải danh sách ${UI_TEXT.QUIZ.toLowerCase()}`}
              </p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <BookOpen className="w-6 h-6" aria-hidden />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center">
                Chưa có {UI_TEXT.QUIZ.toLowerCase()} nào{search ? ` khớp với "${search}"` : ''}.
              </p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {totalPages > 1 && !isLoading && !isError && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] tabular-nums">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </div>
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
    onViewDetail();
  };

  const handleStart = () => {
    if (starting) return;
    setStarting(true);
    onStart();
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
