import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { useEnroll, useMyEnrollments } from '../../hooks/useCourses';
import {
  useRoadmapEntryTestActiveAttempt,
  useMyRoadmapFeedback,
  useRoadmapEntryTest,
  useRoadmapDetail,
  useSubmitRoadmapFeedback,
  useStudentTopicMaterials,
} from '../../hooks/useRoadmaps';
import type {
  RoadmapEntryTestResultResponse,
  RoadmapTopic,
  TopicMaterialResourceType,
} from '../../types';
import './roadmap-detail-page.css';

/* ─────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────── */
const TOPICS_PER_ROW = 4;
const ROW_H = 170;
const CANVAS_PAD_TOP = 80;

/** Build a single continuous snake-path d string for the SVG road. */
function buildSnakePath(rowCount: number): string {
  let d = '';
  for (let row = 0; row < rowCount; row++) {
    const y = CANVAS_PAD_TOP + row * ROW_H;
    const prevY = CANVAS_PAD_TOP + (row - 1) * ROW_H;

    if (row === 0) {
      d += `M 80,${y} C 300,${y - 50} 600,${y + 50} 820,${y}`;
    } else if (row % 2 === 1) {
      // connector right side (820, prevY) → (820, y)
      d += ` C 875,${prevY + 30} 875,${y - 30} 820,${y}`;
      // row R→L
      d += ` C 600,${y - 50} 300,${y + 50} 80,${y}`;
    } else {
      // connector left side (80, prevY) → (80, y)
      d += ` C 25,${prevY + 30} 25,${y - 30} 80,${y}`;
      // row L→R
      d += ` C 300,${y - 50} 600,${y + 50} 820,${y}`;
    }
  }
  return d;
}

/** Compute the left% and topPx of a topic node by its sequential index. */
function nodePos(index: number) {
  const row = Math.floor(index / TOPICS_PER_ROW);
  const col = index % TOPICS_PER_ROW;
  const visualCol = row % 2 === 1 ? TOPICS_PER_ROW - 1 - col : col;
  const step = TOPICS_PER_ROW > 1 ? 80 / (TOPICS_PER_ROW - 1) : 0;
  return {
    leftPct: 10 + visualCol * step,
    topPx: CANVAS_PAD_TOP - 4 + row * ROW_H,
  };
}

function diffLabel(d: string) {
  const m: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
  return m[d] ?? d;
}

function getEntryAssessmentStatusLabel(status?: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Đang làm';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    default:
      return 'Sẵn sàng';
  }
}

function getEntryActionLabel(status?: string) {
  if (status === 'IN_PROGRESS') return 'Tiếp tục bài làm';
  if (status === 'COMPLETED') return 'Đã hoàn thành';
  return 'Bắt đầu bài test';
}

function getFeedbackErrorText(message: string) {
  if (message.startsWith('400')) {
    return 'Validation failed. Please choose a rating from 1 to 5 and keep content within 2000 characters.';
  }
  if (message.startsWith('401')) {
    return 'Please sign in to submit feedback.';
  }
  if (message.startsWith('403')) {
    return 'You do not have permission to submit feedback for this roadmap.';
  }
  if (message.startsWith('404')) {
    return 'Roadmap not found.';
  }
  return message.replace(/^\d{3}\s+[^:]+:\s*/, '');
}

function getFeedbackSubmitLabel(isPending: boolean, hasFeedback: boolean) {
  if (isPending) return 'Saving...';
  if (hasFeedback) return 'Update feedback';
  return 'Submit feedback';
}

function shouldNavigateToCourseOnEnrollError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already') ||
    normalized.includes('already enrolled') ||
    normalized.includes('đã đăng ký')
  );
}

function getTopicCourseButtonLabel(title: string, isPending: boolean, isEnrolled: boolean) {
  const prefix = isEnrolled ? 'Mở' : 'ĐK + Mở';
  if (isPending) return 'Đang xử lý...';
  return `${prefix}: ${title}`;
}

function getTopicCourses(topic: RoadmapTopic): Array<{ id: string; title: string }> {
  if (Array.isArray(topic.courses) && topic.courses.length > 0) {
    return topic.courses;
  }

  if (Array.isArray(topic.courseIds) && topic.courseIds.length > 0) {
    return topic.courseIds.map((id) => ({ id, title: id }));
  }

  return [];
}

