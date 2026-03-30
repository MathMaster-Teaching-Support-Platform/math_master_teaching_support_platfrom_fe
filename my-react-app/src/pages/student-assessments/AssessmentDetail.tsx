import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, AlertCircle, Play } from 'lucide-react';
import { useAssessmentDetails } from '../../hooks/useStudentAssessment';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import '../../styles/module-refactor.css';

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm nhanh',
  TEST: 'Bài kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập về nhà',
};

export default function AssessmentDetail() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAssessmentDetails(assessmentId || '');

  const assessment = data?.result;

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Đang tải thông tin bài kiểm tra...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !assessment) {
    return (
      <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
        <div className="module-layout-container">
          <div className="empty">Không thể tải thông tin bài kiểm tra</div>
        </div>
      </DashboardLayout>
    );
  }

  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  return (
    <DashboardLayout role="student" user={{ name: 'Student', avatar: '', role: 'student' }} notificationCount={0}>
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <button className="btn secondary" onClick={() => navigate('/student/assessments')}>
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2 style={{ marginTop: 12 }}>{assessment.title}</h2>
              <p className="muted">
                {assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}
              </p>
            </div>
          </header>

          {/* Assessment Info Card */}
          <div
            style={{
              padding: 24,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Thông tin bài kiểm tra</h3>

            {assessment.description && (
              <div style={{ marginBottom: 16 }}>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                  Hướng dẫn:
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{assessment.description}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                  Số câu hỏi
                </p>
                <div className="row" style={{ gap: 8 }}>
                  <FileText size={16} />
                  <span style={{ fontWeight: 600 }}>{assessment.totalQuestions} câu</span>
                </div>
              </div>

              {assessment.timeLimitMinutes && (
                <div>
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                    Thời gian làm bài
                  </p>
                  <div className="row" style={{ gap: 8 }}>
                    <Clock size={16} />
                    <span style={{ fontWeight: 600 }}>{assessment.timeLimitMinutes} phút</span>
                  </div>
                </div>
              )}

              <div>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                  Tổng điểm
                </p>
                <span style={{ fontWeight: 600 }}>{assessment.totalPoints} điểm</span>
              </div>

              {assessment.passingScore && (
                <div>
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                    Điểm đạt
                  </p>
                  <span style={{ fontWeight: 600 }}>{assessment.passingScore} điểm</span>
                </div>
              )}
            </div>

            {dueDate && (
              <div style={{ marginTop: 16 }}>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                  Hạn nộp
                </p>
                <span style={{ color: isOverdue ? 'var(--danger-color)' : 'inherit', fontWeight: 600 }}>
                  {dueDate.toLocaleString('vi-VN')}
                  {isOverdue && ' (Đã quá hạn)'}
                </span>
              </div>
            )}
          </div>

          {/* Attempt History */}
          {assessment.allowMultipleAttempts && (assessment.attemptNumber || 0) > 0 && (
            <div
              style={{
                padding: 24,
                backgroundColor: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <h3 style={{ marginBottom: 16 }}>Lịch sử làm bài</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                    Số lần đã làm
                  </p>
                  <span style={{ fontWeight: 600 }}>
                    {assessment.attemptNumber || 0}
                    {assessment.maxAttempts ? ` / ${assessment.maxAttempts}` : ''}
                  </span>
                </div>
              </div>
              
              <p className="muted" style={{ marginTop: 16, fontSize: '0.875rem' }}>
                Xem chi tiết điểm số trong phần kết quả sau khi hoàn thành bài kiểm tra
              </p>
            </div>
          )}

          {/* Cannot Start Warning */}
          {!assessment.canStart && assessment.cannotStartReason && (
            <div
              style={{
                padding: 16,
                backgroundColor: 'var(--warning-color-light)',
                border: '1px solid var(--warning-color)',
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <div className="row" style={{ gap: 8 }}>
                <AlertCircle size={20} style={{ color: 'var(--warning-color)' }} />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Không thể bắt đầu</p>
                  <p className="muted" style={{ fontSize: '0.875rem' }}>
                    {assessment.cannotStartReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn"
              disabled={!assessment.canStart}
              onClick={() => navigate(`/student/assessments/${assessmentId}/take`)}
              style={{ minWidth: 200 }}
            >
              <Play size={14} />
              {(assessment.attemptNumber || 0) > 0 ? 'Làm lại' : 'Bắt đầu làm bài'}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
