import { useState } from 'react';
import { CheckCircle2, Edit, Eye, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useApproveMatrix,
  useCreateExamMatrix,
  useDeleteExamMatrix,
  useGetMyExamMatrices,
  useResetMatrix,
  useUpdateExamMatrix,
} from '../../hooks/useExamMatrix';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
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

  const matrices = data?.result ?? [];
  const filtered = matrices.filter((matrix) => {
    if (statusFilter !== 'ALL' && matrix.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      matrix.name.toLowerCase().includes(q) ||
      (matrix.description?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleSave(payload: ExamMatrixRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
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
          <header className="page-header">
            <div>
              <h2>Ma trận đề</h2>
              <p>Thiết kế và quản lý chất lượng ma trận trước khi xuất bản bài kiểm tra.</p>
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
              Tạo ma trận
            </button>
          </header>

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
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`pill-btn ${statusFilter === filter ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filterLabel[filter]}
                </button>
              ))}
            </div>

            <button className="btn secondary" onClick={() => void refetch()}>
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
                <article key={matrix.id} className="data-card">
                  <div className="row">
                    <span className={statusClass[matrix.status]}>
                      {cardStatusLabel[matrix.status]}
                    </span>
                    <span className="muted">{matrix.templateMappingCount} ánh xạ</span>
                  </div>

                  <div>
                    <h3>{matrix.name}</h3>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {matrix.description || 'Không có mô tả'}
                    </p>
                  </div>

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button
                      className="btn secondary"
                      onClick={() => navigate(`/teacher/exam-matrices/${matrix.id}`)}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </button>

                    {matrix.status === MatrixStatus.DRAFT && (
                      <button
                        className="btn secondary"
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
                      <button className="btn" onClick={() => approveMutation.mutate(matrix.id)}>
                        <CheckCircle2 size={14} />
                        Phê duyệt
                      </button>
                    )}

                    {matrix.status === MatrixStatus.APPROVED && (
                      <button className="btn warn" onClick={() => resetMutation.mutate(matrix.id)}>
                        <RotateCcw size={14} />
                        Đặt lại
                      </button>
                    )}

                    {matrix.status !== MatrixStatus.LOCKED && (
                      <button
                        className="btn danger"
                        onClick={() => deleteMutation.mutate(matrix.id)}
                      >
                        <Trash2 size={14} />
                        Xóa
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
