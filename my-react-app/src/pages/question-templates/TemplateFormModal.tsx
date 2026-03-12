import React, { useState, useEffect } from 'react';
import {
    type QuestionTemplateRequest,
    type QuestionTemplateResponse,
    QuestionType,
    CognitiveLevel
} from '../../types/questionTemplate';
import { X, Loader2, Plus, Trash2, Settings2, Sigma, ListChecks, Target, FileText } from 'lucide-react';

interface TemplateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: QuestionTemplateRequest) => Promise<void>;
    initialData?: QuestionTemplateResponse | null;
    mode: 'create' | 'edit';
}

interface ParameterInput {
    name: string;
    type: string;
    min: string;
    max: string;
}

interface OptionInput {
    key: string;
    formula: string;
}

interface DifficultyRuleInput {
    level: string;
    condition: string;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}) => {
    // Basic Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [templateType, setTemplateType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
    const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.UNDERSTAND);
    const [isPublic, setIsPublic] = useState(false);
    const [templateText, setTemplateText] = useState('');
    const [answerFormula, setAnswerFormula] = useState('');
    const [tagsText, setTagsText] = useState('');

    // Dynamic Lists State
    const [parameters, setParameters] = useState<ParameterInput[]>([]);
    const [options, setOptions] = useState<OptionInput[]>([]);
    const [difficultyRules, setDifficultyRules] = useState<DifficultyRuleInput[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setName(initialData.name || '');
                setDescription(initialData.description || '');
                setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
                setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.UNDERSTAND);
                setIsPublic(initialData.isPublic || false);
                setTemplateText(initialData.templateText?.vi || initialData.templateText?.en || '');
                setAnswerFormula(initialData.answerFormula || '');
                setTagsText((initialData.tags || []).join(', '));

                // Parse Parameters
                const parsedParams: ParameterInput[] = [];
                if (initialData.parameters) {
                    Object.entries(initialData.parameters).forEach(([key, val]: [string, { type?: string; min?: number; max?: number }]) => {
                        parsedParams.push({
                            name: key,
                            type: val.type || 'int',
                            min: val.min?.toString() || '1',
                            max: val.max?.toString() || '10'
                        });
                    });
                }
                setParameters(parsedParams.length > 0 ? parsedParams : [{ name: 'x', type: 'int', min: '1', max: '10' }]);

                // Parse Options
                const parsedOptions: OptionInput[] = [];
                if (initialData.optionsGenerator) {
                    Object.entries(initialData.optionsGenerator).forEach(([key, val]: [string, string]) => {
                        parsedOptions.push({ key, formula: val });
                    });
                }
                setOptions(parsedOptions.length > 0 ? parsedOptions : [
                    { key: 'A', formula: '' },
                    { key: 'B', formula: '' },
                    { key: 'C', formula: '' },
                    { key: 'D', formula: '' }
                ]);

                // Parse Difficulty Rules
                const parsedDifficulty: DifficultyRuleInput[] = [];
                if (initialData.difficultyRules) {
                    Object.entries(initialData.difficultyRules).forEach(([key, val]: [string, string]) => {
                        parsedDifficulty.push({ level: key, condition: val });
                    });
                }
                setDifficultyRules(parsedDifficulty.length > 0 ? parsedDifficulty : [{ level: 'EASY', condition: '' }]);

            } else {
                // Default Create State
                setName('');
                setDescription('');
                setTemplateType(QuestionType.MULTIPLE_CHOICE);
                setCognitiveLevel(CognitiveLevel.UNDERSTAND);
                setIsPublic(false);
                setTemplateText('Giải phương trình: {a}x + {b} = 0');
                setAnswerFormula('(-b)/a');
                setTagsText('Đại số, Lớp 9');
                setParameters([
                    { name: 'a', type: 'int', min: '1', max: '10' },
                    { name: 'b', type: 'int', min: '-10', max: '10' }
                ]);
                setOptions([
                    { key: 'A', formula: '(-b)/a' },
                    { key: 'B', formula: 'b/a' },
                    { key: 'C', formula: 'a/b' },
                    { key: 'D', formula: '(-a)/b' }
                ]);
                setDifficultyRules([
                    { level: 'EASY', condition: 'a < 5 && b < 5' }
                ]);
            }
        }
    }, [isOpen, initialData, mode]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Reconstruct JSON structures from visual builders
            const finalParameters: Record<string, { type: string; min: number; max: number }> = {};
            parameters.forEach(p => {
                if (p.name.trim()) {
                    finalParameters[p.name.trim()] = {
                        type: p.type,
                        min: p.type === 'int' ? parseInt(p.min) : parseFloat(p.min),
                        max: p.type === 'int' ? parseInt(p.max) : parseFloat(p.max),
                    };
                }
            });

            const finalOptions: Record<string, string> = {};
            options.forEach(o => {
                if (o.key.trim() && o.formula.trim()) {
                    finalOptions[o.key.trim()] = o.formula.trim();
                }
            });

            const finalDifficulty: Record<string, string> = {};
            difficultyRules.forEach(d => {
                if (d.level.trim() && d.condition.trim()) {
                    finalDifficulty[d.level.trim()] = d.condition.trim();
                }
            });

            const requestData: QuestionTemplateRequest = {
                name,
                description,
                templateType,
                cognitiveLevel,
                isPublic,
                templateText: { "vi": templateText },
                parameters: finalParameters,
                answerFormula,
                optionsGenerator: Object.keys(finalOptions).length > 0 ? finalOptions : undefined,
                difficultyRules: Object.keys(finalDifficulty).length > 0 ? (finalDifficulty as Record<string, unknown>) : ({} as Record<string, unknown>),
                tags: tagsText.split(',').map(t => t.trim()).filter(Boolean)
            };

            await onSubmit(requestData);
            onClose();
        } catch (error) {
            console.error('Lỗi khi submit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper functions for dynamic lists
    const addParameter = () => setParameters([...parameters, { name: '', type: 'int', min: '1', max: '10' }]);
    const updateParameter = (index: number, field: keyof ParameterInput, value: string) => {
        const newParams = [...parameters];
        newParams[index][field] = value;
        setParameters(newParams);
    };
    const removeParameter = (index: number) => setParameters(parameters.filter((_, i) => i !== index));

    const addOption = () => setOptions([...options, { key: '', formula: '' }]);
    const updateOption = (index: number, field: keyof OptionInput, value: string) => {
        const newOpts = [...options];
        newOpts[index][field] = value;
        setOptions(newOpts);
    };
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

    const addDifficultyRule = () => setDifficultyRules([...difficultyRules, { level: 'HARD', condition: '' }]);
    const updateDifficultyRule = (index: number, field: keyof DifficultyRuleInput, value: string) => {
        const newRules = [...difficultyRules];
        newRules[index][field] = value;
        setDifficultyRules(newRules);
    };
    const removeDifficultyRule = (index: number) => setDifficultyRules(difficultyRules.filter((_, i) => i !== index));


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Settings2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {mode === 'create' ? 'Tạo mẫu câu hỏi mới' : 'Chỉnh sửa mẫu câu hỏi'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Cấu hình tham số và thuật toán sinh câu hỏi tự động</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
                    <form id="template-form" onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* Section 1: Basic Info */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
                                <FileText size={18} className="text-indigo-500" />
                                Thông tin cơ bản
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên mẫu câu hỏi <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ví dụ: Phương trình bậc hai dạng ax^2+bx+c=0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại câu hỏi</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        value={templateType}
                                        onChange={(e) => setTemplateType(e.target.value as QuestionType)}
                                    >
                                        <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                                        <option value="TRUE_FALSE">Đúng/Sai</option>
                                        <option value="SHORT_ANSWER">Trả lời ngắn</option>
                                        <option value="ESSAY">Tự luận</option>
                                        <option value="CODING">Lập trình</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mức độ nhận thức</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        value={cognitiveLevel}
                                        onChange={(e) => setCognitiveLevel(e.target.value as CognitiveLevel)}
                                    >
                                        <option value="REMEMBER">Nhận biết</option>
                                        <option value="UNDERSTAND">Thông hiểu</option>
                                        <option value="APPLY">Vận dụng</option>
                                        <option value="ANALYZE">Phân tích</option>
                                        <option value="EVALUATE">Đánh giá</option>
                                        <option value="CREATE">Sáng tạo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả (tuỳ chọn)</label>
                                    <textarea
                                        rows={2}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ghi chú về mẫu câu hỏi này..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ khóa (Tags)</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        value={tagsText}
                                        onChange={(e) => setTagsText(e.target.value)}
                                        placeholder="Ví dụ: Toán 9, Đại số, Phương trình (Cách nhau bằng dấu phẩy)"
                                    />
                                </div>

                                <div className="md:col-span-2 pt-2">
                                    <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors w-max">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                                        />
                                        <div>
                                            <span className="font-bold block text-slate-800">Công khai mẫu câu hỏi</span>
                                            <span className="text-slate-500 text-xs">Cho phép giáo viên khác tìm thấy và sử dụng mẫu này</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Question Structure */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2 border-b pb-3">
                                <Sigma size={18} className="text-purple-500" />
                                Cấu trúc & Thuật toán
                            </h3>

                            {/* Tham số */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-bold text-slate-700">1. Khai báo Biến số (Tham số động)</label>
                                    <button type="button" onClick={addParameter} className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors">
                                        <Plus size={14} /> Thêm biến
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {parameters.map((param, index) => (
                                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex-1 min-w-[100px]">
                                                <input placeholder="Tên biến (a, b, x)" value={param.name} onChange={(e) => updateParameter(index, 'name', e.target.value)} className="w-full border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 border" required />
                                            </div>
                                            <div className="w-full md:w-32">
                                                <select value={param.type} onChange={(e) => updateParameter(index, 'type', e.target.value)} className="w-full border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 border bg-white">
                                                    <option value="int">Số nguyên</option>
                                                    <option value="float">Số thực</option>
                                                </select>
                                            </div>
                                            <div className="w-full md:w-24">
                                                <input type="number" placeholder="Min" value={param.min} onChange={(e) => updateParameter(index, 'min', e.target.value)} className="w-full border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 border" required />
                                            </div>
                                            <div className="w-full md:w-24">
                                                <input type="number" placeholder="Max" value={param.max} onChange={(e) => updateParameter(index, 'max', e.target.value)} className="w-full border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 border" required />
                                            </div>
                                            <button type="button" onClick={() => removeParameter(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {parameters.length === 0 && <p className="text-sm text-slate-500 italic p-3 text-center border border-dashed rounded-xl">Chưa có biến số nào được tạo.</p>}
                                </div>
                            </div>

                            {/* Nội dung câu hỏi */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-1">2. Nội dung hiển thị (Đề bài) <span className="text-red-500">*</span></label>
                                <p className="text-xs text-slate-500 mb-2">Sử dụng dấu ngoặc nhọn <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{"{tên_biến}"}</code> để chèn biến số vào nội dung.</p>
                                <textarea
                                    rows={3}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-medium leading-relaxed"
                                    value={templateText}
                                    onChange={(e) => setTemplateText(e.target.value)}
                                    placeholder="Giải phương trình: {a}x + {b} = 0"
                                />
                            </div>

                            {/* Công thức đáp án */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-1">3. Thuật toán tính đáp án chính xác <span className="text-red-500">*</span></label>
                                <p className="text-xs text-slate-500 mb-2">Nhập công thức toán học sử dụng các biến số. (Hỗ trợ <code className="bg-slate-100 px-1 py-0.5 rounded">Math.src</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Math.pow</code>, vv...)</p>
                                <input
                                    required
                                    className="w-full bg-emerald-50/50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                    value={answerFormula}
                                    onChange={(e) => setAnswerFormula(e.target.value)}
                                    placeholder="Ví dụ: (-b + Math.sqrt(b*b - 4*a*c)) / (2*a)"
                                />
                            </div>

                        </div>

                        {/* Section 3: Options & Rules */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Trắc nghiệm Option Generator */}
                            {(templateType === 'MULTIPLE_CHOICE' || templateType === 'TRUE_FALSE') && (
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center mb-2 border-b pb-3">
                                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                            <ListChecks size={18} className="text-blue-500" />
                                            Tạo Đáp án (Trắc nghiệm)
                                        </h3>
                                        <button type="button" onClick={addOption} className="text-xs font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors">
                                            <Plus size={14} /> Thêm
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                        {options.map((opt, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                                <input value={opt.key} onChange={(e) => updateOption(index, 'key', e.target.value)} className="w-12 text-center font-bold border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-blue-500 border uppercase" placeholder="A" />
                                                <span className="text-slate-400 font-bold">:</span>
                                                <input value={opt.formula} onChange={(e) => updateOption(index, 'formula', e.target.value)} className="flex-1 border-slate-300 rounded-md px-3 py-1.5 text-sm font-mono focus:ring-blue-500 border" placeholder="Công thức nhiễu (Ví dụ: b/a)" />
                                                <button type="button" onClick={() => removeOption(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rules */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center mb-2 border-b pb-3">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Target size={18} className="text-amber-500" />
                                        Luật độ khó
                                    </h3>
                                    <button type="button" onClick={addDifficultyRule} className="text-xs font-semibold px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition-colors">
                                        <Plus size={14} /> Thêm
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {difficultyRules.map((rule, index) => (
                                        <div key={index} className="flex flex-col gap-2 bg-amber-50/30 p-3 rounded-xl border border-amber-100">
                                            <div className="flex gap-2 items-center">
                                                <select value={rule.level} onChange={(e) => updateDifficultyRule(index, 'level', e.target.value)} className="w-1/3 border-slate-300 rounded-md px-2 py-1.5 text-sm font-bold text-amber-900 border bg-white focus:ring-amber-500">
                                                    <option value="EASY">DỄ (EASY)</option>
                                                    <option value="NORMAL">TB (NORMAL)</option>
                                                    <option value="HARD">KHÓ (HARD)</option>
                                                </select>
                                                <button type="button" onClick={() => removeDifficultyRule(index)} className="p-1.5 ml-auto text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <input value={rule.condition} onChange={(e) => updateDifficultyRule(index, 'condition', e.target.value)} className="w-full border-slate-300 rounded-md px-3 py-1.5 text-sm font-mono focus:ring-amber-500 border bg-white" placeholder="Điều kiện (Ví dụ: a < 5 && b < 5)" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex gap-4 justify-end flex-shrink-0 bg-white rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="template-form"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {isSubmitting ? 'Đang lưu...' : (mode === 'create' ? 'Tạo mẫu mới' : 'Lưu thay đổi')}
                    </button>
                </div>
            </div>

            <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 10px;
            }
            `}</style>
        </div>
    );
};
