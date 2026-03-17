import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmapDetail, useRoadmaps } from '../../hooks/useRoadmaps';
import { mockStudent } from '../../data/mockData';
import type { RoadmapCatalogItem, RoadmapTopic } from '../../types';
import './StudentRoadmap.css';

function normalizeRoadmaps(
  result: RoadmapCatalogItem[] | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] } | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: 'Hoàn thành',
    IN_PROGRESS: 'Đang học',
    GENERATED: 'Sẵn sàng',
    ARCHIVED: 'Lưu trữ',
  };
  return map[status] ?? status;
}

function difficultyLabel(d: string): string {
  const map: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
  return map[d] ?? d;
}

function findCurrentTopic(topics: RoadmapTopic[]): RoadmapTopic | null {
  return topics.find(t => t.status === 'IN_PROGRESS')
    ?? topics.find(t => t.status === 'NOT_STARTED')
    ?? null;
}

const TopicStep: React.FC<{
  topic: RoadmapTopic;
  isFirst: boolean;
  isLast: boolean;
  isCurrent: boolean;
  roadmapId: string;
  stepRef?: React.Ref<HTMLDivElement>;
}> = ({ topic, isFirst, isLast, isCurrent, roadmapId, stepRef }) => {
  const isCompleted = topic.status === 'COMPLETED';
  const isLocked = topic.status === 'LOCKED';

  let dotContent: React.ReactNode;
  if (isCompleted) dotContent = '✓';
  else if (isLocked) dotContent = '🔒';
  else dotContent = topic.sequenceOrder;

  return (
    <div
      ref={stepRef}
      className={[
        'srp__step',
        isFirst && 'srp__step--first',
        isLast && 'srp__step--last',
        isCompleted && 'srp__step--completed',
        isCurrent && 'srp__step--current',
        isLocked && 'srp__step--locked',
      ].filter(Boolean).join(' ')}
    >
      {/* Vertical connector */}
      {!isLast && (
        <div className={`srp__step-line ${isCompleted ? 'srp__step-line--done' : ''}`} />
      )}

      {/* Dot indicator */}
      <div className="srp__step-indicator">
        <div className="srp__step-dot">{dotContent}</div>
        {isCurrent && <div className="srp__step-pulse" />}
      </div>

      {/* Content */}
      <div className="srp__step-body">
        <div className="srp__step-header">
          <h3 className="srp__step-title">{topic.title}</h3>
          <span className={`srp__diff srp__diff--${topic.difficulty.toLowerCase()}`}>
            {difficultyLabel(topic.difficulty)}
          </span>
        </div>
        {topic.description && (
          <p className="srp__step-desc">{topic.description}</p>
        )}
        <div className="srp__step-meta">
          <span>⏱ {topic.estimatedHours}h</span>
          {topic.progressPercentage > 0 && (
            <span>📊 {topic.progressPercentage}%</span>
          )}
        </div>
        {isCurrent && (
          <Link to={`/roadmaps/${roadmapId}`} className="srp__continue-btn">
            Tiếp tục học →
          </Link>
        )}
      </div>
    </div>
  );
};

