import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, FileText, RefreshCw, Search } from 'lucide-react';
import { useMyAssessments } from '../../hooks/useStudentAssessment';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import type { StudentAssessmentResponse } from '../../types/studentAssessment.types';
import '../../styles/module-refactor.css';

const statusFilters = ['ALL', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED'] as const;
type StatusFilter = typeof statusFilters[number];

const statusLabel: Record<StatusFilter, string> = {
  ALL: 'Tất cả',
  UPCOMING: 'Sắp tới',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã hoàn thành',
};

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm nhanh',
  TEST: 'Bài kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập về nhà',
};

const statusClass: Record<string, string> = {
  UPCOMING: 'badge',
  IN_PROGRESS: 'badge published',
  COMPLETED: 'badge closed',
};

export default function StudentAssessmentList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useMyAssessments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size: 20,
  });

  const assessments = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return assessments;
    const q = search.toLowerCase();
    return assessments.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
    );
  }, [assessments, search]);

  return (
    <DashboardLayout
      role="student"
      user={{ name: 'Student', avatar: '', role: 'student' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <h2>Bài kiểm tra của tôi</h2>
              <p>Xem và làm các bài kiểm tra được giao.</p>
            </div>
          </header>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm bài kiểm tra"
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

          {isLoading && <div className="empty">Đang tải danh sách bài kiểm tra...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách bài kiểm tra'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Chưa có bài kiểm tra nào.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onViewDetail={() => navigate(`/student/assessments/${assessment.id}`)}
                  onStart={() => navigate(`/student/assessments/${assessment.id}/take`)}
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

function AssessmentCard({
  assessment,
  onViewDetail,
  onStart,
}: {
  assessment: StudentAssessmentResponse;
  onViewDetail: () => void;
  onStart: () => void;
}) {
  const dueDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  return (
    <article className="data-card">
      <div className="row">
        <span className={statusClass[assessment.studentStatus]}>
          {statusLabel[assessment.studentStatus]}
        </span>
        <span className="muted">
          {assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}
        </span>
      </div>

      <div>
        <h3>{assessment.title}</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          {assessment.description || 'Không có mô tả'}
        </p>
      </div>

      <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap', gap: 12 }}>
        <div className="row" style={{ gap: 4 }}>
          <FileText size={14} className="muted" />
          <span className="muted">{assessment.totalQuestions} câu hỏi</span>
        </div>
        {assessment.timeLimitMinutes && (
          <div className="row" style={{ gap: 4 }}>
            <Clock size={14} className="muted" />
            <span className="muted">{assessment.timeLimitMinutes} phút</span>
          </div>
        )}
        {assessment.passingScore && (
          <span className="muted">Điểm đạt: {assessment.passingScore}</span>
        )}
      </div>

      {assessment.allowMultipleAttempts && (
        <div className="row" style={{ justifyContent: 'start' }}>
          <span className="muted">
            Lần làm: {assessment.attemptCount}
            {assessment.maxAttempts ? ` / ${assessment.maxAttempts}` : ''}
          </span>
        </div>
      )}

      {assessment.lastAttemptScore !== undefined && (
        <div className="row" style={{ justifyContent: 'start' }}>
          <span>
            Điểm gần nhất: {assessment.lastAttemptScore} ({assessment.lastAttemptPercentage?.toFixed(1)}%)
          </span>
        </div>
      )}

      {dueDate && (
        <div className="row" style={{ justifyContent: 'start' }}>
          <span className={isOverdue ? 'muted' : ''} style={{ color: isOverdue ? 'var(--danger-color)' : undefined }}>
            Hạn nộp: {dueDate.toLocaleString('vi-VN')}
          </span>
        </div>
      )}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn secondary" onClick={onViewDetail}>
          <BookOpen size={14} />
          Chi tiết
        </button>

        {assessment.canStart && (
          <button className="btn" onClick={onStart}>
            {assessment.attemptCount > 0 ? 'Làm lại' : 'Bắt đầu'}
          </button>
        )}

        {!assessment.canStart && assessment.cannotStartReason && (
          <span className="muted" style={{ fontSize: '0.875rem' }}>
            {assessment.cannotStartReason}
          </span>
        )}
      </div>
    </article>
  );
}
