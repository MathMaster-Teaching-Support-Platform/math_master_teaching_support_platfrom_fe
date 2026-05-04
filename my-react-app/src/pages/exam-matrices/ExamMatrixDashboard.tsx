import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Edit,
  Eye,
  FileText,
  Grid2x2,
  Library,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useApproveMatrix,
  useCreateExamMatrix,
  useDeleteExamMatrix,
  useGetMyExamMatricesPaged,
  useResetMatrix,
  useUpdateExamMatrix,
} from '../../hooks/useExamMatrix';
import '../../styles/module-refactor.css';
import {
  MatrixStatus,
  type ExamMatrixRequest,
  type ExamMatrixResponse,
} from '../../types/examMatrix';
import '../courses/TeacherCourses.css';
import './ExamMatrixDashboard.css';
import { ExamMatrixFormModal } from './ExamMatrixFormModal';

const filters: Array<'ALL' | MatrixStatus> = [
  'ALL',
  MatrixStatus.DRAFT,
  MatrixStatus.APPROVED,
  MatrixStatus.LOCKED,
];

const statusClass: Record<MatrixStatus, string> = {
  DRAFT: 'badge draft',
  APPROVED: 'badge approved',
  LOCKED: 'badge locked',
};

const filterLabel: Record<'ALL' | MatrixStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

const cardStatusLabel: Record<MatrixStatus, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

