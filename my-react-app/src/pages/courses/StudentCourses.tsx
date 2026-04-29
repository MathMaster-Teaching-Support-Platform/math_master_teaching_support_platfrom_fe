import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useEnroll, useMyEnrollments, usePublicCourses } from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type { CourseResponse, EnrollmentResponse } from '../../types';
import type { Order } from '../../types/order.types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './StudentCourses.css';
import './TeacherCourses.css';
import { UI_TEXT } from '../../constants/uiText';

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
            background: enrollment.status === 'ACTIVE' ? 'rgba(34,197,94,0.75)' : 'rgba(100,116,139,0.75)',
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
      total: enrollments.filter((e) => e.status === 'ACTIVE').length,
      browse: publicCourses.length,
    }),
    [enrollments, publicCourses.length]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.courseId)),
    [enrollments]
  );

  const openEnrollmentDetails = (enrollmentId: string) => {
    setOpeningEnrollmentId(enrollmentId);
    navigate(`/student/courses/${enrollmentId}`);
  };

  const openPublicCourseDetails = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleEnroll = (courseId: string) => {
    // Prevent multiple enrollments
    if (enrollMutation.isPending || enrollingCourseId) {
      return;
    }
    
    setEnrollingCourseId(courseId);
    enrollMutation.mutate(courseId, {
      onSuccess: (resp) => {
        const orderData = resp?.result || (resp as any)?.order || (resp?.type === 'order' ? resp : null);

        if (orderData && (orderData.orderNumber || orderData.id)) {
          setCompletedOrder(orderData);
          setShowInvoice(true);
        } else {
          const newEnrollmentId =
            (resp as any)?.enrollmentId || (resp as any)?.result?.enrollmentId || (resp as any)?.result?.id;
          if (newEnrollmentId) {
            navigate(`/student/courses/${newEnrollmentId}`);
          }
        }

        setActiveTab('enrolled');
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
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page">
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Header ── */}
            <header className="page-header courses-header-row">
              <div className="header-stack">
                <div className="row" style={{ gap: '0.6rem' }}>
                  <h2>{UI_TEXT.MY_COURSES}</h2>
                  {!loadingEnrollments && <span className="count-chip">{enrollments.length}</span>}
                </div>
                <p className="header-sub">
                  {stats.active} đang học • {stats.total} đã đăng ký
                </p>
              </div>
            </header>

            {/* ── Stats ── */}
            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <div className="stat-icon-wrap">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3>{stats.active}</h3>
                  <p>Đang học</p>
                </div>
              </div>
              <div className="stat-card stat-emerald">
                <div className="stat-icon-wrap">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3>{stats.total}</h3>
                  <p>Tổng đăng ký</p>
                </div>
              </div>
              <div className="stat-card stat-amber">
                <div className="stat-icon-wrap">
                  <Award size={20} />
                </div>
                <div>
                  <h3>{stats.browse}</h3>
                  <p>Khóa học mới</p>
                </div>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="toolbar">
              <label className="search-box">
                <span className="search-box__icon" aria-hidden="true">
                  <Search size={15} />
                </span>
                <input
                  placeholder={`Tìm kiếm ${UI_TEXT.COURSE.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={`Tìm kiếm ${UI_TEXT.COURSE.toLowerCase()}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-box__clear"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              <div className="pill-group">
                <button
                  className={`pill-btn${activeTab === 'enrolled' ? ' active' : ''}`}
                  onClick={() => {
                    setActiveTab('enrolled');
                    setEnrolledPage(1);
                  }}
                >
                  <BookOpen size={13} strokeWidth={2} /> Đã đăng ký ({stats.active})
                </button>
                <button
                  className={`pill-btn${activeTab === 'browse' ? ' active' : ''}`}
                  onClick={() => {
                    setActiveTab('browse');
                    setBrowsePage(1);
                  }}
                >
                  <Search size={13} strokeWidth={2} /> Khám phá
                </button>
              </div>
            </div>

            {/* ── Browse filter toolbar ── */}
            {activeTab === 'browse' && (
              <div className="toolbar" style={{ gap: '0.5rem' }}>
                <select
                  className="grade-filter-select"
                  value={filterGradeId}
                  onChange={(e) => {
                    setBrowsePage(1);
                    handleFilterGradeChange(e.target.value);
                  }}
                >
                  <option value="">Tất cả khối lớp</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      Khối {g.gradeLevel} – {g.name}
                    </option>
                  ))}
                </select>
                <select
                  className="grade-filter-select"
                  value={filterSubjectId}
                  onChange={(e) => {
                    setFilterSubjectId(e.target.value);
                    setBrowsePage(1);
                  }}
                  disabled={!filterGradeId}
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

            {/* ── Summary bar ── */}
            {activeTab === 'enrolled' && !loadingEnrollments && enrollments.length > 0 && (
              <div className="assessment-summary-bar">
                <div className="summary-item summary-item--primary">
                  <span className="summary-label">Hiển thị</span>
                  <strong className="summary-value">
                    {paginatedEnrollments.length} / {filteredEnrollments.length}
                  </strong>
                </div>
                <div className="summary-item">
                  <span className="summary-dot summary-dot--progress" />
                  <span className="summary-label">Đang học</span>
                  <strong className="summary-value">{stats.active}</strong>
                </div>
              </div>
            )}

            {/* ── Loading skeletons ── */}
            {(activeTab === 'enrolled' ? loadingEnrollments : loadingPublic) && (
              <div className="rounded-xl border border-[#E8E6DC] bg-[#F5F4ED] p-4">
                <div className="mb-2 flex items-center gap-2 text-[14px] text-[#5E5D59]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#C96442]" />
                  {activeTab === 'enrolled' ? 'Đang tải khóa học đã đăng ký...' : 'Đang tải danh sách khóa học...'}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E6DC]">
                  <motion.div
                    className="h-full rounded-full bg-[#C96442]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                  />
                </div>
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
                  <div className="empty">
                    <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p>
                      {searchQuery
                        ? `Không tìm thấy kết quả cho "${searchQuery}"`
                        : 'Bạn chưa đăng ký khóa học nào'}
                    </p>
                  </div>
                )}
              </>
            )}
            {activeTab === 'enrolled' && !loadingEnrollments && filteredEnrollments.length > PAGE_SIZE && (
              <div className="courses-pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setEnrolledPage((p) => Math.max(1, p - 1))}
                  disabled={safeEnrolledPage === 1}
                >
                  <ArrowLeft size={14} /> Trước
                </button>
                <span className="pagination-info">
                  Trang <strong>{safeEnrolledPage}</strong> / {enrolledTotalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setEnrolledPage((p) => Math.min(enrolledTotalPages, p + 1))}
                  disabled={safeEnrolledPage === enrolledTotalPages}
                >
                  Sau <ArrowRight size={14} />
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
                        onEnroll={handleEnroll}
                        isEnrolling={enrollingCourseId === course.id}
                        isEnrolled={enrolledCourseIds.has(course.id)}
                        onClick={() => openPublicCourseDetails(course.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p>Không tìm thấy khóa học nào</p>
                  </div>
                )}
              </>
            )}
            {activeTab === 'browse' && !loadingPublic && publicCourses.length > PAGE_SIZE && (
              <div className="courses-pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                  disabled={safeBrowsePage === 1}
                >
                  <ArrowLeft size={14} /> Trước
                </button>
                <span className="pagination-info">
                  Trang <strong>{safeBrowsePage}</strong> / {browseTotalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setBrowsePage((p) => Math.min(browseTotalPages, p + 1))}
                  disabled={safeBrowsePage === browseTotalPages}
                >
                  Sau <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </DashboardLayout>

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
