import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmapDetail, useRoadmaps } from '../../hooks/useRoadmaps';
import { mockStudent } from '../../data/mockData';
import type { RoadmapCatalogItem } from '../../types';
import './roadmap-catalog-page.css';

function normalizeRoadmaps(
  result: RoadmapCatalogItem[] | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] } | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function diffLabel(d: string) {
  if (d === 'EASY') return 'Dễ';
  if (d === 'HARD') return 'Khó';
  return 'TB';
}

export default function RoadmapCatalogPage() {
  const { data, isLoading, error } = useRoadmaps();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');

  const result = data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(result);
  const selectedRoadmapDetail = useRoadmapDetail(selectedRoadmapId);

  const selectedRoadmapInfo = roadmaps.find((r) => r.id === selectedRoadmapId);
  const topics = (selectedRoadmapDetail.data?.result.topics ?? [])
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  useEffect(() => {
    if (!selectedRoadmapId && roadmaps.length > 0) {
      setSelectedRoadmapId(roadmaps[0].id);
    }
  }, [roadmaps, selectedRoadmapId]);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <div className="rcp">

        {/* ── Page header ── */}
        <div className="rcp-page-head">
          <span className="rcp-page-head__eyebrow">Lộ trình học tập</span>
          <h1 className="rcp-page-head__title">Chọn lộ trình của bạn</h1>
          <p className="rcp-page-head__sub">
            Học từng bước theo lộ trình được thiết kế sẵn, từ cơ bản đến nâng cao.
          </p>
          {!isLoading && roadmaps.length > 0 && (
            <div className="rcp-page-head__meta">
              <span className="rcp-page-head__stat">
                <strong>{roadmaps.length}</strong> lộ trình
              </span>
              <span className="rcp-page-head__stat">
                <strong>{roadmaps.reduce((s, r) => s + (r.totalTopicsCount ?? 0), 0)}</strong> chủ đề
              </span>
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="rcp-loading">
            {[1, 2, 3].map((i) => <div key={i} className="rcp-skeleton" />)}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rcp-error">⚠ Không thể tải dữ liệu. Vui lòng thử lại.</div>
        )}

        {/* ── Content ── */}
        {!isLoading && !error && (
          <div className="rcp-body">

            {/* Sidebar */}
            <aside className="rcp-sidebar">
              <p className="rcp-sidebar__heading">Tất cả lộ trình</p>
              <div className="rcp-sidebar__list">
                {roadmaps.map((rm) => (
                  <button
                    key={rm.id}
                    type="button"
                    className={`rcp-sidebar__item ${selectedRoadmapId === rm.id ? 'rcp-sidebar__item--active' : ''}`}
                    onClick={() => setSelectedRoadmapId(rm.id)}
                  >
                    <span className="rcp-sidebar__dot" />
                    <div className="rcp-sidebar__item-main">
                      <span className="rcp-sidebar__item-name">{rm.name}</span>
                      <span className="rcp-sidebar__item-meta">{rm.subject} · Lớp {rm.gradeLevel}</span>
                    </div>
                    <span className="rcp-sidebar__item-badge">{rm.totalTopicsCount}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Preview Panel */}
            <div className="rcp-preview">
              {selectedRoadmapInfo && (
                <div className="rcp-preview__header">
                  <h2 className="rcp-preview__title">{selectedRoadmapInfo.name}</h2>
                  {selectedRoadmapInfo.description && (
                    <p className="rcp-preview__desc">{selectedRoadmapInfo.description}</p>
                  )}
                  <div className="rcp-preview__tags">
                    <span className="rcp-preview__tag rcp-preview__tag--blue">{selectedRoadmapInfo.subject}</span>
                    <span className="rcp-preview__tag rcp-preview__tag--purple">Lớp {selectedRoadmapInfo.gradeLevel}</span>
                    <span className="rcp-preview__tag rcp-preview__tag--green">{selectedRoadmapInfo.totalTopicsCount} chủ đề</span>
                  </div>
                </div>
              )}

              {selectedRoadmapDetail.isLoading && (
                <div className="rcp-preview__skeleton">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="rcp-skeleton rcp-skeleton--sm" />)}
                </div>
              )}

              {!selectedRoadmapDetail.isLoading && topics.length > 0 && (
                <div className="rcp-topics">
                  {topics.map((topic, i) => (
                    <div key={topic.id} className="rcp-topic-item">
                      <span className="rcp-topic-item__dot" />
                      <span className="rcp-topic-item__num">{i + 1}</span>
                      <span className="rcp-topic-item__title">{topic.title}</span>
                      <span className={`rcp-topic-item__diff rcp-topic-item__diff--${topic.difficulty.toLowerCase()}`}>
                        {diffLabel(topic.difficulty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!selectedRoadmapDetail.isLoading && !selectedRoadmapDetail.error && topics.length === 0 && (
                <div className="rcp-preview__empty">
                  <span>📭</span>
                  <p>Chưa có chủ đề nào trong lộ trình này.</p>
                </div>
              )}

              {selectedRoadmapId && (
                <div className="rcp-preview__footer">
                  <Link to={`/roadmaps/${selectedRoadmapId}`} className="rcp-preview__cta">
                    Bắt đầu lộ trình →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

