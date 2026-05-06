/**
 * UnifiedCourseView - Single course interface for all users
 *
 * This component replaces both CoursePreview and StudentCourseDetail
 * to provide a consistent UI regardless of enrollment status.
 *
 * Features:
 * - Same layout for enrolled and non-enrolled users
 * - Permission-based content access (locked/unlocked)
 * - Free preview lessons playable without enrollment
 * - Clear enrollment CTAs for non-enrolled users
 * - Progress tracking for enrolled users
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  FileText,
  Globe,
  ListVideo,
  LoaderCircle,
  Lock,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import { CourseIncludesList } from '../../components/course/CourseIncludesList';
import { CourseLearningPanels } from '../../components/course/CourseLearningPanels';
import { InvoiceModal } from '../../components/course/InvoiceModal';
import { PurchaseConfirmationModal } from '../../components/course/PurchaseConfirmationModal';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import {
  useCourseDetail,
  useCourseLessons,
  useCourseProgress,
  useEnroll,
  useMyEnrollments,
  useTeacherProfile,
} from '../../hooks/useCourses';
import { useMyAssessmentsByCourse } from '../../hooks/useStudentAssessment';
import { AuthService } from '../../services/api/auth.service';
import '../../styles/module-refactor.css';
import type { Order } from '../../types/order.types';
import { getEffectivePrice, hasActiveDiscount } from '../../utils/pricing';
import './StudentCourses.css';
import './TeacherCourseDetail.css';

/** Uses full main column width but keeps modest gutters — không chạm sát mép trái/phải */
const UNIFIED_COURSE_PAGE_WRAP =
  'w-full min-w-0 max-w-none px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-10 box-border';
/** Keep `module-layout-container` for scoped `.btn` / CSS vars in module-refactor.css — without `.module-page` there is no 1220px cap */
const MODULE_FULL_BLEED = 'module-layout-container w-full min-w-0 max-w-none';

// Import existing tab components
import StudentAssessmentsTab from './student-tabs/StudentAssessmentsTab';
import StudentLessonsTab from './student-tabs/StudentLessonsTab';
import StudentProgressTab from './student-tabs/StudentProgressTab';
import StudentReviewsTab from './student-tabs/StudentReviewsTab';

const STUDENT_COURSE_TAB_IDS = [
  'lessons',
  'overview',
  'assessments',
  'progress',
  'reviews',
] as const;
type TabType = (typeof STUDENT_COURSE_TAB_IDS)[number];

const secondaryOutlineBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors shadow-sm';

interface UnifiedCourseViewProps {
  courseId?: string;
  enrollmentId?: string;
}

const levelMap: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Cơ bản', color: '#10b981' },
  INTERMEDIATE: { label: 'Trung bình', color: '#f59e0b' },
  ADVANCED: { label: 'Nâng cao', color: '#ef4444' },
  ALL_LEVELS: { label: 'Mọi cấp độ', color: '#6366f1' },
};

/**
 * Main Unified Course View Component
 */
