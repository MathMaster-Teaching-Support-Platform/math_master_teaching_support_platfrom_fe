import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, LineChart, RefreshCw, Search, User } from 'lucide-react';
import { useGradingQueue } from '../../hooks/useGrading';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import type { GradingSubmissionResponse } from '../../types/grading.types';
import '../../styles/module-refactor.css';

const statusFilters = ['ALL', 'SUBMITTED', 'GRADED'] as const;
type StatusFilter = typeof statusFilters[number];

const statusLabel: Record<StatusFilter, string> = {
  ALL: 'Tất cả',
  SUBMITTED: 'Chờ chấm',
  GRADED: 'Đã chấm',
};

const statusClass: Record<string, string> = {
  SUBMITTED: 'badge published',
  GRADED: 'badge closed',
  IN_PROGRESS: 'badge draft',
};

export default function GradingQueue() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('SUBMITTED');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useGradingQueue({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size: 20,
  });

  const submissions = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.studentEmail.toLowerCase().includes(q) ||
        item.assessmentTitle.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <h2>Hàng đợi chấm bài</h2>
              <p>Chấm điểm và đánh giá bài làm của học sinh.</p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button 
                className="btn secondary" 
                onClick={() => navigate('/teacher/grading/analytics')}
              >
                <LineChart size={14} />
                Phân tích
              </button>
              <button 
                className="btn secondary" 
                onClick={() => navigate('/teacher/grading/regrade-requests')}
              >
                <RefreshCw size={14} />
                Yêu cầu chấm lại
              </button>
            </div>
          </header>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm theo tên học sinh hoặc bài kiểm tra"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn ${statusFilter === item ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(item);
                    setPage(0);
                  }}
                >
                  {statusLabel[item]}
                </button>
              ))}
            </div>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && <div className="empty">Đang tải danh sách bài nộp...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách bài nộp'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Chưa có bài nộp nào.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((submission) => (
                <SubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                  onGrade={() => navigate(`/teacher/grading/${submission.submissionId}`)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function SubmissionCard({
  submission,
  onGrade,
}: {
  submission: GradingSubmissionResponse;
  onGrade: () => void;
}) {
  const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : null;

  return (
    <article className="data-card">
      <div className="row">
        <span className={statusClass[submission.status]}>
          {submission.status === 'SUBMITTED' ? 'Chờ chấm' : 'Đã chấm'}
        </span>
        {submission.attemptNumber && (
          <span className="muted">Lần {submission.attemptNumber}</span>
        )}
      </div>

      <div>
        <h3>{submission.assessmentTitle}</h3>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <User size={14} className="muted" />
          <span>{submission.studentName}</span>
        </div>
        <p className="muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          {submission.studentEmail}
        </p>
      </div>

      <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap', gap: 12 }}>
        {submission.pendingQuestionsCount > 0 && (
          <div className="row" style={{ gap: 4 }}>
            <FileText size={14} style={{ color: 'var(--warning-color)' }} />
            <span style={{ color: 'var(--warning-color)' }}>
              {submission.pendingQuestionsCount} câu chờ chấm
            </span>
          </div>
        )}
        {submission.autoGradedQuestionsCount > 0 && (
          <div className="row" style={{ gap: 4 }}>
            <FileText size={14} className="muted" />
            <span className="muted">
              {submission.autoGradedQuestionsCount} câu tự động
            </span>
          </div>
        )}
      </div>

      {submission.score !== undefined && (
        <div>
          <p>
            Điểm: {submission.finalScore?.toFixed(1) || submission.score.toFixed(1)} / {submission.maxScore}
            {submission.percentage && ` (${submission.percentage.toFixed(1)}%)`}
          </p>
        </div>
      )}

      {submittedDate && (
        <div className="row" style={{ justifyContent: 'start' }}>
          <Clock size={14} className="muted" />
          <span className="muted" style={{ fontSize: '0.875rem' }}>
            Nộp lúc: {submittedDate.toLocaleString('vi-VN')}
          </span>
        </div>
      )}

      {submission.timeSpentSeconds && (
        <div className="row" style={{ justifyContent: 'start' }}>
          <Clock size={14} className="muted" />
          <span className="muted" style={{ fontSize: '0.875rem' }}>
            Thời gian làm: {Math.floor(submission.timeSpentSeconds / 60)} phút
          </span>
        </div>
      )}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={onGrade}>
          {submission.status === 'SUBMITTED' ? 'Chấm bài' : 'Xem chi tiết'}
        </button>
      </div>
    </article>
  );
}
