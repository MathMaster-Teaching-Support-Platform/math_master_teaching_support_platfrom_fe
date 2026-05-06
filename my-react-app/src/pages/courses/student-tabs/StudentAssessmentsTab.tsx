import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  ListChecks,
  Lock,
  NotebookPen,
  Play,
  Star,
} from 'lucide-react';
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

  const typeGlyph: Record<string, LucideIcon> = {
    QUIZ: ListChecks,
    HOMEWORK: NotebookPen,
    TEST: ClipboardList,
    EXAM: GraduationCap,
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

  const fmtDateShort = (d?: string | null) => {
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
    <div className="sat-container">
      {/* Stats */}
      <div className="sat-stats-grid">
        <div className="sat-stat-card sat-stat-ink">
          <div className="sat-stat-icon">
            <FileText size={18} strokeWidth={2} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.total}</h3>
            <p>Tổng</p>
          </div>
        </div>
        <div className="sat-stat-card sat-stat-warm">
          <div className="sat-stat-icon">
            <Star size={18} strokeWidth={2} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.required}</h3>
            <p>Bắt buộc</p>
          </div>
        </div>
        <div className="sat-stat-card sat-stat-soft">
          <div className="sat-stat-icon">
            <CheckCircle size={18} strokeWidth={2} />
          </div>
          <div className="sat-stat-content">
            <h3>{stats.optional}</h3>
            <p>Tùy chọn</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="sat-banner">
        <AlertCircle size={16} strokeWidth={2} className="sat-banner-icon shrink-0" />
        <span>
          Làm bài thường xuyên và định kỳ để theo dõi mức độ nắm kiến thức.
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
              const Glyph = typeGlyph[typeCode] ?? ListChecks;

              return (
                <div
                  key={assessment.id}
                  className={`sat-card ${
                    assessment.isRequired ? 'sat-required' : 'sat-optional'
                  } ${!canTake ? 'sat-disabled' : ''}`}
                >
                  <div className="sat-card-top">
                    <div className="sat-card-main">
                      <div className="sat-badges">
                        <span className="sat-type-icon" aria-hidden>
                          <Glyph size={14} strokeWidth={2} />
                        </span>
                        <span className={`sat-badge ${category}`}>{typeLabel[typeCode]}</span>
                        {assessment.isRequired ? (
                          <span className="sat-badge required">
                            <Star size={11} strokeWidth={2} className="sat-badge-star" />
                            Bắt buộc
                          </span>
                        ) : null}
                      </div>
                      <h3 className="sat-title">{assessment.title ?? 'Không có tiêu đề'}</h3>
                      {assessment.description ? (
                        <p className="sat-desc">{assessment.description}</p>
                      ) : null}

                      <div className="sat-chips" aria-label="Thông tin bài kiểm tra">
                        <span className="sat-chip">
                          <HelpCircle size={13} strokeWidth={2} aria-hidden />
                          {assessment.totalQuestions ?? 0} câu
                        </span>
                        <span className="sat-chip">
                          <Star size={13} strokeWidth={2} aria-hidden />
                          {assessment.totalPoints ?? 0} điểm
                        </span>
                        {assessment.timeLimitMinutes ? (
                          <span className="sat-chip">
                            <Clock size={13} strokeWidth={2} aria-hidden />
                            {assessment.timeLimitMinutes} phút
                          </span>
                        ) : null}
                        {assessment.passingScore ? (
                          <span className="sat-chip sat-chip-pass">
                            <CheckCircle size={13} strokeWidth={2} aria-hidden />
                            Đạt {assessment.passingScore}
                          </span>
                        ) : null}
                        {assessment.startDate ? (
                          <span className="sat-chip sat-chip-muted">
                            Mở {fmtDateShort(assessment.startDate)}
                          </span>
                        ) : null}
                        {assessment.endDate ? (
                          <span className="sat-chip sat-chip-muted">
                            Hạn {fmtDateShort(assessment.endDate)}
                          </span>
                        ) : null}
                      </div>

                      {!available ? (
                        <div className="sat-status-msg sat-status-locked">
                          <Lock size={14} strokeWidth={2} />
                          <span>
                            Chưa mở
                            {assessment.startDate ? ` · ${fmtDate(assessment.startDate)}` : ''}
                          </span>
                        </div>
                      ) : null}

                      {expired ? (
                        <div className="sat-status-msg sat-status-expired">
                          <AlertCircle size={14} strokeWidth={2} />
                          <span>
                            Đã hết hạn
                            {assessment.endDate ? ` · ${fmtDate(assessment.endDate)}` : ''}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="sat-card-aside">
                      <span className="sat-order">#{assessment.courseOrderIndex ?? '—'}</span>
                      <div className="sat-actions">
                        <button
                          type="button"
                          className="sat-btn primary"
                          disabled={!canTake}
                          onClick={() => navigate(`/student/assessments/${assessment.id}/take`)}
                        >
                          {canTake ? (
                            <>
                              <Play size={14} strokeWidth={2} />
                              Làm bài
                            </>
                          ) : (
                            <>
                              <Lock size={14} strokeWidth={2} />
                              {!available ? 'Chưa mở' : 'Hết hạn'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="sat-btn secondary"
                          onClick={() => navigate(`/student/assessments/${assessment.id}`)}
                        >
                          Chi tiết
                          <ChevronRight size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </div>
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
