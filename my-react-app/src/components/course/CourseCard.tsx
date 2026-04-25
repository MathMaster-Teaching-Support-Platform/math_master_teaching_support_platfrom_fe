import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Users, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { CourseResponse, CourseLevel } from '../../types';
import { getEffectivePrice, hasActiveDiscount, formatPrice, getDiscountPercentage } from '../../utils/pricing';

interface CourseCardProps {
  course: CourseResponse;
  index: number;
  onEnroll?: (courseId: string) => void;
  isEnrolling?: boolean;
  isEnrolled?: boolean;
  showEnrollButton?: boolean;
  onClick?: () => void;
}

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#0f766e', '#047857', '#c2410c', '#be185d', '#6d28d9'] as const;

const levelMap: Record<CourseLevel | 'ALL_LEVELS', { label: string; color: string }> = {
  BEGINNER: { label: 'Cơ bản', color: '#10b981' },
  INTERMEDIATE: { label: 'Trung bình', color: '#f59e0b' },
  ADVANCED: { label: 'Nâng cao', color: '#ef4444' },
  ALL_LEVELS: { label: 'Mọi cấp độ', color: '#6366f1' },
};

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  index, 
  onEnroll, 
  isEnrolling, 
  isEnrolled,
  showEnrollButton = true,
  onClick
}) => {
  const navigate = useNavigate();

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent enrollment if already enrolling or enrolled
    if (isEnrolling || isEnrolled) {
      return;
    }
    if (onEnroll && !isEnrolled) {
      onEnroll(course.id);
    }
  };

  const getEnrollBtnLabel = () => {
    if (isEnrolled) return '✓ Đã đăng ký';
    if (isEnrolling) return (
      <>
        <Loader2 size={14} className="animate-spin" style={{ display: 'inline-block', marginRight: '4px' }} />
        Đang xử lý...
      </>
    );
    return 'Đăng ký học';
  };

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + (index % 10) * 0.05, duration: 0.4 }}
      onClick={onClick || (() => navigate(`/course/${course.id}`))}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) {
            onClick();
          } else {
            navigate(`/course/${course.id}`);
          }
        }
      }}
    >
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
        {course.level && (
          <span 
            className="course-badge" 
            style={{ 
              top: '10px', 
              right: '10px', 
              background: levelMap[course.level]?.color ?? '#6366f1' 
            }}
          >
            {levelMap[course.level]?.label ?? 'Mọi cấp độ'}
          </span>
        )}
        {isEnrolled && <span className="course-badge badge-live" style={{ top: '35px', right: '10px' }}>✓ Đã đăng ký</span>}
        <h3 className="cover-title">{course.title}</h3>
      </div>
      <div className="course-body">
        <Link 
          to={`/student/instructors/${course.teacherId}`} 
          className="teacher-info-mini-link"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="teacher-info-mini">
            {course.teacherAvatar && <img src={course.teacherAvatar} alt="" className="mini-avatar" />}
            <p className="course-desc-teacher">{course.teacherName ?? 'Giáo viên'}</p>
          </div>
        </Link>
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
        </div>
        <div className="course-pricing">
          {hasActiveDiscount(course) ? (
            <div className="price-container">
              <span className="current-price">
                {formatPrice(getEffectivePrice(course))}
              </span>
              {course.originalPrice && course.originalPrice > getEffectivePrice(course) && (
                <span className="original-price">
                  {formatPrice(course.originalPrice)}
                </span>
              )}
            </div>
          ) : course.originalPrice && course.originalPrice > 0 ? (
            <span className="current-price">{formatPrice(course.originalPrice)}</span>
          ) : (
            <span className="current-price price-free">Miễn phí</span>
          )}
          {hasActiveDiscount(course) && course.originalPrice && course.originalPrice > getEffectivePrice(course) && (
            <span className="discount-badge">
              -{getDiscountPercentage(course)}%
            </span>
          )}
        </div>
        {showEnrollButton && (
          <div className="course-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="action-secondary"
              style={{
                background: '#f1f5f9',
                color: '#475569',
                flex: 1,
                border: 'none',
                padding: '0.6rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}`); }}
            >
              Xem chi tiết
            </button>
            <button
              className="action-primary"
              style={{
                flex: 1,
                ...(isEnrolled ? { background: '#ecfdf5', color: '#065f46', cursor: 'default' } : {}),
              }}
              onClick={handleEnrollClick}
              disabled={isEnrolling || isEnrolled}
            >
              {getEnrollBtnLabel()}
            </button>
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
        .teacher-info-mini-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: fit-content;
          z-index: 10;
          position: relative;
        }
        .teacher-info-mini-link:hover .course-desc-teacher {
          color: #4f46e5;
          text-decoration: underline;
        }
        .course-desc-teacher {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
        .course-pricing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.75rem 0;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }
        .price-container {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .current-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }
        .original-price {
          font-size: 0.875rem;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .price-free {
          color: #059669;
        }
        .discount-badge {
          background: #fef08a;
          color: #854d0e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </motion.article>
  );
};
