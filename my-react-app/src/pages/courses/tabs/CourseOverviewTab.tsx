import { BookOpen, Calendar, CheckCircle2, Eye, GraduationCap, Star, Users } from 'lucide-react';
import type { CourseResponse } from '../../../types';
import '../../../styles/module-refactor.css';

interface CourseOverviewTabProps {
  course: CourseResponse;
}

const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({ course }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="overview-tab">
      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap">
            <BookOpen size={20} />
          </div>
          <div>
            <h3>{course.lessonsCount}</h3>
            <p>Bài học</p>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap">
            <Users size={20} />
          </div>
          <div>
            <h3>{course.studentsCount}</h3>
            <p>Học viên</p>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap">
            <Star size={20} />
          </div>
          <div>
            <h3>{Number(course.rating).toFixed(1)}</h3>
            <p>Đánh giá</p>
          </div>
        </div>
        <div className="stat-card stat-violet">
          <div className="stat-icon-wrap">
            {course.published ? <Eye size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h3>{course.published ? 'Công khai' : 'Nháp'}</h3>
            <p>Trạng thái</p>
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div className="data-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>
          Thông tin giáo trình
        </h3>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="info-row">
            <span className="info-label">
              <GraduationCap size={16} />
              Môn học
            </span>
            <span className="info-value">{course.subjectName || '—'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              <BookOpen size={16} />
              Khối lớp
            </span>
            <span className="info-value">Khối {course.gradeLevel}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              <Users size={16} />
              Giáo viên
            </span>
            <span className="info-value">{course.teacherName || 'Bạn'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              <Calendar size={16} />
              Ngày tạo
            </span>
            <span className="info-value">{formatDate(course.createdAt)}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              <Calendar size={16} />
              Cập nhật lần cuối
            </span>
            <span className="info-value">{formatDate(course.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div className="data-card">
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>Mô tả</h3>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{course.description}</p>
        </div>
      )}

      {/* Thumbnail Preview */}
      {course.thumbnailUrl && (
        <div className="data-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
            Ảnh bìa
          </h3>
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid #e8eef8',
            }}
          />
        </div>
      )}

      <style>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-size: 0.95rem;
          color: #0f172a;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseOverviewTab;
