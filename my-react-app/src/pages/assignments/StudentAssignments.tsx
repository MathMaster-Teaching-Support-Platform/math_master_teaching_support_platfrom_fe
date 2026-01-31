import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockAssignments } from '../../data/mockData';
import './StudentAssignments.css';

// Fixed timestamp for consistent data generation
const FIXED_TIMESTAMP = 1738713600000; // Feb 5, 2026

const StudentAssignments: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const studentAssignments = useMemo(() => {
    return mockAssignments.map((assignment, index) => {
      const seed = index * 7 + 42;
      const isSubmitted = seed % 3 !== 0;
      const hasScore = seed % 2 === 0;
      return {
        ...assignment,
        status: isSubmitted ? 'submitted' : 'pending',
        score: hasScore ? 70 + (seed % 30) : null,
        submittedAt: isSubmitted
          ? new Date(FIXED_TIMESTAMP - (seed % 3) * 24 * 60 * 60 * 1000).toISOString()
          : null,
      };
    });
  }, []);

  const filteredAssignments = studentAssignments.filter((assignment) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return assignment.status === 'pending';
    return assignment.status === 'submitted';
  });

  const stats = {
    total: studentAssignments.length,
    pending: studentAssignments.filter((a) => a.status === 'pending').length,
    completed: studentAssignments.filter((a) => a.status === 'submitted').length,
    avgScore: Math.round(
      studentAssignments
        .filter((a) => a.score !== null)
        .reduce((sum, a) => sum + (a.score || 0), 0) /
        studentAssignments.filter((a) => a.score !== null).length
    ),
  };

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={3}
    >
      <div className="student-assignments-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📝 Bài Tập Của Tôi</h1>
            <p className="page-subtitle">Quản lý và hoàn thành các bài tập được giao</p>
          </div>
        </div>

        {/* Stats */}
        <div className="assignments-stats">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              📚
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng bài tập</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
            >
              ⏳
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Chưa nộp</div>
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
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              💯
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.avgScore}</div>
              <div className="stat-label">Điểm trung bình</div>
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
              className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Chưa nộp ({stats.pending})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Đã nộp ({stats.completed})
            </button>
          </div>

          <input type="text" placeholder="🔍 Tìm kiếm bài tập..." className="search-input" />
        </div>

        {/* Assignments List */}
        <div className="assignments-list">
          {filteredAssignments.map((assignment) => {
            const deadline = new Date(assignment.dueDate);
            const isOverdue = deadline < new Date() && assignment.status === 'pending';
            const daysLeft = Math.ceil(
              (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={assignment.id} className={`assignment-card ${isOverdue ? 'overdue' : ''}`}>
                <div className="assignment-main">
                  <div className="assignment-header">
                    <div className="header-left">
                      <h3 className="assignment-title">{assignment.title}</h3>
                      <span className="assignment-course">📚 {assignment.courseName}</span>
                    </div>
                    <div className="header-right">
                      {assignment.status === 'pending' ? (
                        <span className={`status-badge ${isOverdue ? 'overdue' : 'pending'}`}>
                          {isOverdue ? '⚠️ Quá hạn' : `⏳ Còn ${daysLeft} ngày`}
                        </span>
                      ) : (
                        <span className="status-badge submitted">✅ Đã nộp</span>
                      )}
                    </div>
                  </div>

                  <div className="assignment-info">
                    <div className="info-item">
                      <span className="info-icon">📅</span>
                      <span className="info-text">
                        Hạn nộp: {deadline.toLocaleDateString('vi-VN')}{' '}
                        {deadline.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">⏱️</span>
                      <span className="info-text">{assignment.timeLimit} phút</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">💯</span>
                      <span className="info-text">Điểm tối đa: 100</span>
                    </div>
                  </div>

                  {assignment.status === 'submitted' && (
                    <div className="submission-info">
                      <div className="submission-detail">
                        <span className="detail-label">Ngày nộp:</span>
                        <span className="detail-value">
                          {assignment.submittedAt
                            ? new Date(assignment.submittedAt).toLocaleString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>
                      {assignment.score !== null && (
                        <div className="submission-detail">
                          <span className="detail-label">Điểm:</span>
                          <span
                            className={`detail-value score ${assignment.score >= 80 ? 'high' : assignment.score >= 50 ? 'medium' : 'low'}`}
                          >
                            {assignment.score}/100
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="assignment-actions">
                    {assignment.status === 'pending' ? (
                      <>
                        <button className="btn btn-outline btn-sm">📄 Xem đề</button>
                        <button className="btn btn-primary btn-sm">✍️ Làm bài</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline btn-sm">📄 Xem đề</button>
                        <button className="btn btn-outline btn-sm">👁️ Xem bài làm</button>
                        {assignment.score !== null && (
                          <button className="btn btn-outline btn-sm">💬 Phản hồi</button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isOverdue && (
                  <div className="overdue-warning">
                    <span className="warning-icon">⚠️</span>
                    <span className="warning-text">
                      Bài tập đã quá hạn. Liên hệ giảng viên để được gia hạn.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;
