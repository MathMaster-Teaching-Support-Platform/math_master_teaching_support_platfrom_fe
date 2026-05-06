import {
  BookOpen,
  Database,
  Eye,
  EyeOff,
  Grid2x2,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  QbCognitiveDistribution,
  QbEmptyState,
  QbErrorState,
  QbFilterPills,
  QbPageHeader,
  QbSearchInput,
  QbSkeletonCard,
  QbToolbar,
  QbViewToggle,
  QbVisibilityBadge,
  QbConfirmDialog,
} from '../../components/question-banks/qb-ui';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useCreateQuestionBank,
  useDeleteQuestionBank,
  useSearchQuestionBanks,
  useToggleQuestionBankPublicStatus,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';

import '../../styles/qb-design-system.css';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import './QuestionBankDashboard.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE';

const VISIBILITY_OPTIONS = [
  { value: 'ALL' as const, label: 'Tất cả' },
  { value: 'PUBLIC' as const, label: 'Công khai' },
  { value: 'PRIVATE' as const, label: 'Riêng tư' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function QuestionBankDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<QuestionBankResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pendingDelete, setPendingDelete] = useState<QuestionBankResponse | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, visibilityFilter, pageSize]);

  const searchParams = useMemo(() => {
    let isPublic: boolean | undefined;
    if (visibilityFilter === 'PUBLIC') isPublic = true;
    else if (visibilityFilter === 'PRIVATE') isPublic = false;
    return {
      searchTerm: debouncedSearch.trim() || undefined,
      isPublic,
      mineOnly: true,
      page,
      size: pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
    };
  }, [debouncedSearch, visibilityFilter, page, pageSize]);

  const { data, isLoading, isError, error, refetch } = useSearchQuestionBanks(searchParams);

  const createMutation = useCreateQuestionBank();
  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();

  const { showToast } = useToast();

  const banks = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const hasActiveFilters = !!debouncedSearch || visibilityFilter !== 'ALL';

  async function saveQuestionBank(payload: QuestionBankRequest) {
    // The modal's submit handler relies on onSubmit throwing on error so it can
    // surface an inline error and keep the user in the modal. Don't swallow
    // errors here — only show a success toast on success.
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      showToast({ type: 'success', message: 'Tạo ngân hàng câu hỏi thành công.' });
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, request: payload });
    showToast({ type: 'success', message: 'Cập nhật ngân hàng câu hỏi thành công.' });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    try {
      await deleteMutation.mutateAsync(target.id);
      showToast({ type: 'success', message: `Đã xóa ngân hàng "${target.name}".` });
      setPendingDelete(null);
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa ngân hàng câu hỏi.',
      });
      setPendingDelete(null);
    }
  }

  async function handleTogglePublic(bank: QuestionBankResponse) {
    try {
      await togglePublicMutation.mutateAsync(bank.id);
      showToast({
        type: 'success',
        message: bank.isPublic
          ? `Đã chuyển "${bank.name}" thành riêng tư.`
          : `Đã chia sẻ "${bank.name}" công khai.`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Không thể đổi trạng thái chia sẻ của ngân hàng.',
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
      <div className="qb-scope qb-page">
        <QbPageHeader
          title="Ngân hàng câu hỏi"
          subtitle="Tổ chức câu hỏi theo ngân hàng để dùng cho ma trận đề và bài kiểm tra."
          count={totalElements}
          countLabel={`${totalElements} ngân hàng`}
          actions={
            <button
              type="button"
              className="qb-btn qb-btn--primary"
              onClick={() => {
                setMode('create');
                setSelected(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} />
              Tạo ngân hàng mới
            </button>
          }
        />

        <QbToolbar
          actions={
            <>
              <button
                type="button"
                className="qb-btn qb-btn--secondary"
                onClick={() => void refetch()}
                disabled={isLoading}
              >
                <RefreshCw size={14} />
                <span className="qb-hide-md">Làm mới</span>
              </button>
              <QbViewToggle
                value={viewMode}
                onChange={setViewMode}
                gridIcon={<Grid2x2 size={16} />}
                listIcon={<List size={16} />}
              />
            </>
          }
        >
          <QbSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm ngân hàng câu hỏi..."
          />
          <QbFilterPills
            value={visibilityFilter}
            onChange={setVisibilityFilter}
            options={VISIBILITY_OPTIONS}
            ariaLabel="Lọc theo trạng thái chia sẻ"
          />
        </QbToolbar>

        {isLoading && (
          <div className="qb-bank-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <QbSkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <QbErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && banks.length === 0 && (
          <QbEmptyState
            icon={hasActiveFilters ? <Database size={28} /> : <Database size={28} />}
            title={
              hasActiveFilters ? 'Không có ngân hàng phù hợp' : 'Chưa có ngân hàng câu hỏi nào'
            }
            description={
              hasActiveFilters
                ? 'Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.'
                : 'Hãy tạo ngân hàng đầu tiên để bắt đầu quản lý câu hỏi cho lớp của bạn.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  className="qb-btn qb-btn--secondary"
                  onClick={() => {
                    setSearch('');
                    setVisibilityFilter('ALL');
                  }}
                >
                  Bỏ bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  className="qb-btn qb-btn--primary"
                  onClick={() => {
                    setMode('create');
                    setSelected(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus size={16} />
                  Tạo ngân hàng mới
                </button>
              )
            }
          />
        )}

        {!isLoading && !isError && banks.length > 0 && (
          <div className={`qb-bank-grid ${viewMode === 'list' ? 'qb-bank-grid--list' : ''}`}>
            {banks.map((bank) => (
              <article key={bank.id} className="qb-bank-card qb-card qb-card--hoverable">
                <div className="qb-bank-card__head">
                  <button
                    type="button"
                    className="qb-bank-card__title-btn"
                    onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                    title={bank.name}
                  >
                    <span className="qb-bank-card__icon">
                      <Database size={16} />
                    </span>
                    <span className="qb-bank-card__title qb-clamp-2">{bank.name}</span>
                  </button>
                  <QbVisibilityBadge isPublic={bank.isPublic} />
                </div>

                {bank.description && (
                  <p className="qb-bank-card__desc qb-clamp-2">{bank.description}</p>
                )}

                <div className="qb-bank-card__stat">
                  <div className="qb-bank-card__stat-head">
                    <span className="qb-text-muted">Tổng câu hỏi</span>
                    <strong className="qb-bank-card__count">
                      {(bank.questionCount ?? 0).toLocaleString('vi-VN')}
                    </strong>
                  </div>
                  <QbCognitiveDistribution
                    stats={bank.cognitiveStats}
                    total={bank.questionCount ?? 0}
                  />
                </div>

                <div className="qb-bank-card__meta">
                  {(bank.schoolGradeName || bank.gradeLevel) && (
                    <span className="qb-bank-card__meta-item">
                      <BookOpen size={12} />
                      {bank.schoolGradeName ?? `Lớp ${bank.gradeLevel}`}
                      {bank.subjectName ? ` · ${bank.subjectName}` : ''}
                    </span>
                  )}
                  <span className="qb-bank-card__meta-item">
                    <User size={12} />
                    {bank.teacherName || 'Không xác định'}
                  </span>
                </div>

                <div className="qb-bank-card__actions">
                  <button
                    type="button"
                    className="qb-btn qb-btn--secondary qb-btn--sm"
                    onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                  >
                    <BookOpen size={13} />
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--ghost qb-btn--sm"
                    disabled={togglePublicMutation.isPending}
                    onClick={() => void handleTogglePublic(bank)}
                  >
                    {bank.isPublic ? <EyeOff size={13} /> : <Eye size={13} />}
                    {bank.isPublic ? 'Riêng tư' : 'Công khai'}
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--ghost qb-btn--sm"
                    onClick={() => {
                      setMode('edit');
                      setSelected(bank);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil size={13} />
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="qb-btn qb-btn--danger-outline qb-btn--sm qb-bank-card__delete"
                    onClick={() => setPendingDelete(bank)}
                  >
                    <Trash2 size={13} />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            onPageSizeChange={(size) => setPageSize(size)}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}

        <QuestionBankFormModal
          isOpen={formOpen}
          mode={mode}
          initialData={selected}
          onClose={() => setFormOpen(false)}
          onSubmit={saveQuestionBank}
        />

        <QbConfirmDialog
          isOpen={pendingDelete !== null}
          tone="danger"
          title="Xóa ngân hàng câu hỏi?"
          message={
            pendingDelete && (
              <>
                Bạn sắp xóa <strong>"{pendingDelete.name}"</strong>. Các câu hỏi sẽ được gỡ liên
                kết khỏi ngân hàng nhưng vẫn còn trong hệ thống. Hành động này không thể hoàn tác.
              </>
            )
          }
          confirmLabel="Xóa ngân hàng"
          busy={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
}
