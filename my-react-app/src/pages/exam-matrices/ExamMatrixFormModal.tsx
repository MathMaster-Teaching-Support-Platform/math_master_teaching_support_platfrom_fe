import { FileText, LayoutGrid, Loader2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { PartConfigSection } from '../../components/exam-matrix/PartConfigSection';
import type { ExamMatrixRequest, ExamMatrixResponse } from '../../types/examMatrix';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ExamMatrixResponse | null;
  onClose: () => void;
  onSubmit: (data: ExamMatrixRequest) => Promise<void>;
};

const inputCls =
  'w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]';

const labelCls = 'font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]';

export function ExamMatrixFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [formData, setFormData] = useState<
    ExamMatrixRequest & { numberOfParts?: number }
  >({
    name: '',
    description: '',
    isReusable: false,
    numberOfParts: 1,
    parts: [{ partNumber: 1, questionType: 'MULTIPLE_CHOICE', name: 'Phần 1: Trắc nghiệm' }],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initialParts = (initialData as { parts?: ExamMatrixResponse['parts'] })?.parts ?? [
      { partNumber: 1, questionType: 'MULTIPLE_CHOICE' as const, name: 'Phần 1: Trắc nghiệm' },
    ];

    setFormData({
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      isReusable: initialData?.isReusable ?? false,
      totalQuestionsTarget: initialData?.totalQuestionsTarget,
      totalPointsTarget: initialData?.totalPointsTarget,
      numberOfParts: initialParts.length,
      parts: initialParts,
    });
    setError(null);
    setSaving(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = formData.name.trim();
    if (!normalizedName) {
      setError('Tên ma trận là bắt buộc.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === 'create') {
        await onSubmit({
          name: normalizedName,
          parts: formData.parts,
        });
      } else {
        await onSubmit({
          ...formData,
          name: normalizedName,
          description: formData.description?.trim() || undefined,
          parts: formData.parts,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu ma trận');
    } finally {
      setSaving(false);
    }
  }

  const isCreate = mode === 'create';
  const submitLabel = isCreate ? 'Tạo ma trận' : 'Cập nhật';

  return (
    <div className="fixed inset-0 z-[1200] bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#E8E6DC]"
        style={{ width: 'min(560px, 100%)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-matrix-form-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isCreate ? 'bg-[#EEF2FF] text-[#4F7EF7]' : 'bg-[#F5F3FF] text-[#9B6FE0]'
              }`}
            >
              {isCreate ? <LayoutGrid size={17} /> : <FileText size={17} />}
            </div>
            <div className="min-w-0">
              <h3
                id="exam-matrix-form-title"
                className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] m-0"
              >
                {isCreate ? 'Tạo ma trận đề' : 'Chỉnh sửa ma trận đề'}
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] m-0 mt-0.5">
                {isCreate
                  ? 'Chỉ cần đặt tên — cột phân bố sẽ thêm trong trang chi tiết.'
                  : 'Cập nhật thông tin và mục tiêu của ma trận.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl border border-[#E8E6DC] bg-white text-[#5E5D59] hover:bg-[#F5F4ED] flex items-center justify-center shrink-0 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4 flex-1">
            {error && (
              <div
                className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 font-[Be_Vietnam_Pro] text-[13px] text-[#B53333]"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="emf-name" className={labelCls}>
                Tên ma trận <span className="text-red-600">*</span>
              </label>
              <input
                id="emf-name"
                className={inputCls}
                required
                placeholder="VD: Ma trận Toán lớp 10 – Chương 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            <PartConfigSection
              value={formData.parts || []}
              onChange={(parts) => setFormData({ ...formData, parts, numberOfParts: parts.length })}
              disabled={saving}
            />

            {mode === 'edit' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="emf-desc" className={labelCls}>
                    Mô tả
                  </label>
                  <textarea
                    id="emf-desc"
                    className={`${inputCls} resize-y min-h-[5rem]`}
                    rows={3}
                    placeholder="Mô tả ngắn về phạm vi, mục tiêu của ma trận..."
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] hover:bg-[#F5F4ED] transition-colors has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200">
                  <input
                    type="checkbox"
                    checked={formData.isReusable ?? false}
                    onChange={(e) => setFormData({ ...formData, isReusable: e.target.checked })}
                    className="rounded border-[#E8E6DC] text-[#C96442] focus:ring-[#C96442]"
                  />
                  <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] font-medium">
                    Cho phép tái sử dụng
                  </span>
                  <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">
                    (chia sẻ với giáo viên khác)
                  </span>
                </label>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#F0EEE6] bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 min-w-[110px] px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Đang lưu...
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
