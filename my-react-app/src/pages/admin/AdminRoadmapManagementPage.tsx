import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAdminRoadmaps } from '../../hooks/useRoadmaps';
import { mockAdmin } from '../../data/mockData';
import './admin-roadmap-page.css';

export default function AdminRoadmapManagementPage() {
  const { data, isLoading, error } = useAdminRoadmaps();
  const roadmaps = data?.result ?? [];

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Admin Roadmaps</h1>
            <p>Manage roadmap metadata and jump into the editor for updates.</p>
          </div>
          <Link to="/admin/roadmaps/create" className="admin-roadmap-page__action">
            Create roadmap
          </Link>
        </header>

        {isLoading && <p className="admin-roadmap-page__state">Loading roadmaps...</p>}
        {error && <p className="admin-roadmap-page__state">Unable to load roadmaps.</p>}

        {!isLoading && !error && (
          <div className="admin-roadmap-page__table">
            <div className="admin-roadmap-page__row admin-roadmap-page__row--head">
              <span>Title</span>
              <span>Status</span>
              <span>Lessons</span>
              <span>Actions</span>
            </div>
            {roadmaps.map((roadmap) => (
              <div key={roadmap.id} className="admin-roadmap-page__row">
                <span>{roadmap.title}</span>
                <span>{roadmap.status}</span>
                <span>{roadmap.lessonCount}</span>
                <span>
                  <Link to={`/admin/roadmaps/edit/${roadmap.id}`}>Edit</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
