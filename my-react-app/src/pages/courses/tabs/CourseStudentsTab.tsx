import { useState } from 'react';
import { Search, Users, X, TrendingUp, Award } from 'lucide-react';
import { useCourseStudents } from '../../../hooks/useCourses';
import type { StudentInCourseResponse } from '../../../types';
import '../../../styles/module-refactor.css';

interface CourseStudentsTabProps {
  courseId: string;
}

const CourseStudentsTab: React.FC<CourseStudentsTabProps> = ({ courseId }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data: studentsData, isLoading } = useCourseStudents(courseId);

  const students: StudentInCourseResponse[] = studentsData?.result?.content ?? [];
  const totalStudents = studentsData?.result?.totalElements ?? 0;
  const totalPages = studentsData?.result?.totalPages ?? 0;

  const filteredStudents = students.filter((student) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      student.studentName?.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q)
    );
  });

  const avgProgress =
    students.length > 0
      ? students.reduce((sum, s) => sum + (s.completedLessons / s.totalLessons) * 100, 0) /
        students.length
      : 0;

  const completedCount = students.filter(
    (s) => s.completedLessons === s.totalLessons && s.totalLessons > 0
  ).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="students-tab">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap">
            <Users size={20} />
          </div>
          <div>
            <h3>{totalStudents}</h3>
            <p>Tổng học viên</p>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3>{avgProgress.toFixed(1)}%</h3>
            <p>Tiến độ trung bình</p>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap">
            <Award size={20} />
          </div>
          <div>
            <h3>{completedCount}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <label className="search-box" style={{ flex: 1, maxWidth: 400 }}>
          <span className="search-box__icon">
            <Search size={15} />
          </span>
          <input
            placeholder="Tìm kiếm học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-box__clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      {/* Loading */}
      {isLoading && <div className="empty">Đang tải danh sách học viên...</div>}

      {/* Empty State */}
      {!isLoading && students.length === 0 && (
        <div className="empty">
          <Users size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: '#94a3b8' }} />
          <p>Chưa có học viên nào đăng ký giáo trình này.</p>
        </div>
      )}

      {/* Students Table */}
      {!isLoading && students.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Email</th>
                  <th>Ngày đăng ký</th>
                  <th>Tiến độ</th>
                  <th>Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const progress =
                    student.totalLessons > 0
                      ? (student.completedLessons / student.totalLessons) * 100
                      : 0;
                  const isCompleted = student.completedLessons === student.totalLessons && student.totalLessons > 0;

                  return (
                    <tr key={student.studentId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {student.studentName || 'Không có tên'}
                        </div>
                      </td>
                      <td>
                        <span className="muted">{student.email || '—'}</span>
                      </td>
                      <td>
                        <span className="muted">{formatDate(student.enrolledAt)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              background: '#e8eef8',
                              borderRadius: 999,
                              overflow: 'hidden',
                              minWidth: 80,
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: isCompleted
                                  ? '#10b981'
                                  : 'linear-gradient(90deg, #1f5eff, #60a5fa)',
                                borderRadius: 999,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: isCompleted ? '#10b981' : '#1f5eff',
                              minWidth: 45,
                            }}
                          >
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                          {student.completedLessons}/{student.totalLessons} bài
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem' }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}

          {filteredStudents.length === 0 && search && (
            <div className="empty" style={{ marginTop: '2rem' }}>
              <Search size={32} style={{ marginBottom: 8, color: '#94a3b8' }} />
              <p>Không tìm thấy học viên phù hợp với "{search}"</p>
            </div>
          )}
        </>
      )}

      <style>{`
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CourseStudentsTab;
