import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useToast } from '../../context/ToastContext';
import {
  useApproveCourseReview,
  useCourseDetail,
  useCourseStudents,
  useRejectCourseReview,
} from '../../hooks/useCourses';
import type { CourseResponse } from '../../types';
import '../courses/TeacherCourses.css';
import '../courses/tabs/CourseOverviewTab.css';
import '../courses/tabs/course-detail-tabs.css';

import CourseAssessmentsTab from '../courses/tabs/CourseAssessmentsTab.tsx';
import CourseLessonsTab from '../courses/tabs/CourseLessonsTab.tsx';
import CourseOverviewTab from '../courses/tabs/CourseOverviewTab.tsx';
import CourseReviewsTab from '../courses/tabs/CourseReviewsTab.tsx';
import CourseStudentsTab from '../courses/tabs/CourseStudentsTab.tsx';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students' | 'reviews';

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors shadow-sm';

const primaryApproveBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-45 disabled:pointer-events-none';

const dangerOutlineBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-rose-100 transition-colors disabled:opacity-45 disabled:pointer-events-none';

function formatViDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ course }: Readonly<{ course: CourseResponse }>) {
  const status = course.status;

  let cfg: { label: React.ReactNode; className: string };
  if (status === 'PENDING_REVIEW') {
    cfg = {
      label: (
        <>
          <CheckCircle2 size={12} strokeWidth={2.5} />
          Chờ duyệt
        </>
      ),
      className: 'bg-amber-50 text-amber-950 border-amber-200',
    };
  } else if (status === 'REJECTED') {
    cfg = {
      label: (
        <>
          <AlertCircle size={12} strokeWidth={2.5} />
          Bị từ chối
        </>
      ),
      className: 'bg-rose-50 text-rose-950 border-rose-200',
    };
  } else if (status === 'PUBLISHED') {
    cfg = {
      label: (
        <>
          <Eye size={12} strokeWidth={2.5} />
          Công khai
        </>
      ),
      className: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    };
  } else if (status === 'DRAFT') {
    cfg = {
      label: (
        <>
          <EyeOff size={12} strokeWidth={2.5} />
          Nháp
        </>
      ),
      className: 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]',
    };
  } else if (course.published) {
    cfg = {
      label: (
        <>
          <Eye size={12} strokeWidth={2.5} />
          Công khai
        </>
      ),
      className: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    };
  } else {
    cfg = {
      label: (
        <>
          <EyeOff size={12} strokeWidth={2.5} />
          Nháp
        </>
      ),
      className: 'bg-[#F5F4ED] text-[#5E5D59] border-[#E8E6DC]',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-[Be_Vietnam_Pro] text-[11px] font-semibold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

/** Loading overlay — Tailwind (aligned with admin review list / mindmaps) */
const CourseDetailLoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141413]/40 backdrop-blur-sm p-4"
    aria-busy="true"
  >
    <div
      className="rounded-2xl bg-white border border-[#E8E6DC] shadow-[0_20px_60px_rgba(20,20,19,0.12)] px-8 py-8 flex flex-col items-center gap-5 max-w-sm w-full"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-11 h-11 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin"
        aria-hidden="true"
      />
      <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] text-center leading-relaxed">
        {message}
      </p>
    </div>
  </div>
);

const AdminCourseReviewDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const { data: courseData, isLoading: loadingCourse, refetch } = useCourseDetail(courseId!);
  const { data: studentsData } = useCourseStudents(courseId!);
  const approveMutation = useApproveCourseReview();
  const rejectMutation = useRejectCourseReview();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const course = courseData?.result;
  const students = studentsData?.result?.content ?? [];

  let loadingMessage = '';
  if (loadingCourse) loadingMessage = 'Đang tải thông tin khóa học...';
  else if (approveMutation.isPending) loadingMessage = 'Đang duyệt khóa học...';
  else if (rejectMutation.isPending) loadingMessage = 'Đang từ chối khóa học...';
  const showLoadingPopup = Boolean(loadingMessage);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleApprove = () => {
    if (!course) return;
    approveMutation.mutate(course.id, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã duyệt và công khai khóa học.' });
        refetch();
        setTimeout(() => {
          window.close();
        }, 1500);
      },
      onError: (err: unknown) => {
        showToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể duyệt khóa học.',
        });
      },
    });
  };

  const handleReject = () => {
    if (!course) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showToast({ type: 'error', message: 'Vui lòng nhập lý do từ chối.' });
      return;
    }
    rejectMutation.mutate(
      { courseId: course.id, data: { reason } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã từ chối khóa học.' });
          setShowRejectModal(false);
          setRejectReason('');
          refetch();
          setTimeout(() => {
            window.close();
          }, 1500);
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

  if (loadingCourse) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: 'Admin', avatar: '', role: 'admin' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <CourseDetailLoadingOverlay message={loadingMessage} />
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: 'Admin', avatar: '', role: 'admin' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="px-6 py-16 lg:px-8 flex justify-center">
          <div className="max-w-md w-full rounded-2xl border border-[#E8E6DC] bg-white p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-[Playfair_Display] text-xl font-medium text-[#141413] mb-2">
              Không tìm thấy khóa học
            </h2>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-6">
              Khóa học có thể đã bị xóa hoặc bạn không có quyền xem.
            </p>
            <button type="button" className={secondaryBtn} onClick={() => navigate('/admin/courses/review')}>
              <ArrowLeft size={16} strokeWidth={2} />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: BookOpen },
    { id: 'lessons' as const, label: 'Bài học', icon: FileText, count: course.lessonsCount },
    { id: 'assessments' as const, label: UI_TEXT.QUIZ, icon: CheckCircle2 },
    { id: 'students' as const, label: 'Học viên', icon: Users, count: students.length },
    { id: 'reviews' as const, label: 'Đánh giá', icon: Star },
  ];

  const isPendingReview = course.status === 'PENDING_REVIEW';

  return (
    <DashboardLayout
      role="admin"
      user={{ name: 'Admin', avatar: '', role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="w-full min-w-0 px-4 py-8 sm:px-6 lg:px-8 pb-12">
        <div className="w-full min-w-0 max-w-none space-y-6">
          <div className="rounded-xl bg-[#FAF9F5]/80 border border-[#E8E6DC]/80 px-4 py-3">
            <CourseBreadcrumb
              homePath="/admin/courses/review"
              items={[
                { label: 'Duyệt khóa học', path: '/admin/courses/review' },
                { label: course.title },
              ]}
              courseTitle={course.title}
            />
          </div>

          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#E8E6DC] bg-white shadow-[0_2px_24px_rgba(20,20,19,0.06)] overflow-hidden"
          >
            <div
              className="h-1 w-full bg-gradient-to-r from-[#C96442] via-[#E07B39] to-[#6366F1]"
              aria-hidden="true"
            />

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={secondaryBtn} onClick={() => navigate('/admin/courses/review')}>
                      <ArrowLeft size={16} strokeWidth={2} />
                      Quay lại
                    </button>
                    <StatusBadge course={course} />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0 mt-0.5">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h1
                        className="font-[Playfair_Display] text-[clamp(1.35rem,3vw,1.85rem)] font-medium text-[#141413] leading-snug tracking-tight"
                        lang="vi"
                      >
                        {course.title}
                      </h1>
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
                        Xem xét nội dung và thông tin khóa học trước khi phê duyệt.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                      <GraduationCap size={14} className="text-[#87867F]" />
                      {course.subjectName} · Lớp {course.gradeLevel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                      <BookOpen size={14} className="text-[#87867F]" />
                      {course.lessonsCount} bài học
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DC] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                      <Users size={14} className="text-[#87867F]" />
                      {course.studentsCount} học viên
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] px-3 py-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#4338CA]">
                      GV: {course.teacherName ?? '—'}
                    </span>
                  </div>

                  {course.description && (
                    <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-relaxed border-l-2 border-[#C96442]/40 pl-4">
                      {course.description}
                    </p>
                  )}

                  {course.status === 'PUBLISHED' && course.approvedBy && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-emerald-950">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        Đã duyệt bởi {course.approvedBy}
                      </p>
                      {course.approvedAt && (
                        <p className="text-emerald-800/90 mt-1.5 text-[12px]">
                          {formatViDateTime(course.approvedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {course.status === 'REJECTED' && (
                    <div className="space-y-3">
                      {course.rejectionReason && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-[Be_Vietnam_Pro] text-[13px] text-rose-950">
                          <span className="font-semibold">Lý do từ chối: </span>
                          {course.rejectionReason}
                        </div>
                      )}
                      {course.rejectedBy && (
                        <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 font-[Be_Vietnam_Pro] text-[12px] text-rose-900">
                          <p className="font-semibold">Từ chối bởi {course.rejectedBy}</p>
                          {course.rejectedAt && (
                            <p className="text-rose-800/85 mt-1">{formatViDateTime(course.rejectedAt)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isPendingReview && (
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto lg:min-w-[200px] shrink-0">
                    <button
                      type="button"
                      className={`${primaryApproveBtn} w-full justify-center`}
                      onClick={handleApprove}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <CheckCircle2 size={18} strokeWidth={2} />
                      {approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt khóa học'}
                    </button>
                    <button
                      type="button"
                      className={`${dangerOutlineBtn} w-full justify-center`}
                      onClick={() => {
                        setShowRejectModal(true);
                        setRejectReason('');
                      }}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <XCircle size={18} strokeWidth={2} />
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.article>

          <div className="rounded-2xl border border-[#E8E6DC] bg-white overflow-hidden shadow-sm">
            <div
              className="flex flex-wrap gap-1 p-2 bg-[#F5F4ED] border-b border-[#E8E6DC]"
              role="tablist"
              aria-label="Nội dung khóa học"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-white text-[#141413] shadow-sm ring-1 ring-black/[0.04]'
                        : 'text-[#87867F] hover:text-[#5E5D59] hover:bg-white/60'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon size={15} strokeWidth={2} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                          active ? 'bg-[#C96442] text-white' : 'bg-[#E8E6DC] text-[#5E5D59]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5 md:p-7 bg-[#F5F4ED]/90 min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  role="tabpanel"
                  className="min-w-0 w-full overflow-x-auto"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === 'overview' && <CourseOverviewTab course={course} />}
                  {activeTab === 'lessons' && <CourseLessonsTab courseId={course.id} course={course} />}
                  {activeTab === 'assessments' && (
                    <CourseAssessmentsTab courseId={course.id} course={course} />
                  )}
                  {activeTab === 'students' && <CourseStudentsTab courseId={course.id} />}
                  {activeTab === 'reviews' && <CourseReviewsTab courseId={course.id} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            className="fixed inset-0 z-[110] bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
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
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-course-reject-title"
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
                id="admin-course-reject-title"
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
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-rose-700 transition-colors disabled:opacity-45"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLoadingPopup && !loadingCourse && <CourseDetailLoadingOverlay message={loadingMessage} />}
    </DashboardLayout>
  );
};

export default AdminCourseReviewDetail;
