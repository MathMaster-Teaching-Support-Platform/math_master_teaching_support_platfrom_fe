import {
  BookOpen,
  Copy,
  FileText,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useToast } from '../../context/ToastContext';
import {
  useCloneAssessment,
  useCloseAssessment,
  useCreateAssessment,
  useDeleteAssessment,
  useGenerateAssessmentFromMatrix,
  useMyAssessments,
  usePublishAssessment,
  useUnpublishAssessment,
  useUpdateAssessment,
} from '../../hooks/useAssessment';
import { useDebounce } from '../../hooks/useDebounce';
import { useGetMyExamMatrices } from '../../hooks/useExamMatrix';
import '../../styles/module-refactor.css';
import type { AssessmentRequest, AssessmentResponse, AssessmentStatus } from '../../types';
import { MatrixStatus } from '../../types/examMatrix';
import '../courses/TeacherCourses.css';
import AssessmentModal from './AssessmentModal';

const statusFilters: Array<'ALL' | AssessmentStatus> = ['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'];

const statusClass: Record<AssessmentStatus, string> = {
  DRAFT: 'badge draft',
  PUBLISHED: 'badge published',
  CLOSED: 'badge closed',
};

const statusLabel: Record<'ALL' | AssessmentStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  CLOSED: 'Đã đóng',
};

const cardStatusLabel: Record<AssessmentStatus, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  CLOSED: 'Đã đóng',
};

const assessmentTypeLabel: Record<string, string> = {
  QUIZ: 'Trắc nghiệm nhanh',
  TEST: 'Bài kiểm tra',
  EXAM: 'Bài thi',
  HOMEWORK: 'Bài tập về nhà',
};

