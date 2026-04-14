import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  HourglassIcon,
  Paperclip,
  Plus,
  Save,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAssignments, mockTeacher } from '../../data/mockData';
import '../../styles/module-refactor.css';
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
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header ta-header-row">
            <div className="header-stack">
              <div className="header-kicker">Assignments</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Quản lý Bài Tập</h2>
                <span className="count-chip">{stats.total}</span>
              </div>
              <p className="header-sub">Tạo, phân công và chấm điểm bài tập cho học sinh</p>
            </div>
            <button className="btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Tạo bài tập mới
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <FileText size={18} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng bài tập</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <HourglassIcon size={18} />
              </div>
              <div>
                <h3>{stats.active}</h3>
                <p>Đang diễn ra</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <Clock size={18} />
              </div>
              <div>
                <h3>{stats.pending}</h3>
                <p>Chờ chấm điểm</p>
              </div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Trophy size={18} />
              </div>
              <div>
                <h3>{stats.avgCompletion}%</h3>
                <p>Tỷ lệ hoàn thành</p>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <div className="pill-group">
              <button
                className={`pill-btn${filterStatus === 'all' ? ' active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Tất cả ({stats.total})
              </button>
              <button
                className={`pill-btn${filterStatus === 'active' ? ' active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Đang diễn ra ({stats.active})
              </button>
              <button
                className={`pill-btn${filterStatus === 'completed' ? ' active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Đã kết thúc ({stats.total - stats.active})
              </button>
            </div>
          </div>

          {/* ── Assignments List ── */}
          <div className="ta-assignments-list">
            {filteredAssignments.map((assignment) => {
              const deadline = new Date(assignment.deadline);
              const isOverdue = deadline < new Date();
              const daysLeft = Math.ceil(
                (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const completionRate = Math.round((assignment.totalSubmissions / 30) * 100);

              return (
                <div
                  key={assignment.id}
                  className={`assignment-card${isOverdue ? ' is-overdue' : ''}`}
                >
                  <div className="assignment-header">
                    <div className="assignment-title-section">
                      <h3 className="assignment-title">{assignment.title}</h3>
                      <span className={`assignment-status ${isOverdue ? 'overdue' : 'active'}`}>
                        {isOverdue ? 'Đã kết thúc' : `Còn ${daysLeft} ngày`}
                      </span>
                    </div>
                    <div className="assignment-actions">
                      <button className="btn btn-outline btn-sm">
                        <BarChart3 size={14} /> Thống kê
                      </button>
                      <button className="btn btn-outline btn-sm">
                        <Edit3 size={14} /> Sửa
                      </button>
                      <button className="btn btn-primary btn-sm">
                        <Eye size={14} /> Xem chi tiết
                      </button>
                    </div>
                  </div>

                  <div className="assignment-info">
                    <div className="info-item">
                      <span className="info-icon">
                        <BookOpen size={14} />
                      </span>
                      <span className="info-text">{assignment.courseName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">
                        <Timer size={14} />
                      </span>
                      <span className="info-text">{assignment.duration} phút</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">
                        <Calendar size={14} />
                      </span>
                      <span className="info-text">Hạn: {deadline.toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">
                        <Trophy size={14} />
                      </span>
                      <span className="info-text">Tối đa: {assignment.maxScore} điểm</span>
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
                                  ? (assignment.gradedSubmissions / assignment.totalSubmissions) *
                                    100
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
                      <span className="alert-icon">
                        <AlertTriangle size={18} />
                      </span>
                      <span className="alert-text">
                        Còn {assignment.totalSubmissions - assignment.gradedSubmissions} bài chưa
                        chấm
                      </span>
                      <button className="btn btn-primary btn-sm">Chấm điểm ngay</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Create Modal ── */}
          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div
                className="modal-card"
                style={{ width: 'min(700px,100%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3>Tạo bài tập mới</h3>
                  </div>
                  <button className="icon-btn" onClick={() => setShowCreateModal(false)}>
                    <X size={16} />
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
                      <label>Giáo Trình *</label>
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
                        <Paperclip size={14} /> Chọn tệp
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <p
                      style={{
                        margin: '0 0 0.42rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--mod-slate-700)',
                      }}
                    >
                      Tùy chọn
                    </p>
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
                  <button className="btn secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button className="btn secondary">
                    <Save size={14} /> Lưu nháp
                  </button>
                  <button className="btn">
                    <CheckCircle2 size={14} /> Tạo và phân công
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAssignments;
