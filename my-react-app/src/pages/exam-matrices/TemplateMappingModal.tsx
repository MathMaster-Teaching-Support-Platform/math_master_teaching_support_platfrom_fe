import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { useAddTemplateMapping, useListMatchingTemplates } from '../../hooks/useExamMatrix';
import { CognitiveLevel } from '../../types/questionTemplate';
import type { AddTemplateMappingRequest, TemplateItem } from '../../types/examMatrix';

interface TemplateMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    matrixId: string;
    onSuccess: () => void;
}

const levelOptions = Object.values(CognitiveLevel);

export const TemplateMappingModal: React.FC<TemplateMappingModalProps> = ({
    isOpen,
    onClose,
    matrixId,
    onSuccess,
}) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

    const [cognitiveLevel, setCognitiveLevel] = useState<
        (typeof CognitiveLevel)[keyof typeof CognitiveLevel]
    >(CognitiveLevel.REMEMBER);
    const [questionCount, setQuestionCount] = useState(5);
    const [pointsPerQuestion, setPointsPerQuestion] = useState(1);

    const { data, isLoading } = useListMatchingTemplates(
        matrixId,
        { q: search || undefined, page, size: 6 },
        isOpen && step === 1
    );
    const addMapping = useAddTemplateMapping();

    if (!isOpen) return null;

    const templates = data?.result?.templates ?? [];
    const totalFound = data?.result?.totalTemplatesFound ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalFound / 6));

    const handleSelectTemplate = (template: TemplateItem) => {
        setSelectedTemplate(template);
        if (template.cognitiveLevel) {
            setCognitiveLevel(template.cognitiveLevel);
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        const request: AddTemplateMappingRequest = {
            templateId: selectedTemplate.templateId,
            cognitiveLevel,
            questionCount,
            pointsPerQuestion,
        };
        await addMapping.mutateAsync({ matrixId, request });
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-800">
                        {step === 1 ? 'Chọn template' : 'Cấu hình mapping'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                {step === 1 ? (
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Tìm template..."
                                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                            />
                        </div>

                        {isLoading ? (
                            <div className="py-14 flex justify-center">
                                <Loader2 className="animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {templates.map((template) => (
                                    <button
                                        key={template.templateId}
                                        onClick={() => handleSelectTemplate(template)}
                                        className="text-left p-3 border border-slate-200 rounded-xl hover:border-indigo-300"
                                    >
                                        <p className="font-semibold text-sm text-slate-800">{template.name}</p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((prev) => prev - 1)}
                                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs text-slate-500">Trang {page + 1} / {totalPages}</span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((prev) => prev + 1)}
                                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
                            {selectedTemplate?.name}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Cognitive level</label>
                            <select
                                value={cognitiveLevel}
                                onChange={(e) => setCognitiveLevel(e.target.value as typeof cognitiveLevel)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {levelOptions.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Số câu hỏi</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Điểm/câu</label>
                                <input
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    value={pointsPerQuestion}
                                    onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                            >
                                Quay lại
                            </button>
                            <button
                                type="submit"
                                disabled={addMapping.isPending}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {addMapping.isPending ? 'Đang thêm...' : 'Thêm mapping'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
