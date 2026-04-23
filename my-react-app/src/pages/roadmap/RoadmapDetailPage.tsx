import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { useCoursePreview, useEnroll, useMyEnrollments } from '../../hooks/useCourses';
import {
  useMyRoadmapFeedback,
  useRoadmapDetail,
  useSubmitRoadmapFeedback,
  useTopicMaterials,
} from '../../hooks/useRoadmaps';
import type {
  RoadmapTopic,
  RoadmapTopicCourse,
  RoadmapEntryTestResultResponse,
  TopicMaterial,
} from '../../types';
import './roadmap-detail-page.css';

/* ─────────────────────────────────────────────────────
   Pure Helpers
───────────────────────────────────────────────────── */
function diffLabel(d: string) {
  const m: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
  return m[d] ?? d;
}

function getCourseButtonLabel(isPending: boolean, isEnrolled: boolean) {
  if (isPending) return 'Đang xử lý...';
  return isEnrolled ? 'Tiếp tục học →' : 'Đăng ký ngay →';
}

function shouldNavigateToCourseOnEnrollError(message: string) {
  const n = message.toLowerCase();
  return n.includes('already') || n.includes('đã đăng ký');
}

function materialTypeLabel(t: string) {
  const m: Record<string, string> = {
    ARTICLE: 'Bài viết',
    VIDEO: 'Video',
    COURSE: 'Khóa học',
    BOOK: 'Sách',
    PODCAST: 'Podcast',
    OTHER: 'Khác',
  };
  return m[t] ?? t;
}

function findActiveEnrollment(
  enrollments: Array<{ courseId: string; status: string; id: string }>,
  courseId: string
) {
  return enrollments.find((e) => e.courseId === courseId && e.status === 'ACTIVE');
}

/* ─────────────────────────────────────────────────────
   Course Panel (right side panel – like roadmap.sh resources)
───────────────────────────────────────────────────── */

interface CoursePanelProps {
  readonly course: RoadmapTopicCourse;
  readonly topic: RoadmapTopic;
  readonly isPending: boolean;
  readonly isEnrolled: boolean;
  readonly onClose: () => void;
  readonly onEnroll: (courseId: string) => void;
}

