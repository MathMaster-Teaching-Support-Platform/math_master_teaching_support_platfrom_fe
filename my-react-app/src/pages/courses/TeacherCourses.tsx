import React, { useMemo, useState } from 'react';
import { Grid2x2, List, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockCourses } from '../../data/mockData';
import './TeacherCourses.css';

const gradients = [
  'linear-gradient(135deg, #2d7be7 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
  'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
] as const;

const TeacherCourses: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [search, setSearch] = useState('');

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const statusMatch =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
            ? course.isPublished
            : !course.isPublished;
      const searchMatch = course.name.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [filterStatus, search]);

  const stats = {
    total: mockCourses.length,
    active: mockCourses.filter((c) => c.isPublished).length,
    draft: mockCourses.filter((c) => !c.isPublished).length,
    students: mockCourses.reduce((sum, c) => sum + c.studentsEnrolled, 0),
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-courses-page">
        <header className="courses-header">
          <div className="head-left">
            <h1>📚 Giáo Trình của tôi</h1>
            <p>Quản lý và theo dõi tất cả Giáo Trình bạn đang giảng dạy</p>
          </div>
        </header>

        <section className="courses-stats">
          <article className="stat-box">
            <span className="stat-icon blue">📘</span>
            <div>
              <div className="stat-label">Tổng giáo trình</div>
              <strong>{stats.total}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon green">✅</span>
            <div>
              <div className="stat-label">Đang hoạt động</div>
              <strong>{stats.active}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon amber">📝</span>
            <div>
              <div className="stat-label">Bản nháp</div>
              <strong>{stats.draft}</strong>
            </div>
          </article>
          <article className="stat-box">
            <span className="stat-icon violet">👥</span>
            <div>
              <div className="stat-label">Học viên</div>
              <strong>{stats.students}</strong>
            </div>
          </article>
        </section>

        <section className="courses-toolbar">
          <div className="filter-tabs">
            <button
              className={filterStatus === 'all' ? 'active' : ''}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button
              className={filterStatus === 'active' ? 'active' : ''}
              onClick={() => setFilterStatus('active')}
            >
              Hoạt động ({stats.active})
            </button>
            <button
              className={filterStatus === 'draft' ? 'active' : ''}
              onClick={() => setFilterStatus('draft')}
            >
              Nháp ({stats.draft})
            </button>
          </div>

          <div className="toolbar-right">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm giáo trình..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="view-toggle" aria-label="Chế độ hiển thị">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <Grid2x2 size={16} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className={`courses-grid ${viewMode}`}>
          {filteredCourses.map((course, idx) => (
            <article key={course.id} className="course-card">
              <div
                className="course-cover"
                style={{ background: gradients[idx % gradients.length] }}
              >
                <span className="course-status">
                  {course.isPublished ? 'CÔNG KHAI' : 'BẢN NHÁP'}
                </span>
                <h3>{course.name}</h3>
              </div>

              <div className="course-body">
                <p className="course-desc">{course.description}</p>
                <div className="course-metrics">
                  <div>
                    <strong>{course.studentsEnrolled}</strong>
                    <span>Học viên</span>
                  </div>
                  <div>
                    <strong>{course.rating.toFixed(1)} ★</strong>
                    <span>Đánh giá</span>
                  </div>
                  <div>
                    <strong>{course.lessonsCount}</strong>
                    <span>Bài học</span>
                  </div>
                </div>

                <div className="course-progress">
                  <div className="progress-head">
                    <span>Tiến độ</span>
                    <span>{course.completionRate}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${course.completionRate}%` }} />
                  </div>
                </div>

                <div className="course-actions">
                  <button>Chỉnh sửa</button>
                  <button className="primary">Xem chi tiết</button>
                </div>
              </div>
            </article>
          ))}

          <article className="course-add-card">
            <div className="add-circle">+</div>
            <h3>Thêm giáo trình</h3>
            <p>Bắt đầu soạn thảo chương mới</p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
