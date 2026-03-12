import React, { useState } from 'react';
import {
    useGetMyQuestionTemplates,
    useTogglePublicStatus,
    usePublishTemplate,
    useArchiveTemplate,
    useDeleteQuestionTemplate,
    useCreateQuestionTemplate,
    useUpdateQuestionTemplate
} from '../../hooks/useQuestionTemplate';
import {
    TemplateStatus,
    QuestionType,
    CognitiveLevel
} from '../../types/questionTemplate';
import type {
    QuestionTemplateResponse,
    QuestionTemplateRequest,
    TemplateDraft
} from '../../types/questionTemplate';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplateTestModal } from './TemplateTestModal';
import { TemplateImportModal } from './TemplateImportModal';
import {
    FileText,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Archive,
    Search,
    Plus,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Play,
    Upload
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    TemplateStatus,
    { label: string; bg: string; text: string; dot: string }
> = {
    [TemplateStatus.DRAFT]: {
        label: 'Bản Nháp',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
    },
    [TemplateStatus.PUBLISHED]: {
        label: 'Đã xuất bản',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
    },
    [TemplateStatus.ARCHIVED]: {
        label: 'Lưu Trữ',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
    },
};

const getQuestionTypeName = (type: string) => {
    const map: Record<string, string> = {
        'MULTIPLE_CHOICE': 'Trắc nghiệm',
        'TRUE_FALSE': 'Đúng/Sai',
        'SHORT_ANSWER': 'Trả lời ngắn',
        'ESSAY': 'Tự luận',
        'CODING': 'Lập trình'
    };
    return map[type] || type;
};

const getCognitiveLevelName = (level: string) => {
    const map: Record<string, string> = {
        'REMEMBER': 'Nhận biết',
        'UNDERSTAND': 'Thông hiểu',
        'APPLY': 'Vận dụng',
        'ANALYZE': 'Phân tích',
        'EVALUATE': 'Đánh giá',
        'CREATE': 'Sáng tạo'
    };
    return map[level] || level;
};

// ─── UI Components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TemplateStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[TemplateStatus.DRAFT];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function TypeTag({ type, level }: { type: QuestionType, level: CognitiveLevel }) {
    return (
        <div className="flex gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                {getQuestionTypeName(type)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                {getCognitiveLevelName(level)}
            </span>
        </div>
    );
}

