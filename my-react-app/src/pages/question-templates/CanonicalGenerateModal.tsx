import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import MathText from '../../components/common/MathText';
import {
  useGenerateQuestionsFromCanonical,
  useGetCanonicalQuestionById,
} from '../../hooks/useCanonicalQuestion';
import type { QuestionTemplateResponse } from '../../types/questionTemplate';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  canonicalId: string;
  templates: QuestionTemplateResponse[];
  onGenerated: (message: string) => void;
};

export function CanonicalGenerateModal({
  isOpen,
  onClose,
  canonicalId,
  templates,
  onGenerated,
}: Readonly<Props>) {
  const [templateId, setTemplateId] = useState('');
  const [count, setCount] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateQuestionsFromCanonical();
  const canonicalDetailQuery = useGetCanonicalQuestionById(
    canonicalId,
    isOpen && Boolean(canonicalId)
  );

  useEffect(() => {
    if (!isOpen) return;
    setTemplateId((prev) => prev || templates[0]?.id || '');
    setError(null);
  }, [isOpen, templates]);

  if (!isOpen) return null;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setError(null);

    if (!templateId) {
      setError('TemplateId la bat buoc cho canonical flow.');
      return;
    }

    if (!Number.isFinite(count) || count < 1) {
      setError('Count bat buoc va phai >= 1.');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        canonicalId,
        request: {
          templateId,
          count,
        },
      });

      const totalGenerated = response.result?.totalGenerated ?? 0;
      onGenerated(`Da sinh ${totalGenerated} câu hỏi theo canonical flow.`);
      onClose();
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Khong the sinh câu hỏi tu canonical flow.'
      );
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Generate From Canonical</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chon template de bind parameter va sinh câu hỏi theo canonical.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {error && (
              <div className="empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Template
              </p>
              <select
                className="select"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                <option value="">Chon template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Count
              </p>
              <input
                className="input"
                type="number"
                min={1}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
            </label>

            {canonicalDetailQuery.data?.result && (
              <div className="data-card" style={{ minHeight: 0 }}>
                <h3>Preview canonical question</h3>
                <p>
                  <MathText text={canonicalDetailQuery.data.result.problemText} />
                </p>
                <p className="muted" style={{ marginTop: 8 }}>
                  Solution:
                </p>
                <div className="preview-box">
                  <MathText text={canonicalDetailQuery.data.result.solutionSteps} />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Dong
            </button>
            <button type="submit" className="btn" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Dang sinh...' : 'Sinh câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
