import { ChevronLeft, ChevronRight, MessageSquareQuote, Star, Workflow } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { AdminRoadmapEditor } from '../../components/roadmap';
import { mockAdmin } from '../../data/mockData';
import {
  useAdminRoadmapDetail,
  useAdminRoadmapFeedback,
  useUpdateRoadmap,
} from '../../hooks/useRoadmaps';
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
    >
      <section className="admin-roadmap-page">
        <header className="admin-roadmap-page__header">
          <div>
            <h1>Chỉnh sửa lộ trình</h1>
            <p>Cập nhật nội dung và thông tin lộ trình một cách an toàn.</p>
          </div>
        </header>

        {roadmapDetail.isLoading && (
          <p className="admin-roadmap-page__state">Đang tải lộ trình...</p>
        )}
        {roadmapDetail.error && (
          <p className="admin-roadmap-page__state">Không thể tải lộ trình.</p>
        )}

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
                  <h3 className="admin-roadmap-page__section-title">
                    <Workflow className="admin-roadmap-page__section-icon" aria-hidden="true" />
                    Trình xây dựng chủ đề
                  </h3>
                  <p>
                    Quản lý các nút chủ đề của lộ trình trong trình chỉnh sửa toàn trang riêng biệt.
                  </p>
                </div>
                <div className="admin-roadmap-page__actions">
                  <button
                    type="button"
                    className="admin-roadmap-page__button"
                    onClick={() => navigate(`/admin/roadmaps/${roadmapId}/topics`)}
                  >
                    <Workflow className="admin-roadmap-page__button-icon" aria-hidden="true" />
                    Mở trình xây dựng chủ đề
                  </button>
                </div>
              </div>
            </section>

            <section className="admin-roadmap-page__road-section">
              <div className="admin-roadmap-page__road-header">
                <div>
                  <h3 className="admin-roadmap-page__section-title">
                    <MessageSquareQuote
                      className="admin-roadmap-page__section-icon"
                      aria-hidden="true"
                    />
                    Phản hồi học viên
                  </h3>
                  <p>Xem đánh giá và nhận xét lộ trình do học viên gửi.</p>
                </div>
              </div>

              {feedbackQuery.isLoading && (
                <p className="admin-roadmap-page__state">Đang tải phản hồi...</p>
              )}
              {feedbackQuery.error && (
                <p className="admin-roadmap-page__state">Không thể tải danh sách phản hồi.</p>
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
                      <p className="admin-roadmap-page__state">
                        Chưa có phản hồi nào cho lộ trình này.
                      </p>
                    )}
                  </div>

                  <div className="admin-roadmap-page__feedback-pagination">
                    <button
                      type="button"
                      className="admin-roadmap-page__button"
                      onClick={() => setFeedbackPage((prev) => Math.max(0, prev - 1))}
                      disabled={feedbackPage <= 0}
                    >
                      <ChevronLeft className="admin-roadmap-page__button-icon" aria-hidden="true" />
                      Trước
                    </button>
                    <span className="admin-roadmap-page__state">
                      {pageLabel} • {feedbackTotalElements} phản hồi
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
                      Sau
                      <ChevronRight
                        className="admin-roadmap-page__button-icon"
                        aria-hidden="true"
                      />
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
