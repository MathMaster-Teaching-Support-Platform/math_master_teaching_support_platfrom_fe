import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Copy,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
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
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import type {
  AssessmentRequest,
  AssessmentResponse,
  AssessmentStatus,
} from '../../types';
import '../../styles/module-refactor.css';
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
            <h3>Nhân bản bài kiểm tra</h3>
            <p className="muted" style={{ marginTop: 4 }}>Tạo một bản nháp mới từ bài kiểm tra này.</p>
          </div>
        </div>

        <div className="modal-body">
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>Tiêu đề mới</p>
            <input className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
          </label>

          <label className="row" style={{ justifyContent: 'start' }}>
            <input type="checkbox" checked={cloneQuestions} onChange={(event) => setCloneQuestions(event.target.checked)} />
            Nhân bản danh sách câu hỏi đính kèm
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Hủy</button>
          <button
            className="btn"
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
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<AssessmentResponse | null>(null);
  const [cloneTarget, setCloneTarget] = useState<AssessmentResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useMyAssessments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size: 30,
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

  const assessments = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return assessments;
    const q = search.toLowerCase();
    return assessments.filter((item) => item.title.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false));
  }, [assessments, search]);

  async function saveAssessment(payload: AssessmentRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, data: payload });
  }

  async function cloneAssessment(newTitle: string, cloneQuestions: boolean) {
    if (!cloneTarget) return;
    await cloneMutation.mutateAsync({
      id: cloneTarget.id,
      data: { newTitle, cloneQuestions },
    });
    setCloneTarget(null);
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      <section className="module-page">
        <header className="page-header">
          <div>
            <h2>Bài kiểm tra</h2>
            <p>Tạo, xuất bản và quản lý vòng đời bài kiểm tra cho học sinh.</p>
          </div>
          <button
            className="btn"
            onClick={() => {
              setMode('create');
              setSelected(null);
              setOpenForm(true);
            }}
          >
            <Plus size={14} />
            Tạo bài kiểm tra
          </button>
        </header>

        <div className="toolbar">
          <label className="row" style={{ minWidth: 260 }}>
            <Search size={15} />
            <input
              className="input"
              style={{ border: 0, padding: 0, width: '100%' }}
              placeholder="Tìm bài kiểm tra"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="pill-group">
            {statusFilters.map((item) => (
              <button key={item} className={`pill-btn ${statusFilter === item ? 'active' : ''}`} onClick={() => {
                setStatusFilter(item);
                setPage(0);
              }}>
                {statusLabel[item]}
              </button>
            ))}
          </div>

          <button className="btn secondary" onClick={() => void refetch()}>
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>

        {isLoading && <div className="empty">Đang tải danh sách bài kiểm tra...</div>}
        {isError && <div className="empty">{error instanceof Error ? error.message : 'Không thể tải danh sách bài kiểm tra'}</div>}
        {!isLoading && !isError && filtered.length === 0 && <div className="empty">Chưa có bài kiểm tra nào.</div>}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid-cards">
            {filtered.map((assessment) => (
              <article key={assessment.id} className="data-card">
                <div className="row">
                  <span className={statusClass[assessment.status]}>{cardStatusLabel[assessment.status]}</span>
                  <span className="muted">{assessmentTypeLabel[assessment.assessmentType] || assessment.assessmentType}</span>
                </div>

                <div>
                  <h3>{assessment.title}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>{assessment.description || 'Không có mô tả'}</p>
                </div>

                <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                  <span className="muted">{assessment.totalQuestions} câu hỏi</span>
                  <span className="muted">{assessment.totalPoints} điểm</span>
                  <span className="muted">{assessment.submissionCount} lượt nộp</span>
                </div>

                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <button className="btn secondary" onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}>
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
                    <button className="btn" onClick={() => publishMutation.mutate(assessment.id)}>
                      <Send size={14} />
                      Xuất bản
                    </button>
                  )}

                  {assessment.status === 'PUBLISHED' && (
                    <button className="btn warn" onClick={() => unpublishMutation.mutate(assessment.id)}>
                      Hủy xuất bản
                    </button>
                  )}

                  {assessment.status === 'PUBLISHED' && (
                    <button className="btn warn" onClick={() => closeMutation.mutate(assessment.id)}>
                      <Lock size={14} />
                      Đóng
                    </button>
                  )}

                  {assessment.status === 'DRAFT' && (
                    <button className="btn danger" onClick={() => deleteMutation.mutate(assessment.id)}>
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

        {totalPages > 1 && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn secondary" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
              Trước
            </button>
            <span className="muted">Trang {page + 1} / {totalPages}</span>
            <button className="btn secondary" disabled={page >= totalPages - 1} onClick={() => setPage((prev) => prev + 1)}>
              Sau
            </button>
          </div>
        )}

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
    </DashboardLayout>
  );
}
