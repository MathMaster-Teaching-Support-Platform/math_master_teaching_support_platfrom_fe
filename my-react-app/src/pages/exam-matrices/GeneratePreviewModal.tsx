import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { useFinalizePreview, useGeneratePreview } from '../../hooks/useExamMatrix';
import { QuestionDifficulty } from '../../types/questionTemplate';
import type {
    CandidateQuestion,
    FinalizePreviewQuestionItem,
    TemplateMappingResponse,
} from '../../types/examMatrix';

interface GeneratePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    matrixId: string;
    mapping: TemplateMappingResponse;
    onSuccess: () => void;
}

export const GeneratePreviewModal: React.FC<GeneratePreviewModalProps> = ({
    isOpen,
    onClose,
    matrixId,
    mapping,
    onSuccess,
}) => {
    const [count, setCount] = useState(mapping.questionCount);
    const [difficulty, setDifficulty] = useState('');
    const [candidates, setCandidates] = useState<CandidateQuestion[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [step, setStep] = useState<'config' | 'preview' | 'result'>('config');
    const [savedCount, setSavedCount] = useState<number | null>(null);

    const generatePreview = useGeneratePreview();
    const finalizePreview = useFinalizePreview();

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await generatePreview.mutateAsync({
            matrixId,
            mappingId: mapping.id,
            request: {
                templateId: mapping.templateId,
                count,
                ...(difficulty
                    ? { difficulty: difficulty as typeof QuestionDifficulty[keyof typeof QuestionDifficulty] }
                    : {}),
            },
        });

        const generated = response.result?.candidates ?? [];
        setCandidates(generated);
        setSelected(new Set(generated.map((_, idx) => idx)));
        setStep('preview');
    };

    const handleFinalize = async () => {
        const questions: FinalizePreviewQuestionItem[] = candidates
            .filter((_, idx) => selected.has(idx))
            .map((item) => ({
                questionText: item.questionText,
                questionType: 'MULTIPLE_CHOICE',
                options: item.options,
                correctAnswer: item.correctAnswerKey,
                explanation: item.explanation,
                difficulty: item.calculatedDifficulty,
                cognitiveLevel: mapping.cognitiveLevel,
            }));

        const response = await finalizePreview.mutateAsync({
            matrixId,
            mappingId: mapping.id,
            request: {
                templateId: mapping.templateId,
                questions,
                pointsPerQuestion: mapping.pointsPerQuestion,
            },
        });

        setSavedCount(response.result?.savedCount ?? questions.length);
        setStep('result');
        onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-800">Sinh câu hỏi từ mapping</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                {step === 'config' && (
                    <form onSubmit={handleGenerate} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Số câu cần sinh</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Mức độ khó</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Tự động</option>
                                <option value={QuestionDifficulty.EASY}>EASY</option>
                                <option value={QuestionDifficulty.MEDIUM}>MEDIUM</option>
                                <option value={QuestionDifficulty.HARD}>HARD</option>
                                <option value={QuestionDifficulty.VERY_HARD}>VERY_HARD</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={generatePreview.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                        >
                            {generatePreview.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                            {generatePreview.isPending ? 'Đang sinh...' : 'Sinh câu hỏi'}
                        </button>
                    </form>
                )}

                {step === 'preview' && (
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="text-sm text-slate-600">Chọn các câu muốn lưu vào CSDL</div>
                        <div className="space-y-3 max-h-[48vh] overflow-y-auto">
                            {candidates.map((item, idx) => (
                                <label key={idx} className="block p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(idx)}
                                            onChange={(e) => {
                                                const next = new Set(selected);
                                                if (e.target.checked) next.add(idx);
                                                else next.delete(idx);
                                                setSelected(next);
                                            }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{item.questionText}</p>
                                            {item.explanation && <p className="text-xs text-slate-500 mt-1">{item.explanation}</p>}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setStep('config')}
                                className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleFinalize}
                                disabled={finalizePreview.isPending || selected.size === 0}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {finalizePreview.isPending ? 'Đang lưu...' : 'Lưu câu đã chọn'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'result' && (
                    <div className="p-10 text-center">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                        <p className="font-semibold text-slate-800">Đã lưu thành công</p>
                        <p className="text-sm text-slate-500 mt-1">Số câu đã lưu: {savedCount ?? 0}</p>
                        <button
                            onClick={onClose}
                            className="mt-5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