function TemplateCard({
    template,
    onEdit,
    onPublish,
    onArchive,
    onDelete,
    onTogglePublic,
    onTest
}: {
    template: QuestionTemplateResponse;
    onEdit: () => void;
    onPublish: () => void;
    onArchive: () => void;
    onDelete: () => void;
    onTogglePublic: () => void;
    onTest: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
            {/* Card top accent */}
            <div
                className={`h-1.5 ${template.status === TemplateStatus.PUBLISHED
                    ? 'bg-emerald-500'
                    : template.status === TemplateStatus.ARCHIVED
                        ? 'bg-amber-500'
                        : 'bg-indigo-400'
                    }`}
            />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={template.status} />
                    <button
                        onClick={onTogglePublic}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${template.isPublic
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title={template.isPublic ? "Đang Công khai - Nhấn để đổi thành Riêng tư" : "Đang Riêng tư - Nhấn để đổi thành Công khai"}
                    >
                        {template.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                        {template.isPublic ? 'Công khai' : 'Riêng tư'}
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug">
                    {template.name}
                </h3>

                {/* Description */}
                {template.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                )}

                {/* Tags & Meta */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                    <TypeTag type={template.templateType} level={template.cognitiveLevel} />
                    {template.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                            #{tag}
                        </span>
                    ))}
                    {(template.tags?.length || 0) > 2 && (
                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                            +{(template.tags?.length || 0) - 2}
                        </span>
                    )}
                </div>

                {/* Meta stats */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                        <FileText size={13} />
                        Đã dùng: {template.usageCount || 0} lần
                    </span>
                    {template.avgSuccessRate !== undefined && (
                        <span className="flex items-center gap-1 text-emerald-600">
                            Tỉ lệ đúng: {Math.round(template.avgSuccessRate * 100)}%
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {/* Test Button - Available for all */}
                    <button
                        onClick={onTest}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.98] transition-all"
                    >
                        <Play size={13} className="fill-current" /> Sinh thử KH
                    </button>

                    {template.status === TemplateStatus.DRAFT && (
                        <>
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                            >
                                <Edit size={13} /> Sửa
                            </button>
                            <button
                                onClick={onPublish}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow active:scale-[0.98] transition-all ml-auto"
                            >
                                Xuất bản
                            </button>
                        </>
                    )}

                    {template.status === TemplateStatus.PUBLISHED && (
                        <>
                            <button
                                onClick={onArchive}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98] transition-all ml-auto"
                            >
                                <Archive size={13} /> Lưu trữ
                            </button>
                        </>
                    )}

                    {template.status === TemplateStatus.ARCHIVED && (
                        <>
                            <p className="text-xs text-slate-400 italic my-auto ml-auto">Không thể chỉnh sửa</p>
                        </>
                    )}

                    <button
                        onClick={onDelete}
                        className={`flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${template.status === TemplateStatus.DRAFT ? '' : (template.status === TemplateStatus.ARCHIVED ? '' : 'ml-2')}`}
                        title="Xóa mẫu câu hỏi"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const TemplateDashboard: React.FC = () => {
    // Filter & pagination state
    const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 12;

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTestOpen, setIsTestOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplateResponse | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // ── React Query ──────────────────────────────────────────────────────────
    // using search API to support ALL filters out of the box
    const queryParams: Record<string, unknown> = {
        page,
        size: PAGE_SIZE,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
    };
    if (search.trim()) queryParams.searchTerm = search;

    // We can use the generic search api, but the user might just want 'my templates'.
    // However, the backend /my doesn't accept status/search. 
    // The instructions say use `searchQuestionTemplates` if we need filters. Wait, `searchQuestionTemplates` returns ALL public templates too.
    // For now, let's just fetch "My" templates and filter client-side if it's small, or just trust the backend.
    // Given the previous code, we just used `useGetMyQuestionTemplates`. I will stick to it and client-side filter for now.

    const { data, isLoading, isError, error, refetch } = useGetMyQuestionTemplates(page, 50, 'createdAt', 'DESC');
    const allTemplates: QuestionTemplateResponse[] = data?.result?.content ?? [];

    const filteredTemplates = allTemplates.filter(t => {
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some(tag => tag.toLowerCase().includes(q));
        }
        return true;
    });

    const totalPages: number = Math.ceil(filteredTemplates.length / PAGE_SIZE) || 1;
    const paginatedTemplates = filteredTemplates.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const togglePublicMutation = useTogglePublicStatus();
    const publishMutation = usePublishTemplate();
    const archiveMutation = useArchiveTemplate();
    const deleteMutation = useDeleteQuestionTemplate();
    const createMutation = useCreateQuestionTemplate();
    const updateMutation = useUpdateQuestionTemplate();

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleCreate = () => {
        setModalMode('create');
        setSelectedTemplate(null);
        setIsFormOpen(true);
    };

    const handleImport = () => {
        setIsImportOpen(true);
    };

    const handleUseImportedTemplate = (draft: TemplateDraft) => {
        setIsImportOpen(false);
        setModalMode('create');
        setSelectedTemplate(draft as unknown as QuestionTemplateResponse);
        setIsFormOpen(true);
        showToast('Đã tải cấu trúc từ file. Vui lòng kiểm tra và lưu lại.', 'success');
    };

    const handleEdit = (template: QuestionTemplateResponse) => {
        setModalMode('edit');
        setSelectedTemplate(template);
        setIsFormOpen(true);
    };

    const handleTest = (template: QuestionTemplateResponse) => {
        setSelectedTemplate(template);
        setIsTestOpen(true);
    };

    const handleFormSubmit = async (data: QuestionTemplateRequest) => {
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync(data);
                showToast('Tạo mẫu câu hỏi thành công! 🎉');
            } else if (selectedTemplate) {
                await updateMutation.mutateAsync({ id: selectedTemplate.id, request: data });
                showToast('Cập nhật mẫu câu hỏi thành công!');
            }
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error');
            throw err;
        }
    };

    const handlePublish = async (id: string) => {
        if (!window.confirm('Xuất bản mẫu câu hỏi này? Sau khi xuất bản, bạn không thể chỉnh sửa cấu trúc.'))
            return;
        try {
            await publishMutation.mutateAsync(id);
            showToast('Xuất bản thành công! Mẫu có thể dùng để sinh KH. ✅');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi xuất bản', 'error');
        }
    };

    const handleArchive = async (id: string) => {
        if (!window.confirm('Lưu trữ mẫu này? Bạn sẽ không thể sử dụng nó để sinh câu hỏi nữa.')) return;
        try {
            await archiveMutation.mutateAsync(id);
            showToast('Đã lưu trữ mẫu câu hỏi.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi lưu trữ', 'error');
        }
    };

    const handleTogglePublic = async (id: string) => {
        try {
            await togglePublicMutation.mutateAsync(id);
            showToast('Đã thay đổi trạng thái chia sẻ.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa mẫu câu hỏi này? Hành động không thể hoàn tác.')) return;
        try {
            await deleteMutation.mutateAsync(id);
            showToast('Đã xóa mẫu câu hỏi thành công.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi xóa', 'error');
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
            notificationCount={0}
        >
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-fade-in ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'error' && <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 rounded-xl">
                                    <FileText className="text-indigo-600" size={24} />
                                </div>
                                Quản lý Mẫu Câu hỏi
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Tạo các mẫu câu hỏi động sử dụng AI sinh ra hàng ngàn câu hỏi đa dạng
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleImport}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98] transition-all"
                            >
                                <Upload size={18} />
                                Import từ File
                            </button>
                            <button
                                onClick={handleCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] transition-all"
                            >
                                <Plus size={18} />
                                Tạo mẫu mới
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search
                                    size={18}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    placeholder="Tìm theo tên, mô tả, từ khóa..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>

                            {/* Status filter tabs */}
                            <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 overflow-x-auto">
                                {(['ALL', TemplateStatus.DRAFT, TemplateStatus.PUBLISHED, TemplateStatus.ARCHIVED] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setFilterStatus(s);
                                            setPage(0);
                                        }}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${filterStatus === s
                                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transparent'
                                            }`}
                                    >
                                        {s === 'ALL'
                                            ? 'Tất cả'
                                            : STATUS_CONFIG[s as TemplateStatus].label}
                                    </button>
                                ))}
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={() => refetch()}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all ml-auto active:scale-[0.98]"
                                title="Làm mới"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ── Content ──────────────────────────────────────────── */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Loader2 size={40} className="animate-spin mb-3" />
                            <p className="text-sm">Đang tải biểu mẫu câu hỏi...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-24 text-red-500">
                            <AlertCircle size={40} className="mb-3" />
                            <p className="text-sm font-medium">
                                {error instanceof Error
                                    ? error.message
                                    : 'Không thể tải dữ liệu. Vui lòng thử lại.'}
                            </p>
                            <button
                                onClick={() => refetch()}
                                className="mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-6 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed max-w-2xl mx-auto shadow-sm">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} />
                            </div>
                            <p className="text-lg font-bold text-slate-700 mb-2">Chưa có mẫu câu hỏi nào</p>
                            <p className="text-sm font-medium text-slate-500 text-center mb-8 max-w-md">
                                {search || filterStatus !== 'ALL'
                                    ? 'Không tìm thấy kết quả phù hợp với bộ lọc.'
                                    : 'Hãy bắt đầu tạo mẫu câu hỏi đầu tiên của bạn để sinh đề tự động bằng AI!'}
                            </p>
                            {(!search && filterStatus === 'ALL') && (
                                <button
                                    onClick={handleCreate}
                                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Tạo Mẫu Câu Hỏi Đầu Tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {paginatedTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onEdit={() => handleEdit(template)}
                                        onPublish={() => handlePublish(template.id)}
                                        onArchive={() => handleArchive(template.id)}
                                        onDelete={() => handleDelete(template.id)}
                                        onTogglePublic={() => handleTogglePublic(template.id)}
                                        onTest={() => handleTest(template)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                        Trang {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {/* Spacer at the bottom to breathe */}
                <div className="h-16"></div>
            </div>

            {/* Modals */}
            <TemplateFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedTemplate}
                mode={modalMode}
            />

            {selectedTemplate && (
                <TemplateTestModal
                    isOpen={isTestOpen}
                    onClose={() => setIsTestOpen(false)}
                    template={selectedTemplate}
                />
            )}

            <TemplateImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onUseTemplate={handleUseImportedTemplate}
            />
        </DashboardLayout>
    );
};
