import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoadmapCard } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmapDetail, useRoadmaps, useStudentRoadmap } from '../../hooks/useRoadmaps';
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

export default function RoadmapCatalogPage() {
  const { data, isLoading, error } = useRoadmaps();
  const studentRoadmapQuery = useStudentRoadmap();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');

  const result = data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(result);
  const activeProgress = studentRoadmapQuery.data?.result.progress;
  const selectedRoadmapDetail = useRoadmapDetail(selectedRoadmapId);

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
      <section className="roadmap-catalog-page">
        <header className="roadmap-catalog-page__header">
          <div>
            <h1>Roadmap Catalog</h1>
            <p>Browse learning tracks and open the roadmap that matches your current goal.</p>
          </div>
          <Link className="roadmap-catalog-page__dashboard-link" to="/dashboard">
            Open dashboard
          </Link>
        </header>

        {isLoading && <p className="roadmap-catalog-page__state">Loading roadmaps...</p>}
        {error && <p className="roadmap-catalog-page__state">Unable to load roadmaps.</p>}

        {!isLoading && !error && (
          <>
            <section className="roadmap-catalog-page__name-topic-panel">
              <article className="roadmap-catalog-page__name-list">
                <h3>All roadmap names</h3>
                <div className="roadmap-catalog-page__name-items">
                  {roadmaps.map((roadmap) => (
                    <button
                      key={roadmap.id}
                      type="button"
                      className={`roadmap-catalog-page__name-item ${
                        selectedRoadmapId === roadmap.id ? 'roadmap-catalog-page__name-item--active' : ''
                      }`}
                      onClick={() => setSelectedRoadmapId(roadmap.id)}
                    >
                      {roadmap.name}
                    </button>
                  ))}
                </div>
              </article>

              <article className="roadmap-catalog-page__topic-list">
                <h3>Topics</h3>
                {selectedRoadmapDetail.isLoading && (
                  <p className="roadmap-catalog-page__state">Loading topics...</p>
                )}
                {selectedRoadmapDetail.error && (
                  <p className="roadmap-catalog-page__state">Unable to load topics.</p>
                )}
                {!selectedRoadmapDetail.isLoading &&
                  !selectedRoadmapDetail.error &&
                  (selectedRoadmapDetail.data?.result.topics ?? []).length === 0 && (
                    <p className="roadmap-catalog-page__state">No topics found in this roadmap.</p>
                  )}

                {!selectedRoadmapDetail.isLoading && !selectedRoadmapDetail.error && (
                  <div className="roadmap-catalog-page__topic-items">
                    {(selectedRoadmapDetail.data?.result.topics ?? [])
                      .slice()
                      .sort((left, right) => left.sequenceOrder - right.sequenceOrder)
                      .map((topic) => (
                        <div key={topic.id} className="roadmap-catalog-page__topic-item">
                          <strong>{topic.sequenceOrder}. {topic.title}</strong>
                          <span>{topic.difficulty}</span>
                        </div>
                      ))}
                  </div>
                )}

                {selectedRoadmapId && (
                  <Link className="roadmap-catalog-page__open-link" to={`/roadmaps/${selectedRoadmapId}`}>
                    Open full roadmap
                  </Link>
                )}
              </article>
            </section>

            <div className="roadmap-catalog-page__grid">
              {roadmaps.map((roadmap) => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  progressPercent={activeProgress?.roadmapId === roadmap.id ? activeProgress.progressPercent : 0}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
