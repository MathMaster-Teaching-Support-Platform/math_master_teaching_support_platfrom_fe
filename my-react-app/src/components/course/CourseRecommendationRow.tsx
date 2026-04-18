import React from 'react';
import type { CourseResponse } from '../../types';
import { CourseCard } from './CourseCard';
import { ChevronRight, Sparkles } from 'lucide-react';

interface CourseRecommendationRowProps {
  title: string;
  courses: CourseResponse[];
  loading?: boolean;
  onSeeMore?: () => void;
}

const CourseRecommendationRow: React.FC<CourseRecommendationRowProps> = ({ 
  title, 
  courses, 
  loading,
  onSeeMore 
}) => {
  if (!loading && courses.length === 0) return null;

  return (
    <div className="recommendation-row-container">
      <div className="row-header">
        <div className="header-label">
          <Sparkles size={16} className="sparkle-icon" />
          <h3>{title}</h3>
        </div>
        {onSeeMore && (
          <button className="btn-see-more" onClick={onSeeMore}>
            Xem thêm <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="row-scroll-container">
        {loading ? (
          <div className="row-skeletons">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card-mini" />
            ))}
          </div>
        ) : (
          <div className="row-cards">
            {courses.map((course, i) => (
              <div key={course.id} className="row-card-wrapper">
                <CourseCard 
                  course={course} 
                  index={i} 
                  showEnrollButton={false} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .recommendation-row-container {
          margin: 2.5rem 0;
          width: 100%;
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding: 0 4px;
        }

        .header-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sparkle-icon {
          color: #f59e0b;
        }

        .row-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .btn-see-more {
          background: none;
          border: none;
          color: #4f46e5;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-see-more:hover {
          transform: translateX(4px);
        }

        .row-scroll-container {
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          margin: 0 -1rem;
          padding: 0 1rem 1rem;
        }

        .row-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .row-cards, .row-skeletons {
          display: flex;
          gap: 1.5rem;
          min-width: min-content;
        }

        .row-card-wrapper {
          width: 280px;
          flex-shrink: 0;
        }

        .skeleton-card-mini {
          width: 280px;
          height: 320px;
          background: #f1f5f9;
          border-radius: 16px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        @media (max-width: 640px) {
          .row-card-wrapper {
            width: 240px;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseRecommendationRow;
