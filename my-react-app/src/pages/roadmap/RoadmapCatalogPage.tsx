import { Link } from 'react-router-dom';
import { RoadmapCard } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmaps, useStudentRoadmap } from '../../hooks/useRoadmaps';
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

  const result = data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmaps = normalizeRoadmaps(result);
  const activeProgress = studentRoadmapQuery.data?.result.progress;

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
          <div className="roadmap-catalog-page__grid">
            {roadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                progressPercent={activeProgress?.roadmapId === roadmap.id ? activeProgress.progressPercent : 0}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
