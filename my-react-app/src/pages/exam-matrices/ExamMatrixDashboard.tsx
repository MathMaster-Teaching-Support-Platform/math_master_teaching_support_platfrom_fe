import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { ExamMatrixFormModal } from './ExamMatrixFormModal';
import {
    useGetMyExamMatrices,
    useCreateExamMatrix,
    useUpdateExamMatrix,
    useDeleteExamMatrix,
    useApproveMatrix,
    useResetMatrix,
} from '../../hooks/useExamMatrix';
import { MatrixStatus } from '../../types/examMatrix';
import type { ExamMatrixResponse, ExamMatrixRequest } from '../../types/examMatrix';
import {
    Grid3X3,
    Plus,
    Search,
    RefreshCw,
    Loader2,
    AlertCircle,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    RotateCcw,
    Lock,
    ChevronRight,
    Repeat2,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    [MatrixStatus.DRAFT]: {
        label: 'Bản Nháp',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
    },
    [MatrixStatus.APPROVED]: {
        label: 'Đã Duyệt',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
    },
    [MatrixStatus.LOCKED]: {
        label: 'Đã Khoá',
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
    },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[MatrixStatus.DRAFT];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Matrix Card ────────────────────────────────────────────────────────────────

function MatrixCard({
    matrix,
    onEdit,
    onDelete,
    onApprove,
    onReset,
    onView,
}: {
    matrix: ExamMatrixResponse;
    onEdit: () => void;
    onDelete: () => void;
    onApprove: () => void;
    onReset: () => void;
    onView: () => void;
}) {
    const isDraft = matrix.status === MatrixStatus.DRAFT;
    const isApproved = matrix.status === MatrixStatus.APPROVED;
    const isLocked = matrix.status === MatrixStatus.LOCKED;

    const accentColor = isApproved
        ? 'bg-emerald-400'
        : isLocked
        ? 'bg-red-400'
        : 'bg-slate-300';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
            {/* Status accent strip */}
            <div className={`h-1.5 ${accentColor}`} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={matrix.status} />
                    {matrix.isReusable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Repeat2 size={11} />
                            Tái sử dụng
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug">
                    {matrix.name}
                </h3>

                {/* Description */}
                {matrix.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{matrix.description}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                    <span>
                        <span className="font-semibold text-slate-700">{matrix.templateMappingCount}</span> template mapping
                    </span>
                    <span>GV: {matrix.teacherName}</span>
                    <span>{new Date(matrix.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {/* View detail — always */}
                    <button
                        onClick={onView}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.98] transition-all"
                    >
                        <Eye size={13} /> Chi tiết
                    </button>

                    {/* Edit — DRAFT only */}
                    {isDraft && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                        >
                            <Edit size={13} /> Sửa
                        </button>
                    )}

                    {/* Approve — DRAFT only */}
                    {isDraft && (
                        <button
                            onClick={onApprove}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow active:scale-[0.98] transition-all"
                        >
                            <CheckCircle2 size={13} /> Phê duyệt
                        </button>
                    )}

                    {/* Reset — APPROVED only */}
                    {isApproved && (
                        <button
                            onClick={onReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98] transition-all"
                        >
                            <RotateCcw size={13} /> Reset
                        </button>
                    )}

                    {/* Locked label */}
                    {isLocked && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 italic my-auto">
                            <Lock size={12} /> Đã khoá
                        </span>
                    )}

                    {/* Delete — not LOCKED */}
                    {!isLocked && (
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                            title="Xóa ma trận"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function useToast() {
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const show = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };
    return { toast, show };
}

// ── Main Dashboard Page ────────────────────────────────────────────────────────

export const ExamMatrixDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { toast, show: showToast } = useToast();

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMatrix, setSelectedMatrix] = useState<ExamMatrixResponse | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    // ── Data ─────────────────────────────────────────────────────────────────
    const { data, isLoading, isError, error, refetch } = useGetMyExamMatrices();
    const matrices: ExamMatrixResponse[] = (data?.result ?? []) as ExamMatrixResponse[];

    const filtered = matrices.filter(m => {
        if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
        }
        return true;
    });

    // ── Mutations ────────────────────────────────────────────────────────────
    const createMutation = useCreateExamMatrix();
    const updateMutation = useUpdateExamMatrix();
    const deleteMutation = useDeleteExamMatrix();
    const approveMutation = useApproveMatrix();
    const resetMutation = useResetMatrix();

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleCreate = () => {
        setFormMode('create');
        setSelectedMatrix(null);
        setIsFormOpen(true);
    };

    const handleEdit = (m: ExamMatrixResponse) => {
        setFormMode('edit');
        setSelectedMatrix(m);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (data: ExamMatrixRequest) => {
        if (formMode === 'create') {
            await createMutation.mutateAsync(data);
            showToast('Tạo ma trận đề thành công! 🎉');
        } else if (selectedMatrix) {
            await updateMutation.mutateAsync({ matrixId: selectedMatrix.id, request: data });
            showToast('Cập nhật ma trận đề thành công!');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa ma trận đề này? Hành động không thể hoàn tác.')) return;
        try {
            await deleteMutation.mutateAsync(id);
            showToast('Đã xóa ma trận đề.');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi xóa', 'error');
        }
    };

    const handleApprove = async (id: string) => {
        if (!window.confirm('Phê duyệt ma trận này? Ma trận sẽ chuyển sang trạng thái APPROVED.')) return;
        try {
            await approveMutation.mutateAsync(id);
            showToast('Phê duyệt thành công! ✅');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi phê duyệt', 'error');
        }
    };

    const handleReset = async (id: string) => {
        if (!window.confirm('Reset ma trận về DRAFT? Bạn có thể chỉnh sửa lại template mappings.')) return;
        try {
            await resetMutation.mutateAsync(id);
            showToast('Đã reset ma trận về bản nháp.');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi reset', 'error');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout
            role="teacher"
            user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
            notificationCount={0}
        >
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
                        toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
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
                            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 rounded-xl">
                                    <Grid3X3 className="text-indigo-600" size={24} />
                                </div>
                                Quản Lý Ma Trận Đề
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Thiết kế cấu trúc đề kiểm tra theo chuẩn nhận thức Bloom
                            </p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] transition-all"
                        >
                            <Plus size={18} />
                            Tạo Ma Trận Mới
                        </button>
                    </div>

                    {/* ── Toolbar ──────────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    placeholder="Tìm theo tên, mô tả..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>

                            <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 overflow-x-auto">
                                {(['ALL', MatrixStatus.DRAFT, MatrixStatus.APPROVED, MatrixStatus.LOCKED] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                                            filterStatus === s
                                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transparent'
                                        }`}
                                    >
                                        {s === 'ALL' ? 'Tất cả' : (STATUS_CONFIG[s]?.label ?? s)}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => refetch()}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all ml-auto active:scale-[0.98]"
                                title="Làm mới"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ── Content ───────────────────────────────────────────── */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Loader2 size={40} className="animate-spin mb-3" />
                            <p className="text-sm">Đang tải ma trận đề...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-24 text-red-500">
                            <AlertCircle size={40} className="mb-3" />
                            <p className="text-sm font-medium">
                                {error instanceof Error ? error.message : 'Không thể tải dữ liệu. Vui lòng thử lại.'}
                            </p>
                            <button
                                onClick={() => refetch()}
                                className="mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-6 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed max-w-2xl mx-auto shadow-sm">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                <Grid3X3 size={40} />
                            </div>
                            <p className="text-lg font-bold text-slate-700 mb-2">Chưa có ma trận đề nào</p>
                            <p className="text-sm font-medium text-slate-500 text-center mb-8 max-w-md">
                                {search || filterStatus !== 'ALL'
                                    ? 'Không tìm thấy kết quả phù hợp.'
                                    : 'Tạo ma trận đề đầu tiên để bắt đầu thiết kế cấu trúc thi cử!'}
                            </p>
                            {!search && filterStatus === 'ALL' && (
                                <button
                                    onClick={handleCreate}
                                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Tạo Ma Trận Đề
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map(m => (
                                <MatrixCard
                                    key={m.id}
                                    matrix={m}
                                    onEdit={() => handleEdit(m)}
                                    onDelete={() => handleDelete(m.id)}
                                    onApprove={() => handleApprove(m.id)}
                                    onReset={() => handleReset(m.id)}
                                    onView={() => navigate(`/teacher/exam-matrices/${m.id}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Stats footer */}
                    {filtered.length > 0 && (
                        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                            <span>Hiển thị {filtered.length} / {matrices.length} ma trận</span>
                            <button
                                onClick={() => navigate('/teacher/question-templates')}
                                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all"
                            >
                                Quản lý mẫu câu hỏi <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
                {/* Spacer at the bottom to breathe */}
                <div className="h-16"></div>
            </div>

            {/* Modals */}
            <ExamMatrixFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                mode={formMode}
                initialData={selectedMatrix}
            />
        </DashboardLayout>
    );
};
