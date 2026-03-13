import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle2,
    Edit,
    Eye,
    Grid3X3,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
    useApproveMatrix,
    useCreateExamMatrix,
    useDeleteExamMatrix,
    useGetMyExamMatrices,
    useResetMatrix,
    useUpdateExamMatrix,
} from '../../hooks/useExamMatrix';
import { MatrixStatus } from '../../types/examMatrix';
import type { ExamMatrixRequest, ExamMatrixResponse } from '../../types/examMatrix';
import { ExamMatrixFormModal } from './ExamMatrixFormModal';

export const ExamMatrixDashboard: React.FC = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | MatrixStatus>('ALL');
    const [openForm, setOpenForm] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selected, setSelected] = useState<ExamMatrixResponse | null>(null);

    const { data, isLoading, isError, error, refetch } = useGetMyExamMatrices();
    const createMatrix = useCreateExamMatrix();
    const updateMatrix = useUpdateExamMatrix();
    const deleteMatrix = useDeleteExamMatrix();
    const approveMatrix = useApproveMatrix();
    const resetMatrix = useResetMatrix();

    const matrices = data?.result ?? [];
    const filtered = matrices.filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
    });

    const handleSubmit = async (payload: ExamMatrixRequest) => {
        if (mode === 'create') {
            await createMatrix.mutateAsync(payload);
        } else if (selected) {
            await updateMatrix.mutateAsync({ matrixId: selected.id, request: payload });
        }
    };

    return (
        <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
                                <Grid3X3 className="text-indigo-600" size={24} />
                                Quản lý ma trận đề
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Quản lý lifecycle ma trận đề theo backend flow</p>
                        </div>
                        <button
                            onClick={() => {
                                setMode('create');
                                setSelected(null);
                                setOpenForm(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
                        >
                            <Plus size={16} /> Tạo ma trận
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                placeholder="Tìm theo tên hoặc mô tả"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['ALL', MatrixStatus.DRAFT, MatrixStatus.APPROVED, MatrixStatus.LOCKED] as const).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setStatusFilter(item)}
                                    className={`px-3 py-2 text-sm rounded-lg border ${statusFilter === item ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => refetch()} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 inline-flex items-center gap-1.5">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={34} /></div>
                    ) : isError ? (
                        <div className="py-16 text-center text-red-500">
                            <AlertCircle size={32} className="mx-auto mb-2" />
                            {error instanceof Error ? error.message : 'Không thể tải ma trận đề'}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">Không có ma trận đề phù hợp.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{item.status}</span>
                                        <span className="text-xs text-slate-400">{item.templateMappingCount} mappings</span>
                                    </div>
                                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => navigate(`/teacher/exam-matrices/${item.id}`)}
                                            className="px-2.5 py-1.5 text-xs border border-indigo-200 text-indigo-700 rounded inline-flex items-center gap-1"
                                        >
                                            <Eye size={12} /> Chi tiết
                                        </button>
                                        {item.status === MatrixStatus.DRAFT && (
                                            <button
                                                onClick={() => {
                                                    setMode('edit');
                                                    setSelected(item);
                                                    setOpenForm(true);
                                                }}
                                                className="px-2.5 py-1.5 text-xs border border-slate-300 text-slate-700 rounded inline-flex items-center gap-1"
                                            >
                                                <Edit size={12} /> Sửa
                                            </button>
                                        )}
                                        {item.status === MatrixStatus.DRAFT && (
                                            <button
                                                onClick={() => approveMatrix.mutate(item.id)}
                                                className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded inline-flex items-center gap-1"
                                            >
                                                <CheckCircle2 size={12} /> Approve
                                            </button>
                                        )}
                                        {item.status === MatrixStatus.APPROVED && (
                                            <button
                                                onClick={() => resetMatrix.mutate(item.id)}
                                                className="px-2.5 py-1.5 text-xs border border-amber-300 text-amber-700 rounded inline-flex items-center gap-1"
                                            >
                                                <RotateCcw size={12} /> Reset
                                            </button>
                                        )}
                                        {item.status !== MatrixStatus.LOCKED && (
                                            <button
                                                onClick={() => deleteMatrix.mutate(item.id)}
                                                className="px-2.5 py-1.5 text-xs border border-red-200 text-red-600 rounded inline-flex items-center gap-1 ml-auto"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ExamMatrixFormModal
                isOpen={openForm}
                onClose={() => setOpenForm(false)}
                onSubmit={handleSubmit}
                mode={mode}
                initialData={selected}
            />
        </DashboardLayout>
    );
};
