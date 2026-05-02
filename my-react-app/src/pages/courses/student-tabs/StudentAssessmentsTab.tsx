import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, FileText, Lock, Play, Star, HelpCircle } from 'lucide-react';
import { useMyAssessmentsByCourse } from '../../../hooks/useStudentAssessment';
import type { StudentAssessmentResponse } from '../../../types/studentAssessment.types';
import './StudentAssessmentsTab.css';
import { UI_TEXT } from '../../../constants/uiText';

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

  // MoE Terminology Mapping
  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm (Thường xuyên)',
    HOMEWORK: 'Bài tập (Thường xuyên)',
    TEST: 'Kiểm tra (Định kỳ)',
    EXAM: 'Thi (Cuối kỳ)',
  };

  const typeCategory: Record<string, 'formative' | 'summative'> = {
    QUIZ: 'formative',
    HOMEWORK: 'formative',
    TEST: 'summative',
    EXAM: 'summative',
  };

  const typeIcon: Record<string, React.ReactNode> = {
    QUIZ: '📝',
    HOMEWORK: '📚',
    TEST: '📋',
    EXAM: '🎓',
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="sat-container">
      {/* Stats */}
      <div className="sat-stats-grid">
        <div className="sat-stat-card sat-stat-blue">
          <div className="sat-stat-icon">
            <FileText size={24} strokeWidth={2.5} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.total}</h3>
            <p>Tổng bài kiểm tra</p>
          </div>
        </div>
        <div className="sat-stat-card sat-stat-amber">
          <div className="sat-stat-icon">
            <Star size={24} strokeWidth={2.5} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.required}</h3>
            <p>Bắt buộc</p>
          </div>
        </div>
        <div className="sat-stat-card sat-stat-emerald">
          <div className="sat-stat-icon">
            <CheckCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.optional}</h3>
            <p>Tùy chọn</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="sat-banner">
        <AlertCircle size={20} strokeWidth={2.5} />
        <span>
          Hoàn thành các bài kiểm tra thường xuyên và định kỳ để đánh giá mức độ hiểu bài của bạn.
        </span>
      </div>

      {/* Loading */}
      {isLoading && <div className="sat-empty">Đang tải danh sách bài kiểm tra...</div>}

      {/* Empty State */}
      {!isLoading && assessments.length === 0 && (
        <div className="sat-empty">
          <FileText size={56} strokeWidth={1} />
          <p>Chưa có bài kiểm tra nào trong {UI_TEXT.COURSE.toLowerCase()} này.</p>
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && assessments.length > 0 && (
        <div className="sat-list">
          {assessments
            .sort((a, b) => (a.courseOrderIndex ?? 0) - (b.courseOrderIndex ?? 0))
            .map((assessment) => {
              const available = isAssessmentAvailable(assessment);
              const expired = isAssessmentExpired(assessment);
              const canTake = available && !expired;
              const typeCode = assessment.assessmentType ?? 'QUIZ';
              const category = typeCategory[typeCode];

              return (
                <div
                  key={assessment.id}
                  className={`sat-card ${
                    assessment.isRequired ? 'sat-required' : 'sat-optional'
                  } ${!canTake ? 'sat-disabled' : ''}`}
                >
                  <div className="sat-card-head">
                    <div className="sat-badges">
                      <span style={{ fontSize: '1.5rem', marginRight: '0.25rem' }}>
                        {typeIcon[typeCode]}
                      </span>
                      <span className={`sat-badge ${category}`}>
                        {typeLabel[typeCode]}
                      </span>
                      {assessment.isRequired && (
                        <span className="sat-badge required">
                          ⭐ Bắt buộc
                        </span>
                      )}
                    </div>
                    <span className="sat-order">
                      #{assessment.courseOrderIndex ?? '—'}
                    </span>
                  </div>

                  <div>
                    <h3 className="sat-title">
                      {assessment.title ?? 'Không có tiêu đề'}
                    </h3>
                    {assessment.description && (
                      <p className="sat-desc" style={{ marginTop: '0.5rem' }}>
                        {assessment.description}
                      </p>
                    )}
                  </div>

                  <div className="sat-meta">
                    <div className="sat-meta-item">
                      <HelpCircle size={16} />
                      {assessment.totalQuestions ?? 0} câu hỏi
                    </div>
                    <div className="sat-meta-item">
                      <Star size={16} />
                      {assessment.totalPoints ?? 0} điểm
                    </div>
                    {assessment.timeLimitMinutes && (
                      <div className="sat-meta-item">
                        <Clock size={16} />
                        {assessment.timeLimitMinutes} phút
                      </div>
                    )}
                    {assessment.passingScore && (
                      <div className="sat-meta-item" style={{ color: '#059669' }}>
                        <CheckCircle size={16} color="#059669" />
                        Điểm đạt: {assessment.passingScore}
                      </div>
                    )}
                  </div>

                  {/* Date Information */}
                  {(assessment.startDate || assessment.endDate) && (
                    <div className="sat-dates">
                      {assessment.startDate && (
                        <div className="sat-date-row">
                          <span>Bắt đầu:</span>
                          <strong>{fmtDate(assessment.startDate)}</strong>
                        </div>
                      )}
                      {assessment.endDate && (
                        <div className="sat-date-row">
                          <span>Kết thúc:</span>
                          <strong>{fmtDate(assessment.endDate)}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Messages */}
                  {!available && (
                    <div className="sat-status-msg sat-status-locked">
                      <Lock size={16} />
                      <span>Chưa mở - Có thể làm bài từ {fmtDate(assessment.startDate)}</span>
                    </div>
                  )}

                  {expired && (
                    <div className="sat-status-msg sat-status-expired">
                      <AlertCircle size={16} />
                      <span>Đã hết hạn - Kết thúc vào {fmtDate(assessment.endDate)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="sat-actions">
                    <button
                      className="sat-btn primary"
                      disabled={!canTake}
                      onClick={() => navigate(`/student/assessments/${assessment.id}/take`)}
                    >
                      {canTake ? (
                        <>
                          <Play size={16} />
                          Làm bài
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          {!available ? 'Chưa mở' : 'Đã hết hạn'}
                        </>
                      )}
                    </button>
                    <button
                      className="sat-btn secondary"
                      onClick={() => navigate(`/student/assessments/${assessment.id}`)}
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
