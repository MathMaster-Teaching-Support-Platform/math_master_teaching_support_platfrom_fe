import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmapDetail, useRoadmaps } from '../../hooks/useRoadmaps';
import { mockStudent } from '../../data/mockData';
import type { RoadmapCatalogItem } from '../../types';
import './StudentRoadmap.css';

function normalizeRoadmaps(
  result: RoadmapCatalogItem[] | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] } | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

const StudentRoadmap: React.FC = () => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const roadmapsQuery = useRoadmaps();

  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(roadmapResult);

  const selectedRoadmapQuery = useRoadmapDetail(selectedRoadmapId);
  const selectedTopics = (selectedRoadmapQuery.data?.result.topics ?? [])
    .slice()
    .sort((left, right) => left.sequenceOrder - right.sequenceOrder);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={5}
    >
      <div className="roadmap-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Roadmap list</h1>
            <p className="page-subtitle">Choose a roadmap name to view its topics.</p>
          </div>
        </div>

        <div className="student-roadmap-picker">
          <section className="student-roadmap-picker__names">
            <h3>All roadmaps</h3>
            {roadmapsQuery.isLoading && <p className="page-subtitle">Loading roadmaps...</p>}
            {roadmapsQuery.error && <p className="page-subtitle">Unable to load roadmaps.</p>}

            {!roadmapsQuery.isLoading && !roadmapsQuery.error && (
              <div className="student-roadmap-picker__name-list">
                {roadmaps.map((roadmap) => (
                  <button
                    key={roadmap.id}
                    type="button"
                    className={`student-roadmap-picker__name-item ${
                      selectedRoadmapId === roadmap.id ? 'student-roadmap-picker__name-item--active' : ''
                    }`}
                    onClick={() => setSelectedRoadmapId(roadmap.id)}
                  >
                    {roadmap.name}
                  </button>
                ))}

                {roadmaps.length === 0 && <p className="page-subtitle">No roadmap available.</p>}
              </div>
            )}
          </section>

          <section className="student-roadmap-picker__topics">
            <h3>Topics</h3>
            {!selectedRoadmapId && (
              <p className="page-subtitle">Click a roadmap name to view detail and topics.</p>
            )}
            {selectedRoadmapId && selectedRoadmapQuery.isLoading && <p className="page-subtitle">Loading topics...</p>}
            {selectedRoadmapId && selectedRoadmapQuery.error && <p className="page-subtitle">Unable to load topics.</p>}

            {selectedRoadmapId && !selectedRoadmapQuery.isLoading && !selectedRoadmapQuery.error && (
              <div className="student-roadmap-picker__topic-list">
                {selectedTopics.map((topic) => (
                  <article key={topic.id} className="student-roadmap-picker__topic-item">
                    <strong>{topic.sequenceOrder}. {topic.title}</strong>
                    <span>{topic.difficulty}</span>
                  </article>
                ))}

                {selectedTopics.length === 0 && (
                  <p className="page-subtitle">No topic in selected roadmap.</p>
                )}
              </div>
            )}

            {selectedRoadmapId && (
              <Link className="student-roadmap-picker__open" to={`/roadmaps/${selectedRoadmapId}`}>
                Open roadmap detail
              </Link>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
