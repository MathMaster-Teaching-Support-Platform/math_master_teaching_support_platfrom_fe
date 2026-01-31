import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockAssignments } from '../../data/mockData';
import './TeacherAssignments.css';

const TeacherAssignments: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredAssignments = mockAssignments.filter((assignment) => {
    if (filterStatus === 'all') return true;
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    return filterStatus === 'active' ? deadline > now : deadline <= now;
  });

  const stats = {
    total: mockAssignments.length,
    active: mockAssignments.filter((a) => new Date(a.deadline) > new Date()).length,
    pending: mockAssignments.reduce(
      (sum, a) => sum + (a.totalSubmissions - a.gradedSubmissions),
      0
    ),
    avgCompletion: Math.round(
      mockAssignments.reduce((sum, a) => sum + (a.totalSubmissions / 30) * 100, 0) /
        mockAssignments.length
    ),
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-assignments-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📝 Quản lý Bài Tập</h1>
            <p className="page-subtitle">Tạo, phân công và chấm điểm bài tập cho học sinh</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>➕</span> Tạo bài tập mới
          </button>
        </div>

        {/* Stats */}
        <div className="assignments-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              📝
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng bài tập</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              ⏳
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Đang diễn ra</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              ⏰
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Chờ chấm điểm</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              📊
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.avgCompletion}%</div>
              <div className="stat-label">Tỷ lệ hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="assignments-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Đang diễn ra ({stats.active})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Đã kết thúc ({stats.total - stats.active})
            </button>
          </div>

          <div className="toolbar-actions">
            <input type="text" placeholder="🔍 Tìm kiếm bài tập..." className="search-input" />
            <select className="sort-select">
              <option>Mới nhất</option>
              <option>Deadline gần</option>
              <option>Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Assignments List */}
        <div className="assignments-list">
          {filteredAssignments.map((assignment) => {
            const deadline = new Date(assignment.deadline);
            const isOverdue = deadline < new Date();
            const daysLeft = Math.ceil(
              (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const completionRate = Math.round((assignment.totalSubmissions / 30) * 100);

            return (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-title-section">
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <span className={`assignment-status ${isOverdue ? 'overdue' : 'active'}`}>
                      {isOverdue ? '⏰ Đã kết thúc' : `⏳ Còn ${daysLeft} ngày`}
                    </span>
                  </div>
                  <div className="assignment-actions">
                    <button className="btn btn-outline btn-sm">📊 Thống kê</button>
                    <button className="btn btn-outline btn-sm">✏️ Sửa</button>
                    <button className="btn btn-primary btn-sm">👁️ Xem chi tiết</button>
                  </div>
                </div>

                <div className="assignment-info">
                  <div className="info-item">
                    <span className="info-icon">📚</span>
                    <span className="info-text">{assignment.courseName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span className="info-text">{assignment.duration} phút</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">Hạn: {deadline.toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">💯</span>
                    <span className="info-text">Điểm tối đa: {assignment.maxScore}</span>
                  </div>
                </div>

                <div className="assignment-progress">
                  <div className="progress-header">
                    <span className="progress-label">
                      <strong>Nộp bài:</strong> {assignment.totalSubmissions}/30 học sinh
                    </span>
                    <span className="progress-label">
                      <strong>Đã chấm:</strong> {assignment.gradedSubmissions}/
                      {assignment.totalSubmissions}
                    </span>
                  </div>
                  <div className="progress-bars">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar">
                        <div
                          className="progress-fill completion"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <span className="progress-percent">{completionRate}%</span>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar">
                        <div
                          className="progress-fill graded"
                          style={{
                            width: `${
                              assignment.totalSubmissions
                                ? (assignment.gradedSubmissions / assignment.totalSubmissions) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-percent">
                        {assignment.totalSubmissions
                          ? Math.round(
                              (assignment.gradedSubmissions / assignment.totalSubmissions) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {assignment.gradedSubmissions < assignment.totalSubmissions && (
                  <div className="assignment-alert">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">
                      Còn {assignment.totalSubmissions - assignment.gradedSubmissions} bài chưa chấm
                    </span>
                    <button className="btn btn-primary btn-sm">Chấm điểm ngay</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Tạo bài tập mới</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề bài tập *</label>
                  <input type="text" placeholder="Ví dụ: Bài tập về Phương trình bậc 2" />
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea rows={3} placeholder="Mô tả ngắn gọn về bài tập..."></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Khóa học *</label>
                    <select>
                      <option>Toán 10 - Nâng cao</option>
                      <option>Đại số 11</option>
                      <option>Giải tích 12</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Loại bài tập *</label>
                    <select>
                      <option>Trắc nghiệm</option>
                      <option>Tự luận</option>
                      <option>Hỗn hợp</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Thời gian làm bài (phút) *</label>
                    <input type="number" defaultValue={45} min={5} />
                  </div>
                  <div className="form-group">
                    <label>Điểm tối đa *</label>
                    <input type="number" defaultValue={10} min={1} max={100} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input type="datetime-local" />
                  </div>
                  <div className="form-group">
                    <label>Hạn nộp *</label>
                    <input type="datetime-local" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tệp đính kèm</label>
                  <div className="file-upload">
                    <input type="file" id="assignment-file" />
                    <label htmlFor="assignment-file" className="file-upload-label">
                      📎 Chọn tệp
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Cho phép nộp muộn</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Tự động chấm điểm (trắc nghiệm)</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Gửi thông báo cho học sinh</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-outline">💾 Lưu nháp</button>
                <button className="btn btn-primary">✅ Tạo và phân công</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherAssignments;
