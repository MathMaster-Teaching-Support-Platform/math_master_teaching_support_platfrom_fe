import React, { useState } from 'react';
import { useTestTemplate } from '../../hooks/useQuestionTemplate';
import type { QuestionTemplateResponse } from '../../types/questionTemplate';
import { X, Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface TemplateTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: QuestionTemplateResponse;
}

export const TemplateTestModal: React.FC<TemplateTestModalProps> = ({
    isOpen,
    onClose,
    template,
}) => {
    const [sampleCount, setSampleCount] = useState<number>(5);
    const [useAI, setUseAI] = useState<boolean>(true);
    const [hasTested, setHasTested] = useState(false);

    // useTestTemplate expects ID. We will only enable the query on button click.
    const { data, isLoading, isError, error, refetch } = useTestTemplate(
        template.id,
        sampleCount,
        useAI,
        hasTested // Only enable if user pressed Test
    );

    if (!isOpen) return null;

    const handleTest = () => {
        if (!hasTested) {
            setHasTested(true);
        } else {
            refetch();
        }
    };

    const results = data?.result;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Sinh thử câu hỏi</h2>
                        <p className="text-sm text-slate-500 mt-1">Từ mẫu gốc: <span className="font-semibold text-slate-700">{template.name}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0 flex flex-wrap gap-5 items-end">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số lượng sinh nghiệm</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            className="w-32 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            value={sampleCount}
                            onChange={(e) => setSampleCount(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-2 pb-2">
                        <input
                            type="checkbox"
                            checked={useAI}
                            onChange={(e) => setUseAI(e.target.checked)}
                            className="accent-indigo-600 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold">Sử dụng AI (Gemini) để sinh Distractors và Giải thích</span>
                    </label>

                    <button
                        onClick={handleTest}
                        disabled={isLoading}
                        className="px-6 py-2.5 ml-auto rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} className="fill-current" />}
                        {isLoading ? 'Đang sinh...' : 'Chạy thử nghiệm'}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
                    {!hasTested && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                            <Play size={48} className="mb-4 opacity-20" />
                            <p className="text-base font-medium text-slate-600">Sẵn sàng sinh thử nghiệm</p>
                            <p className="text-sm mt-1">Hệ thống sẽ thay thế các tham số động vào nội dung cấu trúc</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-indigo-500 py-10">
                            <Loader2 size={40} className="animate-spin mb-4" />
                            <p className="font-medium">Đang gọi AI sinh câu hỏi, vui lòng chờ...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="flex flex-col items-center justify-center py-10 text-red-500">
                            <AlertCircle size={40} className="mb-3" />
                            <p className="text-sm font-medium">Lỗi khi sinh thử nghiệm</p>
                            <p className="text-xs mt-1">{(error as Error).message}</p>
                        </div>
                    )}

                    {results && !isLoading && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-xl border ${results.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'} flex items-start gap-3`}>
                                {results.isValid ? <CheckCircle className="text-emerald-500 mt-0.5" size={20} /> : <AlertCircle className="text-red-500 mt-0.5" size={20} />}
                                <div>
                                    <h3 className="font-bold">{results.isValid ? 'Mẫu hợp lệ' : 'Mẫu chưa chuẩn xác'}</h3>
                                    {results.validationErrors && results.validationErrors.length > 0 && (
                                        <ul className="list-disc ml-5 mt-2 text-sm text-red-700 space-y-1">
                                            {results.validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 text-lg">Mẫu thử nghiệm đã sinh ({results.samples?.length || 0})</h3>
                                {results.samples?.map((sample, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">Câu {idx + 1}</span>
                                            {sample.calculatedDifficulty && (
                                                <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                                                    Độ khó: {sample.calculatedDifficulty}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-4 text-slate-800 font-medium">
                                            {sample.questionText}
                                        </div>

                                        {sample.options && Object.keys(sample.options).length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                {Object.entries(sample.options).map(([key, val]) => (
                                                    <div key={key} className={`p-3 rounded-lg border text-sm flex gap-3 ${sample.correctAnswer === key ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                                                        <span className={`font-bold ${sample.correctAnswer === key ? 'text-emerald-700' : 'text-slate-500'}`}>{key}.</span>
                                                        <span className={sample.correctAnswer === key ? 'text-emerald-900 font-medium' : 'text-slate-700'}>{val}</span>
                                                        {sample.correctAnswer === key && <CheckCircle size={16} className="text-emerald-500 ml-auto" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {sample.answerCalculation && (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 text-sm">
                                                <span className="font-bold text-slate-700 block mb-1">Công thức tính toán:</span>
                                                <code className="text-indigo-600 block bg-indigo-50/50 p-2 rounded">{sample.answerCalculation}</code>
                                            </div>
                                        )}

                                        {sample.explanation && (
                                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm">
                                                <span className="font-bold text-blue-800 flex items-center gap-1.5 mb-1"><Play size={14} className="rotate-90 text-blue-500" /> Giải thích (AI Generated):</span>
                                                <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">{sample.explanation}</p>
                                            </div>
                                        )}

                                        {sample.usedParameters && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
                                                Tham số random: {JSON.stringify(sample.usedParameters)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};
