import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Clock, Eye, Loader2, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CourseResponse, CourseLevel } from '../../types';
import {
  formatPrice,
  getDiscountPercentage,
  getEffectivePrice,
  hasActiveDiscount,
} from '../../utils/pricing';

interface CourseCardProps {
  course: CourseResponse;
  index: number;
  /** Called when student clicks the primary purchase/enroll CTA on the card */
  onPurchase?: (courseId: string) => void;
  isPurchasing?: boolean;
  isEnrolled?: boolean;
  /** enrollmentId for the enrolled course — enables direct "Vào học" navigation */
  enrolledEnrollmentId?: string;
  /** Number of free-preview lessons (shown in metrics row) */
  freePreviewCount?: number;
  showEnrollButton?: boolean;
  onClick?: () => void;
}

const coverGradients = [
  'linear-gradient(135deg, #f5f4ed 0%, #ede8dc 100%)',
  'linear-gradient(135deg, #faf9f5 0%, #f0eee6 100%)',
  'linear-gradient(135deg, #f3efe4 0%, #e8e6dc 100%)',
  'linear-gradient(135deg, #f7f3eb 0%, #ede3d4 100%)',
  'linear-gradient(135deg, #faf7f3 0%, #efe7dc 100%)',
  'linear-gradient(135deg, #f6f2ea 0%, #e7dfd2 100%)',
] as const;

const coverAccents = ['#4d4c48', '#5e5d59', '#7a5a4d', '#81644c', '#6e5b7e', '#4a6a5a'] as const;

const levelMap: Record<CourseLevel | 'ALL_LEVELS', { label: string; bg: string; text: string }> = {
  BEGINNER: { label: 'Cơ bản', bg: '#dfe9e3', text: '#355345' },
  INTERMEDIATE: { label: 'Trung bình', bg: '#efe2d3', text: '#755437' },
  ADVANCED: { label: 'Nâng cao', bg: '#f3dddd', text: '#8f2f2f' },
  ALL_LEVELS: { label: 'Mọi cấp độ', bg: '#e6deef', text: '#5c4a70' },
};

