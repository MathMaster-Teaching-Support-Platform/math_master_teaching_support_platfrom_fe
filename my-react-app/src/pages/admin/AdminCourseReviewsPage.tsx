import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  History,
  Network,
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
import type { CourseResponse } from '../../types';

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

const STATUS_BADGE_TW: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-900 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-900 border-rose-200',
  DRAFT: 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]',
};

function pickTotalElements(data: { result?: { totalElements?: number } } | undefined): number {
  return data?.result?.totalElements ?? 0;
}

const secondaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-45 disabled:pointer-events-none';

const primaryApproveBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-45 disabled:pointer-events-none';

const dangerBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-rose-100 transition-colors disabled:opacity-45 disabled:pointer-events-none';

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
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] text-center max-w-sm">
          Không thể tải danh sách chờ duyệt. Vui lòng thử lại.
        </p>
        <button type="button" className={secondaryBtn} onClick={() => refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3" aria-busy="true" aria-label="Đang tải">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-3.5 flex-[2] min-w-0 rounded-lg bg-[#EDE9E0] animate-pulse" />
            <div className="h-3.5 w-24 rounded-lg bg-[#EDE9E0] animate-pulse hidden sm:block" />
            <div className="h-3.5 w-16 rounded-lg bg-[#EDE9E0] animate-pulse hidden md:block" />
            <div className="h-3.5 w-20 rounded-lg bg-[#EDE9E0] animate-pulse hidden lg:block" />
            <div className="h-9 w-40 rounded-xl bg-[#EDE9E0] animate-pulse ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
          <Clock3 className="w-6 h-6 opacity-60" />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
          Không có khóa học nào đang chờ duyệt.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left font-[Be_Vietnam_Pro] text-[13px]">
          <thead>
            <tr className="border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide">
                Tên khóa học
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Giảng viên
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Loại
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Ngày tạo
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE6]">
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                actions={
                  <div className="flex flex-wrap justify-end gap-2">
                    <a
                      className={secondaryBtn}
                      href={`/admin/courses/${course.id}/review`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye size={14} strokeWidth={2} />
                      Xem nội dung
                    </a>
                    <button
                      type="button"
                      className={primaryApproveBtn}
                      onClick={() => onApprove(course.id)}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <CheckCircle2 size={14} strokeWidth={2} />
                      {approvingId === course.id ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                    <button
                      type="button"
                      className={dangerBtn}
                      onClick={() => {
                        setRejectCourseId(course.id);
                        setRejectReason('');
                      }}
                      disabled={approvingId === course.id || rejectingId === course.id}
                    >
                      <XCircle size={14} strokeWidth={2} />
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
            className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Đóng"
              onClick={() => setRejectCourseId(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="course-review-reject-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] shadow-[rgba(20,20,19,0.12)_0_22px_50px] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7" />
              </div>
              <h2
                id="course-review-reject-title"
                className="font-[Playfair_Display] text-[18px] font-medium text-[#141413] text-center"
              >
                Từ chối khóa học
              </h2>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2 text-center">
                Nhập lý do để giáo viên chỉnh sửa và gửi lại.
              </p>
              <textarea
                className="mt-4 w-full rounded-xl border border-[#DDD6C8] bg-[#FFFEFB] px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] resize-none"
                rows={5}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Nội dung khóa học chưa đủ rõ ràng ở phần mục tiêu học tập..."
              />
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  className={`flex-1 ${secondaryBtn}`}
                  onClick={() => {
                    setRejectCourseId(null);
                    setRejectReason('');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-rose-700 transition-colors disabled:opacity-45"
                  onClick={onReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </motion.div>
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
      <div className="p-4 space-y-3" aria-busy="true" aria-label="Đang tải">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-3.5 flex-[2] min-w-0 rounded-lg bg-[#EDE9E0] animate-pulse" />
            <div className="h-3.5 w-24 rounded-lg bg-[#EDE9E0] animate-pulse hidden sm:block" />
            <div className="h-3.5 w-16 rounded-lg bg-[#EDE9E0] animate-pulse hidden md:block" />
            <div className="h-3.5 w-20 rounded-lg bg-[#EDE9E0] animate-pulse hidden lg:block" />
            <div className="h-3.5 w-14 rounded-lg bg-[#EDE9E0] animate-pulse hidden lg:block" />
            <div className="h-9 w-36 rounded-xl bg-[#EDE9E0] animate-pulse ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
          <History className="w-6 h-6 opacity-60" />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
          Không có khóa học nào khớp bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left font-[Be_Vietnam_Pro] text-[13px]">
          <thead>
            <tr className="border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide">
                Tên khóa học
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Giảng viên
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Loại
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide whitespace-nowrap">
                Cập nhật
              </th>
              <th className="px-4 py-3 font-semibold text-[#5E5D59] text-[11px] uppercase tracking-wide text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE6]">
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                showStatus
                actions={
                  <div className="flex justify-end">
                    <a
                      className={secondaryBtn}
                      href={`/admin/courses/${course.id}/review`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye size={14} strokeWidth={2} />
                      Xem nội dung
                    </a>
                  </div>
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
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] text-center max-w-sm">
          Không thể tải lịch sử duyệt. Vui lòng thử lại.
        </p>
        <button type="button" className={secondaryBtn} onClick={() => refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 pt-4 pb-2 sm:flex-row sm:items-center sm:gap-3 border-b border-[#F0EEE6] bg-[#FAF9F5]/80">
        <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F] uppercase tracking-wide shrink-0">
          Trạng thái
        </span>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl w-fit max-w-full">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                status === key
                  ? 'bg-white text-[#141413] shadow-sm'
                  : 'text-[#87867F] hover:text-[#5E5D59]'
              }`}
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
  const badge =
    STATUS_BADGE_TW[course.status ?? ''] ?? 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]';

  return (
    <tr className="hover:bg-[#FAF9F5]/60 transition-colors">
      <td className="px-4 py-3 align-top">
        <div className="grid gap-1">
          <span className="font-semibold text-[#141413] leading-snug">{course.title}</span>
          {course.rejectionReason && (
            <span
              className="text-[12px] text-rose-700 truncate max-w-[min(320px,42vw)]"
              title={course.rejectionReason}
            >
              Lý do: {course.rejectionReason}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-[#5E5D59] whitespace-nowrap">{course.teacherName ?? '—'}</td>
      <td className="px-4 py-3 text-[#5E5D59] whitespace-nowrap">
        {PROVIDER_LABELS[course.provider] ?? course.provider}
      </td>
      {showStatus && (
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}
          >
            {STATUS_LABELS[course.status ?? ''] ?? course.status}
          </span>
        </td>
      )}
      <td className="px-4 py-3 text-[#87867F] text-[12px] whitespace-nowrap tabular-nums">
        {new Date(course.updatedAt ?? course.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td className="px-4 py-3 align-middle">{actions}</td>
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
    <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-4 border-t border-[#F0EEE6] bg-[#FAF9F5]/50">
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-35 disabled:pointer-events-none`}
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Trước
      </button>
      <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
        Trang <strong className="text-[#141413]">{page + 1}</strong> / {safeTotal}
      </span>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-35 disabled:pointer-events-none`}
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

  const statCards = [
    {
      label: 'Chờ duyệt',
      display: pendingQuery.isPending && !pendingQuery.data ? '…' : String(pendingTotal),
      Icon: Clock3,
      bg: 'bg-[#FFF7ED]',
      color: 'text-[#E07B39]',
    },
    {
      label: 'Đã công khai',
      display:
        statPublished.isPending && !statPublished.data
          ? '…'
          : String(pickTotalElements(statPublished.data)),
      Icon: CheckCircle2,
      bg: 'bg-[#ECFDF5]',
      color: 'text-[#2EAD7A]',
    },
    {
      label: 'Bản nháp (lịch sử)',
      display:
        statDraft.isPending && !statDraft.data ? '…' : String(pickTotalElements(statDraft.data)),
      Icon: FileText,
      bg: 'bg-[#F5F4ED]',
      color: 'text-[#9B6FE0]',
    },
    {
      label: 'Tổng lịch sử',
      display: statAll.isPending && !statAll.data ? '…' : String(pickTotalElements(statAll.data)),
      Icon: Network,
      bg: 'bg-[#EEF2FF]',
      color: 'text-[#4F7EF7]',
    },
  ] as const;

  return (
    <DashboardLayout
      role="admin"
      user={{ name: 'Admin', avatar: '', role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* Header — aligned with /teacher/mindmaps */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Duyệt khóa học
                  </h1>
                  {!pendingQuery.isPending && !historyQuery.isPending && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {chipCount}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {pendingTotal} chờ xử lý • {pickTotalElements(statAll.data)} trong lịch sử
                </p>
              </div>
            </div>
          </div>

          {/* Stats — same card rhythm as mindmaps */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, display, Icon, bg, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                    {display}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mode tabs — segmented control like mindmaps */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl w-fit max-w-full">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'pending'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 ${
                    activeTab === 'pending'
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                  onClick={() => handleTab('pending')}
                >
                  <Clock3 size={14} strokeWidth={2} />
                  Chờ duyệt
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 ${
                    activeTab === 'history'
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                  onClick={() => handleTab('history')}
                >
                  <History size={14} strokeWidth={2} />
                  Lịch sử duyệt
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <BookOpen size={16} className="text-[#87867F] shrink-0 mt-0.5" aria-hidden />
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59] leading-relaxed">
                <span className="text-[#87867F] uppercase tracking-wide font-semibold text-[11px] block mb-0.5">
                  Gợi ý
                </span>{' '}
                Xem nội dung mở tab mới để đối chiếu trước khi phê duyệt.
              </p>
            </div>
          </div>

          {/* Summary bar — mindmaps-style */}
          {!pendingQuery.isPending && !historyQuery.isPending && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                {activeTab === 'pending' ? coursesPending.length : coursesHistory.length} /{' '}
                {activeTab === 'pending' ? pendingTotal : historyListTotal}
              </strong>
              <div className="hidden sm:block w-px h-4 bg-[#E8E6DC]" />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Chờ duyệt <strong className="text-[#141413] font-semibold">{pendingTotal}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                <span>
                  Bản nháp (lịch sử){' '}
                  <strong className="text-[#141413] font-semibold">
                    {pickTotalElements(statDraft.data)}
                  </strong>
                </span>
              </span>
            </div>
          )}

          {/* Table shell */}
          <div className="rounded-2xl border border-[#E8E6DC] bg-white overflow-hidden shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                role="tabpanel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="min-h-[120px]"
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseReviewsPage;
