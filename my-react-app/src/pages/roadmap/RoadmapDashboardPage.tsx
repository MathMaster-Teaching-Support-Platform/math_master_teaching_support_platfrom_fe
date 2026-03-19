import { Link } from 'react-router-dom';
import { RoadmapDashboard } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useStudentRoadmap } from '../../hooks/useRoadmaps';
import { mockStudent } from '../../data/mockData';
import './roadmap-dashboard-page.css';

export default function RoadmapDashboardPage() {
  const { data, isLoading, error } = useStudentRoadmap();
  const snapshot = data?.result;

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar, role: 'student' }}
      notificationCount={3}
    >
      <section className="roadmap-dashboard-page">
        <header className="roadmap-dashboard-page__header">
          <h1>Roadmap Dashboard</h1>
          <p>Track your active learning roadmap and jump back into the next lesson quickly.</p>
        </header>

        {isLoading && <p className="roadmap-dashboard-page__state">Loading dashboard...</p>}
        {error && <p className="roadmap-dashboard-page__state">Unable to load dashboard.</p>}

        {snapshot && (
          <>
            <RoadmapDashboard progress={snapshot.progress} roadmapTitle={snapshot.roadmap.name} />
            <div className="roadmap-dashboard-page__actions">
              <Link to="/roadmaps" className="roadmap-dashboard-page__link">
                View all roadmaps
              </Link>
              <Link to={`/roadmaps/${snapshot.roadmap.id}`} className="roadmap-dashboard-page__link">
                Continue roadmap
              </Link>
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