// Format remaining days for discount expiry
const getExpiryLabel = (expiryDate: string | null | undefined): string | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return 'Hết hạn hôm nay';
  if (days === 1) return 'Còn 1 ngày';
  return `Còn ${days} ngày`;
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  index,
  onPurchase,
  isPurchasing,
  isEnrolled,
  enrolledEnrollmentId,
  freePreviewCount,
  showEnrollButton = true,
  onClick,
}) => {
  const navigate = useNavigate();

  const effectivePrice = getEffectivePrice(course);
  const isFree = effectivePrice === 0;
  const discountActive = hasActiveDiscount(course);
  const discountPct = discountActive ? getDiscountPercentage(course) : 0;
  const expiryLabel = discountActive ? getExpiryLabel(course.discountExpiryDate) : null;

  const primaryLabel = isFree ? 'Đăng ký miễn phí' : 'Mua ngay';

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/course/${course.id}`);
    }
  };

  const handleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/course/${course.id}`);
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPurchasing || isEnrolled) return;
    onPurchase?.(course.id);
  };

  const handleGoToCourse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (enrolledEnrollmentId) {
      navigate(`/student/courses/${enrolledEnrollmentId}`);
    } else {
      navigate('/student/courses');
    }
  };

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + (index % 10) * 0.05, duration: 0.4 }}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* ── Cover ── */}
      <div
        className="course-cover"
        style={{
          background: coverGradients[index % coverGradients.length],
          color: coverAccents[index % coverAccents.length],
        }}
      >
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt={course.title} className="cover-thumb" />
        )}
        <div className="cover-overlay" />
        <div className="cover-index">#{String(index + 1).padStart(2, '0')}</div>

        {/* Level badge */}
        {course.level && (
          <span
            style={{
              position: 'absolute',
              top: '0.6rem',
              left: '0.7rem',
              zIndex: 2,
              background: 'rgba(0,0,0,0.4)',
              color: '#fff',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {levelMap[course.level]?.label ?? 'Mọi cấp độ'}
          </span>
        )}

        {/* Enrolled badge */}
        {isEnrolled && (
          <span
            style={{
              position: 'absolute',
              top: '0.6rem',
              right: '0.7rem',
              zIndex: 2,
              background: 'rgba(34,197,94,0.85)',
              color: '#fff',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              backdropFilter: 'blur(6px)',
            }}
          >
            ✓ Đã đăng ký
          </span>
        )}

        {/* Discount badge on cover */}
        {discountActive && discountPct > 0 && !isEnrolled && (
          <span
            style={{
              position: 'absolute',
              top: '0.6rem',
              right: '0.7rem',
              zIndex: 2,
              background: 'rgba(239,68,68,0.9)',
              color: '#fff',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '0.7rem',
              fontWeight: 800,
              backdropFilter: 'blur(6px)',
            }}
          >
            -{discountPct}%
          </span>
        )}

        <h3 className="cover-title">{course.title}</h3>
      </div>

      {/* ── Body ── */}
      <div className="course-body">
        {/* Teacher */}
        {course.teacherName && (
          <div
            className="teacher-info-mini"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/student/instructors/${course.teacherId}`);
            }}
            style={{ cursor: 'pointer' }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/student/instructors/${course.teacherId}`);
            }}
          >
            {course.teacherAvatar && (
              <img src={course.teacherAvatar} alt="" className="mini-avatar" />
            )}
            <p className="course-desc-teacher">{course.teacherName}</p>
          </div>
        )}

        {/* Metrics row */}
        <div className="course-metrics">
          <div className="metric">
            <BookOpen size={13} />
            <span>{course.lessonsCount} bài học</span>
          </div>
          <div className="metric">
            <Star size={13} />
            <span>{Number(course.rating).toFixed(1)}</span>
          </div>
          <div className="metric">
            <Users size={13} />
            <span>{course.studentsCount}</span>
          </div>
          {freePreviewCount !== undefined && freePreviewCount > 0 && (
            <div className="metric" style={{ color: '#059669' }}>
              <Eye size={13} />
              <span>{freePreviewCount} miễn phí</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="course-pricing">
          {discountActive ? (
            <div className="price-container">
              <span className="current-price">{formatPrice(effectivePrice)}</span>
              {course.originalPrice && course.originalPrice > effectivePrice && (
                <span className="original-price">{formatPrice(course.originalPrice)}</span>
              )}
            </div>
          ) : course.originalPrice && course.originalPrice > 0 ? (
            <span className="current-price">{formatPrice(course.originalPrice)}</span>
          ) : (
            <span className="current-price price-free">Miễn phí</span>
          )}

          {/* Expiry countdown */}
          {expiryLabel && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '2px 7px',
                borderRadius: 6,
              }}
            >
              <Clock size={11} />
              {expiryLabel}
            </span>
          )}
        </div>

        {/* ── Actions ── */}
        {showEnrollButton && (
          <div className="course-actions" style={{ display: 'flex', gap: '8px' }}>
            {isEnrolled ? (
              /* Enrolled state: single "Vào học" CTA */
              <button
                className="action-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={handleGoToCourse}
              >
                <ChevronRight size={14} />
                Vào học ngay
              </button>
            ) : (
              <>
                {/* Secondary: View details */}
                <button
                  className="action-secondary"
                  style={{
                    background: '#E8E6DC',
                    color: '#4D4C48',
                    flex: 1,
                    border: '1px solid #D1CFC5',
                    padding: '0.6rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                  onClick={handleDetails}
                >
                  Xem chi tiết
                </button>

                {/* Primary: Buy / Register */}
                <button
                  className="action-primary"
                  style={{ flex: 1 }}
                  onClick={handlePurchaseClick}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 4 }} />
                      Đang xử lý...
                    </>
                  ) : (
                    primaryLabel
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .teacher-info-mini {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0.5rem;
        }
        .mini-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
        }
        .teacher-info-mini:hover .course-desc-teacher {
          color: #c96442;
          text-decoration: underline;
        }
        .course-desc-teacher {
          font-size: 0.85rem;
          color: #5e5d59;
          margin: 0;
          transition: color 0.15s;
        }
        .course-pricing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.75rem 0;
          padding-top: 0.75rem;
          border-top: 1px solid #e8e6dc;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .price-container {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .current-price {
          font-size: 1.15rem;
          font-weight: 700;
          color: #141413;
        }
        .original-price {
          font-size: 0.875rem;
          color: #87867f;
          text-decoration: line-through;
        }
        .price-free {
          color: #4a6a5a;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </motion.article>
  );
};
