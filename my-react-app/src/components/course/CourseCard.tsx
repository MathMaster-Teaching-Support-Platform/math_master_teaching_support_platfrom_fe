import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CourseResponse } from '../../types';

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

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  index, 
  onEnroll, 
  isEnrolling, 
  isEnrolled,
  showEnrollButton = true,
  onClick
}) => {
  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnroll && !isEnrolled) {
      onEnroll(course.id);
    }
  };

  let enrollBtnLabel = 'Đăng ký học';
  if (isEnrolled) enrollBtnLabel = '✓ Đã đăng ký';
  else if (isEnrolling) enrollBtnLabel = 'Đang đăng ký...';

  return (
    <motion.article
      className="data-card course-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + (index % 10) * 0.05, duration: 0.4 }}
      onClick={onClick || (() => window.location.href = `/student/courses/preview/${course.id}`)}
      style={{ cursor: 'pointer' }}
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
        {isEnrolled && <span className="course-badge badge-live">✓ Đã đăng ký</span>}
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
        {showEnrollButton && (
          <div className="course-actions">
            <button
              className="action-primary"
              style={{
                flex: 1,
                ...(isEnrolled ? { background: '#ecfdf5', color: '#065f46', cursor: 'default' } : {}),
              }}
              onClick={handleEnrollClick}
              disabled={isEnrolling || isEnrolled}
            >
              {enrollBtnLabel}
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
      `}</style>
    </motion.article>
  );
};
