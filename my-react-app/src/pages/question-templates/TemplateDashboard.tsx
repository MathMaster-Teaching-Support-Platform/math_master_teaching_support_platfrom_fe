import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileQuestion,
  FileText,
  GraduationCap,
  Inbox,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { questionBankService } from '../../services/questionBankService';

import LatexRenderer from '../../components/common/LatexRenderer';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

import {
  useCreateQuestionTemplate,
  useDeleteQuestionTemplate,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useUnpublishTemplate,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import { questionTemplateService } from '../../services/questionTemplateService';
import { mockTeacher } from '../../data/mockData';
import '../../styles/module-refactor.css';

import {
  questionTagLabels,
  TemplateStatus,
  type QuestionTag,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import { TemplateBulkImportModal } from './TemplateBulkImportModal';
import { TemplateFormModal } from './TemplateFormModal';

import type {
  BlueprintFromRealQuestionRequest,
  BlueprintFromRealQuestionResponse,
} from '../../types/questionTemplate';
import { BlueprintConfirmModal } from './BlueprintConfirmModal';
import { RealQuestionForm } from './RealQuestionForm';
import { TemplateGenerateModal } from './TemplateGenerateModal';
import { TemplateMethodPicker } from './TemplateMethodPicker';

const filterTabs: Array<{ id: 'ALL' | TemplateStatus; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: TemplateStatus.PUBLISHED, label: 'Sẵn sàng' },
  { id: TemplateStatus.DRAFT, label: 'Nháp' },
];

const templateTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const cognitiveLevelLabel: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

/** Same cover vocabulary as `/teacher/mindmaps` for visual consistency. */
const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

const LoadingSpinner = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]"
    role="status"
    aria-live="polite"
  >
    <span
      className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin flex-shrink-0"
      aria-hidden="true"
    />
    {label}
  </span>
);

function extractDiagramLatexStrings(diagramData: unknown): string[] {
  const values: string[] = [];

  const visit = (node: unknown, keyName = '') => {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (!trimmed) return;

      // Skip unresolved template placeholders in preview stage.
      if (trimmed.includes('{{') || trimmed.includes('}}')) return;

      // Ignore metadata-like tokens, e.g. function_graph, near_miss.
      const looksLikeIdentifier = /^[a-zA-Z]+(?:_[a-zA-Z0-9]+)+$/.test(trimmed);
      if (looksLikeIdentifier) return;

      const keyLooksLatex = /latex|tex|equation|formula|expression|math/i.test(keyName);
      const hasLatexSyntax = /\$[^$]+\$|\\[a-zA-Z]+/.test(trimmed);
      const hasMathOperators = /[=+\-*/^]/.test(trimmed);
      const hasMathSymbols = /\d|[xyabcnm]|π|√/i.test(trimmed);

      if (keyLooksLatex || hasLatexSyntax || (hasMathOperators && hasMathSymbols)) {
        values.push(trimmed);
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, keyName));
      return;
    }

    if (node && typeof node === 'object') {
      Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
        visit(value, key);
      });
    }
  };

  visit(diagramData);
  return Array.from(new Set(values)).slice(0, 6);
}

