import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useGenerateQuestions } from '../../hooks/useQuestionTemplate';
import type { QuestionTemplateResponse } from '../../types/questionTemplate';

/**
 * Generation modal for the unified Blueprint flow.
 *
 * Drops the legacy PARAMETRIC vs AI_FROM_CANONICAL toggle — every generation
 * now reads the Blueprint and selects values via the constraint-aware AI
 * selector. The teacher controls only count, distinctness, and an optional
 * free-text hint forwarded into the value-selection prompt.
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  template: QuestionTemplateResponse;
  onGenerated: (message: string) => void;
};

export function TemplateGenerateModal({
  isOpen,
  onClose,
  template,
  onGenerated,
}: Readonly<Props>) {
  const [count, setCount] = useState(5);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [distinctnessHint, setDistinctnessHint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateQuestions();

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!Number.isFinite(count) || count < 1) {
      setError('Số lượng phải ≥ 1.');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        id: template.id,
        count,
        avoidDuplicates,
        distinctnessHint: distinctnessHint.trim() || undefined,
      });

      const total = response.result?.totalGenerated ?? 0;
      const warnings = response.result?.warnings ?? [];
      const warnSuffix = warnings.length ? ` (cảnh báo: ${warnings.length})` : '';
      onGenerated(`Đã sinh ${total}/${count} câu hỏi vào hàng đợi duyệt${warnSuffix}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể sinh câu hỏi từ template.');
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(560px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Sinh câu hỏi từ template</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {template.name}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
            {error && (
              <div className="empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Số lượng câu hỏi
              </p>
              <input
                className="input"
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>

            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={avoidDuplicates}
                onChange={(e) => setAvoidDuplicates(e.target.checked)}
              />
              <span className="muted">
                Bỏ qua bộ tham số đã được dùng (tránh trùng lặp)
              </span>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Gợi ý phân tán (tùy chọn)
              </p>
              <input
                className="input"
                placeholder="Ví dụ: thay đổi dấu của b, dùng số nguyên tố nhỏ"
                value={distinctnessHint}
                onChange={(e) => setDistinctnessHint(e.target.value)}
              />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Hint này được chuyển thẳng cho AI khi chọn giá trị tham số. Bỏ trống
                nếu bạn không có yêu cầu cụ thể.
              </p>
            </label>

            <div
              style={{
                padding: '10px 12px',
                background: '#eff6ff',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                fontSize: '0.85rem',
                color: '#1e3a8a',
              }}
            >
              Câu hỏi được sinh sẽ ở trạng thái <strong>UNDER_REVIEW</strong>. Sau
              khi sinh xong bạn sẽ được chuyển đến hàng đợi duyệt để phê duyệt
              từng câu.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Đóng
            </button>
            <button
              type="submit"
              className="btn"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                'Đang sinh…'
              ) : (
                <>
                  <Sparkles size={14} style={{ marginRight: 6 }} />
                  Sinh câu hỏi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
