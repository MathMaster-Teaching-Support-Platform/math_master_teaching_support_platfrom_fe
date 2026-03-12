import React, { useState } from 'react';
import { useGeneratePreview, useFinalizePreview } from '../../hooks/useExamMatrix';
import type {
    TemplateMappingResponse,
    CandidateQuestion,
    FinalizePreviewQuestionItem,
} from '../../types/examMatrix';
import { QuestionDifficulty } from '../../types/questionTemplate';
import {
    X, Loader2, AlertCircle, Sparkles, CheckSquare, Square,
    ChevronLeft, ChevronRight, CheckCircle2,
} from 'lucide-react';

interface GeneratePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    matrixId: string;
    mapping: TemplateMappingResponse;
    onSuccess: () => void;
}

const DIFFICULTY_OPTS = [
    { value: '', label: 'Tự động' },
    { value: QuestionDifficulty.EASY, label: 'Dễ' },
    { value: QuestionDifficulty.MEDIUM, label: 'Trung bình' },
    { value: QuestionDifficulty.HARD, label: 'Khó' },
    { value: QuestionDifficulty.VERY_HARD, label: 'Rất khó' },
];

const DIFF_COLORS: Record<string, string> = {
    EASY: 'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HARD: 'bg-orange-100 text-orange-700',
    VERY_HARD: 'bg-red-100 text-red-700',
};

type ModalStep = 'config' | 'preview' | 'finalize';