function CloneModal({
  assessment,
  isLoading,
  onClose,
  onConfirm,
}: {
  assessment: AssessmentResponse;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string, cloneQuestions: boolean) => void;
}) {
  const [newTitle, setNewTitle] = useState(`[Bản sao] ${assessment.title}`);
  const [cloneQuestions, setCloneQuestions] = useState(true);

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(520px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Nhân bản {UI_TEXT.QUIZ.toLowerCase()}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Tạo một bản nháp mới từ {UI_TEXT.QUIZ.toLowerCase()} này.
            </p>
          </div>
        </div>

        <div className="modal-body">
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Tiêu đề mới
            </p>
            <input
              className="input"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
          </label>

          <label className="row" style={{ justifyContent: 'start' }}>
            <input
              type="checkbox"
              checked={cloneQuestions}
              onChange={(event) => setCloneQuestions(event.target.checked)}
            />
            Nhân bản danh sách câu hỏi đính kèm
          </label>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn--feat-violet"
            disabled={!newTitle.trim() || isLoading}
            onClick={() => onConfirm(newTitle, cloneQuestions)}
          >
            {isLoading ? 'Đang nhân bản...' : 'Nhân bản'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherAssessments() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | AssessmentStatus>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<AssessmentResponse | null>(null);
  const [cloneTarget, setCloneTarget] = useState<AssessmentResponse | null>(null);
  const [selectedMatrixId, setSelectedMatrixId] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, isError, error, refetch } = useMyAssessments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch.trim() || undefined,
    page,
    size,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  });

  const createMutation = useCreateAssessment();
  const updateMutation = useUpdateAssessment();
  const publishMutation = usePublishAssessment();
  const unpublishMutation = useUnpublishAssessment();
  const closeMutation = useCloseAssessment();
  const deleteMutation = useDeleteAssessment();
  const cloneMutation = useCloneAssessment();
  const generateFromMatrixMutation = useGenerateAssessmentFromMatrix();
  const { data: myMatricesData } = useGetMyExamMatrices();

  const { showToast } = useToast();

  const assessments = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;
  const myMatrices = myMatricesData?.result ?? [];
  const readyMatrices = useMemo(
    () =>
      myMatrices.filter(
        (m) => m.status === MatrixStatus.APPROVED || m.status === MatrixStatus.LOCKED
      ),
    [myMatrices]
  );

  const stats = useMemo(
    () => ({
      total: totalElements,
      draft: assessments.filter((a) => a.status === 'DRAFT').length,
      published: assessments.filter((a) => a.status === 'PUBLISHED').length,
      closed: assessments.filter((a) => a.status === 'CLOSED').length,
    }),
    [assessments, totalElements]
  );

  async function saveAssessment(payload: AssessmentRequest) {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        showToast({ type: 'success', message: `Tạo ${UI_TEXT.QUIZ.toLowerCase()} thành công.` });
        return;
      }
      if (!selected) return;
      await updateMutation.mutateAsync({ id: selected.id, data: payload });
      showToast({ type: 'success', message: `Cập nhật ${UI_TEXT.QUIZ.toLowerCase()} thành công.` });
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : `Không thể lưu ${UI_TEXT.QUIZ.toLowerCase()}.`,
      });
    }
  }

  async function cloneAssessment(newTitle: string, cloneQuestions: boolean) {
    if (!cloneTarget) return;
    try {
      await cloneMutation.mutateAsync({
        id: cloneTarget.id,
        data: { newTitle, cloneQuestions },
      });
      showToast({
        type: 'success',
        message: `Đã nhân bản ${UI_TEXT.QUIZ.toLowerCase()} thành “${newTitle}”.`,
      });
      setCloneTarget(null);
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : `Không thể nhân bản ${UI_TEXT.QUIZ.toLowerCase()}.`,
      });
    }
  }

  async function generateFromMatrix() {
    if (!selectedMatrixId) return;
    try {
      const response = await generateFromMatrixMutation.mutateAsync({
        examMatrixId: selectedMatrixId,
      });
      showToast({
        type: 'success',
        message: `Tạo ${UI_TEXT.QUIZ.toLowerCase()} từ ma trận thành công.`,
      });
      const generatedAssessmentId = response.result?.id;
      setSelectedMatrixId('');
      if (generatedAssessmentId) {
        navigate(`/teacher/assessments/${generatedAssessmentId}`);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : `Không thể tạo ${UI_TEXT.QUIZ.toLowerCase()} từ ma trận.`,
      });
    }
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page teacher-assessments-page">
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Tạo đề thi</h2>
                {!isLoading && <span className="count-chip">{stats.total}</span>}
              </div>
              <p className="header-sub">
                Lắp ráp đề mới từ ma trận đã duyệt và quản lý vòng đời các đề đã có.
              </p>
            </div>
          </header>

          {/* Mind-map style: Create on the left, Manage on the right. */}
          <div
            className="create-exam-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 360px) 1fr',
              gap: '1.25rem',
              alignItems: 'start',
            }}
          >
            {/* ── LEFT: Tạo đề ── */}
            <aside
              className="data-card"
              style={{ position: 'sticky', top: '1rem', display: 'grid', gap: '0.85rem' }}
            >
              <div>
                <div
                  className="row"
                  style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}
                >
                  <Sparkles size={16} />
                  <h3 style={{ margin: 0 }}>Tạo đề</h3>
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  Chọn ma trận đã duyệt — hệ thống tự sinh đề từ ngân hàng câu hỏi.
                </p>
              </div>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Ma trận đã duyệt
                </p>
                <select
                  className="select"
                  value={selectedMatrixId}
                  onChange={(event) => setSelectedMatrixId(event.target.value)}
                >
                  <option value="">Chọn ma trận</option>
                  {readyMatrices.map((matrix) => (
                    <option key={matrix.id} value={matrix.id}>
                      {matrix.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="btn btn--feat-indigo"
                disabled={!selectedMatrixId || generateFromMatrixMutation.isPending}
                onClick={() => void generateFromMatrix()}
              >
                {generateFromMatrixMutation.isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Sinh từ ma trận
                  </>
                )}
              </button>

              <div
                style={{
                  height: 1,
                  background: 'var(--mod-border, #e5e7eb)',
                  margin: '4px 0',
                }}
              />

              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setOpenForm(true);
                }}
              >
                <Plus size={14} />
                Tạo thủ công
              </button>

              <button
                type="button"
                className="btn secondary btn--tint-indigo"
                onClick={() => navigate('/teacher/exam-matrices')}
              >
                <Ruler size={14} />
                Quản lý ma trận
              </button>

              {readyMatrices.length === 0 && (
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  Chưa có ma trận nào ở trạng thái đã duyệt. Hãy tạo và phê duyệt ma trận
                  trước.
                </p>
              )}
            </aside>

            {/* ── RIGHT: Quản lí đề ── */}
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Quản lí đề</h3>
                {!isLoading && <span className="count-chip">{stats.total}</span>}
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card stat-violet">
                  <div className="stat-icon-wrap">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3>{stats.total}</h3>
                    <p>Tổng đề</p>
                  </div>
                </div>
                <div className="stat-card stat-blue">
                  <div className="stat-icon-wrap">
                    <Pencil size={18} />
                  </div>
                  <div>
                    <h3>{stats.draft}</h3>
                    <p>Nháp</p>
                  </div>
                </div>
                <div className="stat-card stat-emerald">
                  <div className="stat-icon-wrap">
                    <Send size={18} />
                  </div>
                  <div>
                    <h3>{stats.published}</h3>
                    <p>Đã xuất bản</p>
                  </div>
                </div>
                <div className="stat-card stat-amber">
                  <div className="stat-icon-wrap">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3>{stats.closed}</h3>
                    <p>Đã đóng</p>
                  </div>
                </div>
              </div>

              <div className="toolbar">
                <label className="search-box" style={{ flex: '1 1 240px' }}>
                  <span className="search-box__icon" aria-hidden="true">
                    <Search size={15} />
                  </span>
                  <input
                    placeholder="Tìm đề..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="search-box__clear"
                      aria-label="Xóa nội dung tìm kiếm"
                      onClick={() => setSearch('')}
                    >
                      <X size={13} />
                    </button>
                  )}
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

          {isLoading && (
            <div className="skeleton-grid" aria-hidden>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}
          {isError && (
            <div className="empty">
              {error instanceof Error
                ? error.message
                : `Không thể tải danh sách ${UI_TEXT.QUIZ.toLowerCase()}`}
            </div>
          )}
          {!isLoading && !isError && assessments.length === 0 && (
            <div className="empty">Chưa có {UI_TEXT.QUIZ.toLowerCase()} nào.</div>
          )}

          {!isLoading && !isError && assessments.length > 0 && (
            <div className="grid-cards">
              {assessments.map((assessment) => (
                <article key={assessment.id} className="data-card course-card">
                  <div className="row">
                    <span className={statusClass[assessment.status]}>
                      {cardStatusLabel[assessment.status]}
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

                  <div
                    className="row"
                    style={{ justifyContent: 'start', flexWrap: 'wrap', gap: '0.5rem' }}
                  >
                    <span className="badge">{assessment.totalQuestions} câu hỏi</span>
                    <span className="badge">{assessment.totalPoints} điểm</span>
                    {assessment.timeLimitMinutes && (
                      <span className="badge">⏱ {assessment.timeLimitMinutes} phút</span>
                    )}
                    {assessment.submissionCount > 0 && (
                      <span className="badge badge-published">
                        {assessment.submissionCount} lượt nộp
                      </span>
                    )}
                  </div>

                  {/* Add matrix info row */}
                  {(assessment.examMatrixName ||
                    assessment.examMatrixGradeLevel ||
                    assessment.assessmentMode === 'MATRIX_BASED' ||
                    assessment.questionBankName) && (
                    <div
                      className="row"
                      style={{
                        justifyContent: 'start',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: 4,
                      }}
                    >
                      {assessment.examMatrixName && (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          📋 Ma trận: {assessment.examMatrixName}
                        </span>
                      )}
                      {assessment.questionBankName && (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          🗄️ Ngân hàng: {assessment.questionBankName}
                        </span>
                      )}
                      {assessment.examMatrixGradeLevel && (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          📚 Lớp {assessment.examMatrixGradeLevel}
                        </span>
                      )}
                      {assessment.assessmentMode === 'MATRIX_BASED' && (
                        <span className="badge draft" style={{ fontSize: '0.7rem' }}>
                          Matrix-based
                        </span>
                      )}
                    </div>
                  )}

                  {/* Add date info */}
                  {(assessment.startDate || assessment.endDate) && (
                    <div
                      className="row"
                      style={{
                        justifyContent: 'start',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: 4,
                      }}
                    >
                      {assessment.startDate && (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          📅 Bắt đầu: {new Date(assessment.startDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      {assessment.endDate && (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          ⏰ Hết hạn: {new Date(assessment.endDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button
                      className="btn secondary"
                      onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
                    >
                      <BookOpen size={14} />
                      Chi tiết
                    </button>

                    {assessment.status === 'DRAFT' && (
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setMode('edit');
                          setSelected(assessment);
                          setOpenForm(true);
                        }}
                      >
                        <Pencil size={14} />
                        Chỉnh sửa
                      </button>
                    )}

                    {assessment.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="btn btn--feat-emerald"
                        onClick={() =>
                          publishMutation.mutate(assessment.id, {
                            onSuccess: () =>
                              showToast({
                                type: 'success',
                                message: `Đã xuất bản ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                              }),
                            onError: (err) =>
                              showToast({
                                type: 'error',
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : `Không thể xuất bản ${UI_TEXT.QUIZ.toLowerCase()}.`,
                              }),
                          })
                        }
                      >
                        <Send size={14} />
                        Xuất bản
                      </button>
                    )}

                    {assessment.status === 'PUBLISHED' && (
                      <button
                        className="btn warn"
                        onClick={() =>
                          unpublishMutation.mutate(assessment.id, {
                            onSuccess: () =>
                              showToast({
                                type: 'success',
                                message: `Đã hủy xuất bản ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                              }),
                            onError: (err) =>
                              showToast({
                                type: 'error',
                                message:
                                  err instanceof Error ? err.message : 'Không thể hủy xuất bản.',
                              }),
                          })
                        }
                      >
                        Hủy xuất bản
                      </button>
                    )}

                    {assessment.status === 'PUBLISHED' && (
                      <button
                        className="btn warn"
                        onClick={() =>
                          closeMutation.mutate(assessment.id, {
                            onSuccess: () =>
                              showToast({
                                type: 'success',
                                message: `Đã đóng ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                              }),
                            onError: (err) =>
                              showToast({
                                type: 'error',
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : `Không thể đóng ${UI_TEXT.QUIZ.toLowerCase()}.`,
                              }),
                          })
                        }
                      >
                        <Lock size={14} />
                        Đóng
                      </button>
                    )}

                    {assessment.status === 'DRAFT' && (
                      <button
                        className="btn danger"
                        onClick={() =>
                          deleteMutation.mutate(assessment.id, {
                            onSuccess: () =>
                              showToast({
                                type: 'success',
                                message: `Đã xóa ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                              }),
                            onError: (err) =>
                              showToast({
                                type: 'error',
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : `Không thể xóa ${UI_TEXT.QUIZ.toLowerCase()}.`,
                              }),
                          })
                        }
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    )}

                    <button className="btn secondary" onClick={() => setCloneTarget(assessment)}>
                      <Copy size={14} />
                      Nhân bản
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={size}
                onChange={(p) => setPage(p)}
              />
            </div>
          </div>

          <AssessmentModal
            isOpen={openForm}
            mode={mode}
            initialData={selected}
            onClose={() => setOpenForm(false)}
            onSubmit={saveAssessment}
          />
          {cloneTarget && (
            <CloneModal
              assessment={cloneTarget}
              isLoading={cloneMutation.isPending}
              onClose={() => setCloneTarget(null)}
              onConfirm={(title, cloneQuestions) => {
                void cloneAssessment(title, cloneQuestions);
              }}
            />
          )}

        </section>
      </div>
    </DashboardLayout>
  );
}
