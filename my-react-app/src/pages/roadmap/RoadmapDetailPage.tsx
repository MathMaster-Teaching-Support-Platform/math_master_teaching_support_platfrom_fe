import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { useCoursePreview, useEnroll, useMyEnrollments } from '../../hooks/useCourses';
import {
  useMyRoadmapFeedback,
  useRoadmapDetail,
  useSubmitRoadmapFeedback,
} from '../../hooks/useRoadmaps';
import type { RoadmapTopicCourse } from '../../types';
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

function getTopicStatus(
  topic: { courses?: Array<{ id: string; progress?: number }> },
  enrolledIds: Set<string>
): 'done' | 'progress' | 'none' {
  const courses = topic.courses ?? [];
  if (courses.length === 0) return 'none';
  if (courses.every((c) => (c.progress ?? 0) >= 100)) return 'done';
  if (courses.some((c) => enrolledIds.has(c.id) || (c.progress ?? 0) > 0)) return 'progress';
  return 'none';
}

/* ─────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────── */

interface CoursePreviewPanelProps {
  course: RoadmapTopicCourse;
  isPending: boolean;
  isEnrolled: boolean;
  onClose: () => void;
  onEnroll: (courseId: string) => void;
}

function CoursePreviewPanel({
  course,
  isPending,
  isEnrolled,
  onClose,
  onEnroll,
}: CoursePreviewPanelProps) {
  const { data, isLoading } = useCoursePreview(course.id);
  const preview = data?.result;

  return (
    <motion.aside
      className="rdp-panel"
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <div className="rdp-panel__header">
        <div>
          <span className="rdp-panel__badge">Khóa học</span>
          <h2 className="rdp-panel__title">{course.title}</h2>
        </div>
        <button className="rdp-panel__close" onClick={onClose} aria-label="Đóng">
          ✕
        </button>
      </div>

      <div className="rdp-panel__body">
        {(course.thumbnail ?? course.thumbnailUrl) && (
          <img
            className="rdp-panel__thumb"
            src={course.thumbnail ?? course.thumbnailUrl ?? undefined}
            alt={course.title}
          />
        )}

        {course.description && <p className="rdp-panel__desc">{course.description}</p>}

        <div className="rdp-panel__meta-row">
          <div className="rdp-panel__meta-item">
            <span>Bài học</span>
            <strong>{course.totalLessons ?? preview?.totalLessons ?? 0} bài</strong>
          </div>
          {preview?.instructorName && (
            <div className="rdp-panel__meta-item">
              <span>Giáo viên</span>
              <strong>{preview.instructorName}</strong>
            </div>
          )}
        </div>

        {isLoading && <p>Đang tải thông tin chi tiết...</p>}

        {preview?.lessons && preview.lessons.length > 0 && (
          <div className="rdp-panel__lessons">
            <h3>Danh sách bài học</h3>
            {preview.lessons.map((lesson: any, i: number) => (
              <div key={lesson.id} className="rdp-panel__lesson-item">
                <span className="rdp-panel__lesson-title">
                  {i + 1}. {lesson.title}
                </span>
                {lesson.durationMinutes && (
                  <span className="rdp-panel__lesson-duration">{lesson.durationMinutes}p</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

  const roadmap = data?.result;
  const myFeedback = myFeedbackQuery.data?.result ?? null;

  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

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

  // Find currently selected course object
  const selectedCourse = selectedCourseId
    ? sortedTopics.flatMap((t) => t.courses ?? []).find((c) => c.id === selectedCourseId)
    : null;

  function handleEnrollOrContinue(courseId: string) {
    setCourseActionMessage(null);
    const isEnrolled = activeCourseIdSet.has(courseId);

    if (isEnrolled) {
      const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
        (e) => e.courseId === courseId && e.status === 'ACTIVE'
      );
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
        if (enrollmentId) navigate(`/student/courses/${enrollmentId}`);
        else {
          myEnrollmentsQuery.refetch().then(() => {
            const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
              (e) => e.courseId === courseId && e.status === 'ACTIVE'
            );
            if (enrollment) navigate(`/student/courses/${enrollment.id}`);
          });
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Không thể đăng ký';
        if (shouldNavigateToCourseOnEnrollError(message)) {
          const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
            (e) => e.courseId === courseId && e.status === 'ACTIVE'
          );
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
    if (!roadmapId || !feedbackIsValid) return;
    submitFeedback.mutate(
      { roadmapId, payload: { rating: feedbackRating, content: feedbackContent.trim() } },
      {
        onSuccess: (res) => {
          setFeedbackRating(res.result.rating);
          setFeedbackContent(res.result.content ?? '');
        },
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
            </div>

            {sortedTopics.map((topic, topicIdx) => (
              <Fragment key={topic.id}>
                {topicIdx > 0 && <div className="rdp-vline" aria-hidden="true" />}

                <div className="rdp-topic-group">
                  {/* Topic node */}
                  <button
                    type="button"
                    className={`rdp-topic-node ${selectedTopicId === topic.id ? 'rdp-topic-node--active' : ''}`}
                    onClick={() =>
                      setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)
                    }
                  >
                    <span
                      className={`rdp-status-dot rdp-status-dot--${getTopicStatus(topic, activeCourseIdSet)}`}
                    />
                    <span className="rdp-topic-node__num">{topicIdx + 1}.</span>
                    <span className="rdp-topic-node__title">{topic.title}</span>
                    <span
                      className={`rdp-diff-badge rdp-diff-badge--${topic.difficulty.toLowerCase()}`}
                    >
                      {diffLabel(topic.difficulty)}
                    </span>
                    <span className="rdp-topic-node__meta">
                      {(topic.courses ?? []).length} khóa học
                    </span>
                    <span className="rdp-topic-node__chevron" aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  {/* Courses — expand when topic is active */}
                  {selectedTopicId === topic.id && (
                    <div className="rdp-courses-wrap">
                      <div className="rdp-courses-vline" aria-hidden="true" />
                      <div className="rdp-courses-row">
                        {(topic.courses ?? []).length > 0 ? (
                          (topic.courses ?? []).map((course) => {
                            const isEnrolled = activeCourseIdSet.has(course.id);
                            const isSelected = selectedCourseId === course.id;
                            const p = course.progress ?? 0;
                            let dotClass: 'done' | 'progress' | 'none';
                            if (p >= 100) {
                              dotClass = 'done';
                            } else if (p > 0) {
                              dotClass = 'progress';
                            } else {
                              dotClass = 'none';
                            }
                            let tag: { cls: string; label: string };
                            if (p >= 100) {
                              tag = { cls: 'done', label: '✓ Hoàn thành' };
                            } else if (isEnrolled) {
                              tag = { cls: 'enrolled', label: '● Đang học' };
                            } else {
                              tag = { cls: 'new', label: '○ Chưa bắt đầu' };
                            }

                            return (
                              <button
                                key={course.id}
                                type="button"
                                className={`rdp-course-node ${isSelected ? 'rdp-course-node--selected' : ''}`}
                                onClick={() => setSelectedCourseId(course.id)}
                              >
                                <span className={`rdp-status-dot rdp-status-dot--${dotClass}`} />
                                <div className="rdp-course-node__body">
                                  <span className="rdp-course-node__title">{course.title}</span>
                                  <span className="rdp-course-node__meta">
                                    {course.totalLessons ?? 0} bài học
                                  </span>
                                  <span
                                    className={`rdp-course-node__tag rdp-course-node__tag--${tag.cls}`}
                                  >
                                    {tag.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="rdp-course-node" style={{ cursor: 'default' }}>
                            <span className="rdp-status-dot rdp-status-dot--none" />
                            <div className="rdp-course-node__body">
                              <span className="rdp-course-node__title" style={{ color: '#9ca3af' }}>
                                Chưa có khóa học
                              </span>
                              <span className="rdp-course-node__meta">Đang cập nhật...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
          {/* /rdp-map */}

          {/* ── Side Panel ── */}
          <AnimatePresence>
            {selectedCourse && (
              <CoursePreviewPanel
                course={selectedCourse}
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
              <p className="rdp-feedback__sub">Chia sẻ cảm nhận của bạn về lộ trình học này.</p>
            </div>
          </div>
          {!myFeedbackQuery.isLoading && (
            <>
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
                {submitFeedback.isPending ? 'Đang lưu...' : '✓ Gửi đánh giá'}
              </button>
            </>
          )}
        </div>
      </div>
      {/* /rdp-page */}
    </DashboardLayout>
  );
}