function extractPrimaryDiagramLatex(diagramData: unknown): string | null {
  if (typeof diagramData === 'string') {
    const value = diagramData.trim();
    if (!value) return null;
    return value;
  }

  if (!diagramData || typeof diagramData !== 'object' || Array.isArray(diagramData)) {
    return null;
  }

  const record = diagramData as Record<string, unknown>;
  const directCandidates = ['latex', 'tex', 'equation', 'formula', 'expression', 'math', 'diagram'];
  for (const key of directCandidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const discovered = extractDiagramLatexStrings(record);
  return discovered[0]?.trim() ?? null;
}

export function TemplateDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Bucket-targeting context: when navigated from a question-bank tree bucket
  // (?bankId=&chapterId=&cognitiveLevel=), surface a banner so the teacher
  // sees where generated questions are meant to land. The actual generate
  // dialog still asks for these values; pre-filling it is a future step.
  const [searchParams, setSearchParams] = useSearchParams();
  const targetBankId = searchParams.get('bankId') || undefined;
  const targetChapterId = searchParams.get('chapterId') || undefined;
  const targetCognitiveLevel = searchParams.get('cognitiveLevel') || undefined;
  const hasTargetContext = !!(targetBankId && targetChapterId && targetCognitiveLevel);
  const [targetBankName, setTargetBankName] = useState<string | null>(null);
  const [targetGradeName, setTargetGradeName] = useState<string | null>(null);
  useEffect(() => {
    if (!targetBankId) {
      setTargetBankName(null);
      setTargetGradeName(null);
      return;
    }
    let cancelled = false;
    questionBankService
      .getQuestionBankById(targetBankId)
      .then((res) => {
        if (cancelled) return;
        setTargetBankName(res.result?.name ?? null);
        setTargetGradeName(res.result?.schoolGradeName ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setTargetBankName(null);
        setTargetGradeName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [targetBankId]);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState<'ALL' | TemplateStatus>('ALL');
  const [page, setPage] = useState(0);
  // Page size is now teacher-controllable via the Pagination footer. Defaults
  // to 9 (clean 3×3 desktop grid). Persists nothing here — the Pagination
  // component already writes the selection to localStorage so it survives a
  // reload across pages that consume the same key.
  const [size, setSize] = useState(9);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selected, setSelected] = useState<QuestionTemplateResponse | null>(null);

  // New flow state: Method picker + Method-1 form + Confirm + Generate
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [realFormOpen, setRealFormOpen] = useState(false);
  const [blueprintRequest, setBlueprintRequest] = useState<BlueprintFromRealQuestionRequest | null>(
    null
  );
  const [blueprintResponse, setBlueprintResponse] =
    useState<BlueprintFromRealQuestionResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const [activeDiagram, setActiveDiagram] = useState<unknown>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedStatus = status;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status]);

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionTemplates(
    page,
    size,
    'createdAt',
    'DESC',
    debouncedSearch.trim() || undefined,
    debouncedStatus === 'ALL' ? undefined : debouncedStatus
  );

  const createMutation = useCreateQuestionTemplate();
  const updateMutation = useUpdateQuestionTemplate();
  const deleteMutation = useDeleteQuestionTemplate();
  const publishMutation = usePublishTemplate();
  const unpublishMutation = useUnpublishTemplate();

  const templates = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      total: totalElements,
      published: templates.filter((t) => t.status === TemplateStatus.PUBLISHED).length,
      draft: templates.filter((t) => t.status === TemplateStatus.DRAFT).length,
    }),
    [templates, totalElements]
  );

  const activeDiagramLatexCode = extractPrimaryDiagramLatex(activeDiagram);
  const activeDiagramLatexValues = activeDiagram ? extractDiagramLatexStrings(activeDiagram) : [];

  async function saveTemplate(payload: QuestionTemplateRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, request: payload });
  }

  async function openEditTemplate(templateId: string) {
    setEditingTemplateId(templateId);
    try {
      const detail = await questionTemplateService.getQuestionTemplateById(templateId);
      if (!detail.result) throw new Error('Không lấy được chi tiết template.');
      setMode('edit');
      setSelected(detail.result);
      setFormOpen(true);
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Không thể tải chi tiết template để chỉnh sửa.',
      });
    } finally {
      setEditingTemplateId(null);
    }
  }

  // function _openCreateFromDraft(draft?: TemplateDraft) {
  //   setMode('create');
  //   setSelected(draft as QuestionTemplateResponse | null);
  //   setFormOpen(true);
  // }

  const showFilteredEmpty =
    !isLoading &&
    !isError &&
    templates.length === 0 &&
    totalElements === 0 &&
    (debouncedSearch.trim() !== '' || status !== 'ALL');

  const showLibraryEmpty =
    !isLoading &&
    !isError &&
    totalElements === 0 &&
    debouncedSearch.trim() === '' &&
    status === 'ALL';

  const rangeStart = totalElements === 0 ? 0 : page * size + 1;
  const rangeEnd = Math.min((page + 1) * size, totalElements);

  return (
    <DashboardLayout
      role="teacher"
      user={{
        name: mockTeacher.name,
        avatar: mockTeacher.avatar ?? '',
        role: 'teacher',
      }}
      notificationCount={5}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {hasTargetContext && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE]">
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#1e3a8a] leading-relaxed">
                Đang chọn mẫu để bổ sung câu cho{' '}
                <strong className="text-[#172554]">{targetBankName ?? '(ngân hàng)'}</strong>
                {targetGradeName ? ` · ${targetGradeName}` : ''}
                {' · '}
                <strong className="text-[#172554]">
                  {cognitiveLevelLabel[targetCognitiveLevel!] ?? targetCognitiveLevel}
                </strong>
                . Khi sinh câu hỏi từ mẫu, hãy chọn đúng ngân hàng, chương và mức độ này để câu sinh
                ra rơi vào đúng bucket.
              </p>
              <button
                type="button"
                className="flex-shrink-0 px-3 py-2 rounded-xl border border-[#A5B4FC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#3730A3] hover:bg-[#EEF2FF] transition-colors"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('bankId');
                  next.delete('chapterId');
                  next.delete('cognitiveLevel');
                  setSearchParams(next, { replace: true });
                }}
              >
                Bỏ ngữ cảnh
              </button>
            </div>
          )}

          {/* ── Page header (aligned with /teacher/mindmaps) ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Mẫu câu hỏi
                  </h1>
                  {!isLoading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {totalElements}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {stats.published} sẵn sàng • {stats.draft} nháp trên trang này
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setBulkImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập từ Excel
              </button>
              <button
                type="button"
                onClick={() => setMethodPickerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo mẫu mới
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                {
                  label: 'Tổng mẫu (khớp lọc)',
                  value: stats.total,
                  Icon: FileText,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Sẵn sàng (trang này)',
                  value: stats.published,
                  Icon: CheckCircle2,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
                {
                  label: 'Nháp (trang này)',
                  value: stats.draft,
                  Icon: Network,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
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

          {/* ── Toolbar ── */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
              <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
              <input
                className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                placeholder="Tìm mẫu câu hỏi..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    status === tab.id
                      ? 'bg-white text-[#141413] shadow-sm'
                      : 'text-[#87867F] hover:text-[#5E5D59]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto lg:ml-auto justify-between lg:justify-end">
              {totalElements > 0 && (
                <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Hiển thị lưới"
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-md text-[#141413]'
                        : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                    }`}
                    title="Lưới"
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Hiển thị danh sách"
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                      viewMode === 'list'
                        ? 'bg-white shadow-md text-[#141413]'
                        : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                    }`}
                    title="Danh sách"
                  >
                    ≡
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => void refetch()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Làm mới
              </button>
            </div>
          </div>

          {/* ── Summary bar ── */}
          {!isLoading && !isError && totalElements > 0 && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
              <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                Hiển thị
              </span>
              <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                {rangeStart === 0 ? '0' : `${rangeStart}–${rangeEnd}`} / {totalElements}
              </strong>
              <div className="w-px h-4 bg-[#E8E6DC] hidden sm:block" />
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Sẵn sàng{' '}
                <strong className="text-[#141413] font-semibold">{stats.published}</strong>
                <span className="text-[#B0AEA5]">trên trang</span>
              </span>
              <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Nháp <strong className="text-[#141413] font-semibold">{stats.draft}</strong>
                <span className="text-[#B0AEA5]">trên trang</span>
              </span>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333] text-center max-w-md">
                {error instanceof Error ? error.message : 'Không thể tải danh sách mẫu'}
              </p>
            </div>
          )}

          {/* ── Empty: filter / search ── */}
          {showFilteredEmpty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                Không tìm thấy mẫu phù hợp với bộ lọc.
              </p>
            </div>
          )}

          {/* ── Empty: library ── */}
          {showLibraryEmpty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                <FileQuestion className="w-6 h-6" />
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center max-w-sm">
                Bạn chưa có mẫu câu hỏi nào. Hãy tạo mẫu đầu tiên.
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
                Tạo mẫu mới
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Grid view ── */}
          {!isLoading && !isError && templates.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, idx) => {
                const accent = coverAccents[idx % coverAccents.length];
                const gradient = coverGradients[idx % coverGradients.length];
                return (
                  <article
                    key={template.id}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                  >
                    <div
                      className="h-[130px] relative flex flex-col justify-end p-4 overflow-hidden flex-shrink-0"
                      style={{ background: gradient }}
                    >
                      <span
                        className="absolute top-3 left-3 font-[Playfair_Display] text-[12px] font-medium opacity-40"
                        style={{ color: accent }}
                      >
                        #{String(page * size + idx + 1).padStart(2, '0')}
                      </span>
                      <div className="absolute top-3 right-3">
                        {template.status === TemplateStatus.PUBLISHED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                            <Eye className="w-3 h-3" /> Sẵn sàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]">
                            <EyeOff className="w-3 h-3" /> Nháp
                          </span>
                        )}
                      </div>
                      <div
                        className="relative font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2 min-h-[2.6rem]"
                        style={{ color: accent }}
                      >
                        <MathText text={template.name} />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#F0EEE6] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          {templateTypeLabel[template.templateType] || template.templateType}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#F0EEE6] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                          <Network className="w-3 h-3 flex-shrink-0" />
                          {cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}
                        </span>
                        {template.gradeLevel && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#F0EEE6] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59]">
                            <GraduationCap className="w-3 h-3 flex-shrink-0" />Lớp{' '}
                            {template.gradeLevel}
                          </span>
                        )}
                        {template.chapterName && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#F0EEE6] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#5E5D59] max-w-full min-w-0"
                            title={template.chapterName}
                          >
                            <BookOpen className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{template.chapterName}</span>
                          </span>
                        )}
                      </div>

                      <div className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2">
                        <MathText text={template.description || 'Chưa có mô tả cho mẫu này.'} />
                      </div>

                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {template.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-violet-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-violet-600 border border-violet-100"
                              title={tag}
                            >
                              {questionTagLabels[tag as QuestionTag] ?? tag}
                            </span>
                          ))}
                          {template.tags.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F]">
                              +{template.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-3 mt-auto border-t border-[#F0EEE6]">
                        <div className="flex flex-wrap gap-2">
                          {template.status === TemplateStatus.DRAFT ? (
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              disabled={
                                publishMutation.isPending && publishMutation.variables === template.id
                              }
                              onClick={() => {
                                publishMutation.mutate(template.id, {
                                  onSuccess: () =>
                                    showToast({ type: 'success', message: 'Đã công khai mẫu.' }),
                                  onError: (err) =>
                                    showToast({
                                      type: 'error',
                                      message:
                                        err instanceof Error
                                          ? err.message
                                          : 'Không thể công khai mẫu.',
                                    }),
                                });
                              }}
                              title="Công khai mẫu để có thể sinh câu hỏi"
                            >
                              {publishMutation.isPending &&
                              publishMutation.variables === template.id ? (
                                <LoadingSpinner label="Đang công khai..." />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Công khai
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-[#30302E] transition-colors"
                              onClick={() => {
                                setSelected(template);
                                setGenerateOpen(true);
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Sinh câu hỏi
                            </button>
                          )}
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                            onClick={() =>
                              navigate(
                                `/teacher/question-review?templateId=${encodeURIComponent(template.id)}`
                              )
                            }
                            title="Duyệt câu hỏi của mẫu này"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            Duyệt
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                            onClick={() => void openEditTemplate(template.id)}
                            disabled={editingTemplateId === template.id}
                            title="Chỉnh sửa mẫu"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {editingTemplateId === template.id ? 'Đang tải' : 'Sửa'}
                          </button>
                          {template.status === TemplateStatus.PUBLISHED && (
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                              disabled={
                                unpublishMutation.isPending &&
                                unpublishMutation.variables === template.id
                              }
                              onClick={() => {
                                unpublishMutation.mutate(template.id, {
                                  onSuccess: () =>
                                    showToast({
                                      type: 'success',
                                      message: 'Đã đưa mẫu về trạng thái nháp.',
                                    }),
                                  onError: (err) =>
                                    showToast({
                                      type: 'error',
                                      message:
                                        err instanceof Error
                                          ? err.message
                                          : 'Không thể hủy công khai mẫu.',
                                    }),
                                });
                              }}
                              title="Hủy công khai"
                              aria-label="Hủy công khai"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                            onClick={() => deleteMutation.mutate(template.id)}
                            title="Xóa mẫu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── List view ── */}
          {!isLoading && !isError && templates.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col gap-2">
              {templates.map((template, idx) => {
                const accent = coverAccents[idx % coverAccents.length];
                const gradient = coverGradients[idx % coverGradients.length];
                return (
                  <article
                    key={template.id}
                    className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: gradient,
                        color: accent,
                      }}
                    >
                      <FileQuestion className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] line-clamp-2 min-w-0 flex-1">
                          <MathText text={template.name} />
                        </div>
                        {template.status === TemplateStatus.PUBLISHED ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-emerald-700">
                            <Eye className="w-3 h-3" /> Sẵn sàng
                          </span>
                        ) : (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F]">
                            <EyeOff className="w-3 h-3" /> Nháp
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#87867F] font-[Be_Vietnam_Pro]">
                        <span>{templateTypeLabel[template.templateType] || template.templateType}</span>
                        <span className="text-[#E8E6DC]">·</span>
                        <span>
                          {cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {template.status === TemplateStatus.DRAFT ? (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                          disabled={
                            publishMutation.isPending && publishMutation.variables === template.id
                          }
                          onClick={() => {
                            publishMutation.mutate(template.id, {
                              onSuccess: () =>
                                showToast({ type: 'success', message: 'Đã công khai mẫu.' }),
                              onError: (err) =>
                                showToast({
                                  type: 'error',
                                  message:
                                    err instanceof Error ? err.message : 'Không thể công khai mẫu.',
                                }),
                            });
                          }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Công khai
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-[#30302E] transition-colors"
                          onClick={() => {
                            setSelected(template);
                            setGenerateOpen(true);
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Sinh câu
                        </button>
                      )}
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                        onClick={() =>
                          navigate(
                            `/teacher/question-review?templateId=${encodeURIComponent(template.id)}`
                          )
                        }
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                        onClick={() => void openEditTemplate(template.id)}
                        disabled={editingTemplateId === template.id}
                      >
                        Sửa
                      </button>
                      {template.status === TemplateStatus.PUBLISHED && (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
                          disabled={
                            unpublishMutation.isPending &&
                            unpublishMutation.variables === template.id
                          }
                          onClick={() => {
                            unpublishMutation.mutate(template.id, {
                              onSuccess: () =>
                                showToast({
                                  type: 'success',
                                  message: 'Đã đưa mẫu về trạng thái nháp.',
                                }),
                              onError: (err) =>
                                showToast({
                                  type: 'error',
                                  message:
                                    err instanceof Error
                                      ? err.message
                                      : 'Không thể hủy công khai mẫu.',
                                }),
                            });
                          }}
                          aria-label="Hủy công khai"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        Xóa
                      </button>
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
            onPageSizeChange={(newSize) => {
              setSize(newSize);
              setPage(0); // back to first page when the size changes
            }}
            pageSizeOptions={[9, 18, 36]}
            showJumpToPage
          />

          {/* Form/modal primitives (.modal-layer, .btn, .input…) live in module-refactor.css
              under .module-layout-container — wrapper must wrap these portaled surfaces. */}
          <div className="module-layout-container contents">
            <TemplateFormModal
              isOpen={formOpen}
              onClose={() => setFormOpen(false)}
              mode={mode}
              initialData={selected}
              onSubmit={saveTemplate}
            />

            <TemplateBulkImportModal
              isOpen={bulkImportOpen}
              onClose={() => setBulkImportOpen(false)}
              onSuccess={() => {
                setBulkImportOpen(false);
                void refetch();
              }}
            />

            {selected && (
              <TemplateGenerateModal
                isOpen={generateOpen}
                onClose={() => setGenerateOpen(false)}
                template={selected}
                onGenerated={(message) => {
                  showToast({ type: 'success', message });
                  setGenerateOpen(false);
                  navigate(`/teacher/question-review?templateId=${encodeURIComponent(selected.id)}`);
                }}
              />
            )}

            <TemplateMethodPicker
              isOpen={methodPickerOpen}
              onClose={() => setMethodPickerOpen(false)}
              onPickReal={() => {
                setMethodPickerOpen(false);
                setRealFormOpen(true);
              }}
              onPickManual={() => {
                setMethodPickerOpen(false);
                setMode('create');
                setSelected(null);
                setFormOpen(true);
              }}
            />

            <RealQuestionForm
              isOpen={realFormOpen}
              onClose={() => setRealFormOpen(false)}
              onBlueprintReady={(req, res) => {
                setBlueprintRequest(req);
                setBlueprintResponse(res);
                setRealFormOpen(false);
                setConfirmOpen(true);
              }}
            />

            <BlueprintConfirmModal
              isOpen={confirmOpen}
              request={blueprintRequest}
              blueprint={blueprintResponse}
              onCancel={() => {
                setConfirmOpen(false);
                setBlueprintRequest(null);
                setBlueprintResponse(null);
              }}
              onConfirm={async (payload) => {
                await createMutation.mutateAsync(payload);
                showToast({
                  type: 'success',
                  message: 'Đã tạo template từ Blueprint AI.',
                });
                setConfirmOpen(false);
                setBlueprintRequest(null);
                setBlueprintResponse(null);
                void refetch();
              }}
            />
          </div>

          {/* Canonical/Review Modals hidden per ISSUE-11 */}

          {activeDiagram != null && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Đóng preview"
                onClick={() => setActiveDiagram(null)}
                className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
              />
              <div className="relative z-[1] bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-start justify-between gap-3 bg-[#FAF9F5]">
                  <div>
                    <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                      Diagram Preview
                    </h3>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                      Bấm ra ngoài hoặc nút X để đóng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDiagram(null)}
                    className="p-2 rounded-xl border border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  {activeDiagramLatexCode && <LatexRenderer latex={activeDiagramLatexCode} />}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {activeDiagramLatexValues.map((latexValue) => (
                        <div
                          key={`diagram-modal-latex-${latexValue}`}
                          className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-4"
                        >
                          <LatexRenderer latex={latexValue} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length === 0 && (
                    <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F] text-center py-8">
                      Không có dữ liệu preview để hiển thị.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
