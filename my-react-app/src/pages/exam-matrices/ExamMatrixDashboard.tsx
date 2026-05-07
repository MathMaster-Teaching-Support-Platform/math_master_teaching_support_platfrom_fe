import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Edit,
  Eye,
  FileText,
  Grid2x2,
  LayoutGrid,
  Library,
  List,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockTeacher } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useApproveMatrix,
  useCreateExamMatrix,
  useDeleteExamMatrix,
  useGetMyExamMatricesPaged,
  useResetMatrix,
  useUpdateExamMatrix,
} from '../../hooks/useExamMatrix';
import {
  MatrixStatus,
  type ExamMatrixRequest,
  type ExamMatrixResponse,
} from '../../types/examMatrix';
import { ExamMatrixFormModal } from './ExamMatrixFormModal';
import { SimpleExamMatrixModal } from './SimpleExamMatrixModal';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

const filters: Array<'ALL' | MatrixStatus> = [
  'ALL',
  MatrixStatus.DRAFT,
  MatrixStatus.APPROVED,
  MatrixStatus.LOCKED,
];

const filterLabel: Record<'ALL' | MatrixStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  APPROVED: 'Đã phê duyệt',
  LOCKED: 'Đã khóa',
};

function statusBadgeClasses(status: MatrixStatus): string {
  if (status === MatrixStatus.APPROVED)
    return 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700';
  if (status === MatrixStatus.LOCKED)
    return 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#64748b]';
  return 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]';
}

