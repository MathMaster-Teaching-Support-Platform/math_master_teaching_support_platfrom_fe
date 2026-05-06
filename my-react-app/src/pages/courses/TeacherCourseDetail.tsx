import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Pencil,
  Save,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useToast } from '../../context/ToastContext';
import {
  useCourseDetail,
  useCourseStudents,
  useDeleteCourse,
  usePublishCourse,
  useSubmitCourseForReview,
  useUpdateCourse,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import type { CourseLevel, CourseResponse, UpdateCourseRequest } from '../../types';
import './TeacherCourseDetail.css';
import './tabs/CourseOverviewTab.css';
import './tabs/course-detail-tabs.css';

// Import tab components
import CourseAssessmentsTab from './tabs/CourseAssessmentsTab.tsx';
import CourseLessonsTab from './tabs/CourseLessonsTab.tsx';
import CourseOverviewTab from './tabs/CourseOverviewTab.tsx';
import CourseReviewsTab from './tabs/CourseReviewsTab.tsx';
import CourseStudentsTab from './tabs/CourseStudentsTab.tsx';

type TabType = 'overview' | 'lessons' | 'assessments' | 'students' | 'reviews';

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors shadow-sm disabled:opacity-45 disabled:pointer-events-none';

const publishPrimaryBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 transition-colors shadow-sm disabled:opacity-45 disabled:pointer-events-none';

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

  let cfg: { label: ReactNode; className: string };
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
  } else if (status === 'ARCHIVED') {
    cfg = {
      label: (
        <>
          <BookOpen size={12} strokeWidth={2.5} />
          Đã lưu trữ
        </>
      ),
      className: 'bg-slate-100 text-slate-800 border-slate-200',
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

function CourseDetailLoadingOverlay({ message }: Readonly<{ message: string }>) {
  return (
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
}

const TeacherCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  const { data: courseData, isLoading: loadingCourse } = useCourseDetail(courseId!);
  const { data: studentsData } = useCourseStudents(courseId!);
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();
  const submitReviewMutation = useSubmitCourseForReview();
  const updateMutation = useUpdateCourse();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [editForm, setEditForm] = useState<UpdateCourseRequest>({
    whatYouWillLearn: '',
    requirements: '',
    targetAudience: '',
    originalPrice: 0,
    discountedPrice: 0,
    discountExpiryDate: '',
    level: 'ALL_LEVELS' as CourseLevel,
  });
  const [discountPercent, setDiscountPercent] = useState(0);

  const course = courseData?.result;
  const students = studentsData?.result?.content ?? [];

  const loadingMessage = loadingCourse
    ? `Đang tải cấu hình ${UI_TEXT.COURSE.toLowerCase()}...`
    : updateMutation.isPending
      ? `Đang lưu cấu hình ${UI_TEXT.COURSE.toLowerCase()}...`
      : publishMutation.isPending
        ? 'Đang cập nhật trạng thái công khai...'
        : submitReviewMutation.isPending
          ? `Đang gửi ${UI_TEXT.COURSE.toLowerCase()} lên hàng chờ duyệt...`
          : deleteMutation.isPending
            ? `Đang xóa ${UI_TEXT.COURSE.toLowerCase()}...`
            : '';
  const showMathLoadingPopup = Boolean(loadingMessage);

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title || '',
        description: course.description || '',
        subtitle: course.subtitle || '',
        language: course.language || '',
        whatYouWillLearn: course.whatYouWillLearn || '',
        requirements: course.requirements || '',
        targetAudience: course.targetAudience || '',
        originalPrice: course.originalPrice || 0,
        discountedPrice: course.discountedPrice || 0,
        discountExpiryDate: course.discountExpiryDate || '',
        level: (course.level as CourseLevel) || 'ALL_LEVELS',
      });
      if (course.originalPrice && course.discountedPrice) {
        setDiscountPercent(
          Math.round(((course.originalPrice - course.discountedPrice) / course.originalPrice) * 100)
        );
      }
    }
  }, [course]);

  const handleEditSubmit = () => {
    if (!course) return;
    updateMutation.mutate(
      { courseId: course.id, data: editForm },
      {
        onSuccess: () => setShowEditModal(false),
      }
    );
  };

  const handlePriceChange = (original: number, percent: number) => {
    const discounted = Math.round(original * (1 - percent / 100));
    setEditForm({ ...editForm, originalPrice: original, discountedPrice: discounted });
    setDiscountPercent(percent);
  };

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleTogglePublish = () => {
    if (!course) return;
    publishMutation.mutate({
      courseId: course.id,
      data: { published: !course.published },
    });
  };

  const handleSubmitForReview = () => {
    if (!course) return;
    submitReviewMutation.mutate(course.id, {
      onSuccess: () => {
        showToast({ type: 'success', message: 'Đã gửi khóa học lên hàng chờ duyệt.' });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Không thể gửi duyệt khóa học.';
        showToast({ type: 'error', message: msg });
      },
    });
  };

  const handleDelete = () => {
    if (!course) return;
    if (
      window.confirm(
        `Bạn có chắc muốn xóa ${UI_TEXT.COURSE.toLowerCase()} "${course.title}"? Hành động này không thể hoàn tác.`
      )
    ) {
      deleteMutation.mutate(course.id, {
        onSuccess: () => navigate('/teacher/courses'),
      });
    }
  };

  if (loadingCourse) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <CourseDetailLoadingOverlay message={loadingMessage} />
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
        contentClassName="dashboard-content--flush-bleed"
      >
        <div className="px-6 py-16 lg:px-8 flex justify-center">
          <div className="max-w-md w-full rounded-2xl border border-[#E8E6DC] bg-white p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-[Playfair_Display] text-xl font-medium text-[#141413] mb-2">
              Không tìm thấy {UI_TEXT.COURSE.toLowerCase()}
            </h2>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-6">
              {UI_TEXT.COURSE} có thể đã bị xóa hoặc bạn không có quyền xem.
            </p>
            <button type="button" className={secondaryBtn} onClick={() => navigate('/teacher/courses')}>
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
    { id: 'reviews' as const, label: 'Đánh giá', icon: Star, count: course.ratingCount },
  ];

  const isReviewShellPath = /\/teacher\/courses\/[^/]+\/review\/?$/.test(location.pathname);

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="w-full min-w-0 px-4 py-8 sm:px-6 lg:px-8 pb-12">
        <div className="w-full min-w-0 max-w-none space-y-6">
          <div className="rounded-xl bg-[#FAF9F5]/80 border border-[#E8E6DC]/80 px-4 py-3">
            <CourseBreadcrumb
              homePath="/teacher/courses"
              items={
                isReviewShellPath
                  ? [
                      {
                        label: course.title,
                        path: `/teacher/courses/${course.id}`,
                      },
                      { label: 'Quản lý khóa học' },
                    ]
                  : [{ label: course.title }]
              }
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
                    <button type="button" className={secondaryBtn} onClick={() => navigate('/teacher/courses')}>
                      <ArrowLeft size={16} strokeWidth={2} />
                      Quay lại
                    </button>
                    <StatusBadge course={course} />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h1
                        className="font-[Playfair_Display] text-[clamp(1.35rem,3vw,1.85rem)] font-medium text-[#141413] leading-snug tracking-tight"
                        lang="vi"
                      >
                        {course.title}
                      </h1>
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-1">
                        Quản lý nội dung, bài học và học viên — tab Tổng quan hiển thị hồ sơ và chỉ số
                        chính.
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

                <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[220px] shrink-0">
                  {!course.published && course.status !== 'PENDING_REVIEW' && (
                    <button
                      type="button"
                      className={`${secondaryBtn} w-full justify-center`}
                      onClick={handleSubmitForReview}
                      disabled={submitReviewMutation.isPending}
                    >
                      <CheckCircle2 size={18} strokeWidth={2} />
                      {submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${secondaryBtn} w-full justify-center`}
                    onClick={() => setShowEditModal(true)}
                    title={`Chỉnh sửa thông tin ${UI_TEXT.COURSE.toLowerCase()}`}
                  >
                    <Pencil size={18} strokeWidth={2} />
                    Chỉnh sửa
                  </button>
                  {course.published ? (
                    <button
                      type="button"
                      className={`${secondaryBtn} w-full justify-center`}
                      onClick={handleTogglePublish}
                      disabled={publishMutation.isPending}
                    >
                      <EyeOff size={18} strokeWidth={2} />
                      Ẩn {UI_TEXT.COURSE.toLowerCase()}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${publishPrimaryBtn} w-full justify-center`}
                      onClick={handleTogglePublish}
                      disabled={
                        publishMutation.isPending || (!course.published && course.status !== 'PUBLISHED')
                      }
                      title={
                        !course.published && course.status !== 'PUBLISHED'
                          ? 'Khóa học cần được admin duyệt trước khi công khai'
                          : undefined
                      }
                    >
                      <Eye size={18} strokeWidth={2} />
                      {publishMutation.isPending ? 'Đang cập nhật...' : 'Công khai'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${dangerOutlineBtn} w-full justify-center`}
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={18} strokeWidth={2} />
                    {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa khóa học'}
                  </button>
                </div>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay course-edit-modal-overlay" lang="vi">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className="modal-box wizard-modal-box course-edit-wizard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-edit-wizard-title"
          >
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon">
                  <Pencil size={18} />
                </div>
                <div>
                  <h2 id="course-edit-wizard-title">Chỉnh sửa {UI_TEXT.COURSE.toLowerCase()}</h2>
                  <p>Bước {editStep} trên 4</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                aria-label="Đóng"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="wizard-steps-indicator">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`wizard-step-item ${editStep === i ? 'active' : ''} ${editStep > i ? 'completed' : ''}`}
                >
                  <div className="wizard-step-circle">{editStep > i ? <Check size={18} /> : i}</div>
                  <span className="wizard-step-label">
                    {i === 1
                      ? 'Phân loại'
                      : i === 2
                        ? 'Chi tiết'
                        : i === 3
                          ? 'Tiếp thị'
                          : 'Định giá'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="modal-form">
              <div className="wizard-content-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={editStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="wizard-step-content"
                  >
                    {editStep === 1 && (
                      <div className="edit-step-1">
                        <div className="form-section-header">
                          <h3>Thông tin cơ bản</h3>
                          <p>
                            Cập nhật lại tiêu đề và mục tiêu chính của{' '}
                            {UI_TEXT.COURSE.toLowerCase()}.
                          </p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">
                            Tiêu đề {UI_TEXT.COURSE.toLowerCase()}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Phụ đề (Catchy subtitle)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.subtitle}
                            onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                            placeholder="Câu ngắn gọn thu hút học viên"
                          />
                        </div>
                      </div>
                    )}

                    {editStep === 2 && (
                      <div className="edit-step-2">
                        <div className="form-section-header">
                          <h3>Chi tiết nội dung</h3>
                          <p>Cập nhật ngôn ngữ và mô tả tổng quan của khóa học.</p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Ngôn ngữ</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.language}
                            onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                            placeholder="Ví dụ: Tiếng Việt"
                          />
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Mô tả tổng quát</label>
                          <textarea
                            rows={5}
                            className="form-input form-textarea"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            placeholder="Mô tả chi tiết về khóa học..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Cấp độ học</label>
                          <select
                            className="form-select"
                            value={editForm.level || 'ALL_LEVELS'}
                            onChange={(e) =>
                              setEditForm({ ...editForm, level: e.target.value as CourseLevel })
                            }
                          >
                            <option value="ALL_LEVELS">Mọi cấp độ</option>
                            <option value="BEGINNER">Cơ bản</option>
                            <option value="INTERMEDIATE">Trung bình</option>
                            <option value="ADVANCED">Nâng cao</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {editStep === 3 && (
                      <div className="edit-step-3">
                        <div className="form-section-header">
                          <h3>Tiếp thị & Đối tượng</h3>
                          <p>Tối ưu hóa nội dung tiếp thị để thu hút học viên.</p>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Bạn sẽ học được gì? (Mỗi dòng một ý)</label>
                          <textarea
                            rows={3}
                            className="form-input form-textarea"
                            value={editForm.whatYouWillLearn}
                            onChange={(e) =>
                              setEditForm({ ...editForm, whatYouWillLearn: e.target.value })
                            }
                            placeholder="✔️ Kỹ năng thực tế 1..."
                          />
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">Yêu cầu (Mỗi dòng một ý)</label>
                          <textarea
                            rows={2}
                            className="form-input form-textarea"
                            value={editForm.requirements}
                            onChange={(e) =>
                              setEditForm({ ...editForm, requirements: e.target.value })
                            }
                            placeholder="• Kiến thức cơ bản về..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Đối tượng mục tiêu (Mỗi dòng một ý)</label>
                          <textarea
                            rows={2}
                            className="form-input form-textarea"
                            value={editForm.targetAudience}
                            onChange={(e) =>
                              setEditForm({ ...editForm, targetAudience: e.target.value })
                            }
                            placeholder="Dành cho học sinh lớp 11 ôn thi THPT..."
                          />
                        </div>
                      </div>
                    )}

                    {editStep === 4 && (
                      <div className="edit-step-4">
                        <div className="form-section-header">
                          <h3>Định giá & Khuyến mãi</h3>
                          <p>Cập nhật học phí và các chương trình ưu đãi.</p>
                        </div>

                        <div
                          className="form-row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <div className="form-group">
                            <label className="form-label">
                              Giá gốc (VND) <span className="required">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-input"
                              value={editForm.originalPrice || ''}
                              onChange={(e) =>
                                handlePriceChange(Number(e.target.value), discountPercent)
                              }
                              placeholder="0"
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              Nhập 0 cho {UI_TEXT.COURSE.toLowerCase()} miễn phí.
                            </p>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Giảm giá (%)</label>
                            <input
                              type="number"
                              className="form-input"
                              min="0"
                              max="99"
                              value={discountPercent || ''}
                              onChange={(e) =>
                                handlePriceChange(
                                  Number(editForm.originalPrice),
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="course-edit-pricing-summary">
                          <div className="course-edit-pricing-summary__row">
                            <span>Giá bán thực tế:</span>
                            <strong className="course-edit-pricing-summary__strong">
                              {editForm.discountedPrice?.toLocaleString('vi-VN')}₫
                            </strong>
                          </div>
                          <div className="course-edit-pricing-summary__row">
                            <span>Tiết kiệm:</span>
                            <span className="course-edit-pricing-summary__save">
                              {(
                                Number(editForm.originalPrice) - Number(editForm.discountedPrice)
                              ).toLocaleString('vi-VN')}
                              ₫ ({discountPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label className="form-label">Ngày hết hạn giảm giá</label>
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={(editForm.discountExpiryDate ?? '').substring(0, 16)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setEditForm({ ...editForm, discountExpiryDate: '' });
                              } else {
                                // append :00.000Z to make it compatible, or use new Date
                                setEditForm({
                                  ...editForm,
                                  discountExpiryDate: new Date(val).toISOString(),
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="wizard-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={
                    editStep === 1 ? () => setShowEditModal(false) : () => setEditStep((s) => s - 1)
                  }
                  disabled={updateMutation.isPending}
                >
                  {editStep === 1 ? (
                    'Hủy'
                  ) : (
                    <>
                      <ArrowLeft size={16} /> Quay lại
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn primary"
                  disabled={updateMutation.isPending || !editForm.title}
                  onClick={editStep === 4 ? handleEditSubmit : () => setEditStep((s) => s + 1)}
                >
                  {updateMutation.isPending ? (
                    'Đang lưu...'
                  ) : editStep === 4 ? (
                    <>
                      <Save size={16} /> Lưu thay đổi
                    </>
                  ) : (
                    <>
                      Tiếp theo <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMathLoadingPopup && <CourseDetailLoadingOverlay message={loadingMessage} />}
    </DashboardLayout>
  );
};

export default TeacherCourseDetail;
