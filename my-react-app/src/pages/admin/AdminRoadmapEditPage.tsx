import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminRoadmapEditor } from '../../components/roadmap';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAdminRoadmapDetail, useAdminRoadmapFeedback, useUpdateRoadmap } from '../../hooks/useRoadmaps';
import { mockAdmin } from '../../data/mockData';
import type { UpdateAdminRoadmapRequest } from '../../types';
import './admin-roadmap-page.css';

export default function AdminRoadmapEditPage() {
  const { roadmapId = '' } = useParams();
  const navigate = useNavigate();
  const [feedbackPage, setFeedbackPage] = useState(0);
  const feedbackSize = 20;

  const roadmapDetail = useAdminRoadmapDetail(roadmapId);
  const feedbackQuery = useAdminRoadmapFeedback(roadmapId, feedbackPage, feedbackSize);
  const updateRoadmap = useUpdateRoadmap();

  const feedbackPageResult = feedbackQuery.data?.result;
  const feedbackRows = feedbackPageResult?.content ?? [];
  const totalFeedbackPages = feedbackPageResult?.totalPages ?? 0;
  const feedbackTotalElements = feedbackPageResult?.totalElements ?? 0;

  const pageLabel = useMemo(() => {
    if (!feedbackPageResult) return 'Page 0 / 0';
    return `Page ${feedbackPageResult.number + 1} / ${Math.max(1, feedbackPageResult.totalPages)}`;
  }, [feedbackPageResult]);

  const renderStars = (rating: number) =>
    `${'★'.repeat(Math.max(0, Math.min(5, rating)))}${'☆'.repeat(Math.max(0, 5 - rating))}`;

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

            <section className="admin-roadmap-page__road-section">
              <div className="admin-roadmap-page__road-header">
                <div>
                  <h3>Student feedback</h3>
                  <p>Review roadmap ratings and comments submitted by students.</p>
                </div>
              </div>

              {feedbackQuery.isLoading && (
                <p className="admin-roadmap-page__state">Loading feedback...</p>
              )}
              {feedbackQuery.error && (
                <p className="admin-roadmap-page__state">Unable to load feedback list.</p>
              )}

              {!feedbackQuery.isLoading && !feedbackQuery.error && (
                <>
                  <div className="admin-roadmap-page__feedback-list">
                    {feedbackRows.map((feedback) => (
                      <article key={feedback.id} className="admin-roadmap-page__feedback-item">
                        <div className="admin-roadmap-page__feedback-main">
                          <strong>{feedback.studentName}</strong>
                          <span className="admin-roadmap-page__feedback-stars">
                            {renderStars(feedback.rating)} ({feedback.rating}/5)
                          </span>
                        </div>
                        <p className="admin-roadmap-page__feedback-content">
                          {feedback.content?.trim() || 'No comment'}
                        </p>
                        <small className="admin-roadmap-page__feedback-updated">
                          Updated: {new Date(feedback.updatedAt).toLocaleString()}
                        </small>
                      </article>
                    ))}

                    {feedbackRows.length === 0 && (
                      <p className="admin-roadmap-page__state">No feedback available for this roadmap.</p>
                    )}
                  </div>

                  <div className="admin-roadmap-page__feedback-pagination">
                    <button
                      type="button"
                      className="admin-roadmap-page__button"
                      onClick={() => setFeedbackPage((prev) => Math.max(0, prev - 1))}
                      disabled={feedbackPage <= 0}
                    >
                      Previous
                    </button>
                    <span className="admin-roadmap-page__state">
                      {pageLabel} • {feedbackTotalElements} feedback
                    </span>
                    <button
                      type="button"
                      className="admin-roadmap-page__button"
                      onClick={() =>
                        setFeedbackPage((prev) =>
                          Math.min(Math.max(0, totalFeedbackPages - 1), prev + 1)
                        )
                      }
                      disabled={feedbackPage >= Math.max(0, totalFeedbackPages - 1)}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
