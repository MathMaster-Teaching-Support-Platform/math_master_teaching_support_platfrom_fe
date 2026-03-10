import React, { useState, useRef } from 'react';
import { useImportTemplateFromFile } from '../../hooks/useQuestionTemplate';
import { type TemplateDraft } from '../../types/questionTemplate';
import { X, UploadCloud, File, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface TemplateImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (draft: TemplateDraft) => void;
}

export const TemplateImportModal: React.FC<TemplateImportModalProps> = ({
    isOpen,
    onClose,
    onUseTemplate,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [subjectHint, setSubjectHint] = useState('');
    const [contextHint, setContextHint] = useState('');

    const importMutation = useImportTemplateFromFile();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        importMutation.mutate({ file: selectedFile, subjectHint, contextHint });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const resetState = () => {
        setSelectedFile(null);
        setSubjectHint('');
        setContextHint('');
        importMutation.reset();
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const result = importMutation.data?.result;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-10 px-4 pb-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Import từ File (AI Phân tích)</h2>
                        <p className="text-sm text-slate-500 mt-1">Tải lên file PDF, Word, Txt chứa câu hỏi để AI nhận diện cấu trúc</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                    {!result ? (
                        <div className="space-y-6">

                            <div
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                                    ${selectedFile ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
                                `}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".txt,.pdf,.doc,.docx"
                                />

                                {selectedFile ? (
                                    <>
                                        <File className="text-indigo-500 mb-3" size={40} />
                                        <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        <p className="text-xs text-indigo-600 font-medium mt-2">Nhấn hoặc kéo file khác để thay đổi</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="text-slate-400 mb-3" size={40} />
                                        <p className="font-semibold text-slate-700">Kéo thả file vào đây hoặc nhấn để chọn</p>
                                        <p className="text-xs text-slate-500 mt-1">Hỗ trợ: PDF (.pdf), Word (.docx), Văn bản (.txt). Tối đa: 10MB</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Môn học (Gợi ý cho AI)</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        value={subjectHint}
                                        onChange={(e) => setSubjectHint(e.target.value)}
                                        placeholder="Ví dụ: Toán 9, Đại số, Hình học..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bối cảnh/Đề mục (Tuỳ chọn)</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        value={contextHint}
                                        onChange={(e) => setContextHint(e.target.value)}
                                        placeholder="Ví dụ: Chương 2 Hệ phương trình bậc nhất..."
                                    />
                                </div>
                            </div>

                            {importMutation.isError && (
                                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex gap-2 items-start">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>Lỗi khi import: {(importMutation.error as Error).message}</span>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className={`p-4 rounded-xl border flex items-start gap-3
                                ${result.analysisSuccessful ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}
                            `}>
                                {result.analysisSuccessful ? (
                                    <CheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={20} />
                                ) : (
                                    <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
                                )}
                                <div>
                                    <h3 className={`font-bold ${result.analysisSuccessful ? 'text-emerald-800' : 'text-amber-800'}`}>
                                        {result.analysisSuccessful ? 'Phân tích thành công' : 'Phân tích có cảnh báo'}
                                    </h3>
                                    {result.confidenceScore && (
                                        <p className="text-sm text-slate-600 mt-1">Độ tự tin của AI: <strong>{result.confidenceScore}%</strong></p>
                                    )}
                                    {result.warnings && result.warnings.length > 0 && (
                                        <ul className="list-disc ml-5 mt-2 text-sm text-amber-700 space-y-1">
                                            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {result.suggestedTemplate && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                                        Mẫu được gợi ý
                                        <span className="text-xs font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200">
                                            {result.suggestedTemplate.templateType}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Tên mẫu</p>
                                            <p className="text-sm text-slate-800 mt-1 font-medium">{result.suggestedTemplate.name || 'Không xác định'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Nội dung JSON gốc</p>
                                            <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-700 mt-1 overflow-x-auto">
                                                <pre>{JSON.stringify(result.suggestedTemplate.templateText, null, 2)}</pre>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Tham số nhận diện</p>
                                            <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-indigo-700 mt-1 overflow-x-auto">
                                                <pre>{JSON.stringify(result.suggestedTemplate.parameters, null, 2)}</pre>
                                            </div>
                                        </div>
                                        {result.suggestedTemplate.answerFormula && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Công thức đáp án</p>
                                                <p className="bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100 text-sm font-mono mt-1">
                                                    {result.suggestedTemplate.answerFormula}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0 bg-slate-50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors"
                        disabled={importMutation.isPending}
                    >
                        Hủy
                    </button>

                    {!result ? (
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || importMutation.isPending}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {importMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                            {importMutation.isPending ? 'Đang phân tích...' : 'Tải lên & Phân tích'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={resetState}
                                className="px-5 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                            >
                                Chọn file khác
                            </button>
                            <button
                                onClick={() => {
                                    if (result.suggestedTemplate) onUseTemplate(result.suggestedTemplate);
                                }}
                                disabled={!result.suggestedTemplate}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <FileText size={16} />
                                Sử dụng mẫu này
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
