import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  X,
} from 'lucide-react';
import { CurriculumHierarchyFilter } from '../../../components/filters/CurriculumHierarchyFilter';
import { useCurriculumHierarchyCatalog } from '../../../hooks/useCurriculumHierarchyCatalog';
import { useMyAssessmentsByCourse } from '../../../hooks/useStudentAssessment';
import { entityMatchesGradeSubject } from '../../../utils/curriculumFilter';
import type { CourseResponse } from '../../../types';
import type { StudentAssessmentResponse } from '../../../types/studentAssessment.types';
import './StudentAssessmentsTab.css';
import { UI_TEXT } from '../../../constants/uiText';

interface StudentAssessmentsTabProps {
  courseId: string;
  course: CourseResponse;
}

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

const StudentAssessmentsTab: React.FC<StudentAssessmentsTabProps> = ({ courseId, course }) => {
  const navigate = useNavigate();

  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [filterLessonId, setFilterLessonId] = useState('');

  const { data: assessmentsData, isLoading } = useMyAssessmentsByCourse(courseId, {
    page: 0,
    size: 200,
    sortBy: 'dueDate',
    sortDir: 'ASC',
  });

  const assessments: StudentAssessmentResponse[] = assessmentsData?.result?.content ?? [];

  const { schoolGrades, lessons: chapterLessons } = useCurriculumHierarchyCatalog({
    gradeId: filterGradeId,
    subjectId: filterSubjectId,
    chapterId: filterChapterId,
  });

  const filteredAssessments = useMemo(() => {
    if (!entityMatchesGradeSubject(course, filterGradeId, filterSubjectId, schoolGrades)) {
      return [];
    }

    let filtered = assessments;
    if (filterLessonId) {
      filtered = filtered.filter((a) => (a.lessonIds ?? []).includes(filterLessonId));
    } else if (filterChapterId) {
      const chapterLessonIds = chapterLessons.map((l) => l.id);
      if (chapterLessonIds.length > 0) {
        filtered = filtered.filter((a) =>
          (a.lessonIds ?? []).some((id) => chapterLessonIds.includes(id))
        );
      } else {
        filtered = [];
      }
    }
    return filtered;
  }, [assessments, course, filterLessonId, filterChapterId, filterGradeId, filterSubjectId, chapterLessons, schoolGrades]);

  const hasActiveFilters = !!(filterGradeId || filterSubjectId || filterChapterId || filterLessonId);

  const clearFilters = () => {
    setFilterGradeId('');
    setFilterSubjectId('');
    setFilterChapterId('');
    setFilterLessonId('');
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

      {/* Info Banner */}
      <div className="sat-banner">
        <AlertCircle size={16} strokeWidth={2} className="sat-banner-icon shrink-0" />
        <span>
          Làm bài thường xuyên và định kỳ để theo dõi mức độ nắm kiến thức.
        </span>
      </div>

      {/* Curriculum hierarchy filter — only for Ministry courses */}
      {course.provider === 'MINISTRY' && (
        <CurriculumHierarchyFilter
          gradeId={filterGradeId}
          subjectId={filterSubjectId}
          chapterId={filterChapterId}
          lessonId={filterLessonId}
          onGradeChange={(id) => {
            setFilterGradeId(id);
            setFilterSubjectId('');
            setFilterChapterId('');
            setFilterLessonId('');
          }}
          onSubjectChange={(id) => {
            setFilterSubjectId(id);
            setFilterChapterId('');
            setFilterLessonId('');
          }}
          onChapterChange={(id) => {
            setFilterChapterId(id);
            setFilterLessonId('');
          }}
          onLessonChange={setFilterLessonId}
          footnote="Chọn chương hoặc bài để lọc bài kiểm tra theo bài học đã gán."
        />
      )}

      {/* Clear filter toolbar */}
      {course.provider === 'MINISTRY' && hasActiveFilters && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
            onClick={clearFilters}
          >
            <X size={13} />
            Xóa bộ lọc
          </button>
          {filterLessonId && filteredAssessments.length < assessments.length && (
            <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
              {filteredAssessments.length}/{assessments.length} bài kiểm tra
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && <div className="sat-empty">Đang tải danh sách bài kiểm tra...</div>}

      {/* Empty State — no assessments at all */}
      {!isLoading && assessments.length === 0 && (
        <div className="sat-empty">
          <FileText size={56} strokeWidth={1} />
          <p>Chưa có bài kiểm tra nào trong {UI_TEXT.COURSE.toLowerCase()} này.</p>
        </div>
      )}

      {/* Empty State — no results after filter */}
      {!isLoading && assessments.length > 0 && filteredAssessments.length === 0 && (
        <div className="sat-empty">
          <FileText size={56} strokeWidth={1} />
          <p>Không có bài kiểm tra nào khớp với bài học đã chọn.</p>
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && filteredAssessments.length > 0 && (
        <div className="sat-list">
          {filteredAssessments
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
                        {assessment.lastScore !== undefined && assessment.lastScore !== null && (
                          <span className="sat-chip sat-chip-score">
                            <CheckCircle size={13} strokeWidth={2} aria-hidden className="text-emerald-500" />
                            Đã đạt: <strong>{assessment.lastScore}</strong>/{assessment.totalPoints}
                          </span>
                        )}
                        {assessment.attemptNumber !== undefined && assessment.attemptNumber > 0 && (
                          <span className="sat-chip sat-chip-attempts">
                            <Play size={13} strokeWidth={2} aria-hidden />
                            Đã làm: {assessment.attemptNumber} lần
                          </span>
                        )}
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
