import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseCard } from '../../components/course/CourseCard';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useEnroll,
  useMyEnrollments,
  usePublicCourses,
} from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import '../../styles/module-refactor.css';
import type { CourseResponse, EnrollmentResponse } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './StudentCourses.css';
import './TeacherCourses.css';

// ─── Cover design tokens (shared with TeacherCourses) ────────────────────────
const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;

// ─── Animated progress bar ────────────────────────────────────────────────────
const AnimatedProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: 6, background: '#e8eef8', borderRadius: 999, overflow: 'hidden' }}>
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #1f5eff, #60a5fa)',
          borderRadius: 999,
          transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  );
};

// ─── Enrollment Card ──────────────────────────────────────────────────────────
const EnrollmentCard: React.FC<{
  enrollment: EnrollmentResponse;
  index: number;
}> = ({ enrollment, index }) => {
  const navigate = useNavigate();
  const completionRate = enrollment.completionRate ?? 0;
  const enrolledCourseThumbnailUrl = enrollment.courseThumbnailUrl;

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/student/courses/${enrollment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/student/courses/${enrollment.id}`);
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
          <img src={enrolledCourseThumbnailUrl} alt={enrollment.courseTitle ?? 'Course thumbnail'} className="cover-thumb" />
        )}
        <div className="cover-overlay" />
        <div className="cover-index">#{String(index + 1).padStart(2, '0')}</div>
        <span
          className={`course-badge ${enrollment.status === 'ACTIVE' ? 'badge-live' : 'badge-draft'}`}
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
              color: '#60748f',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            <span>Tiến độ học</span>
            <strong style={{ color: '#1f5eff' }}>{completionRate.toFixed(0)}%</strong>
          </div>
          <AnimatedProgressBar value={completionRate} />
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#9aaece' }}>
            {enrollment.completedLessons ?? 0}/{enrollment.totalLessons ?? 0} bài hoàn thành
          </p>
        </div>
        <div className="course-actions">
          <button
            className="action-primary"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/student/courses/${enrollment.id}`);
            }}
          >
            <ChevronRight size={14} /> Xem chi tiết
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// PublicCourseCard was replaced by shared CourseCard

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StudentCourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [grades, setGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useMyEnrollments();
  const { data: publicCoursesData, isLoading: loadingPublic } = usePublicCourses({
    schoolGradeId: filterGradeId || undefined,
    subjectId: filterSubjectId || undefined,
    keyword: searchQuery || undefined,
    size: 20,
  });
  const enrollMutation = useEnroll();

  React.useEffect(() => {
    LessonSlideService.getSchoolGrades(true)
      .then((r) => setGrades(r.result || []))
      .catch(() => {});
  }, []);

  const handleFilterGradeChange = async (gradeId: string) => {
    setFilterGradeId(gradeId);
    setFilterSubjectId('');
    setSubjects([]);
    if (!gradeId) return;
    try {
      const r = await LessonSlideService.getSubjectsBySchoolGrade(gradeId);
      setSubjects(r.result || []);
    } catch {
      // silent
    }
  };

  const enrollments = useMemo<EnrollmentResponse[]>(
    () => enrollmentsData?.result ?? [],
    [enrollmentsData]
  );
  const publicCourses = useMemo<CourseResponse[]>(
    () => publicCoursesData?.result?.content ?? [],
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

  const stats = useMemo(
    () => ({
      active: enrollments.filter((e) => e.status === 'ACTIVE').length,
      total: enrollments.filter((e) => e.status === 'ACTIVE').length,
      browse: publicCourses.length,
      dropped: enrollments.filter((e) => e.status !== 'ACTIVE').length,
    }),
    [enrollments, publicCourses.length]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.courseId)),
    [enrollments]
  );

  const handleEnroll = (courseId: string) => {
    setEnrollingCourseId(courseId);
    enrollMutation.mutate(courseId, {
      onSuccess: () => setActiveTab('enrolled'),
      onSettled: () => setEnrollingCourseId(null),
    });
  };

  return (
    <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
      <div className="module-layout-container">
        <section className="module-page">
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
                    <div className="header-kicker">Student dashboard</div>
                    <div className="row" style={{ gap: '0.6rem' }}>
                      <h2>Giáo trình của tôi</h2>
                      {!loadingEnrollments && (
                        <span className="count-chip">{enrollments.length}</span>
                      )}
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
                  <div className="stat-card stat-violet">
                    <div className="stat-icon-wrap">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3>{stats.dropped}</h3>
                      <p>Đã hủy</p>
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
                      placeholder="Tìm kiếm giáo trình..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Tìm kiếm giáo trình"
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
                      onClick={() => setActiveTab('enrolled')}
                    >
                      <BookOpen size={13} strokeWidth={2} /> Đã đăng ký ({stats.active})
                    </button>
                    <button
                      className={`pill-btn${activeTab === 'browse' ? ' active' : ''}`}
                      onClick={() => setActiveTab('browse')}
                    >
                      <Search size={13} strokeWidth={2} /> Khám phá
                    </button>
                  </div>
                </div>

                {/* ── Browse filter toolbar ── */}
                {activeTab === 'browse' && (
                  <div className="toolbar" style={{ gap: '0.5rem' }}>
                    <select
                      value={filterGradeId}
                      onChange={(e) => void handleFilterGradeChange(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #dbe4f0',
                        fontSize: '0.88rem',
                        fontFamily: 'inherit',
                        background: '#fff',
                        color: '#142235',
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
                      value={filterSubjectId}
                      onChange={(e) => setFilterSubjectId(e.target.value)}
                      disabled={!filterGradeId}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #dbe4f0',
                        fontSize: '0.88rem',
                        fontFamily: 'inherit',
                        background: '#fff',
                        color: '#142235',
                      }}
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
                        {filteredEnrollments.length} / {enrollments.length}
                      </strong>
                    </div>
                    <div className="summary-item">
                      <span className="summary-dot summary-dot--progress" />
                      <span className="summary-label">Đang học</span>
                      <strong className="summary-value">{stats.active}</strong>
                    </div>
                    <div className="summary-item">
                      <span className="summary-dot summary-dot--upcoming" />
                      <span className="summary-label">Đã hủy</span>
                      <strong className="summary-value">{stats.dropped}</strong>
                    </div>
                  </div>
                )}

                {/* ── Loading skeletons ── */}
                {(activeTab === 'enrolled' ? loadingEnrollments : loadingPublic) && (
                  <div className="skeleton-grid">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton-card" />
                    ))}
                  </div>
                )}

                {/* ── Enrolled grid ── */}
                {activeTab === 'enrolled' && !loadingEnrollments && (
                  <>
                    {filteredEnrollments.length > 0 ? (
                      <div className="grid-cards">
                        {filteredEnrollments.map((enrollment, i) => (
                          <EnrollmentCard
                            key={enrollment.id}
                            enrollment={enrollment}
                            index={i}
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
              </motion.div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