function isTopicUnlocked(topic: RoadmapTopic): boolean {
  if (typeof topic.unlocked === 'boolean') {
    return topic.unlocked;
  }
  return topic.status !== 'LOCKED';
}

function findNearestTopicIndexByScore(topics: RoadmapTopic[], score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return -1;
  }

  let nearestIdx = -1;
  let nearestRequired = Number.NEGATIVE_INFINITY;

  topics.forEach((topic, index) => {
    if (typeof topic.requiredPoint !== 'number') {
      return;
    }
    if (topic.requiredPoint <= score && topic.requiredPoint >= nearestRequired) {
      nearestRequired = topic.requiredPoint;
      nearestIdx = index;
    }
  });

  return nearestIdx;
}

function resolveDefaultOpenTopicIndex(params: {
  latestRoadmapNodeIdx: number;
  nearestTopicByScoreIdx: number;
  currentTopicIdx: number;
}) {
  if (params.currentTopicIdx >= 0) {
    return params.currentTopicIdx;
  }
  if (params.nearestTopicByScoreIdx >= 0) {
    return params.nearestTopicByScoreIdx;
  }
  return params.latestRoadmapNodeIdx;
}

function resolveAutoSelectedTopicId(
  topics: RoadmapTopic[],
  selectedTopicId: string,
  defaultOpenTopicIdx: number
) {
  if (topics.length === 0) {
    return '';
  }

  const selectedTopicStillExists = topics.some((topic) => topic.id === selectedTopicId);
  if (selectedTopicId && selectedTopicStillExists) {
    return selectedTopicId;
  }

  const safeIdx = Math.max(0, Math.min(defaultOpenTopicIdx, topics.length - 1));
  return topics[safeIdx].id;
}

function getLatestReachableTopicIndex(params: {
  topicsLength: number;
  scoreUnlockedTopicIdx: number;
  completionUnlockedTopicIdx: number;
}) {
  const baselineUnlockedTopicIdx = params.topicsLength > 0 ? 0 : -1;
  return Math.max(
    baselineUnlockedTopicIdx,
    params.scoreUnlockedTopicIdx,
    params.completionUnlockedTopicIdx
  );
}

function getRoadProgressFraction(topicsLength: number, latestRoadmapNodeIdx: number) {
  if (topicsLength <= 0 || latestRoadmapNodeIdx < 0) {
    return 0;
  }
  if (topicsLength === 1) {
    return 1;
  }
  return Math.max(0, latestRoadmapNodeIdx) / (topicsLength - 1);
}

function syncCarIndexWithLatest(prevCarIdx: number, latestRoadmapNodeIdx: number) {
  if (latestRoadmapNodeIdx < 0) {
    return -1;
  }
  if (prevCarIdx < 0) {
    return latestRoadmapNodeIdx;
  }
  return Math.min(prevCarIdx, latestRoadmapNodeIdx);
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

  return {
    resolvedEntryStatus,
    hasInProgressAttempt,
  };
}

