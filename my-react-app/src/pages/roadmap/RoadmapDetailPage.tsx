import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import {
  useRoadmapDetail,
  useStudentTopicMaterials,
  useSubmitRoadmapEntryTest,
} from '../../hooks/useRoadmaps';
import type { TopicMaterialResourceType } from '../../types';
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

/* ─────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────── */
export default function RoadmapDetailPage() {
  const { roadmapId = '' } = useParams();
  const { data, isLoading, error } = useRoadmapDetail(roadmapId);
  const submitEntryTest = useSubmitRoadmapEntryTest();

  const [submissionId, setSubmissionId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [resourceType, setResourceType] = useState<TopicMaterialResourceType>('LESSON');
  const [finishedTopicIds, setFinishedTopicIds] = useState<string[]>([]);
  const [carIdx, setCarIdx] = useState(-1);

  const roadPathRef = useRef<SVGPathElement>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const [pathLength, setPathLength] = useState(10000);

  const roadmap = data?.result;
  const materialsQuery = useStudentTopicMaterials(selectedTopicId, resourceType);
  const materials = Array.isArray(materialsQuery.data?.result) ? materialsQuery.data?.result : [];

  const sortedTopics = (roadmap?.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const rowCount = Math.max(1, Math.ceil(sortedTopics.length / TOPICS_PER_ROW));
  const canvasHeight = Math.max(520, rowCount * ROW_H + 160);
  const pathD = buildSnakePath(rowCount);

  const isFinalFinished =
    sortedTopics.length > 0 && sortedTopics.every((t) => finishedTopicIds.includes(t.id));

  // Index of the first topic not yet finished (the "current" one the student should tackle)
  const currentTopicIdx = sortedTopics.findIndex((t) => !finishedTopicIds.includes(t.id));

  // Car sits at the last finished topic (or before the first if nothing done yet)
  let effectiveCarIdx: number;
  if (carIdx >= 0) {
    effectiveCarIdx = carIdx;
  } else {
    effectiveCarIdx = currentTopicIdx > 0 ? currentTopicIdx - 1 : -1;
  }
  const carNodePos = effectiveCarIdx >= 0 ? nodePos(effectiveCarIdx) : null;

  const completedFraction =
    sortedTopics.length > 0 ? finishedTopicIds.length / sortedTopics.length : 0;
  const dashOffset = pathLength * (1 - completedFraction);

  // Measure the SVG path once it renders
  useEffect(() => {
    if (roadPathRef.current) {
      const len = roadPathRef.current.getTotalLength();
      if (len > 0) setPathLength(len);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const finishTopic = (topicId: string, index: number) => {
    setFinishedTopicIds((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    setCarIdx(index);
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
                {currentTopicIdx >= 0 && !isFinalFinished && (
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
                <h3 className="rdp__entry-title">Bài kiểm tra đầu vào</h3>
                <p className="rdp__entry-desc">
                  Nộp kết quả bài kiểm tra để nhận gợi ý chủ đề bắt đầu phù hợp
                </p>
              </div>
              <div className="rdp__entry-right">
                <input
                  className="rdp__entry-input"
                  placeholder="Submission ID"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                />
                <button
                  type="button"
                  className="rdp__entry-btn"
                  disabled={!submissionId || !roadmapId || submitEntryTest.isPending}
                  onClick={() => {
                    if (!roadmapId || !submissionId) return;
                    submitEntryTest.mutate({ roadmapId, payload: { submissionId } });
                  }}
                >
                  {submitEntryTest.isPending ? 'Đang nộp…' : 'Nộp bài'}
                </button>
              </div>
              {submitEntryTest.data?.result && (
                <p className="rdp__entry-result">
                  ✓ Gợi ý chủ đề #{submitEntryTest.data.result.suggestedTopicId} •{' '}
                  {submitEntryTest.data.result.evaluatedQuestions} câu hỏi được đánh giá
                </p>
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
                      const isCurrent = index === currentTopicIdx;
                      // A topic is only visually locked when it's neither done nor the current one
                      const isLocked = topic.status === 'LOCKED' && !isDone && !isCurrent;

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
                          <div className="rdp__node-circle">
                            {isDone && '✓'}
                            {!isDone && isLocked && '🔒'}
                            {!isDone && !isLocked && topic.sequenceOrder}
                          </div>
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
                              <span>⏱ {topic.estimatedHours}h</span>
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
                      <option value="QUESTION">Câu hỏi</option>
                      <option value="MINDMAP">Sơ đồ tư duy</option>
                      <option value="DOCUMENT">Tài liệu</option>
                      <option value="ASSESSMENT">Đánh giá</option>
                      <option value="EXAMPLE">Ví dụ</option>
                      <option value="PRACTICE">Luyện tập</option>
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
