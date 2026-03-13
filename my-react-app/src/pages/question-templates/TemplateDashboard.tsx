import { useMemo, useState } from 'react';
import {
  Archive,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useArchiveTemplate,
  useCreateQuestionTemplate,
  useDeleteQuestionTemplate,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useTogglePublicStatus,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import {
  TemplateStatus,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
  type TemplateDraft,
} from '../../types/questionTemplate';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import '../../styles/module-refactor.css';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplateImportModal } from './TemplateImportModal';
import { TemplateTestModal } from './TemplateTestModal';

const statusFilters: Array<'ALL' | TemplateStatus> = ['ALL', TemplateStatus.DRAFT, TemplateStatus.PUBLISHED, TemplateStatus.ARCHIVED];

const statusClass: Record<TemplateStatus, string> = {
  DRAFT: 'badge draft',
  PUBLISHED: 'badge published',
  ARCHIVED: 'badge archived',
};

const statusLabel: Record<'ALL' | TemplateStatus, string> = {
  ALL: 'Tất cả',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
};

const cardStatusLabel: Record<TemplateStatus, string> = {
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
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

export function TemplateDashboard() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | TemplateStatus>('ALL');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selected, setSelected] = useState<QuestionTemplateResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetMyQuestionTemplates(0, 200, 'createdAt', 'DESC');

  const createMutation = useCreateQuestionTemplate();
  const updateMutation = useUpdateQuestionTemplate();
  const deleteMutation = useDeleteQuestionTemplate();
  const publishMutation = usePublishTemplate();
  const archiveMutation = useArchiveTemplate();
  const togglePublicMutation = useTogglePublicStatus();

  const templates = data?.result?.content ?? [];

  const filtered = useMemo(() => {
    return templates.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [search, status, templates]);

  async function saveTemplate(payload: QuestionTemplateRequest) {
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
      return;
    }
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, request: payload });
  }

  function openCreateFromDraft(draft?: TemplateDraft) {
    setMode('create');
    setSelected(draft as QuestionTemplateResponse | null);
    setFormOpen(true);
  }

  return (
    <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
      <section className="module-page">
        <header className="page-header">
          <div>
            <h2>Mẫu câu hỏi</h2>
            <p>Quản lý logic tạo câu hỏi tái sử dụng và vòng đời của mẫu.</p>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button className="btn secondary" onClick={() => setImportOpen(true)}>
              <Upload size={14} />
              Nhập file
            </button>
            <button
              className="btn"
              onClick={() => {
                setMode('create');
                setSelected(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} />
              Tạo mẫu mới
            </button>
          </div>
        </header>

        <div className="toolbar">
          <label className="row" style={{ minWidth: 260 }}>
            <Search size={15} />
            <input
              className="input"
              style={{ border: 0, padding: 0, width: '100%' }}
              placeholder="Tìm mẫu câu hỏi"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="pill-group">
            {statusFilters.map((item) => (
              <button key={item} className={`pill-btn ${status === item ? 'active' : ''}`} onClick={() => setStatus(item)}>
                {statusLabel[item]}
              </button>
            ))}
          </div>

          <button className="btn secondary" onClick={() => void refetch()}>
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>

        {isLoading && <div className="empty">Đang tải danh sách mẫu...</div>}
        {isError && <div className="empty">{error instanceof Error ? error.message : 'Không thể tải danh sách mẫu'}</div>}
        {!isLoading && !isError && filtered.length === 0 && <div className="empty">Không tìm thấy mẫu phù hợp.</div>}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid-cards">
            {filtered.map((template) => (
              <article key={template.id} className="data-card">
                <div className="row">
                  <span className={statusClass[template.status]}>{cardStatusLabel[template.status]}</span>
                  <button className="btn secondary" onClick={() => togglePublicMutation.mutate(template.id)}>
                    {template.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                    {template.isPublic ? 'Công khai' : 'Riêng tư'}
                  </button>
                </div>

                <div>
                  <h3>{template.name}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>{template.description || 'Không có mô tả'}</p>
                </div>

                <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                  <span className="muted">{templateTypeLabel[template.templateType] || template.templateType}</span>
                  <span className="muted">{cognitiveLevelLabel[template.cognitiveLevel] || template.cognitiveLevel}</span>
                  <span className="muted">Đã dùng: {template.usageCount ?? 0} lần</span>
                </div>

                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setSelected(template);
                      setTestOpen(true);
                    }}
                  >
                    <Play size={14} />
                    Chạy thử
                  </button>

                  {template.status === TemplateStatus.DRAFT && (
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setMode('edit');
                        setSelected(template);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                      Chỉnh sửa
                    </button>
                  )}

                  {template.status === TemplateStatus.DRAFT && (
                    <button className="btn" onClick={() => publishMutation.mutate(template.id)}>
                      <FileText size={14} />
                      Xuất bản
                    </button>
                  )}

                  {template.status === TemplateStatus.PUBLISHED && (
                    <button className="btn warn" onClick={() => archiveMutation.mutate(template.id)}>
                      <Archive size={14} />
                      Lưu trữ
                    </button>
                  )}

                  <button className="btn danger" onClick={() => deleteMutation.mutate(template.id)}>
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <TemplateFormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          mode={mode}
          initialData={selected}
          onSubmit={saveTemplate}
        />

        <TemplateImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onUseTemplate={(draft) => {
            setImportOpen(false);
            openCreateFromDraft(draft);
          }}
        />

        {selected && <TemplateTestModal isOpen={testOpen} onClose={() => setTestOpen(false)} template={selected} />}
      </section>
    </DashboardLayout>
  );
}
