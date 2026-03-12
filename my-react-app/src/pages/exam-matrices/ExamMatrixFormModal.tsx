import React, { useEffect, useState } from 'react';
import type { ExamMatrixResponse } from '../../types/examMatrix';
import type { ExamMatrixRequest } from '../../types/examMatrix';
import { X } from 'lucide-react';

interface ExamMatrixFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ExamMatrixRequest) => Promise<void>;
    mode: 'create' | 'edit';
    initialData?: ExamMatrixResponse | null;
}

export const ExamMatrixFormModal: React.FC<ExamMatrixFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    mode,
    initialData,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isReusable, setIsReusable] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name ?? '');
            setDescription(initialData?.description ?? '');
            setIsReusable(initialData?.isReusable ?? false);
            setError(null);
            setSubmitting(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('Tên ma trận không được để trống.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({ name: name.trim(), description: description.trim() || undefined, isReusable });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {mode === 'create' ? 'Tạo Ma Trận Đề Mới' : 'Chỉnh Sửa Ma Trận Đề'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 bg-slate-50/50">
                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tên Ma Trận <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="VD: Ma trận đề kiểm tra 15p Chương 1"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Mô tả mục tiêu, phạm vi kiến thức của ma trận..."
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={isReusable}
                            onChange={e => setIsReusable(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">
                                Cho phép tái sử dụng
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">
                                Áp dụng template này cho nhiều đề kiểm tra khác nhau
                            </span>
                        </div>
                    </label>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            {submitting
                                ? 'Đang lưu...'
                                : mode === 'create'
                                ? 'Tạo Ma Trận'
                                : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
