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
import type { CourseReviewResponse } from '../../../types';
import './StudentReviewsTab.css';

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

  const toggleStarFilter = (star: number) => {
    setFilterRating((prev) => (prev === star ? undefined : star));
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
      <div className="srt-loading-container">
        <div className="srt-loading-spinner" />
        <p>Đang tải dữ liệu đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="srt-container">
      {/* 1. Header Summary Section */}
      <div className="srt-card srt-summary-header">
        <div className="srt-summary-left">
          <div className="srt-avg-box">
            <span className="srt-avg-num">{summary?.averageRating?.toFixed(1) || '0.0'}</span>
            <div className="srt-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= (summary?.averageRating || 0) ? '#FBBF24' : 'none'}
                  color="#FBBF24"
                />
              ))}
            </div>
            <span className="srt-total-label">
              Xếp hạng {UI_TEXT.COURSE.toLowerCase()} ({summary?.totalReviews || 0} đánh giá)
            </span>
          </div>
        </div>

        <div className="srt-stats-histogram">
            {[5, 4, 3, 2, 1].map((star) => {
            const count = summary?.ratingDistribution?.[star] || 0;
            const percent = summary?.totalReviews ? (count / summary.totalReviews) * 100 : 0;
            const isActive = filterRating === star;

            return (
              <div
                key={star}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Lọc đánh giá ${star} sao, ${percent.toFixed(0)} phần trăm`}
                className={`srt-stat-row ${isActive ? 'active' : ''}`}
                onClick={() => toggleStarFilter(star)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleStarFilter(star);
                  }
                }}
              >
                <div className="srt-progress-bar-wrap">
                  <div
                    className="srt-progress-fill"
                    style={{ transform: `scaleX(${percent / 100})` }}
                  />
                </div>
                <div className="srt-stat-meta">
                  <div className="srt-stars-mini">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= star ? '#FBBF24' : 'none'}
                        color="#FBBF24"
                      />
                    ))}
                  </div>
                  <span className="srt-percent-label">{percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Review Input Section */}
      <div className="srt-review-input-section">
        {!myReview || isEditing ? (
          <div className="srt-card srt-write-card">
            <div className="srt-card-header">
              <MessageSquare size={18} strokeWidth={2} className="srt-icon-accent" aria-hidden />
              <h3>{isEditing ? 'Chỉnh sửa đánh giá' : 'Để lại đánh giá của bạn'}</h3>
            </div>

            {error ? (
              <div className="srt-alert-error" role="alert">
                <AlertCircle size={15} strokeWidth={2} aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div className="srt-rating-selector">
                <p>Cảm nhận của bạn sau khi học?</p>
                <div className="srt-star-group">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setRating(s)}
                      onClick={() => setRating(s)}
                      className={`srt-star-btn ${s <= rating ? 'active' : ''}`}
                    >
                      <Star
                        size={26}
                        fill={s <= rating ? 'currentColor' : 'none'}
                        strokeWidth={s <= rating ? 0 : 1.25}
                      />
                    </button>
                  ))}
                  <span className="srt-rating-label">
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

              <div className="srt-comment-input">
                <textarea
                  placeholder={`Chia sẻ trải nghiệm cụ thể của bạn về ${UI_TEXT.COURSE.toLowerCase()} này...`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <div className="srt-form-actions">
                {isEditing && (
                  <button type="button" className="srt-btn-text" onClick={() => setIsEditing(false)}>
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="srt-btn-premium"
                  disabled={submitReviewMutation.isPending || updateReviewMutation.isPending}
                >
                  <Send size={16} strokeWidth={2} aria-hidden />
                  <span>{isEditing ? 'Cập nhật' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="srt-card srt-my-review-card">
            <div className="srt-card-header">
              <div className="srt-user-meta">
                <div className="srt-avatar-mini">
                  <User size={20} />
                </div>
                <div>
                  <h3>Đánh giá của bạn</h3>
                  <span className="srt-date-sub">{formatDate(myReview.updatedAt)}</span>
                </div>
              </div>
              <div className="srt-actions">
                <button type="button" onClick={startEdit} className="srt-action-btn" aria-label="Chỉnh sửa đánh giá">
                  <Edit2 size={17} strokeWidth={2} />
                </button>
                <button type="button" onClick={handleDelete} className="srt-action-btn danger" aria-label="Xóa đánh giá">
                  <Trash2 size={17} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="srt-review-body">
              <div className="srt-stars-static">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= myReview.rating ? '#FBBF24' : '#E2E8F0'}
                    color={s <= myReview.rating ? '#FBBF24' : '#E2E8F0'}
                  />
                ))}
              </div>
              <p className="srt-comment-text">{myReview.comment}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter & List Section */}
      <div className="srt-other-reviews">
        <div className="srt-section-header-row">
          <div className="srt-flex-title">
            <MessageSquare size={18} strokeWidth={2} className="title-icon" aria-hidden />
            <div className="srt-title-cluster">
              <h3>Nhận xét từ học viên</h3>
              {filterRating ? (
                <div className="srt-active-filter-badge">
                  <span>{filterRating} sao</span>
                  <button type="button" aria-label="Bỏ lọc" onClick={() => setFilterRating(undefined)}>
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="srt-filter-controls">
            <Filter size={15} strokeWidth={2} aria-hidden />
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
          <div className="srt-empty-reviews">
            <div className="srt-empty-icon-wrap">
              <MessageSquare size={40} />
            </div>
            <p>
              {filterRating
                ? `Không có đánh giá ${filterRating} sao nào.`
                : 'Chưa có nhận xét nào.'}
            </p>
          </div>
        ) : (
          <div className="srt-review-list">
            {reviews.map((review: CourseReviewResponse) => (
              <div key={review.id} className="srt-card srt-review-item">
                <div className="srt-review-user-info">
                  <div className="srt-user-avatar-wrap">
                    {review.studentAvatar ? (
                      <img
                        src={review.studentAvatar}
                        alt={review.studentName || 'Học viên'}
                        className="srt-user-avatar"
                      />
                    ) : (
                      <div className="srt-user-avatar" aria-hidden>
                        {(review.studentName?.trim().charAt(0) || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="srt-user-text-meta">
                    <h4>{review.studentName}</h4>
                    <div className="srt-stars-static">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= review.rating ? '#FBBF24' : '#E2E8F0'}
                          color={s <= review.rating ? '#FBBF24' : '#E2E8F0'}
                        />
                      ))}
                      <span className="srt-review-date-mini">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="srt-review-content">
                  <p className="srt-review-body-text">{review.comment}</p>

                  {/* Instructor Reply Box */}
                  {review.instructorReply && (
                    <div className="srt-instructor-reply-box">
                      <div className="srt-reply-header">
                        <div className="srt-badge-instructor">Giảng viên</div>
                        <span className="srt-reply-date">{formatDate(review.repliedAt)}</span>
                      </div>
                      <p className="srt-reply-text">{review.instructorReply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReviewsTab;
