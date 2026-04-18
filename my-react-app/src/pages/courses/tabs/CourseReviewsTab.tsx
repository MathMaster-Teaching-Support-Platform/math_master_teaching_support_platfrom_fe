import React, { useState } from 'react';
import { Star, MessageSquare, Send, Edit2, Filter } from 'lucide-react';
import { 
  useCourseReviews, 
  useReviewSummary,
  useReplyToReview
} from '../../../hooks/useCourses';

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

  const reviews = reviewsData?.result?.content ?? [];
  const summary = summaryData?.result;

  const handleReplySubmit = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    replyMutation.mutate({ 
      reviewId, 
      courseId, 
      data: { reply: text } 
    }, {
      onSuccess: () => {
        setEditingReply(prev => ({ ...prev, [reviewId]: false }));
      }
    });
  };

  const startEditReply = (reviewId: string, currentReply?: string) => {
    setReplyText(prev => ({ ...prev, [reviewId]: currentReply || '' }));
    setEditingReply(prev => ({ ...prev, [reviewId]: true }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) return <div className="loading-state">Đang tải đánh giá...</div>;

  return (
    <div className="teacher-reviews-container">
      {/* 1. Statistics Summary */}
      <div className="reviews-summary-grid">
        <div className="stat-card primary-stat">
          <div className="stat-value">{summary?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Xếp hạng trung bình</div>
          <div className="stars-display">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={20} fill={s <= (summary?.averageRating || 0) ? '#FBBF24' : 'none'} color="#FBBF24" />
            ))}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{summary?.totalReviews || 0}</div>
          <div className="stat-label">Tổng số đánh giá</div>
        </div>

        <div className="star-distribution-card">
          {[5, 4, 3, 2, 1].map(star => {
            const count = summary?.ratingDistribution?.[star] || 0;
            const percent = summary?.totalReviews ? (count / summary.totalReviews) * 100 : 0;
            return (
              <div key={star} className="dist-row">
                <span className="dist-star-label">{star} sao</span>
                <div className="dist-bar-bg">
                  <div className="dist-bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="dist-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Review List with Management */}
      <div className="reviews-management-section">
        <div className="section-toolbar">
          <div className="filter-group">
            <Filter size={16} />
            <select value={filterRating || ''} onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">Tất cả đánh giá</option>
              {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} sao</option>)}
            </select>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <p>Chưa có đánh giá nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="teacher-review-list">
            {reviews.map((review: any) => (
              <div key={review.id} className="review-manage-card">
                <div className="review-header">
                  <div className="student-info">
                    {review.studentAvatar ? (
                      <img src={review.studentAvatar} alt={review.studentName} className="avatar-img" />
                    ) : (
                      <div className="avatar-placeholder">{review.studentName.charAt(0)}</div>
                    )}
                    <div>
                      <h4 className="student-name">{review.studentName}</h4>
                      <div className="review-meta">
                        <div className="stars-mini">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} fill={s <= review.rating ? '#FBBF24' : 'none'} color="#FBBF24" />
                          ))}
                        </div>
                        <span className="dot">•</span>
                        <span className="timestamp">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-content">
                  <p className="comment-text">{review.comment}</p>
                </div>

                {/* Instructor Reply Area */}
                <div className="reply-section">
                  {editingReply[review.id] ? (
                    <div className="reply-editor">
                      <textarea
                        placeholder="Viết phản hồi của bạn..."
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                        autoFocus
                      />
                      <div className="editor-actions">
                        <button className="btn-cancel" onClick={() => setEditingReply(prev => ({ ...prev, [review.id]: false }))}>Hủy</button>
                        <button 
                          className="btn-save" 
                          onClick={() => handleReplySubmit(review.id)}
                          disabled={replyMutation.isPending || !replyText[review.id]?.trim()}
                        >
                          {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                        </button>
                      </div>
                    </div>
                  ) : review.instructorReply ? (
                    <div className="existing-reply">
                      <div className="reply-meta">
                        <span className="reply-badge">Bạn đã phản hồi</span>
                        <span className="reply-date">{formatDate(review.repliedAt)}</span>
                      </div>
                      <p className="reply-content">{review.instructorReply}</p>
                      <button className="btn-edit-reply" onClick={() => startEditReply(review.id, review.instructorReply)}>
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                    </div>
                  ) : (
                    <button className="btn-reply-trigger" onClick={() => startEditReply(review.id)}>
                      <Send size={14} /> Trả lời nhận xét này
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .teacher-reviews-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 0.5rem 0;
        }

        /* Stats Grid */
        .reviews-summary-grid {
          display: grid;
          grid-template-columns: 200px 200px 1fr;
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .primary-stat .stat-value {
          color: #B45309;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .stars-display {
          display: flex;
          gap: 2px;
          margin-top: 0.75rem;
        }

        .star-distribution-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dist-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .dist-star-label {
          width: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .dist-bar-bg {
          flex: 1;
          height: 8px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }

        .dist-bar-fill {
          height: 100%;
          background: #FBBF24;
          border-radius: 99px;
        }

        .dist-count {
          width: 30px;
          font-size: 0.85rem;
          color: #64748b;
          text-align: right;
        }

        /* List Management */
        .section-toolbar {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .filter-group select {
          border: none;
          outline: none;
          font-weight: 600;
          color: #1e293b;
        }

        .teacher-review-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .review-manage-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .review-manage-card:hover { border-color: #cbd5e1; }

        .student-info {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .avatar-img, .avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .avatar-placeholder {
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #4f46e5;
        }

        .student-name {
          margin: 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .stars-mini { display: flex; gap: 2px; }

        .comment-text {
          margin: 0 0 1.5rem;
          color: #334155;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* Reply Area */
        .reply-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .btn-reply-trigger {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #4f46e5;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-reply-trigger:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .reply-editor textarea {
          width: 100%;
          min-height: 100px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.75rem;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          margin-bottom: 0.75rem;
        }

        .editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-cancel {
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0 12px;
        }

        .btn-save {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        .existing-reply {
          position: relative;
        }

        .reply-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .reply-badge {
          background: #e0e7ff;
          color: #4338ca;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .reply-date {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .reply-content {
          margin: 0 0 1rem;
          color: #475569;
          font-style: italic;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .btn-edit-reply {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          margin-left: -8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .btn-edit-reply:hover { background: rgba(0,0,0,0.05); }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #94a3b8;
          background: white;
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }

        .empty-state p { margin-top: 1rem; }

        @media (max-width: 900px) {
          .reviews-summary-grid {
            grid-template-columns: 1fr 1fr;
          }
          .star-distribution-card { grid-column: span 2; }
        }
      `}</style>
    </div>
  );
};

export default CourseReviewsTab;
