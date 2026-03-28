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
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useMyEnrollments,
  usePublicCourses,
  useEnroll,
  useDropEnrollment,
  useCourseProgress,
  useMarkLessonComplete,
  useCourseLessons,
} from '../../hooks/useCourses';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { VideoUploadService } from '../../services/api/videoUpload.service';
import type { CourseResponse, EnrollmentResponse } from '../../types';
import type { SchoolGrade, SubjectByGrade } from '../../types/lessonSlide.types';
import './StudentCourses.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const COURSE_THEMES = [
  {
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #A855F7 100%)',
    symbol: '∑',
    symbolSub: 'ALGEBRA',
    orb1: 'rgba(99,102,241,0.35)',
    orb2: 'rgba(168,85,247,0.25)',
  },
  {
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 55%, #06B6D4 100%)',
    symbol: '△',
    symbolSub: 'GEOMETRY',
    orb1: 'rgba(14,165,233,0.35)',
    orb2: 'rgba(6,182,212,0.25)',
  },
  {
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #EF4444 100%)',
    symbol: '∫',
    symbolSub: 'CALCULUS',
    orb1: 'rgba(245,158,11,0.40)',
    orb2: 'rgba(239,68,68,0.25)',
  },
];

// ─── Animated progress bar ────────────────────────────────────────────────────
const AnimatedProgressBar: React.FC<{ value: number; color?: string }> = ({
  value,
  color = 'var(--sc-indigo, #4F46E5)',
}) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="sc-prog-track">
      <div
        className="sc-prog-fill"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, #3B82F6)` }}
      />
    </div>
  );
};

