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
        <div className="skeleton-detail">
          {/* Header skeleton */}
          <div className="skeleton-detail-header">
            <div className="skeleton-line sk-xs" />
            <div className="skeleton-line sk-xl" />
            <div className="skeleton-line sk-lg" />
          </div>

          {/* Info grid skeleton */}
          <div className="skeleton-section">
            <div className="skeleton-line sk-xs" style={{ width: '30%', height: 12 }} />
            <div className="skeleton-grid">
              {(['q', 't', 'p', 's', 'd', 'a'] as const).map((k) => (
                <div key={k} className="skeleton-info-item">
                  <div className="skeleton-line sk-sm" style={{ height: 11 }} />
                  <div className="skeleton-line sk-md" style={{ height: 16 }} />
                </div>
              ))}
            </div>
            <div className="skeleton-block" />
          </div>

          {/* Action skeleton */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div className="skeleton-line" style={{ width: 160, height: 38, borderRadius: 10 }} />
          </div>
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
      <header className="detail-hero">
        <div className="detail-hero__topbar">
          <button className="detail-hero__back" onClick={() => navigate('/student/assessments')}>
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <div className="detail-hero__badges">
            <span className={statusBadgeClass[assessment.studentStatus] ?? 'badge'}>
              {statusLabel[assessment.studentStatus] ?? assessment.studentStatus}
            </span>
            <span className="type-pill">
              {assessmentTypeLabel[assessment.assessmentType] ?? assessment.assessmentType}
            </span>
          </div>
        </div>
        <h1 className="detail-hero__title">{assessment.title}</h1>
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

      {/* Warning — only shown when cannot start so action bar still shows the reason */}
      {!assessment.canStart && assessment.cannotStartReason && (
        <div className="warning-banner">
          <AlertCircle size={18} style={{ color: '#92660a', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="warning-banner__title">Không thể bắt đầu</p>
            <p className="warning-banner__body">{assessment.cannotStartReason}</p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="detail-action-bar">
        <div className="detail-action-bar__text">
          <p className="detail-action-bar__hint">Bạn đã sẵn sàng?</p>
          <p className="detail-action-bar__sub">
            {assessment.canStart
              ? 'Đảm bảo kết nối ổn định trước khi bắt đầu làm bài.'
              : (assessment.cannotStartReason ?? 'Bài kiểm tra này chưa thể bắt đầu.')}
          </p>
        </div>
        <button
          className="btn btn--cta"
          disabled={!assessment.canStart}
          onClick={() => navigate(`/student/assessments/${assessmentId}/take`)}
        >
          <Play size={15} />
          {attemptCount > 0 ? 'Làm lại bài' : 'Bắt đầu làm bài'}
        </button>
      </div>
    </Layout>
  );
}
