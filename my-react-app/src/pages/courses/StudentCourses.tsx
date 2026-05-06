import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  LoaderCircle,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseCard } from '../../components/course/CourseCard';
import { InvoiceModal } from '../../components/course/InvoiceModal';
import { PurchaseConfirmationModal } from '../../components/course/PurchaseConfirmationModal';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useEnroll, useMyEnrollments, usePublicCourses } from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type { CourseResponse, EnrollmentResponse } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import type { Order } from '../../types/order.types';
import './StudentCourses.css';
import './TeacherCourses.css';

// ─── Cover design tokens (shared with TeacherCourses) ────────────────────────
const coverGradients = [
  'linear-gradient(135deg, #f5f4ed 0%, #ede8dc 100%)',
  'linear-gradient(135deg, #faf9f5 0%, #f0eee6 100%)',
  'linear-gradient(135deg, #f3efe4 0%, #e8e6dc 100%)',
  'linear-gradient(135deg, #f7f3eb 0%, #ede3d4 100%)',
  'linear-gradient(135deg, #faf7f3 0%, #efe7dc 100%)',
  'linear-gradient(135deg, #f6f2ea 0%, #e7dfd2 100%)',
] as const;

const coverAccents = ['#4d4c48', '#5e5d59', '#7a5a4d', '#81644c', '#6e5b7e', '#4a6a5a'] as const;
const PAGE_SIZE = 9;

const scSelectCls =
  'w-full sm:w-auto border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors min-h-[42px] flex-shrink-0';

const scSecondaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-45 disabled:pointer-events-none';

// ─── Animated progress bar ────────────────────────────────────────────────────
const AnimatedProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: 6, background: '#e8e6dc', borderRadius: 999, overflow: 'hidden' }}>
      <div
        style={{
          transform: `scaleX(${width / 100})`,
          transformOrigin: 'left',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #c96442, #d97757)',
          borderRadius: 999,
          transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  );
};