export function ExamMatrixDashboard() {
  const navigate = useNavigate();
  const [navToDetailPending, startNavigateDetail] = useTransition();
  const [pendingDetailId, setPendingDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatrixStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const size = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [simpleFormOpen, setSimpleFormOpen] = useState(false);
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
  /** Backend có thể trả content nhưng totalElements = 0 — đồng bộ UI với dữ liệu thực tế */
  const effectiveTotalElements = Math.max(totalElements, matrices.length);
  const effectiveTotalPages =
    totalPages > 0 ? totalPages : effectiveTotalElements > 0 ? 1 : 0;

  const stats = useMemo(
    () => ({
      total: effectiveTotalElements,
      draft: matrices.filter((m) => m.status === MatrixStatus.DRAFT).length,
      approved: matrices.filter((m) => m.status === MatrixStatus.APPROVED).length,
      locked: matrices.filter((m) => m.status === MatrixStatus.LOCKED).length,
    }),
    [matrices, effectiveTotalElements]
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const displayStart = effectiveTotalElements === 0 ? 0 : page * size + 1;
  const displayEnd = Math.min((page + 1) * size, effectiveTotalElements);

  /** Chỉ hiện empty “chưa có ma trận” khi thực sự không có dòng — không tin totalElements khi content còn phần tử */
  const isCatalogEmpty =
    !isLoading &&
    !isError &&
    matrices.length === 0 &&
    totalElements === 0 &&
    statusFilter === 'ALL' &&
    !debouncedSearch.trim();

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

  function renderStatusBadge(status: MatrixStatus) {
    return (
      <span className={statusBadgeClasses(status)}>
        {status === MatrixStatus.APPROVED && <CheckCircle2 className="w-3 h-3" />}
        {status === MatrixStatus.LOCKED && <Lock className="w-3 h-3" />}
        {status === MatrixStatus.DRAFT && <FileText className="w-3 h-3" />}
        {status === MatrixStatus.DRAFT && ' Nháp'}
        {status === MatrixStatus.APPROVED && ' Đã phê duyệt'}
        {status === MatrixStatus.LOCKED && ' Đã khóa'}
      </span>
    );
  }

  function renderDimensionStrip(matrix: ExamMatrixResponse) {
    const hasShape =
      (matrix.parts?.length ?? 0) > 0 ||
      (matrix.rowCount ?? 0) > 0 ||
      (matrix.totalQuestionsTarget ?? 0) > 0 ||
      (matrix.totalPointsTarget ?? 0) > 0;
    if (!hasShape) return null;
    return (
      <div
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]"
        aria-label="Kích thước ma trận"
      >
        {(matrix.parts?.length ?? 0) > 0 && (
          <span>
            <strong className="text-[#141413] tabular-nums">{matrix.parts?.length}</strong> phần
          </span>
        )}
        {(matrix.rowCount ?? 0) > 0 && (
          <>
            <span className="text-[#E8E6DC]">×</span>
            <span>
              <strong className="text-[#141413] tabular-nums">{matrix.rowCount}</strong> dòng
            </span>
          </>
        )}
        {(matrix.totalQuestionsTarget ?? 0) > 0 && (
          <>
            <span className="text-[#E8E6DC]">·</span>
            <span>
              <strong className="text-[#141413] tabular-nums">{matrix.totalQuestionsTarget}</strong>{' '}
              câu
            </span>
          </>
        )}
        {(matrix.totalPointsTarget ?? 0) > 0 && (
          <>
            <span className="text-[#E8E6DC]">·</span>
            <span>
              <strong className="text-[#141413] tabular-nums">{matrix.totalPointsTarget}</strong>{' '}
              điểm
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={5}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header (aligned with /teacher/mindmaps) ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Ma trận đề
                  </h1>
                  {!isLoading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {effectiveTotalElements}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {stats.approved} đã phê duyệt • {stats.locked} đã khóa
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSimpleFormOpen(true)}
                title="Bảng chương × NB/TH/VD/VDC, gọn nhanh nhất"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo nhanh
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
              >
                Tạo ma trận
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                {
                  label: 'Tổng ma trận',
                  value: stats.total,
                  Icon: Grid2x2,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Bản nháp',
                  value: stats.draft,
                  Icon: FileText,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
                },
                {
                  label: 'Đã phê duyệt',
                  value: stats.approved,
                  Icon: CheckCircle2,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
                {
                  label: 'Đã khóa',
                  value: stats.locked,
                  Icon: Lock,
                  bg: 'bg-[#F5F3FF]',
                  color: 'text-[#9B6FE0]',
                },
              ] as const
            ).map(({ label, value, Icon, bg, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none">
                    {value}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Workflow (mindmaps-style panel) ── */}
          <section
            className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden"
            aria-label="Luồng ma trận đề"
          >
            <div className="px-6 py-5 border-b border-[#F0EEE6] bg-[#FAF9F5]">
              <p className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F] uppercase tracking-wide">
                Luồng làm việc
              </p>
              <h2 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] mt-1">
                Từ ma trận đến bài kiểm tra hoàn chỉnh
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4 flex flex-col gap-2 hover:border-[#D1CFC5] transition-colors">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full bg-[#eff6ff] text-[#1d4ed8] flex items-center justify-center font-[Be_Vietnam_Pro] text-[11px] font-bold"
                      aria-hidden
                    >
                      1
                    </span>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] m-0">
                      Tạo nháp
                    </p>
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 leading-relaxed">
                    Đặt tên ma trận, mô tả và mục tiêu câu hỏi.
                  </p>
                </div>
                <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4 flex flex-col gap-2 hover:border-[#D1CFC5] transition-colors">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#047857] flex items-center justify-center font-[Be_Vietnam_Pro] text-[11px] font-bold"
                      aria-hidden
                    >
                      2
                    </span>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] m-0">
                      Thêm cột phân bố
                    </p>
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 leading-relaxed">
                    Định nghĩa mức nhận thức, chương, số câu và điểm.
                  </p>
                </div>
                <div className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4 flex flex-col gap-2 hover:border-[#D1CFC5] transition-colors">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full bg-[#f5f3ff] text-[#6d28d9] flex items-center justify-center font-[Be_Vietnam_Pro] text-[11px] font-bold"
                      aria-hidden
                    >
                      3
                    </span>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] m-0">
                      Phê duyệt &amp; xuất
                    </p>
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 leading-relaxed">
                    Phê duyệt ma trận rồi dùng ở Tạo đề thi.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/teacher/question-banks')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                >
                  <Library className="w-3.5 h-3.5" />
                  Ngân hàng câu hỏi
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/assessments')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Tạo bài kiểm tra
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                placeholder="Tìm ma trận..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearch('')}
                  className="text-[#87867F] hover:text-[#141413] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>

            <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0 flex-wrap">
              {filters.map((filter) => {
                let count = stats.total;
                if (filter === MatrixStatus.DRAFT) count = stats.draft;
                else if (filter === MatrixStatus.APPROVED) count = stats.approved;
                else if (filter === MatrixStatus.LOCKED) count = stats.locked;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                      statusFilter === filter
                        ? 'bg-white text-[#141413] shadow-sm'
                        : 'text-[#87867F] hover:text-[#5E5D59]'
                    }`}
                  >
                    {filterLabel[filter]} ({count})
                  </button>
                );
              })}
            </div>

            {effectiveTotalElements > 0 && (
              <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Hiển thị lưới"
                  title="Lưới"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-md text-[#141413]'
                      : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="Hiển thị danh sách"
                  title="Danh sách"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                    viewMode === 'list'
                      ? 'bg-white shadow-md text-[#141413]'
                      : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>

          {!isLoading && !isError && effectiveTotalElements > 0 && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                {displayStart}–{displayEnd} / {effectiveTotalElements}
              </strong>
              <div className="hidden sm:block w-px h-4 bg-[#E8E6DC]" />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {' '}
                Đã phê duyệt{' '}
                <strong className="text-[#141413] font-semibold">{stats.approved}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {' '}
                Nháp{' '}
                <strong className="text-[#141413] font-semibold">{stats.draft}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                {' '}
                Khóa{' '}
                <strong className="text-[#141413] font-semibold">{stats.locked}</strong>
              </span>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md">
                {error instanceof Error ? error.message : 'Không thể tải danh sách ma trận.'}
              </p>
            </div>
          )}

          {isCatalogEmpty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Grid2x2 className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center px-4">
                Bạn chưa có ma trận đề nào. Tạo ma trận đầu tiên để bắt đầu.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSimpleFormOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                >
                  Tạo nhanh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('create');
                    setSelected(null);
                    setFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] transition-colors"
                >
                  Tạo ma trận <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!isLoading &&
            !isError &&
            matrices.length === 0 &&
            totalElements === 0 &&
            !isCatalogEmpty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center px-4">
                Không có ma trận phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          )}

          {!isLoading && !isError && matrices.length === 0 && totalElements > 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                Không có ma trận trên trang này. Thử chọn trang khác.
              </p>
            </div>
          )}

          {!isLoading && !isError && matrices.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matrices.map((matrix, idx) => (
                <article
                  key={matrix.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div
                    className="h-[132px] relative flex flex-col justify-end p-4 overflow-hidden"
                    style={{ background: coverGradients[idx % coverGradients.length] }}
                  >
                    <span
                      className="absolute top-3 left-3 font-[Playfair_Display] text-[12px] font-medium opacity-40"
                      style={{ color: coverAccents[idx % coverAccents.length] }}
                    >
                      #{String(page * size + idx + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute top-3 right-3">{renderStatusBadge(matrix.status)}</div>
                    <h3
                      className="relative font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2"
                      style={{ color: coverAccents[idx % coverAccents.length] }}
                    >
                      {matrix.name}
                    </h3>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2">
                      {matrix.description?.trim() || 'Chưa có mô tả cho ma trận này.'}
                    </p>
                    {(matrix.gradeLevel || matrix.subjectName) && (
                      <div className="flex flex-wrap gap-1.5">
                        {matrix.gradeLevel && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-white border border-[#E8E6DC] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                            Lớp {matrix.gradeLevel}
                          </span>
                        )}
                        {matrix.subjectName && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-white border border-[#E8E6DC] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                            {matrix.subjectName}
                          </span>
                        )}
                      </div>
                    )}
                    {renderDimensionStrip(matrix)}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6] mt-auto gap-2">
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                        {formatDate(matrix.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={navToDetailPending && pendingDetailId === matrix.id}
                      onClick={() => {
                        setPendingDetailId(matrix.id);
                        startNavigateDetail(() => {
                          navigate(`/teacher/exam-matrices/${matrix.id}`);
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-[#30302E] disabled:opacity-60 transition-colors"
                    >
                      {navToDetailPending && pendingDetailId === matrix.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {navToDetailPending && pendingDetailId === matrix.id
                        ? 'Đang mở...'
                        : 'Xem chi tiết'}
                    </button>
                    {matrix.status !== MatrixStatus.LOCKED && (
                      <div className="flex flex-wrap gap-2">
                        {matrix.status === MatrixStatus.DRAFT && (
                          <button
                            type="button"
                            className="flex-1 min-w-[6rem] px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center justify-center gap-1"
                            onClick={() => {
                              setMode('edit');
                              setSelected(matrix);
                              setFormOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Chỉnh sửa
                          </button>
                        )}
                        {matrix.status === MatrixStatus.DRAFT && (
                          <button
                            type="button"
                            className="flex-1 min-w-[6rem] px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-emerald-800 hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-1 disabled:opacity-50"
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
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {approveMutation.isPending ? '...' : 'Phê duyệt'}
                          </button>
                        )}
                        {matrix.status === MatrixStatus.APPROVED && (
                          <button
                            type="button"
                            className="flex-1 min-w-[6rem] px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center justify-center gap-1 disabled:opacity-50"
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
                            <RotateCcw className="w-3.5 h-3.5" />
                            {resetMutation.isPending ? '...' : 'Đặt lại'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex-1 min-w-[6rem] px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-1 disabled:opacity-50"
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
                          <Trash2 className="w-3.5 h-3.5" />
                          {deleteMutation.isPending ? '...' : 'Xóa'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !isError && matrices.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col gap-2">
              {matrices.map((matrix, idx) => (
                <article
                  key={matrix.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <Grid2x2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate max-w-full">
                        {matrix.name}
                      </h3>
                      {renderStatusBadge(matrix.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {renderDimensionStrip(matrix)}
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                        {formatDate(matrix.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={navToDetailPending && pendingDetailId === matrix.id}
                      onClick={() => {
                        setPendingDetailId(matrix.id);
                        startNavigateDetail(() => {
                          navigate(`/teacher/exam-matrices/${matrix.id}`);
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                    >
                      {navToDetailPending && pendingDetailId === matrix.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      Chi tiết
                    </button>
                    {matrix.status === MatrixStatus.DRAFT && (
                      <>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center gap-1"
                          onClick={() => {
                            setMode('edit');
                            setSelected(matrix);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
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
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Duyệt
                        </button>
                      </>
                    )}
                    {matrix.status === MatrixStatus.APPROVED && (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
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
                                  err instanceof Error ? err.message : 'Không thể đặt lại ma trận.',
                              }),
                          });
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Đặt lại
                      </button>
                    )}
                    {matrix.status !== MatrixStatus.LOCKED && (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
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
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-2">
            <Pagination
              page={page}
              totalPages={effectiveTotalPages}
              totalElements={effectiveTotalElements}
              pageSize={size}
              onChange={(p) => setPage(p)}
            />
          </div>

          <ExamMatrixFormModal
            isOpen={formOpen}
            mode={mode}
            initialData={selected}
            onClose={() => setFormOpen(false)}
            onSubmit={handleSave}
          />

          <SimpleExamMatrixModal
            isOpen={simpleFormOpen}
            onClose={() => setSimpleFormOpen(false)}
            onCreated={(matrix) => {
              showToast({ type: 'success', message: 'Tạo ma trận thành công.' });
              void refetch();
              if (matrix?.matrixId) {
                navigate(`/teacher/exam-matrices/${matrix.matrixId}`);
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
