import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  GripVertical,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  useCourseAssessments,
  useRemoveAssessmentFromCourse,
  useUpdateCourseAssessment,
  useAddAssessmentToCourse,
  useAvailableAssessmentsForCourse,
} from '../../../hooks/useCourses';
import type { CourseAssessmentResponse, AddAssessmentToCourseRequest } from '../../../types';
import '../../../styles/module-refactor.css';

interface CourseAssessmentsTabProps {
  courseId: string;
}

type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';

interface FilterState {
  status?: AssessmentStatus;
  type?: AssessmentType;
  isRequired?: boolean;
}

// Add Assessment Modal
function AddAssessmentModal({
  courseId,
  existingAssessmentIds,
  onClose,
}: {
  courseId: string;
  existingAssessmentIds: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const [allowOutOfCourseLessons, setAllowOutOfCourseLessons] = useState(false);
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

  const statusLabel: Record<string, string> = {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã xuất bản',
    CLOSED: 'Đã đóng',
  };

  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm',
    TEST: 'Kiểm tra',
    EXAM: 'Thi',
    HOMEWORK: 'Bài tập',
  };

  return (
    <div className="modal-layer" onClick={onClose}>
      <div className="modal-card" style={{ width: 'min(720px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>➕ Thêm bài kiểm tra vào giáo trình</h3>
            <p className="muted" style={{ marginTop: 6, fontSize: '0.88rem' }}>
              Chọn bài kiểm tra đã xuất bản từ danh sách của bạn
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={addMutation.isPending}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Search */}
          <div className="search-box" style={{ width: '100%' }}>
            <span className="search-box__icon">
              <FileText size={15} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-box__clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <label className="row" style={{ alignItems: 'center', gap: 8, marginTop: 10 }}>
            <input
              type="checkbox"
              checked={allowOutOfCourseLessons}
              onChange={(e) => setAllowOutOfCourseLessons(e.target.checked)}
            />
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
              Cho phép Final Exam ngoài lesson của course (override)
            </span>
          </label>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
            Tắt: chỉ hiện assessment khớp lesson của course. Bật: cho phép chọn cả assessment không khớp lesson.
          </p>

          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: 8, marginTop: '0.75rem' }}>
              <div className="row" style={{ gap: 8, color: '#dc2626' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{error}</span>
              </div>
            </div>
          )}

          {isLoading && <div className="empty">Đang tải...</div>}

          {!isLoading && filtered.length === 0 && (
            <div className="empty" style={{ minHeight: '240px' }}>
              <FileText size={32} style={{ color: '#94a3b8', marginBottom: 8 }} />
              <p>
                {available.length === 0
                  ? 'Bạn chưa có bài kiểm tra đã xuất bản nào.'
                  : 'Không tìm thấy bài kiểm tra phù hợp.'}
              </p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
              {filtered.map((assessment) => (
                <div
                  key={assessment.assessmentId}
                  className={`assessment-select-card ${selectedId === assessment.assessmentId ? 'selected' : ''}`}
                  onClick={() => setSelectedId(assessment.assessmentId)}
                  style={{
                    border: selectedId === assessment.assessmentId ? '2px solid #2d7be7' : '1px solid #dbe4f0',
                    borderRadius: 10,
                    padding: '0.85rem',
                    cursor: 'pointer',
                    background: selectedId === assessment.assessmentId ? '#f0f7ff' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="badge published">{statusLabel[assessment.status]}</span>
                      <span className="muted" style={{ fontSize: '0.82rem' }}>
                        {typeLabel[assessment.assessmentType]}
                      </span>
                      {allowOutOfCourseLessons && selectedId === assessment.assessmentId && (
                        <span
                          className="badge"
                          style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}
                        >
                          Final Exam Override
                        </span>
                      )}
                    </div>
                    {selectedId === assessment.assessmentId && (
                      <CheckCircle2 size={18} style={{ color: '#2d7be7' }} />
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700 }}>
                    {assessment.title}
                  </h4>
                  {assessment.description && (
                    <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 8px' }}>
                      {assessment.description}
                    </p>
                  )}
                  <div className="row" style={{ gap: 12, fontSize: '0.78rem', color: '#64748b' }}>
                    <span>📝 {assessment.totalQuestions} câu</span>
                    <span>⭐ {assessment.totalPoints} điểm</span>
                    {assessment.timeLimitMinutes && <span>⏱️ {assessment.timeLimitMinutes} phút</span>}
                  </div>
                  <p className="muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>
                    Khớp {assessment.matchedLessonCount} bài học: {assessment.matchedLessonTitles.join(', ')}
                  </p>
                  {assessment.matchedLessonCount === 0 && (
                    <p style={{ fontSize: '0.78rem', marginTop: 4, color: '#b91c1c', fontWeight: 600 }}>
                      Assessment này không khớp lesson nào của course.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedId && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Cài đặt</h4>
              <div className="row" style={{ gap: '1rem' }}>
                <label style={{ flex: 1 }}>
                  <p className="muted" style={{ marginBottom: 6, fontSize: '0.82rem' }}>
                    Thứ tự hiển thị
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                  />
                </label>
                <label className="row" style={{ alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.88rem' }}>Bắt buộc</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose} disabled={addMutation.isPending}>
            Hủy
          </button>
          <button
            className="btn"
            disabled={!selectedId || addMutation.isPending}
            onClick={() => void handleAdd()}
          >
            {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào giáo trình'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
const CourseAssessmentsTab: React.FC<CourseAssessmentsTabProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  // const [draggedId, setDraggedId] = useState<string | null>(null);
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
      alert(
        `Không thể xóa bài kiểm tra này vì đã có ${assessment.submissionCount} bài nộp từ học viên.`
      );
      return;
    }

    if (!confirm(`Xóa "${assessment.assessmentTitle}" khỏi giáo trình?`)) return;

    try {
      await removeMutation.mutateAsync({ courseId, assessmentId: assessment.assessmentId });
      void refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa bài kiểm tra';
      alert(message);
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

  const statusLabel: Record<string, string> = {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã xuất bản',
    CLOSED: 'Đã đóng',
  };

  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm',
    TEST: 'Kiểm tra',
    EXAM: 'Thi',
    HOMEWORK: 'Bài tập',
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
    <div className="assessments-tab">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <p>Tổng bài kiểm tra</p>
          <h3>{stats.total}</h3>
          <span>đã thêm vào giáo trình</span>
        </div>
        <div className="stat-card">
          <p>Bắt buộc</p>
          <h3>{stats.required}</h3>
          <span>bài kiểm tra bắt buộc</span>
        </div>
        <div className="stat-card">
          <p>Đã xuất bản</p>
          <h3>{stats.published}</h3>
          <span>sẵn sàng cho học viên</span>
        </div>
        <div className="stat-card">
          <p>Bài nộp</p>
          <h3>{stats.totalSubmissions}</h3>
          <span>tổng số bài đã nộp</span>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <select
            className="select"
            style={{ minWidth: 140 }}
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as AssessmentStatus | undefined })
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="CLOSED">Đã đóng</option>
          </select>

          <select
            className="select"
            style={{ minWidth: 140 }}
            value={filters.type || ''}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value as AssessmentType | undefined })
            }
          >
            <option value="">Tất cả loại</option>
            <option value="QUIZ">Trắc nghiệm</option>
            <option value="TEST">Kiểm tra</option>
            <option value="EXAM">Thi</option>
            <option value="HOMEWORK">Bài tập</option>
          </select>

          <select
            className="select"
            style={{ minWidth: 140 }}
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

          {(filters.status || filters.type || filters.isRequired !== undefined) && (
            <button
              className="btn secondary"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              onClick={() => setFilters({})}
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button className="btn" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          Thêm bài kiểm tra
        </button>
      </div>

      {/* Loading */}
      {isLoading && <div className="empty">Đang tải danh sách bài kiểm tra...</div>}

      {/* Empty State */}
      {!isLoading && assessments.length === 0 && (
        <div className="empty">
          <FileText size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: '#94a3b8' }} />
          <p>Chưa có bài kiểm tra nào. Hãy thêm bài kiểm tra đầu tiên!</p>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Thêm bài kiểm tra
          </button>
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && assessments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {assessments
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((assessment) => (
              <div key={assessment.id} className="data-card">
                <div className="row" style={{ gap: 12 }}>
                  <GripVertical size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className={`badge ${assessment.assessmentStatus === 'PUBLISHED' ? 'published' : 'draft'}`}>
                          {statusLabel[assessment.assessmentStatus ?? 'DRAFT']}
                        </span>
                        <span className="muted" style={{ fontSize: '0.82rem' }}>
                          {typeLabel[assessment.assessmentType ?? 'QUIZ']}
                        </span>
                        {assessment.isRequired && (
                          <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                            ⭐ Bắt buộc
                          </span>
                        )}
                        {!assessment.lessonMatched && (
                          <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            ⚠ Không khớp lesson
                          </span>
                        )}
                      </div>
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        #{assessment.orderIndex ?? '—'}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                      {assessment.assessmentTitle ?? 'Không có tiêu đề'}
                    </h3>

                    {assessment.assessmentDescription && (
                      <p className="muted" style={{ fontSize: '0.88rem', margin: '0 0 10px' }}>
                        {assessment.assessmentDescription}
                      </p>
                    )}

                    <div className="row" style={{ gap: 16, fontSize: '0.82rem', color: '#64748b' }}>
                      <span>📝 {assessment.totalQuestions ?? 0} câu</span>
                      <span>⭐ {assessment.totalPoints ?? 0} điểm</span>
                      {assessment.timeLimitMinutes && (
                        <span>
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {assessment.timeLimitMinutes} phút
                        </span>
                      )}
                      {assessment.startDate && <span>📅 {fmtDate(assessment.startDate)}</span>}
                      {assessment.submissionCount !== null && assessment.submissionCount > 0 && (
                        <span>
                          <Users size={12} style={{ marginRight: 3 }} />
                          {assessment.submissionCount} bài nộp
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {assessment.lessonMatched ? (
                        <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                          Khớp lesson: {assessment.matchedLessonTitles.join(', ')}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.82rem', margin: 0, color: '#b91c1c', fontWeight: 600 }}>
                          Assessment này chưa liên kết với bất kỳ lesson nào của course.
                        </p>
                      )}
                    </div>

                    {assessment.submissionCount && assessment.submissionCount > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '0.5rem 0.75rem',
                          background: '#fef3c7',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          color: '#92400e',
                        }}
                      >
                        <AlertCircle size={14} style={{ marginRight: 4 }} />
                        Không thể xóa vì đã có {assessment.submissionCount} bài nộp
                      </div>
                    )}

                    <div className="row" style={{ gap: 8, marginTop: 12 }}>
                      <button
                        className="btn secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                        onClick={() => void handleToggleRequired(assessment)}
                        disabled={updateMutation.isPending}
                      >
                        {assessment.isRequired ? 'Bỏ bắt buộc' : 'Đặt bắt buộc'}
                      </button>
                      <button
                        className="btn secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                        onClick={() => navigate(`/teacher/assessments/${assessment.assessmentId}`)}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="btn danger"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                        disabled={
                          removeMutation.isPending ||
                          (assessment.submissionCount !== null && assessment.submissionCount > 0)
                        }
                        onClick={() => void handleRemove(assessment)}
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {showAddModal && (
        <AddAssessmentModal
          courseId={courseId}
          existingAssessmentIds={existingIds}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default CourseAssessmentsTab;
