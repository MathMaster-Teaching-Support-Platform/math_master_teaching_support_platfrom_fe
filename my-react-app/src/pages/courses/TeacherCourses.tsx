import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockCourses } from '../../data/mockData';
import './TeacherCourses.css';

const TeacherCourses: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');

  const filteredCourses = mockCourses.filter((course) => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? course.isPublished : !course.isPublished;
  });

  const courseStats = {
    total: mockCourses.length,
    active: mockCourses.filter((c) => c.isPublished).length,
    draft: mockCourses.filter((c) => !c.isPublished).length,
    totalStudents: mockCourses.reduce((sum, c) => sum + c.studentsEnrolled, 0),
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-courses-page">
        {/* Header */}
        <div className="courses-header">
          <div>
            <h1 className="page-title">📚 Khóa học của tôi</h1>
            <p className="page-subtitle">Quản lý và theo dõi tất cả khóa học bạn đang giảng dạy</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>➕</span> Tạo khóa học mới
          </button>
        </div>

        {/* Stats Cards */}
        <div className="courses-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              📚
            </div>
            <div className="stat-content">
              <div className="stat-value">{courseStats.total}</div>
              <div className="stat-label">Tổng khóa học</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              ✅
            </div>
            <div className="stat-content">
              <div className="stat-value">{courseStats.active}</div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              📝
            </div>
            <div className="stat-content">
              <div className="stat-value">{courseStats.draft}</div>
              <div className="stat-label">Bản nháp</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              👥
            </div>
            <div className="stat-content">
              <div className="stat-value">{courseStats.totalStudents}</div>
              <div className="stat-label">Học viên</div>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="courses-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({courseStats.total})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Hoạt động ({courseStats.active})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'draft' ? 'active' : ''}`}
              onClick={() => setFilterStatus('draft')}
            >
              Nháp ({courseStats.draft})
            </button>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              🔲 Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
          </div>
        </div>

        {/* Courses Grid/List */}
        <div className={`courses-container ${viewMode}`}>
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-image">
                <img src={course.thumbnail} alt={course.name} />
                <div className="course-badge">
                  {course.isPublished ? (
                    <span className="badge badge-success">✅ Công khai</span>
                  ) : (
                    <span className="badge badge-warning">📝 Nháp</span>
                  )}
                </div>
              </div>

              <div className="course-content">
                <h3 className="course-title">{course.name}</h3>
                <p className="course-description">{course.description}</p>

                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span className="meta-text">{course.studentsEnrolled} học viên</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⭐</span>
                    <span className="meta-text">{course.rating.toFixed(1)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📚</span>
                    <span className="meta-text">{course.lessonsCount} bài học</span>
                  </div>
                </div>

                <div className="course-progress">
                  <div className="progress-label">
                    <span>Tiến độ hoàn thành</span>
                    <span className="progress-percent">{course.completionRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="course-actions">
                  <button className="btn btn-outline btn-sm">📊 Thống kê</button>
                  <button className="btn btn-outline btn-sm">✏️ Chỉnh sửa</button>
                  <button className="btn btn-primary btn-sm">👁️ Xem chi tiết</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Tạo khóa học mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Tên khóa học *</label>
                  <input type="text" placeholder="Ví dụ: Đại số 10 - Nâng cao" />
                </div>

                <div className="form-group">
                  <label>Mô tả ngắn *</label>
                  <textarea rows={3} placeholder="Mô tả ngắn gọn về khóa học..."></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cấp độ *</label>
                    <select>
                      <option>Cơ bản</option>
                      <option>Trung bình</option>
                      <option>Nâng cao</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Lớp *</label>
                    <select>
                      <option>Lớp 10</option>
                      <option>Lớp 11</option>
                      <option>Lớp 12</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ảnh đại diện</label>
                  <div className="file-upload">
                    <input type="file" accept="image/*" id="thumbnail" />
                    <label htmlFor="thumbnail" className="file-upload-label">
                      📁 Chọn ảnh
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Xuất bản ngay sau khi tạo</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Tạo khóa học</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
