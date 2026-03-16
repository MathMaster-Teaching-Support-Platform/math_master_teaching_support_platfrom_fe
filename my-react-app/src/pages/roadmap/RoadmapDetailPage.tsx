import { useParams } from 'react-router-dom';
import { RoadmapModule } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmapDetail, useUpdateRoadmapProgress } from '../../hooks/useRoadmaps';
import { mockStudent } from '../../data/mockData';
import './roadmap-detail-page.css';

export default function RoadmapDetailPage() {
  const { roadmapId = '' } = useParams();
  const { data, isLoading, error } = useRoadmapDetail(roadmapId);
  const updateProgress = useUpdateRoadmapProgress();

  const roadmap = data?.result;

  const handleMarkComplete = (lessonId: string) => {
    if (!roadmapId) return;
    updateProgress.mutate({
      roadmapId,
      data: {
        lessonId,
        status: 'COMPLETED',
      },
    });
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <section className="roadmap-detail-page">
        {isLoading && <p className="roadmap-detail-page__state">Loading roadmap detail...</p>}
        {error && <p className="roadmap-detail-page__state">Unable to load roadmap detail.</p>}

        {roadmap && (
          <>
            <header className="roadmap-detail-page__header">
              <h1>{roadmap.title}</h1>
              <p>{roadmap.description}</p>
            </header>

            <div className="roadmap-detail-page__modules">
              {roadmap.modules.map((module) => (
                <RoadmapModule
                  key={module.id}
                  module={module}
                  onMarkLessonComplete={handleMarkComplete}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