// ─── Course Thumbnail ─────────────────────────────────────────────────────────
const CourseThumbnail: React.FC<{ themeIndex: number; name: string }> = ({ themeIndex, name }) => {
  const theme = COURSE_THEMES[themeIndex % COURSE_THEMES.length];
  return (
    <div className="sc-thumb" style={{ background: theme.gradient }} aria-label={name}>
      <div className="sc-thumb-orb sc-thumb-orb-1" style={{ background: theme.orb1 }} />
      <div className="sc-thumb-orb sc-thumb-orb-2" style={{ background: theme.orb2 }} />
      <div className="sc-thumb-symbol">
        <span className="sc-thumb-glyph">{theme.symbol}</span>
        <span className="sc-thumb-sub">{theme.symbolSub}</span>
      </div>
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
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 900 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
              color: '#fff', padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            ✕ Đóng
          </button>
        </div>

        {/* Video */}
        <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <p style={{ color: '#94a3b8' }}>Đang tải video...</p>
          )}
          {error && (
            <p style={{ color: '#f87171' }}>{error}</p>
          )}
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
      className="sc-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="sc-back-btn" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Quay lại danh sách
      </button>

      <div className="sc-detail-header">
        <div className="sc-detail-thumb-wrap">
          <CourseThumbnail themeIndex={courseIndex} name={enrollment.courseTitle ?? ''} />
        </div>
        <div className="sc-detail-info">
          <h2 className="sc-detail-title">{enrollment.courseTitle}</h2>
          <div className="sc-detail-badges">
            <span className={`sc-badge ${enrollment.status === 'ACTIVE' ? 'sc-badge-rating' : 'sc-badge-lessons'}`}>
              {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
            </span>
          </div>
          {progress && (
            <div className="sc-detail-prog-wrap">
              <div className="sc-detail-prog-header">
                <span>Tiến độ của bạn</span>
                <strong>{progress.completionRate.toFixed(1)}%</strong>
              </div>
              <AnimatedProgressBar value={progress.completionRate} />
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {progress.completedLessons}/{progress.totalLessons} bài học hoàn thành
              </p>
            </div>
          )}
          {enrollment.status === 'ACTIVE' && (
            <button
              className="sc-lesson-btn"
              style={{ marginTop: '0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer' }}
              onClick={handleDrop}
              disabled={dropMutation.isPending}
            >
              Hủy đăng ký
            </button>
          )}
        </div>
      </div>

      {isLoading && <p style={{ padding: '1rem', color: '#6b7280' }}>Đang tải tiến độ...</p>}

      <div className="sc-lessons">
        <div className="sc-chapter">
          <div className="sc-chapter-header">
            <h4 className="sc-chapter-title">Danh sách bài học</h4>
            <span className="sc-chapter-badge">{progress?.completedLessons ?? 0}/{lessons.length} bài học</span>
          </div>
          {lessons.map((lesson) => {
            const lessonProgress = progress?.lessons.find((l) => l.courseLessonId === lesson.id);
            const isCompleted = lessonProgress?.isCompleted ?? false;
            const status = isCompleted ? 'done' : 'current';

            return (
              <div key={lesson.id} className={`sc-lesson-row sc-lesson-${status}`}>
                <div className="sc-lesson-icon">
                  {isCompleted ? (
                    <CheckCircle size={18} strokeWidth={2} />
                  ) : (
                    <Play size={18} strokeWidth={2} />
                  )}
                </div>
                <div className="sc-lesson-info">
                  <span className="sc-lesson-title">{lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học'}</span>
                  {lesson.durationSeconds && (
                    <span className="sc-lesson-dur">
                      ⏱ {Math.round(lesson.durationSeconds / 60)} phút • Video
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {/* Nút xem video */}
                  {lesson.videoUrl && (
                    <button
                      className="sc-lesson-btn sc-lesson-btn-primary"
                      onClick={() =>
                        setPlayingLesson({
                          id: lesson.id,
                          title: lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học',
                        })
                      }
                    >
                      ▶ Xem video
                    </button>
                  )}
                  {/* Nút đánh dấu hoàn thành */}
                  {!isCompleted && enrollment.status === 'ACTIVE' && (
                    <button
                      className="sc-lesson-btn"
                      style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}
                      onClick={() =>
                        markComplete.mutate({ enrollmentId: enrollment.id, courseLessonId: lesson.id })
                      }
                      disabled={markComplete.isPending}
                    >
                      ✓ Hoàn thành
                    </button>
                  )}
                  {isCompleted && (
                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, alignSelf: 'center' }}>
                      ✓ Đã xong
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {lessons.length === 0 && (
            <p style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              Chưa có bài học nào trong khóa học này.
            </p>
          )}
        </div>
      </div>

      {/* Video Player overlay */}
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
    <motion.div
      className="sc-course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      onClick={() => onSelect(enrollment.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(enrollment.id)}
    >
      <div className="sc-card-thumb-wrap">
        <CourseThumbnail themeIndex={index} name={enrollment.courseTitle ?? ''} />
        <div className="sc-prog-badge">{completionRate.toFixed(0)}%</div>
      </div>
      <div className="sc-card-body">
        <h3 className="sc-card-title">{enrollment.courseTitle}</h3>
        <div className="sc-card-badges">
          <span className={`sc-badge ${enrollment.status === 'ACTIVE' ? 'sc-badge-rating' : 'sc-badge-lessons'}`}>
            {enrollment.status === 'ACTIVE' ? 'Đang học' : 'Đã hủy'}
          </span>
        </div>
        <div className="sc-card-prog-section">
          <div className="sc-card-prog-header">
            <span className="sc-prog-label">Tiến độ</span>
            <span className="sc-prog-pct">{completionRate.toFixed(0)}%</span>
          </div>
          <AnimatedProgressBar value={completionRate} />
        </div>
        <div className="sc-card-footer">
          <span className="sc-continue-hint">
            Xem chi tiết <ChevronRight size={12} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Public Course Card ───────────────────────────────────────────────────────
const PublicCourseCard: React.FC<{
  course: CourseResponse;
  index: number;
  onEnroll: (courseId: string) => void;
  isEnrolling: boolean;
}> = ({ course, index, onEnroll, isEnrolling }) => (
  <motion.div
    className="sc-course-card"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
    whileHover={{ y: -5 }}
  >
    <div className="sc-card-thumb-wrap">
      <CourseThumbnail themeIndex={index} name={course.title} />
    </div>
    <div className="sc-card-body">
      <h3 className="sc-card-title">{course.title}</h3>
      <p className="sc-card-teacher">
        <span className="sc-teacher-dot" />
        {course.teacherName ?? 'Giáo viên'}
      </p>
      <div className="sc-card-badges">
        <span className="sc-badge sc-badge-lessons">
          <BookOpen size={11} strokeWidth={2.5} />
          {course.lessonsCount} bài học
        </span>
        <span className="sc-badge sc-badge-rating">
          <Star size={11} strokeWidth={2.5} fill="currentColor" />
          {Number(course.rating).toFixed(1)}
        </span>
        <span className="sc-badge sc-badge-students">
          <Users size={11} strokeWidth={2.5} />
          {course.studentsCount}
        </span>
      </div>      <button
        className="sc-lesson-btn sc-lesson-btn-primary"
        style={{ marginTop: '0.75rem', width: '100%' }}
        onClick={() => onEnroll(course.id)}
        disabled={isEnrolling}
      >
        {isEnrolling ? 'Đang đăng ký...' : 'Đăng ký học'}
      </button>
    </div>
  </motion.div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StudentCourses: React.FC = () => {
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [grades, setGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useMyEnrollments();
  const { data: publicCoursesData, isLoading: loadingPublic } = usePublicCourses({
    schoolGradeId: filterGradeId || undefined,
    subjectId: filterSubjectId || undefined,
    keyword: searchQuery || undefined,
    size: 20,
  });
  const enrollMutation = useEnroll();

  // Load school grades for browse filter
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

  const enrollments: EnrollmentResponse[] = enrollmentsData?.result ?? [];
  const publicCourses: CourseResponse[] = publicCoursesData?.result?.content ?? [];

  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter((e) =>
        (e.courseTitle ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [enrollments, searchQuery]
  );

  const activeEnrollments = filteredEnrollments.filter((e) => e.status === 'ACTIVE');
  const avgProgress = 0; // computed per-card via useCourseProgress

  const selectedEnrollment = selectedEnrollmentId
    ? enrollments.find((e) => e.id === selectedEnrollmentId)
    : null;
  const selectedIndex = selectedEnrollmentId
    ? enrollments.findIndex((e) => e.id === selectedEnrollmentId)
    : -1;

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId, {
      onSuccess: () => setActiveTab('enrolled'),
    });
  };

  return (
    <DashboardLayout role="student" user={{ name: 'Học sinh', avatar: '', role: 'student' }}>
      <div className="sc-page">
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
              {/* Hero */}
              <div className="sc-hero">
                <div className="sc-hero-glass">
                  <div className="sc-hero-left">
                    <h1 className="sc-greeting-name">Giáo trình của tôi</h1>
                    <p className="sc-greeting-sub">Theo dõi tiến độ và khám phá khóa học mới</p>
                  </div>
                  <div className="sc-hero-right">
                    <div className="sc-searchbar">
                      <Search className="sc-search-icon" size={16} strokeWidth={2} />
                      <input
                        className="sc-search-input"
                        type="text"
                        placeholder="Tìm kiếm giáo trình..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Tìm kiếm giáo trình"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Row */}
              <div className="sc-kpi-row">
                <div className="sc-stat-card">
                  <div className="sc-stat-icon-wrap" style={{ background: 'rgba(79,70,229,0.12)' }}>
                    <BookOpen size={20} strokeWidth={2} style={{ color: '#4F46E5' }} />
                  </div>
                  <div className="sc-stat-value">{activeEnrollments.length}</div>
                  <div className="sc-stat-label">Đang học</div>
                </div>
                <div className="sc-stat-card">
                  <div className="sc-stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <TrendingUp size={20} strokeWidth={2} style={{ color: '#10B981' }} />
                  </div>
                  <div className="sc-stat-value">{enrollments.length}</div>
                  <div className="sc-stat-label">Tổng đăng ký</div>
                </div>
                <div className="sc-stat-card">
                  <div className="sc-stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Award size={20} strokeWidth={2} style={{ color: '#F59E0B' }} />
                  </div>
                  <div className="sc-stat-value">{publicCourses.length}</div>
                  <div className="sc-stat-label">Khóa học mới</div>
                </div>
                <div className="sc-stat-card">
                  <div className="sc-stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Clock size={20} strokeWidth={2} style={{ color: '#3B82F6' }} />
                  </div>
                  <div className="sc-stat-value">{avgProgress}%</div>
                  <div className="sc-stat-label">Tiến độ TB</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  className={`sc-tab-btn ${activeTab === 'enrolled' ? 'sc-tab-active' : ''}`}
                  onClick={() => setActiveTab('enrolled')}
                >
                  <BookOpen size={14} strokeWidth={2} />
                  Đã đăng ký ({enrollments.length})
                </button>
                <button
                  className={`sc-tab-btn ${activeTab === 'browse' ? 'sc-tab-active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  <Search size={14} strokeWidth={2} />
                  Khám phá
                </button>
              </div>

              {/* Enrolled courses */}
              {activeTab === 'enrolled' && (
                <>
                  {loadingEnrollments && (
                    <p style={{ color: '#6b7280', padding: '1rem' }}>Đang tải...</p>
                  )}
                  <div className="sc-course-grid">
                    {filteredEnrollments.map((enrollment, i) => (
                      <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        index={i}
                        onSelect={setSelectedEnrollmentId}
                      />
                    ))}
                    {filteredEnrollments.length === 0 && !loadingEnrollments && (
                      <div className="sc-empty">
                        <BookOpen size={40} strokeWidth={1.5} />
                        <p>Bạn chưa đăng ký khóa học nào</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Browse public courses */}
              {activeTab === 'browse' && (
                <>
                  {/* Filter bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <select
                      value={filterGradeId}
                      onChange={(e) => void handleFilterGradeChange(e.target.value)}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #dbe4f0', fontSize: '0.88rem' }}
                    >
                      <option value="">Tất cả khối lớp</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>Khối {g.gradeLevel} – {g.name}</option>
                      ))}
                    </select>
                    <select
                      value={filterSubjectId}
                      onChange={(e) => setFilterSubjectId(e.target.value)}
                      disabled={!filterGradeId}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #dbe4f0', fontSize: '0.88rem' }}
                    >
                      <option value="">Tất cả môn học</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {loadingPublic && (
                    <p style={{ color: '#6b7280', padding: '1rem' }}>Đang tải...</p>
                  )}
                  <div className="sc-course-grid">
                    {publicCourses.map((course, i) => (
                      <PublicCourseCard
                        key={course.id}
                        course={course}
                        index={i}
                        onEnroll={handleEnroll}
                        isEnrolling={enrollMutation.isPending}
                      />
                    ))}
                    {publicCourses.length === 0 && !loadingPublic && (
                      <div className="sc-empty">
                        <Search size={40} strokeWidth={1.5} />
                        <p>Không tìm thấy khóa học</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
