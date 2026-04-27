import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmaps } from '../../hooks/useRoadmaps';
import { StudentDashboardService } from '../../services/api/student-dashboard.service';
import '../../styles/module-refactor.css';
import type { RoadmapCatalogItem } from '../../types';
import './StudentRoadmap.css';
import EmptyRoadmap from './components/EmptyRoadmap';
import RoadmapGrid from './components/RoadmapGrid';
import RoadmapHeader from './components/RoadmapHeader';

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

const StudentRoadmap: React.FC = () => {
  const dashboardQuery = useQuery({
    queryKey: ['student-dashboard', 'overview'],
    queryFn: () => StudentDashboardService.getDashboard(),
    staleTime: 30_000,
  });
  const dashboardSummary = dashboardQuery.data?.result?.summary;

  const {
    data: roadmaps = [],
    isLoading,
    error,
  } = useRoadmaps<RoadmapCatalogItem[]>('', 0, 20, {
    select: (response) =>
      normalizeRoadmaps(
        response.result as
          | RoadmapCatalogItem[]
          | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
          | undefined
      ),
  });

  const inProgressCount = roadmaps.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = roadmaps.filter((r) => r.status === 'COMPLETED').length;
  const avgProgress =
    roadmaps.length > 0
      ? Math.round(roadmaps.reduce((s, r) => s + r.progressPercentage, 0) / roadmaps.length)
      : 0;

  return (
    <DashboardLayout
      role="student"
      user={{
        name: dashboardSummary?.student.name ?? 'Người dùng',
        avatar: dashboardSummary?.student.avatar ?? '',
        role: 'student',
      }}
      notificationCount={dashboardSummary?.notificationCount ?? 0}
    >
      <div className="module-layout-container srp">
        <section className="module-page">
          <RoadmapHeader
            total={roadmaps.length}
            inProgress={inProgressCount}
            completed={completedCount}
            avgProgress={avgProgress}
          />

          <div className="srp__body-full-width">
            {isLoading && (
              <div className="srp__skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="srp__skeleton srp__skeleton--grid" />
                ))}
              </div>
            )}
            {error && <p className="srp__error-text">Đã xảy ra lỗi khi tải lộ trình.</p>}
            {!isLoading && !error && roadmaps.length === 0 && <EmptyRoadmap />}
            {!isLoading && !error && roadmaps.length > 0 && <RoadmapGrid roadmaps={roadmaps} />}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
