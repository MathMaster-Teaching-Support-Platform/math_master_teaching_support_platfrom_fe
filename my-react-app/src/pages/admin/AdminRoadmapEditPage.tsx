import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminRoadmapEditor } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAdminRoadmapDetail, useUpdateRoadmap } from '../../hooks/useRoadmaps';
import { mockAdmin } from '../../data/mockData';
import type { UpdateAdminRoadmapRequest } from '../../types';
import './admin-roadmap-page.css';

export default function AdminRoadmapEditPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();

  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const updateRoadmap = useUpdateRoadmap();

  useEffect(() => {
    if (updateRoadmap.isSuccess) {
      void navigate('/admin/roadmaps');
    }
  }, [navigate, updateRoadmap.isSuccess]);

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Edit roadmap</h1>
            <p>Update roadmap content and metadata safely.</p>
          </div>
        </header>

        {roadmapDetail.isLoading && <p className="admin-roadmap-page__state">Loading roadmap...</p>}
        {roadmapDetail.error && <p className="admin-roadmap-page__state">Unable to load roadmap.</p>}

        {roadmapDetail.data?.result && (
          <>
            <AdminRoadmapEditor
              initialRoadmap={roadmapDetail.data.result}
              submitting={updateRoadmap.isPending}
              mode="edit"
              onSubmit={(payload) => {
                if (!roadmapId) return;
                updateRoadmap.mutate({ roadmapId, payload: payload as UpdateAdminRoadmapRequest });
              }}
            />

            <section className="admin-roadmap-page__road-section">
              <div className="admin-roadmap-page__road-header">
                <div>
                  <h3>Topic builder</h3>
                  <p>Manage roadmap topic nodes in a separate full-page builder.</p>
                </div>
                <div className="admin-roadmap-page__actions">
                  <button
                    type="button"
                    className="admin-roadmap-page__button"
                    onClick={() => navigate(`/admin/roadmaps/${roadmapId}/topics`)}
                  >
                    Open full topic builder
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
