import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Database,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Grid2x2,
  List,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  useCreateQuestionBank,
  useDeleteQuestionBank,
  useGetMyQuestionBanks,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import '../../styles/module-refactor.css';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import './QuestionBankDashboard.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE';

const visibilityFilters: VisibilityFilter[] = ['ALL', 'PUBLIC', 'PRIVATE'];

const visibilityLabel: Record<VisibilityFilter, string> = {
  ALL: 'Tất cả',
  PUBLIC: 'Công khai',
  PRIVATE: 'Riêng tư',
};

const coverGradients = [
  'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
  'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
  'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
  'linear-gradient(135deg, #164e63 0%, #0891b2 100%)',
  'linear-gradient(135deg, #831843 0%, #db2777 100%)',
];

const coverAccents = ['#93c5fd', '#86efac', '#c4b5fd', '#fdba74', '#67e8f9', '#f9a8d4'];

export function QuestionBankDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<QuestionBankResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionBanks(
    page,
    size,
    'createdAt',
    'DESC',
    true
  );

  const createMutation = useCreateQuestionBank();
  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const banks = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;

  const stats = useMemo(
    () => ({
      total: banks.length,
      public: banks.filter((b) => b.isPublic).length,
      private: banks.filter((b) => !b.isPublic).length,
    }),
    [banks]
  );

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
          {/* ── Header ── */}
          <header className="page-header qb-header-row">
            <div className="header-stack">
              <div className="header-kicker">Question Banking</div>
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Ngân hàng câu hỏi</h2>
                {!isLoading && <span className="count-chip">{banks.length}</span>}
              </div>
              <p className="header-sub">
                {stats.public} công khai • {stats.private} riêng tư
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

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <Database size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng ngân hàng</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <Globe size={20} />
              </div>
              <div>
                <h3>{stats.public}</h3>
                <p>Công khai</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Lock size={20} />
              </div>
              <div>
                <h3>{stats.private}</h3>
                <p>Riêng tư</p>
              </div>
            </div>
          </div>

          {/* ── Quick nav ── */}
          <div className="qb-quicknav">
            <div className="qb-quicknav__label">
              <span>Điều hướng nhanh</span>
            </div>
            <button
              className="qb-quicknav__item"
              onClick={() => navigate('/teacher/question-templates')}
            >
              <div className="qb-quicknav__icon qb-nav-violet">
                <FileText size={18} />
              </div>
              <div className="qb-quicknav__text">
                <span className="qb-quicknav__title">Mẫu câu hỏi</span>
                <span className="qb-quicknav__desc">Soạn mẫu, sinh và duyệt câu hỏi</span>
              </div>
              <ArrowRight size={16} className="qb-quicknav__arrow" />
            </button>
            <div className="qb-quicknav__divider" />
            <button
              className="qb-quicknav__item"
              onClick={() => navigate('/teacher/assessment-builder')}
            >
              <div className="qb-quicknav__icon qb-nav-blue">
                <ClipboardList size={18} />
              </div>
              <div className="qb-quicknav__text">
                <span className="qb-quicknav__title">Trình tạo đề</span>
                <span className="qb-quicknav__desc">Lắp câu hỏi thành đề kiểm tra</span>
              </div>
              <ArrowRight size={16} className="qb-quicknav__arrow" />
            </button>
          </div>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm ngân hàng câu hỏi..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {visibilityFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn${visibilityFilter === item ? ' active' : ''}`}
                  onClick={() => {
                    setVisibilityFilter(item);
                    setPage(0);
                  }}
                >
                  {visibilityLabel[item]}
                </button>
              ))}
            </div>

            <div
              style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <button className="btn secondary" onClick={() => void refetch()}>
                <RefreshCw size={14} />
                Làm mới
              </button>
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Hiển thị lưới"
                >
                  <Grid2x2 size={16} />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="Hiển thị danh sách"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {isError && (
            <div className="empty">
              <AlertCircle
                size={28}
                style={{ opacity: 0.5, marginBottom: 8, color: 'var(--mod-danger)' }}
              />
              <p>
                {error instanceof Error
                  ? error.message
                  : 'Không thể tải danh sách ngân hàng câu hỏi'}
              </p>
            </div>
          )}

          {/* ── Empty: filtered ── */}
          {!isLoading && !isError && filtered.length === 0 && banks.length > 0 && (
            <div className="empty">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Không tìm thấy ngân hàng phù hợp với bộ lọc.</p>
            </div>
          )}

          {/* ── Empty: no banks ── */}
          {!isLoading && !isError && banks.length === 0 && (
            <div className="empty">
              <Database size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có ngân hàng câu hỏi nào. Hãy tạo ngân hàng đầu tiên.</p>
              <button
                className="btn"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setFormOpen(true);
                }}
              >
                <Plus size={14} />
                Tạo ngân hàng mới
              </button>
            </div>
          )}

          {/* ── Cards ── */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {filtered.map((bank, idx) => (
                <article key={bank.id} className="data-card bank-card">
                  <div
                    className="bank-cover"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <div className="cover-overlay" />
                    <div className="cover-index">#{String(idx + 1).padStart(2, '0')}</div>
                    <span
                      className={`course-badge ${bank.isPublic ? 'badge-live' : 'badge-draft'}`}
                    >
                      {bank.isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
                      {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                    </span>
                    <h3 className="cover-title">{bank.name}</h3>
                  </div>

                  <div className="bank-body">
                    <p className="bank-desc">{bank.description || 'Không có mô tả'}</p>

                    <div className="bank-metrics">
                      <div className="metric">
                        <BookOpen size={13} />
                        <span>{bank.questionCount ?? 0} câu hỏi</span>
                      </div>
                      <div className="metric">
                        <span>GV: {bank.teacherName || 'Không xác định'}</span>
                      </div>
                      {(bank.chapterTitle || bank.chapterId) && (
                        <div className="metric">
                          <span>Chương: {bank.chapterTitle || bank.chapterId}</span>
                        </div>
                      )}
                    </div>

                    <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
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
                        {bank.isPublic ? 'Riêng tư' : 'Công khai'}
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
                    </div>

                    <div className="bank-footer">
                      <div />
                      <div className="bank-actions">
                        <button
                          className="btn danger-outline"
                          onClick={() => void handleDelete(bank)}
                        >
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>
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
