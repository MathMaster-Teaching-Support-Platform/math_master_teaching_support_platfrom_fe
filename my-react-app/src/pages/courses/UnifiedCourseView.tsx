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

import React, { useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Star,
  TrendingUp,
  Lock,
  Users,
  Globe,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { CourseBreadcrumb } from '../../components/course/CourseBreadcrumb';
import { CourseIncludesList } from '../../components/course/CourseIncludesList';
import { CourseLearningPanels } from '../../components/course/CourseLearningPanels';
import {
  useCourseDetail,
  useCourseLessons,
  useCourseProgress,
  useMyEnrollments,
  useEnroll,
  useTeacherProfile,
} from '../../hooks/useCourses';
import { AuthService } from '../../services/api/auth.service';
import { getEffectivePrice, hasActiveDiscount } from '../../utils/pricing';
import '../../styles/module-refactor.css';
import './StudentCourses.css';

// Import existing tab components
import StudentLessonsTab from './student-tabs/StudentLessonsTab';
import StudentAssessmentsTab from './student-tabs/StudentAssessmentsTab';
import StudentProgressTab from './student-tabs/StudentProgressTab';
import StudentReviewsTab from './student-tabs/StudentReviewsTab';

type TabType = 'lessons' | 'overview' | 'assessments' | 'reviews' | 'progress';

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
  const activeTab = (searchParams.get('tab') as TabType) || 'lessons';

  // Determine courseId and enrollmentId from props or params
  const enrollmentId = propEnrollmentId || paramEnrollmentId;
  const courseIdFromParam = propCourseId || paramCourseId;

  // Get user info
  const userRole = AuthService.getUserRole();
  const isAuthenticated = AuthService.isAuthenticated();
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  // Fetch enrollment data
  const { data: enrollmentsData } = useMyEnrollments();
  const enrollments = enrollmentsData?.result ?? [];
  const enrollment = enrollmentId
    ? enrollments.find((e) => e.id === enrollmentId)
    : undefined;

  // Determine the actual courseId
  const courseId = enrollment?.courseId || courseIdFromParam;

  // Fetch course data
  const { data: courseData, isLoading: loadingCourse } = useCourseDetail(courseId!);
  const { data: lessonsData } = useCourseLessons(courseId!);
  const { data: progressData } = useCourseProgress(enrollmentId || '');
  const { data: teacherProfileData } = useTeacherProfile(courseData?.result?.teacherId ?? '');

  const course = courseData?.result;
  const lessons = lessonsData?.result || [];
  const progress = progressData?.result;
  const teacherProfile = teacherProfileData?.result;

  // Enrollment mutation
  const enrollMutation = useEnroll();

  // Determine enrollment status
  const isEnrolled = !!enrollment && enrollment.status === 'ACTIVE';
  const hasFullAccess = isEnrolled || isTeacherOrAdmin;

  // Calculate free preview stats
  const freePreviewLessons = useMemo(
    () => lessons.filter((l) => l.isFreePreview),
    [lessons]
  );
  const lockedLessonsCount = useMemo(
    () => lessons.length - freePreviewLessons.length,
    [lessons.length, freePreviewLessons.length]
  );

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    
    // Prevent multiple clicks
    if (enrollMutation.isPending) {
      return;
    }
    
    enrollMutation.mutate(courseId!, {
      onSuccess: (resp) => {
        const newEnrollmentId = resp?.result?.id;
        if (newEnrollmentId) {
          navigate(`/student/courses/${newEnrollmentId}`);
        }
      },
    });
  };

  // Determine the role for DashboardLayout
  const dashboardRole = (userRole === 'admin' || userRole === 'teacher' || userRole === 'student') 
    ? userRole 
    : 'student';

  // Loading state
  if (loadingCourse) {
    return (
      <DashboardLayout role={dashboardRole} user={{ name: 'User', avatar: '', role: dashboardRole }}>
        <div className="module-layout-container">
          <section className="module-page teacher-courses-page">
            <div className="rounded-xl border border-[#E8E6DC] bg-[#F5F4ED] p-5">
              <div className="mb-2 flex items-center justify-center gap-2 text-[14px] text-[#5E5D59]">
                <LoaderCircle className="h-5 w-5 animate-spin text-[#C96442]" />
                <p className="m-0">Đang tải khóa học...</p>
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
      </DashboardLayout>
    );
  }

  // Course not found
  if (!course) {
    return (
      <DashboardLayout role={dashboardRole} user={{ name: 'User', avatar: '', role: dashboardRole }}>
        <div className="module-layout-container">
          <section className="module-page">
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#94a3b8' }} />
              <p>Không tìm thấy khóa học</p>
              <button className="btn secondary" onClick={() => navigate('/student/courses')}>
                <ArrowLeft size={14} />
                Quay lại danh sách
              </button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  // Define tabs based on access level
  const tabs = [
    { id: 'lessons' as const, label: 'Bài học', icon: BookOpen },
    { id: 'overview' as const, label: 'Tổng quan', icon: FileText },
    ...(hasFullAccess
      ? [
          { id: 'assessments' as const, label: 'Bài đánh giá', icon: FileText },
          { id: 'progress' as const, label: 'Tiến độ', icon: TrendingUp },
        ]
      : []),
    { id: 'reviews' as const, label: 'Đánh giá', icon: Star },
  ];

  return (
    <DashboardLayout role={dashboardRole} user={{ name: 'User', avatar: '', role: dashboardRole }}>
      <div className="module-layout-container">
        <section className="module-page">
          <AnimatePresence mode="wait">
            <motion.div
              key="unified-course-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Breadcrumb */}
              <CourseBreadcrumb courseTitle={course.title} />

              {/* Back Button */}
              <button
                className="btn secondary btn-sm"
                style={{ marginBottom: '1rem' }}
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
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {isEnrolled && (
                        <span className="course-badge badge-live">✓ Đã đăng ký</span>
                      )}
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
                        {course.subjectName} • Khối {course.gradeLevel}
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
                      <div style={{ marginTop: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.84rem',
                            color: '#60748f',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <span>Tiến độ của bạn</span>
                          <strong style={{ color: '#1f5eff' }}>
                            {progress.completionRate.toFixed(1)}%
                          </strong>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: '#e8eef8',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              transform: `scaleX(${progress.completionRate / 100})`,
                              transformOrigin: 'left',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, #1f5eff, #60a5fa)',
                              borderRadius: 999,
                              transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Lock size={32} color="#1e40af" />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
                        🔒 Đăng ký để mở khóa toàn bộ khóa học
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                        ✓ {freePreviewLessons.length} bài học miễn phí xem trước •{' '}
                        {lockedLessonsCount} bài học mở sau khi đăng ký
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
                            {course.originalPrice && course.originalPrice > getEffectivePrice(course) && (
                              <div style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>
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

              {/* Tab Navigation - SAME FOR ALL USERS */}
              <div className="course-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`course-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="course-tab-content">
                {activeTab === 'lessons' && (
                  <StudentLessonsTab
                    enrollmentId={enrollmentId || ''}
                    courseId={courseId!}
                    enrollmentStatus={enrollment?.status || 'INACTIVE'}
                  />
                )}
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <CourseLearningPanels
                      whatYouWillLearn={course.whatYouWillLearn}
                      requirements={course.requirements}
                      targetAudience={course.targetAudience}
                    />
                    {course.description && (
                      <div className="data-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700 }}>
                          Mô tả khóa học
                        </h3>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#475569' }}>
                          {course.description}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: '1.5rem' }}>
                      <CourseIncludesList
                        totalVideoHours={course.totalVideoHours}
                        articlesCount={course.articlesCount}
                        resourcesCount={course.resourcesCount}
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'assessments' && hasFullAccess && (
                  <StudentAssessmentsTab courseId={courseId!} />
                )}
                {activeTab === 'progress' && hasFullAccess && enrollmentId && (
                  <StudentProgressTab enrollmentId={enrollmentId} enrollment={enrollment!} />
                )}
                {activeTab === 'reviews' && <StudentReviewsTab courseId={courseId!} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UnifiedCourseView;
