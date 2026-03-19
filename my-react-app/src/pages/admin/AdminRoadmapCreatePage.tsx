import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminRoadmapEditor } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useCreateRoadmap } from '../../hooks/useRoadmaps';
import { mockAdmin } from '../../data/mockData';
import type { CreateAdminRoadmapRequest } from '../../types';
import './admin-roadmap-page.css';

export default function AdminRoadmapCreatePage() {
  const createRoadmap = useCreateRoadmap();
  const navigate = useNavigate();

  useEffect(() => {
    if (createRoadmap.isSuccess) {
      void navigate('/admin/roadmaps');
    }
  }, [createRoadmap.isSuccess, navigate]);

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Create roadmap</h1>
            <p>Define a roadmap and publish when it is ready for learners.</p>
          </div>
        </header>

        <AdminRoadmapEditor
          mode="create"
          submitting={createRoadmap.isPending}
          onSubmit={(payload) => {
            createRoadmap.mutate(payload as CreateAdminRoadmapRequest);
          }}
        />

        {createRoadmap.error && (
          <p className="admin-roadmap-page__state">
            {createRoadmap.error.message || 'Failed to create roadmap.'}
          </p>
        )}
      </section>
    </DashboardLayout>
  );
}