const UnifiedCourseView: React.FC<UnifiedCourseViewProps> = ({
  courseId: propCourseId,
  enrollmentId: propEnrollmentId,
}) => {
  const { courseId: paramCourseId, enrollmentId: paramEnrollmentId } = useParams<{
    courseId?: string;
    enrollmentId?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: TabType =
    tabParam && STUDENT_COURSE_TAB_IDS.includes(tabParam as TabType)
      ? (tabParam as TabType)
      : 'lessons';

  // Determine courseId and enrollmentId from props or params
  const enrollmentId = propEnrollmentId || paramEnrollmentId;
  const courseIdFromParam = propCourseId || paramCourseId;

  // Get user info
  const userRole = AuthService.getUserRole();
  const isAuthenticated = AuthService.isAuthenticated();
  const isAdmin = userRole === 'admin';

  // Fetch enrollment data
  const { data: enrollmentsData } = useMyEnrollments();
  const enrollments = enrollmentsData?.result ?? [];
  const enrollment = enrollmentId
    ? enrollments.find((e) => e.id === enrollmentId)
    : enrollments.find((e) => e.courseId === (propCourseId || paramCourseId));

  // Determine the actual courseId
  const courseId = enrollment?.courseId || courseIdFromParam;

  // Fetch course data
  const {
    data: courseData,
    isLoading: loadingCourse,
    error: courseError,
  } = useCourseDetail(courseId!);
  const { data: lessonsData, refetch: refetchLessons } = useCourseLessons(courseId!);
  const { data: progressData } = useCourseProgress(enrollmentId || '');
  const { data: teacherProfileData } = useTeacherProfile(courseData?.result?.teacherId ?? '');

  const course = courseData?.result;
  const courseErrorCode =
    (courseError as { response?: { data?: { code?: string } } } | null)?.response?.data?.code ?? '';
  const courseErrorMessage = (courseError as Error | null)?.message ?? '';
  const isAccessDeniedError =
    courseErrorCode === 'COURSE_ACCESS_DENIED' ||
    courseErrorMessage.toUpperCase().includes('COURSE_ACCESS_DENIED');
  const lessons = useMemo(() => lessonsData?.result ?? [], [lessonsData?.result]);
  const progress = progressData?.result;
  const teacherProfile = teacherProfileData?.result;

  const decodedToken = AuthService.getToken()
    ? AuthService.decodeToken(AuthService.getToken()!)
    : null;
  const isOwnerTeacher =
    userRole === 'teacher' &&
    !!course &&
    !!decodedToken?.sub &&
    String(decodedToken.sub) === String(course.teacherId);
  const canViewUnpublishedCourse = isAdmin || isOwnerTeacher;

  // Enrollment mutation
  const enrollMutation = useEnroll();
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [completedOrder, setCompletedOrder] = React.useState<Order | null>(null);
  // Purchase confirmation modal state
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);
  const [purchaseError, setPurchaseError] = React.useState<string | null>(null);

  // Determine enrollment status
  const isEnrolled = !!enrollment && enrollment.status === 'ACTIVE';
  const hasFullAccess = isEnrolled || canViewUnpublishedCourse;

  const { data: assessmentsMeta } = useMyAssessmentsByCourse(
    courseId ?? '',
    { page: 0, size: 1, sortBy: 'dueDate', sortDir: 'ASC' },
    { enabled: Boolean(courseId && hasFullAccess) }
  );

  // Calculate free preview stats
  const freePreviewLessons = useMemo(() => lessons.filter((l) => l.isFreePreview), [lessons]);
  const lockedLessonsCount = useMemo(
    () => lessons.length - freePreviewLessons.length,
    [lessons.length, freePreviewLessons.length]
  );

  const isCoursePublic =
    course?.isPublished === true && String(course?.status ?? '').toUpperCase() === 'PUBLISHED';

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && !STUDENT_COURSE_TAB_IDS.includes(t as TabType)) {
      setSearchParams({ tab: 'lessons' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    // Open confirmation modal instead of directly purchasing
    setPurchaseError(null);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = () => {
    if (enrollMutation.isPending) return;
    enrollMutation.mutate(courseId!, {
      onSuccess: (resp) => {
        const orderData =
          resp?.result || (resp as any)?.order || (resp?.type === 'order' ? resp : null);
        if (orderData && (orderData.orderNumber || orderData.id)) {
          setCompletedOrder(orderData);
          setShowInvoice(true);
        } else {
          const newEnrollmentId =
            (resp as any)?.enrollmentId ||
            (resp as any)?.result?.enrollmentId ||
            (resp as any)?.result?.id;
          if (newEnrollmentId) {
            navigate(`/student/courses/${newEnrollmentId}`);
          } else {
            void refetchLessons();
          }
        }
        setShowPurchaseModal(false);
      },
      onError: (err) => {
        const msg =
          err instanceof Error ? err.message : 'Không thể đăng ký khóa học. Vui lòng thử lại.';
        setPurchaseError(msg);
      },
    });
  };

  // Determine the role for DashboardLayout
  const dashboardRole =
    userRole === 'admin' || userRole === 'teacher' || userRole === 'student' ? userRole : 'student';

  let mainContent;

  // Loading state
  if (loadingCourse) {
    mainContent = (
      <div className={MODULE_FULL_BLEED}>
        <div className={UNIFIED_COURSE_PAGE_WRAP}>
          <section className="w-full min-w-0 teacher-courses-page">
            <div className="rounded-xl border border-[#E8E6DC] bg-[#F5F4ED] p-5">
              <div className="mb-2 flex items-center justify-center gap-2 text-[14px] text-[#5E5D59]">
                <LoaderCircle className="h-5 w-5 animate-spin text-[#C96442]" />
                <p className="m-0">Đang tải {UI_TEXT.COURSE.toLowerCase()}...</p>
              </div>
              <div className="mx-auto h-1.5 max-w-md overflow-hidden rounded-full bg-[#E8E6DC]">
                <motion.div
                  className="h-full rounded-full bg-[#C96442]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  } else if (isAccessDeniedError) {
    mainContent = (
      <div className={MODULE_FULL_BLEED}>
        <div className={UNIFIED_COURSE_PAGE_WRAP}>
          <section className="w-full min-w-0 teacher-courses-page">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#B53333' }} />
              <p>Bạn không có quyền xem {UI_TEXT.COURSE.toLowerCase()} này.</p>
              <button className="btn secondary" onClick={() => navigate('/student/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  } else if (!course) {
    mainContent = (
      <div className={MODULE_FULL_BLEED}>
        <div className={UNIFIED_COURSE_PAGE_WRAP}>
          <section className="w-full min-w-0">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#94a3b8' }} />
              <p>Không tìm thấy {UI_TEXT.COURSE.toLowerCase()}</p>
              <button className="btn secondary" onClick={() => navigate('/student/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  } else if (!isCoursePublic && !hasFullAccess) {
    mainContent = (
      <div className={MODULE_FULL_BLEED}>
        <div className={UNIFIED_COURSE_PAGE_WRAP}>
          <section className="w-full min-w-0 teacher-courses-page">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#B53333' }} />
              <p>{UI_TEXT.COURSE} này chưa được công khai hoặc đang chờ duyệt.</p>
              <button className="btn secondary" onClick={() => navigate('/student/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  } else {
    const assessmentsTotal = assessmentsMeta?.result?.totalElements ?? 0;

    const studentCourseTabs: Array<{
      id: TabType;
      label: string;
      icon: LucideIcon;
      locked: boolean;
      badge?: React.ReactNode;
    }> = [
      {
        id: 'lessons',
        label: 'Bài học',
        icon: ListVideo,
        locked: false,
        badge: course.lessonsCount,
      },
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: BookOpen,
        locked: false,
      },
      {
        id: 'assessments',
        label: UI_TEXT.QUIZ,
        icon: ClipboardCheck,
        locked: !hasFullAccess,
        badge: hasFullAccess ? assessmentsTotal : undefined,
      },
      {
        id: 'progress',
        label: 'Tiến độ',
        icon: TrendingUp,
        locked: !hasFullAccess,
        badge:
          hasFullAccess && progress
            ? `${Math.round(progress.completionRate)}%`
            : hasFullAccess
              ? '0%'
              : undefined,
      },
      {
        id: 'reviews',
        label: 'Đánh giá',
        icon: Star,
        locked: false,
        badge: course.ratingCount,
      },
    ];

    mainContent = (
      <div className={MODULE_FULL_BLEED}>
        <div className={UNIFIED_COURSE_PAGE_WRAP}>
          <section className="w-full min-w-0">
            <AnimatePresence mode="wait">
            <motion.div
              key="unified-course-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <CourseBreadcrumb courseTitle={course.title} />

              <button
                type="button"
                className={`${secondaryOutlineBtn} mb-4`}
                onClick={() => navigate('/student/courses')}
              >
                <ArrowLeft size={16} strokeWidth={2} />
                Quay lại danh sách
              </button>

              {/* Course Header - SAME FOR ALL USERS */}
              <div className="course-detail-header">
                <div
                  className="hero-card"
                  style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
                >
                  {/* Course Thumbnail */}
                  <div
                    style={{
                      width: 200,
                      minWidth: 160,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      minHeight: 130,
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '1rem',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {course.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="cover-thumb"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'radial-gradient(circle at top right, rgba(255,255,255,0.7), transparent 36%), linear-gradient(to top, rgba(255,255,255,0.12), transparent 70%)',
                      }}
                    />
                  </div>

                  {/* Course Info */}
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h2
                      style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: 'var(--mod-ink)',
                      }}
                    >
                      {course.title}
                    </h2>
                    {course.subtitle && (
                      <p
                        className="course-hero-subtitle"
                        style={{ fontSize: '1rem', color: '#475569', marginBottom: '1rem' }}
                      >
                        {course.subtitle}
                      </p>
                    )}
                    {teacherProfile && (
                      <div
                        className="hero-instructor-link"
                        style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}
                      >
                        <span>Giảng viên: </span>
                        <Link
                          to={`/student/instructors/${teacherProfile.userId}`}
                          style={{
                            color: '#4f46e5',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                        >
                          {teacherProfile.fullName}
                        </Link>
                      </div>
                    )}

                    {/* Badges */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {isEnrolled && <span className="course-badge badge-live">✓ Đã đăng ký</span>}
                      {course.level && (
                        <span
                          className="course-badge"
                          style={{
                            background: levelMap[course.level]?.color ?? '#6366f1',
                          }}
                        >
                          {levelMap[course.level]?.label ?? 'Mọi cấp độ'}
                        </span>
                      )}
                    </div>

                    {/* Course Meta */}
                    <div className="course-header-meta" style={{ marginTop: '0.5rem' }}>
                      <span className="meta-item">
                        <BookOpen size={14} />
                        {course.subjectName} • Lớp {course.gradeLevel}
                      </span>
                      <span className="meta-separator">•</span>
                      <span className="meta-item">
                        <Users size={14} />
                        {course.studentsCount} học viên
                      </span>
                      {course.language && (
                        <>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">
                            <Globe size={14} />
                            {course.language}
                          </span>
                        </>
                      )}
                      <span className="meta-separator">•</span>
                      <span className="meta-item">
                        <FileText size={14} />
                        {course.lessonsCount} bài học
                      </span>
                      <span className="meta-separator">•</span>
                      <span className="meta-item">
                        <Star size={14} fill="#FBBF24" color="#FBBF24" />
                        <strong style={{ marginLeft: 4 }}>{course.rating || 0}</strong>
                        <span style={{ color: 'var(--sc-text-muted)', marginLeft: 4 }}>
                          ({course.ratingCount || 0} đánh giá)
                        </span>
                      </span>
                    </div>

                    {/* Progress Bar - Only for enrolled users */}
                    {isEnrolled && progress && (
                      <div className="mt-3 rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] px-4 py-3">
                        <div className="flex justify-between font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] mb-2">
                          <span>Tiến độ của bạn</span>
                          <strong className="text-[#C96442] tabular-nums">
                            {progress.completionRate.toFixed(1)}%
                          </strong>
                        </div>
                        <div className="h-2 rounded-full bg-[#E8E6DC] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C96442] to-[#E07B39] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left"
                            style={{
                              transform: `scaleX(${Math.min(1, Math.max(0, progress.completionRate / 100))})`,
                            }}
                          />
                        </div>
                        <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-2 m-0">
                          {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Banner - Only for non-enrolled users */}
              {!hasFullAccess && (
                <div
                  className="data-card"
                  style={{
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '2px solid #3b82f6',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                  >
                    <Lock size={32} color="#1e40af" />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3
                        style={{
                          margin: '0 0 0.5rem',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: '#1e40af',
                        }}
                      >
                        Đăng ký để mở khóa toàn bộ {UI_TEXT.COURSE.toLowerCase()}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                        ✓ {freePreviewLessons.length} bài học thử miễn phí • {lockedLessonsCount}{' '}
                        bài học mở sau khi đăng ký
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        {hasActiveDiscount(course) ? (
                          <>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>
                              {getEffectivePrice(course) === 0
                                ? 'Miễn phí'
                                : getEffectivePrice(course).toLocaleString('vi-VN') + '₫'}
                            </div>
                            {course.originalPrice &&
                              course.originalPrice > getEffectivePrice(course) && (
                                <div
                                  style={{
                                    fontSize: '0.9rem',
                                    color: '#94a3b8',
                                    textDecoration: 'line-through',
                                  }}
                                >
                                  {course.originalPrice.toLocaleString('vi-VN')}₫
                                </div>
                              )}
                          </>
                        ) : (
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>
                            {course.originalPrice && course.originalPrice > 0
                              ? course.originalPrice.toLocaleString('vi-VN') + '₫'
                              : 'Miễn phí'}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn primary"
                        onClick={handleEnroll}
                        disabled={enrollMutation.isPending}
                        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                      >
                        {enrollMutation.isPending
                          ? 'Đang xử lý...'
                          : !isAuthenticated
                            ? 'Đăng nhập để đăng ký'
                            : getEffectivePrice(course) > 0
                              ? 'Mua ngay'
                              : 'Đăng ký miễn phí'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[#E8E6DC] bg-white overflow-hidden shadow-[0_2px_24px_rgba(20,20,19,0.06)]">
                <div
                  className="flex flex-wrap gap-1 p-2 bg-[#F5F4ED] border-b border-[#E8E6DC]"
                  role="tablist"
                  aria-label="Nội dung khóa học"
                >
                  {studentCourseTabs.map((tab) => {
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
                        } ${tab.locked && !active ? 'opacity-85' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        <tab.icon size={15} strokeWidth={2} className="shrink-0 opacity-90" />
                        <span>{tab.label}</span>
                        {tab.locked ? (
                          <span
                            className={`min-w-[1.25rem] h-5 px-1 inline-flex items-center justify-center rounded-full ${
                              active ? 'bg-[#87867F]/25 text-[#141413]' : 'bg-[#E8E6DC] text-[#5E5D59]'
                            }`}
                            title="Cần đăng ký"
                          >
                            <Lock size={11} strokeWidth={2.5} aria-hidden />
                          </span>
                        ) : tab.badge !== undefined && tab.badge !== null && tab.badge !== '' ? (
                          <span
                            className={`min-h-5 min-w-[1.25rem] px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none ${
                              active ? 'bg-[#C96442] text-white' : 'bg-[#E8E6DC] text-[#5E5D59]'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="p-5 md:p-7 bg-[#F5F4ED]/90 min-h-[200px] min-w-0"
                  data-student-course-tab-panel
                >
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
                      {activeTab === 'lessons' && (
                        <StudentLessonsTab
                          enrollmentId={enrollmentId || ''}
                          courseId={courseId!}
                          enrollmentStatus={enrollment?.status || 'INACTIVE'}
                        />
                      )}
                      {activeTab === 'overview' && (
                        <div className="overview-tab space-y-5">
                          <CourseLearningPanels
                            whatYouWillLearn={course.whatYouWillLearn}
                            requirements={course.requirements}
                            targetAudience={course.targetAudience}
                          />
                          {course.description ? (
                            <div className="rounded-2xl border border-[#E8E6DC] bg-white p-5 md:p-6 shadow-sm">
                              <h3 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] m-0 mb-3">
                                Mô tả {UI_TEXT.COURSE.toLowerCase()}
                              </h3>
                              <div className="font-[Be_Vietnam_Pro] text-[14px] whitespace-pre-wrap leading-relaxed text-[#5E5D59]">
                                {course.description}
                              </div>
                            </div>
                          ) : null}
                          <CourseIncludesList
                            totalVideoHours={course.totalVideoHours}
                            articlesCount={course.articlesCount}
                            resourcesCount={course.resourcesCount}
                          />
                        </div>
                      )}
                      {activeTab === 'assessments' &&
                        (hasFullAccess ? (
                          <StudentAssessmentsTab courseId={courseId!} />
                        ) : (
                          <div className="rounded-2xl border border-[#E8E6DC] bg-white p-8 md:p-10 text-center max-w-lg mx-auto shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F4ED] text-[#87867F] mb-4">
                              <Lock className="h-7 w-7" strokeWidth={2} />
                            </div>
                            <h3 className="font-[Playfair_Display] text-lg font-medium text-[#141413] mb-2">
                              Bài kiểm tra đã khóa
                            </h3>
                            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-6 leading-relaxed">
                              Đăng ký khóa học để làm bài kiểm tra và nhận xét từ giảng viên.
                            </p>
                            <button type="button" className={secondaryOutlineBtn} onClick={handleEnroll}>
                              Đăng ký để mở khóa
                            </button>
                          </div>
                        ))}
                      {activeTab === 'progress' &&
                        (hasFullAccess && enrollmentId && enrollment ? (
                          <StudentProgressTab enrollmentId={enrollmentId} enrollment={enrollment} />
                        ) : (
                          <div className="rounded-2xl border border-[#E8E6DC] bg-white p-8 md:p-10 text-center max-w-lg mx-auto shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F4ED] text-[#87867F] mb-4">
                              <Lock className="h-7 w-7" strokeWidth={2} />
                            </div>
                            <h3 className="font-[Playfair_Display] text-lg font-medium text-[#141413] mb-2">
                              Theo dõi tiến độ
                            </h3>
                            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mb-6 leading-relaxed">
                              Sau khi đăng ký, bạn xem được tiến độ từng bài và tỷ lệ hoàn thành khóa học.
                            </p>
                            <button type="button" className={secondaryOutlineBtn} onClick={handleEnroll}>
                              Đăng ký để mở khóa
                            </button>
                          </div>
                        ))}
                      {activeTab === 'reviews' && <StudentReviewsTab courseId={courseId!} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        role={dashboardRole}
        user={{ name: 'User', avatar: '', role: dashboardRole }}
        contentClassName="dashboard-content--flush-bleed"
      >
        {mainContent}
      </DashboardLayout>

      {/* ── Purchase Confirmation Modal ── */}
      {course && (
        <PurchaseConfirmationModal
          course={course}
          isOpen={showPurchaseModal}
          onConfirm={handleConfirmPurchase}
          onCancel={() => {
            setShowPurchaseModal(false);
            setPurchaseError(null);
          }}
          isPurchasing={enrollMutation.isPending}
          purchaseError={purchaseError}
        />
      )}

      {/* ── Invoice Modal ── */}
      <InvoiceModal
        order={completedOrder}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        onGoToCourse={() => {
          if (completedOrder?.enrollmentId) {
            navigate(`/student/courses/${completedOrder.enrollmentId}`);
          } else {
            navigate('/student/courses');
          }
        }}
      />
    </>
  );
};

export default UnifiedCourseView;