const StudentRoadmap: React.FC = () => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const currentTopicRef = useRef<HTMLDivElement>(null);

  const roadmapsQuery = useRoadmaps();
  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(roadmapResult);

  const selectedRoadmapQuery = useRoadmapDetail(selectedRoadmapId);
  const selectedTopics = (selectedRoadmapQuery.data?.result.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const currentRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);
  const currentTopic = findCurrentTopic(selectedTopics);
  const allCompleted =
    selectedTopics.length > 0 && selectedTopics.every(t => t.status === 'COMPLETED');

  const inProgressCount = roadmaps.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = roadmaps.filter(r => r.status === 'COMPLETED').length;
  const avgProgress =
    roadmaps.length > 0
      ? Math.round(roadmaps.reduce((s, r) => s + r.progressPercentage, 0) / roadmaps.length)
      : 0;

  useEffect(() => {
    if (currentTopicRef.current) {
      currentTopicRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTopics.length]);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={5}
    >
      <div className="srp">
        {/* ── Page header ── */}
        <div className="srp__header">
          <div className="srp__header-text">
            <h1 className="srp__title">Lộ trình học tập</h1>
            <p className="srp__subtitle">Khám phá và theo dõi tiến trình học của bạn</p>
          </div>
          <div className="srp__stats">
            <div className="srp__stat">
              <span className="srp__stat-num">{inProgressCount}</span>
              <span className="srp__stat-lbl">Đang học</span>
            </div>
            <div className="srp__stat">
              <span className="srp__stat-num">{completedCount}</span>
              <span className="srp__stat-lbl">Hoàn thành</span>
            </div>
            <div className="srp__stat">
              <span className="srp__stat-num">{avgProgress}%</span>
              <span className="srp__stat-lbl">Tiến độ TB</span>
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="srp__body">
          {/* Sidebar: roadmap list */}
          <aside className="srp__sidebar">
            <div className="srp__sidebar-header">
              <span className="srp__sidebar-title">Lộ trình</span>
              <span className="srp__sidebar-count">{roadmaps.length}</span>
            </div>

            {roadmapsQuery.isLoading && (
              <div className="srp__skeletons">
                {[1, 2, 3].map(i => <div key={i} className="srp__skeleton" />)}
              </div>
            )}
            {roadmapsQuery.error && (
              <p className="srp__empty-text">Không thể tải lộ trình.</p>
            )}

            {!roadmapsQuery.isLoading && !roadmapsQuery.error && roadmaps.length === 0 && (
              <div className="srp__onboarding">
                <span>🗺️</span>
                <p>Chưa có lộ trình nào.</p>
              </div>
            )}

            <div className="srp__list">
              {roadmaps.map(roadmap => (
                <button
                  key={roadmap.id}
                  type="button"
                  className={`srp__rm-card ${
                    selectedRoadmapId === roadmap.id ? 'srp__rm-card--active' : ''
                  }`}
                  onClick={() => setSelectedRoadmapId(roadmap.id)}
                >
                  <div className="srp__rm-card-row">
                    <div className="srp__rm-icon">
                      {roadmap.status === 'COMPLETED' ? '✓' : (roadmap.gradeLevel?.charAt(0) ?? '■')}
                    </div>
                    <div className="srp__rm-info">
                      <div className="srp__rm-name">{roadmap.name}</div>
                      <div className="srp__rm-meta">{roadmap.subject} · Lớp {roadmap.gradeLevel}</div>
                    </div>
                  </div>
                  <div className="srp__rm-progress">
                    <div
                      className="srp__rm-progress-fill"
                      style={{ width: `${roadmap.progressPercentage}%` }}
                    />
                  </div>
                  <div className="srp__rm-footer">
                    <span className={`srp__badge srp__badge--${roadmap.status.toLowerCase()}`}>
                      {statusLabel(roadmap.status)}
                    </span>
                    <span className="srp__rm-pct">{roadmap.progressPercentage}%</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main: topic path */}
          <main className="srp__main">
            {!selectedRoadmapId && (
              <div className="srp__empty">
                <span className="srp__empty-icon">🗺️</span>
                <h3>Chọn lộ trình để xem chi tiết</h3>
                <p>Chọn một lộ trình ở bên trái để xem các chủ đề và tiến độ học tập.</p>
              </div>
            )}

            {selectedRoadmapId && selectedRoadmapQuery.isLoading && (
              <div className="srp__skeletons">
                {[1, 2, 3, 4].map(i => <div key={i} className="srp__skeleton srp__skeleton--tall" />)}
              </div>
            )}

            {selectedRoadmapId && !selectedRoadmapQuery.isLoading && !selectedRoadmapQuery.error && (
              <>
                {/* Overview bar */}
                {currentRoadmap && (
                  <div className="srp__overview">
                    <div className="srp__overview-left">
                      <h2 className="srp__overview-name">{currentRoadmap.name}</h2>
                      {currentRoadmap.description && (
                        <p className="srp__overview-desc">{currentRoadmap.description}</p>
                      )}
                    </div>
                    <div className="srp__overview-right">
                      <span className="srp__overview-pct">{currentRoadmap.progressPercentage}%</span>
                      <div className="srp__overview-bar">
                        <div
                          className="srp__overview-fill"
                          style={{ width: `${currentRoadmap.progressPercentage}%` }}
                        />
                      </div>
                      <span className="srp__overview-counts">
                        {currentRoadmap.completedTopicsCount}/{currentRoadmap.totalTopicsCount} chủ đề
                      </span>
                      <Link to={`/roadmaps/${selectedRoadmapId}`} className="srp__detail-link">
                        Xem bản đồ học tập →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Congrats */}
                {allCompleted && (
                  <div className="srp__congrats">
                    <span>🎉</span>
                    <div>
                      <h3>Chúc mừng! Bạn đã hoàn thành lộ trình này!</h3>
                      <p>Tiếp tục với lộ trình mới để phát triển thêm.</p>
                    </div>
                  </div>
                )}

                {/* Topic steps */}
                {selectedTopics.length > 0 && (
                  <div className="srp__steps">
                    {selectedTopics.map((topic, index) => (
                      <TopicStep
                        key={topic.id}
                        topic={topic}
                        isFirst={index === 0}
                        isLast={index === selectedTopics.length - 1}
                        isCurrent={topic.id === currentTopic?.id}
                        roadmapId={selectedRoadmapId}
                        stepRef={topic.id === currentTopic?.id ? currentTopicRef : undefined}
                      />
                    ))}
                  </div>
                )}

                {selectedTopics.length === 0 && (
                  <div className="srp__empty">
                    <span className="srp__empty-icon">📚</span>
                    <h3>Chưa có chủ đề nào</h3>
                    <p>Lộ trình này chưa có chủ đề nào được thêm.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ── Sticky CTA ── */}
        {selectedRoadmapId && currentTopic && !allCompleted && (
          <div className="srp__sticky">
            <div className="srp__sticky-inner">
              <div className="srp__sticky-text">
                <span className="srp__sticky-label">Tiếp tục lộ trình</span>
                <span className="srp__sticky-topic">{currentTopic.title}</span>
              </div>
              <Link to={`/roadmaps/${selectedRoadmapId}`} className="srp__sticky-btn">
                Tiếp tục học →
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
