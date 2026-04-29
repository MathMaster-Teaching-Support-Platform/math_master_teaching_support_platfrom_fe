import { Edit2, Filter, MessageSquare, Send, Star } from 'lucide-react';
import React, { useState } from 'react';
import { useCourseReviews, useReplyToReview, useReviewSummary } from '../../../hooks/useCourses';
import { useToast } from '../../../context/ToastContext';
import { UI_TEXT } from '../../../constants/uiText';
import './course-detail-tabs.css';

interface CourseReviewsTabProps {
  courseId: string;
}

const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({ courseId }) => {
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<Record<string, boolean>>({});

  const { data: summaryData } = useReviewSummary(courseId);
  const { data: reviewsData, isLoading } = useCourseReviews(courseId, 0, 50, filterRating);
  const replyMutation = useReplyToReview();
  const { showToast } = useToast();

  const pendingReplyId = replyMutation.isPending ? replyMutation.variables?.reviewId : null;

  const reviews = reviewsData?.result?.content ?? [];
  const summary = summaryData?.result;

  const handleReplySubmit = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    replyMutation.mutate(
      {
        reviewId,
        courseId,
        data: { reply: text },
      },
      {
        onSuccess: () => {
          setEditingReply((prev) => ({ ...prev, [reviewId]: false }));
        },
        onError: (err) => {
          showToast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Không thể gửi phản hồi.',
          });
        },
      }
    );
  };

  const startEditReply = (reviewId: string, currentReply?: string) => {
    setReplyText((prev) => ({ ...prev, [reviewId]: currentReply || '' }));
    setEditingReply((prev) => ({ ...prev, [reviewId]: true }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="course-detail-tab cdt-reviews">
        <div className="cdt-loading">Đang tải đánh giá...</div>
      </div>
    );
  }

  return (
    <div className="course-detail-tab cdt-reviews">
      <div className="cdt-reviews__summary">
        <div className="cdt-reviews__stat cdt-reviews__stat--hero">
          <div className="cdt-reviews__value">{summary?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="cdt-reviews__label">Xếp hạng trung bình</div>
          <div className="cdt-reviews__stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={20}
                fill={s <= (summary?.averageRating || 0) ? '#FBBF24' : 'none'}
                color="#FBBF24"
              />
            ))}
          </div>
        </div>

        <div className="cdt-reviews__stat">
          <div className="cdt-reviews__value">{summary?.totalReviews || 0}</div>
          <div className="cdt-reviews__label">Tổng đánh giá</div>
        </div>

        <div className="cdt-reviews__dist">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary?.ratingDistribution?.[star] || 0;
            const percent = summary?.totalReviews ? (count / summary.totalReviews) * 100 : 0;
            return (
              <div key={star} className="cdt-reviews__dist-row">
                <span className="cdt-reviews__dist-label">{star}★</span>
                <div className="cdt-reviews__dist-bar">
                  <div className="cdt-reviews__dist-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="cdt-reviews__dist-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="cdt-reviews__toolbar">
          <div className="cdt-reviews__filter">
            <Filter size={16} aria-hidden />
            <select
              value={filterRating ?? ''}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tất cả đánh giá</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} sao
                </option>
              ))}
            </select>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="cdt-reviews__empty">
            <MessageSquare size={48} strokeWidth={1.25} />
            <p>
              {filterRating 
                ? `Chưa có đánh giá ${filterRating} sao nào.` 
                : `Chưa có đánh giá nào cho ${UI_TEXT.COURSE.toLowerCase()} này.`}
            </p>
          </div>
        ) : (
          <div className="cdt-reviews__list">
            {reviews.map((review) => {
              const initial = (review.studentName || '?').charAt(0);
              return (
                <div key={review.id} className="cdt-reviews__card">
                  <div className="cdt-reviews__head">
                    {review.studentAvatar ? (
                      <img src={review.studentAvatar} alt="" className="cdt-reviews__avatar" />
                    ) : (
                      <div className="cdt-reviews__avatar cdt-reviews__avatar-ph">{initial}</div>
                    )}
                    <div>
                      <h4 className="cdt-reviews__name">{review.studentName || 'Học viên'}</h4>
                      <div className="cdt-reviews__meta">
                        <span className="cdt-reviews__stars" style={{ gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= review.rating ? '#FBBF24' : 'none'}
                              color="#FBBF24"
                            />
                          ))}
                        </span>
                        <span>•</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {review.comment && <p className="cdt-reviews__comment">{review.comment}</p>}

                  <div className="cdt-reviews__reply">
                    {editingReply[review.id] ? (
                      <div>
                        <textarea
                          className="cdt-reviews__ta"
                          placeholder="Viết phản hồi của bạn..."
                          value={replyText[review.id] || ''}
                          onChange={(e) =>
                            setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))
                          }
                          autoFocus
                        />
                        <div className="cdt-reviews__actions">
                          <button
                            type="button"
                            className="cdt-reviews__btn-ghost"
                            onClick={() =>
                              setEditingReply((prev) => ({ ...prev, [review.id]: false }))
                            }
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="cdt-reviews__btn-save"
                            onClick={() => handleReplySubmit(review.id)}
                            disabled={
                              (pendingReplyId === review.id && replyMutation.isPending) ||
                              !replyText[review.id]?.trim()
                            }
                          >
                            {pendingReplyId === review.id && replyMutation.isPending
                              ? 'Đang gửi...'
                              : 'Gửi phản hồi'}
                          </button>
                        </div>
                      </div>
                    ) : review.instructorReply ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <span className="cdt-reviews__reply-badge">Bạn đã phản hồi</span>
                          <span style={{ fontSize: '0.75rem', color: '#87867f' }}>
                            {formatDate(review.repliedAt)}
                          </span>
                        </div>
                        <p className="cdt-reviews__reply-text">{review.instructorReply}</p>
                        <button
                          type="button"
                          className="cdt-reviews__btn-ghost"
                          onClick={() => startEditReply(review.id, review.instructorReply)}
                        >
                          <Edit2 size={14} /> Chỉnh sửa
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="cdt-reviews__btn-reply"
                        onClick={() => startEditReply(review.id)}
                      >
                        <Send size={14} /> Trả lời nhận xét này
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReviewsTab;
