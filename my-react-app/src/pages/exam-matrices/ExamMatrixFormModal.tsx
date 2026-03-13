import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ExamMatrixRequest, ExamMatrixResponse } from '../../types/examMatrix';

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
    const [formData, setFormData] = useState<ExamMatrixRequest>({
        name: '',
        description: '',
        isReusable: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setFormData({
            name: initialData?.name ?? '',
            description: initialData?.description ?? '',
            isReusable: initialData?.isReusable ?? false,
            totalQuestionsTarget: initialData?.totalQuestionsTarget,
            totalPointsTarget: initialData?.totalPointsTarget,
        });
        setSubmitting(false);
        setError(null);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                ...formData,
                name: formData.name.trim(),
                description: formData.description?.trim() || undefined,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lưu ma trận đề.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">
                        {mode === 'create' ? 'Tạo ma trận đề mới' : 'Chỉnh sửa ma trận đề'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tên ma trận *</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                        <textarea
                            rows={3}
                            value={formData.description ?? ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng câu mục tiêu</label>
                            <input
                                type="number"
                                min={1}
                                value={formData.totalQuestionsTarget ?? ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        totalQuestionsTarget: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng điểm mục tiêu</label>
                            <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={formData.totalPointsTarget ?? ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        totalPointsTarget: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={!!formData.isReusable}
                            onChange={(e) =>
                                setFormData({ ...formData, isReusable: e.target.checked })
                            }
                        />
                        Cho phép tái sử dụng
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                        >
                            {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
