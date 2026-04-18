import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { useEnroll, useMyEnrollments } from '../../hooks/useCourses';
import {
  useMyRoadmapFeedback,
  useRoadmapDetail,
  useRoadmapEntryTest,
  useRoadmapEntryTestActiveAttempt,
  useSubmitRoadmapFeedback,
} from '../../hooks/useRoadmaps';
import type { RoadmapEntryTestResultResponse, RoadmapTopic } from '../../types';
import './roadmap-detail-page.css';

/* ─────────────────────────────────────────────────────
   Pure Helpers
───────────────────────────────────────────────────── */
function diffLabel(d: string) {
  const m: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
  return m[d] ?? d;
}

function diffColorClass(d: string) {
  if (d === 'EASY') return 'rdp-node__diff--easy';
  if (d === 'HARD') return 'rdp-node__diff--hard';
  return 'rdp-node__diff--medium';
}

function getEntryActionLabel(status?: string) {
  if (status === 'IN_PROGRESS') return 'Tiếp tục bài test';
  if (status === 'COMPLETED') return 'Xem lại kết quả';
  return 'Bắt đầu bài test';
}

function getEntryAssessmentStatusLabel(status?: string) {
  switch (status) {
    case 'IN_PROGRESS': return 'Đang làm';
    case 'COMPLETED': return 'Đã hoàn thành';
    default: return 'Chưa làm';
  }
}

function getCourseButtonLabel(isPending: boolean, isEnrolled: boolean) {
  if (isPending) return 'Đang xử lý...';
  return isEnrolled ? 'Tiếp tục học →' : 'Đăng ký & Học ngay →';
}

function getFeedbackErrorText(message: string) {
  if (message.startsWith('400')) return 'Vui lòng chọn sao từ 1-5 và nội dung dưới 2000 ký tự.';
  if (message.startsWith('401')) return 'Vui lòng đăng nhập để gửi đánh giá.';
  return message.replace(/^\d{3}\s+[^:]+:\s*/, '');
}

function getFeedbackSubmitLabel(isPending: boolean, hasFeedback: boolean) {
  if (isPending) return 'Đang lưu...';
  return hasFeedback ? 'Cập nhật đánh giá' : 'Gửi đánh giá';
}

function shouldNavigateToCourseOnEnrollError(message: string) {
  const n = message.toLowerCase();
  return n.includes('already') || n.includes('đã đăng ký');
}

function resolveEntryTestState(params: {
  entryStatus?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  entryActiveAttemptId?: string | null;
  activeAttemptId?: string | null;
}) {
  const hasActiveAttempt = Boolean(params.activeAttemptId || params.entryActiveAttemptId);
  const resolvedEntryStatus =
    params.entryStatus === 'IN_PROGRESS' && !hasActiveAttempt ? 'UPCOMING' : params.entryStatus;
  const hasInProgressAttempt = resolvedEntryStatus === 'IN_PROGRESS' && hasActiveAttempt;
  return { resolvedEntryStatus, hasInProgressAttempt };
}

/* ─────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────── */

interface TopicDetailPanelProps {
  topic: RoadmapTopic;
  isPending: boolean;
  activeCourseIdSet: Set<string>;
  onClose: () => void;
  onOpenCourse: (courseId?: string | null) => void;
}

