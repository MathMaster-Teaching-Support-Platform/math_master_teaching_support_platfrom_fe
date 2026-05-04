import {
  AlertCircle,
  Archive,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Grid2x2,
  Inbox,
  List,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LatexRenderer from '../../components/common/LatexRenderer';
import MathText from '../../components/common/MathText';
import Pagination from '../../components/common/Pagination';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

import {
  useArchiveTemplate,
  useCreateQuestionTemplate,
  useDeleteQuestionTemplate,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import { questionTemplateService } from '../../services/questionTemplateService';
import '../../styles/module-refactor.css';

import {
  questionTagLabels,
  TemplateStatus,
  type QuestionTag,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import '../courses/TeacherCourses.css';
import './template-review.css';
import './TemplateCard.css';
import { TemplateBulkImportModal } from './TemplateBulkImportModal';
import { TemplateFormModal } from './TemplateFormModal';

import { TemplateMethodPicker } from './TemplateMethodPicker';
import { RealQuestionForm } from './RealQuestionForm';
import { BlueprintConfirmModal } from './BlueprintConfirmModal';
import { TemplateGenerateModal } from './TemplateGenerateModal';
import type {
  BlueprintFromRealQuestionRequest,
  BlueprintFromRealQuestionResponse,
} from '../../types/questionTemplate';

const statusFilters: Array<'ALL' | TemplateStatus> = [
  'ALL',
  TemplateStatus.DRAFT,
  TemplateStatus.PUBLISHED,
  TemplateStatus.ARCHIVED,
];

const statusLabel: Record<'ALL' | TemplateStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
};

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
  const [search, setSearch] = useState('');
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
  const [blueprintRequest, setBlueprintRequest] =
    useState<BlueprintFromRealQuestionRequest | null>(null);
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
  const archiveMutation = useArchiveTemplate();
  // Unpublish + toggle-public mutations were dropped from the card footer to
  // keep it scannable; the form modal manages those transitions on its own.


  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const templates = useMemo(() => data?.result?.content ?? [], [data]);
  const totalPages = data?.result?.totalPages ?? 0;
  const totalElements = data?.result?.totalElements ?? 0;

  const stats = useMemo(
    () => ({
      total: totalElements,
      published: templates.filter((t) => t.status === TemplateStatus.PUBLISHED).length,
      draft: templates.filter((t) => t.status === TemplateStatus.DRAFT).length,
      archived: templates.filter((t) => t.status === TemplateStatus.ARCHIVED).length,
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



  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container">
        <section className="module-page teacher-courses-page template-dashboard-page">
          {/* ── Header ── */}
          <header className="page-header courses-header-row">
            <div className="header-stack">
              <div className="row" style={{ gap: '0.6rem' }}>
                <h2>Mẫu câu hỏi</h2>
                {!isLoading && <span className="count-chip">{templates.length}</span>}
              </div>
              <p className="header-sub">
                {stats.published} đã xuất bản • {stats.draft} bản nháp
              </p>
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate('/teacher/question-review')}
              >
                <Inbox size={14} />
                Hàng đợi duyệt
              </button>

              <button
                type="button"
                className="btn secondary btn--tint-violet"
                onClick={() => setBulkImportOpen(true)}
              >
                <Upload size={14} />
                Nhập từ Excel
              </button>

              <button
                type="button"
                className="btn btn--feat-violet"
                onClick={() => setMethodPickerOpen(true)}
              >
                <Plus size={14} />
                Tạo mẫu mới
              </button>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <h3>{stats.total}</h3>
                <p>Tổng mẫu</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3>{stats.published}</h3>
                <p>Đã xuất bản</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <Network size={20} />
              </div>
              <div>
                <h3>{stats.draft}</h3>
                <p>Bản nháp</p>
              </div>
            </div>
            <div className="stat-card stat-violet">
              <div className="stat-icon-wrap">
                <Archive size={20} />
              </div>
              <div>
                <h3>{stats.archived}</h3>
                <p>Đã lưu trữ</p>
              </div>
            </div>
          </div>

          {/* canonical question workflow card hidden temporarily */}

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <label className="search-box">
              <span className="search-box__icon" aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                placeholder="Tìm mẫu câu hỏi..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="search-box__clear"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => {
                    setSearch('');
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="pill-group">
              {statusFilters.map((item) => (
                <button
                  key={item}
                  className={`pill-btn${status === item ? ' active' : ''}`}
                  onClick={() => {
                    setStatus(item);
                  }}
                >
                  {statusLabel[item]}
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
              <p>{error instanceof Error ? error.message : 'Không thể tải danh sách mẫu'}</p>
            </div>
          )}

          {/* ── Empty: no results ── */}
          {!isLoading &&
            !isError &&
            templates.length === 0 &&
            (debouncedSearch || status !== 'ALL') && (
              <div className="empty">
                <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>Không tìm thấy mẫu phù hợp với bộ lọc.</p>
              </div>
            )}

          {/* ── Empty: no templates ── */}
          {!isLoading && !isError && templates.length === 0 && (
            <div className="empty">
              <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Bạn chưa có mẫu câu hỏi nào. Hãy tạo mẫu đầu tiên.</p>
              <button
                type="button"
                className="btn btn--feat-violet"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setMode('create');
                  setSelected(null);
                  setFormOpen(true);
                }}
              >
                Tạo mẫu mới
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          {!isLoading && !isError && templates.length > 0 && (
            <div className={`grid-cards${viewMode === 'list' ? ' list-view' : ''}`}>
              {templates.map((template) => {
                const statusLabelMap: Record<string, string> = {
                  PUBLISHED: 'Đã xuất bản',
                  DRAFT: 'Nháp',
                  ARCHIVED: 'Lưu trữ',
                };
                const statusKey = template.status as keyof typeof statusLabelMap;
                return (
                  <article
                    key={template.id}
                    className="tpl-card"
                    data-status={template.status}
                  >
                    <div className="tpl-card-header">
                      <h3 className="tpl-card-title" title={template.name}>
                        <MathText text={template.name} />
                      </h3>
                      <span className="tpl-card-status" data-status={template.status}>
                        {template.status === TemplateStatus.PUBLISHED && <Eye size={11} />}
                        {template.status === TemplateStatus.DRAFT && <EyeOff size={11} />}
                        {template.status === TemplateStatus.ARCHIVED && <Archive size={11} />}
                        {statusLabelMap[statusKey] || template.status}
                      </span>
                    </div>

                    <div className="tpl-card-body">
                      <div className="tpl-card-meta">
                        <span className="tpl-meta-chip">
                          <FileText size={11} />
                          {templateTypeLabel[template.templateType] || template.templateType}
                        </span>
                        <span className="tpl-meta-chip">
                          <Network size={11} />
                          {cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}
                        </span>
                        {template.gradeLevel && (
                          <span className="tpl-meta-chip">
                            <GraduationCap size={11} />
                            Lớp {template.gradeLevel}
                          </span>
                        )}
                        {template.chapterName && (
                          <span className="tpl-meta-chip" title={template.chapterName}>
                            <BookOpen size={11} />
                            {template.chapterName}
                          </span>
                        )}
                        {template.isPublic && (
                          <span className="tpl-meta-chip tpl-meta-chip--public">
                            <Eye size={11} />
                            Công khai
                          </span>
                        )}
                      </div>

                      <p className="tpl-card-desc">
                        <MathText text={template.description || 'Không có mô tả'} />
                      </p>

                      {template.tags && template.tags.length > 0 && (
                        <div className="tpl-card-tags">
                          {template.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="tpl-tag-chip"
                              // Tooltip keeps the raw enum visible for debugging
                              // while the chip itself shows the Vietnamese label
                              // students/teachers expect to see.
                              title={tag}
                            >
                              {questionTagLabels[tag as QuestionTag] ?? tag}
                            </span>
                          ))}
                          {template.tags.length > 4 && (
                            <span className="tpl-tag-chip">+{template.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="tpl-card-footer">
                      {/* Primary action depends on status — exactly one CTA per state. */}
                      {template.status === TemplateStatus.DRAFT && (
                        <button
                          type="button"
                          className="btn btn--feat-emerald tpl-card-primary"
                          onClick={() => publishMutation.mutate(template.id)}
                        >
                          <FileText size={13} />
                          Xuất bản
                        </button>
                      )}
                      {template.status === TemplateStatus.PUBLISHED && (
                        <button
                          className="btn btn--feat-violet tpl-card-primary"
                          onClick={() => {
                            setSelected(template);
                            setGenerateOpen(true);
                          }}
                        >
                          <Sparkles size={13} />
                          Sinh câu hỏi
                        </button>
                      )}
                      {template.status === TemplateStatus.ARCHIVED && (
                        <button
                          className="btn secondary tpl-card-primary"
                          onClick={() => publishMutation.mutate(template.id)}
                          title="Khôi phục về DRAFT để chỉnh sửa"
                        >
                          <FileText size={13} />
                          Khôi phục
                        </button>
                      )}

                      <div className="tpl-card-secondary">
                        <button
                          className="btn secondary"
                          onClick={() =>
                            navigate(
                              `/teacher/question-review?templateId=${encodeURIComponent(template.id)}`
                            )
                          }
                          title="Câu hỏi đang chờ duyệt cho mẫu này"
                        >
                          <Inbox size={13} />
                          Chờ duyệt
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() => void openEditTemplate(template.id)}
                          disabled={editingTemplateId === template.id}
                          title="Chỉnh sửa mẫu"
                        >
                          <Pencil size={13} />
                          {editingTemplateId === template.id ? 'Đang tải' : 'Sửa'}
                        </button>
                        {template.status === TemplateStatus.PUBLISHED && (
                          <button
                            className="btn warn"
                            onClick={() => archiveMutation.mutate(template.id)}
                            title="Lưu trữ — học sinh không thấy nữa"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                        <button
                          className="btn danger-outline"
                          onClick={() => deleteMutation.mutate(template.id)}
                          title="Xóa mẫu"
                        >
                          <Trash2 size={13} />
                        </button>
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
            onPageSizeChange={(newSize) => {
              setSize(newSize);
              setPage(0); // back to first page when the size changes
            }}
            // 9 keeps the 3×3 grid alignment; 18 / 36 are 2× / 4× of that.
            pageSizeOptions={[9, 18, 36]}
            showJumpToPage
          />

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
                navigate(
                  `/teacher/question-review?templateId=${encodeURIComponent(selected.id)}`
                );
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






          {/* Canonical/Review Modals hidden per ISSUE-11 */}

          {activeDiagram != null && (
            <div className="modal-layer">
              <button
                type="button"
                aria-label="Dong preview"
                onClick={() => setActiveDiagram(null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
              />
              <div
                className="modal-card"
                style={{ width: 'min(1100px, 96vw)', position: 'relative', zIndex: 1 }}
              >
                <div className="modal-header">
                  <div>
                    <h3>Diagram Preview</h3>
                    <p className="muted" style={{ marginTop: 4 }}>
                      Bam ra ngoai hoac nut X de dong.
                    </p>
                  </div>
                  <button className="icon-btn" onClick={() => setActiveDiagram(null)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="modal-body">
                  {activeDiagramLatexCode && <LatexRenderer latex={activeDiagramLatexCode} />}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length > 0 && (
                    <div
                      className="row"
                      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
                    >
                      {activeDiagramLatexValues.map((latexValue) => (
                        <div key={`diagram-modal-latex-${latexValue}`} className="preview-box">
                          <LatexRenderer latex={latexValue} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!activeDiagramLatexCode && activeDiagramLatexValues.length === 0 && (
                    <div className="empty">Khong co du lieu preview de hien thi.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
