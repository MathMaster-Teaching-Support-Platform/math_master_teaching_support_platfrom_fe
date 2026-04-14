import { AlertTriangle, BarChart2, CheckCircle, Search, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import '../../styles/module-refactor.css';
import './TeacherStudents.css';

interface Student {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  courses: string[];
  avgScore: number;
  attendance: number;
  assignments: { completed: number; total: number };
  lastActive: string;
  status: 'active' | 'inactive' | 'warning';
}

const TeacherStudents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const allStudents: Student[] = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      avatar: '👨‍🎓',
      courses: ['Toán 11', 'Toán 12'],
      avgScore: 8.5,
      attendance: 95,
      assignments: { completed: 18, total: 20 },
      lastActive: '2 giờ trước',
      status: 'active',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@email.com',
      avatar: '👩‍🎓',
      courses: ['Toán 11'],
      avgScore: 9.2,
      attendance: 98,
      assignments: { completed: 20, total: 20 },
      lastActive: '1 giờ trước',
      status: 'active',
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@email.com',
      avatar: '👨‍🎓',
      courses: ['Toán 12'],
      avgScore: 7.8,
      attendance: 85,
      assignments: { completed: 15, total: 20 },
      lastActive: '5 giờ trước',
      status: 'active',
    },
    {
      id: 4,
      name: 'Phạm Thị D',
      email: 'phamthid@email.com',
      avatar: '👩‍🎓',
      courses: ['Toán 11', 'Toán 12'],
      avgScore: 6.5,
      attendance: 72,
      assignments: { completed: 12, total: 20 },
      lastActive: '2 ngày trước',
      status: 'warning',
    },
    {
      id: 5,
      name: 'Hoàng Văn E',
      email: 'hoangvane@email.com',
      avatar: '👨‍🎓',
      courses: ['Toán 11'],
      avgScore: 8.9,
      attendance: 92,
      assignments: { completed: 19, total: 20 },
      lastActive: '30 phút trước',
      status: 'active',
    },
    {
      id: 6,
      name: 'Đỗ Thị F',
      email: 'dothif@email.com',
      avatar: '👩‍🎓',
      courses: ['Toán 12'],
      avgScore: 5.5,
      attendance: 65,
      assignments: { completed: 10, total: 20 },
      lastActive: '1 tuần trước',
      status: 'warning',
    },
    {
      id: 7,
      name: 'Vũ Văn G',
      email: 'vuvang@email.com',
      avatar: '👨‍🎓',
      courses: ['Toán 11'],
      avgScore: 9.5,
      attendance: 100,
      assignments: { completed: 20, total: 20 },
      lastActive: '15 phút trước',
      status: 'active',
    },
    {
      id: 8,
      name: 'Bùi Thị H',
      email: 'buithih@email.com',
      avatar: '👩‍🎓',
      courses: ['Toán 12'],
      avgScore: 7.2,
      attendance: 88,
      assignments: { completed: 16, total: 20 },
      lastActive: '3 giờ trước',
      status: 'active',
    },
  ];

  const filteredStudents = allStudents.filter((student) => {
    const matchSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCourse = courseFilter === 'all' || student.courses.includes(courseFilter);
    const matchStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchSearch && matchCourse && matchStatus;
  });

  const stats = {
    total: allStudents.length,
    active: allStudents.filter((s) => s.status === 'active').length,
    warning: allStudents.filter((s) => s.status === 'warning').length,
    avgScore: (allStudents.reduce((sum, s) => sum + s.avgScore, 0) / allStudents.length).toFixed(1),
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={3}
    >
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header ts-header-row">
            <div className="header-stack">
              <div className="header-kicker">Students</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Quản Lý Học Sinh</h2>
                <span className="count-chip">{stats.total}</span>
              </div>
              <p className="header-sub">Theo dõi tiến độ và hỗ trợ học sinh</p>
            </div>
            <div className="header-actions">
              <button className="btn secondary">Xuất báo cáo</button>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Users size={18} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng học sinh</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3>{stats.active}</h3>
                <p>Đang hoạt động</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3>{stats.warning}</h3>
                <p>Cần chú ý</p>
              </div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <BarChart2 size={18} />
              </div>
              <div>
                <h3>{stats.avgScore}</h3>
                <p>Điểm TB chung</p>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <span className="search-box" style={{ flex: '1 1 240px' }}>
              <Search size={15} className="search-box__icon" />
              <input
                className="input"
                placeholder="Tìm kiếm học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-box__clear" onClick={() => setSearchTerm('')}>
                  <X size={13} />
                </button>
              )}
            </span>
            <div className="pill-group">
              <button
                className={`pill-btn${statusFilter === 'all' ? ' active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`pill-btn${statusFilter === 'active' ? ' active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Hoạt động
              </button>
              <button
                className={`pill-btn${statusFilter === 'warning' ? ' active' : ''}`}
                onClick={() => setStatusFilter('warning')}
              >
                Cần chú ý
              </button>
            </div>
            <select
              className="sort-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="all">Tất cả Giáo Trình</option>
              <option value="Toán 11">Toán 11</option>
              <option value="Toán 12">Toán 12</option>
            </select>
          </div>

          {/* ── Students Grid ── */}
          <div className="students-grid">
            {filteredStudents.map((student) => (
              <div key={student.id} className={`student-card status-${student.status}`}>
                {student.status === 'warning' && <div className="warning-badge">⚠️ Cần chú ý</div>}

                <div className="student-avatar-large">
                  {student.avatar || student.name.charAt(0)}
                </div>

                <h3 className="student-name">{student.name}</h3>
                <p className="student-email">{student.email}</p>

                <div className="student-courses">
                  {student.courses.map((course, idx) => (
                    <span key={idx} className="course-tag">
                      {course}
                    </span>
                  ))}
                </div>

                <div className="student-metrics">
                  <div className="metric">
                    <div className="metric-label">Điểm TB</div>
                    <div
                      className={`metric-value ${student.avgScore >= 8 ? 'good' : student.avgScore >= 6.5 ? 'normal' : 'warning'}`}
                    >
                      {student.avgScore}
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Điểm danh</div>
                    <div
                      className={`metric-value ${student.attendance >= 90 ? 'good' : student.attendance >= 75 ? 'normal' : 'warning'}`}
                    >
                      {student.attendance}%
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Bài tập</div>
                    <div className="metric-value">
                      {student.assignments.completed}/{student.assignments.total}
                    </div>
                  </div>
                </div>

                <div className="student-progress">
                  <div className="progress-label">Tiến độ hoàn thành</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(student.assignments.completed / student.assignments.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="student-footer">
                  <span className="last-active">⏱️ {student.lastActive}</span>
                </div>

                <div className="student-actions">
                  <button className="action-btn" onClick={() => setSelectedStudent(student)}>
                    👁️ Xem chi tiết
                  </button>
                  <button className="action-btn" onClick={() => setShowMessageModal(true)}>
                    💬 Nhắn tin
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Student Detail Modal */}
          {selectedStudent && (
            <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
              <div className="modal large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Chi tiết học sinh</h2>
                  <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-header">
                    <div className="detail-avatar">
                      {selectedStudent.avatar || selectedStudent.name.charAt(0)}
                    </div>
                    <div className="detail-info">
                      <h3>{selectedStudent.name}</h3>
                      <p>{selectedStudent.email}</p>
                      <div className="detail-courses">
                        {selectedStudent.courses.map((course, idx) => (
                          <span key={idx} className="course-tag">
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="detail-stats-grid">
                    <div className="detail-stat">
                      <div className="stat-label">Điểm trung bình</div>
                      <div className="stat-value">{selectedStudent.avgScore}/10</div>
                    </div>
                    <div className="detail-stat">
                      <div className="stat-label">Tỷ lệ điểm danh</div>
                      <div className="stat-value">{selectedStudent.attendance}%</div>
                    </div>
                    <div className="detail-stat">
                      <div className="stat-label">Bài tập hoàn thành</div>
                      <div className="stat-value">
                        {selectedStudent.assignments.completed}/{selectedStudent.assignments.total}
                      </div>
                    </div>
                    <div className="detail-stat">
                      <div className="stat-label">Hoạt động gần đây</div>
                      <div className="stat-value">{selectedStudent.lastActive}</div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Hoạt động gần đây</h4>
                    <div className="activity-list">
                      <div className="activity-item">
                        <span className="activity-icon">📝</span>
                        <div className="activity-content">
                          <div className="activity-title">Nộp bài tập "Phương trình bậc 2"</div>
                          <div className="activity-time">2 giờ trước</div>
                        </div>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">📊</span>
                        <div className="activity-content">
                          <div className="activity-title">Nhận điểm 9.5 cho bài kiểm tra</div>
                          <div className="activity-time">1 ngày trước</div>
                        </div>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">📚</span>
                        <div className="activity-content">
                          <div className="activity-title">Hoàn thành bài học "Đạo hàm"</div>
                          <div className="activity-time">2 ngày trước</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-actions">
                    <button className="btn btn-outline">📧 Gửi email</button>
                    <button className="btn btn-outline">📊 Xem báo cáo</button>
                    <button className="btn btn-outline">✏️ Chỉnh sửa</button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => setSelectedStudent(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Modal */}
          {showMessageModal && (
            <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">💬 Gửi tin nhắn</h2>
                  <button className="modal-close" onClick={() => setShowMessageModal(false)}>
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>Người nhận</label>
                    <input type="text" value="Học sinh đã chọn" disabled />
                  </div>

                  <div className="form-group">
                    <label>Tiêu đề</label>
                    <input type="text" placeholder="Nhập tiêu đề tin nhắn" />
                  </div>

                  <div className="form-group">
                    <label>Nội dung</label>
                    <textarea rows={6} placeholder="Nhập nội dung tin nhắn..."></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setShowMessageModal(false)}>
                    Hủy
                  </button>
                  <button className="btn btn-primary">📤 Gửi tin nhắn</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherStudents;
