import {
  AlertCircle,
  BookOpen,
  Database,
  Eye,
  EyeOff,
  Grid2x2,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OverflowMenu, { type OverflowMenuItem } from '../../components/common/OverflowMenu';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
// import { MatrixStatsTree } from '../../components/question-banks/MatrixStatsTree';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCreateQuestionBank,
  useDeleteQuestionBank,
  useSearchQuestionBanks,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';

import '../../styles/module-refactor.css';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import '../courses/TeacherCourses.css';
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

// Unused for now - kept for future use
// const cognitiveShortLabel: Record<string, string> = {
//   NHAN_BIET: 'NB',
//   THONG_HIEU: 'TH',
//   VAN_DUNG: 'VD',
//   VAN_DUNG_CAO: 'VDC',
//   REMEMBER: 'NB',
//   UNDERSTAND: 'TH',
//   APPLY: 'VD',
//   ANALYZE: 'PT',
//   EVALUATE: 'DG',
//   CREATE: 'ST',
// };

export function QuestionBankDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL');
  const [page, setPage] = useState(0);
  const size = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<QuestionBankResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, visibilityFilter]);

  const searchParams = useMemo(() => {
    let isPublic: boolean | undefined;
    if (visibilityFilter === 'PUBLIC') isPublic = true;
    else if (visibilityFilter === 'PRIVATE') isPublic = false;
    return {
      searchTerm: debouncedSearch.trim() || undefined,
      isPublic,
      mineOnly: true,
      page,
      size,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
    };
  }, [debouncedSearch, visibilityFilter, page, size]);

  const { data, isLoading, isError, error, refetch } = useSearchQuestionBanks(searchParams);

  const createMutation = useCreateQuestionBank();
  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const { showToast } = useToast();

  const banks = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      total: totalElements,
      public: banks.filter((b) => b.isPublic).length,
      private: banks.filter((b) => !b.isPublic).length,
    }),
    [banks, totalElements]
  );

  async function saveQuestionBank(payload: QuestionBankRequest) {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        showToast({ type: 'success', message: 'Tạo ngân hàng câu hỏi thành công.' });
        return;
      }
      if (!selected) return;
      await updateMutation.mutateAsync({ id: selected.id, request: payload });
      showToast({ type: 'success', message: 'Cập nhật ngân hàng câu hỏi thành công.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu ngân hàng câu hỏi.',
      });
    }
  }

  async function handleDelete(bank: QuestionBankResponse) {
    const confirmed = globalThis.confirm(
      `Xóa ngân hàng "${bank.name}"? Hành động này sẽ gỡ liên kết câu hỏi khỏi ngân hàng.`
    );
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(bank.id);
      showToast({ type: 'success', message: `Đã xóa ngân hàng “${bank.name}”.` });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa ngân hàng câu hỏi.',
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
        <section className="module-page teacher-courses-page question-bank-dashboard-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Ngân hàng câu hỏi</h2>
                {!isLoading && <span className="count-chip">{totalElements}</span>}
              </div>
              <p className="header-sub">
                {stats.public} công khai • {stats.private} riêng tư
              </p>
            </div>
            <button
              type="button"
              className="btn btn--feat-emerald"
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

          {/* ── Empty: no results ── */}
          {!isLoading &&
            !isError &&
            banks.length === 0 &&
            (debouncedSearch || visibilityFilter !== 'ALL') && (
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
                type="button"
                className="btn btn--feat-emerald"
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
          {!isLoading && !isError && banks.length > 0 && (
            <div className={`grid-cards bank-card-grid${viewMode === 'list' ? ' list-view' : ''}`}>
              {banks.map((bank, idx) => {
                const openDetail = () => navigate(`/teacher/question-banks/${bank.id}`);
                const overflowItems: OverflowMenuItem[] = [
                  {
                    key: 'visibility',
                    label: bank.isPublic ? 'Đặt riêng tư' : 'Đặt công khai',
                    icon: bank.isPublic ? <EyeOff size={14} /> : <Eye size={14} />,
                    onSelect: () => togglePublicMutation.mutate(bank.id),
                  },
                  {
                    key: 'edit',
                    label: 'Chỉnh sửa',
                    icon: <Pencil size={14} />,
                    onSelect: () => {
                      setMode('edit');
                      setSelected(bank);
                      setFormOpen(true);
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Xóa',
                    icon: <Trash2 size={14} />,
                    danger: true,
                    onSelect: () => {
                      void handleDelete(bank);
                    },
                  },
                ];
                return (
                  <article
                    key={bank.id}
                    className="data-card bank-card"
                    role="button"
                    tabIndex={0}
                    onClick={openDetail}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetail();
                      }
                    }}
                  >
                    <div
                      className="bank-cover"
                      style={{
                        background: coverGradients[idx % coverGradients.length],
                        color: coverAccents[idx % coverAccents.length],
                      }}
                    >
                      <div className="cover-overlay" />
                      {/* Subtle SVG watermark — large icon at low opacity behind the title. */}
                      <Database className="cover-watermark" size={120} aria-hidden="true" />
                      <div className="cover-meta-row">
                        <span className="cover-index">#{String(idx + 1).padStart(2, '0')}</span>
                        <span
                          className={`course-badge ${bank.isPublic ? 'badge-live' : 'badge-draft'}`}
                        >
                          {bank.isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
                          {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>
                      <h3 className="cover-title">{bank.name}</h3>
                    </div>

                    <div className="bank-body">
                      <p className="bank-desc">{bank.description || 'Không có mô tả'}</p>

                      <div className="bank-metrics">
                        <div className="metric">
                          <span className="metric__icon">
                            <BookOpen size={14} />
                          </span>
                          <span className="metric__value">{bank.questionCount ?? 0}</span>
                          <span className="metric__label">câu hỏi</span>
                        </div>
                        <div className="metric metric--muted">
                          <span className="metric__label">
                            Giáo viên: {bank.teacherName || 'Không xác định'}
                          </span>
                        </div>
                      </div>

                      <div className="bank-footer">
                        <button
                          type="button"
                          className="btn btn--feat-blue bank-card__primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetail();
                          }}
                        >
                          <BookOpen size={14} />
                          Chi tiết
                        </button>
                        <OverflowMenu
                          items={overflowItems}
                          ariaLabel="Thao tác bổ sung"
                          align="right"
                        />
                      </div>
                    </div>
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

/* ISSUE-12: MatrixStatsLoader hidden temporarily
// Helper component to load matrix stats on demand
function MatrixStatsLoader({ bankId }: { bankId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['questionBank', 'matrixStats', bankId],
    queryFn: async () => {
      const response = await questionBankService.getMatrixStats(bankId);
      return response.result || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <div className="matrix-stats-loading">Đang tải...</div>;
  }

  if (isError || !data) {
    return <div className="matrix-stats-error">Không thể tải thống kê</div>;
  }

  return <MatrixStatsTree stats={data} />;
}
*/
