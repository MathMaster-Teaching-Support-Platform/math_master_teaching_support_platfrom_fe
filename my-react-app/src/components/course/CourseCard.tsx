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
        {/* Level badge pinned top-left inside the cover */}
        {course.level && (
          <span
            className="cover-level-badge"
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
        {isEnrolled && (
          <span
            style={{
              position: 'absolute',
              top: '0.6rem',
              left: course.level ? '6rem' : '0.7rem',
              zIndex: 2,
              background: 'rgba(34,197,94,0.8)',
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
        {/* Title overlaid on the image */}
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
                background: '#E8E6DC',
                color: '#4D4C48',
                flex: 1,
                border: '1px solid #D1CFC5',
                padding: '0.6rem',
                borderRadius: '10px',
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
                ...(isEnrolled
                  ? { background: '#ede8dc', color: '#4d4c48', cursor: 'default' }
                  : {}),
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
          color: #c96442;
          text-decoration: underline;
        }
        .course-desc-teacher {
          font-size: 0.85rem;
          color: #5e5d59;
          margin: 0;
        }
        .course-pricing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.75rem 0;
          padding-top: 0.75rem;
          border-top: 1px solid #e8e6dc;
        }
        .price-container {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .current-price {
          font-size: 1.25rem;
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
        .discount-badge {
          background: #f3efe4;
          color: #7a5a4d;
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
