import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useGenerateQuestions } from '../../hooks/useQuestionTemplate';
import type { QuestionTemplateResponse } from '../../types/questionTemplate';

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
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateQuestions();

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!Number.isFinite(count) || count < 1) {
      setError('Số lượng câu hỏi phải ≥ 1.');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        id: template.id,
        count,
        avoidDuplicates,
      });

      const total = response.result?.totalGenerated ?? 0;
      const warnings = response.result?.warnings ?? [];
      const warnSuffix = warnings.length ? ` (cảnh báo: ${warnings.length})` : '';
      onGenerated(`Đã tạo ${total}/${count} câu hỏi vào hàng chờ duyệt${warnSuffix}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo câu hỏi.');
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(560px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Sinh câu hỏi từ mẫu</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {template.name}
            </p>
          </div>
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
              <span>Tránh trùng biến số đã dùng (giúp đa dạng hơn)</span>
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
              Câu hỏi sau khi tạo sẽ ở trạng thái <strong>Chờ duyệt</strong>. Bạn cần
              duyệt lại trước khi sử dụng.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Huỷ
            </button>
            <button
              type="submit"
              className="btn"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                'Đang tạo…'
              ) : (
                <>
                  <Sparkles size={14} style={{ marginRight: 6 }} />
                  Tạo câu hỏi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateGenerateModal;
