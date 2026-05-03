import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AdminRoadmapEditor } from '../../components/roadmap';
import { mockAdmin } from '../../data/mockData';
import { useCreateRoadmap } from '../../hooks/useRoadmaps';
import '../../styles/module-refactor.css';
import type { CreateAdminRoadmapRequest } from '../../types';
import '../courses/TeacherCourses.css';
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
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container admin-roadmap-mgmt-page">
        <div className="admin-roadmap-mgmt-page__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page admin-roadmap-mgmt-page__content">
          <div className="admin-roadmap-create-top">
            <Link to="/admin/roadmaps" className="btn secondary">
              <ArrowLeft size={15} aria-hidden="true" />
              Quay lại danh sách
            </Link>
          </div>

          <header className="page-header courses-header-row">
            <div className="header-stack">
              <h2>Tạo lộ trình học</h2>
              <p className="header-sub admin-roadmap-mgmt-header-sub">
                Nhập tên, môn, mô tả và số ngày dự kiến. Sau khi tạo, bạn có thể bổ sung chủ đề
                trong màn sửa lộ trình.
              </p>
            </div>
          </header>

          <div className="admin-roadmap-create-form-wrap">
            <AdminRoadmapEditor
              mode="create"
              submitting={createRoadmap.isPending}
              onSubmit={(payload) => {
                createRoadmap.mutate(payload as CreateAdminRoadmapRequest);
              }}
            />
          </div>

          {createRoadmap.error && (
            <div className="admin-roadmap-mgmt-alert" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {createRoadmap.error.message || 'Không thể tạo lộ trình. Vui lòng thử lại.'}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