function TopicDetailPanel({ topic, isPending, activeCourseIdSet, onClose, onOpenCourse }: TopicDetailPanelProps) {
  return (
    <motion.aside
      className="rdp-panel"
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <div className="rdp-panel__header">
        <div>
          <span className={`rdp-node__diff ${diffColorClass(topic.difficulty)}`}>
            {diffLabel(topic.difficulty)}
          </span>
          <h2 className="rdp-panel__title">{topic.title}</h2>
        </div>
        <button className="rdp-panel__close" onClick={onClose} aria-label="Đóng">✕</button>
      </div>

      {topic.description && (
        <p className="rdp-panel__desc">{topic.description}</p>
      )}

      <div className="rdp-panel__divider" />

      {topic.courses && topic.courses.length > 0 ? (
        <div className="rdp-panel__courses">
          <p className="rdp-panel__course-label">Khóa học liên kết ({topic.courses.length})</p>
          {topic.courses.map((course) => (
            <div key={course.id} className="rdp-panel__course">
              {course.thumbnailUrl && (
                <img
                  className="rdp-panel__course-thumb"
                  src={course.thumbnailUrl}
                  alt={course.title}
                />
              )}
              <div className="rdp-panel__course-info">
                <h3 className="rdp-panel__course-title">{course.title}</h3>
                {course.description && (
                  <p className="rdp-panel__course-desc">{course.description}</p>
                )}
                {course.totalLessons != null && (
                  <span className="rdp-panel__course-meta">📚 {course.totalLessons} bài học</span>
                )}
              </div>

              <button
                className={`rdp-panel__cta ${activeCourseIdSet.has(course.id) ? 'rdp-panel__cta--enrolled' : ''}`}
                onClick={() => onOpenCourse(course.id)}
                disabled={isPending}
              >
                {getCourseButtonLabel(isPending, activeCourseIdSet.has(course.id))}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rdp-panel__no-course">
          <span className="rdp-panel__no-course-icon">📭</span>
          <p>Chủ đề này chưa có khóa học liên kết.</p>
        </div>
      )}
    </motion.aside>
  );
}

/* ─────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────── */
export default function RoadmapDetailPage() {
  const { roadmapId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useRoadmapDetail(roadmapId);
  const entryTestQuery = useRoadmapEntryTest(roadmapId);
  const myFeedbackQuery = useMyRoadmapFeedback(roadmapId);
  const submitFeedback = useSubmitRoadmapFeedback();
  const myEnrollmentsQuery = useMyEnrollments();
  const enrollMutation = useEnroll();
  const activeAttemptQuery = useRoadmapEntryTestActiveAttempt(roadmapId);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [courseActionMessage, setCourseActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [entryTestOpen, setEntryTestOpen] = useState(false);

  const roadmap = data?.result;
  const entryResult =
    (location.state as { entryTestResult?: RoadmapEntryTestResultResponse } | null)?.entryTestResult ?? null;
  const entryTest = entryTestQuery.data?.result;
  const entryStatus = entryTest?.studentStatus;
  const activeAttempt = activeAttemptQuery.data?.result;
  const myFeedback = myFeedbackQuery.data?.result ?? null;
  const bestScore =
    typeof roadmap?.studentBestScore === 'number'
      ? roadmap.studentBestScore
      : entryResult?.studentBestScore;

  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const activeCourseIdSet = new Set(
    (myEnrollmentsQuery.data?.result ?? [])
      .filter((e) => e.status === 'ACTIVE')
      .map((e) => e.courseId)
  );

  const selectedTopic = selectedTopicId ? sortedTopics.find((t) => t.id === selectedTopicId) ?? null : null;

  // Sync feedback from API
  useEffect(() => {
    if (!myFeedback) return;
    setFeedbackRating(myFeedback.rating);
    setFeedbackContent(myFeedback.content ?? '');
  }, [myFeedback]);

  const { resolvedEntryStatus, hasInProgressAttempt } = resolveEntryTestState({
    entryStatus,
    entryActiveAttemptId: entryTest?.activeAttemptId,
    activeAttemptId: activeAttempt?.attemptId,
  });

  const canOpenEntryAssessment = Boolean(entryTest?.assessmentId);
  const canStartEntryAssessment = entryTest?.canStart ?? false;

  function openTopicCourse(courseId?: string | null) {
    if (!courseId) {
      setCourseActionMessage({ type: 'error', text: 'Chủ đề này chưa có khóa học liên kết.' });
      return;
    }
    setCourseActionMessage(null);

    const isEnrolled = activeCourseIdSet.has(courseId);
    if (isEnrolled) {
      // Find the enrollment ID for this course
      const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
        (e) => e.courseId === courseId && e.status === 'ACTIVE'
      );
      
      if (enrollment) {
        navigate(`/student/courses/${enrollment.id}`);
      } else {
        setCourseActionMessage({ type: 'error', text: 'Không tìm thấy thông tin đăng ký.' });
      }
      return;
    }

    enrollMutation.mutate(courseId, {
      onSuccess: (response) => {
        setCourseActionMessage({ type: 'success', text: 'Đăng ký thành công! Đang mở khóa học...' });
        // Use the enrollment ID from the response
        const enrollmentId = response.result?.id;
        if (enrollmentId) {
          navigate(`/student/courses/${enrollmentId}`);
        } else {
          // Fallback: refetch enrollments and find the new one
          myEnrollmentsQuery.refetch().then(() => {
            const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
              (e) => e.courseId === courseId && e.status === 'ACTIVE'
            );
            if (enrollment) {
              navigate(`/student/courses/${enrollment.id}`);
            }
          });
        }
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Không thể đăng ký';
        if (shouldNavigateToCourseOnEnrollError(message)) {
          // Find existing enrollment
          const enrollment = (myEnrollmentsQuery.data?.result ?? []).find(
            (e) => e.courseId === courseId && e.status === 'ACTIVE'
          );
          if (enrollment) {
            navigate(`/student/courses/${enrollment.id}`);
          }
          return;
        }
        setCourseActionMessage({ type: 'error', text: message });
      },
    });
  }

  const feedbackIsValid = feedbackRating >= 1 && feedbackRating <= 5 && feedbackContent.length <= 2000;

  function submitRoadmapFeedback() {
    if (!roadmapId || !feedbackIsValid) return;
    submitFeedback.mutate(
      { roadmapId, payload: { rating: feedbackRating, content: feedbackContent.trim() } },
      {
        onSuccess: (res) => {
          setFeedbackRating(res.result.rating);
          setFeedbackContent(res.result.content ?? '');
          setFeedbackMessage({ type: 'success', text: myFeedback ? 'Đã cập nhật đánh giá.' : 'Đánh giá đã được ghi nhận.' });
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Lỗi không xác định';
          setFeedbackMessage({ type: 'error', text: getFeedbackErrorText(message) });
        },
      }
    );
  }

  /* ──────────── Skeleton ──────────── */
  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }} notificationCount={3}>
        <div className="rdp-skeleton-wrap">
          {[1, 2, 3].map((i) => <div key={i} className="rdp-skeleton" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !roadmap) {
    return (
      <DashboardLayout role="student" user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }} notificationCount={3}>
        <div className="rdp-error">⚠ Không thể tải lộ trình. Vui lòng thử lại.</div>
      </DashboardLayout>
    );
  }

  /* ──────────── Main render ──────────── */
  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className={`rdp-layout ${selectedTopic ? 'rdp-layout--panel-open' : ''}`}>

        {/* ── Main content ── */}
        <div className="rdp-main">

          {/* ── Hero header ── */}
          <div className="rdp-hero">
            <div className="rdp-hero__content">
              <span className="rdp-hero__badge">Lộ trình học tập</span>
              <h1 className="rdp-hero__title">{roadmap.name}</h1>
              {roadmap.description && <p className="rdp-hero__desc">{roadmap.description}</p>}
              <div className="rdp-hero__meta">
                <span className="rdp-hero__meta-item">📚 {roadmap.totalTopicsCount} chủ đề</span>
                {typeof bestScore === 'number' && (
                  <span className="rdp-hero__meta-item">🏆 Điểm test: <strong>{bestScore}</strong></span>
                )}
              </div>
            </div>
            <div className="rdp-hero__progress">
              <div className="rdp-hero__progress-ring">
                <svg viewBox="0 0 80 80" className="rdp-ring-svg">
                  <circle cx="40" cy="40" r="32" className="rdp-ring__bg" />
                  <circle
                    cx="40" cy="40" r="32"
                    className="rdp-ring__fill"
                    strokeDasharray={`${(roadmap.progressPercentage / 100) * 201} 201`}
                  />
                </svg>
                <span className="rdp-ring__label">{roadmap.progressPercentage}%</span>
              </div>
              <p className="rdp-hero__progress-text">
                {roadmap.completedTopicsCount}/{roadmap.totalTopicsCount} chủ đề
              </p>
            </div>
          </div>

          {/* ── Global action message ── */}
          {courseActionMessage && (
            <div className={`rdp-action-msg rdp-action-msg--${courseActionMessage.type}`}>
              {courseActionMessage.type === 'success' ? '✓ ' : '⚠ '}
              {courseActionMessage.text}
            </div>
          )}

          {/* ── Entry test (collapsible) ── */}
          {entryTest && (
            <div className="rdp-collapsible">
              <button
                className="rdp-collapsible__trigger"
                onClick={() => setEntryTestOpen((o) => !o)}
              >
                <span>🎯 Bài kiểm tra đầu vào</span>
                <div className="rdp-collapsible__trigger-right">
                  {resolvedEntryStatus && (
                    <span className={`rdp-entry-status rdp-entry-status--${resolvedEntryStatus?.toLowerCase()}`}>
                      {getEntryAssessmentStatusLabel(resolvedEntryStatus)}
                    </span>
                  )}
                  <span className="rdp-collapsible__chevron">{entryTestOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {entryTestOpen && (
                <div className="rdp-collapsible__body">
                  <p className="rdp-entry__hint">
                    {entryTest.title} · {entryTest.totalQuestions} câu
                    {entryTest.timeLimitMinutes ? ` · ${entryTest.timeLimitMinutes} phút` : ''}
                  </p>
                  <p className="rdp-entry__hint">
                    Kết quả bài test giúp gợi ý chủ đề phù hợp, không khoá bất kỳ chủ đề nào.
                  </p>
                  <button
                    className="rdp-entry__btn"
                    disabled={!canOpenEntryAssessment || (!hasInProgressAttempt && !canStartEntryAssessment)}
                    onClick={() => navigate(`/roadmaps/${roadmapId}/entry-test/take`)}
                  >
                    {getEntryActionLabel(resolvedEntryStatus)}
                  </button>
                  {entryResult?.newlyUnlockedTopics && entryResult.newlyUnlockedTopics.length > 0 && (
                    <div className="rdp-entry__unlocked">
                      🎉 Vừa gợi ý {entryResult.newlyUnlockedTopics.length} chủ đề mới dựa trên điểm của bạn!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Roadmap graph ── */}
          <div className="rdp-graph-wrap">
            <div className="rdp-graph-header">
              <h2 className="rdp-graph-header__title">Bản đồ học tập</h2>
              <p className="rdp-graph-header__sub">Nhấn vào chủ đề để xem chi tiết và đăng ký khóa học</p>
            </div>

            <div className="rdp-graph">
              {sortedTopics.map((topic, index) => {
                const isSelected = selectedTopicId === topic.id;
                const hasAnyCourse = topic.courses && topic.courses.length > 0;
                const isEnrolled = hasAnyCourse && topic.courses!.some(course => activeCourseIdSet.has(course.id));

                let stateClass = 'rdp-node--default';
                if (isSelected) stateClass = 'rdp-node--selected';
                else if (isEnrolled) stateClass = 'rdp-node--enrolled';

                return (
                  <div key={topic.id} className="rdp-node-wrapper">
                    {/* Connector line between nodes */}
                    {index < sortedTopics.length - 1 && (
                      <div className="rdp-connector">
                        <div className={`rdp-connector__line ${isEnrolled ? 'rdp-connector__line--enrolled' : ''}`} />
                      </div>
                    )}

                    <motion.button
                      className={`rdp-node ${stateClass}`}
                      onClick={() => setSelectedTopicId(isSelected ? null : topic.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {/* Order badge */}
                      <div className={`rdp-node__badge ${isEnrolled ? 'rdp-node__badge--enrolled' : ''}`}>
                        {isEnrolled ? '✓' : topic.sequenceOrder}
                      </div>

                      <div className="rdp-node__body">
                        <strong className="rdp-node__title">{topic.title}</strong>
                        <span className={`rdp-node__diff ${diffColorClass(topic.difficulty)}`}>
                          {diffLabel(topic.difficulty)}
                        </span>

                        {hasAnyCourse ? (
                          <span className="rdp-node__course">
                            📘 {topic.courses!.length === 1 
                              ? topic.courses![0].title 
                              : `${topic.courses!.length} khóa học`}
                            {topic.courses!.length === 1 && topic.courses![0].totalLessons != null && (
                              <em> · {topic.courses![0].totalLessons} bài</em>
                            )}
                          </span>
                        ) : (
                          <span className="rdp-node__no-course">Chưa có khóa học</span>
                        )}

                        {isEnrolled && (
                          <span className="rdp-node__enrolled-tag">Đã đăng ký</span>
                        )}
                      </div>

                      {hasAnyCourse && (
                        <div className="rdp-node__footer">
                          <span className="rdp-node__action-hint">
                            {isEnrolled ? 'Tiếp tục →' : 'Xem & Đăng ký →'}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  </div>
                );
              })}

              {sortedTopics.length === 0 && (
                <div className="rdp-graph__empty">
                  <span>🗺</span>
                  <p>Lộ trình này chưa có chủ đề nào.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Feedback ── */}
          <div className="rdp-feedback">
            <div className="rdp-feedback__header">
              <h3 className="rdp-feedback__title">Đánh giá lộ trình</h3>
              <p className="rdp-feedback__sub">Chia sẻ cảm nhận của bạn về lộ trình học này.</p>
            </div>

            {myFeedbackQuery.isLoading && <p className="rdp-feedback__state">Đang tải đánh giá...</p>}

            {!myFeedbackQuery.isLoading && (
              <>
                <div className="rdp-stars" role="radiogroup">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rdp-star ${feedbackRating >= star ? 'rdp-star--active' : ''}`}
                      onClick={() => setFeedbackRating(star)}
                      aria-label={`${star} sao`}
                      disabled={submitFeedback.isPending}
                    >★</button>
                  ))}
                </div>

                <label className="rdp-feedback__field">
                  <textarea
                    rows={4}
                    value={feedbackContent}
                    onChange={(e) => { setFeedbackContent(e.target.value); setFeedbackMessage(null); }}
                    maxLength={2000}
                    placeholder="Chia sẻ cảm nhận, điểm mạnh, hoặc điểm cần cải thiện..."
                    disabled={submitFeedback.isPending}
                  />
                  <small className="rdp-feedback__counter">{feedbackContent.length}/2000</small>
                </label>

                {feedbackMessage && (
                  <p className={`rdp-feedback__message rdp-feedback__message--${feedbackMessage.type}`}>
                    {feedbackMessage.text}
                  </p>
                )}

                <button
                  className="rdp-feedback__submit"
                  onClick={submitRoadmapFeedback}
                  disabled={submitFeedback.isPending || !feedbackIsValid}
                >
                  {getFeedbackSubmitLabel(submitFeedback.isPending, Boolean(myFeedback))}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Side panel ── */}
        <AnimatePresence>
          {selectedTopic && (
            <TopicDetailPanel
              topic={selectedTopic}
              isPending={enrollMutation.isPending}
              activeCourseIdSet={activeCourseIdSet}
              onClose={() => setSelectedTopicId(null)}
              onOpenCourse={openTopicCourse}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
