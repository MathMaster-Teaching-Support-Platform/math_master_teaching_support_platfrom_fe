import React, { useState } from 'react';
import { useListMatchingTemplates, useAddTemplateMapping } from '../../hooks/useExamMatrix';
import type { AddTemplateMappingRequest, TemplateItem } from '../../types/examMatrix';
import { CognitiveLevel } from '../../types/questionTemplate';
import { X, Search, Star, CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface TemplateMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    matrixId: string;
    onSuccess: () => void;
}

const COGNITIVE_LEVEL_OPTIONS = [
    { value: CognitiveLevel.REMEMBER, label: 'Nhận biết' },
    { value: CognitiveLevel.UNDERSTAND, label: 'Thông hiểu' },
    { value: CognitiveLevel.APPLY, label: 'Vận dụng' },
    { value: CognitiveLevel.ANALYZE, label: 'Phân tích' },
    { value: CognitiveLevel.EVALUATE, label: 'Đánh giá' },
    { value: CognitiveLevel.CREATE, label: 'Sáng tạo' },
];

const getCognitiveLevelName = (level: string) => {
    return COGNITIVE_LEVEL_OPTIONS.find(o => o.value === level)?.label ?? level;
};

export const TemplateMappingModal: React.FC<TemplateMappingModalProps> = ({
    isOpen,
    onClose,
    matrixId,
    onSuccess,
}) => {
    // Step 1: select template | Step 2: fill details
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1 state
    const [search, setSearch] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 6;
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

    // Step 2 state
    const [cognitiveLevel, setCognitiveLevel] = useState<string>(CognitiveLevel.REMEMBER);
    const [questionCount, setQuestionCount] = useState(5);
    const [pointsPerQuestion, setPointsPerQuestion] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const addMappingMutation = useAddTemplateMapping();

    // Query matching templates (only when step 1)
    const { data, isLoading, isError } = useListMatchingTemplates(
        matrixId,
        { q: search || undefined, page, size: PAGE_SIZE, onlyMine },
        !!matrixId && isOpen && step === 1
    );

    const templates = data?.result?.templates ?? [];
    const totalFound = data?.result?.totalTemplatesFound ?? 0;
    const totalPages = Math.ceil(totalFound / PAGE_SIZE) || 1;

    if (!isOpen) return null;

    const handleSelectTemplate = (t: TemplateItem) => {
        setSelectedTemplate(t);
        // Pre-fill cognitive level from template if available
        if (t.cognitiveLevel) setCognitiveLevel(t.cognitiveLevel);
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
        setSubmitError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const request: AddTemplateMappingRequest = {
                templateId: selectedTemplate.templateId,
                cognitiveLevel: cognitiveLevel as AddTemplateMappingRequest['cognitiveLevel'],
                questionCount,
                pointsPerQuestion,
            };
            await addMappingMutation.mutateAsync({ matrixId, request });
            onSuccess();
            handleClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSearch('');
        setPage(0);
        setSelectedTemplate(null);
        setSubmitError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {step === 1 ? 'Chọn Template Câu Hỏi' : 'Cấu Hình Template Mapping'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {step === 1 ? 'Bước 1/2 — Tìm và chọn template phù hợp' : 'Bước 2/2 — Điền thông số cho mapping'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {step === 1 ? (
                        <div className="p-6 space-y-4">
                            {/* Search toolbar */}
                            <div className="flex gap-3 items-center">
                                <div className="relative flex-1">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        placeholder="Tìm template theo tên..."
                                        value={search}
                                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={onlyMine}
                                        onChange={e => { setOnlyMine(e.target.checked); setPage(0); }}
                                        className="accent-indigo-600"
                                    />
                                    Của tôi
                                </label>
                            </div>

                            {/* Template list */}
                            {isLoading ? (
                                <div className="flex justify-center items-center py-16">
                                    <Loader2 size={32} className="animate-spin text-slate-400" />
                                </div>
                            ) : isError ? (
                                <div className="flex flex-col items-center py-12 text-red-400">
                                    <AlertCircle size={32} className="mb-2" />
                                    <p className="text-sm">Không thể tải danh sách template.</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-slate-400">
                                    <p className="text-sm">Không tìm thấy template phù hợp.</p>
                                    <p className="text-xs mt-1">Thử bỏ bộ lọc hoặc tạo template mới.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {templates.map(t => (
                                        <button
                                            key={t.templateId}
                                            onClick={() => handleSelectTemplate(t)}
                                            className="text-left p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 line-clamp-1">{t.name}</p>
                                                <span className="flex items-center gap-0.5 text-xs text-amber-500 shrink-0">
                                                    <Star size={11} className="fill-amber-400" />
                                                    {t.relevanceScore}
                                                </span>
                                            </div>
                                            {t.description && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                                            )}
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {t.cognitiveLevel && (
                                                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded border border-purple-100">
                                                        {getCognitiveLevelName(t.cognitiveLevel)}
                                                    </span>
                                                )}
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">
                                                    Đã dùng {t.usageCount ?? 0}x
                                                </span>
                                                {t.mine && (
                                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-xs rounded">Của tôi</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 pt-2">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <span className="text-xs text-slate-500">
                                        Trang {page + 1} / {totalPages} ({totalFound} template)
                                    </span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Step 2: fill details */
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Selected template summary */}
                            {selectedTemplate && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-200">
                                    <CheckCircle2 size={20} className="text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-800">{selectedTemplate.name}</p>
                                        {selectedTemplate.description && (
                                            <p className="text-xs text-indigo-600">{selectedTemplate.description}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {submitError && (
                                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Cấp độ nhận thức <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={cognitiveLevel}
                                    onChange={e => setCognitiveLevel(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {COGNITIVE_LEVEL_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Số câu hỏi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={questionCount}
                                        onChange={e => setQuestionCount(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Điểm / câu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0.1}
                                        step={0.1}
                                        value={pointsPerQuestion}
                                        onChange={e => setPointsPerQuestion(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                            </div>

                            <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                                Tổng điểm mapping:{' '}
                                <span className="font-bold text-slate-800">
                                    {(questionCount * pointsPerQuestion).toFixed(1)} điểm
                                </span>
                                {' '}({questionCount} câu × {pointsPerQuestion} điểm/câu)
                            </div>

                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronLeft size={15} /> Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Đang thêm...' : 'Thêm Mapping'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