function openLinkedCourseWithAutoEnroll(params: {
  courseId: string | null | undefined;
  isEnrolled: boolean;
  navigate: (path: string) => void | Promise<void>;
  setCourseActionMessage: (value: { type: 'success' | 'error'; text: string } | null) => void;
  enroll: (
    courseId: string,
    options: {
      onSuccess: () => void;
      onError: (error: unknown) => void;
    }
  ) => void;
}) {
  if (!params.courseId) {
    params.setCourseActionMessage({
      type: 'error',
      text: 'Chủ đề này chưa liên kết khóa học.',
    });
    return;
  }

  params.setCourseActionMessage(null);
  if (params.isEnrolled) {
    params.navigate(`/course/${params.courseId}`);
    return;
  }

  params.enroll(params.courseId, {
    onSuccess: () => {
      params.setCourseActionMessage({
        type: 'success',
        text: 'Đăng ký khóa học thành công. Đang mở khóa học...',
      });
      params.navigate(`/course/${params.courseId}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể đăng ký khóa học';
      if (shouldNavigateToCourseOnEnrollError(message)) {
        params.navigate(`/course/${params.courseId}`);
        return;
      }
      params.setCourseActionMessage({ type: 'error', text: message });
    },
  });
}

/* ─────────────────────────────────────────────────────
   Main component
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

  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [resourceType, setResourceType] = useState<TopicMaterialResourceType>('LESSON');
  const [finishedTopicIds, setFinishedTopicIds] = useState<string[]>([]);
  const [carIdx, setCarIdx] = useState(-1);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [courseActionMessage, setCourseActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const roadPathRef = useRef<SVGPathElement>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const [pathLength, setPathLength] = useState(10000);

  const roadmap = data?.result;
  const entryResult =
    (location.state as { entryTestResult?: RoadmapEntryTestResultResponse } | null)?.entryTestResult ??
    null;
  const entryTest = entryTestQuery.data?.result;
  const entryStatus = entryTest?.studentStatus;
  const activeAttemptQuery = useRoadmapEntryTestActiveAttempt(roadmapId);
  const activeAttempt = activeAttemptQuery.data?.result;
  const myFeedback = myFeedbackQuery.data?.result ?? null;
  const materialsQuery = useStudentTopicMaterials(selectedTopicId, resourceType);
  const materials = Array.isArray(materialsQuery.data?.result) ? materialsQuery.data?.result : [];
  const newlyUnlockedTopics = entryResult?.newlyUnlockedTopics ?? [];
  const unlockedTopicsFromResult = entryResult?.unlockedTopics ?? [];
  const bestScore =
    typeof roadmap?.studentBestScore === 'number'
      ? roadmap.studentBestScore
      : entryResult?.studentBestScore;

  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const rowCount = Math.max(1, Math.ceil(sortedTopics.length / TOPICS_PER_ROW));
  const canvasHeight = Math.max(520, rowCount * ROW_H + 160);
  const pathD = buildSnakePath(rowCount);

  const isFinalFinished =
    sortedTopics.length > 0 && sortedTopics.every((t) => finishedTopicIds.includes(t.id));

  const latestUnlockedTopicIdx = sortedTopics.reduce((latestIdx, topic, index) => {
    if (isTopicUnlocked(topic)) {
      return index;
    }
    return latestIdx;
  }, -1);

  const nearestTopicByScoreIdx = findNearestTopicIndexByScore(sortedTopics, bestScore);
  const scoreUnlockedTopicIdx =
    nearestTopicByScoreIdx >= 0 ? nearestTopicByScoreIdx : latestUnlockedTopicIdx;

  const maxFinishedTopicIdx = sortedTopics.reduce((maxIdx, topic, index) => {
    if (finishedTopicIds.includes(topic.id)) {
      return index;
    }
    return maxIdx;
  }, -1);

  const completionUnlockedTopicIdx =
    maxFinishedTopicIdx >= 0 ? Math.min(sortedTopics.length - 1, maxFinishedTopicIdx + 1) : -1;

  // Car always stands on highest reachable topic (entry score + completion progress),
  // with the first topic as a guaranteed baseline.
  const latestRoadmapNodeIdx = getLatestReachableTopicIndex({
    topicsLength: sortedTopics.length,
    scoreUnlockedTopicIdx,
    completionUnlockedTopicIdx,
  });
  const currentTopicIdx = latestRoadmapNodeIdx;

  const defaultOpenTopicIdx = resolveDefaultOpenTopicIndex({
    latestRoadmapNodeIdx,
    nearestTopicByScoreIdx,
    currentTopicIdx,
  });

  let effectiveCarIdx: number;
  if (carIdx >= 0) {
    effectiveCarIdx = carIdx;
  } else {
    effectiveCarIdx = latestRoadmapNodeIdx;
  }
  const activeVisualTopicIdx = effectiveCarIdx;
  const carNodePos = effectiveCarIdx >= 0 ? nodePos(effectiveCarIdx) : null;

  const completedFraction = getRoadProgressFraction(sortedTopics.length, latestRoadmapNodeIdx);
  const dashOffset = pathLength * (1 - completedFraction);

  // Measure the SVG path once it renders
  useEffect(() => {
    if (roadPathRef.current) {
      const len = roadPathRef.current.getTotalLength();
      if (len > 0) setPathLength(len);
    }
  }, [pathD, isLoading]);

  // Auto-scroll to current node
  useEffect(() => {
    if (!currentNodeRef.current || isLoading) return;
    const timer = setTimeout(
      () => currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      600
    );
    return () => clearTimeout(timer);
  }, [sortedTopics.length, isLoading]);

  useEffect(() => {
    if (!myFeedback) return;
    setFeedbackRating(myFeedback.rating);
    setFeedbackContent(myFeedback.content ?? '');
  }, [myFeedback]);

  useEffect(() => {
    setCarIdx((prev) => syncCarIndexWithLatest(prev, latestRoadmapNodeIdx));
  }, [latestRoadmapNodeIdx]);

  useEffect(() => {
    const nextSelectedTopicId = resolveAutoSelectedTopicId(
      sortedTopics,
      selectedTopicId,
      defaultOpenTopicIdx
    );
    if (nextSelectedTopicId !== selectedTopicId) {
      setSelectedTopicId(nextSelectedTopicId);
    }
  }, [defaultOpenTopicIdx, selectedTopicId, sortedTopics]);

  const finishTopic = (topicId: string, index: number) => {
    setFinishedTopicIds((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    const nextTopic = sortedTopics[index + 1] ?? sortedTopics[index];
    if (nextTopic) {
      setSelectedTopicId(nextTopic.id);
      setCarIdx(index + 1);
    }
  };

  const moveCarToTopic = (index: number, topicId: string) => {
    if (index < 0 || index > latestRoadmapNodeIdx) {
      return;
    }
    setSelectedTopicId(topicId);
    setCarIdx(index);
  };

  const feedbackContentLength = feedbackContent.length;
  const feedbackIsValid = feedbackRating >= 1 && feedbackRating <= 5 && feedbackContentLength <= 2000;
  const feedbackSubmitLabel = getFeedbackSubmitLabel(submitFeedback.isPending, Boolean(myFeedback));

  const submitRoadmapFeedback = () => {
    if (!roadmapId || !feedbackIsValid) return;

    submitFeedback.mutate(
      {
        roadmapId,
        payload: {
          rating: feedbackRating,
          content: feedbackContent.trim(),
        },
      },
      {
        onSuccess: (response) => {
          setFeedbackRating(response.result.rating);
          setFeedbackContent(response.result.content ?? '');
          setFeedbackMessage({
            type: 'success',
            text: myFeedback ? 'Feedback updated successfully.' : 'Feedback submitted successfully.',
          });
        },
        onError: (mutationError) => {
          const message = mutationError instanceof Error ? mutationError.message : 'Failed to submit feedback';
          setFeedbackMessage({ type: 'error', text: getFeedbackErrorText(message) });
        },
      }
    );
  };

  const canOpenEntryAssessment = Boolean(entryTest?.assessmentId);
  const { resolvedEntryStatus, hasInProgressAttempt } = resolveEntryTestState({
    entryStatus,
    entryActiveAttemptId: entryTest?.activeAttemptId,
    activeAttemptId: activeAttempt?.attemptId,
  });
  const canStartEntryAssessment = entryTest?.canStart ?? false;
  const activeCourseIdSet = new Set(
    (myEnrollmentsQuery.data?.result ?? [])
      .filter((enrollment) => enrollment.status === 'ACTIVE')
      .map((enrollment) => enrollment.courseId)
  );

  const openEntryAssessment = () => {
    if (!roadmapId) return;
    navigate(`/roadmaps/${roadmapId}/entry-test/take`);
  };

  const openTopicCourse = (courseId?: string | null) => {
    openLinkedCourseWithAutoEnroll({
      courseId,
      isEnrolled: Boolean(courseId && activeCourseIdSet.has(courseId)),
      navigate,
      setCourseActionMessage,
      enroll: enrollMutation.mutate,
    });
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="rdp">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="rdp__skeletons">
            <div className="rdp__skeleton rdp__skeleton--hd" />
            <div className="rdp__skeleton rdp__skeleton--road" />
          </div>
        )}

        {error && <div className="rdp__error">Không thể tải lộ trình. Vui lòng thử lại.</div>}

        {roadmap && (
          <>
            {/* ── Header ── */}
            <div className="rdp__header">
              <div className="rdp__header-left">
                <span className="rdp__badge">Lộ trình học tập</span>
                <h1 className="rdp__title">{roadmap.name}</h1>
                {roadmap.description && <p className="rdp__desc">{roadmap.description}</p>}
              </div>
              <div className="rdp__header-right">
                <div className="rdp__prog-block">
                  <div className="rdp__prog-row">
                    <span className="rdp__prog-pct">{roadmap.progressPercentage}%</span>
                    <span className="rdp__prog-label">
                      {roadmap.completedTopicsCount}/{roadmap.totalTopicsCount} chủ đề
                    </span>
                  </div>
                  <div className="rdp__prog-bar">
                    <div
                      className="rdp__prog-fill"
                      style={{ width: `${roadmap.progressPercentage}%` }}
                    />
                  </div>
                </div>
                {courseActionMessage && (
                  <p className="rdp__mat-state">
                    {courseActionMessage.type === 'success' ? '✓ ' : '⚠ '}
                    {courseActionMessage.text}
                  </p>
                )}
                {typeof bestScore === 'number' && (
                  <div className="rdp__best-score">
                    Điểm cao nhất entry test: <strong>{bestScore}</strong>
                  </div>
                )}
                {activeVisualTopicIdx >= 0 && !isFinalFinished && (
                  <button
                    type="button"
                    className="rdp__cta"
                    onClick={() =>
                      currentNodeRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      })
                    }
                  >
                    Tiếp tục học →
                  </button>
                )}
                {isFinalFinished && <span className="rdp__done-badge">🎉 Hoàn thành!</span>}
              </div>
            </div>

            {/* ── Entry test ── */}
            <div className="rdp__entry">
              <div className="rdp__entry-left">
                <h3 className="rdp__entry-title">Bài kiểm tra level hiện tại</h3>
                <p className="rdp__entry-desc">Test năng lực tại level đang học trên roadmap, hỗ trợ resume khi thoát giữa chừng.</p>
                {(entryTestQuery.isLoading || activeAttemptQuery.isLoading) && (
                  <p className="rdp__mat-state">Đang tải thông tin bài test...</p>
                )}
                {entryTest && (
                  <p className="rdp__mat-state">
                    {entryTest.title} • {entryTest.totalQuestions} câu •{' '}
                    {entryTest.timeLimitMinutes ? `${entryTest.timeLimitMinutes} phút` : 'Không giới hạn thời gian'}
                  </p>
                )}
                {resolvedEntryStatus && (
                  <p className="rdp__mat-state">
                    Trạng thái hiện tại: {getEntryAssessmentStatusLabel(resolvedEntryStatus)}
                  </p>
                )}
                {activeAttempt?.attemptId && (
                  <p className="rdp__mat-state">Attempt đang làm: {activeAttempt.attemptId}</p>
                )}
                {entryTest && !entryTest.canStart && entryTest.cannotStartReason && (
                  <p className="rdp__mat-state">{entryTest.cannotStartReason}</p>
                )}
              </div>
              <div className="rdp__entry-right">
                <button
                  type="button"
                  className="rdp__entry-btn"
                  disabled={!canOpenEntryAssessment || (!hasInProgressAttempt && !canStartEntryAssessment)}
                  onClick={openEntryAssessment}
                >
                  {getEntryActionLabel(resolvedEntryStatus)}
                </button>
              </div>

              {!canOpenEntryAssessment && !entryTestQuery.isLoading && (
                <p className="rdp__entry-result">⚠ Chưa có assessmentId cho bài test đầu vào. Cần BE trả về assessmentId để khởi tạo luồng làm bài.</p>
              )}

              {newlyUnlockedTopics.length > 0 && (
                <div className="rdp__unlock-result">
                  <p className="rdp__unlock-title">🎉 Bạn vừa mở khóa chủ đề mới</p>
                  <div className="rdp__unlock-list">
                    {newlyUnlockedTopics.map((topic) => (
                      <span key={topic.id} className="rdp__unlock-chip">
                        {topic.name} (mốc {topic.requiredPoint})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {unlockedTopicsFromResult.length > 0 && (
                <p className="rdp__entry-result">
                  Đã mở khóa {unlockedTopicsFromResult.length} chủ đề theo điểm tốt nhất hiện tại.
                </p>
              )}
            </div>

            {/* ── Feedback ── */}
            <div className="rdp__feedback">
              <div className="rdp__feedback-head">
                <h3 className="rdp__feedback-title">Roadmap feedback</h3>
                <p className="rdp__feedback-subtitle">Rate this roadmap and share your thoughts.</p>
              </div>

              {myFeedbackQuery.isLoading && <p className="rdp__mat-state">Loading your feedback...</p>}
              {myFeedbackQuery.error && <p className="rdp__mat-state">Unable to load your feedback.</p>}

              {!myFeedbackQuery.isLoading && !myFeedbackQuery.error && (
                <>
                  <div className="rdp__stars" role="radiogroup" aria-label="Roadmap rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`rdp__star ${feedbackRating >= star ? 'rdp__star--active' : ''}`}
                        onClick={() => setFeedbackRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        disabled={submitFeedback.isPending}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <label className="rdp__feedback-field">
                    <span>Content (optional)</span>
                    <textarea
                      rows={4}
                      value={feedbackContent}
                      onChange={(event) => {
                        setFeedbackContent(event.target.value);
                        setFeedbackMessage(null);
                      }}
                      maxLength={2000}
                      placeholder="Tell us what helps, what is missing, or what should be improved"
                      disabled={submitFeedback.isPending}
                    />
                    <small className={feedbackContentLength > 2000 ? 'rdp__counter rdp__counter--error' : 'rdp__counter'}>
                      {feedbackContentLength}/2000
                    </small>
                  </label>

                  {feedbackMessage && (
                    <p className={`rdp__feedback-message rdp__feedback-message--${feedbackMessage.type}`}>
                      {feedbackMessage.text}
                    </p>
                  )}

                  <div className="rdp__feedback-actions">
                    <button
                      type="button"
                      className="rdp__entry-btn"
                      onClick={submitRoadmapFeedback}
                      disabled={submitFeedback.isPending || !feedbackIsValid}
                    >
                      {feedbackSubmitLabel}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Road canvas ── */}
            {sortedTopics.length > 0 && (
              <div className="rdp__canvas-wrap">
                <div className="rdp__canvas-head">
                  <h2 className="rdp__canvas-title">Bản đồ học tập</h2>
                  <p className="rdp__canvas-sub">Hoàn thành từng chủ đề để tiến về phía trước</p>
                </div>

                <div className="rdp__canvas" style={{ minHeight: `${canvasHeight}px` }}>
                  {/* SVG path */}
                  <svg
                    className="rdp__road-svg"
                    viewBox={`0 0 900 ${canvasHeight}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* Gray background road */}
                    <path d={pathD} className="rdp__road-bg" />

                    {/* Blue progress overlay */}
                    <path
                      ref={roadPathRef}
                      d={pathD}
                      className="rdp__road-prog"
                      style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: dashOffset,
                      }}
                    />

                    {/* Dashed center stripe */}
                    <path d={pathD} className="rdp__road-dash" />
                  </svg>

                  {/* Nodes */}
                  <div className="rdp__nodes">
                    {sortedTopics.map((topic, index) => {
                      const pos = nodePos(index);
                      const isDone = finishedTopicIds.includes(topic.id);
                      const isCurrent = index === activeVisualTopicIdx;
                      const topicCourses = getTopicCourses(topic);
                      const hasCourseLink = topicCourses.length > 0;
                      const isLocked = !isDone && index > latestRoadmapNodeIdx;
                      const canMoveCar = index <= latestRoadmapNodeIdx;

                      return (
                        <div
                          key={topic.id}
                          ref={isCurrent ? currentNodeRef : undefined}
                          className={[
                            'rdp__node',
                            isDone && 'rdp__node--done',
                            isCurrent && 'rdp__node--current',
                            isLocked && 'rdp__node--locked',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{ left: `${pos.leftPct}%`, top: `${pos.topPx}px` }}
                        >
                          {/* Circle */}
                          <button
                            type="button"
                            className={[
                              'rdp__node-circle',
                              canMoveCar && 'rdp__node-circle--clickable',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => moveCarToTopic(index, topic.id)}
                            disabled={!canMoveCar}
                            aria-label={canMoveCar ? `Đi tới mốc ${topic.sequenceOrder}: ${topic.title}` : undefined}
                          >
                            {isDone && '✓'}
                            {!isDone && isLocked && '🔒'}
                            {!isDone && !isLocked && topic.sequenceOrder}
                          </button>
                          {isCurrent && <div className="rdp__node-pulse" />}

                          {/* Card */}
                          <div className="rdp__node-card">
                            <div className="rdp__node-card-top">
                              <strong className="rdp__node-title">{topic.title}</strong>
                              <span
                                className={`rdp__diff rdp__diff--${topic.difficulty.toLowerCase()}`}
                              >
                                {diffLabel(topic.difficulty)}
                              </span>
                            </div>
                            <div className="rdp__node-meta">
                              {typeof topic.mark === 'number' && <span>🎯 {topic.mark.toFixed(1)}</span>}
                              {topicCourses.length > 0 && <span>📘 {topicCourses.length} khóa học</span>}
                              {isCurrent && <span className="rdp__node-cur-tag">Đang học</span>}
                            </div>
                            <div className="rdp__node-actions">
                              <button
                                type="button"
                                className="rdp__node-btn rdp__node-btn--mat"
                                onClick={() => setSelectedTopicId(topic.id)}
                              >
                                Tài liệu
                              </button>
                              {hasCourseLink && (
                                topicCourses.map((course) => (
                                  <button
                                    key={course.id}
                                    type="button"
                                    className="rdp__node-btn rdp__node-btn--mat"
                                    onClick={() => openTopicCourse(course.id)}
                                    disabled={enrollMutation.isPending}
                                    title={course.title}
                                  >
                                    {getTopicCourseButtonLabel(
                                      course.title,
                                      enrollMutation.isPending,
                                      activeCourseIdSet.has(course.id)
                                    )}
                                  </button>
                                ))
                              )}
                              {!isDone && !isLocked && (
                                <button
                                  type="button"
                                  className="rdp__node-btn rdp__node-btn--finish"
                                  onClick={() => finishTopic(topic.id, index)}
                                >
                                  Hoàn thành
                                </button>
                              )}
                              {isDone && <span className="rdp__node-done-tag">✓ Xong</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Car indicator */}
                    {carNodePos && (
                      <motion.div
                        className="rdp__car"
                        animate={{
                          left: `${carNodePos.leftPct}%`,
                          top: `${carNodePos.topPx - 58}px`,
                        }}
                        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                      >
                        <span className="rdp__car-icon">🚗</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sortedTopics.length === 0 && (
              <div className="rdp__empty">
                <span>📚</span>
                <p>Lộ trình này chưa có chủ đề nào.</p>
              </div>
            )}

            {/* ── Materials panel ── */}
            {selectedTopicId && (
              <div className="rdp__materials">
                <div className="rdp__materials-hd">
                  <h3 className="rdp__materials-title">Tài liệu học tập</h3>
                  <div className="rdp__materials-ctrl">
                    <select
                      className="rdp__res-select"
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value as TopicMaterialResourceType)}
                    >
                      <option value="LESSON">Bài học</option>
                      <option value="SLIDE">Slide</option>
                      <option value="ASSESSMENT">Đánh giá</option>
                      <option value="LESSON_PLAN">Giáo án</option>
                      <option value="MINDMAP">Sơ đồ tư duy</option>
                    </select>
                    <button
                      type="button"
                      className="rdp__mat-close"
                      onClick={() => setSelectedTopicId('')}
                      aria-label="Đóng"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {materialsQuery.isLoading && <p className="rdp__mat-state">Đang tải tài liệu…</p>}
                {materialsQuery.error && <p className="rdp__mat-state">Không thể tải tài liệu.</p>}

                {!materialsQuery.isLoading && !materialsQuery.error && (
                  <div className="rdp__mat-list">
                    {materials.map((m) => (
                      <div key={m.id} className="rdp__mat-item">
                        <strong className="rdp__mat-name">{m.resourceTitle}</strong>
                        <span className="rdp__mat-meta">
                          {m.resourceType} · #{m.sequenceOrder}
                        </span>
                      </div>
                    ))}
                    {materials.length === 0 && (
                      <p className="rdp__mat-state">Không có tài liệu cho loại này.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Fireworks */}
        {isFinalFinished && (
          <div className="rdp__fireworks" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`pyro pyro--${i}`}>
                <div className="before" />
                <div className="after" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
