import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Plus,
    Search,
    Clock,
    HelpCircle,
    Star,
    Eye,
    Pencil,
    Trash2,
    Send,
    X,
    Copy,
    Lock,
    AlertCircle,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import AssessmentModal from './AssessmentModal';
import {
    useMyAssessments,
    useCreateAssessment,
    useUpdateAssessment,
    useDeleteAssessment,
    usePublishAssessment,
    useUnpublishAssessment,
    useCloseAssessment,
    useCloneAssessment,
} from '../../hooks/useAssessment';
import type {
    AssessmentRequest,
    AssessmentResponse,
    AssessmentStatus,
    AssessmentType,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    AssessmentStatus,
    { label: string; bg: string; text: string; dot: string }
> = {
    DRAFT: {
        label: 'Nháp',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
    },
    PUBLISHED: {
        label: 'Đã xuất bản',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
    },
    CLOSED: {
        label: 'Đã đóng',
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
    },
};

const TYPE_CONFIG: Record<AssessmentType, { label: string; icon: string }> = {
    QUIZ: { label: 'Trắc nghiệm', icon: '🧠' },
    TEST: { label: 'Kiểm tra', icon: '📝' },
    EXAM: { label: 'Thi học kỳ', icon: '🎓' },
    HOMEWORK: { label: 'Bài tập', icon: '📚' },
};

function StatusBadge({ status }: { status: AssessmentStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function TypeTag({ type }: { type: AssessmentType }) {
    const cfg = TYPE_CONFIG[type] ?? { label: type, icon: '📄' };
    return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ─── Clone Modal ──────────────────────────────────────────────────────────────
function CloneModal({
    assessment,
    onClose,
    onClone,
    isLoading,
}: {
    assessment: AssessmentResponse;
    onClose: () => void;
    onClone: (newTitle: string, cloneQuestions: boolean) => void;
    isLoading: boolean;
}) {
    const [newTitle, setNewTitle] = useState(`[Bản sao] ${assessment.title}`);
    const [cloneQuestions, setCloneQuestions] = useState(true);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Nhân bản bài kiểm tra</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                    Tạo bản sao DRAFT từ «{assessment.title}»
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tiêu đề mới
                </label>
                <input
                    id="clone-title"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mb-5">
                    <input
                        type="checkbox"
                        checked={cloneQuestions}
                        onChange={(e) => setCloneQuestions(e.target.checked)}
                        className="accent-indigo-600"
                    />
                    Sao chép danh sách câu hỏi
                </label>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onClone(newTitle, cloneQuestions)}
                        disabled={!newTitle.trim() || isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        Nhân bản
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Assessment Card ──────────────────────────────────────────────────────────
function AssessmentCard({
    assessment,
    onEdit,
    onView,
    onPublish,
    onUnpublish,
    onClose,
    onDelete,
    onClone,
}: {
    assessment: AssessmentResponse;
    onEdit: () => void;
    onView: () => void;
    onPublish: () => void;
    onUnpublish: () => void;
    onClose: () => void;
    onDelete: () => void;
    onClone: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
            {/* Card top accent */}
            <div
                className={`h-1.5 ${assessment.status === 'PUBLISHED'
                        ? 'bg-emerald-400'
                        : assessment.status === 'CLOSED'
                            ? 'bg-red-400'
                            : 'bg-slate-300'
                    }`}
            />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={assessment.status} />
                    <TypeTag type={assessment.assessmentType} />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug">
                    {assessment.title}
                </h3>

                {/* Description */}
                {assessment.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{assessment.description}</p>
                )}

                {/* Meta stats */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-auto pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                        <HelpCircle size={13} />
                        {assessment.totalQuestions} câu
                    </span>
                    <span className="flex items-center gap-1">
                        <Star size={13} />
                        {assessment.totalPoints} điểm
                    </span>
                    {assessment.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {assessment.timeLimitMinutes} phút
                        </span>
                    )}
                    {assessment.submissionCount > 0 && (
                        <span className="flex items-center gap-1">
                            <BookOpen size={13} />
                            {assessment.submissionCount} bài nộp
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        onClick={onView}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Eye size={13} /> Xem
                    </button>

                    {assessment.status === 'DRAFT' && (
                        <>
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <Pencil size={13} /> Sửa
                            </button>
                            <button
                                onClick={onPublish}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                                <Send size={13} /> Xuất bản
                            </button>
                            {assessment.submissionCount === 0 && (
                                <button
                                    onClick={onDelete}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={13} /> Xóa
                                </button>
                            )}
                        </>
                    )}

                    {assessment.status === 'PUBLISHED' && (
                        <>
                            {assessment.submissionCount === 0 && (
                                <button
                                    onClick={onUnpublish}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                    <ChevronDown size={13} /> Hủy xuất bản
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Lock size={13} /> Đóng
                            </button>
                        </>
                    )}

                    <button
                        onClick={onClone}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors ml-auto"
                    >
                        <Copy size={13} /> Nhân bản
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TeacherAssessments: React.FC = () => {
    const navigate = useNavigate();

    // Filter & pagination state
    const [filterStatus, setFilterStatus] = useState<AssessmentStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 12;

    // Modal state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResponse | null>(null);

    // Clone modal state
    const [cloneTarget, setCloneTarget] = useState<AssessmentResponse | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // ── React Query ──────────────────────────────────────────────────────────
    const queryParams = {
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        page,
        size: PAGE_SIZE,
        sortBy: 'createdAt',
        sortDirection: 'DESC' as const,
    };

    const { data, isLoading, isError, error, refetch } = useMyAssessments(queryParams);
    const assessments: AssessmentResponse[] = data?.result?.content ?? [];
    const totalPages: number = data?.result?.totalPages ?? 0;

    const createMutation = useCreateAssessment();
    const updateMutation = useUpdateAssessment();
    const deleteMutation = useDeleteAssessment();
    const publishMutation = usePublishAssessment();
    const unpublishMutation = useUnpublishAssessment();
    const closeMutation = useCloseAssessment();
    const cloneMutation = useCloneAssessment();

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCreate = () => {
        setModalMode('create');
        setSelectedAssessment(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (assessment: AssessmentResponse) => {
        setModalMode('edit');
        setSelectedAssessment(assessment);
        setIsFormModalOpen(true);
    };

    const handleView = (id: string) => navigate(`/teacher/assessments/${id}`);

    const handleModalSubmit = async (data: AssessmentRequest) => {
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync(data);
                showToast('Tạo bài kiểm tra thành công! 🎉');
            } else if (selectedAssessment) {
                await updateMutation.mutateAsync({ id: selectedAssessment.id, data });
                showToast('Cập nhật thành công!');
            }
            setIsFormModalOpen(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi lưu bài kiểm tra';
            showToast(msg, 'error');
            throw err;
        }
    };

    const handlePublish = async (id: string) => {
        if (!window.confirm('Xuất bản bài kiểm tra này? Sau khi xuất bản, bạn không thể chỉnh sửa.'))
            return;
        try {
            await publishMutation.mutateAsync(id);
            showToast('Xuất bản thành công! Students can now access it. ✅');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi xuất bản', 'error');
        }
    };

    const handleUnpublish = async (id: string) => {
        if (!window.confirm('Hủy xuất bản? Học sinh sẽ không thể truy cập.')) return;
        try {
            await unpublishMutation.mutateAsync(id);
            showToast('Đã hủy xuất bản. Bài kiểm tra trở về trạng thái Nháp.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi hủy xuất bản', 'error');
        }
    };

    const handleClose = async (id: string) => {
        if (
            !window.confirm(
                'Đóng vĩnh viễn bài kiểm tra này? Học sinh sẽ không thể nộp thêm bài.'
            )
        )
            return;
        try {
            await closeMutation.mutateAsync(id);
            showToast('Đã đóng bài kiểm tra.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi đóng bài kiểm tra', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa bài kiểm tra này? Hành động không thể hoàn tác.')) return;
        try {
            await deleteMutation.mutateAsync(id);
            showToast('Đã xóa thành công. Câu hỏi vẫn được giữ lại.');
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi xóa', 'error');
        }
    };

    const handleCloneSubmit = async (newTitle: string, cloneQuestions: boolean) => {
        if (!cloneTarget) return;
        try {
            await cloneMutation.mutateAsync({
                id: cloneTarget.id,
                data: { newTitle, cloneQuestions },
            });
            showToast('Nhân bản thành công! Bản sao đã được tạo dưới dạng Nháp. 📋');
            setCloneTarget(null);
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi nhân bản', 'error');
        }
    };

    // Client-side search filter
    const filteredAssessments = search.trim()
        ? assessments.filter((a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.description?.toLowerCase().includes(search.toLowerCase())
        )
        : assessments;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
            notificationCount={0}
        >
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-fade-in
                        ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                >
                    {toast.type === 'error' && <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                <BookOpen className="text-indigo-600" size={28} />
                                Quản lý Kiểm tra
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Tạo và quản lý các bài kiểm tra, đánh giá học sinh
                            </p>
                        </div>
                        <button
                            id="btn-create-assessment"
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            <Plus size={18} />
                            Tạo bài kiểm tra mới
                        </button>
                    </div>

                    {/* ── Toolbar ─────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                id="search-assessments"
                                placeholder="Tìm theo tên, mô tả..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Status filter tabs */}
                        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
                            {(['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'] as const).map((s) => (
                                <button
                                    key={s}
                                    id={`filter-tab-${s.toLowerCase()}`}
                                    onClick={() => {
                                        setFilterStatus(s);
                                        setPage(0);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterStatus === s
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    {s === 'ALL'
                                        ? 'Tất cả'
                                        : STATUS_CONFIG[s as AssessmentStatus].label}
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => refetch()}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            title="Làm mới"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* ── Content ──────────────────────────────────────────── */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Loader2 size={40} className="animate-spin mb-3" />
                            <p className="text-sm">Đang tải dữ liệu...</p>
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
                    ) : filteredAssessments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <BookOpen size={48} className="mb-4 opacity-40" />
                            <p className="text-base font-medium">Không có bài kiểm tra nào</p>
                            <p className="text-sm mt-1">
                                {search
                                    ? 'Không tìm thấy kết quả phù hợp.'
                                    : 'Hãy tạo bài kiểm tra đầu tiên của bạn!'}
                            </p>
                            {!search && (
                                <button
                                    onClick={handleCreate}
                                    className="mt-5 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
                                >
                                    <Plus size={16} className="inline mr-1" /> Tạo ngay
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredAssessments.map((assessment) => (
                                    <AssessmentCard
                                        key={assessment.id}
                                        assessment={assessment}
                                        onView={() => handleView(assessment.id)}
                                        onEdit={() => handleEdit(assessment)}
                                        onPublish={() => handlePublish(assessment.id)}
                                        onUnpublish={() => handleUnpublish(assessment.id)}
                                        onClose={() => handleClose(assessment.id)}
                                        onDelete={() => handleDelete(assessment.id)}
                                        onClone={() => setCloneTarget(assessment)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm text-slate-600 font-medium">
                                        Trang {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Form Modal (Create / Edit) ──────────────────────────────── */}
            <AssessmentModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={selectedAssessment}
                mode={modalMode}
            />

            {/* ── Clone Modal ─────────────────────────────────────────────── */}
            {cloneTarget && (
                <CloneModal
                    assessment={cloneTarget}
                    onClose={() => setCloneTarget(null)}
                    onClone={handleCloneSubmit}
                    isLoading={cloneMutation.isPending}
                />
            )}
        </DashboardLayout>
    );
};

export default TeacherAssessments;