// ─── Enrollment Card ──────────────────────────────────────────────────────────
const EnrollmentCard: React.FC<{
  enrollment: EnrollmentResponse;
  index: number;
  isOpening: boolean;
  onOpen: (enrollmentId: string) => void;
}> = ({ enrollment, index, isOpening, onOpen }) => {
  const completionRate = enrollment.completionRate ?? 0;
  const enrolledCourseThumbnailUrl = enrollment.courseThumbnailUrl;

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ cursor: 'pointer' }}
      onClick={() => {
        if (!isOpening) onOpen(enrollment.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isOpening) onOpen(enrollment.id);
        }
      }}
    >
      <div
        className="course-cover"
        style={{
          background: coverGradients[index % coverGradients.length],
          color: coverAccents[index % coverAccents.length],
        }}
      >
        {enrolledCourseThumbnailUrl && (
          <img
            src={enrolledCourseThumbnailUrl}
            alt={enrollment.courseTitle ?? `Ảnh bìa ${UI_TEXT.COURSE.toLowerCase()}`}
            className="cover-thumb"
          />
        )}
        <div className="cover-overlay" />
        <div className="cover-index">#{String(index + 1).padStart(2, '0')}</div>
        <span
          style={{
            position: 'absolute',
            top: '0.6rem',
            left: '0.7rem',
            zIndex: 2,
            background:
              enrollment.status === 'ACTIVE' ? 'rgba(34,197,94,0.75)' : 'rgba(100,116,139,0.75)',
            color: '#fff',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '0.68rem',
            fontWeight: 700,
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
        </span>
        <h3 className="cover-title">{enrollment.courseTitle}</h3>
      </div>
      <div className="course-body">
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.81rem',
              color: '#5e5d59',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            <span>Tiến độ học</span>
            <strong style={{ color: '#c96442' }}>{completionRate.toFixed(0)}%</strong>
          </div>
          <AnimatedProgressBar value={completionRate} />
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#87867f' }}>
            {enrollment.completedLessons ?? 0}/{enrollment.totalLessons ?? 0} bài hoàn thành
          </p>
        </div>
        <div className="course-actions">
          <button
            className="action-primary"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpening) onOpen(enrollment.id);
            }}
            disabled={isOpening}
          >
            {isOpening ? (
              <>
                <LoaderCircle size={14} className="animate-spin" /> Đang mở...
              </>
            ) : (
              <>
                <ChevronRight size={14} /> Xem chi tiết
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// PublicCourseCard was replaced by shared CourseCard

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [openingEnrollmentId, setOpeningEnrollmentId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  // Purchase confirmation modal state
  const [pendingCourse, setPendingCourse] = useState<CourseResponse | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [enrolledPage, setEnrolledPage] = useState(1);
  const [browsePage, setBrowsePage] = useState(1);

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useMyEnrollments();
  const { data: publicCoursesData, isLoading: loadingPublic } = usePublicCourses({
    schoolGradeId: filterGradeId || undefined,
    subjectId: filterSubjectId || undefined,
    keyword: searchQuery || undefined,
    page: Math.max(0, browsePage - 1),
    size: PAGE_SIZE,
  });
  const enrollMutation = useEnroll();

  const { data: gradesData } = useQuery({
    queryKey: ['school-grades', 'active'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60 * 1000,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'by-school-grade', filterGradeId],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(filterGradeId),
    enabled: !!filterGradeId,
    staleTime: 5 * 60 * 1000,
  });

  const grades: SchoolGrade[] = gradesData?.result ?? [];
  const subjects: SubjectByGrade[] = subjectsData?.result ?? [];

  const handleFilterGradeChange = (gradeId: string) => {
    setFilterGradeId(gradeId);
    setFilterSubjectId('');
  };

  const enrollments = useMemo<EnrollmentResponse[]>(
    () => enrollmentsData?.result ?? [],
    [enrollmentsData]
  );
  const publicCourses = useMemo<CourseResponse[]>(
    () =>
      (publicCoursesData?.result?.content ?? []).filter((course) => {
        const isPublishedFlag = course.isPublished === true;
        const isPublishedStatus = String(course.status ?? '').toUpperCase() === 'PUBLISHED';
        const isNotDeleted = !(course as CourseResponse & { deletedAt?: string | null }).deletedAt;
        return isPublishedFlag && isPublishedStatus && isNotDeleted;
      }),
    [publicCoursesData]
  );

  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) =>
          e.status === 'ACTIVE' &&
          (e.courseTitle ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [enrollments, searchQuery]
  );
  const enrolledTotalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
  const safeEnrolledPage = Math.min(enrolledPage, enrolledTotalPages);
  const paginatedEnrollments = useMemo(() => {
    const start = (safeEnrolledPage - 1) * PAGE_SIZE;
    return filteredEnrollments.slice(start, start + PAGE_SIZE);
  }, [filteredEnrollments, safeEnrolledPage]);

  const browseTotalPages = Math.max(1, publicCoursesData?.result?.totalPages ?? 1);
  const safeBrowsePage = Math.min(browsePage, browseTotalPages);
  React.useEffect(() => {
    if (browsePage !== safeBrowsePage) {
      setBrowsePage(safeBrowsePage);
    }
  }, [browsePage, safeBrowsePage]);

  const stats = useMemo(
    () => ({
      active: enrollments.filter((e) => e.status === 'ACTIVE').length,
      total: enrollments.length,
      browse: publicCourses.length,
    }),
    [enrollments, publicCourses.length]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.courseId)),
    [enrollments]
  );

  /** Map from courseId → enrollmentId for direct "Vào học" navigation */
  const enrolledCourseIdMap = useMemo(
    () => new Map(enrollments.filter((e) => e.status === 'ACTIVE').map((e) => [e.courseId, e.id])),
    [enrollments]
  );

  const openEnrollmentDetails = (enrollmentId: string) => {
    setOpeningEnrollmentId(enrollmentId);
    navigate(`/student/courses/${enrollmentId}`);
  };

  const openPublicCourseDetails = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  /** Open the purchase confirmation modal for a course */
  const handleOpenPurchaseModal = (courseId: string) => {
    const course = publicCourses.find((c) => c.id === courseId);
    if (!course) return;
    setPurchaseError(null);
    setPendingCourse(course);
  };

  /** Called when student confirms inside the modal */
  const handleConfirmPurchase = () => {
    if (!pendingCourse) return;
    setEnrollingCourseId(pendingCourse.id);
    enrollMutation.mutate(pendingCourse.id, {
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
          }
        }
        setPendingCourse(null);
        setActiveTab('enrolled');
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Không thể đăng ký khóa học. Vui lòng thử lại.';
        setPurchaseError(msg);
      },
      onSettled: () => setEnrollingCourseId(null),
    });
  };

  return (
    <>
      <DashboardLayout
        role="student"
        contentClassName="dashboard-content--flush-bleed"
        user={{ name: 'Học sinh', avatar: '', role: 'student' }}
      >
        <div className="px-6 py-8 lg:px-8 w-full min-w-0">
          <div className="module-layout-container">
            <section className="module-page teacher-courses-page space-y-6 min-w-0">
              {/* ── Header ── */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                    <BookOpen className="w-5 h-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                        {UI_TEXT.MY_COURSES}
                      </h1>
                      {!loadingEnrollments && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                          {enrollments.length}
                        </span>
                      )}
                    </div>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                      {stats.active} đang học • {stats.total} ghi danh
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      label: 'Đang học',
                      value: stats.active,
                      Icon: BookOpen,
                      bg: 'bg-[#EEF2FF]',
                      color: 'text-[#4F7EF7]',
                    },
                    {
                      label: 'Tổng ghi danh',
                      value: stats.total,
                      Icon: TrendingUp,
                      bg: 'bg-[#ECFDF5]',
                      color: 'text-[#2EAD7A]',
                    },
                    {
                      label: 'Trên trang khám phá',
                      value: stats.browse,
                      Icon: Award,
                      bg: 'bg-[#FFF7ED]',
                      color: 'text-[#E07B39]',
                    },
                  ] as const
                ).map(({ label, value, Icon, bg, color }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
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
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <label className="flex-1 min-w-0 flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
                    <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" aria-hidden />
                    <input
                      className="flex-1 min-w-0 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                      placeholder={`Tìm kiếm ${UI_TEXT.COURSE.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label={`Tìm kiếm ${UI_TEXT.COURSE.toLowerCase()}`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => setSearchQuery('')}
                        className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </label>

                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('enrolled');
                        setEnrolledPage(1);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        activeTab === 'enrolled'
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                      Đã đăng ký ({stats.active})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('browse');
                        setBrowsePage(1);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        activeTab === 'browse'
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                      Khám phá
                    </button>
                  </div>
                </div>

                {activeTab === 'browse' && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <select
                      className={scSelectCls}
                      value={filterGradeId}
                      onChange={(e) => {
                        setBrowsePage(1);
                        handleFilterGradeChange(e.target.value);
                      }}
                      aria-label="Lọc theo lớp"
                    >
                      <option value="">Tất cả lớp</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          Lớp {g.gradeLevel} – {g.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className={scSelectCls}
                      value={filterSubjectId}
                      onChange={(e) => {
                        setFilterSubjectId(e.target.value);
                        setBrowsePage(1);
                      }}
                      disabled={!filterGradeId}
                      aria-label="Lọc theo môn"
                    >
                      <option value="">Tất cả môn học</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ── Summary bar ── */}
              {activeTab === 'enrolled' && !loadingEnrollments && enrollments.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                  <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                    Hiển thị
                  </span>
                  <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] tabular-nums">
                    {paginatedEnrollments.length} / {filteredEnrollments.length}
                  </strong>
                  <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" aria-hidden />
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Đang học{' '}
                    <strong className="text-[#141413] font-semibold tabular-nums">{stats.active}</strong>
                  </span>
                </div>
              )}

              {/* ── Loading skeletons ── */}
              {(activeTab === 'enrolled' ? loadingEnrollments : loadingPublic) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* ── Enrolled grid ── */}
              {activeTab === 'enrolled' && !loadingEnrollments && (
                <>
                  {filteredEnrollments.length > 0 ? (
                    <div className="grid-cards">
                      {paginatedEnrollments.map((enrollment, i) => (
                        <EnrollmentCard
                          key={enrollment.id}
                          enrollment={enrollment}
                          index={i}
                          isOpening={openingEnrollmentId === enrollment.id}
                          onOpen={openEnrollmentDetails}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
                        <BookOpen className="w-6 h-6 opacity-60" aria-hidden />
                      </div>
                      <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md">
                        {searchQuery
                          ? `Không tìm thấy kết quả cho "${searchQuery}"`
                          : 'Bạn chưa đăng ký khóa học nào'}
                      </p>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'enrolled' &&
                !loadingEnrollments &&
                filteredEnrollments.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                    <button
                      type="button"
                      className={scSecondaryBtn}
                      onClick={() => setEnrolledPage((p) => Math.max(1, p - 1))}
                      disabled={safeEnrolledPage === 1}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Trước
                    </button>
                    <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] tabular-nums">
                      Trang <strong className="text-[#141413]">{safeEnrolledPage}</strong> /{' '}
                      {enrolledTotalPages}
                    </span>
                    <button
                      type="button"
                      className={scSecondaryBtn}
                      onClick={() => setEnrolledPage((p) => Math.min(enrolledTotalPages, p + 1))}
                      disabled={safeEnrolledPage === enrolledTotalPages}
                    >
                      Sau <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              {/* ── Browse grid ── */}
              {activeTab === 'browse' && !loadingPublic && (
                <>
                  {publicCourses.length > 0 ? (
                    <div className="grid-cards">
                      {publicCourses.map((course, i) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          index={i}
                          onPurchase={handleOpenPurchaseModal}
                          isPurchasing={enrollingCourseId === course.id}
                          isEnrolled={enrolledCourseIds.has(course.id)}
                          enrolledEnrollmentId={enrolledCourseIdMap.get(course.id)}
                          onClick={() => openPublicCourseDetails(course.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
                        <Search className="w-6 h-6 opacity-60" aria-hidden />
                      </div>
                      <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md">
                        Không tìm thấy khóa học nào
                      </p>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'browse' && !loadingPublic && publicCourses.length > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                  <button
                    type="button"
                    className={scSecondaryBtn}
                    onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                    disabled={safeBrowsePage === 1}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Trước
                  </button>
                  <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] tabular-nums">
                    Trang <strong className="text-[#141413]">{safeBrowsePage}</strong> /{' '}
                    {browseTotalPages}
                  </span>
                  <button
                    type="button"
                    className={scSecondaryBtn}
                    onClick={() => setBrowsePage((p) => Math.min(browseTotalPages, p + 1))}
                    disabled={safeBrowsePage === browseTotalPages}
                  >
                    Sau <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </DashboardLayout>

      <PurchaseConfirmationModal
        course={pendingCourse}
        isOpen={!!pendingCourse}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setPendingCourse(null);
          setPurchaseError(null);
        }}
        isPurchasing={enrollMutation.isPending}
        purchaseError={purchaseError}
      />

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

export default StudentCourses;
