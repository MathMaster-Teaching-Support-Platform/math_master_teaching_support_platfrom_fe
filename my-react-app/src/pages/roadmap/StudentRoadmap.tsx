import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import { useRoadmapDetail, useRoadmaps } from '../../hooks/useRoadmaps';
import '../../styles/module-refactor.css';
import type { RoadmapCatalogItem } from '../../types';
import './StudentRoadmap.css';

function normalizeRoadmaps(
  result:
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined
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

// Removed TopicStep to enforce node-based roadmap UI only

const StudentRoadmap: React.FC = () => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');

  const roadmapsQuery = useRoadmaps();
  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(roadmapResult);

  const selectedRoadmapQuery = useRoadmapDetail(selectedRoadmapId);

  const currentRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId);

  const inProgressCount = roadmaps.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = roadmaps.filter((r) => r.status === 'COMPLETED').length;
  const avgProgress =
    roadmaps.length > 0
      ? Math.round(roadmaps.reduce((s, r) => s + r.progressPercentage, 0) / roadmaps.length)
      : 0;

  // No automatic scrolling since we removed the vertical list

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={5}
    >
      <div className="module-layout-container srp">
        <section className="module-page">
          {/* ── Page header ── */}
          <header className="page-header srp__header">
            <div className="header-stack srp__header-text">
              <div className="header-kicker">Học tập &amp; Phát triển</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2 className="srp__title">Lộ trình học tập</h2>
                {roadmaps.length > 0 && <span className="count-chip">{roadmaps.length}</span>}
              </div>
              <p className="srp__subtitle">Khám phá và theo dõi tiến trình học của bạn</p>
            </div>
            <div className="assessment-summary-bar srp__stats-bar">
              <div className="summary-item summary-item--primary">
                <span className="summary-label">Đang học</span>
                <strong className="summary-value">{inProgressCount}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Hoàn thành</span>
                <strong className="summary-value">{completedCount}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Tiến độ TB</span>
                <strong className="summary-value">{avgProgress}%</strong>
              </div>
            </div>
          </header>

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
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="srp__skeleton" />
                  ))}
                </div>
              )}
              {roadmapsQuery.error && <p className="srp__empty-text">Không thể tải lộ trình.</p>}

              {!roadmapsQuery.isLoading && !roadmapsQuery.error && roadmaps.length === 0 && (
                <div className="srp__onboarding">
                  <span>🗺️</span>
                  <p>Chưa có lộ trình nào.</p>
                </div>
              )}

              <div className="srp__list">
                {roadmaps.map((roadmap) => (
                  <button
                    key={roadmap.id}
                    type="button"
                    className={`srp__rm-card ${
                      selectedRoadmapId === roadmap.id ? 'srp__rm-card--active' : ''
                    }`}
                    onClick={() => setSelectedRoadmapId(roadmap.id)}
                  >
                    <div className="srp__rm-card-row">
                      <div
                        className={`srp__rm-cover srp__rm-cover--${roadmap.status.toLowerCase()}`}
                      >
                        {roadmap.status === 'COMPLETED'
                          ? '✓'
                          : (roadmap.gradeLevel?.charAt(0) ?? '■')}
                      </div>
                      <div className="srp__rm-info">
                        <div className="srp__rm-name">{roadmap.name}</div>
                        <div className="srp__rm-meta">
                          {roadmap.subject} · Lớp {roadmap.gradeLevel}
                        </div>
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
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="srp__skeleton srp__skeleton--tall" />
                  ))}
                </div>
              )}

              {selectedRoadmapId &&
                !selectedRoadmapQuery.isLoading &&
                !selectedRoadmapQuery.error && (
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
                          <span className="srp__overview-pct">
                            {currentRoadmap.progressPercentage}%
                          </span>
                          <div className="srp__overview-bar">
                            <div
                              className="srp__overview-fill"
                              style={{ width: `${currentRoadmap.progressPercentage}%` }}
                            />
                          </div>
                          <span className="srp__overview-counts">
                            {currentRoadmap.completedTopicsCount}/{currentRoadmap.totalTopicsCount}{' '}
                            chủ đề
                          </span>
                          <Link to={`/roadmaps/${selectedRoadmapId}`} className="srp__detail-link">
                            Xem bản đồ học tập →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Removed old list-based UI */}
                    <div
                      className="srp__cta-container"
                      style={{ textAlign: 'center', marginTop: '3rem' }}
                    >
                      <img
                        src="/assets/illustrations/map.svg"
                        alt=""
                        style={{ width: '120px', opacity: 0.5, marginBottom: '1rem' }}
                      />
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                        Sẵn sàng học tiếp?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Bản đồ học tập mới với giao diện trực quan đã sẵn sàng.
                      </p>
                      <Link
                        to={`/roadmaps/${selectedRoadmapId}`}
                        className="srp__sticky-btn"
                        style={{ display: 'inline-block' }}
                      >
                        Mở bản đồ học tập →
                      </Link>
                    </div>
                  </>
                )}
            </main>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
