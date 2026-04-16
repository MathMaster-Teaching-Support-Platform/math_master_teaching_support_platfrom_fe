import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, FileText, Lock, Play, Star } from 'lucide-react';
import { useMyAssessmentsByCourse } from '../../../hooks/useStudentAssessment';
import type { StudentAssessmentResponse } from '../../../types/studentAssessment.types';
import '../../../styles/module-refactor.css';

interface StudentAssessmentsTabProps {
  courseId: string;
}

const StudentAssessmentsTab: React.FC<StudentAssessmentsTabProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const { data: assessmentsData, isLoading } = useMyAssessmentsByCourse(courseId, {
    page: 0,
    size: 200,
    sortBy: 'dueDate',
    sortDir: 'ASC',
  });

  const assessments: StudentAssessmentResponse[] = assessmentsData?.result?.content ?? [];

  const stats = useMemo(() => {
    return {
      total: assessments.length,
      required: assessments.filter((a) => a.isRequired === true).length,
      optional: assessments.filter((a) => a.isRequired !== true).length,
    };
  }, [assessments]);

  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm',
    TEST: 'Kiểm tra',
    EXAM: 'Thi',
    HOMEWORK: 'Bài tập',
  };

  const typeIcon: Record<string, React.ReactNode> = {
    QUIZ: '📝',
    TEST: '📋',
    EXAM: '🎓',
    HOMEWORK: '📚',
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isAssessmentAvailable = (assessment: StudentAssessmentResponse) => {
    if (!assessment.startDate) return true;
    const now = new Date();
    const start = new Date(assessment.startDate);
    return now >= start;
  };

  const isAssessmentExpired = (assessment: StudentAssessmentResponse) => {
    if (!assessment.endDate) return false;
    const now = new Date();
    const end = new Date(assessment.endDate);
    return now > end;
  };

  return (
    <div className="assessments-tab">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap">
            <FileText size={20} />
          </div>
          <div>
            <h3>{stats.total}</h3>
            <p>Tổng đánh giá</p>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap">
            <Star size={20} />
          </div>
          <div>
            <h3>{stats.required}</h3>
            <p>Bắt buộc</p>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3>{stats.optional}</h3>
            <p>Tùy chọn</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          padding: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          marginBottom: '1.5rem',
        }}
      >
        <div className="row" style={{ gap: 8, color: '#1e40af' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Hoàn thành các bài đánh giá để đánh giá kiến thức của bạn
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <div className="empty">Đang tải danh sách đánh giá...</div>}

      {/* Empty State */}
      {!isLoading && assessments.length === 0 && (
        <div className="empty">
          <FileText size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: '#94a3b8' }} />
          <p>Chưa có bài đánh giá nào trong giáo trình này.</p>
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && assessments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assessments
            .sort((a, b) => (a.courseOrderIndex ?? 0) - (b.courseOrderIndex ?? 0))
            .map((assessment) => {
              const available = isAssessmentAvailable(assessment);
              const expired = isAssessmentExpired(assessment);
              const canTake = available && !expired;

              return (
                <div
                  key={assessment.id}
                  className="data-card"
                  style={{
                    opacity: canTake ? 1 : 0.7,
                    border: assessment.isRequired ? '2px solid #fbbf24' : '1px solid #e8eef8',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {typeIcon[assessment.assessmentType ?? 'QUIZ']}
                      </span>
                      <span className="badge">
                        {typeLabel[assessment.assessmentType ?? 'QUIZ']}
                      </span>
                      {assessment.isRequired && (
                        <span
                          className="badge"
                          style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}
                        >
                          ⭐ Bắt buộc
                        </span>
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>
                      #{assessment.courseOrderIndex ?? '—'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>
                    {assessment.title ?? 'Không có tiêu đề'}
                  </h3>

                  {assessment.description && (
                    <p className="muted" style={{ fontSize: '0.9rem', margin: '0 0 12px' }}>
                      {assessment.description}
                    </p>
                  )}

                  <div
                    className="row"
                    style={{
                      gap: 16,
                      fontSize: '0.85rem',
                      color: '#64748b',
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      <FileText size={13} style={{ marginRight: 4 }} />
                      {assessment.totalQuestions ?? 0} câu hỏi
                    </span>
                    <span>
                      <Star size={13} style={{ marginRight: 4 }} />
                      {assessment.totalPoints ?? 0} điểm
                    </span>
                    {assessment.timeLimitMinutes && (
                      <span>
                        <Clock size={13} style={{ marginRight: 4 }} />
                        {assessment.timeLimitMinutes} phút
                      </span>
                    )}
                    {assessment.passingScore && (
                      <span>
                        ✅ Điểm đạt: {assessment.passingScore}
                      </span>
                    )}
                  </div>

                  {/* Date Information */}
                  {(assessment.startDate || assessment.endDate) && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: 8,
                        marginBottom: 12,
                        fontSize: '0.85rem',
                      }}
                    >
                      {assessment.startDate && (
                        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                          <span className="muted">Bắt đầu:</span>
                          <strong>{fmtDate(assessment.startDate)}</strong>
                        </div>
                      )}
                      {assessment.endDate && (
                        <div className="row" style={{ gap: 8 }}>
                          <span className="muted">Kết thúc:</span>
                          <strong>{fmtDate(assessment.endDate)}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Messages */}
                  {!available && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: '#fef3c7',
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                    >
                      <div className="row" style={{ gap: 8, color: '#92400e' }}>
                        <Lock size={14} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Chưa mở - Bắt đầu từ {fmtDate(assessment.startDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {expired && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: '#fee2e2',
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                    >
                      <div className="row" style={{ gap: 8, color: '#dc2626' }}>
                        <AlertCircle size={14} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Đã hết hạn - Kết thúc {fmtDate(assessment.endDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="row" style={{ gap: 8 }}>
                    <button
                      className="btn"
                      style={{ flex: 1 }}
                      disabled={!canTake}
                      onClick={() => navigate(`/student/assessments/${assessment.id}/take`)}
                    >
                      {canTake ? (
                        <>
                          <Play size={14} />
                          Làm bài
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          {!available ? 'Chưa mở' : 'Đã hết hạn'}
                        </>
                      )}
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() =>
                        navigate(`/student/assessments/${assessment.id}`)
                      }
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentsTab;
