import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useMyAssessments } from '../../hooks/useAssessment';
import {
  useAddAssessmentToCourse,
  useCourseAssessments,
  useCourseDetail,
  useRemoveAssessmentFromCourse,
  useUpdateCourseAssessment,
} from '../../hooks/useCourses';
import '../../styles/module-refactor.css';
import type { AddAssessmentToCourseRequest, CourseAssessmentResponse } from '../../types';
import './TeacherCourses.css';

// ─── Add Assessment Modal ─────────────────────────────────────────────────────
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

  const { data: assessmentsData, isLoading } = useMyAssessments({
    status: undefined,
    page: 0,
    size: 100,
  });
  const addMutation = useAddAssessmentToCourse();

  const assessments = assessmentsData?.result?.content ?? [];

  // Filter out already added assessments
  const available = useMemo(() => {
    return assessments.filter((a) => !existingAssessmentIds.includes(a.id));
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
    if (!selectedId) return;
    const data: AddAssessmentToCourseRequest = {
      assessmentId: selectedId,
      orderIndex,
      isRequired,
    };
    await addMutation.mutateAsync({ courseId, data });
    onClose();
  };

  const selected = assessments.find((a) => a.id === selectedId);

  const statusLabel: Record<string, string> = {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã xuất bản',
    CLOSED: 'Đã đóng',
  };

  const statusClass: Record<string, string> = {
    DRAFT: 'badge draft',
    PUBLISHED: 'badge published',
    CLOSED: 'badge closed',
  };

  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm',
    TEST: 'Kiểm tra',
    EXAM: 'Thi',
    HOMEWORK: 'Bài tập',
  };

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(720px, 100%)', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h3>➕ Thêm bài kiểm tra vào giáo trình</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chọn bài kiểm tra từ danh sách của bạn
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={addMutation.isPending}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Search */}
          <div className="search-box" style={{ width: '100%', marginBottom: '1rem' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm bài kiểm tra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Assessment list */}
          {isLoading && <div className="empty">Đang tải...</div>}

          {!isLoading && filtered.length === 0 && (
            <div className="empty">
              <AlertCircle size={32} style={{ marginBottom: 8, color: '#94a3b8' }} />
              <p>Không tìm thấy bài kiểm tra nào</p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`assessment-select-card ${selectedId === assessment.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(assessment.id)}
                  style={{
                    border:
                      selectedId === assessment.id ? '2px solid #2d7be7' : '1px solid #dbe4f0',
                    borderRadius: 10,
                    padding: '0.85rem',
                    cursor: 'pointer',
                    background: selectedId === assessment.id ? '#f0f7ff' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={statusClass[assessment.status]}>
                        {statusLabel[assessment.status]}
                      </span>
                      <span className="muted" style={{ fontSize: '0.82rem' }}>
                        {typeLabel[assessment.assessmentType]}
                      </span>
                    </div>
                    {selectedId === assessment.id && (
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
                    {assessment.timeLimitMinutes && (
                      <span>⏱️ {assessment.timeLimitMinutes} phút</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings */}
          {selected && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: 10,
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                Cài đặt
              </h4>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherCourseAssessments() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { data: courseData } = useCourseDetail(courseId!);
  const { data: assessmentsData, isLoading, refetch } = useCourseAssessments(courseId!);
  const removeMutation = useRemoveAssessmentFromCourse();
  const updateMutation = useUpdateCourseAssessment();

  const course = courseData?.result;
  const assessments: CourseAssessmentResponse[] = assessmentsData?.result ?? [];

  const existingIds = assessments.map((a) => a.assessmentId);

  const handleRemove = async (assessmentId: string) => {
    if (!confirm('Xóa bài kiểm tra này khỏi giáo trình?')) return;
    await removeMutation.mutateAsync({ courseId: courseId!, assessmentId });
    void refetch();
  };

  const handleToggleRequired = async (assessment: CourseAssessmentResponse) => {
    await updateMutation.mutateAsync({
      courseId: courseId!,
      assessmentId: assessment.assessmentId,
      data: { isRequired: !assessment.isRequired },
    });
    void refetch();
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = assessments.findIndex((a) => a.id === draggedId);
    const targetIndex = assessments.findIndex((a) => a.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Update order for both items
    const draggedItem = assessments[draggedIndex];
    const targetItem = assessments[targetIndex];

    await Promise.all([
      updateMutation.mutateAsync({
        courseId: courseId!,
        assessmentId: draggedItem.assessmentId,
        data: { orderIndex: targetItem.orderIndex ?? undefined },
      }),
      updateMutation.mutateAsync({
        courseId: courseId!,
        assessmentId: targetItem.assessmentId,
        data: { orderIndex: draggedItem.orderIndex ?? undefined },
      }),
    ]);

    setDraggedId(null);
    void refetch();
  };

  const statusLabel: Record<string, string> = {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã xuất bản',
    CLOSED: 'Đã đóng',
  };

  const statusClass: Record<string, string> = {
    DRAFT: 'badge draft',
    PUBLISHED: 'badge published',
    CLOSED: 'badge closed',
  };

  const typeLabel: Record<string, string> = {
    QUIZ: 'Trắc nghiệm',
    TEST: 'Kiểm tra',
    EXAM: 'Thi',
    HOMEWORK: 'Bài tập',
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('vi-VN');
  };

  return (
    <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
      <div className="module-layout-container">
        <section className="module-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <button
                className="btn secondary"
                style={{ marginBottom: 8 }}
                onClick={() => navigate('/teacher/courses')}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2>📋 Đánh giá — {course?.title ?? '...'}</h2>
              <p>
                {course?.subjectName} • Khối {course?.gradeLevel} • {assessments.length} bài kiểm
                tra
              </p>
            </div>
            <button className="btn" onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              Thêm bài kiểm tra
            </button>
          </header>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <p>Tổng bài kiểm tra</p>
              <h3>{assessments.length}</h3>
              <span>đã thêm</span>
            </div>
            <div className="stat-card">
              <p>Bắt buộc</p>
              <h3>{assessments.filter((a) => a.isRequired).length}</h3>
              <span>bài kiểm tra</span>
            </div>
            <div className="stat-card">
              <p>Đã xuất bản</p>
              <h3>{assessments.filter((a) => a.assessmentStatus === 'PUBLISHED').length}</h3>
              <span>bài kiểm tra</span>
            </div>
          </div>

          {/* Assessment list */}
          {isLoading && <div className="empty">Đang tải danh sách bài kiểm tra...</div>}

          {!isLoading && assessments.length === 0 && (
            <div className="empty">
              <FileText
                size={40}
                strokeWidth={1.5}
                style={{ marginBottom: 12, color: '#94a3b8' }}
              />
              <p>Chưa có bài kiểm tra nào. Hãy thêm bài kiểm tra đầu tiên!</p>
              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} />
                Thêm bài kiểm tra
              </button>
            </div>
          )}

          {!isLoading && assessments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {assessments
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((assessment) => (
                  <div
                    key={assessment.id}
                    draggable
                    onDragStart={() => handleDragStart(assessment.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => void handleDrop(assessment.id)}
                    className="data-card"
                    style={{
                      cursor: 'grab',
                      opacity: draggedId === assessment.id ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div className="row" style={{ gap: 12 }}>
                      <GripVertical size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div
                          className="row"
                          style={{ justifyContent: 'space-between', marginBottom: 8 }}
                        >
                          <div className="row" style={{ gap: 8 }}>
                            <span className={statusClass[assessment.assessmentStatus ?? 'DRAFT']}>
                              {statusLabel[assessment.assessmentStatus ?? 'DRAFT']}
                            </span>
                            <span className="muted" style={{ fontSize: '0.82rem' }}>
                              {typeLabel[assessment.assessmentType ?? 'QUIZ']}
                            </span>
                            {assessment.isRequired && (
                              <span
                                className="badge"
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  fontSize: '0.72rem',
                                }}
                              >
                                Bắt buộc
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

                        <div
                          className="row"
                          style={{ gap: 16, fontSize: '0.82rem', color: '#64748b' }}
                        >
                          <span>📝 {assessment.totalQuestions ?? 0} câu</span>
                          <span>⭐ {assessment.totalPoints ?? 0} điểm</span>
                          {assessment.timeLimitMinutes && (
                            <span>
                              <Clock size={12} style={{ marginRight: 3 }} />
                              {assessment.timeLimitMinutes} phút
                            </span>
                          )}
                          {assessment.startDate && <span>📅 {fmtDate(assessment.startDate)}</span>}
                          {assessment.submissionCount !== null &&
                            assessment.submissionCount > 0 && (
                              <span>👥 {assessment.submissionCount} bài nộp</span>
                            )}
                        </div>

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
                            onClick={() =>
                              navigate(`/teacher/assessments/${assessment.assessmentId}`)
                            }
                          >
                            Xem chi tiết
                          </button>
                          <button
                            className="btn danger"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                            disabled={removeMutation.isPending}
                            onClick={() => void handleRemove(assessment.assessmentId)}
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
        </section>
      </div>

      {showAddModal && (
        <AddAssessmentModal
          courseId={courseId!}
          existingAssessmentIds={existingIds}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
