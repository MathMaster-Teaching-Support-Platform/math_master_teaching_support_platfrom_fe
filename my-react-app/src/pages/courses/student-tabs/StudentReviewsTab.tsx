import {
  AlertCircle,
  Edit2,
  Filter,
  MessageSquare,
  Send,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { UI_TEXT } from '../../../constants/uiText';
import React, { useState } from 'react';
import {
  useCourseReviews,
  useDeleteReview,
  useMyReview,
  useReviewSummary,
  useSubmitReview,
  useUpdateReview,
} from '../../../hooks/useCourses';

interface StudentReviewsTabProps {
  courseId: string;
}

const StudentReviewsTab: React.FC<StudentReviewsTabProps> = ({ courseId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);

  const { data: summaryData } = useReviewSummary(courseId);
  const { data: reviewsData, isLoading: reviewsLoading } = useCourseReviews(
    courseId,
    0,
    20,
    filterRating
  );
  const { data: myReviewData, isLoading: myReviewLoading } = useMyReview(courseId);

  const submitReviewMutation = useSubmitReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const reviews = reviewsData?.result?.content ?? [];
  const myReview = myReviewData?.result;
  const summary = summaryData?.result;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = { rating, comment };

    if (isEditing && myReview) {
      updateReviewMutation.mutate(
        { reviewId: myReview.id, courseId, data },
        {
          onSuccess: () => setIsEditing(false),
          onError: (err) => setError(err instanceof Error ? err.message : 'Cập nhật thất bại'),
        }
      );
    } else {
      submitReviewMutation.mutate(
        { courseId, data },
        {
          onSuccess: () => {
            setComment('');
            setRating(5);
          },
          onError: (err) => setError(err instanceof Error ? err.message : 'Gửi đánh giá thất bại'),
        }
      );
    }
  };

  const startEdit = () => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (myReview && window.confirm('Bạn có chắc muốn xóa nhận xét này?')) {
      deleteReviewMutation.mutate({ reviewId: myReview.id, courseId });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (reviewsLoading || myReviewLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--sc-text-secondary)' }}>
        <div className="loading-spinner" />
        <p>Đang tải dữ liệu đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      {/* 1. Header Summary Section (Udemy Standard) */}
      <div className="review-summary-header card">
        <div className="summary-left">
          <div className="avg-box">
            <span className="avg-num">{summary?.averageRating?.toFixed(1) || '0.0'}</span>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={s <= (summary?.averageRating || 0) ? '#FBBF24' : 'none'}
                  color="#FBBF24"
                />
              ))}
            </div>
            <span className="total-label">
              Xếp hạng {UI_TEXT.COURSE.toLowerCase()} ({summary?.totalReviews || 0} đánh giá)
            </span>
          </div>
        </div>

        <div className="summary-right stats-histogram">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary?.ratingDistribution?.[star] || 0;
            const percent = summary?.totalReviews ? (count / summary.totalReviews) * 100 : 0;
            const isActive = filterRating === star;

            return (
              <div
                key={star}
                className={`stat-row ${isActive ? 'active' : ''}`}
                onClick={() => setFilterRating(isActive ? undefined : star)}
              >
                <div className="progress-bar-wrap">
                  <div
                    className="progress-fill"
                    style={{ transform: `scaleX(${percent / 100})` }}
                  />
                </div>
                <div className="stat-meta">
                  <div className="stars-mini">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= star ? '#FBBF24' : 'none'}
                        color="#FBBF24"
                      />
                    ))}
                  </div>
                  <span className="percent-label">{percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Review Input Section */}
      <div className="review-input-section">
        {!myReview || isEditing ? (
          <div className="review-card write-card">
            <div className="card-header">
              <MessageSquare size={20} className="icon-accent" />
              <h3>{isEditing ? 'Chỉnh sửa đánh giá' : 'Để lại đánh giá của bạn'}</h3>
            </div>

            {error && (
              <div
                className="alert-box error"
                style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="rating-selector">
                <p>Cảm nhận của bạn sau khi học?</p>
                <div className="star-group">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setRating(s)}
                      onClick={() => setRating(s)}
                      className={`star-btn ${s <= rating ? 'active' : ''}`}
                    >
                      <Star
                        size={32}
                        fill={s <= rating ? 'currentColor' : 'none'}
                        strokeWidth={s <= rating ? 0 : 1}
                      />
                    </button>
                  ))}
                  <span className="rating-label">
                    {rating === 5
                      ? 'Xuất sắc'
                      : rating === 4
                        ? 'Tốt'
                        : rating === 3
                          ? 'Bình thường'
                          : rating === 2
                            ? 'Kém'
                            : 'Rất tệ'}
                  </span>
                </div>
              </div>

              <div className="comment-input">
                <textarea
                  placeholder={`Chia sẻ trải nghiệm cụ thể của bạn về ${UI_TEXT.COURSE.toLowerCase()} này...`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button type="button" className="btn-text" onClick={() => setIsEditing(false)}>
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-premium"
                  disabled={submitReviewMutation.isPending || updateReviewMutation.isPending}
                >
                  <Send size={18} />
                  <span>{isEditing ? 'Cập nhật' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="review-card my-review-card">
            <div className="card-header">
              <div className="user-meta">
                <div className="avatar-mini gold">
                  <User size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Đánh giá của bạn</h3>
                  <span className="date-sub">{formatDate(myReview.updatedAt)}</span>
                </div>
              </div>
              <div className="actions">
                <button onClick={startEdit} className="action-btn">
                  <Edit2 size={16} />
                </button>
                <button onClick={handleDelete} className="action-btn danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="review-body">
              <div className="stars-static">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= myReview.rating ? '#FBBF24' : '#E2E8F0'}
                    color={s <= myReview.rating ? '#FBBF24' : '#E2E8F0'}
                  />
                ))}
              </div>
              <p className="comment-text">{myReview.comment}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter & List Section */}
      <div className="other-reviews">
        <div className="section-header-row">
          <div className="flex-title">
            <MessageSquare size={22} className="title-icon" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Nhận xét từ học viên</h3>
              {filterRating && (
                <div className="active-filter-badge">
                  <span>Chỉ hiện {filterRating} sao</span>
                  <button onClick={() => setFilterRating(undefined)}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="filter-controls">
            <Filter size={16} />
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tất cả xếp hạng</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-reviews">
            <div className="empty-icon-wrap">
              <MessageSquare size={48} />
            </div>
            <p>
              {filterRating
                ? `Không có đánh giá ${filterRating} sao nào.`
                : 'Chưa có nhận xét nào.'}
            </p>
          </div>
        ) : (
          <div className="review-list">
            {reviews.map((review: any) => (
              <div key={review.id} className="review-item card">
                <div className="review-user-info">
                  <div className="user-avatar-wrap">
                    {review.studentAvatar ? (
                      <img
                        src={review.studentAvatar}
                        alt={review.studentName}
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar placeholder">{review.studentName.charAt(0)}</div>
                    )}
                  </div>
                  <div className="user-text-meta">
                    <h4>{review.studentName}</h4>
                    <div className="stars-static">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= review.rating ? '#FBBF24' : '#E2E8F0'}
                          color={s <= review.rating ? '#FBBF24' : '#E2E8F0'}
                        />
                      ))}
                      <span className="review-date-mini">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="review-content">
                  <p className="review-body-text">{review.comment}</p>

                  {/* Instructor Reply Box */}
                  {review.instructorReply && (
                    <div className="instructor-reply-box">
                      <div className="reply-header">
                        <div className="badge-instructor">Giảng viên</div>
                        <span className="reply-date">{formatDate(review.repliedAt)}</span>
                      </div>
                      <p className="reply-text">{review.instructorReply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .reviews-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding: 1rem 0;
        }

        .review-card, .card {
          background: #ffffff;
          border: 1px solid var(--sc-border);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--sc-shadow-card);
        }

        /* Summary Header Styles */
        .review-summary-header {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
          align-items: center;
          padding: 2.5rem !important;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        }

        .summary-left .avg-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .avg-num {
          font-size: 3.5rem;
          font-weight: 800;
          color: #B45309;
          line-height: 1;
        }

        .stars-row {
          display: flex;
          gap: 4px;
          margin: 0.75rem 0;
        }

        .total-label {
          font-weight: 600;
          color: var(--sc-text-secondary);
          font-size: 0.95rem;
        }

        .stats-histogram {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 4px;
          border-radius: 8px;
        }

        .stat-row:hover {
          background: rgba(0,0,0,0.02);
        }

        .stat-row.active {
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
        }

        .progress-bar-wrap {
          flex: 1;
          height: 10px;
          background: #F1F5F9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #FBBF24;
          border-radius: 999px;
          width: 100%;
          transform-origin: left;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .stat-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 140px;
        }

        .percent-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--sc-indigo);
          flex-shrink: 0;
        }

        /* Input Form Styles */
        .write-card {
          border-top: 4px solid var(--sc-indigo);
        }

        .star-group {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin: 1rem 0;
        }

        .star-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #E2E8F0;
          transition: transform 0.2s;
        }

        .star-btn:hover { transform: scale(1.15); }
        .star-btn.active { color: #FBBF24; }

        .rating-label {
          margin-left: 1rem;
          font-weight: 600;
          color: var(--sc-text-secondary);
        }

        .comment-input textarea {
          width: 100%;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.25rem;
          font-size: 1rem;
          min-height: 120px;
          transition: all 0.2s;
        }

        .comment-input textarea:focus {
          outline: none;
          border-color: var(--sc-indigo);
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-premium {
          background: var(--sc-indigo);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 2rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-premium:hover:not(:disabled) {
          background: var(--sc-indigo-light);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.25);
        }

        /* Review List Styles */
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .flex-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title-icon { color: var(--sc-indigo); }

        .active-filter-badge {
          background: #DBEAFE;
          color: #1E40AF;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .active-filter-badge button {
          background: none;
          border: none;
          cursor: pointer;
          color: #1E40AF;
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          color: var(--sc-text-secondary);
        }

        .filter-controls select {
          background: none;
          border: none;
          font-weight: 600;
          color: var(--sc-text-primary);
          outline: none;
        }

        .review-item {
          padding: 2.25rem !important;
          margin-bottom: 1.5rem;
          border-radius: 24px !important;
          transition: transform 0.2s ease;
        }
        
        .review-item:hover {
          transform: translateY(-2px);
        }

        .review-user-info {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .user-avatar {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          object-fit: cover;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: var(--sc-indigo);
          font-size: 1.2rem;
        }

        .user-text-meta h4 {
          margin: 0 0 4px;
          font-size: 1.1rem;
        }

        .review-date-mini {
          font-size: 0.8rem;
          color: var(--sc-text-muted);
          margin-left: 8px;
        }

        .review-body-text {
          color: var(--sc-text-primary);
          line-height: 1.7;
          font-size: 1.05rem;
        }

        /* Instructor Reply Styles */
        .instructor-reply-box {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 16px;
          box-shadow: inset 3px 0 0 var(--sc-indigo);
        }

        .reply-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .badge-instructor {
          background: var(--sc-indigo);
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .reply-date {
          font-size: 0.75rem;
          color: var(--sc-text-muted);
        }

        .reply-text {
          margin: 0;
          color: var(--sc-text-secondary);
          font-style: italic;
          line-height: 1.6;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #E2E8F0;
          border-radius: 50%;
          border-top-color: var(--sc-indigo);
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .review-summary-header {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentReviewsTab;
