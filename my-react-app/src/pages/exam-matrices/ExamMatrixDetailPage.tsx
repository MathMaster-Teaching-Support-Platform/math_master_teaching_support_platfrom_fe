import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { TemplateMappingModal } from './TemplateMappingModal';
import { GeneratePreviewModal } from './GeneratePreviewModal';
import {
    useGetExamMatrixById,
    useGetTemplateMappings,
    useDeleteExamMatrix,
    useApproveMatrix,
    useResetMatrix,
    useRemoveTemplateMapping,
} from '../../hooks/useExamMatrix';
import { examMatrixService } from '../../services/examMatrixService';
import { MatrixStatus } from '../../types/examMatrix';
import type { TemplateMappingResponse, MatrixValidationReport } from '../../types/examMatrix';
import {
    Grid3X3, ArrowLeft, CheckCircle2, RotateCcw, Lock, Trash2,
    Plus, ShieldCheck, Loader2, AlertCircle, CheckSquare,
    XCircle, Sparkles, RefreshCw, Repeat2,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT:    { label: 'Bản Nháp',  bg: 'bg-slate-100',   text: 'text-slate-600'  },
    APPROVED: { label: 'Đã Duyệt',  bg: 'bg-emerald-100', text: 'text-emerald-700'},
    LOCKED:   { label: 'Đã Khoá',   bg: 'bg-red-100',     text: 'text-red-700'   },
};

const COGNITIVE_NAMES: Record<string, string> = {
    REMEMBER: 'Nhận biết', UNDERSTAND: 'Thông hiểu', APPLY: 'Vận dụng',
    ANALYZE: 'Phân tích',  EVALUATE: 'Đánh giá',     CREATE: 'Sáng tạo',
};

function cn(level: string) { return COGNITIVE_NAMES[level] ?? level; }

function useToast() {
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const show = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };
    return { toast, show };
}

// ── Validation Report Panel ───────────────────────────────────────────────────

