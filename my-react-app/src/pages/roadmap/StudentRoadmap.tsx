import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurriculumHierarchyFilter } from '../../components/filters/CurriculumHierarchyFilter';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useCurriculumHierarchyCatalog } from '../../hooks/useCurriculumHierarchyCatalog';
import { useRoadmaps } from '../../hooks/useRoadmaps';
import { StudentDashboardService } from '../../services/api/student-dashboard.service';
import type { RoadmapCatalogItem } from '../../types';
import { roadmapMatchesCurriculum } from '../../utils/curriculumFilter';
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

  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  const { schoolGrades } = useCurriculumHierarchyCatalog({
    gradeId: filterGradeId,
    subjectId: filterSubjectId,
    chapterId: '',
  });

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

  const filteredRoadmaps = useMemo(
    () =>
      roadmaps.filter((r) =>
        roadmapMatchesCurriculum(r, filterGradeId, filterSubjectId, schoolGrades)
      ),
    [roadmaps, filterGradeId, filterSubjectId, schoolGrades]
  );

  const inProgressCount = filteredRoadmaps.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = filteredRoadmaps.filter((r) => r.status === 'COMPLETED').length;
  const avgProgress =
    filteredRoadmaps.length > 0
      ? Math.round(
          filteredRoadmaps.reduce((s, r) => s + r.progressPercentage, 0) / filteredRoadmaps.length
        )
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
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container srp">
        <section className="module-page">
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            <RoadmapHeader
              total={filteredRoadmaps.length}
              inProgress={inProgressCount}
              completed={completedCount}
              avgProgress={avgProgress}
            />

            <CurriculumHierarchyFilter
              depth="subject"
              gradeId={filterGradeId}
              subjectId={filterSubjectId}
              chapterId=""
              lessonId=""
              onGradeChange={(id) => {
                setFilterGradeId(id);
                setFilterSubjectId('');
              }}
              onSubjectChange={setFilterSubjectId}
              onChapterChange={() => {}}
              onLessonChange={() => {}}
              footnote="Lộ trình chỉ có khối và môn trên danh mục — chương/bài không áp dụng."
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
              {!isLoading &&
                !error &&
                roadmaps.length > 0 &&
                filteredRoadmaps.length === 0 && (
                  <p className="srp__error-text font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] py-8 text-center">
                    Không có lộ trình nào khớp với lớp/môn đã chọn.
                  </p>
                )}
              {!isLoading && !error && filteredRoadmaps.length > 0 && (
                <RoadmapGrid roadmaps={filteredRoadmaps} />
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentRoadmap;