export function ExamMatrixDashboard() {
  const navigate = useNavigate();
  const [navToDetailPending, startNavigateDetail] = useTransition();
  const [pendingDetailId, setPendingDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatrixStatus>('ALL');
  const [page, setPage] = useState(0);
  const size = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<ExamMatrixResponse | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, isError, error, refetch } = useGetMyExamMatricesPaged({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  });
  const createMutation = useCreateExamMatrix();
  const updateMutation = useUpdateExamMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();

  const { showToast } = useToast();

  const matrices = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      total: totalElements,
      draft: matrices.filter((m) => m.status === MatrixStatus.DRAFT).length,
      approved: matrices.filter((m) => m.status === MatrixStatus.APPROVED).length,
      locked: matrices.filter((m) => m.status === MatrixStatus.LOCKED).length,
    }),
    [matrices, totalElements]
  );

  async function handleSave(payload: ExamMatrixRequest) {
    try {
      if (mode === 'create') {
        const response = await createMutation.mutateAsync(payload);
        showToast({ type: 'success', message: 'Tạo ma trận đề thành công.' });
        const newMatrixId = response.result?.id;
        if (newMatrixId) {
          navigate(`/teacher/exam-matrices/${newMatrixId}`);
        }
        return;
      }
      if (!selected) return;
      await updateMutation.mutateAsync({ matrixId: selected.id, request: payload });
      showToast({ type: 'success', message: 'Cập nhật ma trận đề thành công.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu ma trận đề.',
      });
    }
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page exam-matrix-dashboard-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Ma trận đề</h2>
                {!isLoading && <span className="count-chip">{totalElements}</span>}
              </div>
              <p className="header-sub">
                {stats.approved} đã phê duyệt • {stats.locked} đã khóa
              </p>
            </div>
            <button
              type="button"
              className="btn btn--feat-indigo"
              onClick={() => {
                setMode('create');
                setSelected(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} />
              Tạo draft ma trận
            </button>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Grid2x2 size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng ma trận</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.draft}</h3>
                <p>Bản nháp</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.approved}</h3>
                <p>Đã phê duyệt</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Lock size={20} />
              </div>
              <div>
                <h3>{stats.locked}</h3>
                <p>Đã khóa</p>
              </div>
            </div>
          </div>

          {/* ── Workflow hint ── */}
          <section className="hero-card exam-matrix-workflow-hero" aria-label="Luồng ma trận đề">
            <p className="hero-kicker">Luồng làm việc</p>
            <h2 className="exam-matrix-hero-title">Từ ma trận đến bài kiểm tra hoàn chỉnh</h2>
            <div className="exam-matrix-wf-grid">
              <div className="exam-matrix-wf-step exam-matrix-wf-step--1">
                <div className="exam-matrix-wf-step__head">
                  <span className="exam-matrix-wf-step__num" aria-hidden>
                    1
                  </span>
                  <p className="exam-matrix-wf-step__title">Tạo draft</p>
                </div>
                <p className="exam-matrix-wf-step__desc">
                  Đặt tên ma trận, mô tả và mục tiêu câu hỏi.
                </p>
              </div>
              <div className="exam-matrix-wf-step exam-matrix-wf-step--2">
                <div className="exam-matrix-wf-step__head">
                  <span className="exam-matrix-wf-step__num" aria-hidden>
                    2
                  </span>
                  <p className="exam-matrix-wf-step__title">Thêm cột phân bố</p>
                </div>
                <p className="exam-matrix-wf-step__desc">
                  Định nghĩa mức nhận thức, chương, số câu và điểm.
                </p>
              </div>
              <div className="exam-matrix-wf-step exam-matrix-wf-step--3">
                <div className="exam-matrix-wf-step__head">
                  <span className="exam-matrix-wf-step__num" aria-hidden>
                    3
                  </span>
                  <p className="exam-matrix-wf-step__title">Phê duyệt &amp; xuất</p>
                </div>
                <p className="exam-matrix-wf-step__desc">
                  Phê duyệt ma trận rồi dùng ở Trình tạo đề.
                </p>
              </div>
            </div>

            <div className="exam-matrix-wf-actions">
              <button
                type="button"
                className="btn secondary btn--tint-emerald"
                onClick={() => navigate('/teacher/question-banks')}
              >
                <Library size={15} />
                Ngân hàng câu hỏi
              </button>
              <button
                type="button"
                className="btn btn--feat-violet"
                onClick={() => navigate('/teacher/assessment-builder')}
              >
                <BookOpen size={15} />
                Trình tạo đề
                <ArrowRight size={14} />
              </button>
            </div>
          </section>

          {/* ── Toolbar ── */}
          <div className="toolbar exam-matrix-toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm ma trận..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
              />
            </label>

            <div className="pill-group" aria-label="Lọc theo trạng thái">
              {filters.map((filter) => {
                let count = stats.total;
                if (filter === MatrixStatus.DRAFT) count = stats.draft;
                else if (filter === MatrixStatus.APPROVED) count = stats.approved;
                else if (filter === MatrixStatus.LOCKED) count = stats.locked;
                return (
                  <button
                    key={filter}
                    type="button"
                    className={`pill-btn ${statusFilter === filter ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter(filter);
                    }}
                  >
                    {filterLabel[filter]} ({count})
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn secondary btn--tint-indigo"
              onClick={() => void refetch()}
            >
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
              {error instanceof Error ? error.message : 'Không thể tải danh sách ma trận'}
            </div>
          )}

          {!isLoading && !isError && matrices.length === 0 && (
            <div className="empty">Không có ma trận phù hợp với bộ lọc hiện tại.</div>
          )}

          {!isLoading && !isError && matrices.length > 0 && (
            <div className="grid-cards exam-matrix-card-grid">
              {matrices.map((matrix) => {
                let cardStatus: 'draft' | 'approved' | 'locked' = 'locked';
                if (matrix.status === MatrixStatus.DRAFT) cardStatus = 'draft';
                else if (matrix.status === MatrixStatus.APPROVED) cardStatus = 'approved';
                return (
                  <article
                    key={matrix.id}
                    className={`data-card course-card exam-matrix-card exam-matrix-card--${cardStatus}`}
                  >
                    <div className="exam-matrix-card__head">
                      <span className={`${statusClass[matrix.status]} exam-matrix-card__status`}>
                        {cardStatusLabel[matrix.status]}
                      </span>
                      <h3 className="exam-matrix-card__title">{matrix.name}</h3>
                    </div>

                    {(matrix.gradeLevel || matrix.subjectName) && (
                      <div className="exam-matrix-card__chips" aria-label="Môn / khối">
                        {matrix.gradeLevel && (
                          <span className="exam-matrix-card__chip">Khối {matrix.gradeLevel}</span>
                        )}
                        {matrix.subjectName && (
                          <span className="exam-matrix-card__chip">{matrix.subjectName}</span>
                        )}
                      </div>
                    )}

                    {/*
                     * Math-feeling dimension strip: "P parts × R rows · N questions · M points".
                     * Reads as the matrix's intrinsic shape so teachers can scan a list quickly
                     * without opening each one. Uses a math/serif font + tabular numerals.
                     */}
                    {(matrix.parts?.length || matrix.rowCount || matrix.totalQuestionsTarget || matrix.totalPointsTarget) && (
                      <div
                        className="exam-matrix-card__stats"
                        aria-label="Kích thước ma trận"
                      >
                        {(matrix.parts?.length ?? 0) > 0 && (
                          <span className="exam-matrix-card__stat">
                            <span className="exam-matrix-card__stat-value">
                              {matrix.parts?.length}
                            </span>
                            <span className="exam-matrix-card__stat-label">phần</span>
                          </span>
                        )}
                        {(matrix.rowCount ?? 0) > 0 && (
                          <>
                            <span className="exam-matrix-card__stat-sep">×</span>
                            <span className="exam-matrix-card__stat">
                              <span className="exam-matrix-card__stat-value">
                                {matrix.rowCount}
                              </span>
                              <span className="exam-matrix-card__stat-label">dòng</span>
                            </span>
                          </>
                        )}
                        {(matrix.totalQuestionsTarget ?? 0) > 0 && (
                          <>
                            <span className="exam-matrix-card__stat-sep">·</span>
                            <span className="exam-matrix-card__stat">
                              <span className="exam-matrix-card__stat-value">
                                {matrix.totalQuestionsTarget}
                              </span>
                              <span className="exam-matrix-card__stat-label">câu</span>
                            </span>
                          </>
                        )}
                        {(matrix.totalPointsTarget ?? 0) > 0 && (
                          <>
                            <span className="exam-matrix-card__stat-sep">·</span>
                            <span className="exam-matrix-card__stat">
                              <span className="exam-matrix-card__stat-value">
                                {matrix.totalPointsTarget}
                              </span>
                              <span className="exam-matrix-card__stat-label">điểm</span>
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="exam-matrix-card__main-cta">
                      <button
                        type="button"
                        className="btn btn--feat-indigo exam-matrix-card__primary"
                        disabled={navToDetailPending && pendingDetailId === matrix.id}
                        onClick={() => {
                          setPendingDetailId(matrix.id);
                          startNavigateDetail(() => {
                            navigate(`/teacher/exam-matrices/${matrix.id}`);
                          });
                        }}
                      >
                        {navToDetailPending && pendingDetailId === matrix.id ? (
                          <Loader2 size={14} className="exam-matrix-nav-spin" />
                        ) : (
                          <Eye size={14} />
                        )}
                        {navToDetailPending && pendingDetailId === matrix.id
                          ? 'Đang mở...'
                          : 'Xem chi tiết'}
                      </button>
                    </div>

                    {matrix.status !== MatrixStatus.LOCKED && (
                      <div className="exam-matrix-card__foot" aria-label="Thao tác bổ sung">
                        {matrix.status === MatrixStatus.DRAFT && (
                          <button
                            type="button"
                            className="exam-matrix-card__ghost-btn"
                            onClick={() => {
                              setMode('edit');
                              setSelected(matrix);
                              setFormOpen(true);
                            }}
                          >
                            <Edit size={14} />
                            Chỉnh sửa
                          </button>
                        )}

                        {matrix.status === MatrixStatus.DRAFT && (
                          <button
                            type="button"
                            className="exam-matrix-card__ghost-btn exam-matrix-card__ghost-btn--emphasis"
                            disabled={approveMutation.isPending}
                            onClick={() => {
                              approveMutation.mutate(matrix.id, {
                                onSuccess: () =>
                                  showToast({
                                    type: 'success',
                                    message: `Đã phê duyệt ma trận “${matrix.name}”.`,
                                  }),
                                onError: (err) =>
                                  showToast({
                                    type: 'error',
                                    message:
                                      err instanceof Error
                                        ? err.message
                                        : 'Không thể phê duyệt ma trận.',
                                  }),
                              });
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {approveMutation.isPending ? '...' : 'Phê duyệt'}
                          </button>
                        )}

                        {matrix.status === MatrixStatus.APPROVED && (
                          <button
                            type="button"
                            className="exam-matrix-card__ghost-btn"
                            disabled={resetMutation.isPending}
                            onClick={() => {
                              if (!globalThis.confirm(`Đặt lại ma trận "${matrix.name}" về nháp?`))
                                return;
                              resetMutation.mutate(matrix.id, {
                                onSuccess: () =>
                                  showToast({
                                    type: 'success',
                                    message: `Đã đặt lại ma trận “${matrix.name}” về nháp.`,
                                  }),
                                onError: (err) =>
                                  showToast({
                                    type: 'error',
                                    message:
                                      err instanceof Error
                                        ? err.message
                                        : 'Không thể đặt lại ma trận.',
                                  }),
                              });
                            }}
                          >
                            <RotateCcw size={14} />
                            {resetMutation.isPending ? '...' : 'Đặt lại'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="exam-matrix-card__ghost-btn exam-matrix-card__ghost-btn--danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              !globalThis.confirm(
                                `Xóa ma trận "${matrix.name}"? Hành động này không thể hoàn tác.`
                              )
                            )
                              return;
                            deleteMutation.mutate(matrix.id, {
                              onSuccess: () =>
                                showToast({
                                  type: 'success',
                                  message: `Đã xóa ma trận “${matrix.name}”.`,
                                }),
                              onError: (err) =>
                                showToast({
                                  type: 'error',
                                  message:
                                    err instanceof Error ? err.message : 'Không thể xóa ma trận.',
                                }),
                            });
                          }}
                        >
                          <Trash2 size={14} />
                          {deleteMutation.isPending ? '...' : 'Xóa'}
                        </button>
                      </div>
                    )}
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

          <ExamMatrixFormModal
            isOpen={formOpen}
            mode={mode}
            initialData={selected}
            onClose={() => setFormOpen(false)}
            onSubmit={handleSave}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
