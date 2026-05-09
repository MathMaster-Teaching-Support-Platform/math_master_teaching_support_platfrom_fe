import {
  AlertCircle,
  CheckCircle2,
  FileText,
  GripVertical,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurriculumHierarchyFilter } from '../../../components/filters/CurriculumHierarchyFilter';
import { UI_TEXT } from '../../../constants/uiText';
import { useToast } from '../../../context/ToastContext';
import {
  useAddAssessmentToCourse,
  useAvailableAssessmentsForCourse,
  useCourseAssessments,
  useRemoveAssessmentFromCourse,
} from '../../../hooks/useCourses';
import '../../../styles/module-refactor.css';
import type {
  AddAssessmentToCourseRequest,
  CourseAssessmentResponse,
  CourseResponse,
} from '../../../types';
import './course-detail-tabs.css';
import './CourseAssessmentsTab.css';

interface CourseAssessmentsTabProps {
  courseId: string;
  course: CourseResponse;
  readOnly?: boolean;
}



const statusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  CLOSED: 'Đã đóng',
};

// ─── Add Assessment Modal ──────────────────────────────────────────────────────

function AddAssessmentModal({
  courseId,
  provider,
  existingAssessmentIds,
  onClose,
}: {
  courseId: string;
  provider: 'MINISTRY' | 'CUSTOM';
  existingAssessmentIds: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [orderIndex] = useState(existingAssessmentIds.length + 1);
  const [isRequired] = useState(true);
  const [allowOutOfCourseLessons, setAllowOutOfCourseLessons] = useState(provider === 'CUSTOM');
  const [error, setError] = useState('');

  const { data: assessmentsData, isLoading } = useAvailableAssessmentsForCourse(
    courseId,
    allowOutOfCourseLessons
  );
  const addMutation = useAddAssessmentToCourse();

  const assessments = useMemo(() => assessmentsData?.result ?? [], [assessmentsData]);
  const available = useMemo(
    () =>
      assessments.filter(
        (a) => !existingAssessmentIds.includes(a.assessmentId) && a.status === 'PUBLISHED'
      ),
    [assessments, existingAssessmentIds]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false)
    );
  }, [available, search]);

  const handleAdd = async () => {
    if (!selectedId) {
      setError('Vui lòng chọn một bài kiểm tra');
      return;
    }
    setError('');
    const data: AddAssessmentToCourseRequest = {
      assessmentId: selectedId,
      orderIndex,
      isRequired,
      allowOutOfCourseLessons,
    };
    try {
      await addMutation.mutateAsync({ courseId, data });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm bài kiểm tra');
    }
  };

  return (
    <div className="cat-modal-layer" onClick={onClose}>
      <div className="cat-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cat-modal-header">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FEF0EA] flex items-center justify-center text-[#C96442] flex-shrink-0">
              <FileText size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="!mb-0">Thêm bài kiểm tra</h3>
              <p className="font-[Be_Vietnam_Pro] text-[0.8rem] text-[#87867F] font-normal mt-0.5">
                Chọn bài kiểm tra đã công khai để gắn vào {UI_TEXT.COURSE.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#87867F] hover:bg-[#F5F4ED] hover:text-[#141413] transition-colors flex-shrink-0"
            onClick={onClose}
            disabled={addMutation.isPending}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cat-modal-body">
          {/* Search */}
          <div className="cat-search-box">
            <Search size={18} className="cat-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute right-4 text-[#87867F] hover:text-[#141413] transition-colors"
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Independent Assessments Toggle */}
          <div
            className="cat-toggle-wrapper"
            onClick={() => provider !== 'CUSTOM' && setAllowOutOfCourseLessons(!allowOutOfCourseLessons)}
          >
            <div className="flex-1 min-w-0">
              <span className="font-[Be_Vietnam_Pro] text-[0.9rem] font-semibold text-[#141413]">
                {provider === 'CUSTOM'
                  ? 'Cho phép chọn tất cả bài kiểm tra (Mặc định cho khóa Custom)'
                  : 'Hiển thị thêm bài kiểm tra cuối kỳ và bài thi tổng hợp'}
              </span>
              <p className="font-[Be_Vietnam_Pro] text-[0.8rem] text-[#87867F] mt-1 mb-0">
                {provider === 'CUSTOM'
                  ? 'Vì đây là khóa học tự do, bạn có thể chọn bất kỳ bài kiểm tra PUBLISHED nào của mình.'
                  : 'Bao gồm bài kiểm tra không thuộc bài học nào trong khóa học'}
              </p>
            </div>
            <div className="cat-toggle-container">
              <input
                type="checkbox"
                checked={allowOutOfCourseLessons}
                onChange={() => { }} // Controlled by wrapper click
                disabled={provider === 'CUSTOM'}
                className="hidden-checkbox"
              />
              <div className={`cat-toggle ${allowOutOfCourseLessons ? 'active' : ''}`} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 mt-3">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="font-[Be_Vietnam_Pro] text-[0.875rem] font-semibold">{error}</span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col gap-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-[#F5F4ED] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
                <FileText className="w-6 h-6 opacity-60" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[0.875rem] text-[#87867F] text-center">
                {available.length === 0
                  ? 'Bạn chưa có bài kiểm tra đã công khai nào phù hợp.'
                  : 'Không tìm thấy bài kiểm tra phù hợp với từ khóa.'}
              </p>
            </div>
          )}

          {/* Assessment list */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              {filtered.map((assessment) => {
                const isSelected = selectedId === assessment.assessmentId;
                return (
                  <div
                    key={assessment.assessmentId}
                    className={`cat-select-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedId(assessment.assessmentId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(assessment.assessmentId)}
                  >
                    <div className="cat-select-card-head">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="cat-badge published">
                          {statusLabel[assessment.status]}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-[#818cf8] flex-shrink-0" />
                      )}
                    </div>

                    <h4 className="font-[Playfair_Display] text-[1rem] font-medium text-[#141413] mt-1.5 mb-1">
                      {assessment.title}
                    </h4>

                    {assessment.description && (
                      <p className="font-[Be_Vietnam_Pro] text-[0.875rem] text-[#87867F] line-clamp-2 mb-2">
                        {assessment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[Be_Vietnam_Pro] text-[0.8rem] text-[#87867F]">
                      <span>{assessment.totalQuestions} câu</span>
                      <span className="text-[#E8E6DC]">·</span>
                      <span>{assessment.totalPoints} điểm</span>
                      {assessment.timeLimitMinutes && (
                        <>
                          <span className="text-[#E8E6DC]">·</span>
                          <span>{assessment.timeLimitMinutes} phút</span>
                        </>
                      )}
                    </div>


                  </div>
                );
              })}
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="cat-modal-footer">
          <button
            type="button"
            className="cat-btn secondary"
            onClick={onClose}
            disabled={addMutation.isPending}
          >
            Hủy
          </button>
          <button
            type="button"
            className="cat-btn primary"
            disabled={!selectedId || addMutation.isPending}
            onClick={() => void handleAdd()}
          >
            {addMutation.isPending ? 'Đang thêm...' : `Thêm vào ${UI_TEXT.COURSE.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const CourseAssessmentsTab: React.FC<CourseAssessmentsTabProps> = ({ courseId, course, readOnly = false }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);

  // Curriculum hierarchy filter state
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [filterLessonId, setFilterLessonId] = useState('');

  const { data: assessmentsData, isLoading, refetch } = useCourseAssessments(courseId);
  const removeMutation = useRemoveAssessmentFromCourse();

  const assessments: CourseAssessmentResponse[] = useMemo(
    () => assessmentsData?.result ?? [],
    [assessmentsData]
  );
  const existingIds = assessments.map((a) => a.assessmentId);

  // Only filter when a specific lesson is selected — assessments have no chapter field
  const filteredAssessments = useMemo(() => {
    if (!filterLessonId) return assessments;
    return assessments.filter((a) =>
      (a.assessmentLessonIds ?? []).includes(filterLessonId)
    );
  }, [assessments, filterLessonId]);

  const hasActiveFilters = !!(filterGradeId || filterSubjectId || filterChapterId || filterLessonId);

  const handleRemove = async (assessment: CourseAssessmentResponse) => {
    if (!confirm(`Xóa "${assessment.assessmentTitle}" khỏi ${UI_TEXT.COURSE.toLowerCase()}?`))
      return;
    try {
      await removeMutation.mutateAsync({ courseId, assessmentId: assessment.assessmentId });
      void refetch();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa bài kiểm tra',
      });
    }
  };

  const clearFilters = () => {
    setFilterGradeId('');
    setFilterSubjectId('');
    setFilterChapterId('');
    setFilterLessonId('');
  };



  return (
    <div className="cat-container assessments-tab course-detail-tab">


      {/* ── Curriculum hierarchy filter — only meaningful for Ministry courses ── */}
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

      {/* ── Toolbar ── */}
      <div className="cdt-toolbar cdt-toolbar--split">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
              onClick={clearFilters}
            >
              <X size={13} />
              Xóa bộ lọc
            </button>
          )}
          {filterLessonId && filteredAssessments.length < assessments.length && (
            <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
              {filteredAssessments.length}/{assessments.length} bài kiểm tra
            </span>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 flex-shrink-0"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={15} />
            Thêm bài kiểm tra
          </button>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-32 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && filteredAssessments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F4ED] flex items-center justify-center text-[#87867F]">
            <FileText className="w-6 h-6 opacity-60" aria-hidden />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md px-4">
            {hasActiveFilters
              ? 'Không có bài kiểm tra nào khớp với bài học đã chọn.'
              : `Chưa có bài kiểm tra nào trong ${UI_TEXT.COURSE.toLowerCase()} này.`}
          </p>
        </div>
      )}

      {/* ── Assessment list ── */}
      {!isLoading && filteredAssessments.length > 0 && (
        <div className="flex flex-col gap-3">
          {[...filteredAssessments]
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((assessment) => {
              return (
                <article
                  key={assessment.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-5 flex gap-3 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150 group"
                >
                  {/* Drag handle */}
                  <div className="text-[#D4C9BC] pt-0.5 cursor-grab active:cursor-grabbing flex-shrink-0">
                    <GripVertical size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges + order index */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`cat-badge ${assessment.assessmentStatus === 'PUBLISHED'
                            ? 'published'
                            : assessment.assessmentStatus === 'CLOSED'
                              ? 'closed'
                              : 'draft'
                            }`}
                        >
                          {statusLabel[assessment.assessmentStatus ?? 'DRAFT']}
                        </span>

                        {assessment.isRequired && (
                          <span className="cat-badge required">⭐ Bắt buộc</span>
                        )}
                      </div>

                    </div>

                    {/* Title */}
                    <h3 className="font-[Playfair_Display] text-[1.25rem] font-bold text-[#141413] leading-tight mb-2">
                      {assessment.assessmentTitle ?? 'Không có tiêu đề'}
                    </h3>

                    {/* Description */}
                    {assessment.assessmentDescription && (
                      <p className="font-[Be_Vietnam_Pro] text-[0.875rem] text-[#5e5d59] leading-relaxed line-clamp-2 max-w-2xl mb-4">
                        {assessment.assessmentDescription}
                      </p>
                    )}

                    {/* Stats Block */}
                    <div className="cat-stats-row">
                      <div className="cat-stat-box">
                        <label>Tổng số câu</label>
                        <span>{assessment.totalQuestions ?? 0} câu</span>
                      </div>
                      <div className="cat-stat-box">
                        <label>Tổng điểm</label>
                        <span>{assessment.totalPoints ?? 0} điểm</span>
                      </div>
                      <div className={`cat-stat-box interactive ${assessment.submissionCount !== null && assessment.submissionCount > 0 ? '' : 'opacity-50'}`}>
                        <label>Bài nộp</label>
                        <span>{assessment.submissionCount ?? 0} bài nộp</span>
                      </div>
                    </div>



                    {/* Actions — revealed on card hover */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F0EEE6] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {readOnly ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#C96442] bg-[#FEF0EA] font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#C96442] hover:bg-[#FDDECE] transition-colors inline-flex items-center gap-1.5"
                          onClick={() => navigate(`/teacher/assessments/${assessment.assessmentId}/preview?role=admin`)}
                        >
                          <Star className="w-3.5 h-3.5 flex-shrink-0" />
                          Xem trước / Thử bài
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                            onClick={() => navigate(`/teacher/assessments/${assessment.assessmentId}`)}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
                            disabled={removeMutation.isPending}
                            onClick={() => void handleRemove(assessment)}
                          >
                            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      )}

      {showAddModal && (
        <AddAssessmentModal
          courseId={courseId}
          provider={course.provider}
          existingAssessmentIds={existingIds}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default CourseAssessmentsTab;
