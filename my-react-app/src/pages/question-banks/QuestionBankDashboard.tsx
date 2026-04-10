import { useMemo, useState } from 'react';
import { BookOpen, Eye, EyeOff, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCreateQuestionBank,
  useDeleteQuestionBank,
  useGetMyQuestionBanks,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import '../../styles/module-refactor.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE';

const visibilityFilters: VisibilityFilter[] = ['ALL', 'PUBLIC', 'PRIVATE'];

const visibilityLabel: Record<VisibilityFilter, string> = {
  ALL: 'Tất cả',
  PUBLIC: 'Công khai',
  PRIVATE: 'Riêng tư',
};

export function QuestionBankDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<QuestionBankResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionBanks(
    page,
    size,
    'createdAt',
    'DESC',
    true,
  );

  const createMutation = useCreateQuestionBank();
  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const banks = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;

  // Safety fallback while backend search/filter is being finalized.
  const filtered = useMemo(() => {
    return banks.filter((bank) => {
      if (visibilityFilter === 'PUBLIC' && !bank.isPublic) return false;
      if (visibilityFilter === 'PRIVATE' && bank.isPublic) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        bank.name.toLowerCase().includes(q) ||
        (bank.description?.toLowerCase().includes(q) ?? false) ||
        (bank.teacherName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [banks, search, visibilityFilter]);

  async function saveQuestionBank(payload: QuestionBankRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      return;
    }

    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, request: payload });
  }

  async function handleDelete(bank: QuestionBankResponse) {
    const confirmed = globalThis.confirm(
      `Xóa ngân hàng "${bank.name}"? Hành động này sẽ gỡ liên kết câu hỏi khỏi ngân hàng.`
    );
    if (!confirmed) return;
    await deleteMutation.mutateAsync(bank.id);
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
              <h2>Ngân hàng câu hỏi</h2>
              <p>
                Quản lý kho câu hỏi theo từng nhóm nội dung và cấu hình chia sẻ cho giáo viên khác.
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
              <Plus size={14} />
              Tạo ngân hàng mới
            </button>
          </header>

          <section className="hero-card">
            <p className="hero-kicker">Phân tách trách nhiệm</p>
            <h2>Duyệt, phê duyệt và chỉnh sửa câu hỏi thực hiện tại đây</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn secondary" onClick={() => navigate('/teacher/question-templates')}>
                Mở Mẫu câu hỏi
              </button>
              <button className="btn" onClick={() => navigate('/teacher/assessment-builder')}>
                Sang Trình tạo đề để lắp đề
              </button>
            </div>
          </section>

          <div className="toolbar">
            <label className="row" style={{ minWidth: 260 }}>
              <Search size={15} />
              <input
                className="input"
                style={{ border: 0, padding: 0, width: '100%' }}
                placeholder="Tìm ngân hàng câu hỏi"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </label>

            <div className="pill-group">
              {visibilityFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn ${visibilityFilter === item ? 'active' : ''}`}
                  onClick={() => {
                    setVisibilityFilter(item);
                    setPage(0);
                  }}
                >
                  {visibilityLabel[item]}
                </button>
              ))}
            </div>

            <button className="btn secondary" onClick={() => void refetch()}>
              <RefreshCw size={14} />
              Làm mới
            </button>
          </div>

          {isLoading && <div className="empty">Đang tải danh sách ngân hàng câu hỏi...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải danh sách ngân hàng câu hỏi'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty">Không tìm thấy ngân hàng câu hỏi phù hợp.</div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid-cards">
              {filtered.map((bank) => (
                <article key={bank.id} className="data-card">
                  <div className="row">
                    <span className={`badge ${bank.isPublic ? 'published' : 'draft'}`}>
                      {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                    </span>
                    <span className="muted">{bank.questionCount ?? 0} câu hỏi</span>
                  </div>

                  <div>
                    <h3>{bank.name}</h3>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {bank.description || 'Không có mô tả'}
                    </p>
                  </div>

                  <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                    <span className="muted">Giáo viên: {bank.teacherName || 'Không xác định'}</span>
                    <span className="muted">
                      Chapter: {bank.chapterTitle || bank.chapterId || 'Chưa gán chapter'}
                    </span>
                  </div>

                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button
                      className="btn secondary"
                      onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                    >
                      <BookOpen size={14} />
                      Chi tiết
                    </button>

                    <button
                      className="btn secondary"
                      onClick={() => togglePublicMutation.mutate(bank.id)}
                    >
                      {bank.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                      {bank.isPublic ? 'Chuyển riêng tư' : 'Chia sẻ công khai'}
                    </button>

                    <button
                      className="btn secondary"
                      onClick={() => {
                        setMode('edit');
                        setSelected(bank);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                      Chỉnh sửa
                    </button>

                    <button className="btn danger" onClick={() => void handleDelete(bank)}>
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </button>
              <span className="muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </button>
            </div>
          )}

          <QuestionBankFormModal
            isOpen={formOpen}
            mode={mode}
            initialData={selected}
            onClose={() => setFormOpen(false)}
            onSubmit={saveQuestionBank}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