function CoursePanel({ course, topic, isPending, isEnrolled, onClose, onEnroll }: CoursePanelProps) {
  const { data, isLoading } = useCoursePreview(course.id);
  const materialsQuery = useTopicMaterials(topic.id);
  const preview = data?.result;
  const materials = materialsQuery.data?.result ?? [];
  const freeMaterials = materials.filter((m: TopicMaterial) => m.isFree);
  const paidMaterials = materials.filter((m: TopicMaterial) => !m.isFree);

  const progress = course.progress ?? 0;
  let statusLabel = 'Chưa bắt đầu';
  let statusCls = 'none';
  if (progress >= 100) { statusLabel = 'Hoàn thành'; statusCls = 'done'; }
  else if (isEnrolled) { statusLabel = 'Đang học'; statusCls = 'progress'; }

  return (
    <motion.aside
      className="rdp-panel"
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      {/* Panel header */}
      <div className="rdp-panel__header">
        <div className="rdp-panel__header-tabs">
          <span className="rdp-panel__tab rdp-panel__tab--active">Khóa học</span>
          {materials.length > 0 && (
            <span className="rdp-panel__tab-divider">·</span>
          )}
          {materials.length > 0 && (
            <span className="rdp-panel__tab">{materials.length} tài liệu</span>
          )}
        </div>
        <div className="rdp-panel__header-right">
          <span className={`rdp-panel__status-badge rdp-panel__status-badge--${statusCls}`}>
            {statusLabel}
          </span>
          <button className="rdp-panel__close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
      </div>

      {/* Panel body */}
      <div className="rdp-panel__body">
        {/* Course title */}
        <div className="rdp-panel__course-header">
          <span className="rdp-panel__topic-tag">{topic.title}</span>
          <h2 className="rdp-panel__title">{course.title}</h2>
          {course.description && <p className="rdp-panel__desc">{course.description}</p>}
        </div>

        {/* Thumbnail */}
        {(course.thumbnail ?? course.thumbnailUrl) && (
          <img
            className="rdp-panel__thumb"
            src={course.thumbnail ?? course.thumbnailUrl ?? undefined}
            alt={course.title}
          />
        )}

        {/* Meta row */}
        <div className="rdp-panel__meta-row">
          <div className="rdp-panel__meta-item">
            <span>Bài học</span>
            <strong>{course.totalLessons ?? preview?.totalLessons ?? 0}</strong>
          </div>
          {preview?.instructorName && (
            <div className="rdp-panel__meta-item">
              <span>Giáo viên</span>
              <strong>{preview.instructorName}</strong>
            </div>
          )}
          {progress > 0 && progress < 100 && (
            <div className="rdp-panel__meta-item">
              <span>Tiến độ</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
          )}
        </div>

        {/* Progress bar if in progress */}
        {isEnrolled && progress > 0 && (
          <div className="rdp-panel__progress-wrap">
            <div className="rdp-panel__progress-bar">
              <div className="rdp-panel__progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <span className="rdp-panel__progress-pct">{Math.round(progress)}%</span>
          </div>
        )}

        {isLoading && <p className="rdp-panel__loading">Đang tải chi tiết...</p>}

        {/* Lessons list */}
        {preview?.lessons && preview.lessons.length > 0 && (
          <div className="rdp-panel__section">
            <div className="rdp-panel__section-header">
              <span className="rdp-panel__section-icon">📚</span>
              <span className="rdp-panel__section-title">Nội dung khóa học</span>
            </div>
            <div className="rdp-panel__lessons">
              {preview.lessons.map((lesson: { 
                id: string; 
                lessonTitle: string;
                customTitle?: string;
                videoTitle?: string;
                videoUrl?: string;
                durationMinutes?: number;
                durationSeconds?: number;
              }, i: number) => {
                const durationMins = lesson.durationMinutes ?? (lesson.durationSeconds ? Math.round(lesson.durationSeconds / 60) : undefined);
                return (
                  <div key={lesson.id} className="rdp-panel__lesson-item">
                    <span className="rdp-panel__lesson-num">{i + 1}</span>
                    <div className="rdp-panel__lesson-content">
                      <span className="rdp-panel__lesson-title">
                        {lesson.customTitle || lesson.lessonTitle}
                      </span>
                      {lesson.videoTitle && (
                        <span className="rdp-panel__lesson-video">🎥 {lesson.videoTitle}</span>
                      )}
                    </div>
                    {durationMins && (
                      <span className="rdp-panel__lesson-duration">{durationMins}p</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Free materials */}
        {freeMaterials.length > 0 && (
          <div className="rdp-panel__section">
            <div className="rdp-panel__section-header rdp-panel__section-header--green">
              <span className="rdp-panel__section-icon">🔓</span>
              <span className="rdp-panel__section-title">Tài liệu miễn phí</span>
            </div>
            <div className="rdp-panel__resources">
              {freeMaterials.map((m: TopicMaterial) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rdp-panel__resource-item"
                >
                  <span className={`rdp-panel__resource-badge rdp-panel__resource-badge--${m.resourceType.toLowerCase()}`}>
                    {materialTypeLabel(m.resourceType)}
                  </span>
                  <span className="rdp-panel__resource-title">{m.title}</span>
                  <span className="rdp-panel__resource-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Paid materials */}
        {paidMaterials.length > 0 && (
          <div className="rdp-panel__section">
            <div className="rdp-panel__section-header rdp-panel__section-header--purple">
              <span className="rdp-panel__section-icon">⭐</span>
              <span className="rdp-panel__section-title">Tài liệu cao cấp</span>
            </div>
            <div className="rdp-panel__resources">
              {paidMaterials.map((m: TopicMaterial) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rdp-panel__resource-item rdp-panel__resource-item--premium"
                >
                  <span className={`rdp-panel__resource-badge rdp-panel__resource-badge--${m.resourceType.toLowerCase()}`}>
                    {materialTypeLabel(m.resourceType)}
                  </span>
                  <span className="rdp-panel__resource-title">{m.title}</span>
                  <span className="rdp-panel__resource-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div className="rdp-panel__footer">
        <button
          className={`rdp-panel__cta ${isEnrolled ? 'rdp-panel__cta--enrolled' : ''}`}
          onClick={() => onEnroll(course.id)}
          disabled={isPending}
        >
          {getCourseButtonLabel(isPending, isEnrolled)}
        </button>
      </div>
    </motion.aside>
  );
}

/* ─────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────── */
export default function RoadmapDetailPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error } = useRoadmapDetail(roadmapId);
  const myEnrollmentsQuery = useMyEnrollments();
  const enrollMutation = useEnroll();

  // Feedback hooks
  const myFeedbackQuery = useMyRoadmapFeedback(roadmapId);
  const submitFeedback = useSubmitRoadmapFeedback();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackChip, setFeedbackChip] = useState<string>('');
  const [courseActionMessage, setCourseActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const currentTopicNodeRef = useRef<HTMLButtonElement | null>(null);

  const roadmap = data?.result;
  const myFeedback = myFeedbackQuery.data?.result ?? null;

  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const deriveCurrentTopicIndexFromMark = () => {
    if (!sortedTopics.length) return 0;
    const score = Number(roadmap?.studentBestScore ?? NaN);
    if (!Number.isFinite(score)) return Number(roadmap?.completedTopicsCount ?? 0);

    for (let i = 0; i < sortedTopics.length; i += 1) {
      const mark = Number(sortedTopics[i].mark ?? NaN);
      if (Number.isFinite(mark) && score <= mark) {
        return i;
      }
    }

    return sortedTopics.length - 1;
  };

  const rawCurrentTopicIndex = Number(
    roadmap?.progress?.current_topic_index ?? deriveCurrentTopicIndexFromMark()
  );
  const currentTopicIndex = Number.isFinite(rawCurrentTopicIndex) ? Math.max(0, rawCurrentTopicIndex) : 0;
  const boundedCurrentTopicIndex = Math.min(currentTopicIndex, sortedTopics.length);
  const completedByLevel = Math.min(boundedCurrentTopicIndex, sortedTopics.length);
  const hasCurrentTopic = boundedCurrentTopicIndex < sortedTopics.length;
  const currentLevelLabel = hasCurrentTopic
    ? `Chủ đề ${boundedCurrentTopicIndex + 1}`
    : `Đã hoàn thành ${sortedTopics.length}/${sortedTopics.length} chủ đề`;

  const entryTestResult = (location.state as { entryTestResult?: RoadmapEntryTestResultResponse } | null)
    ?.entryTestResult;

  const activeCourseIdSet = new Set(
    (myEnrollmentsQuery.data?.result ?? [])
      .filter((e) => e.status === 'ACTIVE')
      .map((e) => e.courseId)
  );

  // Sync feedback from API
  useEffect(() => {
    if (!myFeedback) return;
    setFeedbackRating(myFeedback.rating);
    setFeedbackContent(myFeedback.content ?? '');
  }, [myFeedback]);

  useEffect(() => {
    if (!currentTopicNodeRef.current) return;
    currentTopicNodeRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [boundedCurrentTopicIndex, roadmap?.id]);

  // Find currently selected topic (to pass to panel)
  const selectedTopic = selectedTopicId
    ? sortedTopics.find((t) => t.id === selectedTopicId)
    : null;

  // Find currently selected course object
  const selectedCourse = selectedCourseId
    ? sortedTopics.flatMap((t) => t.courses ?? []).find((c) => c.id === selectedCourseId)
    : null;

  function handleEnrollOrContinue(courseId: string) {
    setCourseActionMessage(null);
    const isEnrolled = activeCourseIdSet.has(courseId);
    const enrollments = myEnrollmentsQuery.data?.result ?? [];

    if (isEnrolled) {
      const enrollment = findActiveEnrollment(enrollments, courseId);
      if (enrollment) navigate(`/student/courses/${enrollment.id}`);
      return;
    }

    enrollMutation.mutate(courseId, {
      onSuccess: (response) => {
        setCourseActionMessage({
          type: 'success',
          text: 'Đăng ký thành công! Đang mở khóa học...',
        });
        const enrollmentId = response.result?.id;
        if (enrollmentId) {
          navigate(`/student/courses/${enrollmentId}`);
        } else {
          myEnrollmentsQuery.refetch().then((res) => {
            const refreshed = findActiveEnrollment(res.data?.result ?? [], courseId);
            if (refreshed) navigate(`/student/courses/${refreshed.id}`);
          });
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Không thể đăng ký';
        if (shouldNavigateToCourseOnEnrollError(message)) {
          const enrollment = findActiveEnrollment(enrollments, courseId);
          if (enrollment) navigate(`/student/courses/${enrollment.id}`);
          return;
        }
        setCourseActionMessage({ type: 'error', text: message });
      },
    });
  }

  const feedbackIsValid =
    feedbackRating >= 1 && feedbackRating <= 5 && feedbackContent.length <= 2000;

  function submitRoadmapFeedback() {
    if (!roadmapId || !feedbackIsValid) {
      console.error('Invalid feedback:', { roadmapId, feedbackIsValid });
      return;
    }
    console.log('Submitting feedback:', { roadmapId, rating: feedbackRating, content: feedbackContent });
    submitFeedback.mutate(
      { roadmapId, payload: { rating: feedbackRating, content: feedbackContent.trim() } },
      {
        onSuccess: (res) => {
          console.log('Feedback submitted successfully:', res);
          setFeedbackRating(res.result.rating);
          setFeedbackContent(res.result.content ?? '');
          setCourseActionMessage({ type: 'success', text: '✓ Đã gửi đánh giá thành công!' });
          setTimeout(() => setCourseActionMessage(null), 3000);
        },
        onError: (err) => {
          console.error('Feedback submission failed:', err);
          const message = err instanceof Error ? err.message : 'Lỗi không xác định';
          setCourseActionMessage({ type: 'error', text: `Không thể gửi đánh giá: ${message}` });
        }
      }
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
        notificationCount={3}
      >
        <div className="rdp-skeleton-wrap">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rdp-skeleton" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !roadmap) {
    return (
      <DashboardLayout
        role="student"
        user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
        notificationCount={3}
      >
        <div className="rdp-error">⚠ Không thể tải lộ trình. Vui lòng thử lại.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="rdp-page">
        {/* ── Minimal sticky header ── */}
        <div className="rdp-header">
          <button type="button" className="rdp-header__back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <div className="rdp-header__info">
            <h1 className="rdp-header__title">{roadmap.name}</h1>
            {roadmap.description && <p className="rdp-header__sub">{roadmap.description}</p>}
          </div>
          <div className="rdp-header__progress">
            <span className="rdp-header__pct">{Math.round(roadmap.progressPercentage)}%</span>
            <div className="rdp-header__bar-track">
              <div
                className="rdp-header__bar-fill"
                style={{ width: `${roadmap.progressPercentage}%` }}
              />
            </div>
            <span className="rdp-header__count">
              {roadmap.completedTopicsCount}/{roadmap.totalTopicsCount}
            </span>
          </div>
        </div>

        {courseActionMessage && (
          <div className={`rdp-action-msg rdp-action-msg--${courseActionMessage.type}`}>
            {courseActionMessage.type === 'success' ? '✓ ' : '⚠ '}
            {courseActionMessage.text}
          </div>
        )}

        {/* ── Map + Panel ── */}
        <div className={`rdp-layout ${selectedCourse ? 'rdp-layout--panel' : ''}`}>
          <div className="rdp-map">
            <div className="rdp-map-title">
              <h2>Lộ trình học tập</h2>
              <p>Nhấn vào từng chủ đề để xem khóa học</p>
              <div className="rdp-level-banner">
                <span className="rdp-level-banner__level">🎯 Mức hiện tại: {currentLevelLabel}</span>
                <span className="rdp-level-banner__progress">
                  Tiến độ: {completedByLevel} / {sortedTopics.length} chủ đề hoàn thành
                </span>
                {roadmap.entryTest && entryTestResult && (
                  <span className="rdp-level-banner__entry">
                    Điểm đầu vào đã đặt mức bắt đầu của bạn.
                  </span>
                )}
                {roadmap.entryTest && roadmap.entryTest.studentStatus !== 'COMPLETED' && (
                  <Link 
                    className="rdp-level-banner__entry-link" 
                    to={`/student/assessments/${roadmap.entryTest.assessmentId}`}
                  >
                    Làm bài test đầu vào để xác định mức khởi điểm →
                  </Link>
                )}
              </div>
            </div>

            <div className="rdp-tree">
              {sortedTopics.map((topic, topicIdx) => {
                const topicStatus: 'done' | 'progress' | 'none' =
                  topicIdx < boundedCurrentTopicIndex || topic.status === 'COMPLETED'
                    ? 'done'
                    : topicIdx === boundedCurrentTopicIndex && boundedCurrentTopicIndex < sortedTopics.length
                      ? 'progress'
                      : 'none';
                const isTopicActive = selectedTopicId === topic.id;
                const courses = topic.courses ?? [];

                return (
                  <Fragment key={topic.id}>
                    {/* Vertical connector between topics */}
                    {topicIdx > 0 && (
                      <div className="rdp-vline-wrap">
                        <div className="rdp-vline" aria-hidden="true" />
                      </div>
                    )}

                    <div className="rdp-tree-row">
                      {/* ── Topic node (left column) ── */}
                      <div className="rdp-topic-area">
                        <button
                          type="button"
                          ref={(el) => {
                            if (topicIdx === boundedCurrentTopicIndex && boundedCurrentTopicIndex < sortedTopics.length) {
                              currentTopicNodeRef.current = el;
                            }
                          }}
                          className={[
                            'rdp-topic-node',
                            `rdp-topic-node--${topicStatus}`,
                            isTopicActive ? 'rdp-topic-node--active' : '',
                          ].join(' ')}
                          onClick={() => {
                            setSelectedTopicId(isTopicActive ? null : topic.id);
                            setSelectedCourseId(null);
                          }}
                        >
                          <span
                            className={`rdp-status-dot rdp-status-dot--${topicStatus}`}
                            aria-hidden="true"
                          />
                          <div className="rdp-topic-node__body">
                            <span className="rdp-topic-node__num">{topicIdx + 1}</span>
                            <span className="rdp-topic-node__title">{topic.title}</span>
                          </div>
                          <div className="rdp-topic-node__meta-row">
                            <span
                              className={`rdp-diff-badge rdp-diff-badge--${topic.difficulty.toLowerCase()}`}
                            >
                              {diffLabel(topic.difficulty)}
                            </span>
                            <span className="rdp-topic-node__course-count">
                              {courses.length} khóa
                            </span>
                          </div>
                          <span className={`rdp-topic-node__chevron ${isTopicActive ? 'rdp-topic-node__chevron--open' : ''}`} aria-hidden="true">
                            ›
                          </span>
                        </button>
                      </div>

                      {/* ── Courses branch (right column) ── */}
                      {isTopicActive && (
                        <div className="rdp-courses-branch">
                          {/* Horizontal dotted connector */}
                          <div className="rdp-branch-hconn" aria-hidden="true" />

                          {/* Courses tree */}
                          <div className="rdp-courses-tree">
                            {courses.length === 0 ? (
                              <div className="rdp-course-card rdp-course-card--empty">
                                <span className="rdp-course-card__title" style={{ color: '#9ca3af' }}>
                                  Chưa có khóa học
                                </span>
                                <span className="rdp-course-card__meta">Đang cập nhật...</span>
                              </div>
                            ) : (
                              courses.map((course) => {
                                const isEnrolled = activeCourseIdSet.has(course.id);
                                const isSelected = selectedCourseId === course.id;
                                const p = course.progress ?? 0;
                                let dotCls: 'done' | 'progress' | 'none';
                                if (p >= 100) dotCls = 'done';
                                else if (p > 0 || isEnrolled) dotCls = 'progress';
                                else dotCls = 'none';

                                return (
                                  <div key={course.id} className="rdp-course-row">
                                    <button
                                      type="button"
                                      className={`rdp-course-card ${isSelected ? 'rdp-course-card--selected' : ''}`}
                                      onClick={() =>
                                        setSelectedCourseId(isSelected ? null : course.id)
                                      }
                                    >
                                      <div className="rdp-course-card__left">
                                        <span className={`rdp-status-dot rdp-status-dot--${dotCls}`} />
                                      </div>
                                      <div className="rdp-course-card__body">
                                        <span className="rdp-course-card__title">{course.title}</span>
                                        <div className="rdp-course-card__bottom">
                                          <span className="rdp-course-card__meta">
                                            {course.totalLessons ?? 0} bài học
                                          </span>
                                          {p >= 100 && (
                                            <span className="rdp-course-tag rdp-course-tag--done">✓ Hoàn thành</span>
                                          )}
                                          {isEnrolled && p < 100 && (
                                            <span className="rdp-course-tag rdp-course-tag--enrolled">Đang học</span>
                                          )}
                                        </div>
                                        {isEnrolled && p > 0 && (
                                          <div className="rdp-course-card__progress">
                                            <div
                                              className="rdp-course-card__progress-fill"
                                              style={{ width: `${Math.min(100, p)}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <span className="rdp-course-card__arrow">›</span>
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
          {/* /rdp-map */}

          {/* ── Side Panel ── */}
          <AnimatePresence>
            {selectedCourse && selectedTopic && (
              <CoursePanel
                course={selectedCourse}
                topic={selectedTopic}
                isPending={enrollMutation.isPending}
                isEnrolled={activeCourseIdSet.has(selectedCourse.id)}
                onClose={() => setSelectedCourseId(null)}
                onEnroll={handleEnrollOrContinue}
              />
            )}
          </AnimatePresence>
        </div>
        {/* /rdp-layout */}

        {/* ── Feedback ── */}
        <div className="rdp-feedback">
          <div className="rdp-feedback__header">
            <div className="rdp-feedback__icon">⭐</div>
            <div>
              <h3 className="rdp-feedback__title">Đánh giá lộ trình</h3>
              <p className="rdp-feedback__sub">
                {myFeedback 
                  ? 'Cập nhật đánh giá của bạn về lộ trình học này.'
                  : 'Chia sẻ cảm nhận của bạn về lộ trình học này.'}
              </p>
            </div>
          </div>
          {myFeedbackQuery.isLoading && (
            <p className="rdp-feedback__loading">Đang tải đánh giá...</p>
          )}
          {!myFeedbackQuery.isLoading && (
            <>
              {myFeedback && (
                <div className="rdp-feedback__existing">
                  <span className="rdp-feedback__existing-badge">✓ Đã đánh giá</span>
                  <span className="rdp-feedback__existing-date">
                    Cập nhật lần cuối: {new Date(myFeedback.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              <div className="rdp-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`rdp-star ${feedbackRating >= star ? 'rdp-star--active' : ''}`}
                    onClick={() => setFeedbackRating(star)}
                    aria-label={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="rdp-feedback__chips">
                {[
                  '😐 Bình thường',
                  '😊 Hay',
                  '🎯 Đúng trọng tâm',
                  '💪 Thách thức',
                  '🏆 Xuất sắc',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`rdp-feedback__chip ${feedbackChip === chip ? 'rdp-feedback__chip--active' : ''}`}
                    onClick={() => setFeedbackChip(feedbackChip === chip ? '' : chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="rdp-feedback__field">
                <textarea
                  rows={4}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Chia sẻ cảm nhận, điểm mạnh của lộ trình..."
                />
                <span className="rdp-feedback__char-count">{feedbackContent.length} / 2000</span>
              </div>
              <button
                type="button"
                className="rdp-feedback__submit"
                onClick={submitRoadmapFeedback}
                disabled={submitFeedback.isPending || !feedbackIsValid}
              >
                {submitFeedback.isPending ? 'Đang lưu...' : myFeedback ? '✓ Cập nhật đánh giá' : '✓ Gửi đánh giá'}
              </button>
            </>
          )}
        </div>
      </div>
      {/* /rdp-page */}
    </DashboardLayout>
  );
}
