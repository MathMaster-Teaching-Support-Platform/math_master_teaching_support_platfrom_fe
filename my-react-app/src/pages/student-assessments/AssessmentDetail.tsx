import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useAssessmentDetails } from '../../hooks/useStudentAssessment';
import '../../styles/module-refactor.css';

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm',
  TEST: 'Kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập',
};

const statusBadgeClass: Record<string, string> = {
  UPCOMING: 'badge upcoming',
  IN_PROGRESS: 'badge in-progress',
  COMPLETED: 'badge completed',
};

const statusLabel: Record<string, string> = {
  UPCOMING: 'Sắp tới',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã hoàn thành',
};

function Layout({ children }: { readonly children: React.ReactNode }) {
  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">{children}</section>
      </div>
    </DashboardLayout>
  );
}

export default function AssessmentDetail() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAssessmentDetails(assessmentId ?? '');

  const assessment = data?.result;

  if (isLoading) {
    return (
      <Layout>
        <div className="page-spinner">
          <div className="spinner-ring" />
          <span>Đang tải thông tin bài kiểm tra...</span>
        </div>
      </Layout>
    );
  }

  if (isError || !assessment) {
    return (
      <Layout>
        <div className="empty">
          <AlertCircle size={32} style={{ opacity: 0.45, color: 'var(--mod-danger)' }} />
          <p>Không thể tải thông tin bài kiểm tra</p>
        </div>
      </Layout>
    );
  }

  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const attemptCount = assessment.attemptNumber || 0;

  return (
    <Layout>
      {/* Page header */}
      <header className="page-header">
        <div className="row" style={{ gap: '0.75rem' }}>
          <button className="btn secondary" onClick={() => navigate('/student/assessments')}>
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <div>
            <div className="row" style={{ gap: '0.55rem', flexWrap: 'wrap' }}>
              <h2>{assessment.title}</h2>
              <span className={statusBadgeClass[assessment.studentStatus] ?? 'badge'}>
                {statusLabel[assessment.studentStatus] ?? assessment.studentStatus}
              </span>
            </div>
            <span className="type-pill" style={{ marginTop: 6, display: 'inline-flex' }}>
              {assessmentTypeLabel[assessment.assessmentType] ?? assessment.assessmentType}
            </span>
          </div>
        </div>
      </header>

      {/* Info section */}
      <div className="detail-section">
        <p className="detail-section__title">Thông tin bài kiểm tra</p>

        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span className="detail-info-item__label">Số câu hỏi</span>
            <span className="detail-info-item__value">
              <FileText size={15} />
              {assessment.totalQuestions} câu
            </span>
          </div>

          {assessment.timeLimitMinutes && (
            <div className="detail-info-item">
              <span className="detail-info-item__label">Thời gian</span>
              <span className="detail-info-item__value">
                <Clock size={15} />
                {assessment.timeLimitMinutes} phút
              </span>
            </div>
          )}

          <div className="detail-info-item">
            <span className="detail-info-item__label">Tổng điểm</span>
            <span className="detail-info-item__value">{assessment.totalPoints} điểm</span>
          </div>

          {assessment.passingScore != null && (
            <div className="detail-info-item">
              <span className="detail-info-item__label">Điểm đạt</span>
              <span className="detail-info-item__value">
                <CheckCircle2 size={15} style={{ color: 'var(--mod-success)' }} />
                {assessment.passingScore} điểm
              </span>
            </div>
          )}

          {dueDate && (
            <div className="detail-info-item">
              <span className="detail-info-item__label">Hạn nộp</span>
              <span
                className="detail-info-item__value"
                style={{ color: isOverdue ? 'var(--mod-danger)' : undefined }}
              >
                <Clock size={15} />
                {dueDate.toLocaleString('vi-VN')}
                {isOverdue && ' · Quá hạn'}
              </span>
            </div>
          )}

          {assessment.allowMultipleAttempts && (
            <div className="detail-info-item">
              <span className="detail-info-item__label">Số lần làm</span>
              <span className="detail-info-item__value">
                <RefreshCw size={15} />
                {attemptCount}
                {assessment.maxAttempts ? ` / ${assessment.maxAttempts}` : ''} lần
              </span>
            </div>
          )}
        </div>

        {assessment.description && (
          <div className="detail-info-item">
            <span className="detail-info-item__label">Hướng dẫn</span>
            <p className="detail-description">{assessment.description}</p>
          </div>
        )}
      </div>

      {/* Warning */}
      {!assessment.canStart && assessment.cannotStartReason && (
        <div className="warning-banner">
          <AlertCircle size={18} style={{ color: '#92660a', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="warning-banner__title">Không thể bắt đầu</p>
            <p className="warning-banner__body">{assessment.cannotStartReason}</p>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button
          className="btn"
          disabled={!assessment.canStart}
          onClick={() => navigate(`/student/assessments/${assessmentId}/take`)}
          style={{ minWidth: 180 }}
        >
          <Play size={14} />
          {attemptCount > 0 ? 'Làm lại' : 'Bắt đầu làm bài'}
        </button>
      </div>
    </Layout>
  );
}
