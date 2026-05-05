import {
  BookOpen,
  Copy,
  FileText,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Send,
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
  useMyAssessments,
  usePublishAssessment,
  useUnpublishAssessment,
  useUpdateAssessment,
} from '../../hooks/useAssessment';
import { useDebounce } from '../../hooks/useDebounce';
import '../../styles/module-refactor.css';
import type { AssessmentRequest, AssessmentResponse, AssessmentStatus } from '../../types';
import '../courses/TeacherCourses.css';
import { AssessmentBuilderFlowBody } from './AssessmentBuilderFlow';
import AssessmentModal from './AssessmentModal';
import './TeacherAssessments.css';

const statusFilters: Array<'ALL' | AssessmentStatus> = ['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'];

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
  const [view, setView] = useState<'create' | 'manage'>('manage');

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

  const { showToast } = useToast();

  const assessments = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;
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
                <h2>{view === 'create' ? 'Tạo đề' : 'Quản lí đề thi'}</h2>
               
              </div>
              <p className="header-sub">
                {view === 'create'
                  ? 'Tạo đề mới từ ma trận đã duyệt hoặc tạo thủ công.'
                  : 'Quản lý vòng đời các đề đã có.'}
              </p>
            </div>

            {/* Slide-style toggle: Trình tạo đề ↔ Quản lí đề */}
            <div
              role="tablist"
              aria-label="Chuyển chế độ"
              style={{
                display: 'inline-flex',
                position: 'relative',
                background: '#f1f5f9',
                borderRadius: 999,
                padding: 4,
                border: '1px solid #e2e8f0',
                alignSelf: 'center',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: view === 'create' ? 4 : '50%',
                  width: 'calc(50% - 4px)',
                  background: '#fff',
                  borderRadius: 999,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)',
                  transition: 'left 0.22s ease',
                }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={view === 'create'}
                onClick={() => setView('create')}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '6px 18px',
                  border: 'none',
                  background: 'transparent',
                  color: view === 'create' ? '#0f172a' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Tạo đề
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'manage'}
                onClick={() => setView('manage')}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '6px 18px',
                  border: 'none',
                  background: 'transparent',
                  color: view === 'manage' ? '#0f172a' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Quản lí đề
              </button>
            </div>
          </header>

          {/* Single-view layout: only one panel visible at a time, controlled by the slide toggle. */}
          <div
            className="create-exam-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.25rem',
              alignItems: 'start',
            }}
          >
            {/* ── Tạo đề ── */}
            {view === 'create' && <AssessmentBuilderFlowBody />}

            {/* ── Quản lí đề ── */}
            {view === 'manage' && (
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
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
              {assessments.map((assessment) => {
                const showTags =
                  assessment.assessmentMode === 'MATRIX_BASED' ||
                  !!assessment.examMatrixGradeLevel ||
                  !!assessment.examMatrixName;
                return (
                  <article key={assessment.id} className="tassess-card">
                    {/* ── Header: status + primary action ── */}
                    <header className="tassess-card__header">
                      <span
                        className="tassess-card__status"
                        data-status={assessment.status}
                      >
                        {cardStatusLabel[assessment.status]}
                      </span>

                      {assessment.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="btn btn--feat-emerald tassess-card__primary"
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
                          <Send size={13} />
                          Xuất bản
                        </button>
                      )}

                      {assessment.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          className="btn warn tassess-card__primary"
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
                          <Lock size={13} />
                          Đóng
                        </button>
                      )}
                    </header>

                    {/* ── Body: title, description, meta, tags ── */}
                    <div className="tassess-card__body">
                      <h3 className="tassess-card__title">{assessment.title}</h3>
                      <p className="tassess-card__desc">
                        {assessment.description ||
                          (assessment.assessmentMode === 'MATRIX_BASED'
                            ? 'Tự sinh từ ma trận đề.'
                            : 'Không có mô tả.')}
                      </p>

                      <div className="tassess-card__meta">
                        <span>{assessment.totalQuestions} câu hỏi</span>
                        <span className="tassess-card__meta-sep">·</span>
                        <span>{assessment.totalPoints} điểm</span>
                        {assessment.timeLimitMinutes != null && (
                          <>
                            <span className="tassess-card__meta-sep">·</span>
                            <span>{assessment.timeLimitMinutes} phút</span>
                          </>
                        )}
                        {assessment.submissionCount > 0 && (
                          <>
                            <span className="tassess-card__meta-sep">·</span>
                            <span>{assessment.submissionCount} lượt nộp</span>
                          </>
                        )}
                      </div>

                      {showTags && (
                        <div className="tassess-card__tags">
                          {assessment.assessmentMode === 'MATRIX_BASED' && (
                            <span className="tassess-card__tag">Theo ma trận</span>
                          )}
                          {assessment.examMatrixGradeLevel && (
                            <span className="tassess-card__tag">
                              Lớp {assessment.examMatrixGradeLevel}
                            </span>
                          )}
                          {assessment.examMatrixName && (
                            <span
                              className="tassess-card__tag"
                              title={assessment.examMatrixName}
                            >
                              {assessment.examMatrixName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Footer: secondary actions ── */}
                    <footer className="tassess-card__footer">
                      <div className="tassess-card__actions">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
                        >
                          <BookOpen size={13} />
                          Chi tiết
                        </button>
                        {assessment.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setMode('edit');
                              setSelected(assessment);
                              setOpenForm(true);
                            }}
                          >
                            <Pencil size={13} />
                            Chỉnh sửa
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setCloneTarget(assessment)}
                        >
                          <Copy size={13} />
                          Nhân bản
                        </button>
                        {assessment.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            className="btn"
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
                                      err instanceof Error
                                        ? err.message
                                        : 'Không thể hủy xuất bản.',
                                  }),
                              })
                            }
                          >
                            Hủy xuất bản
                          </button>
                        )}
                      </div>

                      {assessment.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="btn tassess-card__delete"
                          aria-label="Xóa"
                          title="Xóa"
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
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
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
            )}
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
