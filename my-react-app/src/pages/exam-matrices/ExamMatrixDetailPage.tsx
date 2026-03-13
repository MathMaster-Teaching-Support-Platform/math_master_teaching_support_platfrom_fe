import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import {
    useApproveMatrix,
    useDeleteExamMatrix,
    useGetExamMatrixById,
    useGetTemplateMappings,
    useRemoveTemplateMapping,
    useResetMatrix,
} from '../../hooks/useExamMatrix';
import { examMatrixService } from '../../services/examMatrixService';
import { MatrixStatus } from '../../types/examMatrix';
import type { MatrixValidationReport, TemplateMappingResponse } from '../../types/examMatrix';
import { TemplateMappingModal } from './TemplateMappingModal';
import { GeneratePreviewModal } from './GeneratePreviewModal';

const ExamMatrixDetailPage: React.FC = () => {
    const { matrixId } = useParams<{ matrixId: string }>();
    const navigate = useNavigate();

    const [validationReport, setValidationReport] = useState<MatrixValidationReport | null>(null);
    const [loadingValidation, setLoadingValidation] = useState(false);
    const [openMappingModal, setOpenMappingModal] = useState(false);
    const [previewMapping, setPreviewMapping] = useState<TemplateMappingResponse | null>(null);

    const { data, isLoading, isError, refetch } = useGetExamMatrixById(matrixId ?? '', !!matrixId);
    const { data: mappingData, refetch: refetchMappings } = useGetTemplateMappings(matrixId ?? '', !!matrixId);

    const matrix = data?.result;
    const mappings = mappingData?.result ?? matrix?.templateMappings ?? [];

    const deleteMatrix = useDeleteExamMatrix();
    const approveMatrix = useApproveMatrix();
    const resetMatrix = useResetMatrix();
    const removeMapping = useRemoveTemplateMapping();

    const canEdit = matrix?.status === MatrixStatus.DRAFT;

    const handleValidate = async () => {
        if (!matrixId) return;
        setLoadingValidation(true);
        try {
            const response = await examMatrixService.validateMatrix(matrixId);
            setValidationReport(response.result ?? null);
        } finally {
            setLoadingValidation(false);
        }
    };

    const handleApprove = async () => {
        if (!matrixId) return;
        await approveMatrix.mutateAsync(matrixId);
        await refetch();
    };

    const handleReset = async () => {
        if (!matrixId) return;
        await resetMatrix.mutateAsync(matrixId);
        await refetch();
    };

    const handleDelete = async () => {
        if (!matrixId) return;
        await deleteMatrix.mutateAsync(matrixId);
        navigate('/teacher/exam-matrices');
    };

    return (
        <DashboardLayout role="teacher" user={{ name: 'Teacher', avatar: '', role: 'teacher' }} notificationCount={0}>
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    <button onClick={() => navigate('/teacher/exam-matrices')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                        <ArrowLeft size={16} /> Quay lại
                    </button>

                    {isLoading ? (
                        <div className="py-20 flex justify-center text-slate-400"><Loader2 size={36} className="animate-spin" /></div>
                    ) : isError || !matrix ? (
                        <div className="py-20 text-center text-red-500">
                            <AlertCircle size={32} className="mx-auto mb-3" />
                            Không thể tải chi tiết ma trận đề.
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">{matrix.name}</h1>
                                        <p className="text-sm text-slate-500 mt-1">{matrix.description}</p>
                                        <p className="text-xs text-slate-400 mt-2">Status: {matrix.status}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={handleValidate} className="px-3 py-2 text-sm border border-slate-300 rounded-lg inline-flex items-center gap-1.5">
                                            {loadingValidation ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                            Validate
                                        </button>
                                        <button onClick={() => refetch()} className="p-2 border border-slate-300 rounded-lg"><RefreshCw size={14} /></button>
                                        {matrix.status === MatrixStatus.DRAFT && (
                                            <button onClick={handleApprove} className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white inline-flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                        )}
                                        {matrix.status === MatrixStatus.APPROVED && (
                                            <button onClick={handleReset} className="px-3 py-2 text-sm rounded-lg border border-amber-300 text-amber-700 inline-flex items-center gap-1.5">
                                                <RotateCcw size={14} /> Reset
                                            </button>
                                        )}
                                        {matrix.status !== MatrixStatus.LOCKED && (
                                            <button onClick={handleDelete} className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 inline-flex items-center gap-1.5">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {validationReport && (
                                <div className={`rounded-2xl border p-5 ${validationReport.canApprove ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="font-semibold text-slate-800 mb-2">Validation report</p>
                                    <p className="text-sm text-slate-600">Errors: {validationReport.errors.length} - Warnings: {validationReport.warnings.length}</p>
                                    {!!validationReport.errors.length && (
                                        <ul className="mt-3 text-sm text-red-700 list-disc list-inside">
                                            {validationReport.errors.map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-800">Template mappings</h2>
                                    {canEdit && (
                                        <button onClick={() => setOpenMappingModal(true)} className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white inline-flex items-center gap-1.5">
                                            <Plus size={14} /> Thêm mapping
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b border-slate-200 text-slate-500">
                                                <th className="py-2">Template</th>
                                                <th className="py-2">Level</th>
                                                <th className="py-2">Số câu</th>
                                                <th className="py-2">Điểm/câu</th>
                                                <th className="py-2">Tổng điểm</th>
                                                <th className="py-2 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mappings.map((mapping) => (
                                                <tr key={mapping.id} className="border-b border-slate-100">
                                                    <td className="py-2">{mapping.templateName ?? mapping.templateId}</td>
                                                    <td className="py-2">{mapping.cognitiveLevel}</td>
                                                    <td className="py-2">{mapping.questionCount}</td>
                                                    <td className="py-2">{mapping.pointsPerQuestion}</td>
                                                    <td className="py-2">{mapping.totalPoints}</td>
                                                    <td className="py-2 text-right">
                                                        <div className="inline-flex gap-2">
                                                            <button
                                                                onClick={() => setPreviewMapping(mapping)}
                                                                className="px-2 py-1 text-xs border border-indigo-200 text-indigo-700 rounded"
                                                            >
                                                                Preview
                                                            </button>
                                                            {canEdit && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!matrixId) return;
                                                                        await removeMapping.mutateAsync({ matrixId, mappingId: mapping.id });
                                                                        await refetchMappings();
                                                                    }}
                                                                    className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {matrixId && (
                <TemplateMappingModal
                    isOpen={openMappingModal}
                    onClose={() => setOpenMappingModal(false)}
                    matrixId={matrixId}
                    onSuccess={async () => {
                        setOpenMappingModal(false);
                        await refetchMappings();
                    }}
                />
            )}

            {matrixId && previewMapping && (
                <GeneratePreviewModal
                    isOpen={!!previewMapping}
                    onClose={() => setPreviewMapping(null)}
                    matrixId={matrixId}
                    mapping={previewMapping}
                    onSuccess={() => void refetchMappings()}
                />
            )}
        </DashboardLayout>
    );
};

export default ExamMatrixDetailPage;
