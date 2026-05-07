import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Database,
  Eye,
  EyeOff,
  Grid2x2,
  List,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Globe,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
  QbCognitiveDistribution,
  QbConfirmDialog,
} from '../../components/question-banks/qb-ui';
import { mockTeacher } from '../../data/mockData';
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

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

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

  const pageStats = useMemo(() => {
    const pub = banks.filter((b) => b.isPublic).length;
    const questionsOnPage = banks.reduce((s, b) => s + (b.questionCount ?? 0), 0);
    return {
      publicOnPage: pub,
      privateOnPage: banks.length - pub,
      questionsOnPage,
    };
  }, [banks]);

  async function saveQuestionBank(payload: QuestionBankRequest) {
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
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xóa ngân hàng câu hỏi.',
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
    } catch (err) {
      showToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể đổi trạng thái chia sẻ của ngân hàng.',
      });
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const emptyListPlaceholder = useMemo(() => {
    if (totalElements > 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
            Không có mục nào trên trang này.
          </p>
          <button
            type="button"
            onClick={() => setPage(0)}
            className="px-4 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] transition-colors"
          >
            Về trang đầu
          </button>
        </div>
      );
    }
    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center">
            Không có ngân hàng phù hợp. Thử đổi từ khóa hoặc bộ lọc.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setVisibilityFilter('ALL');
            }}
            className="mt-1 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          >
            Bỏ bộ lọc
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
          <Database className="w-6 h-6" />
        </div>
        <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-md">
          Chưa có ngân hàng câu hỏi nào. Hãy tạo ngân hàng đầu tiên để quản lý câu hỏi.
        </p>
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setSelected(null);
            setFormOpen(true);
          }}
          className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          Tạo ngân hàng mới
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }, [totalElements, hasActiveFilters]);

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="qb-scope px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* Header — aligned with /teacher/mindmaps */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Ngân hàng câu hỏi
                  </h1>
                  {!isLoading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {totalElements.toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5 max-w-xl">
                  Tổ chức câu hỏi theo ngân hàng để dùng cho ma trận đề và bài kiểm tra.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setSelected(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo ngân hàng mới
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                {
                  label: 'Tổng ngân hàng',
                  value: totalElements,
                  Icon: Database,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Công khai (trang)',
                  value: pageStats.publicOnPage,
                  Icon: Globe,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
                {
                  label: 'Riêng tư (trang)',
                  value: pageStats.privateOnPage,
                  Icon: Lock,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
                },
                {
                  label: 'Câu hỏi (trang)',
                  value: pageStats.questionsOnPage,
                  Icon: BookOpen,
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
                <div className="min-w-0">
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 leading-tight">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5] mt-1">
            Ba chỉ số cuối theo trang hiện tại; &quot;Tổng ngân hàng&quot; là tổng theo bộ lọc đang áp dụng.
          </p>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#C96442] focus-within:shadow-[0_0_0_3px_rgba(201,100,66,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                placeholder="Tìm ngân hàng câu hỏi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearch('')}
                  className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibilityFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                      visibilityFilter === opt.value
                        ? 'bg-white text-[#141413] shadow-sm'
                        : 'text-[#87867F] hover:text-[#5E5D59]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {banks.length > 0 && (
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
                    <Grid2x2 className="w-4 h-4" />
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
            </div>
          </div>

          {/* Summary bar */}
          {!isLoading && !isError && banks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] tabular-nums">
                {banks.length} / {totalElements.toLocaleString('vi-VN')}
              </strong>
              <div className="hidden sm:block w-px h-4 bg-[#E8E6DC]" />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Công khai{' '}
                <strong className="text-[#141413] font-semibold tabular-nums">
                  {pageStats.publicOnPage}
                </strong>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Riêng tư{' '}
                <strong className="text-[#141413] font-semibold tabular-nums">
                  {pageStats.privateOnPage}
                </strong>
              </span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-56 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md">
                {error instanceof Error ? error.message : 'Không thể tải ngân hàng. Vui lòng thử lại.'}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-1 px-4 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !isError && banks.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {banks.map((bank, idx) => (
                <article
                  key={bank.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div
                    className="h-[124px] relative flex flex-col justify-end p-4 overflow-hidden shrink-0"
                    style={{ background: coverGradients[idx % coverGradients.length] }}
                  >
                    <span
                      className="absolute top-3 left-3 font-[Playfair_Display] text-[12px] font-medium opacity-40"
                      style={{ color: coverAccents[idx % coverAccents.length] }}
                    >
                      #{String(page * pageSize + idx + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute top-3 right-3">
                      {bank.isPublic ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                          <Eye className="w-3 h-3" /> Công khai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]">
                          <EyeOff className="w-3 h-3" /> Riêng tư
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                      className="relative text-left w-full group/title"
                      title={bank.name}
                    >
                      <h3
                        className="font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2 group-hover/title:underline underline-offset-2"
                        style={{ color: coverAccents[idx % coverAccents.length] }}
                      >
                        {bank.name}
                      </h3>
                    </button>
                  </div>

                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2 min-h-[2.6rem]">
                      {bank.description?.trim() || 'Chưa có mô tả cho ngân hàng này.'}
                    </p>

                    <div className="rounded-xl bg-white/80 border border-[#F0EEE6] px-2.5 py-2">
                      <div className="flex justify-between items-baseline gap-2 mb-1.5">
                        <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                          Tổng câu hỏi
                        </span>
                        <strong className="font-[Be_Vietnam_Pro] text-[15px] font-bold text-[#141413] tabular-nums">
                          {(bank.questionCount ?? 0).toLocaleString('vi-VN')}
                        </strong>
                      </div>
                      <QbCognitiveDistribution
                        stats={bank.cognitiveStats}
                        total={bank.questionCount ?? 0}
                      />
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {(bank.schoolGradeName || bank.gradeLevel) && (
                        <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] max-w-full">
                          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {bank.schoolGradeName ?? `Lớp ${bank.gradeLevel}`}
                            {bank.subjectName ? ` · ${bank.subjectName}` : ''}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {bank.teacherName || 'Không xác định'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6] mt-auto gap-2 flex-wrap">
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                        {formatDate(bank.createdAt)}
                      </span>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                          onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                          disabled={togglePublicMutation.isPending}
                          onClick={() => void handleTogglePublic(bank)}
                        >
                          {bank.isPublic ? (
                            <>
                              <EyeOff className="w-3 h-3 inline mr-1 align-text-bottom" /> Riêng tư
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 inline mr-1 align-text-bottom" /> Công khai
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                          onClick={() => {
                            setMode('edit');
                            setSelected(bank);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3 h-3 inline mr-1 align-text-bottom" /> Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                          onClick={() => setPendingDelete(bank)}
                        >
                          <Trash2 className="w-3 h-3 inline mr-1 align-text-bottom" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* List */}
          {!isLoading && !isError && banks.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col gap-2">
              {banks.map((bank, idx) => (
                <article
                  key={bank.id}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: coverGradients[idx % coverGradients.length],
                      color: coverAccents[idx % coverAccents.length],
                    }}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                        className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate text-left hover:underline"
                      >
                        {bank.name}
                      </button>
                      {bank.isPublic ? (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-emerald-700">
                          <Eye className="w-3 h-3" /> Công khai
                        </span>
                      ) : (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F]">
                          <EyeOff className="w-3 h-3" /> Riêng tư
                        </span>
                      )}
                    </div>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] line-clamp-1 mb-1">
                      {bank.description?.trim() || 'Chưa có mô tả.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#141413] font-semibold tabular-nums">
                        {(bank.questionCount ?? 0).toLocaleString('vi-VN')} câu
                      </span>
                      <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                        {formatDate(bank.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 sm:w-[220px] lg:w-[260px] shrink-0 qb-list-cog">
                    <QbCognitiveDistribution stats={bank.cognitiveStats} total={bank.questionCount ?? 0} />
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0 sm:justify-end">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                      onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                    >
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                      disabled={togglePublicMutation.isPending}
                      onClick={() => void handleTogglePublic(bank)}
                    >
                      {bank.isPublic ? 'Riêng tư' : 'Công khai'}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                      onClick={() => {
                        setMode('edit');
                        setSelected(bank);
                        setFormOpen(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                      onClick={() => setPendingDelete(bank)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !isError && banks.length === 0 && emptyListPlaceholder}

          {totalPages > 0 && (
            <div className="pt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onChange={(p) => setPage(p)}
                onPageSizeChange={(size) => setPageSize(size)}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>
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
                  Bạn sắp xóa <strong>&quot;{pendingDelete.name}&quot;</strong>. Các câu hỏi sẽ được gỡ liên
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
      </div>
    </DashboardLayout>
  );
}
