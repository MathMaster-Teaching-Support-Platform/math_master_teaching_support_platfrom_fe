import { FileText, LayoutGrid, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExamMatrixRequest, ExamMatrixResponse } from '../../types/examMatrix';
// ✅ NEW: Import hook to fetch question banks
import { useSearchQuestionBanks } from '../../hooks/useQuestionBank';
import type { QuestionBankResponse } from '../../types/questionBank';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ExamMatrixResponse | null;
  onClose: () => void;
  onSubmit: (data: ExamMatrixRequest) => Promise<void>;
};

const Spinner = () => (
  <span
    style={{
      display: 'inline-block',
      width: '1rem',
      height: '1rem',
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'emf-spin 0.75s linear infinite',
      flexShrink: 0,
    }}
    aria-hidden="true"
  />
);

export function ExamMatrixFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [formData, setFormData] = useState<ExamMatrixRequest & { numberOfParts?: number; questionBankId?: string }>({
    name: '',
    description: '',
    isReusable: false,
    numberOfParts: 1,  // NEW: Default to 1 part (MCQ only)
    questionBankId: undefined,  // ✅ NEW: Matrix owns ONE bank
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ NEW: Fetch question banks for selector
  const { data: banksData, isLoading: isLoadingBanks } = useSearchQuestionBanks(
    {
      mineOnly: true,
      page: 0,
      size: 100,
      sortBy: 'updatedAt',
      sortDirection: 'DESC',
    },
    isOpen
  );
  const banks = banksData?.result?.content ?? [];

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      isReusable: initialData?.isReusable ?? false,
      totalQuestionsTarget: initialData?.totalQuestionsTarget,
      totalPointsTarget: initialData?.totalPointsTarget,
      numberOfParts: (initialData as any)?.numberOfParts ?? 1,  // NEW
      questionBankId: (initialData as any)?.questionBankId ?? undefined,  // ✅ NEW
    });
    setError(null);
    setSaving(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
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
        // ✅ FIXED: Include numberOfParts and questionBankId in create payload
        await onSubmit({
          name: normalizedName,
          numberOfParts: formData.numberOfParts ?? 1,
          questionBankId: formData.questionBankId || undefined,
        } as any);  // Type assertion needed because numberOfParts is not in base ExamMatrixRequest
      } else {
        await onSubmit({
          ...formData,
          name: normalizedName,
          description: formData.description?.trim() || undefined,
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
  const submitLabel = isCreate ? 'Tạo draft' : 'Cập nhật';

  return (
    <>
      {/* Keyframe injected once via style tag */}
      <style>{`@keyframes emf-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="modal-layer">
        <div className="modal-card" style={{ width: 'min(560px, 100%)' }}>
          {/* ── Header ── */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: isCreate ? '#eff6ff' : '#f5f3ff',
                  color: isCreate ? '#1d4ed8' : '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isCreate ? <LayoutGrid size={17} /> : <FileText size={17} />}
              </span>
              <div>
                <h3
                  style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--mod-ink)' }}
                >
                  {isCreate ? 'Tạo draft ma trận đề' : 'Chỉnh sửa ma trận đề'}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: 'var(--mod-muted, #64748b)',
                    marginTop: 2,
                  }}
                >
                  {isCreate
                    ? 'Chỉ cần đặt tên — cột phân bố sẽ thêm trong trang chi tiết.'
                    : 'Cập nhật thông tin và mục tiêu của ma trận.'}
                </p>
              </div>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Đóng">
              <X size={15} />
            </button>
          </div>

          {/* ── Body ── */}
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && (
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: 8,
                    color: '#be123c',
                    fontSize: '0.83rem',
                    fontWeight: 500,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label
                  htmlFor="emf-name"
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mod-ink)' }}
                >
                  Tên ma trận <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <input
                  id="emf-name"
                  className="input"
                  required
                  placeholder="VD: Ma trận Toán lớp 10 – Chương 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              {/* ✅ MOVED: Number of Parts Toggle - NOW VISIBLE IN BOTH CREATE AND EDIT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mod-ink)' }}
                >
                  Số phần đề
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, numberOfParts: num })}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.8rem',
                        borderRadius: 8,
                        border: '2px solid',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        backgroundColor:
                          formData.numberOfParts === num ? '#1d4ed8' : 'transparent',
                        borderColor:
                          formData.numberOfParts === num ? '#1d4ed8' : '#cbd5e1',
                        color: formData.numberOfParts === num ? '#fff' : '#64748b',
                      }}
                    >
                      {num === 1 ? '① MCQ' : num === 2 ? '② TF' : '③ SA'}
                    </button>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--mod-muted, #64748b)',
                    margin: '0.3rem 0 0 0',
                  }}
                >
                  {formData.numberOfParts === 1
                    ? 'Phần I: Trắc nghiệm (MCQ)'
                    : formData.numberOfParts === 2
                      ? 'Phần I: Trắc nghiệm (MCQ) + Phần II: Đúng/Sai (TF)'
                      : 'Phần I: Trắc nghiệm (MCQ) + Phần II: Đúng/Sai (TF) + Phần III: Tự luận ngắn (SA)'}
                </p>
              </div>

              {/* ✅ NEW: Question Bank Selector - OPTIONAL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label
                  htmlFor="emf-bank"
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mod-ink)' }}
                >
                  Ngân hàng câu hỏi
                </label>
                <select
                  id="emf-bank"
                  className="select"
                  value={formData.questionBankId ?? ''}
                  onChange={(e) => setFormData({ ...formData, questionBankId: e.target.value || undefined })}
                  disabled={isLoadingBanks}
                >
                  <option value="">Không chọn ngân hàng</option>
                  {banks.map((bank: QuestionBankResponse) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.questionCount ?? 0} câu)
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--mod-muted, #64748b)',
                    margin: '0.3rem 0 0 0',
                  }}
                >
                  Tùy chọn: Liên kết ma trận với một ngân hàng câu hỏi cụ thể
                </p>
              </div>

              {/* Edit-only fields */}
              {mode === 'edit' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label
                      htmlFor="emf-desc"
                      style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mod-ink)' }}
                    >
                      Mô tả
                    </label>
                    <textarea
                      id="emf-desc"
                      className="textarea"
                      rows={3}
                      placeholder="Mô tả ngắn về phạm vi, mục tiêu của ma trận..."
                      value={formData.description ?? ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid var(--mod-slate-100)',
                      background: formData.isReusable ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isReusable ?? false}
                      onChange={(e) => setFormData({ ...formData, isReusable: e.target.checked })}
                      style={{ accentColor: '#16a34a', width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--mod-ink)' }}>
                      Cho phép tái sử dụng
                    </span>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--mod-muted, #64748b)',
                        marginLeft: 2,
                      }}
                    >
                      (chia sẻ với giáo viên khác)
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={onClose} disabled={saving}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 110 }}
              >
                {saving ? (
                  <>
                    <Spinner />
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
    </>
  );
}
