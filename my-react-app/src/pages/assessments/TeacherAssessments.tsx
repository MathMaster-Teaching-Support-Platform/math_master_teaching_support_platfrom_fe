import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutGrid,
  List,
  Lock,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { useToast } from '../../context/ToastContext';
import {
  useCloseAssessment,
  useCreateAssessment,
  useDeleteAssessment,
  useMyAssessments,
  usePatchAssessment,
  usePublishAssessment,
  useReopenAssessment,
  useUnpublishAssessment,
} from '../../hooks/useAssessment';
import { useDebounce } from '../../hooks/useDebounce';
import type { AssessmentRequest, AssessmentResponse, AssessmentStatus } from '../../types';
import { AssessmentBuilderFlowBody } from './AssessmentBuilderFlow';
import AssessmentModal from './AssessmentModal';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

const statusFilters: Array<'ALL' | AssessmentStatus> = ['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'];

const statusLabel: Record<'ALL' | AssessmentStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  CLOSED: 'Đã đóng',
};

const cardStatusLabel: Record<AssessmentStatus, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  CLOSED: 'Đã đóng',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function TeacherAssessments() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | AssessmentStatus>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [openForm, setOpenForm] = useState(false);
  const [mode] = useState<'create' | 'edit'>('create');
  const [selected] = useState<AssessmentResponse | null>(null);
  const [view, setView] = useState<'create' | 'manage'>('manage');
  const [cardLayout, setCardLayout] = useState<'grid' | 'list'>('grid');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, isError, error, refetch } = useMyAssessments({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearch.trim() || undefined,
    page,
    size,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  });

  const createMutation = useCreateAssessment();
  const patchMutation = usePatchAssessment();
  const publishMutation = usePublishAssessment();
  const unpublishMutation = useUnpublishAssessment();
  const closeMutation = useCloseAssessment();
  const reopenMutation = useReopenAssessment();
  const deleteMutation = useDeleteAssessment();

  const { showToast } = useToast();

  const assessments = data?.result?.content ?? [];
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;
  /** Backend có thể trả content nhưng totalElements = 0 — đồng bộ UI với dữ liệu thực tế */
  const effectiveTotalElements = Math.max(totalElements, assessments.length);
  const effectiveTotalPages =
    totalPages > 0 ? totalPages : effectiveTotalElements > 0 ? 1 : 0;
  const stats = useMemo(
    () => ({
      total: totalElements,
      draft: assessments.filter((a) => a.status === 'DRAFT').length,
      published: assessments.filter((a) => a.status === 'PUBLISHED').length,
      closed: assessments.filter((a) => a.status === 'CLOSED').length,
    }),
    [assessments, totalElements]
  );

  async function saveAssessment(payload: AssessmentRequest | Partial<AssessmentRequest>) {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload as AssessmentRequest);
        showToast({ type: 'success', message: `Tạo ${UI_TEXT.QUIZ.toLowerCase()} thành công.` });
        return;
      }
      if (!selected) return;
      await patchMutation.mutateAsync({ id: selected.id, data: payload });
      showToast({ type: 'success', message: `Cập nhật ${UI_TEXT.QUIZ.toLowerCase()} thành công.` });
    } catch (saveErr) {
      showToast({
        type: 'error',
        message:
          saveErr instanceof Error ? saveErr.message : `Không thể lưu ${UI_TEXT.QUIZ.toLowerCase()}.`,
      });
    }
  }

  const statTiles = [
    {
      label: `Tổng ${UI_TEXT.QUIZ.toLowerCase()}`,
      value: stats.total,
      Icon: ClipboardList,
      bg: 'bg-[#EEF2FF]',
      color: 'text-[#4F7EF7]',
    },
    {
      label: 'Đã công khai',
      value: stats.published,
      Icon: CheckCircle2,
      bg: 'bg-[#ECFDF5]',
      color: 'text-[#2EAD7A]',
    },
    {
      label: 'Bản nháp',
      value: stats.draft,
      Icon: FileText,
      bg: 'bg-[#FFF7ED]',
      color: 'text-[#E07B39]',
    },
    {
      label: 'Đã đóng',
      value: stats.closed,
      Icon: Lock,
      bg: 'bg-[#FEF2F2]',
      color: 'text-[#DC2626]',
    },
  ] as const;

  const renderAssessmentActions = (assessment: AssessmentResponse, compact?: boolean) => (
    <div className={`flex ${compact ? 'flex-wrap justify-end' : 'flex-wrap'} gap-2`}>
      <button
        type="button"
        className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors inline-flex items-center gap-1.5"
        onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
      >
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
        Chi tiết
      </button>
      {assessment.status === 'DRAFT' && (
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          onClick={() => navigate(`/teacher/assessments/${assessment.id}/preview`)}
          title="Làm thử ở giao diện học sinh — không tính lượt và không lưu kết quả"
        >
          Làm thử
        </button>
      )}
      {assessment.status === 'PUBLISHED' && (
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
          onClick={() =>
            unpublishMutation.mutate(assessment.id, {
              onSuccess: () =>
                showToast({
                  type: 'success',
                  message: `Đã hủy công khai ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                }),
              onError: (err) =>
                showToast({
                  type: 'error',
                  message: err instanceof Error ? err.message : 'Không thể hủy công khai.',
                }),
            })
          }
        >
          Hủy công khai
        </button>
      )}
      {assessment.status === 'DRAFT' && (
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
          aria-label="Xóa"
          title="Xóa"
          onClick={() =>
            deleteMutation.mutate(assessment.id, {
              onSuccess: () =>
                showToast({
                  type: 'success',
                  message: `Đã xóa ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                }),
              onError: (err) =>
                showToast({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : `Không thể xóa ${UI_TEXT.QUIZ.toLowerCase()}.`,
                }),
            })
          }
        >
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          {!compact && 'Xóa'}
        </button>
      )}
    </div>
  );

  const renderPrimaryStatusAction = (assessment: AssessmentResponse) => {
    if (assessment.status === 'DRAFT') {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
          onClick={() =>
            publishMutation.mutate(assessment.id, {
              onSuccess: () =>
                showToast({
                  type: 'success',
                  message: `Đã công khai ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                }),
              onError: (err) =>
                showToast({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : `Không thể công khai ${UI_TEXT.QUIZ.toLowerCase()}.`,
                }),
            })
          }
        >
          <Send className="w-3 h-3" />
          Công khai
        </button>
      );
    }
    if (assessment.status === 'PUBLISHED') {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-[Be_Vietnam_Pro] text-[11px] font-semibold hover:bg-amber-200 transition-colors border border-amber-200"
          onClick={() =>
            closeMutation.mutate(assessment.id, {
              onSuccess: () =>
                showToast({
                  type: 'success',
                  message: `Đã đóng ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                }),
              onError: (err) =>
                showToast({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : `Không thể đóng ${UI_TEXT.QUIZ.toLowerCase()}.`,
                }),
            })
          }
        >
          <Lock className="w-3 h-3" />
          Đóng đề
        </button>
      );
    }
    if (assessment.status === 'CLOSED') {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
          onClick={() =>
            reopenMutation.mutate(assessment.id, {
              onSuccess: () =>
                showToast({
                  type: 'success',
                  message: `Đã mở lại ${UI_TEXT.QUIZ.toLowerCase()} “${assessment.title}”.`,
                }),
              onError: (err) =>
                showToast({
                  type: 'error',
                  message:
                    err instanceof Error
                      ? err.message
                      : `Không thể mở lại ${UI_TEXT.QUIZ.toLowerCase()}.`,
                }),
            })
          }
        >
          <Send className="w-3 h-3" />
          Mở lại
        </button>
      );
    }
    return null;
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header (TeacherMindmaps pattern) ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    {view === 'create' ? 'Tạo đề thi' : 'Đề thi'}
                  </h1>
                  {view === 'manage' && !isLoading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {totalElements}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {view === 'create'
                    ? 'Tạo đề từ ma trận đã duyệt hoặc cấu hình thủ công.'
                    : 'Quản lý vòng đời đề: nháp, công khai, đóng và chỉnh sửa.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setView('create')}
                  className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    view === 'create'
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                >
                  Tạo đề
                </button>
                <button
                  type="button"
                  onClick={() => setView('manage')}
                  className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    view === 'manage'
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                >
                  Quản lí đề
                </button>
              </div>

            </div>
          </div>

          {/* ── Create flow ── */}
          {view === 'create' && (
            <div className="bg-white rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.04)_0px_4px_24px]">
              {/* assessment-builder-flow.css chỉ áp dụng trong .module-layout-container */}
              <div className="module-layout-container p-4 sm:p-6 lg:p-8">
                <AssessmentBuilderFlowBody />
              </div>
            </div>
          )}

          {/* ── Manage: stats + toolbar + list ── */}
          {view === 'manage' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statTiles.map(({ label, value, Icon, bg, color }) => (
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
                      <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                        {value}
                      </p>
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 truncate">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
                  <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
                  <input
                    className="flex-1 min-w-0 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                    placeholder={`Tìm ${UI_TEXT.QUIZ.toLowerCase()}...`}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearch('')}
                      className="text-[#87867F] hover:text-[#141413] transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl overflow-x-auto">
                    {statusFilters.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setStatusFilter(item);
                          setPage(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                          statusFilter === item
                            ? 'bg-white text-[#141413] shadow-sm'
                            : 'text-[#87867F] hover:text-[#5E5D59]'
                        }`}
                      >
                        {statusLabel[item]}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {assessments.length > 0 && (
                      <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setCardLayout('grid')}
                          aria-label="Hiển thị lưới"
                          title="Lưới"
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                            cardLayout === 'grid'
                              ? 'bg-white shadow-md text-[#141413]'
                              : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardLayout('list')}
                          aria-label="Hiển thị danh sách"
                          title="Danh sách"
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                            cardLayout === 'list'
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
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Làm mới
                    </button>
                  </div>
                </div>
              </div>

              {!isLoading && !isError && assessments.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                  <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                    Trang {page + 1}/{Math.max(effectiveTotalPages, 1)}
                  </span>
                  <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                    {assessments.length} / {effectiveTotalElements} {UI_TEXT.QUIZ.toLowerCase()}
                  </strong>
                  <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" />
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Công khai{' '}
                    <strong className="text-[#141413] font-semibold">{stats.published}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    Nháp <strong className="text-[#141413] font-semibold">{stats.draft}</strong>
                  </span>
                </div>
              )}

              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center px-4">
                    {error instanceof Error
                      ? error.message
                      : `Không thể tải danh sách ${UI_TEXT.QUIZ.toLowerCase()}.`}
                  </p>
                </div>
              )}

              {!isLoading && !isError && assessments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center px-4">
                    Chưa có {UI_TEXT.QUIZ.toLowerCase()} nào phù hợp bộ lọc.
                  </p>
                </div>
              )}

              {!isLoading && !isError && assessments.length > 0 && cardLayout === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessments.map((assessment, idx) => {
                    const showTags =
                      assessment.assessmentMode === 'MATRIX_BASED' ||
                      !!assessment.examMatrixGradeLevel ||
                      !!assessment.examMatrixName;
                    const accent = coverAccents[idx % coverAccents.length];
                    return (
                      <article
                        key={assessment.id}
                        className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                      >
                        <div
                          className="h-[120px] relative flex flex-col justify-between p-4 overflow-hidden flex-shrink-0"
                          style={{
                            background: coverGradients[idx % coverGradients.length],
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="font-[Playfair_Display] text-[12px] font-medium opacity-50"
                              style={{ color: accent }}
                            >
                              #{String(page * size + idx + 1).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {renderPrimaryStatusAction(assessment)}
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold ${
                                  assessment.status === 'PUBLISHED'
                                    ? 'text-emerald-700'
                                    : assessment.status === 'CLOSED'
                                      ? 'text-red-700'
                                      : 'text-[#87867F]'
                                }`}
                              >
                                {cardStatusLabel[assessment.status]}
                              </span>
                            </div>
                          </div>
                          <h3
                            className="font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2 pr-1"
                            style={{ color: accent }}
                          >
                            {assessment.title}
                          </h3>
                        </div>

                        <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">
                          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2">
                            {assessment.description ||
                              (assessment.assessmentMode === 'MATRIX_BASED'
                                ? 'Tự sinh từ ma trận đề.'
                                : 'Chưa có mô tả.')}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                            <span>{assessment.totalQuestions} câu</span>
                            <span className="text-[#E8E6DC]">·</span>
                            <span>{assessment.totalPoints} điểm</span>
                            {assessment.timeLimitMinutes != null && (
                              <>
                                <span className="text-[#E8E6DC]">·</span>
                                <span>{assessment.timeLimitMinutes} phút</span>
                              </>
                            )}
                            {assessment.submissionCount > 0 && (
                              <>
                                <span className="text-[#E8E6DC]">·</span>
                                <span>{assessment.submissionCount} lượt nộp</span>
                              </>
                            )}
                          </div>

                          {showTags && (
                            <div className="flex flex-wrap gap-1.5">
                              {assessment.assessmentMode === 'MATRIX_BASED' && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-violet-600 border border-violet-100">
                                  Theo ma trận
                                </span>
                              )}
                              {assessment.examMatrixGradeLevel != null && (
                                <span className="px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59] border border-[#E8E6DC]">
                                  Lớp {assessment.examMatrixGradeLevel}
                                </span>
                              )}
                              {assessment.examMatrixName && (
                                <span
                                  className="px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59] border border-[#E8E6DC] max-w-full truncate"
                                  title={assessment.examMatrixName}
                                >
                                  {assessment.examMatrixName}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col gap-2 pt-2 border-t border-[#F0EEE6] mt-auto">
                            <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                              {formatDate(assessment.createdAt)}
                            </span>
                            {renderAssessmentActions(assessment)}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {!isLoading && !isError && assessments.length > 0 && cardLayout === 'list' && (
                <div className="flex flex-col gap-2">
                  {assessments.map((assessment, idx) => {
                    const showTags =
                      assessment.assessmentMode === 'MATRIX_BASED' ||
                      !!assessment.examMatrixGradeLevel ||
                      !!assessment.examMatrixName;
                    const accent = coverAccents[idx % coverAccents.length];
                    return (
                      <article
                        key={assessment.id}
                        className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: coverGradients[idx % coverGradients.length],
                            color: accent,
                          }}
                        >
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate max-w-[min(100%,420px)]">
                              {assessment.title}
                            </h3>
                            <span
                              className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full font-[Be_Vietnam_Pro] text-[11px] font-medium ${
                                assessment.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : assessment.status === 'CLOSED'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-[#F5F4ED] text-[#87867F]'
                              }`}
                            >
                              {cardStatusLabel[assessment.status]}
                            </span>
                            {renderPrimaryStatusAction(assessment)}
                          </div>
                          <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] line-clamp-1 mb-1">
                            {assessment.description ||
                              (assessment.assessmentMode === 'MATRIX_BASED'
                                ? 'Tự sinh từ ma trận đề.'
                                : 'Chưa có mô tả.')}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                            <span>{assessment.totalQuestions} câu</span>
                            <span>·</span>
                            <span>{assessment.totalPoints} điểm</span>
                            <span>·</span>
                            <span className="text-[#B0AEA5]">{formatDate(assessment.createdAt)}</span>
                          </div>
                          {showTags && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {assessment.assessmentMode === 'MATRIX_BASED' && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-violet-600">
                                  Theo ma trận
                                </span>
                              )}
                              {assessment.examMatrixGradeLevel != null && (
                                <span className="px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                                  Lớp {assessment.examMatrixGradeLevel}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          {renderAssessmentActions(assessment, true)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="pt-2">
                <Pagination
                  page={page}
                  totalPages={effectiveTotalPages}
                  totalElements={effectiveTotalElements}
                  pageSize={size}
                  onChange={(p) => setPage(p)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <AssessmentModal
        isOpen={openForm}
        mode={mode}
        initialData={selected}
        onClose={() => setOpenForm(false)}
        onSubmit={saveAssessment}
      />
    </DashboardLayout>
  );
}
