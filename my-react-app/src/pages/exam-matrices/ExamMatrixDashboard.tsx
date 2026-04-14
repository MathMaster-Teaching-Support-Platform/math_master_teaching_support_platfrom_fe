import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Edit,
  Eye,
  FileText,
  Grid2x2,
  Library,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useApproveMatrix,
  useCreateExamMatrix,
  useDeleteExamMatrix,
  useGetMyExamMatrices,
  useResetMatrix,
  useUpdateExamMatrix,
} from '../../hooks/useExamMatrix';
import '../../styles/module-refactor.css';
import {
  MatrixStatus,
  type ExamMatrixRequest,
  type ExamMatrixResponse,
} from '../../types/examMatrix';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatrixStatus>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<ExamMatrixResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetMyExamMatrices();
  const createMutation = useCreateExamMatrix();
  const updateMutation = useUpdateExamMatrix();
  const deleteMutation = useDeleteExamMatrix();
  const approveMutation = useApproveMatrix();
  const resetMutation = useResetMatrix();

  const matrices = useMemo(() => data?.result ?? [], [data]);

  const stats = useMemo(
    () => ({
      total: matrices.length,
      draft: matrices.filter((m) => m.status === MatrixStatus.DRAFT).length,
      approved: matrices.filter((m) => m.status === MatrixStatus.APPROVED).length,
      locked: matrices.filter((m) => m.status === MatrixStatus.LOCKED).length,
    }),
    [matrices]
  );

  const filtered = matrices.filter((matrix) => {
    if (statusFilter !== 'ALL' && matrix.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (matrix.name ?? '').toLowerCase().includes(q) ||
      (matrix.description?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleSave(payload: ExamMatrixRequest) {
    if (mode === 'create') {
      const response = await createMutation.mutateAsync(payload);
      const newMatrixId = response.result?.id;
      if (newMatrixId) {
        navigate(`/teacher/exam-matrices/${newMatrixId}`);
      }
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ matrixId: selected.id, request: payload });
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          {/* ── Header ── */}
          <header className="page-header">
            <div className="header-stack">
              <div className="header-kicker">Exam matrix management</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Ma trận đề của tôi</h2>
                {!isLoading && <span className="count-chip">{matrices.length}</span>}
              </div>
              <p className="header-sub">
                {stats.approved} đã phê duyệt • {stats.locked} đã khóa
              </p>
            </div>
            <button
              className="btn"
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
          <section className="hero-card">
            <p className="hero-kicker">Luồng làm việc</p>
            <h2 style={{ marginBottom: '1.1rem' }}>Từ ma trận đến bài kiểm tra hoàn chỉnh</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--mod-slate-50, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--mod-slate-100)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--mod-ink)' }}>
                    Tạo draft
                  </strong>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.79rem',
                    color: 'var(--mod-muted, #64748b)',
                    lineHeight: 1.45,
                  }}
                >
                  Đặt tên ma trận, mô tả và mục tiêu câu hỏi.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--mod-slate-50, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--mod-slate-100)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#f0fdf4',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--mod-ink)' }}>
                    Thêm cột phân bố
                  </strong>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.79rem',
                    color: 'var(--mod-muted, #64748b)',
                    lineHeight: 1.45,
                  }}
                >
                  Định nghĩa mức nhận thức, chương, số câu và điểm.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--mod-slate-50, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--mod-slate-100)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#faf5ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--mod-ink)' }}>
                    Phê duyệt & xuất
                  </strong>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.79rem',
                    color: 'var(--mod-muted, #64748b)',
                    lineHeight: 1.45,
                  }}
                >
                  Phê duyệt ma trận rồi dùng ở Trình tạo đề.
                </p>
              </div>
            </div>

            <div className="row" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
              <button
                className="btn secondary"
                onClick={() => navigate('/teacher/question-banks')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Library size={15} />
                Ngân hàng câu hỏi
              </button>
              <button
                className="btn"
                onClick={() => navigate('/teacher/assessment-builder')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <BookOpen size={15} />
                Trình tạo đề
                <ArrowRight size={14} />
              </button>
            </div>
          </section>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: '0', padding: 0, width: '100%' }}
                placeholder="Tìm ma trận"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="pill-group">
              {filters.map((filter) => {
                let count = stats.total;
                if (filter === MatrixStatus.DRAFT) count = stats.draft;
                else if (filter === MatrixStatus.APPROVED) count = stats.approved;
                else if (filter === MatrixStatus.LOCKED) count = stats.locked;
                return (
                  <button
                    key={filter}
                    className={`pill-btn ${statusFilter === filter ? 'active' : ''}`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filterLabel[filter]} ({count})
                  </button>
                );
              })}
            </div>

            <button
              className="btn secondary"
              onClick={() => void refetch()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && <div className="empty">Đang tải danh sách ma trận...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách ma trận'}
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Không có ma trận phù hợp với bộ lọc hiện tại.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((matrix) => (
                <article
                  key={matrix.id}
                  className="data-card"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  {/* Top meta row */}
                  <div
                    className="row"
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span className={statusClass[matrix.status]}>
                      {cardStatusLabel[matrix.status]}
                    </span>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>
                      {matrix.rowCount ?? 0} dòng ma trận
                    </span>
                  </div>

                  {/* Title + description */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 6 }}>{matrix.name}</h3>
                    <p className="muted" style={{ fontSize: '0.83rem', lineHeight: 1.45 }}>
                      {matrix.description || 'Không có mô tả'}
                    </p>
                  </div>

                  {/* Grade / Subject meta */}
                  {(matrix.gradeLevel || matrix.subjectName) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {matrix.gradeLevel && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 500,
                          }}
                        >
                          Khối {matrix.gradeLevel}
                        </span>
                      )}
                      {matrix.subjectName && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: '#f0fdf4',
                            color: '#15803d',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 500,
                          }}
                        >
                          {matrix.subjectName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Primary action */}
                  <button
                    className="btn"
                    onClick={() => navigate(`/teacher/exam-matrices/${matrix.id}`)}
                  >
                    <Eye size={14} />
                    Xem chi tiết
                  </button>

                  {/* Secondary actions */}
                  <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                    {matrix.status === MatrixStatus.DRAFT && (
                      <button
                        className="btn secondary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                        onClick={() => {
                          setMode('edit');
                          setSelected(matrix);
                          setFormOpen(true);
                        }}
                      >
                        <Edit size={13} />
                        Chỉnh sửa
                      </button>
                    )}

                    {matrix.status === MatrixStatus.DRAFT && (
                      <button
                        className="btn"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                        disabled={approveMutation.isPending}
                        onClick={() => {
                          if (!globalThis.confirm(`Phê duyệt ma trận "${matrix.name}"?`)) return;
                          approveMutation.mutate(matrix.id);
                        }}
                      >
                        <CheckCircle2 size={13} />
                        {approveMutation.isPending ? '...' : 'Phê duyệt'}
                      </button>
                    )}

                    {matrix.status === MatrixStatus.APPROVED && (
                      <button
                        className="btn warn"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                        disabled={resetMutation.isPending}
                        onClick={() => {
                          if (!globalThis.confirm(`Đặt lại ma trận "${matrix.name}" về nháp?`))
                            return;
                          resetMutation.mutate(matrix.id);
                        }}
                      >
                        <RotateCcw size={13} />
                        {resetMutation.isPending ? '...' : 'Đặt lại'}
                      </button>
                    )}

                    {matrix.status !== MatrixStatus.LOCKED && (
                      <button
                        className="btn danger"
                        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            !globalThis.confirm(
                              `Xóa ma trận "${matrix.name}"? Hành động này không thể hoàn tác.`
                            )
                          )
                            return;
                          deleteMutation.mutate(matrix.id);
                        }}
                      >
                        <Trash2 size={13} />
                        {deleteMutation.isPending ? '...' : 'Xóa'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

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