export const GeneratePreviewModal: React.FC<GeneratePreviewModalProps> = ({
    isOpen,
    onClose,
    matrixId,
    mapping,
    onSuccess,
}) => {
    const [step, setStep] = useState<ModalStep>('config');

    // Config step
    const [count, setCount] = useState(mapping.questionCount);
    const [difficulty, setDifficulty] = useState('');

    // Preview step
    const [candidates, setCandidates] = useState<CandidateQuestion[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);

    // Finalize step
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [savedCount, setSavedCount] = useState<number | null>(null);
    const [finalizeWarnings, setFinalizeWarnings] = useState<string[]>([]);

    const [generating, setGenerating] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);
    const [finalizeError, setFinalizeError] = useState<string | null>(null);

    const generateMutation = useGeneratePreview();
    const finalizeMutation = useFinalizePreview();

    if (!isOpen) return null;

    const handleClose = () => {
        setStep('config');
        setCandidates([]);
        setSelected(new Set());
        setGenError(null);
        setFinalizeError(null);
        setSavedCount(null);
        onClose();
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenError(null);
        setGenerating(true);
        try {
            const res = await generateMutation.mutateAsync({
                matrixId,
                mappingId: mapping.id,
                request: {
                    templateId: mapping.templateId,
                    count,
                    ...(difficulty ? { difficulty: difficulty as import('../../types/questionTemplate').QuestionDifficulty } : {}),
                },
            });
            const data = res.result;
            if (!data) throw new Error('Không nhận được dữ liệu từ server.');
            setCandidates(data.candidates ?? []);
            setPreviewWarnings(data.warnings ?? []);
            setSelected(new Set(data.candidates?.map((_, i) => i)));
            setStep('preview');
        } catch (err) {
            setGenError(err instanceof Error ? err.message : 'Lỗi sinh câu hỏi.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleSelect = (idx: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(candidates.map((_, i) => i)));
    const deselectAll = () => setSelected(new Set());

    const handleProceedFinalize = () => {
        if (selected.size === 0) {
            alert('Vui lòng chọn ít nhất 1 câu hỏi.');
            return;
        }
        setFinalizeError(null);
        setStep('finalize');
    };

    const handleFinalize = async () => {
        setFinalizing(true);
        setFinalizeError(null);
        try {
            const questions: FinalizePreviewQuestionItem[] = candidates
                .filter((_, i) => selected.has(i))
                .map(c => ({
                    questionText: c.questionText,
                    questionType: 'MULTIPLE_CHOICE' as FinalizePreviewQuestionItem['questionType'],
                    options: c.options,
                    correctAnswer: c.correctAnswerKey,
                    explanation: c.explanation,
                    difficulty: c.calculatedDifficulty,
                    cognitiveLevel: mapping.cognitiveLevel,
                    generationMetadata: c.usedParameters
                        ? { usedParameters: c.usedParameters, answerCalculation: c.answerCalculation }
                        : undefined,
                }));

            const res = await finalizeMutation.mutateAsync({
                matrixId,
                mappingId: mapping.id,
                request: {
                    templateId: mapping.templateId,
                    questions,
                    replaceExisting,
                    pointsPerQuestion: mapping.pointsPerQuestion,
                },
            });
            const data = res.result;
            setSavedCount(data?.savedCount ?? questions.length);
            setFinalizeWarnings(data?.warnings ?? []);
            onSuccess();
        } catch (err) {
            setFinalizeError(err instanceof Error ? err.message : 'Lỗi lưu câu hỏi.');
        } finally {
            setFinalizing(false);
        }
    };

    const stepTitle = {
        config: 'Cấu Hình Sinh Câu Hỏi',
        preview: `Xem Trước (${candidates.length} câu) — Chọn câu muốn lưu`,
        finalize: 'Xác Nhận Lưu Vào CSDL',
    }[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{stepTitle}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Template: {mapping.templateName ?? mapping.templateId}</p>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">

                    {/* ── Step: Config ──────────────────────────────────── */}
                    {step === 'config' && (
                        <form onSubmit={handleGenerate} className="p-6 space-y-5">
                            {genError && (
                                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                    <AlertCircle size={15} />{genError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Số câu cần sinh <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number" min={1} max={50} value={count}
                                    onChange={e => setCount(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Target của mapping này: {mapping.questionCount} câu
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Mức độ khó (tùy chọn)
                                </label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {DIFFICULTY_OPTS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {generating ? 'Đang sinh câu hỏi...' : 'Sinh Câu Hỏi'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: Preview ────────────────────────────────── */}
                    {step === 'preview' && (
                        <div className="p-6 space-y-4">
                            {previewWarnings.length > 0 && (
                                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 space-y-1">
                                    {previewWarnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
                                </div>
                            )}

                            {/* Select all controls */}
                            <div className="flex items-center gap-3 text-sm">
                                <button onClick={selectAll} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                                    <CheckSquare size={15} /> Chọn tất cả
                                </button>
                                <button onClick={deselectAll} className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
                                    <Square size={15} /> Bỏ chọn
                                </button>
                                <span className="ml-auto text-slate-500">
                                    Đã chọn <span className="font-semibold text-slate-700">{selected.size}</span> / {candidates.length} câu
                                </span>
                            </div>

                            <div className="space-y-3">
                                {candidates.map((c, i) => (
                                    <div
                                        key={i}
                                        onClick={() => toggleSelect(i)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                                            selected.has(i)
                                                ? 'border-indigo-300 bg-indigo-50/60'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                selected.has(i) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                            }`}>
                                                {selected.has(i) && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                                                    {c.calculatedDifficulty && (
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[c.calculatedDifficulty] ?? ''}`}>
                                                            {c.calculatedDifficulty}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-800 font-medium mb-2">{c.questionText}</p>
                                                {c.options && Object.entries(c.options).map(([key, val]) => (
                                                    <p key={key} className={`text-xs py-0.5 px-2 rounded ${
                                                        key === c.correctAnswerKey
                                                            ? 'font-semibold text-emerald-700 bg-emerald-50'
                                                            : 'text-slate-600'
                                                    }`}>
                                                        <span className="font-bold">{key}.</span> {val}
                                                    </p>
                                                ))}
                                                {c.explanation && (
                                                    <p className="text-xs text-slate-400 mt-2 italic">💡 {c.explanation}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step: Finalize ────────────────────────────────── */}
                    {step === 'finalize' && (
                        <div className="p-6 space-y-5">
                            {savedCount !== null ? (
                                /* Success state */
                                <div className="flex flex-col items-center py-8 text-center">
                                    <CheckCircle2 size={56} className="text-emerald-500 mb-3" />
                                    <h3 className="text-lg font-bold text-slate-800">Lưu thành công!</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Đã lưu <span className="font-bold text-emerald-600">{savedCount}</span> câu hỏi vào CSDL.
                                    </p>
                                    {finalizeWarnings.length > 0 && (
                                        <div className="mt-4 text-left px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1 w-full">
                                            {finalizeWarnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            ) : (
                                /* Confirm state */
                                <>
                                    <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-700 space-y-1">
                                        <p>📋 Sẽ lưu <span className="font-bold text-indigo-600">{selected.size}</span> câu hỏi</p>
                                        <p>💰 Điểm/câu: <span className="font-bold">{mapping.pointsPerQuestion}</span></p>
                                        <p>📁 Template: <span className="font-bold">{mapping.templateName}</span></p>
                                    </div>

                                    {finalizeError && (
                                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                            <AlertCircle size={15} />{finalizeError}
                                        </div>
                                    )}

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={replaceExisting}
                                            onChange={e => setReplaceExisting(e.target.checked)}
                                            className="w-4 h-4 accent-amber-500"
                                        />
                                        <span className="text-sm text-slate-700">
                                            Xóa câu hỏi cũ của mapping này trước khi lưu mới
                                        </span>
                                    </label>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer nav buttons (not shown after success) */}
                {savedCount === null && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
                        {step !== 'config' ? (
                            <button
                                type="button"
                                onClick={() => setStep(step === 'finalize' ? 'preview' : 'config')}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                <ChevronLeft size={15} /> Quay lại
                            </button>
                        ) : (
                            <div />
                        )}

                        {step === 'preview' && (
                            <button
                                onClick={handleProceedFinalize}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
                            >
                                Tiếp tục lưu <ChevronRight size={15} />
                            </button>
                        )}

                        {step === 'finalize' && (
                            <button
                                onClick={handleFinalize}
                                disabled={finalizing}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {finalizing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                {finalizing ? 'Đang lưu...' : 'Xác nhận lưu'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
