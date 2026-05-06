import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  GripVertical,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_TEXT } from '../../../constants/uiText';
import { useToast } from '../../../context/ToastContext';
import {
  useAddAssessmentToCourse,
  useAvailableAssessmentsForCourse,
  useCourseAssessments,
  useRemoveAssessmentFromCourse,
  useUpdateCourseAssessment,
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
}

type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';

interface FilterState {
  status?: AssessmentStatus;
  type?: AssessmentType;
  isRequired?: boolean;
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

const statusLabel: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  CLOSED: 'Đã đóng',
};

// Add Assessment Modal
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
  const [orderIndex, setOrderIndex] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const [allowOutOfCourseLessons, setAllowOutOfCourseLessons] = useState(provider === 'CUSTOM');
  const [error, setError] = useState('');

  const { data: assessmentsData, isLoading } = useAvailableAssessmentsForCourse(
    courseId,
    allowOutOfCourseLessons
  );
  const addMutation = useAddAssessmentToCourse();

  const assessments = assessmentsData?.result ?? [];
  const available = useMemo(() => {
    return assessments.filter((a) => !existingAssessmentIds.includes(a.assessmentId));
  }, [assessments, existingAssessmentIds]);

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
      const message = err instanceof Error ? err.message : 'Không thể thêm bài kiểm tra';
      setError(message);
    }
  };

  return (
    <div className="cat-modal-layer" onClick={onClose}>
      <div className="cat-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cat-modal-header">
          <div>
            <h3>Thêm bài kiểm tra vào {UI_TEXT.COURSE.toLowerCase()}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Chọn bài kiểm tra đã công khai từ ngân hàng của bạn
            </p>
          </div>
          <button
            className="btn secondary"
            style={{ padding: '0.5rem' }}
            onClick={onClose}
            disabled={addMutation.isPending}
          >
            <X size={18} />
          </button>
        </div>

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
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: '#87867f',
                  cursor: 'pointer',
                }}
                onClick={() => setSearch('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <label className="cat-checkbox-wrapper">
            <input
              type="checkbox"
              checked={allowOutOfCourseLessons}
              onChange={(e) => setAllowOutOfCourseLessons(e.target.checked)}
              disabled={provider === 'CUSTOM'}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#141413' }}>
                {provider === 'CUSTOM'
                  ? 'Cho phép chọn tất cả bài kiểm tra (Mặc định cho khóa Custom)'
                  : 'Cho phép bài kiểm tra không thuộc lesson (Override)'}
              </span>
              <p className="muted" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                {provider === 'CUSTOM'
                  ? 'Vì đây là khóa học tự do, bạn có thể chọn bất kỳ bài kiểm tra PUBLISHED nào của mình.'
                  : 'Bật tùy chọn này để chọn các bài kiểm tra Cuối kỳ không nằm trong bài học cụ thể.'}
              </p>
            </div>
          </label>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fee2e2',
                borderRadius: '12px',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#b91c1c',
              }}
            >
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="cdt-loading" style={{ marginTop: '2rem' }}>
              Đang tải...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="cdt-empty" style={{ minHeight: '240px', marginTop: '1rem' }}>
              <FileText size={40} style={{ color: '#d4c9bc', marginBottom: '0.5rem' }} />
              <p>
                {available.length === 0
                  ? 'Bạn chưa có bài kiểm tra đã công khai nào phù hợp.'
                  : 'Không tìm thấy bài kiểm tra phù hợp với từ khóa.'}
              </p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginTop: '1.25rem',
              }}
            >
              {filtered.map((assessment) => {
                const category = typeCategory[assessment.assessmentType] || 'formative';
                return (
                  <div
                    key={assessment.assessmentId}
                    className={`cat-select-card ${selectedId === assessment.assessmentId ? 'selected' : ''}`}
                    onClick={() => setSelectedId(assessment.assessmentId)}
                  >
                    <div className="cat-select-card-head">
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          className={`cat-badge ${statusLabel[assessment.status] === 'Đã công khai' ? 'published' : 'draft'}`}
                        >
                          {statusLabel[assessment.status]}
                        </span>
                        <span className={`cat-badge ${category}`}>
                          {typeLabel[assessment.assessmentType]}
                        </span>
                        {allowOutOfCourseLessons && selectedId === assessment.assessmentId && (
                          <span className="cat-badge warning">Override</span>
                        )}
                      </div>
                      {selectedId === assessment.assessmentId && (
                        <CheckCircle2 size={20} style={{ color: '#c96442' }} />
                      )}
                    </div>
                    <h4
                      style={{
                        margin: '0 0 0.25rem',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#141413',
                      }}
                    >
                      {assessment.title}
                    </h4>
                    {assessment.description && (
                      <p className="muted" style={{ fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
                        {assessment.description}
                      </p>
                    )}
                    <div
                      className="row"
                      style={{
                        gap: '1rem',
                        fontSize: '0.85rem',
                        color: '#64748b',
                        fontWeight: 500,
                      }}
                    >
                      <span>📝 {assessment.totalQuestions} câu</span>
                      <span>⭐ {assessment.totalPoints} điểm</span>
                      {assessment.timeLimitMinutes && (
                        <span>⏱️ {assessment.timeLimitMinutes} phút</span>
                      )}
                    </div>
                    {provider === 'MINISTRY' ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                          Khớp {assessment.matchedLessonCount} bài học:{' '}
                          {assessment.matchedLessonTitles.join(', ')}
                        </p>
                        {assessment.matchedLessonCount === 0 && (
                          <p
                            style={{
                              fontSize: '0.85rem',
                              marginTop: '0.2rem',
                              color: '#b91c1c',
                              fontWeight: 700,
                            }}
                          >
                            ⚠ Không khớp lesson nào của {UI_TEXT.COURSE.toLowerCase()}.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          marginTop: '0.75rem',
                          margin: 0,
                          color: '#059669',
                          fontWeight: 700,
                        }}
                      >
                        ✓ {UI_TEXT.COURSE} tự do (Cho phép chọn bất kỳ bài kiểm tra nào)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedId && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: '#fdfaf6',
                border: '1px solid #f0eee6',
                borderRadius: '14px',
              }}
            >
              <h4
                style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#141413' }}
              >
                Cài đặt bài kiểm tra
              </h4>
              <div className="row" style={{ gap: '1.5rem' }}>
                <label style={{ flex: 1 }}>
                  <p
                    className="muted"
                    style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Thứ tự hiển thị
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </label>
                <label
                  className="cat-checkbox-wrapper"
                  style={{ flex: 1, padding: '0.75rem 1rem', marginTop: '1.5rem' }}
                >
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Là bài bắt buộc</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="cat-modal-footer">
          <button className="cat-btn secondary" onClick={onClose} disabled={addMutation.isPending}>
            Hủy
          </button>
          <button
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

// Main Component
const CourseAssessmentsTab: React.FC<CourseAssessmentsTabProps> = ({ courseId, course }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const { data: assessmentsData, isLoading, refetch } = useCourseAssessments(courseId, filters);
  const removeMutation = useRemoveAssessmentFromCourse();
  const updateMutation = useUpdateCourseAssessment();

  const assessments: CourseAssessmentResponse[] = assessmentsData?.result ?? [];
  const existingIds = assessments.map((a) => a.assessmentId);

  const stats = useMemo(() => {
    return {
      total: assessments.length,
      required: assessments.filter((a) => a.isRequired).length,
      published: assessments.filter((a) => a.assessmentStatus === 'PUBLISHED').length,
      totalSubmissions: assessments.reduce((sum, a) => sum + (a.submissionCount ?? 0), 0),
    };
  }, [assessments]);

  const handleRemove = async (assessment: CourseAssessmentResponse) => {
    if (assessment.submissionCount && assessment.submissionCount > 0) {
      showToast({
        type: 'warning',
        message: `Không thể xóa bài kiểm tra này vì đã có ${assessment.submissionCount} bài nộp từ học viên.`,
      });
      return;
    }

    if (!confirm(`Xóa "${assessment.assessmentTitle}" khỏi ${UI_TEXT.COURSE.toLowerCase()}?`))
      return;

    try {
      await removeMutation.mutateAsync({ courseId, assessmentId: assessment.assessmentId });
      void refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa bài kiểm tra';
      showToast({ type: 'error', message });
    }
  };

  const handleToggleRequired = async (assessment: CourseAssessmentResponse) => {
    await updateMutation.mutateAsync({
      courseId,
      assessmentId: assessment.assessmentId,
      data: { isRequired: !assessment.isRequired },
    });
    void refetch();
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="cat-container assessments-tab">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap" aria-hidden>
            <FileText size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{stats.total}</h3>
            <p>Tổng bài kiểm tra</p>
            <span className="stat-card__sub">đã thêm vào {UI_TEXT.COURSE.toLowerCase()}</span>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap" aria-hidden>
            <Star size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{stats.required}</h3>
            <p>Bắt buộc</p>
            <span className="stat-card__sub">bài kiểm tra bắt buộc</span>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap" aria-hidden>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{stats.published}</h3>
            <p>Đã công khai</p>
            <span className="stat-card__sub">sẵn sàng cho học viên</span>
          </div>
        </div>
        <div className="stat-card stat-violet">
          <div className="stat-icon-wrap" aria-hidden>
            <Users size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{stats.totalSubmissions}</h3>
            <p>Bài nộp</p>
            <span className="stat-card__sub">tổng số bài đã nộp</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="cdt-toolbar cdt-toolbar--split">
        <div
          className="cdt-assessment-filters"
          role="search"
          aria-label="Lọc bài kiểm tra theo trạng thái, loại và bắt buộc"
        >
          <div className="cdt-assessment-filters__bar">
            <div className="cdt-assessment-filters__icon" aria-hidden>
              <Filter size={15} strokeWidth={2.25} />
            </div>
            <div className="cdt-assessment-filters__fields">
              <label className="cdt-assessment-filters__field">
                <span className="cdt-assessment-filters__label">Trạng thái</span>
                <select
                  className="cdt-select-inline"
                  value={filters.status || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: (e.target.value || undefined) as AssessmentStatus | undefined,
                    })
                  }
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="PUBLISHED">Đã công khai</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </label>

              <label className="cdt-assessment-filters__field">
                <span className="cdt-assessment-filters__label">Loại bài</span>
                <select
                  className="cdt-select-inline"
                  value={filters.type || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      type: (e.target.value || undefined) as AssessmentType | undefined,
                    })
                  }
                >
                  <option value="">Tất cả loại</option>
                  <option value="QUIZ">Trắc nghiệm (Thường xuyên)</option>
                  <option value="HOMEWORK">Bài tập (Thường xuyên)</option>
                  <option value="TEST">Kiểm tra (Định kỳ)</option>
                  <option value="EXAM">Thi (Cuối kỳ)</option>
                </select>
              </label>

              <label className="cdt-assessment-filters__field">
                <span className="cdt-assessment-filters__label">Bắt buộc</span>
                <select
                  className="cdt-select-inline"
                  value={filters.isRequired === undefined ? '' : String(filters.isRequired)}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isRequired: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="true">Chỉ bắt buộc</option>
                  <option value="false">Chỉ tùy chọn</option>
                </select>
              </label>
            </div>
          </div>

          {(filters.status || filters.type || filters.isRequired !== undefined) && (
            <button
              type="button"
              className="cat-btn secondary"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              onClick={() => setFilters({})}
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button type="button" className="cat-btn primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Thêm bài kiểm tra
        </button>
      </div>

      {/* Loading */}
      {isLoading && <div className="cdt-loading">Đang tải danh sách bài kiểm tra...</div>}

      {/* Empty State */}
      {!isLoading && assessments.length === 0 && (
        <div className="cdt-empty">
          <FileText size={48} strokeWidth={1} style={{ marginBottom: 12, color: '#d4c9bc' }} />
          <p>Chưa có bài kiểm tra nào. Hãy thêm bài kiểm tra đầu tiên!</p>
          <button
            type="button"
            className="cat-btn primary"
            style={{ marginTop: '1rem' }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Thêm bài kiểm tra
          </button>
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && assessments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {assessments
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((assessment) => {
              const typeCode = assessment.assessmentType ?? 'QUIZ';
              const category = typeCategory[typeCode] || 'formative';

              return (
                <div key={assessment.id} className="cat-list-card">
                  <div className="cat-drag-handle">
                    <GripVertical size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="row"
                      style={{ justifyContent: 'space-between', marginBottom: 12 }}
                    >
                      <div className="row" style={{ gap: 8 }}>
                        <span
                          className={`cat-badge ${assessment.assessmentStatus === 'PUBLISHED' ? 'published' : 'draft'}`}
                        >
                          {statusLabel[assessment.assessmentStatus ?? 'DRAFT']}
                        </span>
                        <span className={`cat-badge ${category}`}>{typeLabel[typeCode]}</span>
                        {assessment.isRequired && (
                          <span className="cat-badge required">⭐ Bắt buộc</span>
                        )}
                        {!assessment.lessonMatched && course.provider === 'MINISTRY' && (
                          <span className="cat-badge warning">⚠ Không khớp lesson</span>
                        )}
                      </div>
                      <span className="muted" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        #{assessment.orderIndex ?? '—'}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#141413',
                      }}
                    >
                      {assessment.assessmentTitle ?? 'Không có tiêu đề'}
                    </h3>

                    {assessment.assessmentDescription && (
                      <p className="muted" style={{ fontSize: '0.95rem', margin: '0 0 12px' }}>
                        {assessment.assessmentDescription}
                      </p>
                    )}

                    <div
                      className="row"
                      style={{
                        gap: '1.25rem',
                        fontSize: '0.85rem',
                        color: '#64748b',
                        fontWeight: 500,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>📝 {assessment.totalQuestions ?? 0} câu</span>
                      <span>⭐ {assessment.totalPoints ?? 0} điểm</span>
                      {assessment.timeLimitMinutes && (
                        <span>
                          <Clock size={14} style={{ marginRight: 4 }} />
                          {assessment.timeLimitMinutes} phút
                        </span>
                      )}
                      {assessment.startDate && <span>📅 {fmtDate(assessment.startDate)}</span>}
                      {assessment.submissionCount !== null && assessment.submissionCount > 0 && (
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          <Users size={14} style={{ marginRight: 4 }} />
                          {assessment.submissionCount} bài nộp
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {course.provider === 'CUSTOM' ? (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            margin: 0,
                            color: '#059669',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Bài kiểm tra tự do ({UI_TEXT.COURSE} Custom)
                        </p>
                      ) : assessment.lessonMatched ? (
                        <p
                          className="muted"
                          style={{ fontSize: '0.85rem', margin: 0, fontWeight: 500 }}
                        >
                          Khớp lesson: {assessment.matchedLessonTitles.join(', ')}
                        </p>
                      ) : (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            margin: 0,
                            color: '#b91c1c',
                            fontWeight: 700,
                          }}
                        >
                          Assessment này chưa liên kết với bất kỳ lesson nào của course.
                        </p>
                      )}
                    </div>

                    {assessment.submissionCount && assessment.submissionCount > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '0.75rem 1rem',
                          background: '#fef3c7',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: '#92400e',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <AlertCircle size={16} />
                        Không thể xóa vì đã có {assessment.submissionCount} bài nộp
                      </div>
                    )}

                    <div className="row cat-actions" style={{ gap: 12, marginTop: 16 }}>
                      <button
                        className="cat-btn secondary"
                        onClick={() => void handleToggleRequired(assessment)}
                        disabled={updateMutation.isPending}
                      >
                        {assessment.isRequired ? 'Bỏ bắt buộc' : 'Đặt bắt buộc'}
                      </button>
                      <button
                        className="cat-btn secondary"
                        onClick={() => navigate(`/teacher/assessments/${assessment.assessmentId}`)}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="cat-btn danger"
                        disabled={
                          removeMutation.isPending ||
                          (assessment.submissionCount !== null && assessment.submissionCount > 0)
                        }
                        onClick={() => void handleRemove(assessment)}
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
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
