import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Circle,
  MessageSquareQuote,
  Star,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AdminRoadmapEditor } from '../../components/roadmap';
import { mockAdmin } from '../../data/mockData';
import {
  useAdminRoadmapDetail,
  useAdminRoadmapFeedback,
  useUpdateRoadmap,
} from '../../hooks/useRoadmaps';
import '../../styles/module-refactor.css';
import type { UpdateAdminRoadmapRequest } from '../../types';
import '../courses/TeacherCourses.css';
import './admin-roadmap-page.css';

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Sẵn sàng',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
};

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

  const roadmap = roadmapDetail.data?.result;

  const pageLabel = useMemo(() => {
    if (!feedbackPageResult) return 'Trang 0 / 0';
    return `Trang ${feedbackPageResult.number + 1} / ${Math.max(1, feedbackPageResult.totalPages)}`;
  }, [feedbackPageResult]);

  const renderStars = (rating: number) => {
    const clampedRating = Math.max(0, Math.min(5, rating));
    return (
      <span
        className="admin-roadmap-page__rating-stars"
        aria-label={`Đánh giá ${clampedRating} trên 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={`${rating}-${index}`}
            className={`admin-roadmap-page__rating-star ${index < clampedRating ? 'admin-roadmap-page__rating-star--active' : ''}`}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  };

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
              <div className="header-kicker">Admin</div>
              <div
                className="row"
                style={{ gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}
              >
                <h2>{roadmap?.name ?? 'Chỉnh sửa lộ trình'}</h2>
                {roadmap && (
                  <span
                    className={`admin-roadmap-page__status admin-roadmap-page__status--${roadmap.status.toLowerCase()}`}
                    style={{ fontSize: 12 }}
                  >
                    <Circle className="admin-roadmap-page__status-dot" aria-hidden="true" />
                    {STATUS_LABELS[roadmap.status] ?? roadmap.status}
                  </span>
                )}
              </div>
              <p className="header-sub admin-roadmap-mgmt-header-sub">
                Cập nhật thông tin lộ trình, chủ đề và xem phản hồi học viên.
              </p>
            </div>
          </header>

          {roadmapDetail.isLoading && (
            <div className="skeleton-grid" aria-busy="true" aria-label="Đang tải">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {roadmapDetail.error && (
            <div className="empty admin-roadmap-mgmt-empty" role="alert">
              <AlertCircle
                size={32}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger, #c63f4d)' }}
                aria-hidden
              />
              <p>Không thể tải lộ trình. Vui lòng thử lại hoặc quay lại danh sách.</p>
              <Link to="/admin/roadmaps" className="btn secondary">
                <ArrowLeft size={15} />
                Về danh sách
              </Link>
            </div>
          )}

          {roadmap && (
            <>
              <div className="admin-roadmap-create-form-wrap">
                <AdminRoadmapEditor
                  initialRoadmap={roadmap}
                  submitting={updateRoadmap.isPending}
                  mode="edit"
                  onSubmit={(payload) => {
                    if (!roadmapId) return;
                    updateRoadmap.mutate({
                      roadmapId,
                      payload: payload as UpdateAdminRoadmapRequest,
                    });
                  }}
                />
              </div>

              {updateRoadmap.error && (
                <div className="admin-roadmap-mgmt-alert" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {updateRoadmap.error.message || 'Không thể cập nhật lộ trình. Vui lòng thử lại.'}
                </div>
              )}

              <article className="admin-roadmap-create-form-wrap admin-roadmap-edit-section-inner">
                <div className="admin-roadmap-page__road-header">
                  <div>
                    <h3 className="admin-roadmap-page__section-title">
                      <Workflow className="admin-roadmap-page__section-icon" aria-hidden="true" />
                      Trình xây dựng chủ đề
                    </h3>
                    <p>
                      Quản lý các chủ đề và bài học của lộ trình trong màn hình chỉnh sửa chuyên
                      dụng.
                    </p>
                  </div>
                  <div className="admin-roadmap-page__actions">
                    <button
                      type="button"
                      className="btn btn--feat-indigo"
                      onClick={() => navigate(`/admin/roadmaps/${roadmapId}/topics`)}
                    >
                      <Workflow size={16} aria-hidden="true" />
                      Mở trình xây dựng chủ đề
                    </button>
                  </div>
                </div>
              </article>

              <article className="admin-roadmap-create-form-wrap admin-roadmap-edit-section-inner">
                <div className="admin-roadmap-page__road-header">
                  <div>
                    <h3 className="admin-roadmap-page__section-title">
                      <MessageSquareQuote
                        className="admin-roadmap-page__section-icon"
                        aria-hidden="true"
                      />
                      Phản hồi học viên
                    </h3>
                    <p>Đánh giá và nhận xét lộ trình do học viên gửi.</p>
                  </div>
                </div>

                {feedbackQuery.isLoading && (
                  <div className="skeleton-grid admin-roadmap-edit-feedback-skeleton" aria-busy>
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                  </div>
                )}
                {feedbackQuery.error && (
                  <div className="empty admin-roadmap-mgmt-empty" role="alert">
                    <AlertCircle
                      size={28}
                      style={{ opacity: 0.45, color: 'var(--mod-danger, #c63f4d)' }}
                      aria-hidden
                    />
                    <p>Không thể tải danh sách phản hồi.</p>
                  </div>
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
                            {feedback.content?.trim() || 'Chưa có nhận xét'}
                          </p>
                          <small className="admin-roadmap-page__feedback-updated">
                            Cập nhật: {new Date(feedback.updatedAt).toLocaleString('vi-VN')}
                          </small>
                        </article>
                      ))}

                      {feedbackRows.length === 0 && (
                        <div className="empty admin-roadmap-mgmt-empty" style={{ padding: '1.25rem' }}>
                          <MessageSquareQuote size={32} style={{ opacity: 0.35 }} aria-hidden />
                          <p>Chưa có phản hồi nào cho lộ trình này.</p>
                        </div>
                      )}
                    </div>

                    <div className="admin-roadmap-page__feedback-pagination">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setFeedbackPage((prev) => Math.max(0, prev - 1))}
                        disabled={feedbackPage <= 0}
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                        Trước
                      </button>
                      <span className="admin-roadmap-page__pagination-info">
                        {pageLabel} • {feedbackTotalElements} phản hồi
                      </span>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          setFeedbackPage((prev) =>
                            Math.min(Math.max(0, totalFeedbackPages - 1), prev + 1)
                          )
                        }
                        disabled={feedbackPage >= Math.max(0, totalFeedbackPages - 1)}
                      >
                        Sau
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </article>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
