import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Play,
  Search,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCourseLessons,
  useCourseProgress,
  useDropEnrollment,
  useEnroll,
  useMarkLessonComplete,
  useMyEnrollments,
  usePublicCourses,
} from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { VideoUploadService } from '../../services/api/videoUpload.service';
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
  const [width, setWidth] = useState(0);
  useEffect(() => {
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

// ─── Video Player ─────────────────────────────────────────────────────────────
const VideoPlayer: React.FC<{
  courseId: string;
  courseLessonId: string;
  title: string;
  onClose: () => void;
}> = ({ courseId, courseLessonId, title, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    VideoUploadService.getVideoUrl(courseId, courseLessonId)
      .then((r) => setVideoUrl(r.result))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải video'))
      .finally(() => setLoading(false));
  }, [courseId, courseLessonId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            ✕ Đóng
          </button>
        </div>

        {/* Video */}
        <div
          style={{
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading && <p style={{ color: '#94a3b8' }}>Đang tải video...</p>}
          {error && <p style={{ color: '#f87171' }}>{error}</p>}
          {videoUrl && !loading && (
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setError('Không thể phát video. Vui lòng thử lại.')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Progress Detail View ─────────────────────────────────────────────────────
const ProgressView: React.FC<{
  enrollment: EnrollmentResponse;
  courseIndex: number;
  onBack: () => void;
}> = ({ enrollment, courseIndex, onBack }) => {
  const { data: progressData, isLoading } = useCourseProgress(enrollment.id);
  const { data: lessonsData } = useCourseLessons(enrollment.courseId);
  const markComplete = useMarkLessonComplete();
  const dropMutation = useDropEnrollment();
  const [playingLesson, setPlayingLesson] = useState<{ id: string; title: string } | null>(null);

  const progress = progressData?.result;
  const lessons = lessonsData?.result ?? [];

  const handleDrop = () => {
    if (window.confirm('Bạn có chắc muốn hủy đăng ký khóa học này?')) {
      dropMutation.mutate(enrollment.id, { onSuccess: onBack });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="btn secondary" style={{ marginBottom: '1.25rem' }} onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Quay lại danh sách
      </button>

      {/* Course detail header card */}
      <div
        className="hero-card"
        style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
      >
        <div
          style={{
            width: 200,
            minWidth: 160,
            borderRadius: 12,
            overflow: 'hidden',
            background: coverGradients[courseIndex % coverGradients.length],
            color: coverAccents[courseIndex % coverAccents.length],
            minHeight: 130,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '1rem',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top right, rgba(255,255,255,0.7), transparent 36%), linear-gradient(to top, rgba(255,255,255,0.12), transparent 70%)',
            }}
          />
          <h3
            style={{
              position: 'relative',
              zIndex: 1,
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--mod-ink)',
            }}
          >
            {enrollment.courseTitle}
          </h3>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2
            style={{
              margin: '0 0 0.5rem',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--mod-ink)',
            }}
          >
            {enrollment.courseTitle}
          </h2>
          <span
            className={`course-badge ${enrollment.status === 'ACTIVE' ? 'badge-live' : 'badge-draft'}`}
            style={{ marginBottom: '0.75rem' }}
          >
            {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
          </span>
          {progress && (
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
                <strong style={{ color: '#1f5eff' }}>{progress.completionRate.toFixed(1)}%</strong>
              </div>
              <AnimatedProgressBar value={progress.completionRate} />
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
                {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
              </p>
            </div>
          )}
          <button
            className="btn danger"
            style={{ marginTop: '0.75rem' }}
            onClick={handleDrop}
            disabled={dropMutation.isPending || enrollment.status !== 'ACTIVE'}
            title={enrollment.status !== 'ACTIVE' ? 'Khóa học đã hủy' : undefined}
          >
            {dropMutation.isPending ? 'Đang hủy...' : 'Hủy đăng ký'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {/* Lesson list */}
      <div className="data-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.2rem',
            borderBottom: '1px solid #e8eef8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--mod-ink)' }}>
            Danh sách bài học
          </h4>
          <span className="badge">
            {progress?.completedLessons ?? 0}/{lessons.length} bài học
          </span>
        </div>

        {lessons.map((lesson) => {
          const lessonProgress = progress?.lessons.find((l) => l.courseLessonId === lesson.id);
          const isCompleted = lessonProgress?.isCompleted ?? false;

          return (
            <div
              key={lesson.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.2rem',
                borderBottom: '1px solid #f3f7fd',
                background: isCompleted ? '#f0fdf4' : '#fff',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? '#dcfce7' : '#e8eef8',
                  color: isCompleted ? '#15803d' : '#60748f',
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={17} strokeWidth={2} />
                ) : (
                  <Play size={17} strokeWidth={2} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--mod-ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học'}
                </div>
                {lesson.durationSeconds && (
                  <div style={{ fontSize: '0.76rem', color: '#60748f', marginTop: '0.15rem' }}>
                    ⏱ {Math.round(lesson.durationSeconds / 60)} phút • Video
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                {lesson.videoUrl && (
                  <button
                    className="action-primary"
                    style={{ padding: '0.42rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() =>
                      setPlayingLesson({
                        id: lesson.id,
                        title: lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học',
                      })
                    }
                  >
                    <Play size={12} strokeWidth={2.5} /> Xem video
                  </button>
                )}
                {!isCompleted && enrollment.status === 'ACTIVE' && (
                  <button
                    className="action-toggle"
                    style={{ padding: '0.42rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() =>
                      markComplete.mutate({
                        enrollmentId: enrollment.id,
                        courseLessonId: lesson.id,
                      })
                    }
                    disabled={markComplete.isPending}
                  >
                    <CheckCircle size={12} strokeWidth={2.5} /> Hoàn thành
                  </button>
                )}
                {isCompleted && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#15803d',
                      fontWeight: 700,
                      alignSelf: 'center',
                    }}
                  >
                    ✓ Đã xong
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {lessons.length === 0 && !isLoading && (
          <div className="empty" style={{ padding: '2rem' }}>
            <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Chưa có bài học nào trong khóa học này.</p>
          </div>
        )}
      </div>

      {playingLesson && (
        <VideoPlayer
          courseId={enrollment.courseId}
          courseLessonId={playingLesson.id}
          title={playingLesson.title}
          onClose={() => setPlayingLesson(null)}
        />
      )}
    </motion.div>
  );
};

// ─── Enrollment Card ──────────────────────────────────────────────────────────
const EnrollmentCard: React.FC<{
  enrollment: EnrollmentResponse;
  index: number;
  onSelect: (id: string) => void;
}> = ({ enrollment, index, onSelect }) => {
  const { data: progressData } = useCourseProgress(enrollment.id);
  const progress = progressData?.result;
  const completionRate = progress?.completionRate ?? 0;

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(enrollment.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(enrollment.id)}
    >
      <div
        className="course-cover"
        style={{
          background: coverGradients[index % coverGradients.length],
          color: coverAccents[index % coverAccents.length],
        }}
      >
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
          {progress && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#9aaece' }}>
              {progress.completedLessons}/{progress.totalLessons} bài hoàn thành
            </p>
          )}
        </div>
        <div className="course-actions">
          <button
            className="action-primary"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(enrollment.id);
            }}
          >
            <ChevronRight size={14} /> Xem chi tiết
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// ─── Public Course Card ───────────────────────────────────────────────────────
const PublicCourseCard: React.FC<{
  course: CourseResponse;
  index: number;
  onEnroll: (courseId: string) => void;
  isEnrolling: boolean;
  isEnrolled: boolean;
}> = ({ course, index, onEnroll, isEnrolling, isEnrolled }) => {
  let enrollBtnLabel: string;
  if (isEnrolled) enrollBtnLabel = '✓ Đã đăng ký';
  else if (isEnrolling) enrollBtnLabel = 'Đang đăng ký...';
  else enrollBtnLabel = 'Đăng ký học';
  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
    >
      <div
        className="course-cover"
        style={{
          background: coverGradients[index % coverGradients.length],
          color: coverAccents[index % coverAccents.length],
        }}
      >
        <div className="cover-overlay" />
        <div className="cover-index">#{String(index + 1).padStart(2, '0')}</div>
        <span className={`course-badge ${isEnrolled ? 'badge-live' : 'badge-draft'}`}>
          {isEnrolled ? '✓ Đã đăng ký' : 'Chưa đăng ký'}
        </span>
        <h3 className="cover-title">{course.title}</h3>
      </div>
      <div className="course-body">
        <p className="course-desc">{course.teacherName ?? 'Giáo viên'}</p>
        <div className="course-metrics">
          <div className="metric">
            <BookOpen size={13} />
            <span>{course.lessonsCount} bài học</span>
          </div>
          <div className="metric">
            <Star size={13} />
            <span>{Number(course.rating).toFixed(1)}</span>
          </div>
          <div className="metric">
            <Users size={13} />
            <span>{course.studentsCount}</span>
          </div>
        </div>
        <div className="course-actions">
          <button
            className="action-primary"
            style={{
              flex: 1,
              ...(isEnrolled ? { background: '#ecfdf5', color: '#065f46', cursor: 'default' } : {}),
            }}
            onClick={() => !isEnrolled && onEnroll(course.id)}
            disabled={isEnrolling || isEnrolled}
          >
            {enrollBtnLabel}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StudentCourses: React.FC = () => {
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
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

  const selectedEnrollment = selectedEnrollmentId
    ? enrollments.find((e) => e.id === selectedEnrollmentId)
    : null;
  const selectedIndex = selectedEnrollmentId
    ? enrollments.findIndex((e) => e.id === selectedEnrollmentId)
    : -1;

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
          <AnimatePresence mode="wait">
            {selectedEnrollmentId && selectedEnrollment ? (
              <motion.div
                key="detail-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ProgressView
                  enrollment={selectedEnrollment}
                  courseIndex={selectedIndex}
                  onBack={() => setSelectedEnrollmentId(null)}
                />
              </motion.div>
            ) : (
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
                            onSelect={setSelectedEnrollmentId}
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
                          <PublicCourseCard
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
            )}
          </AnimatePresence>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