function ValidationPanel({ report }: { report: MatrixValidationReport }) {
    return (
        <div className={`rounded-2xl border p-5 space-y-4 ${report.canApprove ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2">
                {report.canApprove
                    ? <CheckSquare size={20} className="text-emerald-600" />
                    : <XCircle size={20} className="text-red-500" />}
                <h3 className="font-bold text-sm text-slate-800">
                    {report.canApprove ? 'Validation thành công — sẵn sàng phê duyệt' : 'Validation thất bại — cần sửa lỗi'}
                </h3>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Số mapping', value: report.totalTemplateMappings },
                    { label: 'Tổng câu hỏi', value: report.totalQuestions },
                    { label: 'Tổng điểm', value: Number(report.totalPoints).toFixed(1) },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Errors */}
            {report.errors.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Lỗi ({report.errors.length})</p>
                    {report.errors.map((e, i) => (
                        <p key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <XCircle size={14} className="shrink-0 mt-0.5" />{e}
                        </p>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {report.warnings.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Cảnh báo ({report.warnings.length})</p>
                    {report.warnings.map((w, i) => (
                        <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />{w}
                        </p>
                    ))}
                </div>
            )}

            {/* Cognitive level coverage */}
            {Object.keys(report.cognitiveLevelCoverage).length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Phân bổ cấp độ</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(report.cognitiveLevelCoverage).map(([level, count]) => (
                            <span key={level} className="px-2.5 py-1 bg-white rounded-full border border-slate-200 text-xs font-medium text-slate-700">
                                {cn(level)}: <span className="font-bold text-indigo-600">{count}</span> câu
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Mapping Table ─────────────────────────────────────────────────────────────

function MappingTable({
    mappings,
    canEdit,
    onRemove,
    onGenerate,
}: {
    mappings: TemplateMappingResponse[];
    canEdit: boolean;
    onRemove: (m: TemplateMappingResponse) => void;
    onGenerate: (m: TemplateMappingResponse) => void;
}) {
    if (mappings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <Grid3X3 size={36} className="mb-3 opacity-40" />
                <p className="text-sm font-medium text-slate-500">Chưa có template mapping nào</p>
                {canEdit && <p className="text-xs mt-1">Nhấn "Thêm Mapping" để bắt đầu.</p>}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="text-left pb-2 pr-4">Template</th>
                        <th className="text-left pb-2 pr-4">Cấp độ</th>
                        <th className="text-center pb-2 pr-4">Số câu</th>
                        <th className="text-center pb-2 pr-4">Điểm/câu</th>
                        <th className="text-center pb-2 pr-4">Tổng điểm</th>
                        <th className="text-right pb-2">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mappings.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 pr-4">
                                <p className="font-medium text-slate-800 line-clamp-1">{m.templateName ?? '—'}</p>
                                <p className="text-xs text-slate-400 font-mono line-clamp-1">{m.templateId}</p>
                            </td>
                            <td className="py-3 pr-4">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100">
                                    {cn(m.cognitiveLevel)}
                                </span>
                            </td>
                            <td className="py-3 pr-4 text-center font-semibold">{m.questionCount}</td>
                            <td className="py-3 pr-4 text-center">{m.pointsPerQuestion}</td>
                            <td className="py-3 pr-4 text-center font-semibold text-indigo-600">
                                {Number(m.totalPoints).toFixed(1)}
                            </td>
                            <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onGenerate(m)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                        title="Sinh câu hỏi"
                                    >
                                        <Sparkles size={12} /> Sinh KH
                                    </button>
                                    {canEdit && (
                                        <button
                                            onClick={() => onRemove(m)}
                                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                            title="Xóa mapping"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {/* Footer totals */}
                <tfoot>
                    <tr className="border-t-2 border-slate-200 font-bold text-slate-700 text-sm">
                        <td className="pt-3" colSpan={2}>Tổng cộng</td>
                        <td className="pt-3 text-center">{mappings.reduce((s, m) => s + m.questionCount, 0)}</td>
                        <td />
                        <td className="pt-3 text-center text-indigo-700">
                            {mappings.reduce((s, m) => s + Number(m.totalPoints), 0).toFixed(1)}
                        </td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ── Detail Page ────────────────────────────────────────────────────────────────

const ExamMatrixDetailPage: React.FC = () => {
    const { matrixId } = useParams<{ matrixId: string }>();
    const navigate = useNavigate();
    const { toast, show: showToast } = useToast();

    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [generateMapping, setGenerateMapping] = useState<TemplateMappingResponse | null>(null);

    const [validationReport, setValidationReport] = useState<MatrixValidationReport | null>(null);
    const [validating, setValidating] = useState(false);

    const { data: matrixData, isLoading, isError, refetch } = useGetExamMatrixById(matrixId ?? '', !!matrixId);
    const { data: mappingsData, refetch: refetchMappings } = useGetTemplateMappings(matrixId ?? '', !!matrixId);

    const matrix = matrixData?.result;
    const mappings: TemplateMappingResponse[] = (mappingsData?.result ?? matrix?.templateMappings ?? []) as TemplateMappingResponse[];

    const deleteMutation = useDeleteExamMatrix();
    const approveMutation = useApproveMatrix();
    const resetMutation = useResetMatrix();
    const removeMappingMutation = useRemoveTemplateMapping();

    const isDraft = matrix?.status === MatrixStatus.DRAFT;
    const isApproved = matrix?.status === MatrixStatus.APPROVED;
    const isLocked = matrix?.status === MatrixStatus.LOCKED;

    const handleValidate = async () => {
        if (!matrixId) return;
        setValidating(true);
        try {
            const res = await examMatrixService.validateMatrix(matrixId);
            setValidationReport(res.result ?? null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi validation', 'error');
        } finally {
            setValidating(false);
        }
    };

    const handleApprove = async () => {
        if (!matrixId || !window.confirm('Phê duyệt ma trận? Sẽ kiểm tra hợp lệ trước.')) return;
        try {
            await approveMutation.mutateAsync(matrixId);
            showToast('Phê duyệt thành công ✅');
            refetch();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi phê duyệt', 'error');
        }
    };

    const handleReset = async () => {
        if (!matrixId || !window.confirm('Reset ma trận về DRAFT để chỉnh sửa mappings?')) return;
        try {
            await resetMutation.mutateAsync(matrixId);
            showToast('Đã reset ma trận về Bản Nháp.');
            setValidationReport(null);
            refetch();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi reset', 'error');
        }
    };

    const handleDelete = async () => {
        if (!matrixId || !window.confirm('Xóa ma trận này? Hành động không thể hoàn tác.')) return;
        try {
            await deleteMutation.mutateAsync(matrixId);
            navigate('/teacher/exam-matrices');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi xóa', 'error');
        }
    };

    const handleRemoveMapping = async (m: TemplateMappingResponse) => {
        if (!matrixId || !window.confirm(`Xóa mapping "${m.templateName ?? m.templateId}"?`)) return;
        try {
            await removeMappingMutation.mutateAsync({ matrixId, mappingId: m.id });
            showToast('Đã xóa template mapping.');
            refetchMappings();
            setValidationReport(null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi xóa mapping', 'error');
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
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'error' && <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="min-h-screen bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                    {/* ── Back nav ─────────────────────────────────────── */}
                    <button
                        onClick={() => navigate('/teacher/exam-matrices')}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
                    >
                        <ArrowLeft size={16} /> Quay lại danh sách
                    </button>

                    {isLoading ? (
                        <div className="flex justify-center py-24 text-slate-400">
                            <Loader2 size={40} className="animate-spin" />
                        </div>
                    ) : isError || !matrix ? (
                        <div className="flex flex-col items-center py-24 text-red-400">
                            <AlertCircle size={40} className="mb-3" />
                            <p className="text-sm">Không thể tải ma trận đề.</p>
                            <button onClick={() => refetch()} className="mt-4 px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ── Header Card ──────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[matrix.status]?.bg} ${STATUS_CONFIG[matrix.status]?.text}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                                {STATUS_CONFIG[matrix.status]?.label}
                                            </span>
                                            {matrix.isReusable && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    <Repeat2 size={11} /> Tái sử dụng
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{matrix.name}</h1>
                                        {matrix.description && (
                                            <p className="text-sm text-slate-500 mt-1">{matrix.description}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2">
                                            Giáo viên: <span className="font-medium text-slate-600">{matrix.teacherName}</span>
                                            {' · '}Tạo lúc: {new Date(matrix.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        <button
                                            onClick={handleValidate}
                                            disabled={validating}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            {validating ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                                            Xác thực
                                        </button>
                                        <button
                                            onClick={() => refetch()}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                                        >
                                            <RefreshCw size={15} />
                                        </button>
                                        {isDraft && (
                                            <button
                                                onClick={handleApprove}
                                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                <CheckCircle2 size={15} /> Phê duyệt
                                            </button>
                                        )}
                                        {isApproved && (
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50"
                                            >
                                                <RotateCcw size={15} /> Reset
                                            </button>
                                        )}
                                        {isLocked && (
                                            <span className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 italic">
                                                <Lock size={14} /> Đã khoá
                                            </span>
                                        )}
                                        {!isLocked && (
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Validation Report ─────────────────────── */}
                            {validationReport && (
                                <ValidationPanel report={validationReport} />
                            )}

                            {/* ── Template Mappings ─────────────────────── */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Template Mappings</h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {mappings.length} mapping · Mỗi mapping định nghĩa 1 nhóm câu hỏi
                                        </p>
                                    </div>
                                    {isDraft && (
                                        <button
                                            onClick={() => setIsMappingModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
                                        >
                                            <Plus size={16} /> Thêm Mapping
                                        </button>
                                    )}
                                </div>

                                <MappingTable
                                    mappings={mappings}
                                    canEdit={isDraft}
                                    onRemove={handleRemoveMapping}
                                    onGenerate={m => setGenerateMapping(m)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {matrixId && (
                <TemplateMappingModal
                    isOpen={isMappingModalOpen}
                    onClose={() => setIsMappingModalOpen(false)}
                    matrixId={matrixId}
                    onSuccess={() => {
                        setIsMappingModalOpen(false);
                        refetchMappings();
                        setValidationReport(null);
                        showToast('Đã thêm template mapping! ✅');
                    }}
                />
            )}

            {matrixId && generateMapping && (
                <GeneratePreviewModal
                    isOpen={!!generateMapping}
                    onClose={() => setGenerateMapping(null)}
                    matrixId={matrixId}
                    mapping={generateMapping}
                    onSuccess={() => {
                        showToast('Đã lưu câu hỏi vào CSDL! 🎉');
                    }}
                />
            )}
        </DashboardLayout>
    );
};

export default ExamMatrixDetailPage;
